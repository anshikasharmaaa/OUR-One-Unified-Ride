export function money(n, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}
export const fareText = (f) =>
  f
    ? f.min === f.max
      ? money(f.min, f.currency)
      : `${money(f.min, f.currency)} – ${money(f.max, f.currency)}`
    : null;
export const timeText = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};
export const SOURCE_LABEL = {
  live: "Live estimate",
  sandbox: "Sandbox response",
  demo: "Demo estimate",
};
export const AVAIL_LABEL = {
  available: "Available",
  unavailable: "Unavailable",
  unknown: "Availability not provided",
};
export const VEHICLE_ICON = {
  bike: "bike",
  auto: "auto",
  economy_cab: "car",
  premium_cab: "car",
};
