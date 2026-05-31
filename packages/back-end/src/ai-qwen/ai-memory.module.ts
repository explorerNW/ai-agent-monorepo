import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AiMemoryService } from './ai-memory.service';
import { AiMemoryMiddleware } from './ai-memory.middleware';
import { MemoryConfig } from './memory.types';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Module({
  imports: [
    AiMemoryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          checkpointerType: 'postgres',
          shortTermWindow: 10,
          enableVectorRetrieval: true,
          postgresConnString: `postgresql://${configService.get('DB_USER')}:${configService.get('DB_PASSWORD')}@${configService.get('DB_HOST')}:${configService.get('DB_PORT')}/${configService.get('DB_NAME')}`,
          redisUrl: `redis://default:${configService.get('REDIS_PASS')}@${configService.get('REDIS_HOST')}:6379`,
          vectorTableName: 'long_term_memories',
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'EMBEDDINGS_MODEL', // 提供一个自定义的 Token
      useFactory: (configService: ConfigService) => {
        return new OpenAIEmbeddings({
          apiKey: configService.get<string>('DASHSCOPE_API_KEY'),
          configuration: {
            baseURL: configService.get<string>('OPENAI_BASE_URL'),
          },
          modelName: configService.get<string>('AI_EMBEDDING_MODEL_NAME'),
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AiMemoryModule implements NestModule {
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => MemoryConfig | Promise<MemoryConfig>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: AiMemoryModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'MEMORY_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        AiMemoryMiddleware,
        AiMemoryService,
      ],
      exports: [AiMemoryService, AiMemoryMiddleware],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AiMemoryMiddleware).forRoutes('ai/chat');
  }
}
