# Grafana仪表板无数据显示 - 快速修复指南

## 🚀 快速解决方案(3步完成)

### 方法一: 使用自动化脚本(推荐)

```bash
# 1. 运行配置脚本
./setup-grafana-datasource.sh

# 2. 按提示操作(会自动配置数据源并生成测试数据)

# 3. 访问 http://localhost:3002 导入仪表板
```

### 方法二: 手动配置

#### 步骤1: 配置ClickHouse数据源

1. 访问 `http://localhost:3002` (用户名: `admin`, 密码: `admin`)
2. 点击 ⚙️ **Configuration** → **Data Sources** → **Add data source**
3. 搜索并选择 **ClickHouse** (vertamedia-clickhouse-datasource)
4. 填写配置:
   ```
   Name: ClickHouse
   Host: http://clickhouse-server:8123
   Database: performance_db
   Username: default
   Password: admin@me
   ```
5. 点击 **Save & Test** (应显示 "Data source is working")

#### 步骤2: 获取数据源UID

```bash
# 在终端执行
curl -u admin:admin http://localhost:3002/api/datasources | grep -o '"uid":"[^"]*"' | head -1
```

记下返回的UID(例如: `Pxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### 步骤3: 更新并导入仪表板

1. 打开 `packages/back-end/grafana.chart.json`
2. 将所有 `"clickhouse-datasource"` 替换为实际的UID
3. 在Grafana中: ➕ **Create** → **Import** → 上传JSON文件

---

## 🔍 问题诊断流程

如果上述方法仍无效,按以下顺序排查:

### ✅ 检查清单

```bash
# 1. 检查服务是否运行
docker ps | grep -E "grafana|clickhouse"

# 2. 检查ClickHouse连接
docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT 1"

# 3. 检查表是否存在
docker exec clickhouse-server clickhouse-client --host=localhost --query="SHOW TABLES FROM performance_db"

# 4. 检查是否有数据
docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT count(*) FROM performance_db.performance_metrics WHERE fcp IS NOT NULL"

# 5. 检查Grafana日志
docker logs grafana --tail 50 | grep -i error
```

### 📊 生成测试数据

如果数据库为空:

```bash
docker exec clickhouse-server clickhouse-client --host=localhost <<'EOF'
INSERT INTO performance_db.performance_metrics VALUES
(
  toUnixTimestamp(now() - INTERVAL 1 HOUR),
  '/test-page',
  'Test Browser',
  now() - INTERVAL 1 HOUR,
  1500.5,
  2800.3,
  0.08,
  45.2,
  350.1,
  120.5,
  'navigate',
  '{"effectiveType":"4g"}',
  now()
);
EOF
```

---

## 🐛 常见错误及解决方案

### 错误1: "No data" 或空白图表

**原因**:

- 数据源未配置
- 表中无数据
- 时间范围不匹配

**解决**:

```bash
# 确认有近期数据
docker exec clickhouse-server clickhouse-client --host=localhost \
  --query="SELECT timestamp, fcp FROM performance_db.performance_metrics WHERE timestamp >= now() - INTERVAL 6 HOUR LIMIT 5"
```

### 错误2: "Unknown function $\_\_timeFilter"

**原因**: SQL使用了Grafana宏但插件不支持

**解决**: 修改JSON中的SQL查询

```sql
-- ❌ 错误
WHERE $__timeFilter(timestamp)

-- ✅ 正确
WHERE timestamp >= now() - INTERVAL 6 HOUR
```

### 错误3: "Cannot parse datetime"

**原因**: DateTime字段格式不正确

**解决**: 使用 `toUnixTimestamp()` 转换

```sql
-- ❌ 错误
SELECT timestamp as time FROM ...

-- ✅ 正确
SELECT toUnixTimestamp(timestamp) as time FROM ...
```

### 错误4: 认证失败

**原因**: 密码错误或用户不存在

**解决**:

```bash
# 检查ClickHouse用户配置
docker exec clickhouse-server cat /etc/clickhouse-server/users.xml | grep -A 3 "<password>"

# 默认密码应该是: admin@me
```

---

## 📝 已修复的问题

`grafana.chart.json` 文件已修复以下内容:

1. ✅ **移除动态变量**: 将 `${DS_CLICKHOUSE}` 改为固定UID `clickhouse-datasource`
2. ✅ **修正SQL语法**: 使用 `toUnixTimestamp(timestamp)` 替代直接引用DateTime字段
3. ✅ **简化时间过滤**: 使用 `timestamp >= now() - INTERVAL 6 HOUR` 替代 `$__timeFilter()`
4. ✅ **统一数据源引用**: 所有面板都指向正确的数据源UID

---

## 🎯 验证成功的标志

配置完成后,你应该看到:

- [x] Grafana首页显示 "Data sources" 中有ClickHouse
- [x] 点击 "Save & Test" 显示绿色成功提示
- [x] 导入仪表板后,5个面板都显示数据曲线或表格
- [x] 时间范围选择器可以正常切换(如: Last 6 hours, Last 24 hours等)
- [x] 刷新按钮(30s)正常工作

---

## 📞 需要帮助?

如果问题仍未解决,请提供以下信息:

```bash
# 1. Grafana版本
docker exec grafana grafana-cli -v

# 2. 数据源列表
curl -u admin:admin http://localhost:3002/api/datasources

# 3. ClickHouse表结构
docker exec clickhouse-server clickhouse-client --host=localhost \
  --query="DESCRIBE TABLE performance_db.performance_metrics"

# 4. 示例数据
docker exec clickhouse-server clickhouse-client --host=localhost \
  --query="SELECT * FROM performance_db.performance_metrics LIMIT 1 FORMAT JSONEachRow"

# 5. Grafana错误日志
docker logs grafana --tail 100
```

将这些输出提供给技术支持以获得更快速的帮助。
