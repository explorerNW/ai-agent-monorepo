export interface GitHubWebhookPayload {
  repository: { full_name: string };
  pull_request?: { number: number; diff_url: string };
  action: string; // PR 的动作：opened, closed, synchronize, reopened 等
  ref: string;
  commits?: any[];
}

export interface DifyResponse {
  answer: string; // Dify 返回的文本内容
  workflow_run_id?: string;
}

export interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_at: number;
}
