import {
  Injectable,
  CanActivate,
  ExecutionContext,
  PreconditionFailedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { X_HEADER_KEY } from './decorators';

/**
 * 自定义守卫，用于检查HTTP请求的X-Header头
 */
@Injectable()
export class XGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // 获取需要检查的X-Header头键值对，如果没有则抛出异常
    const headerKeys = this.reflector.get<string[]>(
      X_HEADER_KEY,
      context.getHandler(),
    );
    // 如果没有设置X-Header头，则直接放行
    if (!headerKeys || headerKeys.length === 0) {
      return true;
    }
    // 检查请求头中是否包含所有需要的X-Header头，如果缺少则抛出异常
    headerKeys.forEach((key) => {
      if (!request.headers[key]) {
        throw new PreconditionFailedException(`Header '${key}' is missing`);
      }
    });

    return true;
  }
}
