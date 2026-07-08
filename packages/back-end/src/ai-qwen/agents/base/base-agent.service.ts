import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableConfig } from '@langchain/core/runnables';
import { BaseCheckpointSaver } from '@langchain/langgraph';
import { createAgent } from 'langchain';
import { LLM_PROVIDERS } from '../../core/llm/llm.tokens';
import { CHECKPOINTER } from '../../core/memory/checkpointer.tokens';
import {
  AgentDeps,
  AgentInput,
  AgentInvokeContext,
} from '../../core/types/agent-context.types';

export abstract class BaseAgentService implements OnModuleInit {
  protected agent!: Awaited<ReturnType<typeof createAgent>>;
  protected abstract readonly name: string;
  protected abstract buildAgent(deps: AgentDeps): Promise<typeof this.agent>;

  protected readonly logger: Logger;

  constructor(
    @Inject(CHECKPOINTER) protected readonly checkpointer: BaseCheckpointSaver,
    @Inject(LLM_PROVIDERS.CHAT_DEFAULT) protected readonly model: ChatOpenAI,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async onModuleInit() {
    this.agent = await this.buildAgent({
      model: this.model,
      checkpointer: this.checkpointer,
    });
    this.logger.log(`Agent [${this.name}] initialized`);
  }

  /**
   * 构建运行配置
   * @param ctx 代理调用上下文，包含会话ID、用户ID和元数据
   * @returns 包含线程配置、用户标识和回调处理器的运行配置
   */
  buildConfig(
    ctx: AgentInvokeContext,
  ): RunnableConfig & { context: Record<string, unknown> } {
    return {
      configurable: {
        thread_id: ctx.sessionId,
        user_id: ctx.userId,
      },
      context: ctx.metadata ?? {},
      callbacks: [
        {
          handleToolStart: (tool) => {
            this.logger.log(`Tool invoked: ${JSON.stringify(tool)}`);
          },
        },
      ],
    };
  }

  async invoke(input: AgentInput, ctx: AgentInvokeContext) {
    return this.agent.invoke(input, this.buildConfig(ctx));
  }
}
