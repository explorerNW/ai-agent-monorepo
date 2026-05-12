#!/bin/bash
# 数据库初始化脚本

set -e

echo "🗄️  开始初始化 PostgreSQL 数据库..."

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
  sleep 5
fi

# 进入 PostgreSQL 容器并创建表
echo "✅ 正在创建数据表..."
docker exec -i ai-agent-postgres psql -U ${DB_USER:-admin} -d ${DB_NAME:-analytics} <<'EOF'

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
echo "  Database: ${DB_NAME:-analytics}"
echo "  User: ${DB_USER:-admin}"
echo ""
echo "💡 提示："
echo "  - 使用 pgAdmin 或 DBeaver 连接查看数据"
echo "  - 运行 'docker logs ai-agent-postgres' 查看数据库日志"
echo "  - 运行 './docker.sh db:shell' 进入数据库命令行"
