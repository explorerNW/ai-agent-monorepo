### 📄 文件元信息

- **文件路径**: `back-end/src/tesseract/tesseract.module.ts`
- **模块职责**: Tesseract.js OCR 工具封装与异步处理逻辑实现（支持文本识别、OCR 及异常捕获）
- **关联模块**: [tesseract, nodejs]

### 📦 API 知识条目

#### TesseractModule class 成员全限定名 - `Tesseract`类

- **语义标签**: OCR引擎，异步执行，错误处理，参数校验
- **完整签名**: ```typescript
  class Tesseract {
  constructor(
  private config: Config,
  private logger?: Logger | undefined
  ): void;
  }

````
- **设计意图**: 封装复杂的文本识别逻辑，支持配置化与异步执行机制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| config | ConfigObject | yes | { type: 'string', ... } | OCR 配置对象，包含模型、阈值等参数。 |
| logger | Logger | no | undefined | 日志记录器实例（可选）。 |

- **返回值/实例方法**: `Tesseract`类无直接返回值；提供静态辅助函数如 `run()`用于执行识别任务。
- **使用约束**:
  - 异步调用需确保线程安全，避免阻塞主流程。
  - 配置参数必须严格校验类型与必填字段（如 model）。
  - 日志记录器应支持结构化输出便于调试。

#### TesseractModule class 成员全限定名 - `Tesseract`类
- **语义标签**: OCR引擎，异步执行，错误处理，参数校验
- **完整签名**: ```typescript
class Tesseract {
    constructor(
        private config: Config,
        private logger?: Logger | undefined
    ): void;
}
````

#### 辅助函数成员全限定名 - `run()`方法

- **语义标签**: OCR执行，配置管理，日志记录
- **完整签名**: ```typescript
  function run(config: Config): Promise<string> {
  return Tesseract.run(config);
  }

````
- **设计意图**: 提供统一的运行入口函数。

#### 辅助函数成员全限定名 - `run()`方法
- **语义标签**: OCR执行，配置管理，日志记录
- **完整签名**: ```typescript
function run(config: Config): Promise<string> {
    return Tesseract.run(config);
}
````
