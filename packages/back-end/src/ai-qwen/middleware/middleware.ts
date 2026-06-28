import { RemoveMessage, ToolMessage } from '@langchain/core/messages';
import { REMOVE_ALL_MESSAGES } from '@langchain/langgraph';
import { createMiddleware, trimMessages } from 'langchain';

/**
 * 用于限制消息数量
 * 移除超出限制的消息，只保留最近的消息。
 */
export const trimMessageHistory = createMiddleware({
  name: 'TrimMessages',
  beforeModel: async (state) => {
    const trimmed = await trimMessages(state.messages, {
      maxTokens: 384,
      strategy: 'last',
      startOn: 'human',
      endOn: ['human', 'tool'],
      tokenCounter: (msgs) => msgs.length,
    });
    return {
      messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES }), ...trimmed],
    };
  },
});

/**
 * 用于验证响应内容
 * 捕获并处理可能的敏感信息泄露，例如包含 "confidential" 的消息。
 */
export const validateResponse = createMiddleware({
  name: 'ValidateResponse',
  afterModel: (state) => {
    const lastMessage = state.messages.at(-1)?.content;
    if (
      typeof lastMessage === 'string' &&
      lastMessage.toLowerCase().includes('confidential')
    ) {
      return {
        messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES })],
      };
    }
    return;
  },
});

/**
 * 用于处理工具错误
 * 捕获工具调用中的错误，并以 ToolMessage 形式返回一个包含错误的消息。
 */
export const handleToolErrors = createMiddleware({
  name: 'HandleToolErrors',
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      return new ToolMessage({
        content: `Tool error: Please check your input and try again. (${error})`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});
