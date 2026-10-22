"use strict";
// Controlled simulation. Progress is derived from timestamps, so there are no server timers and a refresh never loses it.
const STEPS = [
  { key: "preparing", label: "Preparing your booking", at: 0 },
  { key: "searching", label: "Searching for drivers", at: 3 },
  { key: "checking", label: "Checking nearby availability", at: 7 },
  { key: "assigned", label: "Demo driver assigned", at: 11 },
  { key: "en_route", label: "Driver is on the way", at: 15 },
];
const APPROACH_SECONDS = 45; // how long the simulated vehicle takes to reach the pickup point

function progressFor(
  { createdAt, cancelledAt, hasDriver, etaMinutes },
  now = Date.now(),
) {
  const start = new Date(createdAt).getTime();
  const end = cancelledAt ? new Date(cancelledAt).getTime() : now;
  const s = Math.max(0, (end - start) / 1000);
  let idx = 0;
  STEPS.forEach((st, k) => {
    if (s >= st.at) idx = k;
  });

  const base = { approach: 0, etaMinutesRemaining: null, showDriver: false };
  if (cancelledAt)
    return {
      ...base,
      status: "cancelled",
      statusLabel: "Booking cancelled",
      stepIndex: idx,
      settled: true,
    };
  if (!hasDriver && idx >= 3)
    return {
      ...base,
      status: "no_driver",
      statusLabel: "No demo driver available",
      stepIndex: 2,
      settled: true,
    };

  const approach =
    idx === 4 ? Math.min(1, (s - STEPS[4].at) / APPROACH_SECONDS) : 0;
  const arrived = approach >= 1;
  return {
    status: STEPS[idx].key,
    statusLabel: arrived
      ? "Demo driver has reached the pickup point"
      : STEPS[idx].label,
    stepIndex: idx,
    approach,
    etaMinutesRemaining:
      idx === 4 && Number.isFinite(etaMinutes)
        ? Math.ceil(etaMinutes * (1 - approach))
        : null,
    settled: arrived,
    showDriver: idx >= 3,
  };
}
module.exports = { STEPS, APPROACH_SECONDS, progressFor };
