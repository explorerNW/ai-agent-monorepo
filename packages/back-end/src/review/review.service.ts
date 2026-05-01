import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import {
  GitHubWebhookPayload,
  DifyResponse,
  DifyFileUploadResponse,
} from '../types/dto';
import { Octokit } from '@octokit/rest';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly difyClient: AxiosInstance;
  private readonly githubClient: AxiosInstance;
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  private octokit: Octokit;

  constructor() {
    // 验证环境变量
    const difyBaseUrl = process.env.DIFY_BASE_URL;
    if (!difyBaseUrl) {
      throw new Error('DIFY_BASE_URL environment variable is not set');
    }

    const difyApiKey = process.env.DIFY_API_KEY;
    if (!difyApiKey) {
      throw new Error('DIFY_API_KEY environment variable is not set');
    }

    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }

    // 初始化 Dify 客户端
    this.difyClient = axios.create({
      method: 'post',
      baseURL: difyBaseUrl,
      headers: {
        Authorization: `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // 初始化 GitHub 客户端
    this.githubClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        // Fine-grained PAT 必须使用 'token' 前缀，不能使用 'Bearer'
        Authorization: `token ${githubToken}`,
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

    // 2. 只审查 PR 打开和更新的事件，忽略关闭、合并等事件
    const allowedActions = ['opened', 'synchronize', 'reopened'];
    if (!allowedActions.includes(payload.action)) {
      this.logger.log(`PR 动作 "${payload.action}" 不需要审查，跳过`);
      return;
    }

    const prNumber = payload.pull_request.number;
    const repoName = payload.repository.full_name;
    const diffUrl = payload.pull_request.diff_url;

    // 安全获取 head sha
    if (!payload.pull_request.head?.sha) {
      this.logger.error('无法获取 PR head SHA');
      return;
    }
    const headSha = payload.pull_request.head.sha;

    // 这一步会让 PR 页面显示一个黄色的"等待中"图标
    const [owner, repo] = repoName.split('/');

    const checkRun = await this.octokit.rest.checks.create({
      owner,
      repo,
      name: 'AI Code Review', // 这个名字要和分支保护规则里的一样
      head_sha: headSha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      output: {
        title: 'AI 正在审查代码...',
        summary: '请稍等，正在呼叫 Dify 进行分析。',
      },
    });

    this.logger.log(`开始审查 PR #${prNumber} in ${repoName}`);

    // 3. 创建 GitHub Status（显示为 pending 状态）
    await this.createStatus(repoName, headSha, 'pending', 'AI 代码审查中...');

    try {
      // 4. 获取代码变更 (Diff)
      const diffResponse: { data: string } = await axios.get(diffUrl, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      });
      const diffContent = diffResponse.data;

      if (!diffContent.trim()) {
        this.logger.log('Diff 为空，无需审查');
        await this.createStatus(
          repoName,
          headSha,
          'success',
          '✅ 没有代码变更需要审查',
        );
        return;
      }

      // 5. 调用 Dify 进行审查
      const reviewComment = await this.callDifyReview(diffContent);

      // 6. 将结果发布到 GitHub PR
      // await this.postGithubComment(repoName, prNumber, reviewComment);
      await this.octokit.rest.checks.update({
        owner,
        repo,
        check_run_id: checkRun.data.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        conclusion: 'success', // success / failure / neutral
        output: {
          title: '审查摘要',
          summary: '', // 审查摘要
          text: reviewComment, // 详细报告
        },
      });

      // 7. 更新 Status（根据审查结果设置状态）
      const state = this.determineStatus(reviewComment);
      await this.createStatus(repoName, headSha, state, reviewComment);

      this.logger.log(`✅ PR #${prNumber} 审查完成`);
    } catch (error) {
      // 如果审查过程中出错，标记 Status 为失败
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`审查过程出错: ${errorMessage}`);
      await this.createStatus(
        repoName,
        headSha,
        'failure',
        `❌ 审查过程出错: ${errorMessage}`,
      );
    }
  }

  /**
   * 创建/更新 GitHub Status
   */
  private async createStatus(
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
  ) {
    const [owner, repoName] = repo.split('/');

    try {
      await this.githubClient.post(
        `/repos/${owner}/${repoName}/statuses/${sha}`,
        {
          state: state,
          target_url: process.env.WEBHOOK_URL || '', // 可选：指向详细报告的链接
          description: description.substring(0, 140), // GitHub API 限制
          context: 'AI Code Review', // 状态检查的名称
        },
      );
      this.logger.log(`✅ 创建 Status 成功: ${state} - ${description}`);
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`创建 Status 失败: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 根据审查结果判断状态
   */
  private determineStatus(
    reviewComment: string,
  ): 'success' | 'failure' | 'error' {
    // 如果包含错误或警告关键词，标记为失败
    const failureKeywords = ['错误', '严重问题', 'critical', 'error', 'bug'];
    const hasIssues = failureKeywords.some((keyword) =>
      reviewComment.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (hasIssues) {
      return 'failure';
    }

    // 如果是服务不可用的提示，标记为错误
    if (reviewComment.includes('暂时不可用')) {
      return 'error';
    }

    // 默认为成功
    return 'success';
  }

  /**
   * 调用 Dify 工作流
   */
  private async callDifyReview(diff: string): Promise<string> {
    try {
      // 使用 Dify 的 Chat Messages API
      const fileId = await this.uploadDiffFile(diff);
      // 注意：根据错误提示，这是一个工作流应用，需要使用 inputs 传参
      const response = await this.difyClient.post('/chat-messages', {
        inputs: {
          upload_file_id: fileId, // 直接传递上传的文件 ID
        },
        files: [
          {
            type: 'document', // 文件类型，Dify 可能需要特定的类型
            transfer_method: 'local_file', // 指定使用上传方式
            upload_file_id: fileId, // 使用上传的文件 ID
          },
        ],
        query: '请审查以下代码变更', // 工作流也需要 query 字段
        response_mode: 'blocking', // 同步等待结果
        user: 'github-bot',
      });

      const data = response.data as DifyResponse;
      return data.answer;
    } catch (error) {
      // 提取关键错误信息
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`Dify 调用失败: ${errorMessage}`);
      return '⚠️ AI 审查服务暂时不可用，请稍后重试。';
    }
  }

  /**
   * 上传 diff 文件到 Dify
   */
  private async uploadDiffFile(diff: string): Promise<string> {
    try {
      // 将 diff 字符串转换为 Buffer
      const diffBuffer = Buffer.from(diff, 'utf-8');
      this.logger.log(`准备上传 diff 文件，大小: ${diffBuffer.length} bytes`);

      // 创建 FormData 用于文件上传（使用 form-data 包）
      const formData = new FormData();
      // 在 Node.js 中直接附加 Buffer，不需要转换为 Blob
      formData.append('file', diffBuffer, {
        filename: 'code-diff.txt',
        contentType: 'text/plain',
      });
      formData.append('user', 'github-bot');
      formData.append('type', 'TXT'); // 必须指定文件类型

      // 上传文件
      this.logger.log('正在上传文件到 Dify...');
      const response = await this.difyClient.post('/files/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        },
      });

      const uploadData = response.data as DifyFileUploadResponse;
      this.logger.log(
        `✅ 文件上传成功! file_id: ${uploadData.id}, 文件名: ${uploadData.name}`,
      );
      return uploadData.id;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`❌ 文件上传失败: ${errorMessage}`);
      throw new Error(`Failed to upload diff file: ${errorMessage}`);
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
      // 提取关键错误信息
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`GitHub API 调用失败: ${errorMessage}`);
    }
  }

  /**
   * 提取错误的关键信息
   */
  private extractErrorMessage(error: unknown): string {
    // 检查是否是 Axios 错误
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as Record<string, unknown>).response === 'object'
    ) {
      const errorRecord = error as Record<string, unknown>;
      const response = errorRecord.response as Record<string, unknown>;
      const config = errorRecord.config as Record<string, unknown> | undefined;

      const status = response?.status as number | undefined;
      const responseData = response?.data as
        | Record<string, unknown>
        | undefined;
      const message = responseData?.message as string | undefined;
      const url = config?.url as string | undefined;

      if (status && message) {
        return `[${status}] ${message}${url ? ` (URL: ${url})` : ''}`;
      }
      if (status) {
        return `HTTP ${status}${url ? ` for ${url}` : ''}`;
      }
    }

    // fallback: 返回错误消息或字符串表示
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
