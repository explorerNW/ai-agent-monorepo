import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { McpTool } from './dto/mcp.decorators';

// 1. 独立 Schema 定义，便于复用与类型推导
const analyzeFilesSchema = z.object({
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
});

export type AnalyzeFilesInput = z.infer<typeof analyzeFilesSchema>;
export type McpTextResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

@Injectable()
export class FileAnalysisService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('DASHSCOPE_API_KEY');
    const baseURL = this.configService.get<string>('DASHSCOPE_BASE_URL');

    this.openai = new OpenAI({ apiKey, baseURL });
  }

  @McpTool({
    name: 'analyze_selected_files',
    description:
      '分析用户在编辑器中选中的文件或代码片段。当用户要求审查、重构或解释当前代码时调用此工具。',
    inputSchema: analyzeFilesSchema,
  })
  async analyzeSelectedFiles(
    args: AnalyzeFilesInput,
  ): Promise<McpTextResponse> {
    // 2. 结构化 Prompt，提升 LLM 上下文理解能力
    const fileBlocks = args.files
      .map((f) => `### 文件: ${f.filePath}\n\`\`\`\n${f.content}\n\`\`\``)
      .join('\n\n');

    const userContent = [
      args.userInstruction ? `### 用户指令\n${args.userInstruction}` : '',
      '### 代码内容\n',
      fileBlocks,
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          '你是一个代码分析专家。请仔细分析提供的代码，给出结构清晰、专业且可操作的反馈。',
      },
      { role: 'user', content: userContent },
    ];

    let fullContent = '';

    try {
      // 3. 流式调用与异常隔离
      const stream = await this.openai.chat.completions.create({
        model: 'qwen3.6-27b',
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) fullContent += delta;
      }
    } catch (error) {
      // 可接入 LoggerService 进行结构化日志记录
      console.error('[FileAnalysisService] LLM Stream Error:', error);
      throw new Error('代码分析服务调用失败，请检查网络或 API 配额。');
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: fullContent.trim() || '分析完成，但未返回有效内容。',
        },
      ],
    };
  }
}
