import { Inject, Injectable } from '@nestjs/common';
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { BaseCheckpointSaver } from '@langchain/langgraph';
import axios from 'axios';
import { createAgent } from 'langchain';
import * as z from 'zod';
import { BaseAgentService } from './base/base-agent.service';
import { WeatherToolFactory } from './weather.tool';
import {
  handleToolErrors,
  trimMessageHistory,
  validateResponse,
} from '../middleware';
import { LLM_PROVIDERS } from '../core/llm/llm.tokens';
import { CHECKPOINTER } from '../core/memory/checkpointer.tokens';
import {
  AgentDeps,
  AgentInvokeContext,
} from '../core/types/agent-context.types';

interface GetLonLat {
  status: string;
  msg: string;
  location: {
    lon: string;
    lat: string;
  };
}

@Injectable()
export class WeatherAgentService extends BaseAgentService {
  protected readonly name = 'weather';

  constructor(
    @Inject(CHECKPOINTER) checkpointer: BaseCheckpointSaver,
    @Inject(LLM_PROVIDERS.CHAT_DEFAULT) model: ChatOpenAI,
    private readonly weatherToolFactory: WeatherToolFactory,
  ) {
    super(checkpointer, model);
  }

  protected async buildAgent({ model, checkpointer }: AgentDeps) {
    return Promise.resolve(
      createAgent({
        model,
        tools: [this.weatherToolFactory.create()],
        middleware: [trimMessageHistory, validateResponse, handleToolErrors],
        checkpointer,
        contextSchema: z.object({
          user_name: z.string().optional(),
        }),
      }),
    );
  }

  async fetchLonLat(city: string) {
    return await axios
      .get<GetLonLat>(
        `http://api.tianditu.gov.cn/geocoder?ds={"keyWord":${city}}&tk=${process.env.TIAN_DITU_API_KEY}`,
      )
      .then((res) => res.data.location);
  }

  async getWeather(city: string, ctx?: Partial<AgentInvokeContext>) {
    const context: AgentInvokeContext = {
      sessionId: ctx?.sessionId ?? `weather-${city}`,
      userId: ctx?.userId,
      metadata: {
        user_name: 'anonymous',
        ...ctx?.metadata,
      },
    };

    const res = await this.invoke(
      { messages: [new HumanMessage(`${city}，天气怎么样?`)] },
      context,
    );

    return res.messages.map((message) => message.content);
  }
}
