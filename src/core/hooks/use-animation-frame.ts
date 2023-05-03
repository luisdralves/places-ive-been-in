import { useEffect, useRef } from 'react';

export function useAnimationFrame(callback?: (delta?: number) => void, isActive?: boolean) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    if (!callback || isActive === false) {
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;

        if(deltaTime > 200) {
          previousTimeRef.current = time;
          callback(deltaTime);
        }
      } else {
        previousTimeRef.current = time;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, isActive]);
}
