import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { MemorySaver } from '@langchain/langgraph';
import { RedisSaver } from '@langchain/langgraph-checkpoint-redis';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { RunnableConfig } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Pool } from 'pg';
import { AiMemoryContext, CheckpointerType } from './memory.types';

import type { MemoryConfig } from './memory.types';

@Injectable()
export class AiMemoryService implements OnModuleInit {
  private readonly logger = new Logger(AiMemoryService.name);
  private checkpointer: any;
  private vectorStore: PGVectorStore | null = null;

  private readonly windowSize: number;
  private readonly config: MemoryConfig;
  private pool: Pool;

  constructor(
    @Inject('MEMORY_CONFIG') config: MemoryConfig,
    @Inject('EMBEDDINGS_MODEL') private readonly embeddings: OpenAIEmbeddings,
  ) {
    this.config = config;
    this.windowSize = config.shortTermWindow || 10;
  }

  /**
   * 模块初始化方法，在模块加载时执行
   * 用于初始化短期记忆和长期记忆相关的组件
   * @throws {Error} 当初始化过程中发生错误时抛出
   */
  async onModuleInit() {
    try {
      // 1. 初始化短期记忆 Checkpointer
      // 使用配置文件中指定的checkpointerType进行初始化
      this.checkpointer = await this.initCheckpointer(
        this.config.checkpointerType,
      );

      // 2. 如果开启长期记忆，初始化向量库
      if (this.config.enableVectorRetrieval && this.config.postgresConnString) {
        this.pool = new Pool({
          connectionString: this.config.postgresConnString,
        });
        await this.pool.connect();

        this.vectorStore = await PGVectorStore.initialize(this.embeddings, {
          postgresConnectionOptions: {
            connectionString: this.config.postgresConnString,
          },
          tableName: this.config.vectorTableName || 'long_term_memories',
          columns: {
            idColumnName: 'id',
            vectorColumnName: 'embedding',
            contentColumnName: 'content',
            metadataColumnName: 'metadata',
          },
        });
        this.logger.log(
          'Successfully initialized Vector Store for Long-term Memory.',
        );
      }

      this.logger.log(
        `Successfully initialized ${this.config.checkpointerType} checkpointer.`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize memory modules:', error);
      throw error;
    }
  }

  private async initCheckpointer(type: CheckpointerType) {
    switch (type) {
      case 'redis': {
        const saver = RedisSaver.fromUrl(this.config.redisUrl!);
        return saver;
      }
      case 'postgres': {
        const saver = PostgresSaver.fromConnString(
          this.config.postgresConnString!,
        );
        await saver.setup();
        return saver;
      }
      default:
        return new MemorySaver();
    }
  }

  buildRunnableConfig(sessionId: string): RunnableConfig {
    return { configurable: { thread_id: sessionId } };
  }

  async getShortTermHistory(sessionId: string): Promise<BaseMessage[]> {
    const config = this.buildRunnableConfig(sessionId);
    try {
      const state = await this.checkpointer.getTuple(config);
      if (!state?.checkpoint?.channel_values?.messages) return [];
      const messages = state.checkpoint.channel_values
        .messages as BaseMessage[];
      return messages.slice(-this.windowSize * 2);
    } catch (error) {
      this.logger.error(
        `Failed to fetch short-term history for session ${sessionId}`,
        error,
      );
      return [];
    }
  }

  // --- 长期记忆核心逻辑开始 ---

  // 语义检索长期记忆 (Read)
  async getLongTermMemory(
    userId: string,
    currentQuery: string,
  ): Promise<any[]> {
    if (!this.config.enableVectorRetrieval || !this.vectorStore) return [];
    if (!currentQuery?.trim()) return [];

    try {
      // 通过 Metadata 过滤，确保只能检索到当前用户的记忆 (多租户隔离)
      const results = await this.vectorStore.similaritySearch(currentQuery, 3, {
        userId: userId,
      });
      return results.map((doc) => ({
        content: doc.pageContent,
        score: doc.metadata._distance, // 相似度得分
      }));
    } catch (error) {
      this.logger.error(
        `Failed to retrieve long-term memories for user: ${userId}`,
        error,
      );
      return [];
    }
  }

  // 异步存储长期记忆 (Write)
  // 注意：此方法不应在请求主链路中同步调用，建议由消息队列或后台任务触发
  async storeLongTermMemory(
    userId: string,
    importantFact: string,
  ): Promise<void> {
    if (!this.config.enableVectorRetrieval || !this.vectorStore) return;

    try {
      // 将重要的事实转化为向量并存入 PostgreSQL
      await this.vectorStore.addDocuments([
        {
          pageContent: importantFact,
          metadata: {
            userId: userId,
            createdAt: new Date().toISOString(),
          },
        },
      ]);
      this.logger.log(`Long-term memory stored for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to store long-term memory for user: ${userId}`,
        error,
      );
    }
  }

  // --- 长期记忆核心逻辑结束 ---

  async extractContext(
    sessionId: string,
    userId: string,
    query: string,
  ): Promise<AiMemoryContext> {
    const [history, longTerm] = await Promise.all([
      this.getShortTermHistory(sessionId),
      this.getLongTermMemory(userId, query),
    ]);

    return {
      sessionId,
      userId,
      historyMessages: history,
      longTermMemories: longTerm,
    };
  }
}
