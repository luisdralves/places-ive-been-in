import { useEffect, useState } from 'react';

type Options<T> = {
  comparator?: (a: T, b: T) => boolean;
  delay?: number;
};

export function useDelayedState<T>(state: T, options?: Options<T>) {
  const [delayedState, setDelayedState] = useState(state);
  const { comparator, delay = 250 } = options ?? {};

  useEffect(() => {
    if (state === delayedState || comparator?.(state, delayedState)) {
      return;
    }

    const timeout = setTimeout(() => {
      setDelayedState(state);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [comparator, delay, delayedState, state]);

  return delayedState;
}
