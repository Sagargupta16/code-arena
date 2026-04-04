import { useState, useEffect, useRef } from "react";

export function useTimer() {
  const [remaining, setRemaining] = useState<number>(0);
  const callbackRef = useRef<(() => void) | null>(null);

  const setFromServer = (seconds: number) => setRemaining(seconds);

  const onExpire = (cb: () => void) => {
    callbackRef.current = cb;
  };

  useEffect(() => {
    if (remaining === 0 && callbackRef.current) {
      callbackRef.current();
    }
  }, [remaining]);

  const formatted = `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;

  return { remaining, formatted, setFromServer, onExpire };
}
