import type { UserFilter } from '~/features/auth/model/users/types';

// QueryKey 工厂模式（防止硬编码字符串）
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilter) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  orders: {
    /* ... */
  },
} as const;
