export const EVENT_LABEL = {
  COMPARISON_CREATED: "Fares compared",
  DEMO_BOOKING_CREATED: "Demo booking created",
  DEMO_BOOKING_CANCELLED: "Demo booking cancelled",
  PROVIDER_OPENED: "Provider opened",
};
export const EVENT_NOTE = {
  COMPARISON_CREATED: "You searched a route and compared ride options.",
  DEMO_BOOKING_CREATED:
    "A simulated booking. No ride was requested from the provider.",
  DEMO_BOOKING_CANCELLED:
    "You cancelled a simulated booking. Nothing was cancelled with a provider.",
  PROVIDER_OPENED:
    "You continued to the provider. OUR cannot see whether a booking was made there.",
};
export const EVENT_TONE = {
  COMPARISON_CREATED: "neutral",
  DEMO_BOOKING_CREATED: "warn",
  DEMO_BOOKING_CANCELLED: "bad",
  PROVIDER_OPENED: "good",
};
export const PROVIDER_NAME = { ola: "Ola", uber: "Uber", rapido: "Rapido" };
export const RIDE_FILTERS = [
  { label: "All", value: undefined },
  { label: "Fares compared", value: "COMPARISON_CREATED" },
  { label: "Provider opened", value: "PROVIDER_OPENED" },
  { label: "Demo bookings", value: "DEMO_BOOKING_CREATED" },
  { label: "Demo cancellations", value: "DEMO_BOOKING_CANCELLED" },
];
