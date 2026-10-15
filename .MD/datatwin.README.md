# DataTwin 高性能 3D 数字孪生引擎架构文档

## 1. 架构概述

DataTwin 是一套专为**海量数据渲染**与**复杂业务交互**设计的 3D 数字孪生底层架构。本架构旨在解决传统 Three.js 业务开发中的三大痛点：主线程计算海量矩阵导致 UI 卡顿、组件频繁挂载卸载导致 WebGL 显存泄漏、3D 逻辑与 React/Vue 等 UI 框架深度绑定难以复用。

通过引入 Web Worker 零拷贝传输、InstancedMesh 批量渲染、Web Component 样式隔离以及 O(1) 空间索引，本架构能够支撑 10万+ 动态实例在 60FPS 下流畅运行，并实现跨框架的即插即用。

## 2. 四层分层架构设计

架构严格遵循“自底向上、单向依赖”的原则，分为四个核心层级：

### Layer 1: 计算层 (Compute Layer) - Web Worker

- **职责**：接管所有高频、重度的数学计算（如矩阵变换、颜色插值、物理碰撞）。
- **核心机制**：使用 Transferable Objects (零拷贝) 将 Float32Array 的所有权直接转移给主线程，避免数据克隆带来的 GC 停顿。
- **边界**：绝对不引入 Three.js，保持纯粹的 JS 计算环境，体积极小。

### Layer 2: 引擎层 (Engine Layer) - @datatwin/core

- **职责**：纯粹的 Three.js 场景管理、渲染循环、射线检测、相机动画控制。
- **核心机制**：
  - **双模渲染**：支持少量静态 Mesh（独立交互）与海量 InstancedMesh（Worker 驱动）混合渲染。
  - **O(1) 空间索引**：通过 `Map<id, index>` 实现 10 万级实例的毫秒级定位与 flyTo 飞行。
  - **平滑动画**：内置 easeInOutCubic 缓动弹道系统，接管相机控制权。
- **边界**：不依赖任何 UI 框架（无 React/Vue 依赖），仅依赖 three.js。

### Layer 3: 容器层 (Container Layer) - @datatwin/elements

- **职责**：基于 Web Components (Custom Elements) 封装 3D 画布，提供 Shadow DOM 样式隔离与生命周期管理。
- **核心机制**：
  - **ResizeObserver**：自动响应容器尺寸变化，更新相机比例。
  - **内存兜底**：在 disconnectedCallback 中强制触发 Core 的 dispose()，彻底杜绝显存泄漏。
  - **事件冒泡**：将 3D 内部的交互事件转化为标准 CustomEvent 向外抛出。

### Layer 4: 适配层 (Framework Layer) - @datatwin/react

- **职责**：将 Web Component 包装为符合 React 习惯的声明式组件。
- **核心机制**：使用 forwardRef 和 useImperativeHandle 暴露命令式 API，使用 useEffect 桥接自定义事件。

## 3. 核心技术亮点

### 3.1 Worker 零拷贝传输 (Zero-Copy Transfer)

在 10 万实例场景下，每帧需传输约 1.6MB 的矩阵数据。

- **传统方式**：`postMessage(data)` 会触发结构化克隆，耗时约 15-30ms，导致严重掉帧。
- **本架构**：`postMessage(data, [buffer])` 转移 ArrayBuffer 所有权，耗时 < 0.1ms，主线程几乎零开销。

### 3.2 O(1) 实例查找与 flyTo 优化

在海量 InstancedMesh 中定位特定建筑并飞行过去。

- **传统方式**：`Array.find()` 遍历 10 万条数据，耗时 20ms+，引发主线程卡顿。
- **本架构**：引入 `instanceIndexMap: Map<string, number>`。注册时建立「业务ID -> 实例Index」映射。flyTo 时通过 Map 实现 O(1) 查找 (<0.01ms)，随后通过 getMatrixAt 提取 Worker 刚刚写入的最新实时坐标，确保飞行目标精准无误。

### 3.3 平滑飞行与控制器互斥

- 采用 easeInOutCubic 缓动算法模拟真实无人机运镜（起步慢、中间快、降落慢）。
- 飞行期间自动设置 `controls.enabled = false`，防止用户鼠标拖拽打断动画；飞行结束后自动恢复控制权。

## 4. 数据流与事件流

### 4.1 渲染数据流 (Worker -> GPU)

```text
[Worker 线程] 计算 10万个 Matrix4 & Color
      │
      ▼ (Transferable 零拷贝)
[Core 主线程] 接收 Float32Array，直接替换 InstancedMesh 底层 buffer
      │
      ▼ (needsUpdate = true)
[WebGL/GPU] 读取最新 Buffer 进行批量绘制 (1 DrawCall)
```

### 4.2 交互事件流 (GPU -> React)

```text
[Canvas 点击] -> [Core Raycaster 射线检测]
      │
      ▼ (命中 Mesh)
[Core] 触发 DOM CustomEvent ('twin-interaction')
      │
      ▼ (穿透 Shadow DOM)
[Web Component] 监听并重新 dispatch 到 Light DOM
      │
      ▼
[React 适配层] useEffect 监听事件，触发 onTwinInteraction 回调
```

### 4.3 命令控制流 (React -> Core)

```text
[React 业务层] 调用 viewerRef.current.flyTo('building_01')
      │
      ▼
[Web Component] 透传调用 core.flyTo()
      │
      ▼
[Core] O(1) 查找 Index -> 提取实时 Matrix 坐标 -> 启动 Ease 缓动动画
```

## 5. 核心 API 清单 (TwinCore)

| API 方法                 | 参数                  | 描述                                              | 适用场景                                        |
| :----------------------- | :-------------------- | :------------------------------------------------ | :---------------------------------------------- |
| registerBuilding         | BuildingData          | 注册单个静态 Mesh，支持独立材质和交互。           | 核心地标、需特殊高亮的建筑。                    |
| startMassiveSimulation   | count: number         | 初始化 InstancedMesh 并启动 Worker 计算线程。     | 城市车流、环境粒子、海量普通建筑。              |
| registerMassiveInstances | Array<{id, position}> | 建立业务 ID 到 Instance Index 的 O(1) 映射。      | 需要让 Worker 驱动，且需要被 flyTo 定位的实例。 |
| flyTo                    | targetName, duration  | 平滑飞行到指定 ID 的目标（支持静态与动态实例）。  | 点击列表项，视角聚焦到对应 3D 建筑。            |
| flyToPosition            | [x,y,z], duration     | 直接飞行到指定世界坐标。                          | 目标坐标由外部系统（如 GIS）实时计算传入。      |
| dispose                  | 无                    | 彻底销毁场景、释放几何体/材质/纹理、终止 Worker。 | 组件卸载时自动调用，防止内存泄漏。              |

## 6. 最佳实践与避坑指南

1.  绝对不要在 React 的 render 函数中操作 3D 对象：所有对 TwinCore 的调用（如 registerBuilding, flyTo）必须放在 useEffect 或事件回调中执行。
2.  谨慎处理 Worker 的 Buffer 所有权：Worker 通过 transferList 发送 Float32Array 后，Worker 内部将失去对该 Buffer 的访问权限。必须在下一帧 TICK 时重新 new Float32Array()。
3.  海量实例的射线检测 (Raycasting)：当前架构中，射线检测仅针对普通 Mesh。如果需要对 10 万级 InstancedMesh 进行点击拾取，需开启 InstancedMesh 的射线检测，并在 Worker 中维护空间哈希树（BVH）以优化性能，避免主线程遍历。
4.  样式隔离：永远不要尝试用外部 CSS 去覆盖 <twin-viewer> 内部的 Canvas 样式。所有 DOM 结构均被封装在 Shadow DOM 中，请通过 Component 暴露的 API 或 CSS 变量进行控制。
