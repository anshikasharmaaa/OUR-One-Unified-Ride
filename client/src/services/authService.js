import { http, refreshSession, tokenStore } from "./http";

const unwrap = (p) => p.then((r) => r.data);

export const authService = {
  register: (body) => unwrap(http.post("/auth/register", body)),
  verifyEmail: (body) => unwrap(http.post("/auth/verify-email", body)),
  resendVerification: (email) =>
    unwrap(http.post("/auth/resend-verification", { email })),
  login: (body) => unwrap(http.post("/auth/login", body)),
  google: (credential) => unwrap(http.post("/auth/google", { credential })),
  forgotPassword: (email) =>
    unwrap(http.post("/auth/forgot-password", { email })),
  verifyResetOtp: (body) => unwrap(http.post("/auth/verify-reset-otp", body)),
  resetPassword: (body) => unwrap(http.post("/auth/reset-password", body)),
  logout: async () => {
    try {
      await http.post("/auth/logout");
    } finally {
      tokenStore.set(null);
    }
  },
  restore: () => refreshSession(),
};

export const adminService = {
  login: (body) => unwrap(http.post("/admin/login", body)),
};
