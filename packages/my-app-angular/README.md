## 一、 核心架构决策

| 领域       | 推荐方案                        | 备选/淘汰               | 架构师/TL 决策理由                                                                                                                       |
| :--------- | :------------------------------ | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo   | Nx                              | Turborepo / Angular CLI | Nx 对 Angular 的支持是原生的。其依赖图分析、Affected 命令、Module Boundary Lint 是企业级代码治理的基石，能防止单体仓库退化为“大泥球”。   |
| 服务端状态 | TanStack Query (Angular)        | NgRx Effects / Apollo   | PM/QA 视角：消灭 90% 的 loading/error/refetch 样板代码，自带缓存/重试/乐观更新。开发效率提升 40%，Bug 率下降 30%。                       |
| 客户端状态 | NgRx SignalStore                | Redux / MobX / NGXS     | 架构师视角：Angular 18 官方钦定。无 Action/Reducer 样板，细粒度响应，完美契合 Zoneless。比传统 Store 轻量 60%。                          |
| UI + 样式  | Angular Material + Tailwind CSS | Bootstrap / Ant Design  | TL 视角：Material 保证复杂组件（Table/Dialog/Form）的无障碍(a11y)和稳定性；Tailwind 解决定制化痛点，避免 CSS-in-JS 的性能损耗。          |
| 网络层     | HttpClient + Interceptors       | Axios                   | 架构师视角：除非有历史包袱，否则严禁在新项目中引入 Axios。HttpClient 原生支持 SSR、TransferState、拦截器链，与 TanStack Query 无缝集成。 |
| 表单       | Reactive Forms + Zod/Yup        | Template Driven         | QA 视角：强类型 + Schema 验证。Zod 可实现前后端校验逻辑复用，从源头减少数据格式导致的 Bug。                                              |
| 测试       | Vitest + Playwright             | Karma/Jasmine/Cypress   | TL/QA 视角：Vitest 兼容 Jest API 但快 10x；Playwright 跨浏览器稳定性远超 Cypress。CI 时间缩短 70%。                                      |
| 国际化     | Transloco                       | Angular i18n            | PM 视角：支持懒加载翻译文件、多语言切换无需刷新页面、提取工具完善，更适合 SaaS 产品。                                                    |

## 二、 分层架构设计（Architecture）

```text
┌─────────────────────────────────────────────────────┐
│ Presentation Layer │
│ Standalone Components + Signals + Control Flow │
├─────────────────────────────────────────────────────┤
│ State Management Layer │
│ Server: TanStack Query │ Client: SignalStore │
├─────────────────────────────────────────────────────┤
│ Domain Layer │
│ Pure TS Services + Zod Schemas + RxJS Operators │
├─────────────────────────────────────────────────────┤
│ Infrastructure Layer │
│ HttpClient + Auth Interceptors + LocalStorage │
└─────────────────────────────────────────────────────┘
```

💡 关键原则

1. Server/Client 状态分离：API 数据永远不进 SignalStore，只放 UI 状态（主题、侧边栏、筛选条件）。
2. Domain 层纯净：不依赖 Angular DI，纯 TypeScript + RxJS/Lodash-es，可独立单元测试。
3. Zoneless First：新项目直接启用 provideExperimentalZonelessChangeDetection()，倒逼团队写出真正的响应式代码。

## 三、 工程化与团队协作规范

1. Nx Monorepo 边界治理

```json
// .eslintrc.json - 强制模块边界
{
  "overrides": [
    {
      "files": ["*.ts"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              {
                "sourceTag": "scope:admin",
                "onlyDependOnLibsWithTags": ["scope:shared", "scope:admin"]
              },
              {
                "sourceTag": "type:feature",
                "onlyDependOnLibsWithTags": ["type:ui", "type:util", "type:data-access"]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## 四、 企业级架构全景图

| 维度       | 修正后的企业级落地策略                                                                                                                                                   |
| :--------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 核心框架   | Angular 18+ (Standalone)。策略：新模块 Zoneless，老模块/复杂第三方库集成区保留 Zone.js (提供 `markForCheck` 逃生舱)。                                                    |
| 状态管理   | Server: TanStack Query (必须配合 `TransferState` 解决 SSR 注水问题)。<br>Client: NgRx SignalStore (仅限 UI/全局状态)。<br>Complex Form: 引入 XState 管理复杂表单状态机。 |
| 工程化     | Nx Monorepo + 自定义 Generators (降维打击，让开发填空)。<br>超大型项目引入 Nx Module Federation 微前端。                                                                 |
| 网络与数据 | HttpClient + Node.js BFF 层 (聚合裁剪接口)。<br>前端强校验：Reactive Forms + Zod (与后端 Schema 共享)。                                                                  |
| 质量保障   | Vitest (单元/状态机) + Pact (契约测试) + Playwright (E2E)。<br>强制接入 Sentry + rrweb (用户行为回放)。                                                                  |
| 团队管理   | AI Code Review 辅助 + 强制 `takeUntilDestroyed` ESLint 规则。<br>绞杀者模式渐进式重构老系统。                                                                            |
