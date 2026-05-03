import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';

export interface ParallelTaskOptions {
  /**
   * 并发任务数（默认使用CPU核心数的75%）
   */
  concurrency?: number;

  /**
   * 任务超时时间（毫秒），0表示不限制
   */
  timeout?: number;

  /**
   * 是否在任务失败时继续执行其他任务
   */
  continueOnError?: boolean;
}

export interface TaskResult<T = any> {
  index: number;
  result?: T;
  error?: Error;
  duration: number;
}

export interface ParallelExecutionResult<T = any> {
  success: boolean;
  results: TaskResult<T>[];
  totalDuration: number;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

@Injectable()
export class ParallelTaskService {
  private readonly logger = new Logger(ParallelTaskService.name);

  /**
   * 获取服务器CPU核心数
   */
  getCPUCores(): number {
    return os.cpus().length;
  }

  /**
   * 计算最佳并发数（使用CPU核心数的75%）
   * @param maxConcurrency 最大并发数限制
   */
  calculateOptimalConcurrency(maxConcurrency?: number): number {
    const cpuCount = this.getCPUCores();
    const optimalConcurrency = Math.floor(cpuCount * 0.75);

    if (maxConcurrency) {
      return Math.min(optimalConcurrency, maxConcurrency);
    }

    return Math.max(1, optimalConcurrency);
  }

  /**
   * 并行执行任务数组
   * @param tasks 任务函数数组，每个任务返回Promise
   * @param options 配置选项
   * @returns 执行结果
   */
  async executeParallel<T = any>(
    tasks: Array<() => Promise<T>>,
    options: ParallelTaskOptions = {},
  ): Promise<ParallelExecutionResult<T>> {
    const startTime = Date.now();
    const {
      concurrency = this.calculateOptimalConcurrency(),
      timeout = 0,
      continueOnError = true,
    } = options;

    this.logger.log(
      `🚀 开始并行执行 ${tasks.length} 个任务，并发数: ${concurrency}`,
    );

    const results: TaskResult<T>[] = [];
    let hasError = false;

    // 分批处理任务
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchPromises = batch.map((task, batchIndex) => {
        const taskIndex = i + batchIndex;
        const taskStartTime = Date.now();

        // 创建带超时的任务
        const taskWithTimeout =
          timeout > 0 ? this.withTimeout(task(), timeout, taskIndex) : task();

        return taskWithTimeout
          .then((result) => ({
            index: taskIndex,
            result,
            duration: Date.now() - taskStartTime,
          }))
          .catch((error: Error) => {
            hasError = true;
            return {
              index: taskIndex,
              error,
              duration: Date.now() - taskStartTime,
            };
          });
      });

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      this.logger.log(
        `✓ 批次 ${Math.floor(i / concurrency) + 1}/${Math.ceil(tasks.length / concurrency)} 完成`,
      );

      // 如果不允许错误继续且出现错误，则停止执行
      if (!continueOnError && hasError) {
        this.logger.warn('⚠️ 检测到错误，停止后续任务执行');
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const succeeded = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;

    this.logger.log(
      `✅ 并行执行完成: 总计 ${results.length}, 成功 ${succeeded}, 失败 ${failed}, 耗时 ${totalDuration}ms`,
    );

    return {
      success: !hasError || continueOnError,
      results,
      totalDuration,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
    };
  }

  /**
   * 并行处理数据项（将数据转换为任务）
   * @param items 数据项数组
   * @param processor 处理函数，接收数据项和索引
   * @param options 配置选项
   * @returns 执行结果
   */
  async processItems<TInput, TOutput = any>(
    items: TInput[],
    processor: (item: TInput, index: number) => Promise<TOutput>,
    options: ParallelTaskOptions = {},
  ): Promise<ParallelExecutionResult<TOutput>> {
    const tasks = items.map((item, index) => () => processor(item, index));

    return this.executeParallel(tasks, options);
  }

  /**
   * 带进度回调的并行执行
   * @param tasks 任务函数数组
   * @param onProgress 进度回调函数 (completed, total)
   * @param options 配置选项
   * @returns 执行结果
   */
  async executeWithProgress<T = any>(
    tasks: Array<() => Promise<T>>,
    onProgress: (completed: number, total: number) => void,
    options: ParallelTaskOptions = {},
  ): Promise<ParallelExecutionResult<T>> {
    const startTime = Date.now();
    const {
      concurrency = this.calculateOptimalConcurrency(),
      timeout = 0,
      continueOnError = true,
    } = options;

    this.logger.log(
      `🚀 开始并行执行 ${tasks.length} 个任务（带进度），并发数: ${concurrency}`,
    );

    const results: TaskResult<T>[] = [];
    let completedCount = 0;
    let hasError = false;

    // 分批处理任务
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchPromises = batch.map((task, batchIndex) => {
        const taskIndex = i + batchIndex;
        const taskStartTime = Date.now();

        const taskWithTimeout =
          timeout > 0 ? this.withTimeout(task(), timeout, taskIndex) : task();

        return taskWithTimeout
          .then((result) => {
            completedCount++;
            onProgress(completedCount, tasks.length);
            return {
              index: taskIndex,
              result,
              duration: Date.now() - taskStartTime,
            };
          })
          .catch((error: Error) => {
            hasError = true;
            completedCount++;
            onProgress(completedCount, tasks.length);
            return {
              index: taskIndex,
              error,
              duration: Date.now() - taskStartTime,
            };
          });
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (!continueOnError && hasError) {
        this.logger.warn('⚠️ 检测到错误，停止后续任务执行');
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const succeeded = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;

    this.logger.log(
      `✅ 并行执行完成: 总计 ${results.length}, 成功 ${succeeded}, 失败 ${failed}, 耗时 ${totalDuration}ms`,
    );

    return {
      success: !hasError || continueOnError,
      results,
      totalDuration,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
    };
  }

  /**
   * 为任务添加超时控制
   * @param promise 原始Promise
   * @param timeoutMs 超时时间（毫秒）
   * @param taskIndex 任务索引（用于日志）
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    taskIndex: number,
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`任务 ${taskIndex} 超时 (${timeoutMs}ms)`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }
}
