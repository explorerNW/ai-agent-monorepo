import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { McpController } from './mcp.controller';
import { McpAuthGuard } from './auth.guard';
import { TimeLocationMcpModule } from './time-location/time-location.module';
import { FileAnalysisService } from './tools/file-analysis.service';

@Module({
  imports: [DiscoveryModule, TimeLocationMcpModule],
  controllers: [McpController],
  providers: [McpAuthGuard, FileAnalysisService],
})
export class McpModule {}
