import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { store } from '@store/index';
import { authActions } from '@features/auth/model/authSlice';
import { API_CONFIG } from '@config/env';

// 使用常量管理魔法值
const DEFAULT_TIMEOUT = API_CONFIG.TIMEOUT || 15000;

export const httpClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  withCredentials: false, // 根据实际认证方式决定
});

// 定义HTTP状态码常量
const HTTP_STATUS = {
  UNAUTHORIZED: 401, // 未授权
  FORBIDDEN: 403, // 禁止访问
  NOT_FOUND: 404, // 未找到
  INTERNAL_SERVER_ERROR: 500, // 内部服务器错误
};

// 请求拦截：自动注入Token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 防御性编程：防止 store 未就绪
    const token = store.getState()?.auth?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截：统一错误处理 + Token刷新
httpClient.interceptors.response.use(
  (res: AxiosResponse) => res.data, // 注意：此处解包 data，调用方需注意
  async (error: AxiosError) => {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      // TODO: 实现 Refresh Token 逻辑
      // 示例：简单的登出处理
      store.dispatch(authActions.logout());

      // 可选：重定向到登录页
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
