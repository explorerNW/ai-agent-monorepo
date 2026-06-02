import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class McpAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // SSE 连接 (GET) 由 session.created 事件中的 sessionId 验证，不强制要求 header
    // 后续 POST 请求仍需要通过 API Key 验证
    if (request.method === 'GET') {
      return true;
    }

    // 从 Header 中提取 API Key
    const apiKey = request.headers['x-mcp-api-key'];

    if (!apiKey || apiKey !== process.env.MCP_SECRET_KEY) {
      throw new UnauthorizedException('Invalid MCP API Key');
    }
    return true;
  }
}
