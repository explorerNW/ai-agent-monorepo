import { Controller, Get } from '@nestjs/common';
import { LlmService } from './llm/llm.service';

@Controller('ai')
export class AiController {
  constructor(private service: LlmService) {}
  @Get()
  async agentHandler(): Promise<any> {
    return this.service.agentHandler();
  }
}
