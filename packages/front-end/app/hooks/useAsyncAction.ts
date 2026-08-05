import { useState, useCallback } from 'react';
import { useAppDispatch } from '~/store/hooks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAsyncAction = (actionCreator: any) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [error, setError] = useState<any>(null);

  const execute = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        await dispatch(actionCreator(...args)).unwrap(); // .unwrap() 可以直接拿到 fulfilled 的数据或抛出 rejected 的错误
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, actionCreator],
  );

  return { execute, loading, error };
};
