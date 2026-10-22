import { useEffect, useState } from 'react';

/** Seconds remaining until `targetMs` (epoch ms). Ticks once a second; 0 when reached. */
export default function useCountdown(targetMs) {
  const calc = () => Math.max(0, Math.ceil(((targetMs || 0) - Date.now()) / 1000));
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!targetMs) return undefined;
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);
  return left;
}
export const formatClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
