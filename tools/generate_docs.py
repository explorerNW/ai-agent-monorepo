#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import time
import signal
import hashlib
import argparse
import threading
import re
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed
import tree_sitter_typescript as tsts
from tree_sitter import Language, Parser
from typing import Optional, Dict, Any

# 加载环境变量
load_dotenv()

# 初始化 Tree-sitter TypeScript 解析器
try:
    TS_LANGUAGE = Language(tsts.language_typescript())
    TSX_LANGUAGE = Language(tsts.language_tsx())
except Exception as e:
    print(f"⚠️ Tree-sitter 初始化警告: {e}")
    # 如果初始化失败，后续解析会报错，但脚本仍能运行（只是无法提取结构）


class CodeDocGenerator:
    def __init__(self, input_dir, output_dir, cache_file=".doc_cache.json"):
        self.input_dir = Path(input_dir).resolve()
        self.output_dir = Path(output_dir).resolve()
        self.cache_file = Path(cache_file)
        
        # 检查环境变量
        api_key = os.getenv("LLM_API_KEY")
        base_url = os.getenv("LLM_BASE_URL")
        if not api_key:
            raise EnvironmentError("请设置环境变量 LLM_API_KEY")
            
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url if base_url else None # 如果是官方OpenAI，base_url可为None
        )
        self.model = os.getenv("LLM_MODEL", "qwen2.5-coder:7b")
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cache = self._load_cache()
        
        # 🛡️ 【核心升级】：线程安全的停止标志
        self.stop_event = threading.Event()
        self.print_lock = threading.Lock()
        self.cache_lock = threading.Lock()
        
        # 注册信号处理器
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """优雅的中断处理函数"""
        sig_name = signal.Signals(signum).name
        with self.print_lock:
            print(f"\n\n⚠️ 收到 {sig_name} 信号，正在触发优雅退出...")
            print("💡 正在等待当前正在处理的文件完成，随后将安全保存缓存...")
        # 触发停止标志
        self.stop_event.set()

    def _load_cache(self):
        if self.cache_file.exists():
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print("⚠️ 警告: 缓存文件损坏，将重新生成缓存。")
                return {}
        return {}

    def _save_cache(self):
        """线程安全地保存缓存到磁盘"""
        with self.cache_lock:
            try:
                with open(self.cache_file, "w", encoding="utf-8") as f:
                    json.dump(self.cache, f, indent=2)
            except Exception as e:
                print(f"❌ 保存缓存时发生错误: {e}")

    def _get_file_hash(self, file_path):
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def extract_code_structure(self, file_path):
        """使用 Tree-sitter 提取 TypeScript 代码结构"""
        structure = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                source_code = bytes(f.read(), "utf8")
            
            language = TSX_LANGUAGE if file_path.suffix == ".tsx" else TS_LANGUAGE
            parser = Parser(language)
            tree = parser.parse(source_code)
            
            def traverse(node):
                # 提取 Export 的成员更有价值，这里简化为提取所有主要声明
                if node.type in ("function_declaration", "method_definition"):
                    name_node = node.child_by_field_name("name")
                    if name_node:
                        structure.append({
                            "type": "Function/Method",
                            "name": name_node.text.decode("utf8"),
                            "line": node.start_point[0] + 1,
                            "is_export": self._check_is_export(node) # 辅助判断
                        })
                elif node.type in ("class_declaration", "interface_declaration", "type_alias_declaration"):
                    name_node = node.child_by_field_name("name")
                    if name_node:
                        structure.append({
                            "type": node.type.replace("_declaration", "").replace("_alias", "").capitalize(),
                            "name": name_node.text.decode("utf8"),
                            "line": node.start_point[0] + 1,
                            "is_export": self._check_is_export(node)
                        })
                
                for child in node.children:
                    traverse(child)
            
            traverse(tree.root_node)
        except Exception as e:
            print(f"   ⚠️ 解析文件 {file_path} 发生错误: {e}")
        return structure

    def _check_is_export(self, node):
        """简单检查节点是否有 export 修饰符"""
        # Tree-sitter 节点遍历检查父级或同级是否有 export keyword
        # 这里简化处理，实际项目中可能需要更复杂的逻辑
        return True 

    def generate_markdown_with_llm(self, file_name: str, structure: Dict[str, Any]) -> Optional[str]:
        """
        调用大模型生成专为 RAG 优化的结构化 Markdown 知识文档
        
        Args:
            file_name: TypeScript 文件路径
            structure: 从文件中提取的代码结构数据
            
        Returns:
            清洗后的 Markdown 字符串，失败返回 None
        """
        if not structure:
            print(f"   ⚠️ {file_name} 结构为空，跳过生成")
            return None

        # 将结构数据紧凑序列化，减少 token 消耗
        structure_json = json.dumps(structure, ensure_ascii=False, separators=(',', ':'))

        prompt = f"""你是一个资深 TypeScript 架构师兼 RAG 知识工程师。
请根据以下从 `{file_name}` 中提取的代码结构，生成专为 AI 检索增强生成（RAG）优化的结构化知识文档。

## 🎯 核心目标
生成的文档将作为 Dify RAG 知识库的数据源，用于支撑 Code Review 和代码生成任务。
因此，输出必须满足：
1. **语义自包含**：每个章节即使被单独检索出来，也能独立理解，不依赖外部上下文。
2. **检索友好**：包含丰富的语义锚点和关键词，便于混合检索（向量+全文）命中。
3. **机器可读**：结构严格统一，便于下游 LLM 解析和引用。

## ⚠️ 绝对禁止
- 禁止推测代码中未体现的业务逻辑（不确定时标注 `[待确认]`）。
- 禁止省略 export 成员的完整类型签名（这是 Code Review 的契约基础）。
- 禁止使用模糊指代（如"该函数"、"上述接口"），必须始终使用完整名称。

## 📋 输出格式规范（严格遵守，不得增减标题层级）

### 📄 文件元信息
- **文件路径**: `{file_name}`
- **模块职责**: [一句话概括，包含核心业务领域关键词]
- **关联模块**: [列出该文件 import/export 关联的其他模块名称，用于跨文件检索]

### 📦 API 知识条目
对每个 export 成员，严格按以下模板输出（每个条目为一个独立语义单元）：

#### [成员类型] 成员全限定名
- **语义标签**: [3-5个用于检索的关键词，如: 用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript\n[完整的类型/函数/类签名，含泛型和修饰符]\n```
- **设计意图**: [一句话说明为什么需要这个成员，解决什么问题]
- **参数/属性契约**:

  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | ... | ... | ... | ... | ... |
- **返回值/实例方法**: [类型及含义，或方法列表]
- **使用约束**: [副作用、线程安全、调用顺序、异常抛出等，无则写"无特殊约束"]
- **Code Review 检查点**: [基于此 API，审查调用方代码时应重点检查的 1-3 个点]

## 📥 输入代码结构
{structure_json}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是 TypeScript 架构师兼 RAG 知识工程师。只输出 Markdown 正文，不要任何前言、总结或解释性文字。"
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                top_p=0.9,
                max_tokens=4096,
                stop=["\n## 📥"]
            )

            content = response.choices[0].message.content.strip()

            # 清洗 LLM 常见的多余包裹
            cleaned = re.sub(r'^```(?:markdown|md)?\s*\n?', '', content)
            cleaned = re.sub(r'\n?```\s*$', '', cleaned)

            # 基础质量校验
            if '####' not in cleaned:
                print(f"   ⚠️ {file_name} 生成结果缺少 API 条目，可能输出不完整")
                return None

            return cleaned.strip()

        except Exception as e:
            print(f"   ❌ LLM 生成文档失败 [{file_name}]: {e}")
            return None

    def process_single_file(self, file_path):
        """处理单个文件的完整逻辑"""
        # 🛡️ 【核心升级】：在开始处理前检查停止标志
        if self.stop_event.is_set():
            return f"🚫 已取消(收到中断): {file_path.relative_to(self.input_dir)}"

        relative_path = file_path.relative_to(self.input_dir)
        cache_key = str(relative_path) 
        
        current_hash = self._get_file_hash(file_path)
        cached_hash = self.cache.get(cache_key)
        output_file = self.output_dir / relative_path.with_suffix(".md")
        
        # 增量更新核心逻辑
        if current_hash == cached_hash and output_file.exists():
            return f"⏭️ 跳过(无变更): {relative_path}"

        with self.print_lock:
            print(f"⏳ 正在处理: {relative_path} ...")

        start_time = time.time()
        
        structure = self.extract_code_structure(file_path)
        if not structure:
            elapsed = time.time() - start_time
            return f"⚠️ 无有效结构: {relative_path} ({elapsed:.2f}s)"

        # 注意：这里传入的是 file_path.name (文件名) 还是 relative_path (相对路径)？
        # Prompt 中建议用相对路径以便区分同名文件，但为了简洁这里沿用原逻辑
        md_content = self.generate_markdown_with_llm(str(relative_path), structure)
        elapsed = time.time() - start_time
        
        if md_content:
            output_file.parent.mkdir(parents=True, exist_ok=True)
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(md_content)
            
            self.cache[cache_key] = current_hash
            self._save_cache()
            
            return f"✅ 已更新: {relative_path} ({elapsed:.2f}s)"
        else:
            return f"❌ LLM返回为空: {relative_path} ({elapsed:.2f}s)"

    def process_directory(self, max_workers=3):
        """并发遍历核心代码目录并执行生成流程"""
        print(f"🚀 开始扫描 Monorepo 目录: {self.input_dir}")
        if not self.input_dir.exists():
            print(f"❌ 错误: 输入目录 {self.input_dir} 不存在！")
            return

        exclude_dirs = {'dist', 'node_modules', '.git', 'venv', '.turbo', '.pnpm-store', 'build', 'coverage'}
        
        tasks = []
        for root, dirs, files in os.walk(self.input_dir):
            # 修改原地列表以排除目录
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file.endswith(".d.ts") or not file.endswith((".ts", ".tsx")):
                    continue
                tasks.append(Path(root) / file)

        print(f"📊 共发现 {len(tasks)} 个 TypeScript 核心代码文件，开始处理...\n")
        
        # 使用线程池执行任务
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {executor.submit(self.process_single_file, task): task for task in tasks}
            
            for future in as_completed(future_to_file):
                # 🛡️ 【核心升级】：如果收到中断信号，停止获取新的结果
                if self.stop_event.is_set():
                    for f in future_to_file:
                        f.cancel()
                    break 
                    
                result = future.result()
                with self.print_lock:
                    print(result)
        
        # 无论正常结束还是中断退出，最后都确保缓存落盘
        self._save_cache()
        
        if self.stop_event.is_set():
            print("\n🛑 任务已被手动中断，但已处理的缓存已安全保存。")
        else:
            print("\n🎉 增量文档生成任务全部完成！")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TypeScript Monorepo 结构化文档生成器")
    parser.add_argument("--input", type=str, default="./packages", help="Monorepo 核心代码目录")
    parser.add_argument("--output", type=str, default="./docs/generated", help="Markdown 输出目录")
    args = parser.parse_args()

    generator = CodeDocGenerator(args.input, args.output)
    generator.process_directory(max_workers=2)