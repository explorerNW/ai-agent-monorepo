### 📄 文件元信息

- **文件路径**: `back-end/src/analysis/analytics.controller.ts`
- **模块职责**: 负责用户数据流分析、WebVitals统计及异常处理逻辑
- **关联模块**: [analytics.service, utils]

---

### 📦 API 知识条目

#### AnalyticsController

- **语义标签**: `user认证`, `JWT`, `Token刷新`, `异步`
- **完整签名**: ```typescript
  export class AnalyticsController {
  constructor(private user: User | null = undefined) {} // line:20, is_export:true
  }

````
**设计意图**: 初始化用户上下文，支持数据流分析逻辑。

#### track
- **语义标签**: `异步`, `异常处理`
- **完整签名**: ```typescript
track(userId: string): void { ... } // line:24, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### getWebVitalsStats

- **语义标签**: `统计`, `响应时间`, `并发处理`
- **完整签名**: ```typescript
  getWebVitalsStats(): { metrics: WebMetrics; timestamp: string } // line:104, is_export:true

````
**设计意图**: 获取用户会话的实时性能指标。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

````
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)
- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
constructor(private user?: User | null = undefined); // line:20, is_export:true
````

**参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                         |
| ------ | ------ | ---- | ----------- | -------------------------------- |
| userId | string | true | -           | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`  
  **使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (构造函数)

- **语义标签**: `初始化`, `数据流`
- **完整签名**: ```typescript
  constructor(private user?: User | null = undefined); // line:20, is_export:true

```
**参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| userId | string | true | - | 用户唯一标识符，用于追踪数据流。 |

- **返回值/实例方法**: `track`
**使用约束**: 异步调用需确保线程安全，异常抛出时记录日志并返回错误码。

#### track (
```
