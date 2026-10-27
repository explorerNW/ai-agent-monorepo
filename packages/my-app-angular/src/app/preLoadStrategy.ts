import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class PreLoadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // 仅对配置了 data: { preload: true } 的路由生效
    if (route.data?.['preload']) {
      // 使用 requestIdleCallback 在浏览器空闲时执行，完全不阻塞当前页面
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => load().pipe(distinctUntilChanged()).subscribe());
      } else {
        // 降级方案：延时 2 秒后在后台静默加载
        setTimeout(() => load().pipe(distinctUntilChanged()).subscribe(), 2000);
      }
    }
    return of(null);
  }
}
