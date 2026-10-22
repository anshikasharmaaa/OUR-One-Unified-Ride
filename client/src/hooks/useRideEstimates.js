import { useCallback, useEffect, useState } from "react";
import { rideComparisonService } from "../services/rideComparisonService";
import { apiErrorMessage } from "../utils/errors";

/** Fetches estimates for a stored comparison. Aborts on unmount / refresh so an old response can't overwrite a new one. */
export default function useRideEstimates(comparisonId) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, status: "loading", error: "" }));
    rideComparisonService
      .compare(comparisonId, { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data, error: "" }))
      .catch((err) => {
        if (err.code === "ERR_CANCELED") return;
        setState({
          status: "error",
          data: null,
          error: apiErrorMessage(err, "We could not load ride estimates."),
        });
      });
    return () => ctrl.abort();
  }, [comparisonId, attempt]);

  const refresh = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, refresh };
}
