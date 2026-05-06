import { ChatOllama } from '@langchain/ollama';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

// 1. 初始化模型
const model: BaseChatModel = new ChatOllama({
  model: 'llama3.1',
  baseUrl: `http://${process.env.DIFY_API_KEY}:11434`, // 默认地址
  temperature: 0.7,
});

// 2. 定义提示词模板 (Prompt Template)
const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', '你是一个资深的前端工程师，擅长 React 和 NestJS。'],
  ['human', '{input}'],
]);

// 3. 构建链 (Chain) - 使用 LCEL (LangChain Expression Language)
// 流程：提示词 -> 模型 -> 输出解析
const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

export { chain };
