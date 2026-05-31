import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiMemoryModule } from './ai-memory.module';

@Module({
  imports: [
    AiMemoryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        checkpointerType: 'postgres',
        shortTermWindow: 10,
        enableVectorRetrieval: true,
        postgresConnString: `postgresql://${configService.get('DB_USER')}:${configService.get('DB_PASSWORD')}@${configService.get('DB_HOST')}:${configService.get('DB_PORT')}/${configService.get('DB_NAME')}`,
        redisUrl: `redis://${configService.get('REDIS_PASSWORD')}@${configService.get('REDIS_HOST')}:6379`,
        vectorTableName: 'long_term_memories',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
