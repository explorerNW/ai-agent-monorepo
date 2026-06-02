import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Logger,
  Req,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Observable, Subject, merge, interval } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  MCP_TOOL_METADATA,
  MCP_RESOURCE_METADATA,
  MCP_PROMPT_METADATA,
  McpToolOptions,
  McpResourceOptions,
  McpPromptOptions,
  McpResponse,
} from './dto/mcp.decorators';
import { McpAuthGuard } from './auth.guard';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { v4 as uuidv4 } from 'uuid';

@Controller('mcp')
@UseGuards(McpAuthGuard)
export class McpController {
  private readonly logger = new Logger(McpController.name);
  private toolsMap = new Map<string, any>();
  private resourcesMap = new Map<string, any>();
  private promptsMap = new Map<string, any>();
  private sseSubjects = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {
    this.scanAndRegisterProviders();
  }

  // 启动时扫描所有 Provider，自动收集带有 @Mcp* 装饰器的方法
  private scanAndRegisterProviders() {
    const providers = this.discoveryService.getProviders();
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (methodName) => {
          const methodRef = instance[methodName];

          const toolMeta = this.reflector.get<McpToolOptions>(
            MCP_TOOL_METADATA,
            methodRef,
          );
          if (toolMeta) {
            this.toolsMap.set(toolMeta.name, {
              handler: methodRef.bind(instance),
              options: toolMeta,
            });
            this.logger.log(`✅ MCP Tool Registered: ${toolMeta.name}`);
          }

          const resourceMeta = this.reflector.get<McpResourceOptions>(
            MCP_RESOURCE_METADATA,
            methodRef,
          );
          if (resourceMeta) {
            this.resourcesMap.set(resourceMeta.uriTemplate, {
              handler: methodRef.bind(instance),
              options: resourceMeta,
            });
          }

          const promptMeta = this.reflector.get<McpPromptOptions>(
            MCP_PROMPT_METADATA,
            methodRef,
          );
          if (promptMeta) {
            this.promptsMap.set(promptMeta.name, {
              handler: methodRef.bind(instance),
              options: promptMeta,
            });
          }
        },
      );
    }
  }

  @Sse()
  sse(@Req() req: Request): Observable<MessageEvent> {
    const sessionId = uuidv4();
    const subject = new Subject<MessageEvent>();

    this.sseSubjects.set(sessionId, subject);

    // 发送 session.created 事件，告知客户端 sessionId
    subject.next({
      data: JSON.stringify({ sessionId }),
      type: 'session.created',
    });

    // 客户端断开时清理
    req.on('close', () => {
      this.sseSubjects.delete(sessionId);
      subject.complete();
      this.logger.log(`SSE session closed: ${sessionId}`);
    });

    this.logger.log(`SSE session created: ${sessionId}`);

    // 合并 keepalive 心跳，防止代理/负载均衡器断开空闲连接
    const keepalive = interval(15000).pipe(
      map(() => ({ data: '' }) as any),
      takeUntil(subject),
    );

    return merge(subject.asObservable(), keepalive);
  }

  @Post()
  async handleJsonRpc(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { method, params, id } = body;
    const traceId = uuidv4(); // 生成唯一链路追踪ID
    const sessionId = (req.query as any).sessionId; // StreamableHTTP 客户端通过 query 传递 sessionId

    let response: any;

    try {
      if (method === 'initialize') {
        response = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              streaming: {},
            },
            serverInfo: { name: 'Enterprise-NestJS-MCP', version: '3.0.0' },
          },
        };
      } else if (method.endsWith('/list')) {
        const listResult: any[] = [];
        if (method === 'tools/list') {
          this.toolsMap.forEach((val) => {
            let inputSchema: any = { type: 'object', properties: {} };
            if (val.options.inputSchema) {
              const rawSchema = zodToJsonSchema(val.options.inputSchema);
              // MCP 协议要求 inputSchema.type 必须为 "object"，且不应包含 $schema 等额外字段
              const { ...rest } = rawSchema as any;
              inputSchema = { ...rest, type: 'object' };
            }
            listResult.push({
              name: val.options.name,
              description: val.options.description,
              inputSchema,
            });
          });
        } else if (method === 'resources/list') {
          this.resourcesMap.forEach((val) => {
            listResult.push({
              uriTemplate: val.options.uriTemplate,
              name: val.options.name,
              description: val.options.description,
            });
          });
        } else if (method === 'prompts/list') {
          this.promptsMap.forEach((val) => {
            listResult.push({
              name: val.options.name,
              description: val.options.description,
              arguments: val.options.arguments,
            });
          });
        }
        if (method === 'tools/list') {
          response = { jsonrpc: '2.0', id, result: { tools: listResult } };
        } else if (method === 'resources/list') {
          response = { jsonrpc: '2.0', id, result: { resources: listResult } };
        } else if (method === 'prompts/list') {
          response = { jsonrpc: '2.0', id, result: { prompts: listResult } };
        }
      } else if (method === 'notifications/initialized') {
        // StreamableHTTP 客户端在 initialize 后发送此通知
        // 根据 MCP StreamableHTTP 规范，通知类请求应返回 202 Accepted（无 body）
        this.logger.log(
          'MCP client initialized (via notifications/initialized)',
        );
        res.status(202).send();
        return;
      } else if (method === 'ping') {
        response = { jsonrpc: '2.0', id, result: {} };
      } else if (
        method === 'tools/call' ||
        method === 'resources/read' ||
        method === 'prompts/get'
      ) {
        let targetMap, handlerKey, args;

        if (method === 'tools/call') {
          targetMap = this.toolsMap;
          handlerKey = params.name;
          args = params.arguments || {};
        } else if (method === 'resources/read') {
          // 简单匹配 URI 前缀获取资源处理器
          const entry = Array.from(this.resourcesMap.entries()).find(([key]) =>
            params.uri.startsWith(key.split('{')[0]),
          );
          if (entry) {
            handlerKey = entry[0];
            targetMap = this.resourcesMap;
            args = params.uri;
          }
        } else {
          targetMap = this.promptsMap;
          handlerKey = params.name;
          args = params.arguments;
        }

        const target = targetMap?.get(handlerKey);
        if (!target) throw new Error(`Unknown entity: ${handlerKey}`);

        // 【防坑优化】Zod 参数校验与 LLM 幻觉兼容处理
        if (target.options && target.options.inputSchema) {
          try {
            args = target.options.inputSchema.parse(args);
          } catch (e: any) {
            if (
              target.options.allowEmptyParams &&
              (!args || Object.keys(args).length === 0)
            ) {
              this.logger.warn(
                `[${traceId}|${sessionId}] LLM passed invalid params to ${handlerKey}, using defaults.`,
              );
              args = {};
            } else {
              throw new Error(`Invalid arguments: ${e.message}`);
            }
          }
        }

        // 执行具体的业务逻辑并记录耗时
        const startTime = Date.now();
        const result: McpResponse = await target.handler(args);
        const duration = Date.now() - startTime;
        this.logger.log(
          `[${traceId}|${sessionId}] Executed ${method} (${handlerKey}) in ${duration}ms`,
        );

        response = { jsonrpc: '2.0', id, result };
      } else {
        response = {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found' },
        };
      }
    } catch (error: any) {
      this.logger.error(
        `[${traceId}|${sessionId}] MCP Error: ${error.message}`,
        error.stack,
      );
      // 捕获异常，返回标准化的错误文本给 AI，避免 AI 陷入死循环
      response = {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing action: ${error.message}. Please check your parameters and try again.`,
            },
          ],
          isError: true,
        },
      };
    }

    res.json(response);
  }
}
