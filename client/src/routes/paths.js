// Where each role lands after signing in. Normal users land on the main home page; admins have their own console.
export const HOME = { USER: "/", ADMIN: "/admin" };
export const homeFor = (role) => HOME[role] || "/login";
// The "my dashboard" destination for each role (users reach theirs from the navbar).
export const DASHBOARD = { USER: "/profile", ADMIN: "/admin" };
export const dashboardFor = (role) => DASHBOARD[role] || "/login";

// A signed-in user must never be "returned" to an auth screen or another role's area.
const USER_BLOCKED = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/our-control",
  "/admin",
  "/rider",
  "/app",
];
const isUnder = (path, base) => path === base || path.startsWith(`${base}/`);

/** Only follow a "return to" path if it is an internal path this role may open. Prevents open redirects. */
export function safeRedirect(from, role) {
  const path = typeof from === "string" ? from : from?.pathname;
  const home = homeFor(role);
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//")
  )
    return home;
  if (role === "USER")
    return USER_BLOCKED.some((b) => isUnder(path, b)) ? home : path;
  return isUnder(path, home) ? path : home;
}
