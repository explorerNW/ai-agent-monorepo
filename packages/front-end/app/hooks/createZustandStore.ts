import { create } from "zustand";

export function createCustomStore<TState, TActions>(
  initialState: TState,
  actions: (set: any, get: any) => TActions,
) {
  const useStore = create<TState & TActions>((set, get) => ({
    ...initialState,
    ...actions(set, get),
  }));

  // 封装一个支持外部初始化的 Hook
  const useHydratedStore = (externalInit?: Partial<TState>) => {
    const store = useStore();

    // 简单的 hydrate 逻辑
    if (externalInit) {
      useStore.setState(externalInit as Partial<TState & TActions>);
    }

    return store;
  };

  return { useStore, useHydratedStore, getState: useStore.getState };
}
