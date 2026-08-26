# Authentication: server-side sessions with Admin/User roles

The API currently has no authentication — any origin, no auth dependency on any router — which was
not a deliberate choice; it needs closing with two roles: Admin (full CRUD on business records, plus
sole authority to manage accounts, Dropdown Options, and Settings) and User (CRU, not Delete, on
business records; read-only on Dropdown Options/Settings). We chose an httpOnly session cookie
backed by a server-side `sessions` table (opaque token → user_id, expires_at) over a stateless
signed/JWT cookie: instant revocation (disabling a user takes effect immediately, no waiting out a
token's lifetime) matters more here than avoiding a DB lookup per request, and at this app's scale
that lookup is free. Sessions use a 30-day sliding expiration, refreshed on activity. There's no
public signup — this is single-tenant (one business). The first Admin account is seeded on startup
if none exists yet: from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars if set, otherwise a hardcoded
`admin`/`admin` fallback so the first deploy needs no `.env` edit or manual command. That fallback is
a known-credentials risk accepted deliberately for a private, trusted-network single-tenant app — the
seed logs a warning telling the operator to change the password after first login.
