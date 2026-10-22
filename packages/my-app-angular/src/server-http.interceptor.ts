import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const serverHttpInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPlatformServer(inject(PLATFORM_ID)) && req.url.startsWith('/')) {
    const baseUrl = process.env['SSR_API_BASE_URL'] || 'http://localhost:4000';
    return next(
      new HttpRequest(req.method, `${baseUrl}${req.url}`, req.body, {
        headers: req.headers,
        params: req.params,
      }),
    );
  }
  return next(req);
};
