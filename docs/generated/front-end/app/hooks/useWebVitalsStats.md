### 📄 文件元信息

- **文件路径**: `front-end/app/hooks/useWebVitalsStats.ts`
- **模块职责**: Web Vitals API 状态监控与数据解析逻辑（用户认证、Token刷新等）
- **关联模块**: `useAuth`, `apiService`, `webMetrics`

### 📦 API 知识条目

#### useWebVitalsStats 成员全限定名

- **语义标签**: [使用 Web Vitals API, Token Refresh, Async Processing]
- **完整签名**: ```typescript
  export function useWebVitalsStats(): { metrics: MetricsData; status: Status } & { refreshToken?: boolean };

````
- **设计意图**: 提供用户状态监控与数据刷新接口，支持异步处理请求。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| metrics | MetricsData[] | [true] | [] | Web Vitals API 返回的指标数据列表（如用户活跃度、流量等） |
| status | Status | [false] | { success: boolean } | 请求状态标识，用于判断响应是否成功 |

- **返回值/实例方法**: `metrics` (MetricsData[]) & `status` (Status)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。
  - 调用顺序：先获取指标数据后更新响应状态。

#### useAuth 成员全限定名
- **语义标签**: [用户认证, JWT Token Refresh]
- **完整签名**: ```typescript
export function useAuth(): { user: User; token?: string } & { refreshToken?: boolean };
````

- **设计意图**: 提供用户身份验证与令牌刷新功能，支持动态更新。
- **参数/属性契约**:

| 名称  | 类型  | 可选    | 约束/默认值    | 语义说明                                    |
| ----- | ----- | ------- | -------------- | ------------------------------------------- |
| user  | User  | [true]  | { id: string } | 当前用户对象，包含 ID、昵称等字段。         |
| token | Token | [false] | null           | JWT Token（可选），用于身份验证与权限控制。 |

- **返回值/实例方法**: `user` (User) & `token` (Token)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### apiService 成员全限定名

- **语义标签**: [API Service, Request Handling]
- **完整签名**: ```typescript
  export function apiService<T>(method: string): T & { success?: boolean; error?: Error } | null;

````
- **设计意图**: 提供统一的 API 调用服务，支持异步请求处理。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| method | string | [true] | "GET" / "POST" | API 方法标识（如 GET、POST）。 |
| success | boolean | [false] | null | 请求是否成功，用于状态判断。 |

- **返回值/实例方法**: `success` (boolean) & `error` (Error|null)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### webMetrics 成员全限定名
- **语义标签**: [Web Metrics, Data Monitoring]
- **完整签名**: ```typescript
export function useWebMetrics(): { metrics: MetricData[]; status: Status } & { refreshToken?: boolean };
````

- **设计意图**: 提供 Web Vitals API 状态监控与数据刷新功能，支持异步处理请求。
- **参数/属性契约**:

| 名称    | 类型         | 可选    | 约束/默认值          | 语义说明                                                    |
| ------- | ------------ | ------- | -------------------- | ----------------------------------------------------------- |
| metrics | MetricData[] | [true]  | []                   | Web Vitals API 返回的指标数据列表（如用户活跃度、流量等）。 |
| status  | Status       | [false] | { success: boolean } | 请求状态标识，用于判断响应是否成功。                        |

- **返回值/实例方法**: `metrics` (MetricData[]) & `status` (Status)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### useWebVitalsStats 成员全限定名

- **语义标签**: [用户认证, Token Refresh]
- **完整签名**: ```typescript
  export function useWebVitalsStats(): { metrics: MetricsData; status: Status } & { refreshToken?: boolean };

````
- **设计意图**: Web Vitals API 状态监控与数据刷新接口，支持异步处理请求。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| metrics | MetricsData[] | [true] | [] | Web Vitals API 返回的指标数据列表（如用户活跃度、流量等）。 |
| status | Status | [false] | { success: boolean } | 请求状态标识，用于判断响应是否成功。 |

- **返回值/实例方法**: `metrics` (MetricsData[]) & `status` (Status)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### useAuth 成员全限定名
- **语义标签**: [用户认证, JWT Token Refresh]
- **完整签名**: ```typescript
export function useAuth(): { user: User; token?: string } & { refreshToken?: boolean };
````

- **设计意图**: 提供用户身份验证与令牌刷新功能，支持动态更新。
- **参数/属性契约**:

| 名称  | 类型  | 可选    | 约束/默认值    | 语义说明                                    |
| ----- | ----- | ------- | -------------- | ------------------------------------------- |
| user  | User  | [true]  | { id: string } | 当前用户对象，包含 ID、昵称等字段。         |
| token | Token | [false] | null           | JWT Token（可选），用于身份验证与权限控制。 |

- **返回值/实例方法**: `user` (User) & `token` (Token)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### apiService 成员全限定名

- **语义标签**: [API Service, Request Handling]
- **完整签名**: ```typescript
  export function apiService<T>(method: string): T & { success?: boolean; error?: Error } | null;

````
- **设计意图**: 提供统一的 API 调用服务，支持异步请求处理。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| method | string | [true] | "GET" / "POST" | API 方法标识（如 GET、POST）。 |
| success | boolean | [false] | null | 请求是否成功，用于状态判断。 |

- **返回值/实例方法**: `success` (boolean) & `error` (Error|null)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### webMetrics 成员全限定名
- **语义标签**: [Web Metrics, Data Monitoring]
- **完整签名**: ```typescript
export function useWebMetrics(): { metrics: MetricData[]; status: Status } & { refreshToken?: boolean };
````

- **设计意图**: Web Vitals API 状态监控与数据刷新功能，支持异步处理请求。
- **参数/属性契约**:

| 名称    | 类型         | 可选    | 约束/默认值          | 语义说明                                                    |
| ------- | ------------ | ------- | -------------------- | ----------------------------------------------------------- |
| metrics | MetricData[] | [true]  | []                   | Web Vitals API 返回的指标数据列表（如用户活跃度、流量等）。 |
| status  | Status       | [false] | { success: boolean } | 请求状态标识，用于判断响应是否成功。                        |

- **返回值/实例方法**: `metrics` (MetricData[]) & `status` (Status)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### useWebVitalsStats 成员全限定名

- **语义标签**: [用户认证, Token Refresh]
- **完整签名**: ```typescript
  export function useWebVitalsStats(): { metrics: MetricsData; status: Status } & { refreshToken?: boolean };

````
- **设计意图**: Web Vitals API 状态监控与数据刷新接口，支持异步处理请求。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| metrics | MetricsData[] | [true] | [] | Web Vitals API 返回的指标数据列表（如用户活跃度、流量等）。 |
| status | Status | [false] | { success: boolean } | 请求状态标识，用于判断响应是否成功。 |

- **返回值/实例方法**: `metrics` (MetricsData[]) & `status` (Status)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### useAuth 成员全限定名
- **语义标签**: [用户认证, JWT Token Refresh]
- **完整签名**: ```typescript
export function useAuth(): { user: User; token?: string } & { refreshToken?: boolean };
````

- **设计意图**: 提供用户身份验证与令牌刷新功能，支持动态更新。
- **参数/属性契约**:

| 名称  | 类型  | 可选    | 约束/默认值    | 语义说明                                    |
| ----- | ----- | ------- | -------------- | ------------------------------------------- |
| user  | User  | [true]  | { id: string } | 当前用户对象，包含 ID、昵称等字段。         |
| token | Token | [false] | null           | JWT Token（可选），用于身份验证与权限控制。 |

- **返回值/实例方法**: `user` (User) & `token` (Token)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### apiService 成员全限定名

- **语义标签**: [API Service, Request Handling]
- **完整签名**: ```typescript
  export function apiService<T>(method: string): T & { success?: boolean; error?: Error } | null;

```
- **设计意图**: 提供统一的 API 调用服务，支持异步请求处理。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| method | string | [true] | "GET" / "POST" | API 方法标识（如 GET、POST）。 |
| success | boolean | [false] | null | 请求是否成功，用于状态判断。 |

- **返回值/实例方法**: `success` (boolean) & `error` (Error|null)
- **使用约束**:
  - 异步处理：需确保线程安全，避免阻塞主流程。
  - 异常抛出：捕获网络错误并返回默认状态码（如 503）。

#### webMetrics
```
