import { SetMetadata } from '@nestjs/common';
import { ZodTypeAny } from 'zod';

export const MCP_TOOL_METADATA = 'mcp_tool_metadata';
export const MCP_RESOURCE_METADATA = 'mcp_resource_metadata';
export const MCP_PROMPT_METADATA = 'mcp_prompt_metadata';

// 统一的 MCP 响应结构
export interface McpResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface McpToolOptions {
  name: string;
  description: string;
  inputSchema?: ZodTypeAny; // Zod 强类型校验
  allowEmptyParams?: boolean; // 开启后，LLM传空参或非法字符时自动兜底使用默认值
}

export interface McpResourceOptions {
  uriTemplate: string; // 例如 "file://{path}"
  name: string;
  description?: string;
}

export interface McpPromptOptions {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export function McpTool(options: McpToolOptions): MethodDecorator {
  return SetMetadata(MCP_TOOL_METADATA, options);
}

export function McpResource(options: McpResourceOptions): MethodDecorator {
  return SetMetadata(MCP_RESOURCE_METADATA, options);
}

export function McpPrompt(options: McpPromptOptions): MethodDecorator {
  return SetMetadata(MCP_PROMPT_METADATA, options);
}
