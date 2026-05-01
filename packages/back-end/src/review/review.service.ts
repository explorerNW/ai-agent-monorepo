import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { GitHubWebhookPayload, DifyResponse } from '../types/dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly difyClient: AxiosInstance;
  private readonly githubClient: AxiosInstance;

  constructor() {
    // 初始化 Dify 客户端
    this.difyClient = axios.create({
      baseURL: process.env.DIFY_BASE_URL,
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // 初始化 GitHub 客户端
    this.githubClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }

  /**
   * 主流程：处理 Webhook 事件
   */
  async handleWebhook(payload: GitHubWebhookPayload) {
    // 1. 只有 Pull Request 事件才触发审查 (也可以支持 Push 事件)
    if (!payload.pull_request) {
      this.logger.log('非 PR 事件，跳过');
      return;
    }

    const prNumber = payload.pull_request.number;
    const repoName = payload.repository.full_name;
    const diffUrl = payload.pull_request.diff_url;

    this.logger.log(`开始审查 PR #${prNumber} in ${repoName}`);

    // 2. 获取代码变更 (Diff)
    // 注意：这里直接下载 diff 文本，生产环境可能需要过滤大文件
    const diffResponse: { data: string } = await axios.get(diffUrl, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    });
    const diffContent = diffResponse.data;

    if (!diffContent.trim()) {
      this.logger.log('Diff 为空，无需审查');
      return;
    }

    // 3. 调用 Dify 进行审查
    const reviewComment = await this.callDifyReview(diffContent);

    // 4. 将结果发布到 GitHub PR
    await this.postGithubComment(repoName, prNumber, reviewComment);
  }

  /**
   * 调用 Dify 工作流
   */
  private async callDifyReview(diff: string): Promise<string> {
    try {
      // 使用 Dify 的 Chat Messages API
      const response = await this.difyClient.post('/chat-messages', {
        query: `请审查以下代码变更：\n\n${diff}`,
        response_mode: 'blocking', // 同步等待结果
        user: 'github-bot',
        // 如果是工作流应用，使用 inputs 传参；如果是聊天应用，用 query
      });

      const data = response.data as DifyResponse;
      return data.answer;
    } catch (error) {
      this.logger.error('Dify 调用失败', error);
      return '⚠️ AI 审查服务暂时不可用，请稍后重试。';
    }
  }

  /**
   * 发布 GitHub 评论
   */
  private async postGithubComment(
    repo: string,
    prNumber: number,
    body: string,
  ) {
    const [owner, repoName] = repo.split('/');

    try {
      await this.githubClient.post(
        `/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
        {
          body: `### 🤖 AI 代码审查报告\n\n${body}`,
        },
      );
      this.logger.log(`✅ 成功发布评论到 PR #${prNumber}`);
    } catch (error) {
      this.logger.error('GitHub API 调用失败', error);
    }
  }
}
