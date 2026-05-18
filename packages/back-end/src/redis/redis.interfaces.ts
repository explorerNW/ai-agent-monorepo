/**
 * Redis配置接口
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number; // 默认TTL（秒）
}

/**
 * 分布式锁选项
 */
export interface LockOptions {
  ttl?: number; // 锁超时时间（毫秒），默认5000ms
  retryDelay?: number; // 重试间隔（毫秒），默认100ms
  retryCount?: number; // 最大重试次数，默认10次
}

/**
 * 缓存选项
 */
export interface CacheOptions {
  ttl?: number; // TTL（秒）
  jitter?: boolean; // 是否添加随机抖动（防止雪崩）
  jitterRatio?: number; // 抖动比例，默认0.2（±20%）
  cacheNull?: boolean; // 是否缓存空值（防止穿透）
  nullTtl?: number; // 空值缓存TTL（秒），默认60秒
}

/**
 * 缓存拦截器选项
 */
export interface CacheInterceptorOptions {
  ttl?: number;
  keyPrefix?: string;
  ignoreQueryParams?: string[]; // 忽略的查询参数
  customKeyGenerator?: (req: any) => string; // 自定义键生成器
}

/**
 * 布隆过滤器选项
 */
export interface BloomFilterOptions {
  errorRate?: number; // 错误率，默认0.01
  capacity?: number; // 预期容量
}
