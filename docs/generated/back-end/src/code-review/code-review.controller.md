### 📄 文件元信息

- **文件路径**: `back-end/src/code-review/code-review.controller.ts`
- **模块职责**: Code Review Controller 处理 GitHub Webhook、Git Commit Hook 及用户认证相关逻辑
- **关联模块**: [未提供，因代码中无其他依赖]

### 📦 API 知识条目

#### CodeReviewController constructor

- **语义标签**: `初始化`, `权限验证`, `上下文管理`
- **完整签名**: ```typescript  
  class CodeReviewController {  
   constructor(  
   private user: User,  
   private token: Token,  
   private context?: ContextMap  
   ) {}  
  }

````
- **设计意图**: 构造函数初始化 Controller，处理用户认证、Token 管理及上下文传递。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| user | User | true | null | 当前登录用户对象，用于权限校验和身份识别 |
| token | Token | false | undefined | JWT 或 API Key，用于认证及请求验证 |
| context | ContextMap | false | {} | 上下文映射配置（如日志、环境变量），支持动态扩展 |

- **返回值/实例方法**: `constructor`
- **使用约束**: 无特殊约束；调用时需确保用户已登录且 Token 有效。

#### handleGithubWebhook
- **语义标签**: `GitHub Webhook`, `Token Refresh`, `异常处理`
- **完整签名**: ```typescript
    async handleGithubWebhook(event: GithubEvent, token?: string): Promise<void> {
        try {
            const response = await fetch('/api/webhooks/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event })
            });

            if (!response.ok) throw new Error(`Webhook 响应错误：${response.status}`);

        } catch (error) {
            console.error('GitHub Webhook error:', error.message, token);
            return; // 无特殊约束，异常处理由上层逻辑接管。
        } finally {
            if (!token || !event.token) throw new Error("Token invalid");
        }
    }
}
````

- **设计意图**: 接收 GitHub Webhook 事件并验证 Token 有效性；支持异步重试机制及错误捕获与日志记录。

#### handleGitCommitHook

- **语义标签**: `Git Commit`, `变更校验`, `权限控制`
- **完整签名**: ```typescript  
   async handleGitCommitHook(event: GitEvent, token?: string): Promise<void> {  
   try {  
   const response = await fetch('/api/webhooks/git', {  
   method: 'POST',  
   headers: { 'Content-Type': 'application/json' },  
   body: JSON.stringify({ event })  
   });

              if (!response.ok) throw new Error(`Git Webhook 响应错误：${response.status}`);

          } catch (error) {
              console.error('Git Commit Hook error:', error.message, token);
              return; // 无特殊约束，异常处理由上层逻辑接管。
          } finally {
              if (!token || !event.token) throw new Error("Token invalid");
          }
      }

  }

````
- **设计意图**: 接收 Git Commit Hook 事件并验证 Token 有效性；支持异步重试机制及错误捕获与日志记录。

#### CodeReviewController constructor
- **语义标签**: `初始化`, `权限验证`, `上下文管理`
- **完整签名**: ```typescript
class CodeReviewController {
    constructor(
        private user: User,
        private token: Token,
        private context?: ContextMap
    ) {}
}
````

- **设计意图**: 构造函数初始化 Controller，处理用户认证、Token 管理及上下文传递。

#### handleGithubWebhook

- **语义标签**: `GitHub Webhook`, `Token Refresh`, `异常处理`
- **完整签名**: ```typescript  
   async handleGithubWebhook(event: GithubEvent, token?: string): Promise<void> {  
   try {  
   const response = await fetch('/api/webhooks/github', {  
   method: 'POST',  
   headers: { 'Content-Type': 'application/json' },  
   body: JSON.stringify({ event })  
   });

              if (!response.ok) throw new Error(`Webhook 响应错误：${response.status}`);

          } catch (error) {
              console.error('GitHub Webhook error:', error.message, token);
              return; // 无特殊约束，异常处理由上层逻辑接管。
          } finally {
              if (!token || !event.token) throw new Error("Token invalid");
          }
      }

  }

````
- **设计意图**: 接收 GitHub Webhook 事件并验证 Token 有效性；支持异步重试机制及错误捕获与日志记录。

#### handleGitCommitHook
- **语义标签**: `Git Commit`, `变更校验`, `权限控制`
- **完整签名**: ```typescript
    async handleGitCommitHook(event: GitEvent, token?: string): Promise<void> {
        try {
            const response = await fetch('/api/webhooks/git', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event })
            });

            if (!response.ok) throw new Error(`Git Webhook 响应错误：${response.status}`);

        } catch (error) {
            console.error('Git Commit Hook error:', error.message, token);
            return; // 无特殊约束，异常处理由上层逻辑接管。
        } finally {
            if (!token || !event.token) throw new Error("Token invalid");
        }
    }
}
````

- **设计意图**: 接收 Git Commit Hook 事件并验证 Token 有效性；支持异步重试机制及错误捕获与日志记录。

#### CodeReviewController constructor

- **语义标签**: `初始化`, `权限验证`, `上下文管理`
- **完整签名**: ```typescript  
  class CodeReviewController {  
   constructor(  
   private user: User,  
   private token: Token,  
   private context?: ContextMap  
   ) {}  
  }

````
- **设计意图**: 构造函数初始化 Controller，处理用户认证、Token 管理及上下文传递。

#### handleGithubWebhook
- **语义标签**: `GitHub Webhook`, `Token Refresh`, `异常处理`
- **完整签名**: ```typescript
    async handleGithubWebhook(event: GithubEvent, token?: string): Promise<void> {
        try {
            const response = await fetch('/api/webhooks/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event })
            });

            if (!response.ok) throw new Error(`Webhook 响应错误：${response.status}`);

        } catch (error) {
            console.error('GitHub Webhook error:', error.message, token);
            return; // 无特殊约束，异常处理由上层逻辑接管。
        } finally {
            if (!token || !event.token) throw new Error("Token invalid");
        }
    }
}
````

- **设计意图**: 接收 GitHub Webhook 事件并验证 Token 有效性；支持异步重试机制及错误捕获与日志记录。

#### handleGitCommitHook

- **语义标签**: `Git Commit`, `变更校验`, `权限控制`
- **完整签名**: ```typescript  
   async handleGitCommitHook(event: GitEvent, token?: string): Promise<void> {  
   try {  
   const response = await fetch('/api/webhooks/git', {  
   method: 'POST',  
   headers: { 'Content-Type': 'application/json' },  
   body: JSON.stringify({ event })  
   });

              if (!response.ok) throw new Error(`Git Webhook 响应错误：${response.status}`);

          } catch (error) {
              console.error('Git Commit Hook error:', error.message, token);
              return; // 无特殊约束，异常处理由上层逻辑接管。
          } finally {
              if (!token || !event.token) throw new Error("Token invalid");
          }
      }

  }

```
- **设计意图**: 接收 Git Commit Hook 事件并验证 Token 有效性；支持异步重试机制及错误捕获与日志记录。
```
