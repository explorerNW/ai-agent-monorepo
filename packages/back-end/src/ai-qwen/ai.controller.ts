import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';

interface ChatDto {
  role: string;
  content: string;
}

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { messages: ChatDto[] }, @Res() res: Response) {
    // 🌊 设置 SSE 专用响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // 调用 Service，传入一个回调函数来接收 AI 生成的每一个 token
      await this.aiService.streamChat(body.messages, (token: string) => {
        // 将 token 写入响应流，前端就能实时接收到
        res.write(token);
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).write('Error occurred');
    } finally {
      res.end(); // 结束响应
    }
  }
}
