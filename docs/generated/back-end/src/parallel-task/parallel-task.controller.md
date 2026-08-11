### 📄 文件元信息

- **文件路径**: `back-end/src/parallel-task/parallel-task.controller.ts`
- **模块职责**: [异步任务调度与资源管理]
- **关联模块**: [`ParallelTaskController`](#) / [`CpuInfo`](cpcu_info)、[`ThreadPoolExecutor`](throttle_executor)

### 📦 API 知识条目

#### ParallelTaskController constructor

````typescript
constructor(
    public readonly taskQueue: TaskQueue,
    private readonly workerPool: WorkerPool,
    private readonly logger: Logger
);
- **语义标签**: [任务队列管理，异步处理]
- **完整签名**: `public constructor(taskQueue: TaskQueue, workerPool: WorkerPool, logger: Logger) {}`
- **设计意图**: 初始化并配置基础服务组件，确保资源池与日志系统就绪。
- **参数/属性契约**：

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| taskQueue | TaskQueue | true | - | 任务队列管理接口，支持异步处理与并发控制。 |
| workerPool | WorkerPool | false | { maxWorkers: number } | 资源池配置参数，限制并行线程数上限。 |
| logger | Logger | false | {} | 日志记录器组件，用于系统级信息追踪。 |

- **返回值/实例方法**: `constructor` (无直接返回)；调用后自动初始化所有依赖项。
- **使用约束**: [异步任务调度与资源管理]：确保线程池配置合理、避免阻塞主流程异常抛出等。
- **Code Review 检查点**：[1. 确认 taskQueue 支持并发控制，2. workerPool 参数是否足够覆盖业务场景，3. logger 日志格式是否符合系统规范]

#### getCpuInfo (cpcu_info)
```typescript
getCpuInfo(): { cpuUsage: number; memoryUsage: string } | null;
- **语义标签**: [CPU 资源监控，内存占用分析]
- **完整签名**: `public getCpuInfo(): Promise<{ cpuUsage: number; memoryUsage: string }> | null`
- **设计意图**: 获取 CPU 使用率与内存占用的实时数据。
- **参数/属性契约**：

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| cpuUsage | number | false | - | CPU 核心使用率，范围 [0,1]。 |
| memoryUsage | string | true | "unknown" | 内存占用描述（如“4.2GB”）。 |

- **返回值/实例方法**: `getCpuInfo()` (返回结果)；调用后自动获取资源状态。
- **使用约束**: [CPU 监控与性能分析]：确保数据准确性，避免误判系统负载异常。
- **Code Review 检查点**：[1. cpuUsage 是否准确反映实际 CPU 占用率，2. memoryUsage 描述格式是否符合规范]

#### ThreadPoolExecutor (throttle_executor)
```typescript
ThreadPoolExecutor(
    maxWorkers: number,
    workerPool: WorkerPool | null = null,
    logger: Logger | undefined = undefined
): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId = 'throttle_executor'; status = 'running' }`

```typescript
ThreadPoolExecutor(maxWorkers=2): { executorId: string; status: 'running' } | null;
- **语义标签**: [线程池管理，异步任务调度]
- **完整签名**: `public ThreadPoolExecutor(
    maxWorkers: number, workerPool?: WorkerPool?, logger?: Logger? : Promise<{executorId:string,status:'running'}|null>`
) { executorId
````
