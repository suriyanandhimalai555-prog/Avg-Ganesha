claudex# CLAUDE.md — World of Agilavetri Ganesha (Ganesha Seva Platform)

This file orients any Claude session working in this repo. Read the **Production Database** rule first — it is non-negotiable.

## What this application is

**World of Agilavetri Ganesha** (a.k.a. the *Ganesha Seva Platform*) is a devotee portal for a Ganesha temple / seva foundation. It has two audiences:

- **Devotees (role `USER`)** — register (usually via an **invite code**, forming a referral tree), complete **KYC** verification, browse **seva/donation** categories, submit donations with a payment proof, and track their contributions and **AVG coin** rewards.
- **Admins (role `ADMIN`)** — manage devotees, review KYC, confirm/reject seva offerings, record seva on behalf of a devotee, view the invite tree, and configure the donation bank account — all from an **admin console**.

The signature reward: donating the **1.5 Ft statue** seva earns **100 AVG coins**, locked (non-withdrawable) for **5 years**. No other seva earns coins. *(500 coins was a promotional rate that applied to seva up to 7 Sep 2026.)*

---

## ⚠️ PRODUCTION DATABASE — READ-ONLY FOR CLAUDE

**The database configured in `backend/.env` (`DATABASE_URL`) is the LIVE PRODUCTION Postgres containing real devotee, KYC, and donation data.** Treat every DB interaction as production.

**Hard rules:**

1. **Read-only queries only.** Claude may run `SELECT` / read-only inspection queries. **Never** run `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `DROP`, `CREATE`, or any DDL / migration against this database.
2. **Never execute destructive or write scripts.** In particular, do **not** run:
   - `backend/delete_user_by_email.js`
   - `backend/wipe_users.js`
   - `backend/wipe_donations.js`
   - …or any other script/command that writes, deletes, or wipes data.
3. **Do not casually start the backend.** Booting it (`npm run dev` / `npm start`) runs `initDb()` (`backend/src/shared/initDb.js`), which executes `CREATE TABLE` DDL **and a coin backfill (writes)** against whatever `DATABASE_URL` points to — i.e. production. Only start the backend if the user explicitly asks and understands this.
4. **Writing code that writes to the DB is fine; executing those writes against the live DB is not.** You may author `INSERT`/`UPDATE` logic in application code. The **user** runs and verifies data-affecting changes themselves — ideally against a throwaway/test record.
5. **When a change needs DB verification, hand the user exact steps** to run, rather than running them yourself. (Note: even a rolled-back transaction can consume a sequence value like `statue_number_seq`, which is irreversible — so don't "just test it".)
6. **Never print secret values** from `backend/.env` (DB URL, JWT secret, AWS keys) into the transcript, code, or commits. Reference env var **names** only.

---

## Architecture

Monorepo with two apps: `backend/` (API) and `client/` (SPA).

### Backend — `backend/`
- **Node.js + Express 5**, ESM (`"type": "module"`). Entry: `src/server.js`. Default port **5001**.
- **Postgres** via `pg` Pool — `src/shared/db.js` exports `pool` and `query(text, params)`. Connects with `DATABASE_URL` (or `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`); SSL on in production.
- **Redis** — `src/shared/redis.js`; used for response caching and rate-limiting (`getCachedData`/`invalidateCache`).
- **AWS S3** — `src/shared/s3.js`; stores KYC documents and donation payment proofs (served via signed URLs).
- **Auth** — JWT (`src/middleware/authMiddleware.js`: `authenticateToken`, `authorizeRole('ADMIN')`), bcrypt password hashing.
- Hardening: helmet, cors (allow-list via `CLIENT_URL`), express-rate-limit (Redis store), morgan, compression, multer (5 MB upload cap).
- **Modules** (`src/modules/<name>/<name>.routes.js` + `.controller.js`): `auth`, `invites`, `kyc`, `admin`, `plans`, `settings`, `donations`.
- **Schema bootstrap**: `src/shared/initDb.js` runs on server start (see the production rule above).
- Health check: `GET /health` (returns DB connectivity).
- Scripts: `npm run dev` (nodemon), `npm start`.

### Frontend — `client/`
- **React 19 + Vite 7**, Redux Toolkit, React Router 7.
- **Tailwind CSS 3** — royal dark-blue `#060B28` + gold `#FBDB8C` temple theme. **All shared style tokens live in `src/styles/index.styles.js`** (`commonStyles`, `adminStyles`, `sidebarStyles`, etc.) — reuse these instead of ad-hoc classes.
- API base + route map: `src/config/api.js` (`API_BASE_URL` defaults to `http://localhost:5001`, override with `VITE_API_URL`). Axios instance: `src/api/axios.js`.
- Pages: `src/pages/` (devotee portal) and `src/pages/admin/` (admin console).
- Scripts: `npm run dev`, `npm run build`, `npm run lint`. **Run lint + build before considering frontend work done.**

---

## Domain concepts & data model

- **users** — `role` (`USER` | `ADMIN`), `kyc_status` (`PENDING` | `SUBMITTED` | `APPROVED` | `REJECTED`), `invited_by` (self-FK → referral tree; `NULL` = organic signup), `full_name`, `email`, `phone_number`.
- **Invite tree** — each user may be invited by another; the admin invite-tree view renders the full referral forest (roots = organic signups).
- **KYC lifecycle** — devotee uploads ID docs (S3) → `SUBMITTED` → admin `APPROVED`/`REJECTED` (with reason).
- **donation_categories** — seva types; some have a fixed price (e.g. `statue_1_5_ft`, `statue_250_ft`) sourced from `system_settings`.
- **donations** — `user_id`, `category_id`, `amount`, `payment_proof_path`, `statue_number`, `status` (`PENDING` | `CONFIRMED` | `REJECTED`), `rejection_reason`. Statue seva assigns a `statue_number` from `statue_number_seq` on a devotee's **first** statue donation.
- **user_avg_coins** — AVG coin ledger, `UNIQUE(donation_id)` for idempotency. **Coins are credited only for `slug='statue_1_5_ft'` on a CONFIRMED donation** — **100 coins** (was 500 for seva up to 7 Sep 2026), locked 5 years from purchase date. See `awardStatueCoins()` in `backend/src/modules/donations/donations.controller.js`; enforced identically in `reviewDonation`, `createAdminEntry`, and the `initDb` backfill.
- **system_settings** — key/value store; holds the donation bank account details shown to devotees and the statue prices.

---

## Admin console (`client/src/pages/admin/`)

Zoho-style shell with a persistent left sidebar. Modules:

| Sidebar item | Route | Notes |
|---|---|---|
| Overview | `/admin` | Dashboard: stat cards + "needs attention" quick actions |
| Devotees | `/admin/devotees` | Directory, KYC docs, edit contact, approve/reject KYC |
| KYC Review | `/admin/devotees?filter=SUBMITTED` | Same page pre-filtered; sidebar **badge** = pending KYC count |
| Seva Offerings | `/admin/seva` | Review/confirm donations; sidebar **badge** = pending seva count |
| Record Seva | `/admin/seva-entry` | Record a seva **on behalf of** a devotee |
| Invite Tree | `/admin/invite-tree` | Referral forest |
| Settings | `/admin/settings` | Donation bank account details |

Key wiring to preserve when editing admin code:
- **`AdminLayout`** fetches `/api/admin/stats`, feeds the sidebar badges, and shares stats to child pages via `<Outlet context>`. It listens for the `admin:refresh-stats` window event — children dispatch it after KYC/role/seva actions to refresh counts. Keep this contract intact.
- **Deep-link query params are a contract**: `?filter=SUBMITTED|APPROVED|ALL` (Devotees), `?status=PENDING` (Seva). Both pages two-way-sync URL ↔ state.
- Shared UI chrome (page header, search, filter chips, card, pagination) lives in `client/src/pages/admin/AdminChrome.jsx` — reuse it for new admin pages.

---

## Current work

Branch **`admin-console-redesign`**. The redesign + coin change are **merged & pushed to `main`**;
the STAFF-role work below is **on the branch, uncommitted**.

**Shipped to `main`:**
1. **Zoho-style admin redesign** (royal theme preserved): sidebar shell `AdminLayout.jsx`, Overview `AdminDashboard.jsx`, shared `AdminChrome.jsx`, restyled Devotees/Seva/Invite Tree/Settings.
2. **Record-seva-on-behalf**: `POST /api/donations/admin/entry` (`createAdminEntry`) + `AdminSevaEntry.jsx`. Reuses the statue-number + coin logic. **Coins remain 1.5 Ft-statue-only.**
3. **Statue coin reward was raised 100 → 500 (promotional, up to 7 Sep 2026), then reverted to 100 from 8 Sep 2026** (`STATUE_15FT_COIN_REWARD = 100` in `donations.controller.js`; also `initDb.js` backfill literal, `AdminSevaEntry.jsx` copy, this file). The 11 post-cutoff rows (donation IDs 436–446) were corrected 500→100 directly on prod by the user via a transaction-wrapped UPDATE.
4. **Statue numbering is now `MAX(statue_number)+1`** conceptually via the counter being reset on cleanup — after deleting the only holder of a seat, the next confirmed statue reuses it. (Achieved operationally by a `setval('statue_number_seq', …)` reset, not a code change.)

**On the branch, NOT committed — `STAFF` role + attribution:**
- New role `STAFF` (console operator / data entry): full console **minus god-powers**. Backend guards widened to `authorizeRole('ADMIN','STAFF')` on admin/donations/kyc routes; **`POST /api/admin/role`, `PUT /settings`, `PUT /plans` stay ADMIN-only**. `ROLES` in `config/index.js` gained `STAFF`.
- **Attribution columns** (added idempotently by `initDb.js`, `ON DELETE SET NULL`): `donations.recorded_by`, `donations.reviewed_by`, `users.kyc_reviewed_by`; populated from `req.user.id` in `createAdminEntry` / `reviewDonation` / `adminReviewKYC`; surfaced as names in `getPendingDonations` / `getAllUsers` and shown in `AdminSeva.jsx` / `AdminDevotees.jsx`.
- Frontend: `CONSOLE_ROLES=['ADMIN','STAFF']` gating in `App.jsx`/Login/Register; `roleStaff` badge; `AdminLayout` hides Settings from non-admins + shows the operator's role; ADMIN-only role dropdown in `AdminDevotees.jsx` (promote to STAFF) via `ActionConfirmModal` ROLE branch.

**Open items for the user (prod writes — not Claude):**
- **STAFF role migration**: if `users.role` is a Postgres ENUM (`user_role`), run once `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'STAFF';` (irreversible; not in `initDb`). Deploy so `initDb` adds the attribution columns. A just-promoted operator must **log out/in** (frontend caches role from login).
- Verify the 100-coin path on a throwaway devotee (statue/Confirmed → `user_avg_coins.amount = 100`; non-statue → no coin row).
- **Test/dummy accounts were deleted from prod** this session (incl. `sanjayvanan03@gmail.com`) and `statue_number_seq` reset so seat #1 is free.

---

## Conventions

- ESM everywhere in the backend; keep the `modules/<name>/<name>.routes.js` + `.controller.js` layout.
- Frontend: reuse tokens from `src/styles/index.styles.js`; match the existing royal dark+gold aesthetic; prefer `lucide-react` icons.
- Run `npm run lint` and `npm run build` (client) before declaring frontend work done.
- Don't commit or push unless asked. If on the default branch (`main`), branch first. Never commit secrets.
- Respect the **Production Database** rule above in every task.
