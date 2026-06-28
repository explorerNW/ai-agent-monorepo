import { tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { createAgent } from 'langchain';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { HumanMessage } from '@langchain/core/messages';
import {
  handleToolErrors,
  trimMessageHistory,
  validateResponse,
} from '../middleware';

interface GetLonLat {
  status: string;
  msg: string;
  location: {
    lon: string;
    lat: string;
  };
}

@Injectable()
export class WeatherAgentService implements OnModuleInit {
  private readonly logger = new Logger(WeatherAgentService.name);
  agent;
  constructor() {}
  async onModuleInit() {
    try {
      const axiosInstance = axios.create({
        baseURL: process.env.DIFY_BASE_URL,
        headers: {
          Authorization: `Bearer ${process.env.DIFY_WEATHER_WORKFLOW_KEY}`,
        },
      });
      const weather = tool(
        async ({ city }: { city: string }, config) => {
          this.logger.log('userName---->', config?.context?.user_name);
          try {
            const res = await axiosInstance.post<{
              data: { outputs: { weather_content: string } };
            }>(`/workflows/run`, {
              inputs: { city },
              user: uuidv4(),
            });

            const content = res.data?.data?.outputs?.weather_content;
            if (!content) {
              this.logger.warn(
                `⚠️ [Tool] Dify 返回空数据: ${JSON.stringify(res.data)}`,
              );
              // ✅ 返回明确的结构化失败信息，阻止模型盲目重试
              return JSON.stringify({
                success: false,
                error: 'Dify workflow returned empty content',
                raw: res.data,
              });
            }

            this.logger.log(`✅ [Tool] 查询成功: ${city}`);
            return JSON.stringify({ success: true, weather: content });
          } catch (err: any) {
            this.logger.error(`❌ [Tool] 请求异常: ${err.message}`, err.stack);
            // ✅ 明确告知模型不要再试了
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

      // 创建一个检查点保存器 - 放在数据库
      const DB_URI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}?sslmode=disable`;
      const checkpointerDB = PostgresSaver.fromConnString(DB_URI);
      await checkpointerDB.setup();

      // const contextSchema = z.object({
      //   user_name: z.string().optional(),
      // });

      const model = new ChatOpenAI({
        modelName: process.env.LLM_MODEL, // 从环境变量读取模型名称
        apiKey: process.env.LLM_API_KEY, // 使用 DashScope 兼容接口
        configuration: {
          baseURL: process.env.LLM_BASE_URL,
        },
        temperature: 0.3,
        maxTokens: 1024,
        streaming: true, // 🔥 关键：开启流式输出模式
      });
      const bindToolModel = model.bindTools([weather], {
        strict: true,
        tool_choice: weather.name,
      });
      this.agent = createAgent({
        model: bindToolModel,
        tools: [weather],
        middleware: [trimMessageHistory, validateResponse, handleToolErrors],
        checkpointer: checkpointerDB,
        // contextSchema,
      });
    } catch (error) {
      this.logger.error('err---->', error);
    }
  }

  async fetchLonLat(city: string) {
    return await axios
      .get<GetLonLat>(
        `http://api.tianditu.gov.cn/geocoder?ds={"keyWord":${city}}&tk=${process.env.TIAN_DITU_API_KEY}`,
      )
      .then((res) => res.data.location);
  }

  async getWeather(city: string) {
    return await this.agent
      .invoke(
        {
          messages: [new HumanMessage(`${city}，天气怎么样?`)],
        },
        {
          configurable: {
            thread_id: 'get-weather-test-1',
            context: {
              user_name: 'explorernw',
            },
          },
          callbacks: [
            {
              // handleLLMStart: (llm) => {
              //   // 打印出 LangGraph 实际发给大模型的完整参数
              //   this.logger.log(
              //     '🔥 实际发给大模型的参数:',
              //     JSON.stringify(llm),
              //   );
              // },
              // handleChainStart: (chain) => {
              //   // 打印出 LangGraph 触发的 chain 参数
              //   this.logger.log('🔥 触发的 chain 参数:', JSON.stringify(chain));
              // },
              handleToolStart: (tool) => {
                // 打印出 LangGraph 触发的 tool 参数
                this.logger.log('🔥 触发的 tool 参数:', JSON.stringify(tool));
              },
            },
          ],
        },
      )
      .then((res) => {
        return res.messages.map((message) => {
          return message.content;
        });
      });
  }
}
