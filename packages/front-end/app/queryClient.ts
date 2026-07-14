import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
      gcTime: 30 * 60 * 1000, // 30分钟后垃圾回收
      retry: 1, // 失败重试1次
      refetchOnWindowFocus: false, // 企业后台系统通常关闭此选项
      throwOnError: true, // 配合ErrorBoundary使用
    },
    mutations: {
      onError: () => {
        // 全局Mutation错误提示（Toast）
        // toast.error(error.message || '操作失败');
      },
    },
  },
});
