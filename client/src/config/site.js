// Public contact address for the website. Set VITE_CONTACT_EMAIL in client/.env — nothing is invented here.
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();
export const VEHICLE_OPTIONS = [
  { value: "ANY", label: "Any" },
  { value: "BIKE", label: "Bike" },
  { value: "AUTO", label: "Auto" },
  { value: "ECONOMY_CAB", label: "Economy cab" },
  { value: "PREMIUM_CAB", label: "Premium cab" },
];
export const VEHICLE_LABEL = Object.fromEntries(
  VEHICLE_OPTIONS.map((v) => [v.value, v.label]),
);
