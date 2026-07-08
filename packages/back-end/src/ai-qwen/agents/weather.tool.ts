import { tool } from '@langchain/core/tools';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';

@Injectable()
export class WeatherToolFactory {
  private readonly logger = new Logger(WeatherToolFactory.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get('DIFY_BASE_URL'),
      headers: {
        Authorization: `Bearer ${this.configService.get('DIFY_WEATHER_WORKFLOW_KEY')}`,
      },
    });
  }

  create() {
    return tool(
      async ({ city }: { city: string }) => {
        try {
          const res = await this.axiosInstance.post<{
            data: { outputs: { weather_content: string } };
          }>(`/workflows/run`, {
            inputs: { city },
            user: uuidv4(),
          });

          const content = res.data?.data?.outputs?.weather_content;
          if (!content) {
            this.logger.warn(
              `[Tool] Dify returned empty content: ${JSON.stringify(res.data)}`,
            );
            return JSON.stringify({
              success: false,
              error: 'Dify workflow returned empty content',
              raw: res.data,
            });
          }

          this.logger.log(`[Tool] Weather query succeeded: ${city}`);
          return JSON.stringify({ success: true, weather: content });
        } catch (err: any) {
          this.logger.error(`[Tool] Request failed: ${err.message}`, err.stack);
          return JSON.stringify({
            success: false,
            error: `API request failed: ${err.message}. DO NOT retry this tool.`,
          });
        }
      },
      {
        name: 'weather_data',
        description:
          '获取指定城市的实时天气数据。当用户询问某个城市天气时必须调用此工具。',
        schema: z.object({
          city: z
            .string()
            .describe('需要查询天气的城市名称，例如：北京、上海、汉寿'),
        }),
      },
    );
  }
}
