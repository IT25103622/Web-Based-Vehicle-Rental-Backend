# SLIIT Vehicle Rental — Unified Frontend

A single React (Vite) app that consumes the merged Spring Boot backend
(`../backend`) and brings together all five team modules behind one
sign-in, one dark indigo/purple theme, and one top navigation bar.

## Modules

| Module | Route | Sub-tabs |
|---|---|---|
| Access Control & Security | `/access-control` | Users · Roles & Permissions · Audit Log · Security Settings · Backups |
| Fleet & Inspection | `/fleet` | Dashboard · Vehicle Catalog · Inspections |
| Booking | `/booking` | Browse & Book · My Bookings · Manage Bookings (staff) |
| Support Tickets | `/support` | My/All Tickets (role-aware single view) |
| Pricing & Promotions | `/pricing` | Calculate Quote · Discount Rules · Promotions |

Each module's visible tabs and actions are gated client-side by the
permission codes returned at login (`accesscontrol.security.PermissionCodes`
on the backend), mirrored in `src/constants/permissions.js`. The backend is
still the real enforcement point via `@RequiresPermission`.

## Running locally

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend, default http://localhost:8080/api
npm run dev
```

Requires the backend running (see `../backend/README` / `application.properties.example`)
with `database/schema.sql` applied first.

## Auth flow

`POST /api/auth/login` → if `mfaRequired`, the UI prompts for the emailed
OTP and calls `POST /api/auth/verify-otp`; otherwise the JWT, role, and
permission set returned are stored and attached as `Authorization: Bearer`
on every subsequent request (`src/api/client.js`). A 401 response clears
the session and redirects to `/login`.

## Build

```bash
npm run build
```

Verified to build cleanly with Vite/Rollup (no Maven-equivalent blocker
here, unlike the backend sandbox).
