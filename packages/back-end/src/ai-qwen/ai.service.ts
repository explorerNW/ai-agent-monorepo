import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { AiMemoryService } from './ai-memory.service';

@Injectable()
export class AiService {
  private logger = new Logger(AiService.name);
  constructor(private readonly memoryService: AiMemoryService) {}
  // 初始化大模型，这里可以使用 OpenAI、通义千问等兼容 OpenAI 协议的模型
  private chatModel = new ChatOpenAI({
    modelName: process.env.AI_MODEL_NAME, // 从环境变量读取模型名称
    apiKey: process.env.DASHSCOPE_API_KEY, // 使用 DashScope 兼容接口
    configuration: {
      baseURL: process.env.AI_BASE_URL, // 替换为你使用的模型服务商地址
    },
    temperature: 0.7,
    streaming: true, // 🔥 关键：开启流式输出模式
  });

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
      const stream = await this.chatModel.stream(langchainMessages);
      for await (const chunk of stream) {
        onToken(chunk.content as string); // 每生成一段内容,通过回调传给 Controller
      }
    } catch (error) {
      this.logger.error('Error in streamChat:', error);
      throw error;
    }
  }
}
