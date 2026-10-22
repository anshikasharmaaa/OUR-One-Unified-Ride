export const GENDER_LABEL = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};
export const FAVORITE_LABEL = {
  HOME: "Home",
  WORK: "Work / College",
  FAMILY: "Family",
  OTHER: "Custom",
};
export const AVATAR_COLORS = [
  "blue",
  "navy",
  "cyan",
  "indigo",
  "teal",
  "violet",
];
// Same colours as the .av_* classes in Profile.module.css, for places that cannot use that module (the navbar).
export const AVATAR_GRADIENT = {
  blue: "linear-gradient(135deg, #1d4ed8, #2f7bff)",
  navy: "linear-gradient(135deg, #0f1b3d, #1e3a8a)",
  cyan: "linear-gradient(135deg, #0e7490, #0891b2)",
  indigo: "linear-gradient(135deg, #3730a3, #6366f1)",
  teal: "linear-gradient(135deg, #0f766e, #14b8a6)",
  violet: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
};
export const MOBILE_RE = /^[6-9]\d{9}$/;
// The server accepts up to 150 KB (150 * 1024 bytes).
export const AVATAR_MAX_BYTES = 150 * 1024;
