import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index"; // 从你的 store/index.ts 导入推断出的类型

// 替代 useDispatch，自动支持 RTK 的 Thunk 异步派发类型
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 替代 useSelector，自动推导 state 类型，无需每次手写 (state: RootState)
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
