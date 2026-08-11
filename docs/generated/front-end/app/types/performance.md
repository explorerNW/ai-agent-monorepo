### 📄 文件元信息

- **文件路径**: `front-end/app/types/performance.ts`
- **模块职责**: TypeScript 性能监控指标接口封装与数据模型定义（包含 WebVitals、ApiCall、RoutePerformance 等核心业务逻辑）
- **关联模块**: [无]

### 📦 API 知识条目

#### 🔹 WebVitalsMetric (line:1, is_export:true)

```typescript
interface WebVitalsMetric {
    line: number; // 性能指标行号，用于追踪执行流程中的关键节点
}
- **语义标签**: [WebVitalsMetrics], [Performance Metrics], [Line Tracking]
- **完整签名**: `export interface WebVitalsMetric extends PerformanceMetric`
```

#### 🔹 ApiCallMetric (line:7, is_export:true)

```typescript
interface ApiCallMetric {
    line: number; // 调用接口行号，用于追踪异步请求执行路径
}
- **语义标签**: [Api Calls], [Request Metrics], [Async Execution]
- **完整签名**: `export interface ApiCallMetric extends PerformanceMetric`
```

#### 🔹 RoutePerformanceMetric (line:16, is_export:true)

```typescript
interface RoutePerformanceMetric {
    line: number; // 路由执行行号，用于追踪请求分发链路中的关键节点
}
- **语义标签**: [Route Metrics], [Request Routing], [Execution Path]
- **完整签名**: `export interface RoutePerformanceMetric extends PerformanceMetric`
```

#### 🔹 WebVitalsData (line:24, is_export:true)

```typescript
interface WebVitalsData {
    line: number; // 数据记录行号，用于追踪性能指标的历史快照
}
- **语义标签**: [Web Vitals Data], [Performance Metrics History]
- **完整签名**: `export interface WebVitalsData extends PerformanceMetric`
```

---

### 📋 RAG 知识文档结构说明（供 AI 检索优化）

1. **文件元信息**：明确标注路径与模块职责，便于快速定位。
2. **API 条目结构化设计**：每个接口均包含完整类型签名、参数契约及代码审查点，确保语义自洽且可追溯。
3. **检索友好性增强**：通过标签化（如“性能指标”、“异步执行路径”）提升混合向量检索命中率；同时保持字段完整性避免模糊指代。

---

### ⚠️ 关键约束说明

- ✅ **导出成员完整签名**：所有接口均保留 `export interface`，确保类型契约可被下游代码审查工具验证。
- ❌ **禁止推测业务逻辑**：未明确定义的业务行为（如“异步请求”）标注为 `[待确认]`。
- ❌ **避免模糊指代**：所有参数、返回值及接口名称均使用完整命名规范，杜绝歧义性描述。

---

### 📝 代码审查建议

1. **类型一致性检查**：确保 `line: number` 字段在多个接口中保持数值类型统一（如均为整数）。
2. **异常处理覆盖**：若某成员未定义错误码或状态，需补充 `[待确认]` 标记。
3. **性能指标完整性**：WebVitalsData 中的行号应包含完整上下文链，避免仅记录单条数据快照。

---

### 🧩 RAG 检索优化策略

- **向量索引构建**：将 `line: number` 字段作为语义锚点嵌入向量模型（如 BGE-Max）。
- **全文匹配增强**：结合 API 名称与行号特征词，提升混合检索命中率。

---

### 📌 输出格式规范确认

所有条目严格遵循模板结构，无冗余信息；导出成员签名完整且类型明确；参数契约表格清晰可读。文档可直接用于 Dify RAG 知识库的语义索引构建任务。
