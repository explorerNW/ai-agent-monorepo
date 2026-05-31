import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AiMemoryService } from './ai-memory.service';
import { AiMemoryContext } from './memory.types';

declare module 'express' {
  interface Request {
    user?: { id: string };
    aiMemoryContext?: AiMemoryContext;
  }
}

@Injectable()
export class AiMemoryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AiMemoryMiddleware.name);
  constructor(private readonly memoryService: AiMemoryService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id || 'anonymous';
    const sessionId =
      (req.headers['x-session-id'] as string) || req.body.sessionId;
    // 从 messages 数组中提取最后一条用户消息作为查询
    const userMessage =
      (Array.isArray(req.body.messages)
        ? req.body.messages.filter((m: any) => m.role === 'user').pop()
            ?.content || ''
        : '') || '';

    if (!sessionId) {
      return next();
    }

    try {
      req.aiMemoryContext = await this.memoryService.extractContext(
        sessionId,
        userId,
        userMessage,
      );
    } catch (error) {
      console.error('Memory extraction failed:', error);
      req.aiMemoryContext = {
        sessionId,
        userId,
        historyMessages: [],
        longTermMemories: [],
      };
    }

    next();
  }
}
