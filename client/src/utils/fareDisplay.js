const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/**
 * One displayable amount from the API's {min,max,currency}.
 * Uses the midpoint, the same value rideRecommendations.js already ranks by, so what is shown matches how options are ordered.
 * Returns null when the data can't support a price.
 */
export function primaryFare(fare) {
  if (!fare || !isNum(fare.min) || !isNum(fare.max)) return null;
  return {
    amount: Math.round((fare.min + fare.max) / 2),
    currency: fare.currency || "INR",
  };
}

export function formatAmount(p) {
  if (!p) return null;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: p.currency,
      maximumFractionDigits: 0,
    }).format(p.amount);
  } catch {
    return `${p.currency} ${p.amount}`;
  }
}
