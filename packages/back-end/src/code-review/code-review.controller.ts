import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ReviewService } from './code-review.service';
import type { GitHubWebhookPayload } from '../types/dto';

@Controller('webhook')
export class CodeReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('github')
  @HttpCode(200) // 必须返回 200，否则 GitHub 会认为请求失败
  handleGithubWebhook(
    @Body() payload: GitHubWebhookPayload,
    @Headers('x-github-event') event: string,
  ) {
    // 简单的事件过滤
    if (event === 'pull_request' || event === 'push') {
      // 异步处理，不阻塞响应，防止 GitHub 超时
      this.reviewService.handleWebhook(payload).catch(console.error);
    }
    return { status: 'processing' };
  }
}
