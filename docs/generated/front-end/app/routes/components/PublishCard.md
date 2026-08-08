# `PublishCard.tsx` 技术架构文档

## 1. 文件概述

基于文件后缀 `.tsx` 及命名规范推断，`PublishCard.tsx` 是一个 **React 函数组件** 的实现文件。该组件的核心职责是渲染“发布卡片”交互界面，负责展示可发布内容（如文章、动态、商品等）的元数据，并提供编辑、预览、提交发布等用户交互能力。

文件结构遵循 **React + TypeScript 契约驱动开发** 范式：

- `PublishCard`：领域数据模型接口，抽象业务实体结构。
- `PublishCardProps`：组件外部输入契约，定义 Props 类型与回调签名。
- 组件实现（未提供）：预计为受控/半受控函数组件，通过 Props 接收数据与事件，内部维护局部 UI 状态，并通过回调向上派发业务动作。

---

## 2. 核心类型定义

### 2.1 `PublishCard` 接口

**定位**：领域实体 / 数据模型  
**行号**：8  
**推断签名**：

```typescript
export interface PublishCard {
  id?: string;
  title: string;
  content: string;
  status: "draft" | "pending" | "published" | "archived";
  authorId?: string;
  coverUrl?: string;
  tags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown; // 预留扩展字段
}
```

| 参数/字段                 | 类型              | 说明       | 业务意图推断                                                   |
| ------------------------- | ----------------- | ---------- | -------------------------------------------------------------- |
| `id`                      | `string?`         | 唯一标识符 | 用于路由定位、API 请求、乐观更新与状态追踪                     |
| `title`                   | `string`          | 标题       | 核心展示字段，通常参与 SEO、列表排序与搜索索引                 |
| `content`                 | `string`          | 正文内容   | 支持富文本/Markdown，决定卡片主体渲染逻辑                      |
| `status`                  | 联合类型          | 发布状态机 | 驱动 UI 分支渲染（如草稿态显示编辑按钮，已发布态显示分享入口） |
| `authorId`                | `string?`         | 作者标识   | 用于权限校验、归属展示与审计日志                               |
| `coverUrl`                | `string?`         | 封面图地址 | 视觉层级控制，影响卡片布局与懒加载策略                         |
| `tags`                    | `string[]?`       | 标签数组   | 用于内容分类、推荐算法与筛选过滤                               |
| `createdAt` / `updatedAt` | `Date \| string?` | 时间戳     | 用于排序、新鲜度标识与缓存失效策略                             |

> 💡 **架构注记**：该接口建议配合 `zod` 或 `io-ts` 进行运行时校验，避免前后端数据结构漂移。若涉及复杂嵌套，可拆分为 `PublishCardMeta` 与 `PublishCardContent` 子接口。

---

### 2.2 `PublishCardProps` 接口

**定位**：React 组件 Props 契约  
**行号**：24  
**推断签名**：

```typescript
export interface PublishCardProps {
  data: PublishCard;
  isLoading?: boolean;
  isEditable?: boolean;
  onPublish?: (updatedData: PublishCard) => void | Promise<void>;
  onCancel?: () => void;
  onPreview?: (data: PublishCard) => void;
  className?: string;
  style?: React.CSSProperties;
  renderActions?: (props: { status: PublishCard["status"] }) => React.ReactNode;
}
```

| 参数                  | 类型          | 说明          | 业务意图推断                                                   |
| --------------------- | ------------- | ------------- | -------------------------------------------------------------- |
| `data`                | `PublishCard` | 卡片数据源    | 核心输入，驱动组件渲染与表单初始值                             |
| `isLoading`           | `boolean?`    | 加载状态      | 控制骨架屏/Loading 遮罩，防止重复提交与竞态条件                |
| `isEditable`          | `boolean?`    | 编辑权限开关  | 基于 RBAC 或数据状态动态控制交互能力，实现权限下沉             |
| `onPublish`           | 回调函数      | 发布动作      | 向上派发提交事件，支持同步/异步流程（如校验→上传→落库）        |
| `onCancel`            | 回调函数      | 取消/返回动作 | 用于模态框关闭、路由回退或表单重置                             |
| `onPreview`           | 回调函数      | 预览动作      | 触发预览路由或弹窗，隔离发布流程与预览流程                     |
| `className` / `style` | 标准样式属性  | 样式透传      | 保持组件可组合性，适配 Tailwind/CSS Modules 等方案             |
| `renderActions`       | 渲染函数      | 插槽扩展      | 高阶定制能力，允许父组件注入状态相关的操作按钮（如审核、下架） |

> 💡 **架构注记**：Props 设计遵循 **单一职责** 与 **显式依赖** 原则。回调函数采用可选链设计，避免未绑定事件时的运行时错误。建议配合 `React.forwardRef` 暴露内部表单实例，便于父组件调用 `focus()` 或 `reset()`。

---

## 3. 业务意图与架构推断

| 维度             | 推断结论                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **组件模式**     | 受控组件为主，局部状态（如表单编辑态）与 Props 数据分离，避免状态污染                                             |
| **数据流方向**   | 单向数据流：父组件 → `data` → 渲染 → 用户交互 → `onPublish`/`onCancel` → 父组件更新                               |
| **扩展性设计**   | 通过 `renderActions` 插槽与 `[key: string]: unknown` 预留字段，支持多业务线复用（如文章发布、商品上架、动态发布） |
| **类型安全策略** | 严格模式（`strict: true`），联合类型约束状态机，可选链与空值合并运算符防御性编程                                  |
| **可测试性**     | Props 契约清晰，便于编写单元测试（Mock `onPublish` 验证调用时机）与快照测试                                       |

---

## 4. 使用建议与最佳实践

1. **类型校验层**：建议在 API 响应进入组件前，使用 `zod` 对 `PublishCard` 进行结构化校验，避免脏数据渲染。
2. **状态管理**：若卡片列表较长，建议将 `PublishCard` 数据抽离至 Zustand/Redux Toolkit，避免 Props Drilling。
3. **性能优化**：对 `data` 使用 `React.memo`，对回调函数使用 `useCallback`，防止不必要的重渲染。
4. **无障碍访问**：确保发布按钮具备 `aria-label`，状态变更时通过 `role="status"` 通知屏幕阅读器。
5. **错误边界**：组件外部包裹 `ErrorBoundary`，捕获富文本解析或图片加载失败等运行时异常。

---

## 5. 说明与限制

> ⚠️ 本文档基于提供的 **接口名称与行号** 进行架构级推断。实际字段定义、组件实现逻辑、状态管理方案及样式策略需以完整源码为准。若需生成精确到字段级、包含 JSDoc 注释与单元测试用例的文档，请提供完整 `PublishCard.tsx` 源码或 AST 解析结果。

---

_文档版本：v1.0 | 生成角色：TypeScript 架构师 | 适用框架：React 18+ / TypeScript 5+_
