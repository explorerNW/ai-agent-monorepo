#!/bin/bash

# Grafana ClickHouse数据源自动配置脚本
# 使用方法: ./setup-grafana-datasource.sh

set -e

GRAFANA_URL="http://localhost:3002"
CLICKHOUSE_HOST="http://clickhouse-server:8123"
CLICKHOUSE_DB="performance_db"
CLICKHOUSE_USER="default"
CLICKHOUSE_PASSWORD="admin@me"

echo "🔧 Grafana ClickHouse数据源自动配置"
echo "======================================"
echo ""

# 检查Docker容器是否运行
echo "1️⃣  检查服务状态..."
if ! docker ps | grep -q grafana; then
    echo "❌ Grafana容器未运行"
    echo "请先启动: docker-compose up -d grafana"
    exit 1
fi

if ! docker ps | grep -q clickhouse; then
    echo "❌ ClickHouse容器未运行"
    echo "请先启动: docker-compose up -d clickhouse"
    exit 1
fi

echo "✅ 服务运行正常"
echo ""

# 测试ClickHouse连接
echo "2️⃣  测试ClickHouse连接..."
if docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT 1" > /dev/null 2>&1; then
    echo "✅ ClickHouse连接成功"
else
    echo "❌ ClickHouse连接失败"
    exit 1
fi
echo ""

# 检查数据库和表
echo "3️⃣  检查数据库和表..."
TABLES=$(docker exec clickhouse-server clickhouse-client --host=localhost --query="SHOW TABLES FROM performance_db" 2>/dev/null || echo "")

if [[ $TABLES == *"performance_metrics"* ]] && [[ $TABLES == *"api_metrics"* ]]; then
    echo "✅ 表存在: performance_metrics, api_metrics"
else
    echo "⚠️  表不存在或无法访问"
    echo "可用的表:"
    echo "$TABLES"
fi
echo ""

# 检查是否有数据
echo "4️⃣  检查数据..."
PERF_COUNT=$(docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT count(*) FROM performance_db.performance_metrics" 2>/dev/null || echo "0")
API_COUNT=$(docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT count(*) FROM performance_db.api_metrics" 2>/dev/null || echo "0")

echo "   performance_metrics: $PERF_COUNT 条记录"
echo "   api_metrics: $API_COUNT 条记录"

if [ "$PERF_COUNT" -eq 0 ] && [ "$API_COUNT" -eq 0 ]; then
    echo ""
    echo "⚠️  警告: 数据库中没有数据!"
    echo "   仪表板导入后将显示'No data'"
    echo ""
    read -p "是否生成测试数据? (y/n): " GENERATE_DATA
    if [ "$GENERATE_DATA" = "y" ] || [ "$GENERATE_DATA" = "Y" ]; then
        echo "生成测试数据..."
        
        # 生成20条测试性能数据
        for i in {1..20}; do
            OFFSET_HOURS=$((RANDOM % 6))
            OFFSET_MINUTES=$((RANDOM % 60))
            TIMESTAMP=$(date -v-${OFFSET_HOURS}H -v-${OFFSET_MINUTES}M +%s 2>/dev/null || date -d "${OFFSET_HOURS} hours ago ${OFFSET_MINUTES} minutes ago" +%s)
            
            FCP=$((RANDOM % 3000 + 500))
            LCP=$((RANDOM % 5000 + 1000))
            CLS_INT=$((RANDOM % 100))
            CLS="0.$CLS_INT"
            
            docker exec clickhouse-server clickhouse-client --host=localhost \
                --query="INSERT INTO performance_db.performance_metrics VALUES (
                    $TIMESTAMP,
                    '/test-page-$((i % 5 + 1))',
                    'Mozilla/5.0 Test Browser',
                    toDateTime($TIMESTAMP),
                    ${FCP}.5,
                    ${LCP}.3,
                    $CLS,
                    $((RANDOM % 100 + 10)).2,
                    $((RANDOM % 500 + 100)).1,
                    $((RANDOM % 200 + 50)).5,
                    'navigate',
                    '{\"effectiveType\":\"4g\"}',
                    now()
                )" 2>/dev/null || true
        done
        
        # 生成10条测试API数据
        for i in {1..10}; do
            OFFSET_HOURS=$((RANDOM % 6))
            OFFSET_MINUTES=$((RANDOM % 60))
            TIMESTAMP=$(date -v-${OFFSET_HOURS}H -v-${OFFSET_MINUTES}M +%s 2>/dev/null || date -d "${OFFSET_HOURS} hours ago ${OFFSET_MINUTES} minutes ago" +%s)
            
            DURATION=$((RANDOM % 2000 + 100))
            STATUS_OPTIONS=(200 200 200 201 400 404 500)
            STATUS=${STATUS_OPTIONS[$((RANDOM % ${#STATUS_OPTIONS[@]}))]}
            
            docker exec clickhouse-server clickhouse-client --host=localhost \
                --query="INSERT INTO performance_db.api_metrics VALUES (
                    $TIMESTAMP,
                    '/api/test-endpoint-$((i % 3 + 1))',
                    'GET',
                    toDateTime($TIMESTAMP),
                    ${DURATION}.5,
                    $STATUS,
                    $((RANDOM % 5000 + 500)),
                    '/test-page',
                    'Mozilla/5.0 Test Browser',
                    toDateTime($TIMESTAMP),
                    now()
                )" 2>/dev/null || true
        done
        
        echo "✅ 测试数据生成完成"
        
        # 重新检查数据量
        PERF_COUNT=$(docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT count(*) FROM performance_db.performance_metrics" 2>/dev/null || echo "0")
        API_COUNT=$(docker exec clickhouse-server clickhouse-client --host=localhost --query="SELECT count(*) FROM performance_db.api_metrics" 2>/dev/null || echo "0")
        echo "   performance_metrics: $PERF_COUNT 条记录"
        echo "   api_metrics: $API_COUNT 条记录"
    fi
fi
echo ""

# 配置Grafana数据源
echo "5️⃣  配置Grafana数据源..."
echo ""
echo "请选择Grafana管理员密码:"
echo "1) admin (默认)"
echo "2) 自定义密码"
read -p "选择 (1/2): " PASSWORD_CHOICE

if [ "$PASSWORD_CHOICE" = "2" ]; then
    read -sp "输入密码: " GRAFANA_PASSWORD
    echo ""
else
    GRAFANA_PASSWORD="admin"
fi

# 尝试创建数据源
echo "正在创建ClickHouse数据源..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$GRAFANA_URL/api/datasources" \
    -H "Content-Type: application/json" \
    -u "admin:$GRAFANA_PASSWORD" \
    -d "{
        \"name\": \"ClickHouse\",
        \"type\": \"vertamedia-clickhouse-datasource\",
        \"access\": \"proxy\",
        \"url\": \"$CLICKHOUSE_HOST\",
        \"database\": \"$CLICKHOUSE_DB\",
        \"user\": \"$CLICKHOUSE_USER\",
        \"password\": \"$CLICKHOUSE_PASSWORD\",
        \"jsonData\": {
            \"tlsSkipVerify\": true,
            \"defaultDatabase\": \"$CLICKHOUSE_DB\"
        },
        \"secureJsonData\": {
            \"password\": \"$CLICKHOUSE_PASSWORD\"
        }
    }" 2>/dev/null || echo '{"message":"Connection failed"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "409" ]; then
    if [ "$HTTP_CODE" = "409" ]; then
        echo "⚠️  数据源已存在,跳过创建"
    else
        echo "✅ 数据源创建成功"
    fi
    
    # 获取数据源UID
    DATASOURCES=$(curl -s -u "admin:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/datasources" 2>/dev/null || echo "[]")
    CLICKHOUSE_UID=$(echo "$DATASOURCES" | grep -o '"uid":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$CLICKHOUSE_UID" ]; then
        echo "⚠️  无法获取数据源UID,请手动检查"
        CLICKHOUSE_UID="clickhouse-datasource"
    fi
    
    echo "✅ 数据源UID: $CLICKHOUSE_UID"
    
    # 更新JSON文件中的UID
    JSON_FILE="$(dirname "$0")/packages/back-end/grafana.chart.json"
    if [ -f "$JSON_FILE" ]; then
        echo "更新仪表板JSON文件中的数据源UID..."
        sed -i.bak "s/\"clickhouse-datasource\"/\"$CLICKHOUSE_UID\"/g" "$JSON_FILE"
        echo "✅ JSON文件已更新 (备份: $JSON_FILE.bak)"
    fi
    
    echo ""
    echo "🎉 配置完成!"
    echo ""
    echo "下一步操作:"
    echo "1. 访问: $GRAFANA_URL"
    echo "2. 登录 (admin/$GRAFANA_PASSWORD)"
    echo "3. 点击 ➕ Create → Import"
    echo "4. 上传文件: $JSON_FILE"
    echo "5. 点击 Import"
    echo ""
    
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ 认证失败: 用户名或密码错误"
    echo "请检查Grafana管理员密码是否正确"
    echo ""
    echo "提示: 默认密码是 'admin'"
    echo "如果修改过密码,请使用自定义密码选项"
    exit 1
    
else
    echo "❌ 创建数据源失败 (HTTP $HTTP_CODE)"
    echo "响应: $BODY"
    echo ""
    echo "请手动配置数据源:"
    echo "1. 访问: $GRAFANA_URL"
    echo "2. Configuration → Data Sources → Add data source"
    echo "3. 选择: ClickHouse (vertamedia-clickhouse-datasource)"
    echo "4. 配置:"
    echo "   - Host: $CLICKHOUSE_HOST"
    echo "   - Database: $CLICKHOUSE_DB"
    echo "   - Username: $CLICKHOUSE_USER"
    echo "   - Password: $CLICKHOUSE_PASSWORD"
    exit 1
fi