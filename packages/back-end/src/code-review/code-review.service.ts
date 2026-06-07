import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import pLimit from 'p-limit';
import {
  GitHubWebhookPayload,
  DifyResponse,
  DifyFileUploadResponse,
} from '../types/dto';

/**
 * Diff 切片结果
 */
export interface DiffChunk {
  fileName: string; // 文件名
  content: string; // diff 内容
  charCount: number; // 字符数
  hunkCount?: number; // 代码块数量
}

/**
 * Diff 清洗与切片配置
 */
const DIFF_CONFIG = {
  // 需要排除的文件扩展名和模式
  EXCLUDED_PATTERNS: [
    // 锁文件
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.lock',

    // 图片文件
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.svg',
    '.ico',
    '.webp',

    // 二进制文件
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.bin',
    '.zip',
    '.tar',
    '.gz',

    // 其他不需要审查的文件
    '.min.js',
    '.min.css',

    // 其他不需要审查的文件
    '.md',
  ],

  // 需要排除的目录
  EXCLUDED_DIRS: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '__pycache__/',
    '.git/',
    'vendor/',
  ],

  // 单个 diff 片段的最大字符数
  MAX_CHUNK_SIZE: 3000,

  // Hunk 分隔符（Git diff 格式）
  HUNK_HEADER_REGEX: /^@@ -\d+,\d+ \+\d+,\d+ @@/m,
};

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly difyClient: AxiosInstance;
  private readonly githubClient: AxiosInstance;

  constructor() {
    // 验证环境变量
    const difyBaseUrl = process.env.DIFY_BASE_URL;
    if (!difyBaseUrl) {
      throw new Error('DIFY_BASE_URL environment variable is not set');
    }

    // 初始化 Dify 客户端
    this.difyClient = axios.create({
      method: 'post',
      baseURL: difyBaseUrl,
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // 初始化 GitHub 客户端
    this.githubClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        // Fine-grained PAT 必须使用 'token' 前缀，不能使用 'Bearer'
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
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

    this.logger.log(`开始审查 PR #${prNumber} in ${repoName}`);

    // 3. 创建 GitHub Status（显示为 pending 状态）
    await this.createStatus(repoName, headSha, 'pending', 'AI 代码审查中...');

    try {
      // 4. 获取代码变更 (Diff)
      const diffResponse: { data: string } = await axios.get(diffUrl, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      });
      const rawDiffContent = diffResponse.data;

      if (!rawDiffContent.trim()) {
        this.logger.log('Diff 为空，无需审查');
        await this.createStatus(
          repoName,
          headSha,
          'success',
          '✅ 没有代码变更需要审查',
        );
        return;
      }

      // 5. 清洗和切片 Diff
      const diffChunks = this.cleanAndSliceDiff(rawDiffContent);

      if (diffChunks.length === 0) {
        this.logger.log('所有文件都被过滤，无需审查');
        await this.createStatus(
          repoName,
          headSha,
          'success',
          '✅ 没有需要审查的代码变更',
        );
        return;
      }

      this.logger.log(`Diff 已切分为 ${diffChunks.length} 个片段`);

      // 6. 对每个切片调用 Dify 进行审查
      const limit = pLimit(5); // 最多5个并发
      const reviewPromises = diffChunks.map((chunk, i) =>
        limit(async () => {
          this.logger.log(
            `正在审查片段 ${i + 1}/${diffChunks.length}: ${chunk.fileName} (${chunk.charCount} 字符)`,
          );
          const reviewComment = await this.callDifyReview(chunk.content);
          return `### 📄 ${chunk.fileName}\n\n${reviewComment}`;
        }),
      );

      const reviewResults = await Promise.all(reviewPromises);

      // 7. 合并所有审查结果
      const finalReviewComment = reviewResults.join('\n\n---\n\n');

      // 8. 将结果发布到 GitHub PR
      await this.postGithubComment(repoName, prNumber, finalReviewComment);

      // 9. 更新 Status（根据审查结果设置状态）
      const state = this.determineStatus(finalReviewComment);
      await this.createStatus(repoName, headSha, state, finalReviewComment);

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
   * 清洗和切片 Diff
   *
   * @param rawDiff 原始 diff 字符串
   * @returns 清洗后的 diff 切片数组
   */
  private cleanAndSliceDiff(rawDiff: string): DiffChunk[] {
    this.logger.log(`开始清洗 Diff，原始大小: ${rawDiff.length} 字符`);

    // 1. 按文件分割 diff
    const fileDiffs = this.splitDiffByFile(rawDiff);
    this.logger.log(`识别到 ${fileDiffs.length} 个文件变更`);

    // 2. 过滤无关文件
    const filteredFiles = fileDiffs.filter(({ fileName }) => {
      const shouldExclude = this.shouldExcludeFile(fileName);
      if (shouldExclude) {
        this.logger.debug(`排除文件: ${fileName}`);
      }
      return !shouldExclude;
    });

    this.logger.log(`过滤后剩余 ${filteredFiles.length} 个文件`);

    // 3. 对每个文件的 diff 进行切片
    const chunks: DiffChunk[] = [];
    for (const { fileName, content } of filteredFiles) {
      const fileChunks = this.sliceFileDiff(fileName, content);
      chunks.push(...fileChunks);
    }

    this.logger.log(`最终生成 ${chunks.length} 个审查片段`);
    return chunks;
  }

  /**
   * 按文件分割 diff
   */
  private splitDiffByFile(
    diff: string,
  ): Array<{ fileName: string; content: string }> {
    const result: Array<{ fileName: string; content: string }> = [];

    // Git diff 以 "diff --git" 开头
    const filePattern = /^diff --git a\/(.+?) b\/(.+)$/gm;
    const matches = [...diff.matchAll(filePattern)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const fileName = match[2]; // 使用 b/ 路径作为文件名

      // 提取当前文件的 diff 内容
      const startIndex = match.index ?? 0;
      const endIndex =
        i + 1 < matches.length
          ? (matches[i + 1].index ?? diff.length)
          : diff.length;

      const content = diff.substring(startIndex, endIndex).trim();

      result.push({ fileName, content });
    }

    return result;
  }

  /**
   * 判断是否应该排除该文件
   */
  private shouldExcludeFile(fileName: string): boolean {
    // 检查是否在排除目录中
    for (const dir of DIFF_CONFIG.EXCLUDED_DIRS) {
      if (fileName.startsWith(dir) || fileName.includes('/' + dir)) {
        return true;
      }
    }

    // 检查文件扩展名或文件名
    const lowerFileName = fileName.toLowerCase();
    for (const pattern of DIFF_CONFIG.EXCLUDED_PATTERNS) {
      if (pattern.startsWith('.')) {
        // 扩展名匹配
        if (lowerFileName.endsWith(pattern)) {
          return true;
        }
      } else {
        // 完整文件名匹配
        if (
          lowerFileName === pattern ||
          lowerFileName.endsWith('/' + pattern)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 对单个文件的 diff 进行切片
   */
  private sliceFileDiff(fileName: string, content: string): DiffChunk[] {
    const chunks: DiffChunk[] = [];

    // 如果文件大小在限制内，直接作为一个切片
    if (content.length <= DIFF_CONFIG.MAX_CHUNK_SIZE) {
      chunks.push({
        fileName,
        content,
        charCount: content.length,
      });
      return chunks;
    }

    // 否则按 Hunk 拆分
    this.logger.log(
      `文件 ${fileName} 过大 (${content.length} 字符)，按 Hunk 拆分`,
    );

    const hunks = this.splitByHunks(content);
    let currentChunk = '';
    let currentHunkCount = 0;

    for (const hunk of hunks) {
      // 如果添加这个 hunk 会超过限制，先保存当前切片
      if (
        currentChunk &&
        currentChunk.length + hunk.length > DIFF_CONFIG.MAX_CHUNK_SIZE
      ) {
        chunks.push({
          fileName,
          content: currentChunk.trim(),
          charCount: currentChunk.length,
          hunkCount: currentHunkCount,
        });
        currentChunk = '';
        currentHunkCount = 0;
      }

      currentChunk += hunk + '\n\n';
      currentHunkCount++;
    }

    // 添加最后一个切片
    if (currentChunk.trim()) {
      chunks.push({
        fileName,
        content: currentChunk.trim(),
        charCount: currentChunk.length,
        hunkCount: currentHunkCount,
      });
    }

    this.logger.log(`文件 ${fileName} 拆分为 ${chunks.length} 个片段`);
    return chunks;
  }

  /**
   * 按 Hunk 分割 diff
   */
  private splitByHunks(diff: string): string[] {
    const hunks: string[] = [];
    const lines = diff.split('\n');

    let currentHunk: string[] = [];
    let inHunk = false;

    for (const line of lines) {
      // 检测 Hunk 头部
      if (DIFF_CONFIG.HUNK_HEADER_REGEX.test(line)) {
        // 保存之前的 hunk
        if (currentHunk.length > 0) {
          hunks.push(currentHunk.join('\n'));
        }
        // 开始新的 hunk
        currentHunk = [line];
        inHunk = true;
      } else if (inHunk) {
        currentHunk.push(line);
      } else {
        // Hunk 头部的上下文（如 "diff --git" 行）
        currentHunk.push(line);
      }
    }

    // 添加最后一个 hunk
    if (currentHunk.length > 0) {
      hunks.push(currentHunk.join('\n'));
    }

    return hunks;
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
      this.logger.log(
        `✅ 创建 Status 成功: ${state} - ${description.substring(0, 140)}`,
      );
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
