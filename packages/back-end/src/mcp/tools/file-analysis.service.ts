import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpTool } from '../dto/mcp.decorators';
import { OpenAI } from 'openai';

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
    const openai = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY, // 从环境变量读取
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });

    const messages: any[] = [
      {
        role: 'system',
        content:
          '你是一个代码分析专家。请仔细分析提供的代码，给出结构清晰、专业且可操作的反馈。',
      },
      {
        role: 'user',
        content: args.files
          .map((f) => f.content.replaceAll(' ', ''))
          .join('\n\n'),
      },
    ];
    const stream = await (openai.chat.completions as any).create({
      model: 'qwen3.6-27b',
      messages,
      stream: true,
      enable_thinking: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (!delta) continue;

      fullContent += delta;
    }

    return {
      content: [
        {
          type: 'text',
          text: fullContent.trim(),
        },
      ],
    };
  }
}
