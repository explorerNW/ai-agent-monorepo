import { Module } from '@nestjs/common';
import { LlmService } from './llm/llm.service';
import { GraphService } from './graph/graph.service';
import { ToolsService } from './tools/tools.service';
import { MemoryService } from './memory/memory.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [LlmService, GraphService, ToolsService, MemoryService],
})
export class AiModule {}
