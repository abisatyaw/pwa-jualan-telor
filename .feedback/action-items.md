# Cinz Farm v1.0 — Action Items

Companion to [`30-08-26.json`](30-08-26.json) (the raw product-owner feedback). This file tracks
**what's done vs outstanding** and breaks the work into shippable PRs. Update it as items land.

Status legend: `[x]` done · `[~]` partial · `[ ]` not started · `[?]` blocked on an open question

---

## 1. Current state (2026-08-30)

**Branch:** `feat/feedback` — 1 commit ahead of `origin/develop` (`b44f322 handoff`), plus uncommitted
Phase 5 changes in the working tree. Cleanly based on `develop`, so a PR into `develop` is safe.

**Committed on the branch (`b44f322 handoff`):**
- Alembic adopted: `Base.metadata.create_all` removed from `main.py`; migrations `0001_baseline` +
  `0002` (adds `assets.quantity`, `asset_status_updates` table, `productions.average_egg_weight_kg`,
  `daily_transactions.unit_price`). Migrations reviewed but **not confirmed applied** anywhere (no
  local venv in this workspace).
- `crud.py` setting helpers added: `get/set_average_egg_weight_kg`, `get/set_fcr_target` (deliberately
  unseeded), `get/set_hdp_target_percentage`, `get/set_kg_per_karung(feed_type)`. **Not yet exposed by
  any router and not read by any calculation** — dead code until wired.
- ADR [0004](../docs/adr/0004-prorated-asset-writeoff-and-dynamic-zero-date.md) (prorated write-off on
  partial disposal + dynamic zero-date) and [0005](../docs/adr/0005-hdp-trend-point-in-time-chicken-count.md)
  (HDP trend reconstructs headcount per date). `CONTEXT.md` glossary expanded.

**Uncommitted in the working tree (Phase 5, this session):**
- Renamed "Telur Tracker" → **Cinz Farm** (`index.html`, `manifest.json`, `App.tsx`, `Login.tsx`).
- `Dashboard`: "Estimasi Profit" → "Estimasi Margin".
- App version on login screen — new `frontend/src/version.ts` (`APP_VERSION`, bump with `package.json`;
  `package.json` bumped `0.0.0` → `1.0.0`).
- AUTH-004 fix: `UserCreate`/`LoginRequest` no longer enforce password length (`password: str = ""`),
  `username` min-length lowered to 1; `api/client.ts` flattens FastAPI 422 `detail` arrays so errors
  stop rendering as `[object Object]`. Password field labelled "(opsional)".
- `CLAUDE.md`: added "Branching & PRs" section.

**Already satisfied (no work needed):**
- GEN-002 Indonesian dates — `utils.ts` already formats `id-ID` as `09 Agustus 2026`.
- AUTH-001 / AUTH-002 permissions — `require_admin` guards every delete route; frontend gates every
  delete button on `isAdmin`. Enforced in the backend, not just hidden.

---

## 2. Outstanding work by phase

### Phase 1 — Data model foundation  `[~]`

The 4 columns exist in `models.py` + migration `0002`, but nothing in the API reads or writes them.

- [ ] **PROD/GEN-003 decimal precision** — decide storage: SQLite `Float` already holds 3 dp; the gap
      is **validation + display**. Add a shared rounding/format helper (backend: quantize to 3 dp on
      write; frontend: `toLocaleString('id-ID', { maximumFractionDigits: 3 })`). Apply to
      `production.quantity_kg`, `sale.quantity`, `asset` unit values, `transaction.qty`. `[?]` confirm
      whether money stays integer Rupiah (currently `int`) — assume yes.
- [ ] **ASSET-001 / ASSET-002** — add `quantity` to `AssetBase` (schema), `AssetCreate/Update`, and
      `asset_to_out`; compute `total_acquisition_value = quantity * acquisition_price` in the mapper
      (do **not** store). Frontend `AssetForm` + `AssetList` display.
      `[?]` clarify: is `acquisition_price` per-unit or batch-total today? ADR 0004 assumes batch-total.
- [ ] **PROD-001 / PROD-002 / PROD-003** — add `average_egg_weight_kg` to `ProductionBase` (default
      from `get_average_egg_weight_kg`), `ProductionCreate/Update`; compute
      `estimated_egg_count = quantity_kg / average_egg_weight_kg` in `production_to_out` (new mapper).
      Frontend `ProductionForm` input + `ProductionList` / detail display.
- [ ] **TXN-001 / TXN-002 / TXN-003** — add `unit_price` to `TransactionBase`,
      `TransactionCreate/Update`; auto-compute `amount = qty * unit_price` server-side (keep `amount`
      authoritative for all existing aggregations). Frontend `TransactionForm`: qty + unit price →
      show computed total.
- [ ] **TXN-004 / TXN-005** — for `category` in the feed set, record `qty` in `karung`; convert to kg
      via `get_kg_per_karung(feed_type)` for FCR. Needs the settings endpoint (Phase 2) + a
      `feed_consumption_kg` helper. `[?]` Q-001/Q-002 — kg per karung is unknown; keep per-`feed_type`
      Setting, ship with `0` and surface "unset" in the UI.
- [ ] Settings endpoints for the new scalars — `GET/PUT /api/settings/average-egg-weight`,
      `/fcr-target`, `/hdp-target`, `/kg-per-karung?feed_type=` (admin-only PUT), mirroring
      `kotak-to-kg`. Add matching `api/client.ts` methods + Settings page fields.

### Phase 2 — Core business calculations  `[ ]`

Centralise in `crud.py`; keep each formula a named, independently testable function.

- [ ] `estimated_egg_count(production)` — see PROD-003.
- [ ] `feed_consumption_kg(period)` — sum feed transactions, converting karung→kg per `feed_type`.
- [ ] `egg_production_kg(period)` — sum `production.quantity_kg` in range (reuse `_period_range`).
- [ ] **DASH-003 FCR** = `feed_consumption_kg / egg_production_kg` for a period. `[?]` Q-006 — target
      `0.2` unconfirmed; read from `get_fcr_target()`, hide the target line when `None`.
- [ ] **DASH-004 HDP** = `estimated_egg_count / active_chicken_count * 100` per day.
      Implement `active_chicken_count(as_of_date)` per ADR 0005 (chicken assets acquired ≤ date, minus
      status-update reductions dated ≤ date). Target from `get_hdp_target_percentage()` (default 85).
- [ ] **ASSET-002 total acquisition value** — see Phase 1.
- [ ] **ASSET-003 dynamic zero-date** — per ADR 0004, `today + book_value / monthly_depreciation`
      rather than a fixed `acquisition_date + depreciation_months`. Add to `asset_to_out`. `[?]` Q-004
      — confirm current depreciation method is straight-line (code suggests yes).

### Phase 3 — Asset lifecycle  `[ ]`

- [ ] **ASSET-004 / ASSET-005** — full CRUD for `AssetStatusUpdate` following the 4-file pattern:
      `schemas` (`AssetStatusUpdateBase/Create/Out`), `crud` (`get/create/delete`, list by `asset_id`),
      `routers/assets.py` sub-routes (`POST/GET /api/assets/{id}/status-updates`, admin-only delete).
      Fields: `update_date`, `asset_id`, `quantity_change`, `reason` (`dead`/`sold`/`missing`), `notes`.
- [ ] **Active quantity** — `active_quantity = asset.quantity - Σ quantity_change` in `asset_to_out`.
      Reject a status update that would drive it negative.
- [ ] Reason rules — `dead`/`missing`: reduce active qty only. `sold`: reduce active qty **and** write
      off book value prorated (ADR 0004). `[?]` Q-005 — exact accounting for sale proceeds is
      unspecified; implement only the prorated book-value reduction, leave proceeds out.
- [ ] `dead`/`missing` restricted to chicken assets (`asset_type == "Ayam"`); `sold` any type.
- [ ] Frontend — asset detail tab/section listing status updates + an "add" form.

### Phase 4 — Analytics & dashboard  `[ ]`

- [ ] **DASH-002 weekly egg production** — within the selected month, group production by ISO week,
      return `[{week_label, total_kg}]` on the dashboard payload. Bar chart in `Dashboard` (recharts is
      already a dep). 3 dp.
- [ ] **DASH-003 FCR trend** — historical series (per month over the selected range) + target line.
- [ ] **DASH-004 HDP trend** — per-day (or per-week) series using point-in-time `active_chicken_count`
      + 85% target line.
- [ ] Extend `DashboardOverview` schema + `get_dashboard_overview` fan-out; extend frontend `types.ts`
      and `Dashboard`.

### Phase 5 — UX & permissions  `[~]`

- [x] GEN-001 rename to Cinz Farm
- [x] DASH-001 Estimasi Profit → Estimasi Margin
- [x] Show version on login screen
- [x] AUTH-004 admin user creation (clear errors + password requirement removed)
- [x] GEN-002 Indonesian dates (pre-existing)
- [x] AUTH-001 / AUTH-002 permissions (pre-existing, backend-enforced)
- [ ] **AUTH-003** — define what a normal ("Mami") user can do beyond the current User role. `[?]`
      Q-003 — no action until the product owner specifies.
- [ ] Seed the real accounts (`cinz` = User, `mami` = User) once AUTH-003 is settled — or confirm the
      existing `admin` + ad-hoc creation is enough for v1.

### Phase 6 — Validation & regression  `[ ]`

- [ ] Stand up a backend test harness (none exists) — `pytest` + a SQLite fixture DB.
- [ ] Unit tests for every Phase 2 formula against hand-computed sample data.
- [ ] Authorization tests — User cannot delete; non-admin cannot hit settings PUT / user routes.
- [ ] Migration test — `0001` → `0002` upgrade + downgrade on a populated DB.
- [ ] Manual regression pass: production / sales / transactions / assets CRUD still work; dashboard
      numbers match a spreadsheet.

---

## 3. Open questions (block the `[?]` items above)

| Q | Question | Blocks |
|---|---|---|
| Q-001 | kg per karung of feed? | feed→kg conversion, FCR |
| Q-002 | kg/karung global, per feed type, or per transaction? | TXN-004/005 design |
| Q-003 | Exact permissions for a normal user? | AUTH-003 |
| Q-004 | Current depreciation method? | ASSET-003 |
| Q-005 | How do sold-asset proceeds interact with book value? | ASSET-006 |
| Q-006 | Is FCR target 0.2 confirmed? | DASH-003 target line |
| Q-007 | HDP from estimated egg count, or will exact counts be recorded? | DASH-004 |

Decision so far: everything unconfirmed ships **configurable** (a Setting) or **hidden until set**,
never hardcoded to a guess.

---

## 4. Suggested PR sequence (all target `develop`)

1. **`feat/phase5-ux`** — commit the current working-tree changes (rename, version, Estimasi Margin,
   AUTH-004, CLAUDE.md). Small, no schema impact. Ship first.
2. **`feat/settings-scalars`** — router endpoints + client + Settings UI for avg egg weight / FCR
   target / HDP target / kg-per-karung. Unblocks the calc work.
3. **`feat/model-fields-api`** — surface `quantity`, `average_egg_weight_kg`, `unit_price` through
   schemas / mappers / routers / forms; add `estimated_egg_count`, `total_acquisition_value`,
   transaction auto-total. Confirm migrations apply.
4. **`feat/decimal-precision`** — shared 3-dp helpers, applied system-wide (GEN-003 / PROD-001 / SALE-001).
5. **`feat/asset-lifecycle`** — `AssetStatusUpdate` CRUD + active-quantity + reason rules + UI (Phase 3).
6. **`feat/analytics-fcr-hdp`** — Phase 2 formulas + Phase 4 dashboard charts.
7. **`chore/test-harness`** — Phase 6, ideally landed alongside 5–6 rather than last.
