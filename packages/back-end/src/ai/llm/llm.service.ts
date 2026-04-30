import { Injectable } from '@nestjs/common';
import { chain } from './utils';

@Injectable()
export class LlmService {
  async agentHandler(input?: string): Promise<any> {
    try {
      const userInput = input || '如何在 NestJS 中创建一个控制器？';
      const response = await chain.invoke({
        input: userInput,
      });
      return response;
    } catch (error) {
      console.error('LLM agent handler error:', error);
      throw new Error(
        `Failed to process LLM request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
