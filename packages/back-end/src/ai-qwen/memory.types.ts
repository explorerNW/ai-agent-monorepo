import { BaseMessage } from '@langchain/core/messages';

export type CheckpointerType = 'memory' | 'redis' | 'postgres';

export interface MemoryConfig {
  checkpointerType: CheckpointerType;
  shortTermWindow?: number;
  enableVectorRetrieval?: boolean;
  maxTokensBeforeSummary?: number;

  // 数据库连接配置
  redisUrl?: string;
  postgresConnString?: string;

  // 向量库与 Embedding 配置
  embeddingModel?: 'openai' | 'local';
  vectorTableName?: string; // 向量表名，用于物理隔离不同业务的数据
}

export interface AiMemoryContext {
  sessionId: string;
  userId: string;
  historyMessages: BaseMessage[];
  longTermMemories?: any[];
}
