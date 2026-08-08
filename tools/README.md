# 1. 先运行脚本确保环境和依赖就绪

sh ./tools/python-vm.sh

# 2. 在当前终端手动激活虚拟环境

source venv/bin/activate

# 3. 使用虚拟环境中的 python 运行脚本

python ./tools/generate_docs.py --input ./packages --output ./docs/generated
