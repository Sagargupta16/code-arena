import { useState, useEffect, useRef } from "react";

export function useTimer() {
  const [remaining, setRemaining] = useState<number>(0);
  const callbackRef = useRef<(() => void) | null>(null);

  // Stable identity (a state setter), so callers can list it as an effect dependency.
  const setFromServer = setRemaining;

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
