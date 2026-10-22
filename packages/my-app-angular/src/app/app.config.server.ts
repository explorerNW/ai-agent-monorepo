import {
  mergeApplicationConfig,
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { serverHttpInterceptor } from '../server-http.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // 🔑 Zoneless + Hydration 同时启用
    provideZonelessChangeDetection(),
    // 🔑 非破坏性水合 + 事件重放
    provideClientHydration(withEventReplay()),
    provideHttpClient(),

    provideHttpClient(withInterceptors([serverHttpInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
