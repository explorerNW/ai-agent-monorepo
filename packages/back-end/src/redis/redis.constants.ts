/**
 * Redis模块常量定义
 */

/**
 * 默认配置
 */
export const REDIS_DEFAULT_CONFIG = {
  HOST: 'localhost',
  PORT: 6379,
  DB: 0,
  KEY_PREFIX: 'app:',
  TTL: 3600, // 1小时
};

/**
 * 分布式锁默认配置
 */
export const LOCK_DEFAULT_OPTIONS = {
  TTL: 5000, // 5秒
  RETRY_DELAY: 100, // 100毫秒
  RETRY_COUNT: 10, // 最多重试10次
};

/**
 * 缓存默认配置
 */
export const CACHE_DEFAULT_OPTIONS = {
  TTL: 3600, // 1小时
  JITTER: true,
  JITTER_RATIO: 0.2, // ±20%
  CACHE_NULL: true,
  NULL_TTL: 60, // 空值缓存60秒
};

/**
 * 缓存键前缀
 */
export const CACHE_KEY_PREFIXES = {
  USER: 'user:',
  SESSION: 'session:',
  API_RESPONSE: 'api:',
  CONFIG: 'config:',
  LOCK: 'lock:',
  BLOOM_FILTER: 'bloom:',
};

/**
 * 特殊缓存键
 */
export const SPECIAL_CACHE_KEYS = {
  MUTEX_PREFIX: 'mutex:', // 互斥锁前缀（防止击穿）
  NULL_VALUE: '__NULL__', // 空值标记
};
