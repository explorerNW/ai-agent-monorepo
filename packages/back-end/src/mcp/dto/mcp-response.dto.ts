export interface McpResponse<T = any> {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpSuccessResult<T> {
  data: T;
  metadata?: Record<string, any>;
}
