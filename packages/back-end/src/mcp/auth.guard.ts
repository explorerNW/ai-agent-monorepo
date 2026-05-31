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
    // 从 Header 中提取 API Key
    const apiKey = request.headers['x-mcp-api-key'];

    if (!apiKey || apiKey !== process.env.MCP_SECRET_KEY) {
      throw new UnauthorizedException('Invalid MCP API Key');
    }
    return true;
  }
}
