import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomInt } from 'crypto';
import { LockOptions, CacheOptions } from './redis.interfaces';
import {
  LOCK_DEFAULT_OPTIONS,
  CACHE_DEFAULT_OPTIONS,
  SPECIAL_CACHE_KEYS,
} from './redis.constants';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取缓存项
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cache.get(key);
      return value as T;
    } catch (error) {
      this.logger.error(`Error getting cache item ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存项
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      // 处理空值缓存
      if (value === null || value === undefined) {
        if (options?.cacheNull) {
          await this.cache.set(
            key,
            SPECIAL_CACHE_KEYS.NULL_VALUE,
            options.nullTtl || CACHE_DEFAULT_OPTIONS.NULL_TTL,
          );
        }
        return true;
      }

      // 计算带抖动的TTL
      let ttl = options?.ttl || CACHE_DEFAULT_OPTIONS.TTL;
      if (
        options?.jitter ||
        (options?.jitter === undefined && CACHE_DEFAULT_OPTIONS.JITTER)
      ) {
        const ratio =
          options?.jitterRatio || CACHE_DEFAULT_OPTIONS.JITTER_RATIO;
        const jitterAmount = Math.floor(ttl * ratio);
        const jitter = randomInt(-jitterAmount, jitterAmount + 1);
        ttl = Math.max(1, ttl + jitter); // 确保TTL大于0
      }

      await this.cache.set(key, value, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache item ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除缓存项
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.cache.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache item ${key}:`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存项
   */
  async delMany(keys: string[]): Promise<boolean> {
    try {
      // 逐个删除，因为cache-manager的del不支持多个键
      for (const key of keys) {
        await this.cache.del(key);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache items:`, error);
      return false;
    }
  }

  /**
   * 尝试获取分布式锁
   */
  async tryLock(
    lockKey: string,
    options?: LockOptions,
  ): Promise<string | null> {
    const lockId = this.generateLockId();
    const ttl = options?.ttl || LOCK_DEFAULT_OPTIONS.TTL;

    try {
      // 使用 SET key value NX EX ttl 原子操作获取锁
      // cache-manager v5+ 使用 set 方法直接设置
      await this.cache.set(lockKey, lockId, Math.floor(ttl / 1000));

      // 验证是否设置成功（如果key已存在，set会失败）
      const currentValue = await this.cache.get(lockKey);
      if (currentValue === lockId) {
        return lockId;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error acquiring lock ${lockKey}:`, error);
      return null;
    }
  }

  /**
   * 释放分布式锁
   */
  async releaseLock(lockKey: string, lockId: string): Promise<boolean> {
    try {
      // 如果 cache-manager 不支持 EVAL，我们可以直接比较和删除
      const currentValue = await this.cache.get(lockKey);
      if (currentValue === lockId) {
        await this.cache.del(lockKey);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Error releasing lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * 获取分布式锁（阻塞等待）
   */
  async lock(lockKey: string, options?: LockOptions): Promise<string | null> {
    const retryDelay = options?.retryDelay || LOCK_DEFAULT_OPTIONS.RETRY_DELAY;
    const maxRetries = options?.retryCount || LOCK_DEFAULT_OPTIONS.RETRY_COUNT;

    for (let i = 0; i < maxRetries; i++) {
      const lockId = await this.tryLock(lockKey, options);
      if (lockId) {
        return lockId;
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    return null;
  }

  /**
   * 使用锁执行函数（自动释放锁）
   */
  async useLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    lockOptions?: LockOptions,
  ): Promise<T | null> {
    const lockId = await this.lock(lockKey, lockOptions);
    if (!lockId) {
      this.logger.warn(`Failed to acquire lock: ${lockKey}`);
      return null;
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey, lockId);
    }
  }

  /**
   * 缓存数据，如果不存在则从回调函数获取
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T | null>,
    options?: CacheOptions,
  ): Promise<T | null> {
    // 先尝试获取
    let value = await this.get<T>(key);

    // 检查是否为空值标记
    if (value === SPECIAL_CACHE_KEYS.NULL_VALUE) {
      return null;
    }

    // 如果缓存中有值，直接返回
    if (value !== null && value !== undefined) {
      return value;
    }

    // 使用分布式锁防止缓存击穿
    const mutexKey = `${SPECIAL_CACHE_KEYS.MUTEX_PREFIX}${key}`;
    const lockId = await this.lock(mutexKey, {
      ttl: 3000, // 3秒锁，足够执行fn
      retryDelay: 50,
      retryCount: 20,
    });

    if (!lockId) {
      // 如果获取不到锁，可能是其他进程正在计算，稍等后重新尝试
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await this.getOrSet(key, fn, options);
    }

    try {
      // 再次检查缓存，因为可能在等待锁的过程中已有其他进程设置了值
      value = await this.get<T>(key);
      if (value !== null && value !== undefined) {
        if (value === SPECIAL_CACHE_KEYS.NULL_VALUE) {
          return null;
        }
        return value;
      }

      // 执行回调获取数据
      const result = await fn();

      // 设置缓存
      await this.set(key, result, options);

      return result;
    } finally {
      // 释放互斥锁
      await this.releaseLock(mutexKey, lockId);
    }
  }

  /**
   * 检查布隆过滤器中是否存在某个值
   */
  async bloomExists(filterName: string, value: string): Promise<boolean> {
    // 在实际的布隆过滤器实现中，这里应该调用专门的布隆过滤器库
    // 暂时用集合模拟，生产环境中应该使用专门的布隆过滤器实现
    const key = `bloom:${filterName}`;
    const setMembers = (await this.get<string[]>(key)) || [];
    return setMembers.includes(value);
  }

  /**
   * 向布隆过滤器添加值
   */
  async bloomAdd(filterName: string, value: string): Promise<void> {
    const key = `bloom:${filterName}`;
    const setMembers = (await this.get<string[]>(key)) || [];

    if (!setMembers.includes(value)) {
      setMembers.push(value);
      await this.set(key, setMembers, { ttl: 86400 }); // 默认一天
    }
  }

  /**
   * 生成唯一的锁ID
   */
  private generateLockId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
