import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { LLM_PROVIDERS } from './llm.tokens';

@Module({})
export class LlmModule {
  static forRootAsync(): DynamicModule {
    return {
      module: LlmModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: LLM_PROVIDERS.CHAT_DEFAULT,
          useFactory: (configService: ConfigService) =>
            new ChatOpenAI({
              modelName: configService.get('LLM_MODEL'),
              apiKey: configService.get('LLM_API_KEY'),
              configuration: {
                baseURL: configService.get('LLM_BASE_URL'),
              },
              temperature: 0.3,
              maxTokens: 1024,
              streaming: true,
            }),
          inject: [ConfigService],
        },
      ],
      exports: [LLM_PROVIDERS.CHAT_DEFAULT],
    };
  }
}
