# Parallel Task Module - Usage Examples

This document provides practical examples of using the `ParallelTaskModule` in your NestJS applications.

## Quick Start

### 1. Import the Module

```typescript
// In your feature module (e.g., user.module.ts)
import { Module } from '@nestjs/common';
import { ParallelTaskModule } from '../parallel-task/parallel-task.module';
import { UserService } from './user.service';

@Module({
  imports: [ParallelTaskModule],
  providers: [UserService],
})
export class UserModule {}
```

### 2. Inject and Use the Service

```typescript
// In your service (e.g., user.service.ts)
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';

@Injectable()
export class UserService {
  constructor(private readonly parallelTaskService: ParallelTaskService) {}

  // Use it in your methods
  async processUsers() {
    // Your code here
  }
}
```

## Real-World Examples

### Example 1: Batch Email Sending

Send emails to multiple users in parallel:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import { MailService } from './mail.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly parallelTaskService: ParallelTaskService,
    private readonly mailService: MailService,
  ) {}

  async sendBulkEmails(
    recipients: Array<{ email: string; subject: string; body: string }>,
  ) {
    const result = await this.parallelTaskService.processItems(
      recipients,
      async (recipient, index) => {
        try {
          await this.mailService.sendEmail(recipient);
          return {
            email: recipient.email,
            status: 'sent',
            sentAt: new Date().toISOString(),
          };
        } catch (error) {
          this.logger.error(
            `Failed to send email to ${recipient.email}`,
            error,
          );
          throw error;
        }
      },
      {
        concurrency: 10, // Send 10 emails at a time
        timeout: 30000, // 30 seconds timeout per email
        continueOnError: true, // Continue even if some fail
      },
    );

    this.logger.log(
      `Email campaign completed: ${result.summary.succeeded} sent, ${result.summary.failed} failed`,
    );

    return result;
  }
}
```

### Example 2: Data Aggregation from Multiple APIs

Fetch data from multiple external APIs concurrently:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataService {
  constructor(
    private readonly parallelTaskService: ParallelTaskService,
    private readonly httpService: HttpService,
  ) {}

  async aggregateData(apiEndpoints: string[]) {
    const tasks = apiEndpoints.map((url) => async () => {
      const response = await firstValueFrom(this.httpService.get(url));
      return {
        source: url,
        data: response.data,
        fetchedAt: new Date().toISOString(),
      };
    });

    const result = await this.parallelTaskService.executeWithProgress(
      tasks,
      (completed, total) => {
        console.log(`Fetching data: ${completed}/${total} APIs`);
      },
      {
        concurrency: 5,
        timeout: 10000, // 10 seconds per API call
        continueOnError: true,
      },
    );

    // Combine successful results
    const aggregatedData = result.results
      .filter((r) => r.result)
      .map((r) => r.result);

    return {
      data: aggregatedData,
      summary: result.summary,
      duration: result.totalDuration,
    };
  }
}
```

### Example 3: Image Processing Pipeline

Process multiple images with different transformations:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ImageProcessingService {
  constructor(private readonly parallelTaskService: ParallelTaskService) {}

  async processImages(imagePaths: string[], outputDir: string) {
    const result = await this.parallelTaskService.processItems(
      imagePaths,
      async (imagePath, index) => {
        const fileName = path.basename(imagePath);
        const outputPath = path.join(outputDir, `processed_${fileName}`);

        // Read and process image
        const imageBuffer = await fs.readFile(imagePath);
        const processedImage = await sharp(imageBuffer)
          .resize(800, 600, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Save processed image
        await fs.writeFile(outputPath, processedImage);

        return {
          original: imagePath,
          processed: outputPath,
          size: processedImage.length,
        };
      },
      {
        concurrency: 4, // Process 4 images at a time (CPU-intensive)
        continueOnError: true,
      },
    );

    return result;
  }
}
```

### Example 4: Database Bulk Operations

Perform bulk database updates efficiently:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserManagementService {
  constructor(
    private readonly parallelTaskService: ParallelTaskService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async updateUserProfiles(updates: Array<{ userId: number; profile: any }>) {
    const result = await this.parallelTaskService.processItems(
      updates,
      async (update) => {
        const user = await this.userRepository.findOne({
          where: { id: update.userId },
        });

        if (!user) {
          throw new Error(`User ${update.userId} not found`);
        }

        user.profile = update.profile;
        user.updatedAt = new Date();

        await this.userRepository.save(user);

        return {
          userId: update.userId,
          status: 'updated',
        };
      },
      {
        concurrency: 20, // Higher concurrency for I/O operations
        timeout: 5000,
        continueOnError: false, // Stop on first error for data integrity
      },
    );

    return result;
  }
}
```

### Example 5: File Upload to Multiple Storage Services

Upload files to multiple cloud storage providers:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import { S3Service } from './s3.service';
import { GCSService } from './gcs.service';

@Injectable()
export class StorageService {
  constructor(
    private readonly parallelTaskService: ParallelTaskService,
    private readonly s3Service: S3Service,
    private readonly gcsService: GCSService,
  ) {}

  async uploadToMultipleProviders(
    files: Array<{ name: string; buffer: Buffer }>,
  ) {
    const tasks = files.flatMap((file) => [
      // Upload to S3
      async () => {
        const url = await this.s3Service.upload(file.buffer, file.name);
        return {
          file: file.name,
          provider: 'S3',
          url,
        };
      },
      // Upload to GCS
      async () => {
        const url = await this.gcsService.upload(file.buffer, file.name);
        return {
          file: file.name,
          provider: 'GCS',
          url,
        };
      },
    ]);

    const result = await this.parallelTaskService.executeParallel(tasks, {
      concurrency: 10,
      continueOnError: true,
    });

    // Organize results by file
    const uploadsByFile = {};
    result.results.forEach((r) => {
      if (r.result) {
        const { file, provider, url } = r.result;
        if (!uploadsByFile[file]) {
          uploadsByFile[file] = {};
        }
        uploadsByFile[file][provider.toLowerCase()] = url;
      }
    });

    return {
      uploads: uploadsByFile,
      summary: result.summary,
    };
  }
}
```

### Example 6: Web Scraping Multiple Pages

Scrape data from multiple web pages concurrently:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class WebScraperService {
  constructor(private readonly parallelTaskService: ParallelTaskService) {}

  async scrapePages(urls: string[]) {
    const browser = await puppeteer.launch();

    try {
      const result = await this.parallelTaskService.processItems(
        urls,
        async (url, index) => {
          const page = await browser.newPage();

          try {
            await page.goto(url, { waitUntil: 'networkidle0' });

            // Extract data
            const title = await page.title();
            const content = await page.evaluate(() => {
              return document.body.innerText;
            });

            return {
              url,
              title,
              contentLength: content.length,
              scrapedAt: new Date().toISOString(),
            };
          } finally {
            await page.close();
          }
        },
        {
          concurrency: 3, // Be respectful to servers
          timeout: 30000,
          continueOnError: true,
        },
      );

      return result;
    } finally {
      await browser.close();
    }
  }
}
```

### Example 7: PDF Processing Integration

Enhanced PDF processing with progress tracking:

```typescript
import { Injectable } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class EnhancedPDFService {
  constructor(private readonly parallelTaskService: ParallelTaskService) {}

  async mergePDFs(pdfBuffers: Buffer[], outputPath: string) {
    const mergedPdf = await PDFDocument.create();

    const result = await this.parallelTaskService.processItems(
      pdfBuffers,
      async (pdfBuffer, index) => {
        const pdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));

        return {
          index,
          pageCount: pdf.getPageCount(),
        };
      },
      {
        concurrency: 2, // PDF operations are memory-intensive
        continueOnError: false,
      },
    );

    if (!result.success) {
      throw new Error('Failed to merge PDFs');
    }

    const pdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, pdfBytes);

    return {
      totalPages: mergedPdf.getPageCount(),
      processedFiles: result.summary.succeeded,
      duration: result.totalDuration,
    };
  }
}
```

## Advanced Patterns

### Pattern 1: Retry Failed Tasks

```typescript
async executeWithRetry<T>(
  tasks: Array<() => Promise<T>>,
  maxRetries: number = 3,
) {
  let currentTasks = [...tasks];
  let attempt = 1;

  while (attempt <= maxRetries && currentTasks.length > 0) {
    console.log(`Attempt ${attempt}/${maxRetries}`);

    const result = await this.parallelTaskService.executeParallel(
      currentTasks,
      {
        continueOnError: true,
      },
    );

    // Get failed tasks for retry
    const failedTasks = result.results
      .filter((r) => r.error)
      .map((r) => tasks[r.index]);

    if (failedTasks.length === 0) {
      break; // All succeeded
    }

    currentTasks = failedTasks;
    attempt++;

    // Wait before retry (exponential backoff)
    if (attempt <= maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt - 1) * 1000),
      );
    }
  }

  return currentTasks.length === 0;
}
```

### Pattern 2: Rate Limiting

```typescript
async executeWithRateLimit<T>(
  tasks: Array<() => Promise<T>>,
  rateLimit: number, // tasks per second
) {
  const interval = 1000 / rateLimit;
  const results: any[] = [];

  for (let i = 0; i < tasks.length; i += rateLimit) {
    const batch = tasks.slice(i, i + rateLimit);

    const batchResult = await this.parallelTaskService.executeParallel(batch, {
      concurrency: batch.length,
    });

    results.push(...batchResult.results);

    // Wait for next batch
    if (i + rateLimit < tasks.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### Pattern 3: Circuit Breaker

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly resetTimeout: number;

  constructor(threshold: number = 5, resetTimeout: number = 60000) {
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(task: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await task();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
      }, this.resetTimeout);
    }
  }
}
```

## Performance Monitoring

Add monitoring to track performance:

```typescript
import { Injectable } from '@nestjs/common';
import {
  ParallelTaskService,
  ParallelExecutionResult,
} from '../parallel-task/parallel-task.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class MonitoredService {
  constructor(
    private readonly parallelTaskService: ParallelTaskService,
    private readonly metricsService: MetricsService,
  ) {}

  async monitoredExecution<T>(
    operationName: string,
    tasks: Array<() => Promise<T>>,
  ): Promise<ParallelExecutionResult<T>> {
    const startTime = Date.now();

    const result = await this.parallelTaskService.executeParallel(tasks);

    // Record metrics
    this.metricsService.recordOperation({
      name: operationName,
      duration: result.totalDuration,
      totalTasks: result.summary.total,
      succeeded: result.summary.succeeded,
      failed: result.summary.failed,
      avgTaskDuration: result.totalDuration / result.summary.total,
    });

    return result;
  }
}
```

## Testing Tips

### Unit Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ParallelTaskModule } from '../parallel-task/parallel-task.module';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ParallelTaskModule],
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should process items in parallel', async () => {
    const result = await service.processItems([1, 2, 3, 4, 5]);

    expect(result.success).toBe(true);
    expect(result.summary.succeeded).toBe(5);
  });
});
```

### Mocking for Tests

```typescript
const mockParallelTaskService = {
  executeParallel: jest.fn().mockResolvedValue({
    success: true,
    results: [],
    totalDuration: 100,
    summary: { total: 5, succeeded: 5, failed: 0 },
  }),
  processItems: jest.fn().mockResolvedValue({
    success: true,
    results: [],
    totalDuration: 100,
    summary: { total: 5, succeeded: 5, failed: 0 },
  }),
  getCPUCores: jest.fn().mockReturnValue(8),
  calculateOptimalConcurrency: jest.fn().mockReturnValue(6),
};

// In your test module
providers: [
  MyService,
  {
    provide: ParallelTaskService,
    useValue: mockParallelTaskService,
  },
];
```

## Common Pitfalls

### ❌ Don't: Create Too Many Concurrent Tasks

```typescript
// Bad: Too many concurrent CPU-intensive tasks
const result = await this.parallelTaskService.executeParallel(tasks, {
  concurrency: 100, // Will overload CPU
});
```

### ✅ Do: Use Appropriate Concurrency

```typescript
// Good: Let the service calculate optimal concurrency
const result = await this.parallelTaskService.executeParallel(tasks);

// Or specify a reasonable limit
const result = await this.parallelTaskService.executeParallel(tasks, {
  concurrency: Math.min(10, tasks.length),
});
```

### ❌ Don't: Ignore Errors

```typescript
// Bad: Not checking for failures
const result = await this.parallelTaskService.executeParallel(tasks);
return result.results; // May contain errors!
```

### ✅ Do: Handle Errors Properly

```typescript
// Good: Check and handle errors
const result = await this.parallelTaskService.executeParallel(tasks, {
  continueOnError: true,
});

if (result.summary.failed > 0) {
  console.warn(`${result.summary.failed} tasks failed`);
  // Handle failed tasks appropriately
}

return result.results.filter((r) => !r.error).map((r) => r.result);
```

## Conclusion

The `ParallelTaskModule` provides a powerful and flexible way to leverage multi-core CPUs in your NestJS applications. By following these examples and best practices, you can significantly improve the performance of your applications when dealing with batch operations, I/O tasks, or CPU-intensive processing.

For more information, see the main [README.md](./README.md).
