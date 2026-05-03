# Parallel Task Module - Architecture & Flow

## Module Structure

```
parallel-task/
├── parallel-task.service.ts          # Core service implementation
├── parallel-task.module.ts           # NestJS module definition
├── parallel-task.controller.ts       # Example API endpoints
├── parallel-task.service.spec.ts     # Unit tests
├── index.ts                          # Barrel exports
├── README.md                         # Complete documentation
├── USAGE_EXAMPLES.md                 # Real-world examples
├── QUICK_START.md                    # Quick start guide
└── IMPLEMENTATION_SUMMARY.md         # Implementation details
```

## Class Diagram

```
┌─────────────────────────────────────────────────┐
│           ParallelTaskService                    │
├─────────────────────────────────────────────────┤
│ - logger: Logger                                 │
├─────────────────────────────────────────────────┤
│ + getCPUCores(): number                          │
│ + calculateOptimalConcurrency(max?: number):     │
│     number                                       │
│ + executeParallel<T>(tasks, options):            │
│     ParallelExecutionResult<T>                   │
│ + processItems<TInput, TOutput>(items,           │
│     processor, options):                         │
│     ParallelExecutionResult<TOutput>             │
│ + executeWithProgress<T>(tasks, onProgress,      │
│     options):                                    │
│     ParallelExecutionResult<T>                   │
│ - withTimeout<T>(promise, timeout, index):       │
│     Promise<T>                                   │
└─────────────────────────────────────────────────┘
                    ▲
                    │ uses
                    │
┌─────────────────────────────────────────────────┐
│              Node.js OS Module                    │
│  os.cpus() - Detect CPU cores                    │
└─────────────────────────────────────────────────┘
```

## Execution Flow

### 1. executeParallel Flow

```
User Calls executeParallel(tasks, options)
                │
                ▼
    ┌──────────────────────┐
    │ Calculate Concurrency │
    │ (auto or manual)      │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │   Split into Batches  │
    │  (based on concurrency)│
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Process Each Batch   │
    │  ┌────────────────┐  │
    │  │ Batch 1        │  │
    │  │ - Run tasks    │  │
    │  │ - Collect      │  │
    │  │   results      │  │
    │  └────────────────┘  │
    │  ┌────────────────┐  │
    │  │ Batch 2        │  │
    │  │ - Run tasks    │  │
    │  │ - Collect      │  │
    │  │   results      │  │
    │  └────────────────┘  │
    │         ...           │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Merge All Results   │
    │  - Sort by index     │
    │  - Calculate summary │
    │  - Track duration    │
    └──────────┬───────────┘
               │
               ▼
    Return ParallelExecutionResult
```

### 2. Error Handling Flow

```
Task Execution
      │
      ├──────────────┐
      │              │
      ▼              ▼
  Success        Failure
      │              │
      │         ┌────┴─────┐
      │         │ Check    │
      │         │ continue │
      │         │OnError?  │
      │         └────┬─────┘
      │              │
      │         Yes  │  No
      │          │   │
      │          ▼   ▼
      │     Continue Stop
      │     Execute Remaining
      │         │
      └────┬────┘
           │
           ▼
    Aggregate Results
    - Mark failed tasks
    - Continue with next batch
```

### 3. Timeout Control Flow

```
Task Started
     │
     ├──► Execute Task Promise
     │
     ├──► Start Timeout Timer
     │
     │         Task Completes?
     │        ┌────────┴────────┐
     │       Yes               No
     │        │                 │
     │        ▼                 ▼
     │   Clear Timer      Timeout Reached
     │   Return Result           │
     │                           ▼
     │                    Reject with
     │                    Timeout Error
     │
     └──► Return to Caller
```

## Integration with PDF Processing

```
┌─────────────────────────────────────────────────┐
│           PDFProcessController                   │
│  POST /pdf/process                               │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│           PDFProcessService                      │
│  1. Compress PDF                                 │
│  2. Convert PDF to Images                        │
│  3. OCR Recognition (Parallel)                   │
│  4. Save Results                                 │
└──────────────┬──────────────────────────────────┘
               │ Uses
               ▼
┌─────────────────────────────────────────────────┐
│          ParallelTaskService                     │
│  • Create Worker Pool                            │
│  • Distribute pages to workers                   │
│  • Track progress                                │
│  • Handle errors                                 │
│  • Merge results                                 │
└──────────────┬──────────────────────────────────┘
               │ Manages
               ▼
┌─────────────────────────────────────────────────┐
│         Tesseract.js Workers                     │
│  • Worker 1: Process page 1, 7, 13...           │
│  • Worker 2: Process page 2, 8, 14...           │
│  • Worker 3: Process page 3, 9, 15...           │
│  • ...                                           │
└─────────────────────────────────────────────────┘
```

## Data Flow Example: OCR Processing

```
Input: PDF File (50 pages)
         │
         ▼
┌────────────────────┐
│ pdf2pic Conversion  │
│ PDF → 50 PNG images │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Calculate Optimal   │
│ Concurrency         │
│ CPU: 8 cores        │
│ Concurrency: 6      │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Create Worker Pool  │
│ 6 Tesseract Workers │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────────┐
│ ParallelTaskService Execution      │
│                                    │
│ Batch 1 (Pages 1-6):              │
│   Worker 1 → Page 1               │
│   Worker 2 → Page 2               │
│   Worker 3 → Page 3               │
│   Worker 4 → Page 4               │
│   Worker 5 → Page 5               │
│   Worker 6 → Page 6               │
│   Wait for all to complete        │
│                                    │
│ Batch 2 (Pages 7-12):             │
│   Worker 1 → Page 7               │
│   ...                             │
│                                    │
│ ... (Continue until all pages)    │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Merge Results      │
│ Sort by page number│
│ Combine text       │
└────────┬───────────┘
         │
         ▼
Output: Full Text (50 pages)
Duration: ~8 seconds
(vs ~30s sequential)
```

## Performance Comparison

### Sequential Processing

```
Page 1 [====] 2s
Page 2 [====] 2s
Page 3 [====] 2s
Page 4 [====] 2s
Page 5 [====] 2s
Page 6 [====] 2s
Total: 12s (6 pages × 2s)
```

### Parallel Processing (3 workers)

```
Worker 1: Page 1 [====] 2s
Worker 2: Page 2 [====] 2s
Worker 3: Page 3 [====] 2s
Worker 1: Page 4 [====] 2s
Worker 2: Page 5 [====] 2s
Worker 3: Page 6 [====] 2s
Total: 4s (2 batches × 2s)
Speedup: 3x
```

## Memory Management

```
Large Dataset (1000 items)
         │
         ▼
┌────────────────────┐
│ Split into Batches  │
│ Concurrency: 10     │
│ Batch Size: 10      │
│ Total Batches: 100  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Process Batch 1     │
│ Items 1-10          │
│ Memory: Low         │
└────────┬───────────┘
         │ Complete
         ▼
┌────────────────────┐
│ Garbage Collection  │
│ Free Batch 1 memory │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Process Batch 2     │
│ Items 11-20         │
│ Memory: Low         │
└────────┬───────────┘
         │
         ▼
    ... (Repeat)
```

## Error Scenarios

### Scenario 1: Single Task Fails (continueOnError: true)

```
Tasks: [T1, T2, T3, T4, T5]

T1 ✓ Success
T2 ✗ Failed
T3 ✓ Success
T4 ✓ Success
T5 ✗ Failed

Result:
- success: true
- summary.succeeded: 3
- summary.failed: 2
- All results returned
```

### Scenario 2: Single Task Fails (continueOnError: false)

```
Tasks: [T1, T2, T3, T4, T5]

T1 ✓ Success
T2 ✗ Failed
   ↓ STOP
T3 ⨯ Not executed
T4 ⨯ Not executed
T5 ⨯ Not executed

Result:
- success: false
- summary.succeeded: 1
- summary.failed: 1
- Partial results returned
```

### Scenario 3: Task Timeout

```
Task with timeout: 500ms

Start Timer ──► Execute Task
                    │
              Completes in 200ms?
              Yes ──► Clear timer, return result
              No  ──► Timeout at 500ms
                      Reject with error
```

## Configuration Decision Tree

```
Need to execute tasks in parallel?
         │
         ├─► How many tasks?
         │    │
         │    ├─ < 10 tasks
         │    │   └─► Use default concurrency
         │    │
         │    ├─ 10-100 tasks
         │    │   └─► Use auto-detect or set concurrency
         │    │
         │    └─ > 100 tasks
         │        └─► Use batching, monitor memory
         │
         ├─► What type of tasks?
         │    │
         │    ├─ CPU-intensive (image processing)
         │    │   └─► Use 50-75% CPU cores
         │    │
         │    ├─ I/O operations (API calls)
         │    │   └─► Can use 2-3x CPU cores
         │    │
         │    └─ Mixed workload
         │        └─► Profile and adjust
         │
         ├─► Need progress tracking?
         │    │
         │    ├─ Yes
         │    │   └─► Use executeWithProgress()
         │    │
         │    └─ No
         │        └─► Use executeParallel()
         │
         ├─► Have data items to process?
         │    │
         │    ├─ Yes
         │    │   └─► Use processItems()
         │    │
         │    └─ No
         │        └─► Use executeParallel()
         │
         └─► Need timeout control?
              │
              ├─ Yes
              │   └─► Set timeout option
              │
              └─ No
                  └─► Leave timeout undefined
```

## Monitoring & Observability

```
┌─────────────────────────────────────┐
│     Execution Metrics               │
├─────────────────────────────────────┤
│ • Total Duration: 1234ms            │
│ • Tasks Executed: 100               │
│ • Successful: 95                    │
│ • Failed: 5                         │
│ • Average Task Time: 12.3ms         │
│ • Concurrency Used: 6               │
│ • CPU Cores Available: 8            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Logging Output                  │
├─────────────────────────────────────┤
│ 🚀 开始并行执行 100 个任务，并发数: 6│
│ ✓ 批次 1/17 完成                    │
│ ✓ 批次 2/17 完成                    │
│ ...                                 │
│ ✅ 并行执行完成: 总计 100,           │
│    成功 95, 失败 5, 耗时 1234ms     │
└─────────────────────────────────────┘
```

## Best Practices Visualization

### ✅ DO

```
High Concurrency for I/O:
[API1] [API2] [API3] [API4] [API5] ← Running simultaneously
[API6] [API7] [API8] [API9] [API10]

Low Concurrency for CPU:
[IMG1] [IMG2] [IMG3] ← Limited to prevent overload
[IMG4] [IMG5] [IMG6]

Error Handling:
✓ Check result.summary.failed
✓ Log individual errors
✓ Implement retry logic
```

### ❌ DON'T

```
Too High Concurrency:
[T1][T2][T3][T4][T5][T6][T7][T8][T9][T10]...[T100]
← System overload, context switching overhead

Ignoring Errors:
result.results.forEach(r => r.result)
← May include undefined for failed tasks

No Timeout:
Long-running task hangs forever
← Blocks entire batch
```

## Summary

The Parallel Task Module provides:

- 🎯 **Simple API** - Three main methods for different use cases
- ⚡ **Auto-optimization** - Intelligent CPU core detection
- 🛡️ **Safety** - Comprehensive error handling and timeouts
- 📊 **Observability** - Progress tracking and detailed logging
- 🔄 **Flexibility** - Configurable for various scenarios
- 📦 **Integration** - Seamlessly integrated with existing services

Perfect for any scenario requiring parallel execution in NestJS applications!
