#!/bin/bash

# 🛑 遇到错误立即退出
set -e

VENV_DIR="venv"
REQ_FILE="./tools/requirements.txt"

echo "🚀 [1/4] 检查 requirements.txt..."
if [ ! -f "$REQ_FILE" ]; then
    echo "⚠️ 未找到 requirements.txt，正在自动创建并写入基础依赖..."
    cat <<EOF > $REQ_FILE
openai
python-dotenv
tree-sitter-typescript
tree-sitter
EOF
fi

echo "🛠️ [2/4] 检查并创建虚拟环境..."
if [ ! -d "$VENV_DIR" ]; then
    # 🌟 核心修复：强制使用 python3 创建虚拟环境
    python3 -m venv $VENV_DIR
    echo "✅ 虚拟环境创建成功！"
else
    echo "✅ 虚拟环境已存在，跳过创建。"
fi

echo "📦 [3/4] 激活虚拟环境..."
source $VENV_DIR/bin/activate

echo "⬇️ [4/4] 同步安装依赖..."
pip install --upgrade pip -q
pip install -r $REQ_FILE -q

echo ""
echo "🎉 环境准备完毕！"
echo "💡 提示：虚拟环境已激活，你现在可以直接运行 Python 脚本。"
echo "   例如: python ./tools/generate_docs.py --input ./packages --output ./docs/generated"