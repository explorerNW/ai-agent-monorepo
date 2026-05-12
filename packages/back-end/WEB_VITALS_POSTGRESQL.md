# Web Vitals 性能监控 - PostgreSQL 存储方案

## 📋 概述

本方案使用 **PostgreSQL** 存储前端上报的 Web Vitals 性能指标数据，支持长期保存、复杂查询和趋势分析。

## 🏗️ 架构设计

```
前端 (AnalyticsSDK)
  ↓ HTTP POST /api/v1/track
NestJS Controller
  ↓ 事件类型判断
  ├─ web_vitals_summary → PostgreSQL (TypeORM)
  └─ 其他事件 → RabbitMQ
```

## 🚀 快速开始

### 1. 启动服务

```bash
# 启动所有服务（包括 PostgreSQL）
./docker.sh start

# 或仅启动 PostgreSQL
docker-compose up -d postgres
```

### 2. 初始化数据库

```bash
# 自动创建表和索引
./init-db.sh

# 或使用 docker.sh
./docker.sh db:init
```

### 3. 验证安装

```bash
# 查看 PostgreSQL 日志
./docker.sh logs:postgres

# 进入数据库命令行
./docker.sh db:shell

# 在 psql 中执行
\dt                    # 查看表
SELECT COUNT(*) FROM web_vitals_events;  # 查看数据量
```

## 📊 数据库结构

### 表：web_vitals_events

| 字段            | 类型         | 说明                                  |
| --------------- | ------------ | ------------------------------------- |
| id              | SERIAL       | 主键                                  |
| event_name      | VARCHAR(50)  | 事件名称（固定为 web_vitals_summary） |
| user_id         | VARCHAR(100) | 用户ID                                |
| url             | TEXT         | 页面URL                               |
| metrics         | JSONB        | 性能指标数据                          |
| navigation_type | VARCHAR(20)  | 导航类型                              |
| timestamp       | TIMESTAMP    | 事件时间戳                            |
| created_at      | TIMESTAMP    | 记录创建时间                          |

### JSONB Metrics 结构

```json
{
  "lcp": {
    "value": 1234.56,
    "rating": "good",
    "navigationType": "navigate"
  },
  "fcp": {
    "value": 890.12,
    "rating": "good",
    "navigationType": "navigate"
  },
  "cls": {
    "value": 0.05,
    "rating": "good",
    "navigationType": "navigate"
  },
  "fid": {
    "value": 45,
    "rating": "good",
    "navigationType": "navigate"
  },
  "ttfb": {
    "value": 120,
    "rating": "good",
    "navigationType": "navigate"
  }
}
```

## 🔍 常用查询示例

### 1. 查询最近7天的平均 LCP

```sql
SELECT
  AVG((metrics->'lcp'->>'value')::numeric) as avg_lcp,
  DATE(timestamp) as date
FROM web_vitals_events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### 2. 查询性能较差的页面

```sql
SELECT
  url,
  AVG((metrics->'lcp'->>'value')::numeric) as avg_lcp,
  COUNT(*) as visit_count
FROM web_vitals_events
WHERE metrics->'lcp'->>'rating' = 'poor'
GROUP BY url
HAVING COUNT(*) > 10
ORDER BY avg_lcp DESC
LIMIT 20;
```

### 3. 按导航类型统计

```sql
SELECT
  navigation_type,
  COUNT(*) as count,
  AVG((metrics->'fcp'->>'value')::numeric) as avg_fcp,
  AVG((metrics->'lcp'->>'value')::numeric) as avg_lcp
FROM web_vitals_events
GROUP BY navigation_type;
```

### 4. 查询特定用户的性能数据

```sql
SELECT *
FROM web_vitals_events
WHERE user_id = 'uid_abc123'
ORDER BY timestamp DESC
LIMIT 50;
```

## 💻 API 使用

### 前端上报（自动）

```typescript
// AnalyticsSDK 会自动采集并上报
const analytics = new AnalyticsSDK('http://localhost:3000/api/v1/track');
// 无需手动调用，页面加载后自动采集 Web Vitals
```

### 后端查询接口（可扩展）

```typescript
// 在 AnalyticsController 中添加
@Get('stats')
async getStats(@Query('page') page?: string, @Query('days') days = 7) {
  return await this.analyticsService.getWebVitalsStats(page, days);
}
```

## 🛠️ 管理命令

```bash
# 查看所有服务状态
./docker.sh status

# 查看 PostgreSQL 日志
./docker.sh logs:postgres

# 进入数据库命令行
./docker.sh db:shell

# 进入容器 shell
./docker.sh shell:postgres

# 重启所有服务
./docker.sh restart

# 清理所有数据（谨慎使用）
./docker.sh clean
```

## 📈 性能优化建议

### 1. 索引策略

已创建的索引：

- `idx_web_vitals_timestamp` - 时间范围查询
- `idx_web_vitals_user` - 用户维度查询
- `idx_web_vitals_event_name` - 事件类型过滤
- `idx_web_vitals_metrics` (GIN) - JSONB 字段查询

### 2. 分区表（大数据量时）

```sql
-- 按月分区示例
CREATE TABLE web_vitals_2026_05 PARTITION OF web_vitals_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

### 3. 定期清理旧数据

```sql
-- 删除90天前的数据
DELETE FROM web_vitals_events
WHERE timestamp < NOW() - INTERVAL '90 days';
```

## 🔧 配置说明

### 环境变量 (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=analytics
```

### Docker Compose

PostgreSQL 服务配置在 `docker-compose.yml` 中：

- 端口映射：5432:5432
- 数据持久化：postgres-data volume
- 健康检查：pg_isready

## 🐛 故障排查

### 1. 连接失败

```bash
# 检查容器是否运行
docker ps | grep postgres

# 查看日志
docker logs ai-agent-postgres

# 测试连接
docker exec -it ai-agent-postgres pg_isready -U admin
```

### 2. 表不存在

```bash
# 重新初始化
./init-db.sh
```

### 3. 数据未写入

```bash
# 查看后端日志
./docker.sh logs:backend

# 检查数据库记录
./docker.sh db:shell
# SELECT COUNT(*) FROM web_vitals_events;
```

## 📝 最佳实践

1. **定期备份**：使用 `pg_dump` 定期备份数据
2. **监控磁盘空间**：PostgreSQL 数据会持续增长
3. **设置 TTL**：根据业务需求保留合适时长的数据
4. **异步写入**：当前实现已是异步，不影响主业务流程
5. **错误处理**：数据库写入失败不应影响前端响应

## 🔗 相关文档

- [TypeORM 官方文档](https://typeorm.io/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Web Vitals 标准](https://web.dev/vitals/)
- [AnalyticsSDK 实现](../front-end/app/core/AnalyticsSDK.ts)
