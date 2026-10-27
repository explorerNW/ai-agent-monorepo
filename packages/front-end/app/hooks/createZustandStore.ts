import { useStore as useZustandStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';

export function createCustomStore<TState, TActions>(
  initialState: TState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: (set: any, get: any) => TActions,
) {
  // 使用 vanilla store：状态实例与 React Hook 分离，
  // 这样 setState / getState 可以作为普通值使用，不会被当成 Hook 引用
  const store = createStore<TState & TActions>()(
    immer((set, get) => ({
      ...initialState,
      ...actions(set, get),
    })),
  );

  const useStore = () => useZustandStore(store);

  // 封装一个支持外部初始化的 Hook
  const useHydratedStore = (externalInit?: Partial<TState>) => {
    const storeState = useZustandStore(store);

    // 修正后的 hydrate 逻辑
    if (externalInit) {
      store.setState((state) => {
        // 使用 Object.assign 将 externalInit 的属性复制到当前状态（Draft）上
        // 这样可以确保类型安全，并且符合 Immer 的使用规范
        Object.assign(state as object, externalInit);
      });
    }

    return storeState;
  };

  return {
    useStore,
    useHydratedStore,
    getState: store.getState,
  };
}
