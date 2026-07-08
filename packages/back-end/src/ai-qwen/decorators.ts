import { SetMetadata } from '@nestjs/common';

// 自定义装饰器，用于设置HTTP请求的X-Header头
export const X_HEADER_KEY = 'x-header-key';

/**
 * 自定义装饰器，用于设置HTTP请求的X-Header头
 * @param keys 需要设置的X-Header头键值对
 * @returns 需要HTTP请求的X-Header头键值对
 */
export const XHeaderKey = (keys: string[]) => {
  return SetMetadata(X_HEADER_KEY, keys);
};
