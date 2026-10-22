import { useCallback, useEffect, useRef, useState } from "react";
import { rideBookingService } from "../services/rideComparisonService";
import { apiErrorMessage } from "../utils/errors";

const POLL_MS = 2000;

/**
 * Polls a demo booking until the simulation settles (arrived / cancelled / no driver).
 * One timer + one in-flight request at a time, both cleared on unmount, so leaving the page stops everything.
 */
export default function useBooking(id) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [attempt, setAttempt] = useState(0);
  const timer = useRef(null);
  const ctrl = useRef(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      ctrl.current = new AbortController();
      try {
        const data = await rideBookingService.get(id, {
          signal: ctrl.current.signal,
        });
        if (!alive) return;
        setState({ status: "ready", data, error: "" });
        if (!data.settled) timer.current = setTimeout(tick, POLL_MS);
      } catch (err) {
        if (!alive || err.code === "ERR_CANCELED") return;
        const error = apiErrorMessage(err, "We could not load this booking.");
        setState((s) =>
          s.data ? { ...s, error } : { status: "error", data: null, error },
        );
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer.current);
      ctrl.current?.abort();
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const cancel = useCallback(async () => {
    clearTimeout(timer.current); // stop polling first so a stale response can't overwrite the cancelled state
    ctrl.current?.abort();
    const data = await rideBookingService.cancel(id);
    setState({ status: "ready", data, error: "" });
    return data;
  }, [id]);

  return { ...state, retry, cancel };
}
