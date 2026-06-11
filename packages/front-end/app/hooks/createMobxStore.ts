import { makeAutoObservable } from "mobx";
import type { IReactionDisposer } from "mobx";
import { useState, useEffect, useMemo } from "react";

interface StoreOptions<TState, TActions> {
  // 1. 初始状态
  initialState: TState;
  // 2. 动作定义（接收 state 本身，方便内部修改）
  actions: (state: TState) => TActions;
  // 3. 可选：自定义联动逻辑（副作用）
  setupEffects?: (
    state: TState,
    dispose: (disposer: IReactionDisposer) => void,
  ) => void;
}

export function createMobxStore<TState extends object, TActions extends object>(
  options: StoreOptions<TState, TActions>,
) {
  // 返回一个自定义 Hook
  return function useStore(externalInit?: Partial<TState>) {
    const [store] = useState(() => {
      // 1. 合并外部初始化数据
      const state = { ...options.initialState, ...externalInit } as TState;

      // 2. 生成 Actions
      const actions = options.actions(state);

      // 3. 使状态和动作响应式化
      makeAutoObservable(state);

      // 4. 处理外部传入的联动逻辑
      const disposers: IReactionDisposer[] = [];
      if (options.setupEffects) {
        options.setupEffects(state, (disposer) => disposers.push(disposer));
      }

      return { state, actions, _disposers: disposers };
    });

    // 组件卸载时，自动清理所有 reaction
    useEffect(() => {
      return () => {
        store._disposers.forEach((dispose) => dispose());
      };
    }, [store]);

    // 暴露一个用于异步初始化的方法
    const hydrate = useMemo(() => {
      return (data: Partial<TState>) => {
        Object.assign(store.state, data);
      };
    }, [store]);

    return { ...store.state, ...store.actions, hydrate };
  };
}
