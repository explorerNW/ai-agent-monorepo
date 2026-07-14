import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@shared/api/httpClient';
import { queryKeys } from '@shared/api/queryKeys';
import type { CreateUserDto, User, UserFilter } from '../types';

// ✅ 每个Feature只导出Hooks，不导出原始API函数
export function useUserList(filters: UserFilter) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => httpClient.get<User[]>('/users', { params: filters }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => httpClient.post('/users', data),
    onSuccess: () => {
      // ✅ 精确失效，而非invalidate全部
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}
