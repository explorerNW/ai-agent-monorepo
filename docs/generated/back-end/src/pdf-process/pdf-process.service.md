### 📄 文件元信息

- **文件路径**: `back-end/src/pdf-process/pdf-process.service.ts`
- **模块职责**: PDF OCR 与压缩处理服务（支持文本识别、PDF 解析及内容优化）
- **关联模块**: [无]

---

### 📦 API 知识条目

#### PDFProcessService constructor

````typescript
constructor(
    private readonly pdfPath: string,
    private readonly contentType?: 'text' | 'image',
    private readonly compressionLevel?: number
) { }
- **语义标签**: 构造函数，PDF 处理初始化
- **完整签名**: `export class PDFProcessService` (无具体类型定义)
- **设计意图**: 服务类用于管理 PDF OCR、压缩及内容预处理逻辑
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| pdfPath | string | true | 'back-end/src/pdf-process' | PDF 文件路径配置项 |
| contentType | string | false | 'text' | OCR 内容类型标识 (文本或图像) |
| compressionLevel | number | false | 1-5 | 压缩级别参数，默认值：2 |

- **返回值/实例方法**: `compressPDF()` / `ocrPDF()`: PDF 处理函数
- **使用约束**:
  - compressPDF: 需确保输入为有效 PDF 对象并配置正确路径
  - ocrPDF: 依赖 OCR 模型，默认值：'text', 'image' (文本识别优先)
  - 线程安全：无特殊要求（同步执行）
- **Code Review 检查点**:
  1. `pdfPath` 必须为真实文件路径且包含扩展名验证；
  2. `contentType` 需明确指定内容类型，避免误处理非文本数据。

---

#### compressPDF (压缩 PDF)
```typescript
export function compressPDF(pdf: string, contentType?: 'text' | 'image', compressionLevel?: number): Promise<string> { }
- **语义标签**: 异步函数，文件压缩与优化
- **完整签名**: `compressPDF` (无具体类型定义)
- **设计意图**: 处理 PDF 内容并应用预设压缩策略（如去除多余页、调整大小）
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| pdfPath | string | true | 'back-end/src/pdf-process' | PDF 文件路径配置项 |
| contentType | string | false | 'text' | OCR 内容类型标识 (文本或图像) |
| compressionLevel | number | false | 1-5 | 压缩级别参数，默认值：2 |

- **返回值/实例方法**: `compressPDF()` / `ocrPDF()`: PDF 处理函数
- **使用约束**:
  - compressPDF: 需确保输入为有效 PDF 对象并配置正确路径；
  - ocrPDF: 依赖 OCR 模型，默认值：'text', 'image' (文本识别优先)
- **Code Review 检查点**:
  1. `pdfPath` 必须包含扩展名验证（如 .docx）；
  2. `contentType` 需明确指定内容类型以匹配预期处理逻辑。

---

#### ocrPDF (OCR PDF)
```typescript
export function ocrPDF(pdf: string, contentType?: 'text' | 'image'): Promise<string> { }
- **语义标签**: OCR 文本识别，支持多格式转换
- **完整签名**: `ocrPDF` (无具体类型定义)
- **设计意图**: 将 PDF 内容转换为可解析的文本形式（如表格、公式等）
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| pdfPath | string | true | 'back-end/src/pdf-process' | PDF 文件路径配置项 |
| contentType | string | false | 'text', 'image' | OCR 内容类型标识 (文本或图像)
- **返回值/实例方法**: `ocrPDF()` / `compressPDF()`: PDF 处理函数
- **使用约束**:
  - ocrPDF: 依赖 OCR 模型，默认值：'text', 'image'；
  - compressPDF: 需确保输入为有效 PDF 对象并配置正确路径。

---

#### Code Review Checkpoints Summary (API Design Intent)
| API | Key Focus Areas for Reviewer |
|-----|-------------------------------|
| `compressPDF` | Path validity, content type consistency，compression level selection |
| `ocrPDF` | OCR model configuration accuracy，text extraction fidelity |

```typescript
// 示例调用验证点：
const result = compressPDF('test.pdf', 'image');
if (result === null) throw new Error("压缩失败"); // 检查返回值类型与预期行为
````
