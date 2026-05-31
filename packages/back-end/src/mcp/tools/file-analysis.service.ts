import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpTool } from '../dto/mcp.decorators';

@Injectable()
export class FileAnalysisService {
  @McpTool({
    name: 'analyze_selected_files',
    description:
      '分析用户在编辑器中选中的文件或代码片段。当用户要求审查、重构或解释当前代码时调用此工具。',
    inputSchema: z.object({
      files: z
        .array(
          z.object({
            filePath: z.string().describe('文件的相对或绝对路径'),
            content: z.string().describe('用户选中或附加的文件完整内容'),
          }),
        )
        .min(1)
        .describe('用户在上下文中附加的一个或多个文件列表'),
      userInstruction: z
        .string()
        .optional()
        .describe('用户对这段代码的具体提问或指令'),
    }),
  })
  async analyzeSelectedFiles(args: {
    files: Array<{ filePath: string; content: string }>;
    userInstruction?: string;
  }) {
    // 在这里处理业务逻辑
    const summary = args.files
      .map((f) => `- ${f.filePath} (${f.content.length} chars)`)
      .join('\n');

    return Promise.resolve({
      content: [
        {
          type: 'text',
          text: `成功接收到 ${args.files.length} 个文件:\n${summary}\n\n用户指令: ${args.userInstruction || '无'}`,
        },
      ],
    });
  }
}
