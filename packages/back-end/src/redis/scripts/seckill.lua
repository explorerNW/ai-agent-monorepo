-- seckill.lua

-- 1. 参数接收
local voucherId = ARGV[1]
local userId = ARGV[2]
local orderId = ARGV[3]

-- 2. 定义 Key (建议从外部传入或使用配置常量，此处保持硬编码但需注意命名规范)
local stockKey = 'seckill:stock:' .. voucherId
local orderKey = 'seckill:order:' .. voucherId

-- 3. 校验库存
-- 注意：如果 key 不存在，get 返回 nil。tonumber(nil) 为 nil。
local stock = redis.call('get', stockKey)
if not stock then
    return -1 -- 错误：库存 Key 不存在，可能是配置错误或未预热
end

local currentStock = tonumber(stock)
if currentStock == nil then
    return -2 -- 错误：库存值格式错误
end

if currentStock <= 0 then
    return 1 -- 业务：库存不足
end

-- 4. 校验是否重复下单
-- 使用 SADD 的返回值来判断是否已存在？
-- sismember 更直观。如果存在，返回 2。
if redis.call('sismember', orderKey, userId) == 1 then
    return 2 -- 业务：重复下单
end

-- 5. 原子扣减库存
-- 使用 decr 返回剩余库存。如果剩余 < 0，说明超卖（理论上不应发生，因为上面检查了 > 0）
local remainingStock = redis.call('decr', stockKey)

-- 防御性编程：如果 decr 后库存小于 0，说明发生了严重的并发竞争或逻辑错误
if remainingStock < 0 then
    -- 恢复库存 (可选，取决于业务容忍度，通常直接报错并告警)
    redis.call('incr', stockKey)
    return -3 -- 错误：库存扣减异常，可能超卖
end

-- 6. 记录用户下单 (Set)
redis.call('sadd', orderKey, userId)

-- 重要：设置过期时间，防止内存泄漏
-- 假设秒杀活动结束后 24 小时清理重复购买记录
redis.call('expire', orderKey, 86400)

-- 7. 发送消息到 Stream
-- 检查 stream 是否存在，避免 xadd 失败
local streamExists = redis.call('exists', 'stream:orders')
if streamExists ~= 1 then
    -- 如果 stream 不存在，可以选择创建它，或者返回错误
    -- 这里选择创建，保证流程继续，但需注意 XADD 在空 stream 上的行为
    -- 更稳妥的做法是在应用启动时预创建 stream 和 group
    redis.call('xgroup', 'create', 'stream:orders', 'seckill_group', '$', 'MKSTREAM') 
end

local msgId = redis.call('xadd', 'stream:orders', '*', 'userId', userId, 'voucherId', voucherId, 'orderId', orderId)

if not msgId then
    -- 消息发送失败，但库存已扣，订单已记。这是一个不一致状态。
    -- 返回特定错误码，让上层应用记录日志并告警
    return -4 -- 错误：消息队列发送失败
end

return 0 -- 业务：秒杀成功