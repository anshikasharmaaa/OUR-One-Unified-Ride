# OUR — One Unified Ride

**One Search, Infinite Choices.** Phase 1: authentication and authorization for riders, administrators and drivers.

React + Vite + CSS Modules (client) · Node + Express + MongoDB Atlas + Mongoose (server). No ride-comparison, maps or payments yet.

---

## 1. Where to put the logo (do this first)

```
OUR/client/public/assets/logo.png      <-- put your logo here, exactly this name
```

That one file is used by every auth page, the navbar, the browser tab icon / metadata, and (via a public URL) the emails.
The UI sets only the logo's **height**; the width follows, so proportions are never distorted. Use a transparent PNG, ideally ≥ 2x size.
If the file is missing the UI shows the plain text "OUR" and logs a console warning.

**Emails:** email clients cannot load `localhost`. Upload `logo.png` somewhere public (your deployed client, a CDN, or any image host) and set `EMAIL_LOGO_URL` in `server/.env`. If you leave it blank the server uses `<CLIENT_URL>/assets/logo.png`, which works once the client is deployed.

## 2. Project layout

```
OUR/
  client/                    React app (Vite, JavaScript, CSS Modules)
    public/assets/logo.png   <-- YOUR LOGO
    src/
      components/{common,auth}   Button, TextField, PasswordField, OtpInput, AuthLayout, GoogleButton ...
      pages/{auth,user,admin,driver,common}
      layouts/AppShell.jsx       navbar + placeholder shell
      routes/guards.jsx          RequireRole / PublicOnly
      context/                   AuthContext (session), ToastContext
      services/                  http.js (axios + refresh), authService.js
      styles/tokens.css          design tokens
  server/
    config/ controllers/ middleware/ models/ routes/ services/ validators/ templates/ utils/ scripts/ tests/
    app.js  server.js
```

## 3. Quick start

Requirements: Node 18.18+ (tested on 22), a MongoDB Atlas cluster, an SMTP account.

```bash
# Backend
cd server
cp .env.example .env        # then fill it in (sections 4-8)
npm install
npm run bootstrap:admin     # creates the first admin (idempotent)
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Routes: `/login` `/signup` `/verify-email` `/forgot-password` `/reset-password` · riders land on `/app` · drivers: `/driver/login`, `/driver/register`, `/driver` · admin entry: `/our-control` → `/admin`.

## 4. MongoDB Atlas

1. atlas.mongodb.com → create a project and a free **M0** cluster (pick a region near you, e.g. Mumbai).
2. **Database Access → Add New Database User**: password auth, a strong generated password, role **Read and write to any database** is fine for dev; for production restrict to the `our` database only.
3. **Network Access → Add IP Address → "Add Current IP Address"**. For production add only your server's static egress IP(s). **Never leave `0.0.0.0/0` enabled** (the "Allow access from anywhere" option).
4. **Database → Connect → Drivers** → copy the `mongodb+srv://...` string. Replace `<password>` (URL-encode special characters) and add the database name `our` before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/our?retryWrites=true&w=majority`
5. Put it in `server/.env` as `MONGODB_URI`. Indexes (unique email, mobile, Google subject, TTL cleanup) are built automatically at startup.

## 5. Secrets

Generate **three different** values (each ≥ 32 chars):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run it three times for `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `OTP_SECRET`. Never commit `.env`; `.gitignore` already excludes it. The server refuses to start with missing/short secrets (and in production, with duplicates).

## 6. SMTP (real email)

Any SMTP provider works. Examples:

- **Gmail** (needs 2-Step Verification on): Google Account → Security → _App passwords_ → create one. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER=you@gmail.com`, `SMTP_PASS=<16-char app password>`, `EMAIL_FROM="OUR <you@gmail.com>"`.
- **Brevo / Mailgun / SES / Zoho**: use their SMTP credentials the same way (port 465 → `SMTP_SECURE=true`).
- For quick dev inboxes use Mailtrap or Ethereal.
  Without SMTP configured, signup/OTP endpoints answer `503 EMAIL_NOT_CONFIGURED` — nothing is faked and OTPs are never printed to logs.

## 7. Google sign-in

1. console.cloud.google.com → create/select a project → **APIs & Services → OAuth consent screen** (External, add your email as a test user while in testing).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorized JavaScript origins**: `http://localhost:5173` (and your production origin). Redirect URIs are not needed for the ID-token popup flow.
4. Copy the client ID to **both** `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID`). It is a public identifier, not a secret.
5. Restart both servers. If it isn't configured, the UI shows "Google sign-in is temporarily unavailable" and the API returns 503.

## 8. First admin

In `server/.env` set `ADMIN_NAME`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` (12+ characters, upper, lower, number, symbol), then run `npm run bootstrap:admin`.

- Idempotent: if the admin already exists nothing changes, and an existing password is **never** reset.
- Hashed with bcrypt; plaintext is never stored. Missing/weak values → the script exits with an error and creates nothing.
- After bootstrapping you may delete `ADMIN_PASSWORD` from `.env`.
- **Credential recovery (no public endpoint exists):** on a trusted machine with DB access run
  `NEW_ADMIN_PASSWORD='<new strong password>' npm run admin:reset-password -- --confirm`
  It resets the password of `ADMIN_EMAIL` and revokes all of that admin's sessions.

## 9. Architecture & security decisions

**Sessions:** short-lived JWT _access token_ (15 min, HS256, held **in memory only**) + opaque _refresh token_ in an `HttpOnly`, `Secure` (production), `SameSite` cookie scoped to `/api/auth`. Refresh tokens are random, stored only as an HMAC, **rotated on every use**, and grouped in a family. Replaying a rotated token outside a 10 s grace window (a concurrent-tab race) revokes the whole family. Logout, password reset and account suspension revoke sessions; every protected request re-checks that the session family is live and the account is still allowed (so suspending a driver takes effect immediately). Lifetimes: rider 30 d with "keep me signed in" else 1 d; driver 14 d / 1 d; admin 8 h session cookie. Lifetimes are absolute from login.
**CSRF:** the cookie is only used by `/refresh` and `/logout`; both require a request `Origin` equal to `CLIENT_URL` plus an `X-Requested-With: OUR` header. All other endpoints authenticate with the `Authorization` header, so they are not CSRF-able. CORS allows a single origin with credentials — never `*`.
**If frontend and API are on different _sites_ in production** set `COOKIE_SAMESITE=none` (requires https). Same-site setups (e.g. `app.x.com` + `api.x.com`) keep `lax`.
**OTP:** 6 digits from `crypto.randomInt`, stored as HMAC(secret, purpose:email:code), 10 min expiry (also checked in code, TTL index is only cleanup), 5 attempts counted atomically before comparison, single-use, previous codes replaced, 60 s resend cooldown, purpose-bound (verification ≠ reset). Verify/resend/forgot responses are generic so addresses can't be enumerated.
**Password reset:** OTP → short-lived reset token bound to the current password hash (spent the moment the password changes) → new bcrypt hash → all sessions revoked. Admin accounts are excluded.
**Roles:** `USER`/`ADMIN`/`DRIVER` derive from server state only. Request bodies are validated with strict Zod schemas — unknown fields (e.g. `role`, `approvalStatus`) are rejected. Middleware: `requireAuth`, `requireRole(...)`. 401 = not authenticated, 403 = not allowed.
**Drivers:** register → verify email → status `PENDING`. Only `APPROVED` + verified drivers get a session; pending / rejected / suspended get a specific 403 message and no cookie or token.
**Google:** ID token verified server-side (signature, issuer, audience = your client ID, expiry) with `google-auth-library`; `email_verified` must be true; identity key is the Google `sub`. Linking: a verified local account with the same email is linked (both identities proven); an _unverified_ pre-registration has its password discarded first (blocks pre-registration takeover); admin accounts can never be used via Google.
**Other:** Helmet, request size limit (10 kB), rate limits (login 10/15 min per IP+email, admin 5, OTP send 5, OTP verify 10, …), generic login errors with constant-time dummy compare, `Cache-Control: no-store` on the API, structured pino logs with secrets redacted, centralized error handler (no stack traces in production), `/api/health`, graceful shutdown.

## 10. API

All responses: `{ success, message, data }` or `{ success:false, message, code, errors:[{field,message}] }`.
| Method & path | Purpose |
|---|---|
| POST `/api/auth/register` | Create rider (unverified) + email OTP |
| POST `/api/auth/verify-email` · `/resend-verification` | Confirm / resend code |
| POST `/api/auth/login` | Rider login (`rememberMe` optional) |
| POST `/api/auth/google` | `{credential}` Google ID token |
| POST `/api/auth/forgot-password` → `/verify-reset-otp` → `/reset-password` | Reset flow |
| POST `/api/auth/refresh` · `/logout` | Rotate / revoke (cookie + Origin guard) |
| GET `/api/auth/me` | Rider profile (role USER) |
| POST `/api/driver/register` · `/verify-email` · `/resend-verification` · `/login` · GET `/me` | Driver flow (role DRIVER) |
| POST `/api/admin/login` · GET `/api/admin/me` | Admin (role ADMIN) |
| GET `/api/health` | Liveness + DB state |

## 11. Tests

```bash
cd server && npm test      # 49 tests, needs a MongoDB *test* database
cd client && npm test      # 30 tests (jsdom)
npm run lint && npm run build   # in each folder
```

Server tests refuse to run unless the database name ends in `_test`. Defaults to `mongodb://127.0.0.1:27017/our_test`; override with `TEST_MONGODB_URI` (e.g. a separate Atlas database named `our_test`). Email and Google verification are mocked; no real email is sent. By default the suite skips the partial-unique and TTL indexes (`SKIP_ADVANCED_INDEXES=true`) so it also runs on Mongo-compatible servers; on real MongoDB run `SKIP_ADVANCED_INDEXES=false npm test`.

**Manual integration check (real services):**

1. Start both apps with SMTP, Atlas and Google configured. 2. Sign up → receive the email → enter the code → log in. 3. Log out, "Forgot password" → code → new password → log in. 4. "Continue with Google". 5. `/our-control` with the bootstrapped admin. 6. `/driver/register` → verify → login shows "awaiting approval". Approve in Atlas by setting `approvalStatus: "APPROVED"` on that driver, then log in again. 7. As a rider, open `/admin` and `/driver` — access is denied.

## 12. Troubleshooting

- **Server exits with "Invalid environment configuration"** → the message lists the variable names to fix.
- **`MongooseServerSelectionError`** → wrong URI/password (URL-encode symbols) or your IP isn't in Atlas Network Access.
- **CORS error / cookie not saved** → `CLIENT_URL` must exactly equal the browser origin (scheme + host + port). Use `localhost` consistently.
- **Signup says email can't be sent (503)** → SMTP variables missing or wrong; check provider app-password rules.
- **Google button missing** → `VITE_GOOGLE_CLIENT_ID` unset, or the origin isn't listed under Authorized JavaScript origins.
- **Logged out on every refresh in production across domains** → set `COOKIE_SAMESITE=none` and use https.

## 13. Known limitations / next phases

No terms/privacy checkbox (no policy content exists yet); no admin approval UI (set `approvalStatus` in the database for now); no per-account lockout beyond rate limits; unverified sign-ups are not auto-purged; no MFA for admins; access tokens are stateless for ≤15 min but each request still checks session + account state in the database. Ride comparison, Google Maps, Razorpay and dashboards are later milestones.
