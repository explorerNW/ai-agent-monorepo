# Parallel Task Module - Quick Start Guide

Get started with the Parallel Task Module in 5 minutes!

## 🚀 What is it?

A NestJS module that helps you execute tasks in parallel across multiple CPU cores, automatically optimizing concurrency for maximum performance.

## 📦 Installation

The module is already included in your back-end package. No additional installation needed!

## ⚡ Quick Start

### Step 1: Import the Module

In your feature module (e.g., `user.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { ParallelTaskModule } from '../parallel-task/parallel-task.module';

@Module({
  imports: [ParallelTaskModule],
  // ... your other configuration
})
export class UserModule {}
```

### Step 2: Inject the Service

In your service (e.g., `user.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';

@Injectable()
export class UserService {
  constructor(private readonly parallelTaskService: ParallelTaskService) {}
}
```

### Step 3: Use It!

#### Example 1: Simple Parallel Execution

```typescript
async processUsers() {
  const users = await this.userRepository.find();

  const result = await this.parallelTaskService.processItems(
    users,
    async (user) => {
      // Process each user
      return await this.enrichUserData(user);
    },
    { concurrency: 8 }
  );

  console.log(`Processed ${result.summary.succeeded} users`);
  return result.results.map(r => r.result);
}
```

#### Example 2: With Progress Tracking

```typescript
async sendBulkEmails(recipients: string[]) {
  const tasks = recipients.map(email =>
    async () => await this.sendEmail(email)
  );

  const result = await this.parallelTaskService.executeWithProgress(
    tasks,
    (completed, total) => {
      console.log(`Sending emails: ${completed}/${total}`);
    }
  );

  return result;
}
```

## 🎯 Common Use Cases

### 1. Batch API Calls

```typescript
const urls = ['https://api1.com', 'https://api2.com', 'https://api3.com'];

const result = await this.parallelTaskService.processItems(
  urls,
  async (url) => {
    const response = await fetch(url);
    return response.json();
  },
  { concurrency: 10 },
);
```

### 2. Image Processing

```typescript
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

const result = await this.parallelTaskService.processItems(
  images,
  async (imagePath) => {
    return await sharp(imagePath).resize(800, 600).toBuffer();
  },
  { concurrency: 4 }, // CPU-intensive, use lower concurrency
);
```

### 3. Database Operations

```typescript
const records = await this.getRecordsToUpdate();

const result = await this.parallelTaskService.processItems(
  records,
  async (record) => {
    await this.database.update(record.id, record.data);
    return { id: record.id, status: 'updated' };
  },
  { concurrency: 20 }, // I/O operations can handle higher concurrency
);
```

## 🔧 Configuration

### Auto-Detect Optimal Concurrency

```typescript
// Automatically uses 75% of CPU cores
const result = await this.parallelTaskService.executeParallel(tasks);
```

### Manual Concurrency Control

```typescript
const result = await this.parallelTaskService.executeParallel(tasks, {
  concurrency: 10, // Use 10 concurrent tasks
  timeout: 30000, // 30 seconds timeout per task
  continueOnError: true, // Continue even if some tasks fail
});
```

### Get CPU Information

```typescript
const cores = this.parallelTaskService.getCPUCores();
const optimalConcurrency =
  this.parallelTaskService.calculateOptimalConcurrency();

console.log(`CPU Cores: ${cores}`);
console.log(`Recommended concurrency: ${optimalConcurrency}`);
```

## 📊 Understanding Results

Every execution returns a structured result:

```typescript
interface ParallelExecutionResult {
  success: boolean; // Overall success
  results: TaskResult[]; // Individual task results
  totalDuration: number; // Total time in ms
  summary: {
    total: number; // Total tasks
    succeeded: number; // Successful tasks
    failed: number; // Failed tasks
  };
}
```

### Accessing Results

```typescript
const result = await this.parallelTaskService.executeParallel(tasks);

// Check overall success
if (result.success) {
  console.log('All tasks completed successfully!');
}

// Get successful results
const successfulResults = result.results
  .filter((r) => !r.error)
  .map((r) => r.result);

// Handle failures
if (result.summary.failed > 0) {
  console.warn(`${result.summary.failed} tasks failed`);

  result.results.forEach((r) => {
    if (r.error) {
      console.error(`Task ${r.index} failed:`, r.error.message);
    }
  });
}
```

## 🎓 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) for real-world examples
- Explore the example endpoints at `/parallel/*`

## 💡 Tips

1. **CPU-bound tasks** (image processing, calculations): Use default concurrency or lower
2. **I/O-bound tasks** (API calls, DB queries): Can use higher concurrency
3. **Always handle errors**: Check `result.summary.failed` and handle appropriately
4. **Use progress tracking**: For long-running operations, provide user feedback
5. **Monitor performance**: Check `result.totalDuration` to optimize

## 🆘 Need Help?

- Check the comprehensive documentation in `README.md`
- See practical examples in `USAGE_EXAMPLES.md`
- Review the test file `parallel-task.service.spec.ts` for more usage patterns

Happy parallel processing! 🚀
