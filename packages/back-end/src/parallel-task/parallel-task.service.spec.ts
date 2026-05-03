import { Test, TestingModule } from '@nestjs/testing';
import { ParallelTaskService } from './parallel-task.service';

describe('ParallelTaskService', () => {
  let service: ParallelTaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParallelTaskService],
    }).compile();

    service = module.get<ParallelTaskService>(ParallelTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCPUCores', () => {
    it('should return number of CPU cores', () => {
      const cores = service.getCPUCores();
      expect(cores).toBeGreaterThan(0);
      expect(typeof cores).toBe('number');
    });
  });

  describe('calculateOptimalConcurrency', () => {
    it('should calculate optimal concurrency (75% of CPU cores)', () => {
      const concurrency = service.calculateOptimalConcurrency();
      const cores = service.getCPUCores();
      const expected = Math.floor(cores * 0.75);

      expect(concurrency).toBeGreaterThanOrEqual(1);
      expect(concurrency).toBeLessThanOrEqual(cores);
      expect(concurrency).toBe(expected);
    });

    it('should respect max concurrency limit', () => {
      const maxConcurrency = 2;
      const concurrency = service.calculateOptimalConcurrency(maxConcurrency);

      expect(concurrency).toBeLessThanOrEqual(maxConcurrency);
    });
  });

  describe('executeParallel', () => {
    it('should execute tasks in parallel', async () => {
      const tasks = [
        async () => {
          await Promise.resolve();
          return { result: 'task1' };
        },
        async () => {
          await Promise.resolve();
          return { result: 'task2' };
        },
        async () => {
          await Promise.resolve();
          return { result: 'task3' };
        },
      ];

      const result = await service.executeParallel(tasks);

      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(3);
      expect(result.summary.succeeded).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it('should handle task failures with continueOnError', async () => {
      const tasks = [
        async () => {
          await Promise.resolve();
          return { result: 'success' };
        },
        async () => {
          await Promise.resolve();
          throw new Error('Task failed');
        },
        async () => {
          await Promise.resolve();
          return { result: 'success' };
        },
      ];

      const result = await service.executeParallel(tasks, {
        continueOnError: true,
      });

      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(3);
      expect(result.summary.succeeded).toBe(2);
      expect(result.summary.failed).toBe(1);
    });

    it('should stop on first error when continueOnError is false', async () => {
      let executedTasks = 0;
      const tasks = [
        async () => {
          executedTasks++;
          await Promise.resolve();
          return { result: 'success' };
        },
        async () => {
          executedTasks++;
          await Promise.resolve();
          throw new Error('Task failed');
        },
        async () => {
          executedTasks++;
          await Promise.resolve();
          return { result: 'success' };
        },
      ];

      const result = await service.executeParallel(tasks, {
        concurrency: 1, // Force sequential execution to test early stopping
        continueOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.summary.failed).toBeGreaterThanOrEqual(1);
      // With concurrency 1, it should stop after the second task fails
      expect(executedTasks).toBeLessThanOrEqual(2);
    });

    it('should respect timeout', async () => {
      const tasks = [
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { result: 'fast' };
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return { result: 'slow' };
        },
      ];

      const result = await service.executeParallel(tasks, {
        timeout: 500, // 500ms timeout
        continueOnError: true,
      });

      expect(result.summary.total).toBe(2);
      expect(result.summary.succeeded).toBe(1);
      expect(result.summary.failed).toBe(1);
      // Check if error message contains timeout (in Chinese or English)
      const errorMessage = result.results[1].error?.message || '';
      expect(errorMessage.toLowerCase()).toMatch(/timeout|超时/);
    });
  });

  describe('processItems', () => {
    it('should process items with processor function', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn(async (item: number) => {
        await Promise.resolve();
        return item * 2;
      });

      const result = await service.processItems(items, processor);

      expect(result.success).toBe(true);
      expect(result.summary.succeeded).toBe(5);
      expect(processor).toHaveBeenCalledTimes(5);

      const results = result.results.map((r) => r.result);
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should pass correct index to processor', async () => {
      const items = ['a', 'b', 'c'];
      const indices: number[] = [];

      await service.processItems(items, async (item, index) => {
        await Promise.resolve();
        indices.push(index);
        return item;
      });

      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('executeWithProgress', () => {
    it('should call progress callback', async () => {
      const tasks = [
        async () => {
          await Promise.resolve();
          return { result: 1 };
        },
        async () => {
          await Promise.resolve();
          return { result: 2 };
        },
        async () => {
          await Promise.resolve();
          return { result: 3 };
        },
      ];

      const progressCalls: Array<[number, number]> = [];
      const onProgress = jest.fn((completed: number, total: number) => {
        progressCalls.push([completed, total]);
      });

      const result = await service.executeWithProgress(tasks, onProgress);

      expect(result.success).toBe(true);
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(progressCalls).toEqual([
        [1, 3],
        [2, 3],
        [3, 3],
      ]);
    });
  });

  describe('batch processing', () => {
    it('should process large number of tasks in batches', async () => {
      const taskCount = 100;
      const tasks = Array.from({ length: taskCount }, (_, i) => async () => {
        await Promise.resolve();
        return { index: i };
      });

      const result = await service.executeParallel(tasks, {
        concurrency: 10,
      });

      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(taskCount);
      expect(result.summary.succeeded).toBe(taskCount);
      expect(result.results).toHaveLength(taskCount);
    });
  });
});
