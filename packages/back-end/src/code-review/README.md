# Code Review Service - Diff Processing

## Overview

The code review service processes GitHub Pull Requests by analyzing code changes using AI (Dify). To ensure high-quality reviews and efficient processing, the service implements sophisticated diff cleaning and slicing strategies.

## Diff Processing Pipeline

### 1. Fetch Raw Diff

- Retrieve the complete diff from GitHub's `diff_url`
- Validate that the diff is not empty

### 2. Clean and Slice Diff

The raw diff undergoes three stages of processing:

#### Stage 1: Split by File

- Parse the diff using Git's file boundaries (`diff --git a/... b/...`)
- Extract individual file diffs with complete metadata
- Each file becomes a potential review unit

#### Stage 2: Filter Irrelevant Files

Automatically exclude files that don't need code review:

**Excluded Patterns:**

- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `*.lock`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.svg`, `.ico`, `.webp`
- Binaries: `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.zip`, `.tar`, `.gz`
- Minified: `.min.js`, `.min.css`

**Excluded Directories:**

- `node_modules/`, `dist/`, `build/`, `.next/`
- `__pycache__/`, `.git/`, `vendor/`

#### Stage 3: Control Chunk Size

For files exceeding the size threshold (3000 characters):

- **Split by Hunk**: Use Git hunk headers (`@@ -line,count +line,count @@`) as natural boundaries
- **Smart Merging**: Combine small hunks into chunks up to the threshold
- **Preserve Integrity**: Never split in the middle of a hunk

### 3. Review Each Chunk

- Upload each diff chunk as a file to Dify
- Call Dify's chat-messages API for AI analysis
- Collect review comments for each file/chunk

### 4. Merge and Publish Results

- Combine all review comments into a structured report
- Post the report as a GitHub PR comment
- Update PR status based on review findings

## Configuration

```typescript
const DIFF_CONFIG = {
  MAX_CHUNK_SIZE: 3000,  // Maximum characters per chunk
  EXCLUDED_PATTERNS: [...],  // File patterns to exclude
  EXCLUDED_DIRS: [...],      // Directories to exclude
};
```

## Example Diff Processing

### Input: Raw GitHub Diff

```diff
diff --git a/package-lock.json b/package-lock.json
index abc123..def456 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,5 +1,5 @@
 {
-  "version": "1.0.0",
+  "version": "1.0.1",
   ...
 }

diff --git a/src/components/Button.tsx b/src/components/Button.tsx
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/components/Button.tsx
@@ -0,0 +1,15 @@
+import React from 'react';
+
+interface ButtonProps {
+  label: string;
+  onClick: () => void;
+}
+
+export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
+  return (
+    <button onClick={onClick}>
+      {label}
+    </button>
+  );
+};
+

diff --git a/node_modules/some-package/index.js b/node_modules/some-package/index.js
new file mode 100644
index 0000000..xyz789
--- /dev/null
+++ b/node_modules/some-package/index.js
@@ -0,0 +1,100 @@
+// This should be filtered out
+...
```

### After Processing:

**Filtered Files:**

- ❌ `package-lock.json` (excluded: lock file)
- ✅ `src/components/Button.tsx` (kept: source code)
- ❌ `node_modules/some-package/index.js` (excluded: node_modules directory)

**Final Chunks:**

```typescript
[
  {
    fileName: 'src/components/Button.tsx',
    content:
      'diff --git a/src/components/Button.tsx b/src/components/Button.tsx\n...',
    charCount: 245,
    hunkCount: 1,
  },
];
```

## Benefits

1. **Improved AI Accuracy**: Smaller, focused diffs allow LLMs to provide more detailed and accurate reviews
2. **Better Performance**: Parallel processing of independent file chunks
3. **Noise Reduction**: Eliminates irrelevant changes from review
4. **Scalability**: Handles large PRs by breaking them into manageable pieces
5. **Context Preservation**: Maintains complete diff structure within each chunk

## Example Output

```markdown
### 🤖 AI 代码审查报告

### 📄 src/components/Button.tsx

**Review Comments:**

- Consider adding proper error handling for the click handler
- The prop types could be more specific...

---

### 📄 src/utils/helpers.ts

**Review Comments:**

- This function could benefit from memoization
- Consider edge cases for empty input...

---

### 📄 src/styles/theme.css

**Review Comments:**

- Great use of CSS variables for theming!
- No issues found.
```

## Logging

The service provides detailed logging throughout the process:

- Original diff size
- Number of files detected
- Number of files after filtering
- Number of final chunks created
- Per-file processing details

This helps monitor performance and debug issues.

## Testing

To test the diff processing logic:

```bash
# Run the backend service
cd packages/back-end
npm run start:dev

# Trigger a webhook (or use a test payload)
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

The logs will show:

```
开始清洗 Diff，原始大小: 15234 字符
识别到 12 个文件变更
排除文件: package-lock.json
排除文件: node_modules/lodash/index.js
过滤后剩余 5 个文件
文件 src/components/LargeComponent.tsx 过大 (4521 字符)，按 Hunk 拆分
文件 src/components/LargeComponent.tsx 拆分为 2 个片段
最终生成 7 个审查片段
```
