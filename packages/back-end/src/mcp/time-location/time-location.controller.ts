import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { TimeLocationService } from './time-location.service';

@Controller('mcp/time-location')
export class TimeLocationController {
  private readonly logger = new Logger(TimeLocationController.name);

  constructor(private readonly timeLocationService: TimeLocationService) {}

  @Post()
  @HttpCode(200)
  handleMcpRequest(@Body() body: any) {
    try {
      // 记录原始请求，方便调试
      this.logger.log(`[MCP Request] Method: ${body.method}, ID: ${body.id}`);

      const isNotification = body.id === undefined || body.id === null;

      if (isNotification) {
        this.timeLocationService.handleNotification(body.method);
        // 修复 bind 错误：通知类型请求必须返回空对象，不能返回 undefined
        return {};
      }

      // 调用 Service 处理业务
      const result = this.timeLocationService.handleRequest(
        body.method,
        body.params || {},
      );

      // 返回标准 JSON-RPC 2.0 格式
      return {
        jsonrpc: '2.0',
        id: body.id,
        result: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[MCP Error] ${errorMessage}`);

      // 错误响应也必须符合 JSON-RPC 规范
      return {
        jsonrpc: '2.0',
        id: body?.id ?? null,
        error: {
          code: -32603, // Internal error
          message: errorMessage,
        },
      };
    }
  }
}
