import type { Slice } from "@reduxjs/toolkit";
import { useAppDispatch } from "~/store/hooks";

type GetArrFirst<T> = T extends [infer Res] ? Res : unknown;

export const useCreateReduxFunction = <S extends Slice>(slice: S) => {
  return <T extends keyof S["actions"]>(name: T) => {
    const dispatch = useAppDispatch();
    const actionCreator = (slice.actions as S["actions"])[name];

    return (payload?: GetArrFirst<Parameters<typeof actionCreator>>) => {
      dispatch(actionCreator(payload));
    };
  };
};
