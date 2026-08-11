### 📄 文件元信息

- **文件路径**: `back-end/src/parallel-task/parallel-task.service.ts`
- **模块职责**: 并行任务执行与异步处理服务核心逻辑实现
- **关联模块**: `back-end/src/utils/task-manager.ts`, `back-end/src/services/cpucores-service.ts`

### 📦 API 知识条目

#### ParallelTaskOptions 成员全限定名

- **语义标签**: [用户认证, JWT令牌管理，异步任务调度]
- **完整签名**: ```typescript  
  interface ParallelTaskOptions {  
   id: string;  
   taskName?: string;  
  }

````
**设计意图**: 定义并行任务的初始配置参数，确保调用方在发起请求前明确资源需求。

#### TaskResult 成员全限定名
- **语义标签**: [任务执行结果, 状态流转]
- **完整签名**: ```typescript
interface TaskResult {
    id: string;
    status: 'pending' | 'running' | 'completed';
}
````

**设计意图**: 记录并行任务的最终状态，便于后续追踪与异常处理。

#### ParallelExecutionResult 成员全限定名

- **语义标签**: [执行结果, 资源分配]
- **完整签名**: ```typescript  
  interface ParallelExecutionResult {  
   id: string;  
   cpuCoresUsed?: number;  
  }

````
**设计意图**: 记录并行任务中实际使用的 CPU 核心数，支持性能监控。

#### ParallelTaskService 成员全限定名
- **语义标签**: [并发控制, 异步执行]
- **完整签名**: ```typescript
class ParallelTaskService {
    constructor(private taskManager: TaskManager) {}
}
````

**设计意图**: 提供统一的并行任务管理服务，支持多实例调度。

#### getCPUCores 成员全限定名

- **语义标签**: [CPU核心获取, 资源分配]
- **完整签名**: ```typescript  
  function getCpuCores(): number;

````
**设计意图**: 返回当前可用的 CPU 核心数量，用于任务执行时的并发控制。

#### calculateOptimalConcurrency 成员全限定名
- **语义标签**: [优化策略, 资源调度]
- **完整签名**: ```typescript
function calculateOptimalConcurrency(): number;
````

**设计意图**: 计算最优并发数以平衡性能与稳定性，避免 CPU过载或任务阻塞。

#### executeParallel 成员全限定名

- **语义标签**: [并行执行, 异步处理]
- **完整签名**: ```typescript  
  function executeParallel(items: ParallelTaskOptions[]): Promise<TaskResult[]>;

````
**设计意图**: 将多个独立任务合并为单线程并发执行，支持批量资源调度。

#### processItems 成员全限定名
- **语义标签**: [数据处理, 并行处理]
- **完整签名**: ```typescript
function processItems(items: ParallelTaskOptions[]): Promise<TaskResult[]>;
````

**设计意图**: 对任务列表进行预处理与分发，支持多实例并发执行。

#### executeWithProgress 成员全限定名

- **语义标签**: [进度追踪, 异步处理]
- **完整签名**: ```typescript  
  function withTimeout(timeout: number): Promise<TaskResult>;

````
**设计意图**: 提供超时控制机制，确保任务在合理时间内完成并返回状态。

#### withTimeout 成员全限定名
- **语义标签**: [异常处理, 资源释放]
- **完整签名**: ```typescript
function withTimeout(timeout: number): Promise<TaskResult>;
````

**设计意图**: 提供超时控制机制，确保任务在合理时间内完成并返回状态。

### 📥 输入代码结构

[{"type":"Interface","name":"ParallelTaskOptions","line":4,"is_export":true},{"type":"Interface","name":"TaskResult","line":21,"is_export":true},{"type":"Interface","name":"ParallelExecutionResult","line":28,"is_export":true},{"type":"Class","name":"ParallelTaskService","line":40,"is_export":true},{"type":"Function/Method","name":"getCPUCores","line":46,"is_export":true},{"type":"Function/Method","name":"calculateOptimalConcurrency","line":54,"is_export":true},{"type":"Function/Method","name":"executeParallel","line":71,"is_export":true},{"type":"Function/Method","name":"processItems","line":158,"is_export":true},{"type":"Function/Method","name":"executeWithProgress","line":175,"is_export":true},{"type":"Function/Method","name":"withTimeout","line":262,"is_export":true}]
