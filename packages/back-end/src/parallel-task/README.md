# Parallel Task Module

A NestJS module for executing tasks in parallel across multiple CPU cores, optimized for maximum performance and resource utilization.

## Features

- 🚀 **Multi-core CPU Utilization**: Automatically detects CPU cores and optimizes concurrency (75% utilization by default)
- ⚡ **Batch Processing**: Processes tasks in batches to manage memory efficiently
- 📊 **Progress Tracking**: Real-time progress callbacks for long-running operations
- ⏱️ **Timeout Control**: Optional timeout for individual tasks
- 🛡️ **Error Handling**: Configurable error handling (continue on error or stop)
- 🔄 **Flexible API**: Multiple methods for different use cases

## Installation

The module is already included in the back-end package. Just import it in your module:

```typescript
import { ParallelTaskModule } from '../parallel-task/parallel-task.module';

@Module({
  imports: [ParallelTaskModule],
  // ... other configuration
})
export class YourModule {}
```

## Usage

### 1. Basic Parallel Execution

Execute an array of async functions in parallel:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';

@Injectable()
export class MyService {
  constructor(private readonly parallelTaskService: ParallelTaskService) {}

  async processTasks() {
    // Create task array
    const tasks = [
      async () => await this.doWork('task1'),
      async () => await this.doWork('task2'),
      async () => await this.doWork('task3'),
    ];

    // Execute in parallel
    const result = await this.parallelTaskService.executeParallel(tasks, {
      concurrency: 4, // Optional: override auto-detected concurrency
      continueOnError: true,
    });

    console.log(result.summary); // { total: 3, succeeded: 3, failed: 0 }
    return result;
  }
}
```

### 2. Process Data Items

Process an array of data items with a processor function:

```typescript
async processItems() {
  const items = [
    { id: 1, data: '...' },
    { id: 2, data: '...' },
    { id: 3, data: '...' },
  ];

  const result = await this.parallelTaskService.processItems(
    items,
    async (item, index) => {
      // Process each item
      return await this.transformData(item);
    },
    {
      concurrency: 8,
      timeout: 30000, // 30 seconds timeout per task
    }
  );

  // Access successful results
  const successfulResults = result.results
    .filter(r => !r.error)
    .map(r => r.result);
}
```

### 3. With Progress Callback

Track progress for long-running operations:

```typescript
async processWithProgress() {
  const tasks = Array.from({ length: 100 }, (_, i) =>
    async () => await this.heavyTask(i)
  );

  const result = await this.parallelTaskService.executeWithProgress(
    tasks,
    (completed, total) => {
      console.log(`Progress: ${completed}/${total} (${(completed/total*100).toFixed(1)}%)`);

      // You can emit this via WebSocket, SSE, etc.
      this.eventEmitter.emit('progress', { completed, total });
    },
    {
      continueOnError: true,
    }
  );

  return result;
}
```

### 4. Get CPU Information

```typescript
// Get number of CPU cores
const cores = this.parallelTaskService.getCPUCores();

// Calculate optimal concurrency (75% of CPU cores)
const optimalConcurrency =
  this.parallelTaskService.calculateOptimalConcurrency();

// With max limit
const limitedConcurrency =
  this.parallelTaskService.calculateOptimalConcurrency(10);
```

## Configuration Options

### ParallelTaskOptions

```typescript
interface ParallelTaskOptions {
  /**
   * Number of concurrent tasks (default: 75% of CPU cores)
   */
  concurrency?: number;

  /**
   * Timeout per task in milliseconds (0 = no timeout)
   */
  timeout?: number;

  /**
   * Continue executing other tasks if one fails
   */
  continueOnError?: boolean;
}
```

## Return Types

### TaskResult

```typescript
interface TaskResult<T = any> {
  index: number; // Task index
  result?: T; // Result (if successful)
  error?: Error; // Error (if failed)
  duration: number; // Execution time in ms
}
```

### ParallelExecutionResult

```typescript
interface ParallelExecutionResult<T = any> {
  success: boolean; // Overall success status
  results: TaskResult<T>[]; // Individual task results
  totalDuration: number; // Total execution time
  summary: {
    total: number; // Total tasks
    succeeded: number; // Successful tasks
    failed: number; // Failed tasks
  };
}
```

## Examples

### Example 1: Image Processing

```typescript
async processImages(imagePaths: string[]) {
  const result = await this.parallelTaskService.processItems(
    imagePaths,
    async (imagePath) => {
      const image = await sharp(imagePath).resize(800, 600).toBuffer();
      return { path: imagePath, size: image.length };
    },
    { concurrency: 4 }
  );

  return result.results.filter(r => r.result);
}
```

### Example 2: API Calls

```typescript
async fetchMultipleEndpoints(endpoints: string[]) {
  const result = await this.parallelTaskService.executeParallel(
    endpoints.map(url => async () => {
      const response = await fetch(url);
      return response.json();
    }),
    {
      concurrency: 10,
      timeout: 5000,
      continueOnError: true,
    }
  );

  return result.results
    .filter(r => r.result)
    .map(r => r.result);
}
```

### Example 3: Database Operations

```typescript
async bulkUpdate(records: Record[]) {
  const result = await this.parallelTaskService.processItems(
    records,
    async (record) => {
      await this.database.update(record.id, record.data);
      return { id: record.id, status: 'updated' };
    },
    {
      concurrency: 20,
      continueOnError: false, // Stop on first error
    }
  );

  if (!result.success) {
    throw new Error(`Bulk update failed: ${result.summary.failed} records failed`);
  }

  return result;
}
```

## Best Practices

### 1. Optimal Concurrency

- Use automatic detection (default) for CPU-bound tasks
- For I/O-bound tasks (API calls, DB queries), you can use higher concurrency
- Consider system resources and other running processes

```typescript
// CPU-bound: use default (75% of cores)
const result = await this.parallelTaskService.executeParallel(tasks);

// I/O-bound: can use more concurrency
const result = await this.parallelTaskService.executeParallel(tasks, {
  concurrency: Math.min(50, tasks.length),
});
```

### 2. Memory Management

- Process large datasets in batches
- The module automatically handles batching based on concurrency
- Monitor memory usage for very large datasets

### 3. Error Handling

```typescript
// Option 1: Continue on error (collect all results)
const result = await this.parallelTaskService.executeParallel(tasks, {
  continueOnError: true,
});

// Check for failures
if (result.summary.failed > 0) {
  console.warn(`${result.summary.failed} tasks failed`);
  // Handle failed tasks
}

// Option 2: Stop on first error
const result = await this.parallelTaskService.executeParallel(tasks, {
  continueOnError: false,
});
```

### 4. Timeout Control

```typescript
// Prevent hanging tasks
const result = await this.parallelTaskService.executeParallel(tasks, {
  timeout: 30000, // 30 seconds per task
});

// Handle timeouts
result.results.forEach((r) => {
  if (r.error?.message.includes('timeout')) {
    console.error(`Task ${r.index} timed out`);
  }
});
```

### 5. Progress Tracking

```typescript
// For long-running operations, provide progress updates
const result = await this.parallelTaskService.executeWithProgress(
  tasks,
  (completed, total) => {
    const percentage = ((completed / total) * 100).toFixed(1);
    this.logger.log(`Processing: ${percentage}%`);

    // Emit via WebSocket for real-time UI updates
    this.gateway.emit('progress', { percentage });
  },
);
```

## Performance Tips

1. **CPU-bound tasks**: Use 75% of CPU cores (automatic)
2. **I/O-bound tasks**: Can use higher concurrency (2-3x CPU cores)
3. **Mixed workloads**: Profile and adjust based on actual performance
4. **Monitor resources**: Use system monitoring tools to find optimal settings
5. **Batch size**: For very large datasets, consider smaller batch sizes to manage memory

## Testing

The module includes comprehensive logging. Enable debug logs to see detailed execution information:

```bash
# Set log level to debug
export LOG_LEVEL=debug
```

## API Endpoints (Examples)

The module includes example endpoints for testing:

- `GET /parallel/cpu-info` - Get CPU information
- `GET /parallel/example?count=10&delay=1000` - Run example parallel tasks
- `GET /parallel/process-items?count=20` - Process data items in parallel

## Integration with PDF Processing

The PDF processing service has been updated to use `ParallelTaskService` for OCR operations:

```typescript
// In PDFProcessService
async ocrPDF(pdfPath: string, concurrency?: number): Promise<string> {
  // ... convert PDF to images ...

  const tasks = pages.map((page, index) => async () => {
    return await scheduler!.addJob('recognize', page.path);
  });

  const result = await this.parallelTaskService.executeWithProgress(
    tasks,
    (completed, total) => {
      this.logger.log(`📊 OCR 进度: ${completed}/${total} 页`);
    }
  );

  // ... merge results ...
}
```

## Troubleshooting

### High Memory Usage

- Reduce concurrency
- Process in smaller batches
- Monitor memory with `process.memoryUsage()`

### Slow Performance

- Check if tasks are CPU-bound or I/O-bound
- Adjust concurrency accordingly
- Profile individual task performance

### Task Timeouts

- Increase timeout value
- Optimize individual task performance
- Check for blocking operations

## License

This module is part of the ai-agent-monorepo project.
