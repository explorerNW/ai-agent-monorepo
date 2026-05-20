#!/bin/bash
# 数据库初始化脚本

set -e

echo "🗄️  开始初始化 PostgreSQL 数据库..."

# 加载环境变量
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✅ 已加载根目录 .env 文件"
elif [ -f packages/back-end/.env ]; then
  export $(cat packages/back-end/.env | grep -v '^#' | xargs)
  echo "✅ 已加载 packages/back-end/.env 文件"
else
  echo "⚠️  未找到 .env 文件，使用默认值"
fi

# 设置默认值
DB_USER=${DB_USER:-admin}
DB_NAME=${DB_NAME:-analytics}
DB_PASSWORD=${DB_PASSWORD:-admin123}

echo "📋 数据库配置:"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Host: localhost"
echo "  Port: 5432"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker 未运行，请先启动 Docker"
  exit 1
fi

# 检查 PostgreSQL 容器是否运行
if ! docker ps | grep -q ai-agent-postgres; then
  echo "⚠️  PostgreSQL 容器未运行，正在启动..."
  docker-compose up -d postgres
  echo "⏳ 等待 PostgreSQL 启动..."
  sleep 10
else
  echo "✅ PostgreSQL 容器已在运行"
fi

# 等待 PostgreSQL 完全就绪
echo "⏳ 等待 PostgreSQL 完全就绪..."
for i in {1..30}; do
  if docker exec ai-agent-postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; then
    echo "✅ PostgreSQL 已就绪！"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ PostgreSQL 启动超时，请检查日志: docker logs ai-agent-postgres"
    exit 1
  fi
  echo "   等待中... ($i/30)"
  sleep 2
done

# 进入 PostgreSQL 容器并创建表
echo "✅ 正在连接到数据库 '$DB_NAME' 并创建数据表..."
docker exec -i ai-agent-postgres psql -U "$DB_USER" -d "$DB_NAME" <<'EOF'

-- 删除旧表（如果存在）以重新创建
DROP TABLE IF EXISTS web_vitals_events CASCADE;

-- 创建 Web Vitals 事件表（使用 camelCase 列名以匹配 TypeORM 实体）
CREATE TABLE web_vitals_events (
  id SERIAL PRIMARY KEY,
  "event_name" VARCHAR(50) NOT NULL,
  "user_id" VARCHAR(100),
  url TEXT NOT NULL,
  metrics JSONB NOT NULL,
  "navigation_type" VARCHAR(20),
  timestamp TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（注意使用双引号包裹 camelCase 列名）
CREATE INDEX idx_web_vitals_timestamp ON web_vitals_events(timestamp DESC);
CREATE INDEX idx_web_vitals_user ON web_vitals_events("user_id");
CREATE INDEX idx_web_vitals_event_name ON web_vitals_events("event_name");

-- 创建 GIN 索引用于 JSONB 查询
CREATE INDEX idx_web_vitals_metrics ON web_vitals_events USING GIN (metrics);

-- 显示表结构
\d web_vitals_events

-- 显示统计信息
SELECT COUNT(*) as total_records FROM web_vitals_events;

EOF

echo "✅ 数据库初始化完成！"
echo ""
echo "📊 数据库连接信息："
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "💡 提示："
echo "  - 使用 pgAdmin 或 DBeaver 连接查看数据"
echo "  - 运行 'docker logs ai-agent-postgres' 查看数据库日志"
echo "  - 运行 './docker.sh db:shell' 进入数据库命令行"
