import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export function createCustomStore<TState, TActions>(
  initialState: TState,
  actions: (set: any, get: any) => TActions,
) {
  const useStore = create<TState & TActions>()(
    immer((set, get) => ({
      ...initialState,
      ...actions(set, get),
    })),
  );

  // 封装一个支持外部初始化的 Hook
  const useHydratedStore = (externalInit?: Partial<TState>) => {
    const store = useStore();

    // 修正后的 hydrate 逻辑
    if (externalInit) {
      useStore.setState((state) => {
        Object.assign(state as object, externalInit);

        // 使用 Object.assign 将 externalInit 的属性复制到当前状态（Draft）上
        // 这样可以确保类型安全，并且符合 Immer 的使用规范
        Object.assign(state as object, externalInit);
      });
    }

    return store;
  };

  return {
    useStore,
    useHydratedStore,
    getState: useStore.getState,
  };
}
