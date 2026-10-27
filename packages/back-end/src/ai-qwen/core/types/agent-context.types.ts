import type { BaseMessage } from '@langchain/core/messages';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { ChatOpenAI } from '@langchain/openai';

export interface AgentInvokeContext {
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentInput {
  messages: BaseMessage[];
}

export interface AgentDeps {
  model: ChatOpenAI;
  checkpointer: BaseCheckpointSaver;
}
