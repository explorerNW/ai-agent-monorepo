#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import time
import signal
import hashlib
import argparse
import threading
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed
import tree_sitter_typescript as tsts
from tree_sitter import Language, Parser

# 加载环境变量
load_dotenv()

# 初始化 Tree-sitter TypeScript 解析器
TS_LANGUAGE = Language(tsts.language_typescript())
TSX_LANGUAGE = Language(tsts.language_tsx())

class CodeDocGenerator:
    def __init__(self, input_dir, output_dir, cache_file=".doc_cache.json"):
        self.input_dir = Path(input_dir).resolve()
        self.output_dir = Path(output_dir).resolve()
        self.cache_file = Path(cache_file)
        self.client = OpenAI(
            api_key=os.getenv("LLM_API_KEY"),
            base_url=os.getenv("LLM_BASE_URL")
        )
        self.model = os.getenv("LLM_MODEL", "qwen2.5")
        
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
                if node.type in ("function_declaration", "method_definition"):
                    name_node = node.child_by_field_name("name")
                    structure.append({
                        "type": "Function/Method",
                        "name": name_node.text.decode("utf8") if name_node else "anonymous",
                        "line": node.start_point[0] + 1
                    })
                elif node.type in ("class_declaration", "interface_declaration", "type_alias_declaration"):
                    name_node = node.child_by_field_name("name")
                    structure.append({
                        "type": node.type.replace("_declaration", "").replace("_alias", "").capitalize(),
                        "name": name_node.text.decode("utf8") if name_node else "anonymous",
                        "line": node.start_point[0] + 1
                    })
                
                for child in node.children:
                    traverse(child)
            
            traverse(tree.root_node)
        except Exception as e:
            print(f"   ⚠️ 解析文件 {file_path} 发生错误: {e}")
        return structure

    def generate_markdown_with_llm(self, file_name, structure):
        """调用大模型生成结构化 Markdown 文档"""
        if not structure:
            return None
            
        prompt = f"""
        你是一个资深的 TypeScript 架构师。请根据以下从 `{file_name}` 中提取的代码结构，生成一份结构化的 Markdown 技术文档。
        要求：
        1. 包含文件概述（基于类、接口、函数的整体推断）。
        2. 为每个类、接口、类型和函数生成清晰的说明、参数解释和业务意图推断。
        3. 使用标准的 Markdown 格式，包含标题、列表和代码块。
        
        提取的代码结构数据：
        {json.dumps(structure, indent=2, ensure_ascii=False)}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"   ❌ LLM 生成文档失败: {e}")
            return None

    def process_single_file(self, file_path):
        """处理单个文件的完整逻辑"""
        # 🛡️ 【核心升级】：在开始处理前检查停止标志，如果已中断则直接跳过
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

        md_content = self.generate_markdown_with_llm(file_path.name, structure)
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
                # 🛡️ 【核心升级】：如果收到中断信号，停止获取新的结果，让线程池自行消化
                if self.stop_event.is_set():
                    # 取消所有尚未开始的任务
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