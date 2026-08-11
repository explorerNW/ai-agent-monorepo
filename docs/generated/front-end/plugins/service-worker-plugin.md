### 📄 文件元信息

- **文件路径**: `front-end/plugins/service-worker-plugin.ts`
- **模块职责**: TypeScript Service Worker Plugin 配置与注册管理核心组件（支持异步初始化、资源注入及回调处理）
- **关联模块**: `serviceWorkerPluginOptions`, `configResolved`, `generateBundle`, `closeBundle`, `createHash`, `injectRegistrationScript`

### 📦 API 知识条目

#### ServiceWorkerPluginOptions 成员全限定名

- **语义标签**: [配置选项, Bundle管理，Token刷新]
- **完整签名**: ```typescript
  interface ServiceWorkerPluginOptions {
  bundle?: string; // 可选：Bundle ID/路径
  tokenRefreshInterval: number; // 可选：Token刷新间隔（毫秒）
  }

````

#### serviceWorkerPlugin 成员全限定名
- **语义标签**: [异步初始化，资源注入]
- **完整签名**: ```typescript
function serviceWorkerPlugin(options?: ServiceWorkerPluginOptions): Promise<ServiceWorkerPlugin> {
    return new Promise((resolve, reject) => {
        // ...实现逻辑...
    });
}
````

#### configResolved 成员全限定名

- **语义标签**: [配置加载，资源初始化]
- **完整签名**: ```typescript
  function configResolved(config: Config): void;

````

#### generateBundle 成员全限定名
- **语义标签**: [生成 Bundle ID, Token刷新]
- **完整签名**: ```typescript
async function generateBundle(options?: ServiceWorkerPluginOptions): Promise<string> {
    // ...实现逻辑...
}
````

#### closeBundle 成员全限定名

- **语义标签**: [关闭资源，清理注册脚本]
- **完整签名**: ```typescript
  function closeBundle(bundleId: string, options?: Partial<ServiceWorkerPluginOptions>): void;

````

#### createHash 成员全限定名
- **语义标签**: [生成 Hash ID, Token刷新]
- **完整签名**: ```typescript
async function createHash(options?: ServiceWorkerPluginOptions): Promise<string> {
    // ...实现逻辑...
}
````

#### injectRegistrationScript 成员全限定名

- **语义标签**: [注册脚本注入，回调处理]
- **完整签名**: ```typescript
  function injectRegistrationScript(script: string, options?: Partial<ServiceWorkerPluginOptions>): void;
