export interface GitHubWebhookPayload {
  repository: { full_name: string };
  pull_request?: { number: number; diff_url: string };
  ref: string;
  commits?: any[];
}

export interface DifyResponse {
  answer: string; // Dify 返回的文本内容
  workflow_run_id?: string;
}
