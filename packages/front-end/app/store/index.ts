import { createCustomStore } from '@hooks/createZustandStore';

// 业务中使用：
export const { useStore: useAvatarStore } = createCustomStore(
  { height: 170, weight: 60, a: { b: { c: { d: 0 }, c1: 1 } } },
  (set) => ({
    setHeight: (val: number) => set({ height: val }),
    setDeep: (val: number) =>
      set((draft: { a: { b: { c: { d: number } } } }) => {
        draft.a.b.c.d = val;
      }),
  }),
);

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../reducer/rootReducer';

export const store = configureStore({
  reducer: rootReducer,
});

// 从 store 本身推断出 RootState 和 AppDispatch 类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
