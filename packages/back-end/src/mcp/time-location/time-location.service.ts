import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TimeLocationService {
  private readonly logger = new Logger(TimeLocationService.name);

  // 定义工具元数据
  private readonly tools = [
    {
      name: 'get_current_time',
      description: '获取当前服务器的时间和日期',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_server_location',
      description: '获取服务器所在的地理位置信息',
      inputSchema: { type: 'object', properties: {} },
    },
  ];

  handleRequest(method: string, params: any) {
    this.logger.log(`Handling request method: ${method}`);

    // 1. 【关键修复】处理 initialize 握手请求
    if (method === 'initialize') {
      return {
        protocolVersion: '2024-11-05', // MCP 协议版本
        capabilities: {
          tools: {}, // 声明本服务端支持 tools 功能
        },
        serverInfo: {
          name: 'nest-mcp-server',
          version: '1.0.0',
        },
      };
    }

    // 2. 处理 initialized 通知（客户端收到 initialize 响应后发的通知，服务端只需接收）
    if (method === 'notifications/initialized') {
      this.logger.log('MCP Connection fully established');
      return null;
    }

    // 3. 处理 ping
    if (method === 'ping') {
      return { status: 'ok', timestamp: Date.now() };
    }

    // 4. 处理 tools/list
    if (method === 'tools/list') {
      return { tools: this.tools };
    }

    // 5. 处理具体的工具调用 tools/call
    if (method === 'tools/call') {
      return this.executeTool(params.name, params.arguments);
    }

    throw new Error(`Method ${method} not found`);
  }

  private executeTool(name: string, args: any) {
    this.logger.log(`Executing tool: ${name}`, args);
    if (name === 'get_current_time') {
      return { content: [{ type: 'text', text: new Date().toISOString() }] };
    }
    if (name === 'get_server_location') {
      return { content: [{ type: 'text', text: 'Hunan, Changde' }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  handleNotification(method: string) {
    // 处理纯通知类请求
    if (method === 'notifications/initialized') {
      this.logger.log('Received initialized notification');
    }
  }
}
