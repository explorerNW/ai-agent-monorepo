import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { AiMemoryService } from './ai-memory.service';
import { LLM_PROVIDERS } from './core/llm/llm.tokens';

@Injectable()
export class AiService {
  private logger = new Logger(AiService.name);
  constructor(
    private readonly memoryService: AiMemoryService,
    @Inject(LLM_PROVIDERS.CHAT_DEFAULT) private readonly model: ChatOpenAI,
  ) {}

  // 流式对话方法，接收前端传来的消息数组和一个回调函数
  async streamChat(
    messages: { role: string; content: string }[],
    onToken: (token: string) => void,
    context: { userId: string; sessionId: string },
  ) {
    try {
      // 将前端消息转换为 LangChain 的消息格式
      const langchainMessages: BaseMessage[] = messages.map((msg) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else if (msg.role === 'assistant' || msg.role === 'ai') {
          return new AIMessage(msg.content);
        } else {
          // 默认作为人类消息处理
          return new HumanMessage(msg.content);
        }
      });

      // 提取用户ID，用于长期记忆
      await this.memoryService.storeLongTermMemory(
        context.userId,
        messages
          .map((message) => `${message.role}:${message.content}`)
          .join(','),
      );

      // 调用模型并流式输出
      const stream = await this.model.stream(langchainMessages);
      for await (const chunk of stream) {
        onToken(chunk.content as string); // 每生成一段内容,通过回调传给 Controller
      }
    } catch (error) {
      this.logger.error('Error in streamChat:', error);
      throw error;
    }
  }
}
