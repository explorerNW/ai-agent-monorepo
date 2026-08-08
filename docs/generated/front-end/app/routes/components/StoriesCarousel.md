# `StoriesCarousel.tsx` 技术文档

## 📖 1. 文件概述

`StoriesCarousel.tsx` 是一个基于 React + TypeScript 的**故事流轮播组件**，主要用于展示类似 Instagram/Snapchat 的短时媒体内容（图片/视频）。从提取的结构来看，该文件采用**纯函数式组件架构**，通过严格的接口定义实现数据契约与组件通信。

**架构特征推断：**

- **类型驱动设计**：通过 `StoryItem` 与 `StoriesCarouselProps` 建立数据流契约，保障前后端数据对接的类型安全。
- **状态与交互分离**：组件内部大概率封装了进度追踪、自动播放、手势滑动等状态逻辑，对外仅暴露必要的回调与配置项。
- **高可复用性**：Props 接口设计倾向于支持主题定制、渲染插槽（Render Props）及事件拦截，便于在不同业务线中复用。

---

## 🧩 2. 核心类型定义

### 2.1 `StoryItem` 接口

- **定义位置**：第 8 行
- **业务意图**：标准化单条“故事”的数据结构，作为轮播组件的数据源单元。通常由后端 API 返回，经 DTO 转换后注入组件。
- **典型字段推断**（基于行业通用模式）：

| 字段名      | 类型                 | 说明           | 业务意图                               |
| ----------- | -------------------- | -------------- | -------------------------------------- |
| `id`        | `string \| number`   | 唯一标识       | 用于进度记录、埋点上报、去重渲染       |
| `mediaUrl`  | `string`             | 媒体资源地址   | 支持图片/视频流，可能包含 CDN 签名     |
| `type`      | `'image' \| 'video'` | 媒体类型       | 决定渲染策略（`<img>` vs `<video>`）   |
| `duration`  | `number`             | 播放时长（秒） | 控制进度条与自动切换逻辑               |
| `author`    | `AuthorInfo`         | 发布者信息     | 用于头像、昵称展示，可能包含跳转链接   |
| `isViewed`  | `boolean`            | 是否已读       | 控制 UI 状态（如边框高亮、进度条颜色） |
| `createdAt` | `number`             | 发布时间戳     | 用于排序、过期清理或“刚刚”文案展示     |

> 💡 **架构建议**：建议使用 `Discriminated Union` 区分媒体类型，例如：
>
> ```ts
> type ImageStory = StoryItem & {
>   type: "image";
>   width?: number;
>   height?: number;
> };
> type VideoStory = StoryItem & {
>   type: "video";
>   posterUrl?: string;
>   loop?: boolean;
> };
> type StoryItem = ImageStory | VideoStory;
> ```

---

### 2.2 `StoriesCarouselProps` 接口

- **定义位置**：第 23 行
- **业务意图**：定义组件对外暴露的配置项与事件回调，控制轮播行为、交互反馈与 UI 定制。
- **典型参数推断**：

| 参数名             | 类型                                       | 必填 | 说明               | 业务意图                                |
| ------------------ | ------------------------------------------ | ---- | ------------------ | --------------------------------------- |
| `stories`          | `StoryItem[]`                              | ✅   | 故事数据列表       | 核心数据源，支持动态更新                |
| `onStoryChange`    | `(index: number, item: StoryItem) => void` | ❌   | 切换回调           | 用于埋点、进度同步、父组件状态联动      |
| `autoplayInterval` | `number`                                   | ❌   | 自动播放间隔（ms） | 控制无交互时的轮播节奏，默认通常 5000ms |
| `showProgress`     | `boolean`                                  | ❌   | 是否显示进度条     | 提升用户体验，明确当前播放阶段          |
| `renderOverlay`    | `(item: StoryItem) => ReactNode`           | ❌   | 自定义覆盖层       | 支持业务方注入点赞、评论、广告等浮层    |
| `className`        | `string`                                   | ❌   | 自定义样式类       | 兼容 CSS Modules / Tailwind / 全局样式  |
| `onSwipeEnd`       | `(direction: 'left' \| 'right') => void`   | ❌   | 滑动结束回调       | 用于手势交互埋点或特殊业务逻辑          |

> 💡 **架构建议**：使用 `Partial` 或 `Omit` 组合默认配置，避免 Props 膨胀：
>
> ```ts
> interface StoriesCarouselConfig {
>   autoplayInterval: number;
>   showProgress: boolean;
>   // ...
> }
> interface StoriesCarouselProps extends Partial<StoriesCarouselConfig> {
>   stories: StoryItem[];
>   // ...
> }
> ```

---

## ⚙️ 3. 核心组件与函数推断

> 📌 注：提取数据未显式包含类/函数，以下基于 `.tsx` 文件特征与 React 最佳实践进行架构级推断。

### 3.1 `StoriesCarousel` 组件

- **签名推断**：
  ```ts
  const StoriesCarousel: React.FC<StoriesCarouselProps> = ({ stories, ...config }) => { ... }
  ```
- **核心职责**：
  - 维护当前播放索引 `currentIndex` 与播放状态 `isPlaying`
  - 处理手势/键盘交互（滑动、点击、方向键）
  - 管理媒体生命周期（预加载、暂停/恢复、内存释放）
  - 渲染进度指示器与切换动画

### 3.2 内部核心函数/逻辑推断

| 函数/逻辑                | 参数                                | 返回值          | 业务意图                                             |
| ------------------------ | ----------------------------------- | --------------- | ---------------------------------------------------- |
| `useAutoPlay(interval)`  | `interval: number`                  | `void`          | 封装 `setInterval` 与 `useEffect` 清理，避免内存泄漏 |
| `handleSwipe(direction)` | `direction: 'left' \| 'right'`      | `void`          | 计算目标索引，触发 `onStoryChange`，更新进度条       |
| `calculateProgress()`    | `elapsed: number, duration: number` | `number` (0~1)  | 驱动进度条动画，支持暂停/拖拽同步                    |
| `preloadNext(index)`     | `index: number`                     | `Promise<void>` | 预加载下一张媒体，提升滑动流畅度                     |

---

## 🏗️ 4. 架构设计与最佳实践建议

### ✅ 类型安全

- 启用 `strict: true` 与 `noUncheckedIndexedAccess`，防止 `stories[index]` 越界。
- 使用 `zod` 或 `io-ts` 对 API 返回的 `StoryItem[]` 进行运行时校验，兜底类型安全。

### 🚀 性能优化

- **虚拟滚动**：若 `stories.length > 20`，建议接入 `react-window` 或 `@tanstack/virtual`。
- **记忆化**：对 `renderOverlay`、`onStoryChange` 使用 `React.memo` 与 `useCallback` 避免无效重渲染。
- **媒体优化**：视频使用 `preload="metadata"`，图片使用 `loading="lazy"` 与 WebP/AVIF 格式降级。

### ♿ 无障碍访问 (a11y)

- 添加 `role="region"`、`aria-label="Stories Carousel"`、`aria-roledescription="carousel"`
- 支持键盘导航：`ArrowLeft/Right` 切换，`Space` 暂停/播放，`Esc` 关闭
- 焦点管理：切换时自动聚焦当前媒体容器，避免屏幕阅读器迷失

### 🔌 扩展性设计

- 采用 **Compound Components** 或 **Context API** 暴露内部状态（如 `StoriesCarousel.Provider`），便于子组件读取进度/索引。
- 预留 `theme` 接口支持暗色模式与品牌色定制。
- 事件系统采用发布订阅模式，便于接入埋点 SDK（如 `onImpression`、`onComplete`）。

---

📝 **文档维护说明**  
本文档基于静态结构提取与 React/TypeScript 架构规范生成。实际字段与函数签名请以源码为准。建议在 PR 阶段补充 JSDoc 注释与 Storybook 示例，以提升团队协作效率。
