# Cinz Farm v1.0 — Action Items

Companion to [`30-08-26.json`](30-08-26.json) (raw feedback) and the `Feedback Requests` sheet in
`Feedback Telor Apss.xlsx` (`FB-001`…`FB-019`). Tracks **what's done vs outstanding**. Update as
items land.

Status legend: `[x]` done (on `dev`) · `[~]` partial · `[ ]` not started · `[?]` blocked on an open question

---

## 1. Current state (2026-08-30)

Integration branch is **`dev`**. Merged PRs (#3–#9) put the following on `dev`:

- **Phase 5 UX** — "Telur Tracker" → **Cinz Farm** (header, login, title, PWA manifest); app version
  on the login screen (`frontend/src/version.ts`, `package.json` 1.0.0); dashboard "Estimasi Profit"
  → "Estimasi Margin"; **AUTH-004** fixed (password-length rules dropped, `api/client.ts` flattens
  FastAPI 422 arrays so errors stop showing `[object Object]`).
- **Dashboard** — chart axis/tooltip and weekly-card dates render `09 Agustus 2026` style
  (`formatBucketLabel`); production/stock figures show a fixed 3 decimals (`formatQty`, backend
  rounds to 3 dp).
- **Foundation** — Alembic adopted (`Base.metadata.create_all` gone; `bootstrap_alembic.py` for
  pre-Alembic DBs; `deploy.sh` runs migrations). Migration `0002` adds `assets.quantity`,
  `productions.average_egg_weight_kg`, `daily_transactions.unit_price`, and the
  `asset_status_updates` table. `crud.py` settings helpers for `average_egg_weight_kg`, `fcr_target`
  (unseeded), `hdp_target_percentage`, `kg_per_karung:<feed_type>`. ADR
  [0004](../docs/adr/0004-prorated-asset-writeoff-and-dynamic-zero-date.md) /
  [0005](../docs/adr/0005-hdp-trend-point-in-time-chicken-count.md). CONTEXT.md glossary.
- **Infra** — `develop` renamed to `dev`; `Deploy Testing` is now `workflow_dispatch` (manual, like
  production) — merging a PR into `dev` deploys nothing.

**Open PR:** `feat/settings-scalars → dev` — the settings endpoints + Settings-page UI for the four
scalars above (was briefly stranded on the old `feat/feedback` branch; re-cherry-picked). Nothing
consumes those values yet — it's the input layer.

**Already satisfied (no work needed):** GEN-002 Indonesian dates (`utils.ts`); AUTH-001 / AUTH-002
permissions (`require_admin` on every delete route + frontend `isAdmin` gating).

---

## 2. Feedback item → status

| FB | Title | Maps to | Status |
|----|-------|---------|--------|
| FB-001 | User login + roles | AUTH-001/002 | `[x]` |
| FB-002 | Admin can't create user | AUTH-004 | `[x]` |
| FB-003 | Rename to Cinz Farm | GEN-001 | `[x]` |
| FB-004 | Indonesian date format | GEN-002 | `[x]` |
| FB-005 | "Estimasi Profit" → "Estimasi Margin" | DASH-001 | `[x]` |
| FB-006 | Weekly egg-production histogram | DASH-002 | `[ ]` Phase 4 |
| FB-007 | Dashboard production 3 decimals | — | `[x]` |
| FB-008 | FCR trend | DASH-003 | `[ ]` Phase 2+4 `[?]`Q-001/Q-006 |
| FB-009 | HDP graph | DASH-004 | `[ ]` Phase 2+4 `[?]`Q-007 |
| FB-010 | QTY on Add Asset | ASSET-001 | `[~]` column exists; API/form pending → Phase 1 |
| FB-011 | Total acquisition value | ASSET-002 | `[ ]` Phase 2 |
| FB-012 | Estimated zero-book-value month/year | ASSET-003 | `[ ]` Phase 2 `[?]`Q-004 |
| FB-013 | Production kg 3 decimals (form) | PROD-001 | `[ ]` Phase 1 (decimal precision) |
| FB-014 | Avg egg weight input | PROD-002/003 | `[~]` column + setting exist; form/derived pending → Phase 1 |
| FB-015 | Sales qty 3 decimals (form) | SALE-001 | `[ ]` Phase 1 (decimal precision) |
| FB-016 | Transaction QTY + unit price + total | TXN-001/002/003 | `[~]` `unit_price` column exists; API/form pending → Phase 1 |
| FB-017 | Feed in karung + karung→kg conversion | TXN-004/005 | `[ ]` Phase 1/2 `[?]`Q-001/Q-002 |
| FB-018 | "Update Status Aset" tab | ASSET-004/005/006 | `[ ]` Phase 3 `[?]`Q-005 |
| FB-019 | "Performance Financial" tab (MTD/YTD) | — | `[ ]` new epic — see §5 |

---

## 3. Outstanding work by phase

### Phase 1 — Data-model → API  `[~]`

The `0002` columns exist but nothing in the API reads or writes them. (Settings endpoints for the
scalars: in the open `feat/settings-scalars` PR.)

- [ ] **ASSET-001 / FB-010** — `quantity` into `AssetBase` / `AssetCreate` / `AssetUpdate` and
      `asset_to_out`; `AssetForm` + `AssetList`. `[?]` Q — is `acquisition_price` per-unit or
      batch-total today? (ADR 0004 assumes batch-total.)
- [ ] **PROD-002 / FB-014** — `average_egg_weight_kg` into `ProductionBase` (default from
      `get_average_egg_weight_kg`), `ProductionCreate/Update`; new `production_to_out` mapper with
      `estimated_egg_count = quantity_kg / average_egg_weight_kg`. `ProductionForm` input +
      `ProductionList` display.
- [ ] **TXN-001/002/003 / FB-016** — `unit_price` into `TransactionBase`, `TransactionCreate/Update`;
      server computes `amount = qty * unit_price` (keep `amount` authoritative for existing
      aggregations). `TransactionForm`: qty + unit price → computed total.
- [ ] **GEN-003 / PROD-001 / SALE-001 / FB-013 / FB-015 decimal precision** — shared 3-dp
      helper; quantise on write (backend) + `maximumFractionDigits: 3` on every quantity form/list
      (`production.quantity_kg`, `sale.quantity`, asset units, `transaction.qty`). Money stays
      integer Rupiah.
- [ ] **TXN-004/005 / FB-017** — for feed `category`, record `qty` in `karung`; `feed_consumption_kg`
      helper converts via `get_kg_per_karung`. `[?]` Q-001/Q-002 — kg/karung unknown; ship `0` and
      surface "unset".

### Phase 2 — Core business calculations  `[ ]`

Centralise in `crud.py`; each formula a named, independently testable function.

- [ ] `estimated_egg_count(production)`
- [ ] `feed_consumption_kg(period)` / `egg_production_kg(period)`
- [ ] **DASH-003 FCR** = `feed_consumption_kg / egg_production_kg`. `[?]` Q-006 — read
      `get_fcr_target()`, hide target line when `None`.
- [ ] **DASH-004 HDP** = `estimated_egg_count / active_chicken_count * 100` per day. Implement
      `active_chicken_count(as_of_date)` per ADR 0005. Target from `get_hdp_target_percentage()`.
- [ ] **ASSET-002 / FB-011** total acquisition value in `asset_to_out`.
- [ ] **ASSET-003 / FB-012** dynamic zero-date — `today + book_value / monthly_depreciation`. `[?]`
      Q-004.

### Phase 3 — Asset lifecycle  `[ ]`  (FB-018)

- [ ] `AssetStatusUpdate` CRUD, 4-file pattern: `schemas`, `crud` (`get`/`create`/`delete`, list by
      `asset_id`), `routers/assets.py` sub-routes (`POST/GET /api/assets/{id}/status-updates`,
      admin-only delete). Fields: `update_date`, `asset_id`, `quantity_change`, `reason`
      (`dead`/`sold`/`missing`), `notes`.
- [ ] `active_quantity = asset.quantity - Σ quantity_change` in `asset_to_out`; reject updates that
      would go negative.
- [ ] Reason rules — `dead`/`missing`: qty only. `sold`: qty **and** prorated book-value write-off
      (ADR 0004). `[?]` Q-005 — proceeds accounting left out.
- [ ] `dead`/`missing` restricted to `asset_type == "Ayam"`; `sold` any type.
- [ ] Frontend — asset-detail status-update list + add form.

### Phase 4 — Analytics & dashboard  `[ ]`

- [ ] **DASH-002 / FB-006** weekly egg production — group by ISO week within the selected month;
      `[{week_label, total_kg}]` on the payload; bar chart (recharts). 3 dp.
- [ ] **DASH-003 / FB-008 FCR trend** — per-month series over the range + target line.
- [ ] **DASH-004 / FB-009 HDP trend** — per-day/week series using point-in-time
      `active_chicken_count` + target line.
- [ ] Extend `DashboardOverview` + `get_dashboard_overview`; extend frontend `types.ts` + `Dashboard`.

### Phase 5 — UX & permissions  `[~]`

- [x] FB-003 rename · FB-005 margin term · version on login · FB-002/AUTH-004 · FB-004 dates ·
      AUTH-001/002 permissions
- [ ] **AUTH-003** — what a normal ("Mami") user can do beyond the current User role. `[?]` Q-003 —
      no action until specified.
- [ ] Seed real accounts (`cinz`, `mami` as User) once AUTH-003 is settled — or confirm `admin` +
      ad-hoc creation is enough for v1.

### Phase 6 — Validation & regression  `[ ]`

- [ ] Backend test harness — `pytest` + SQLite fixture DB (none exists).
- [ ] Unit tests for every Phase 2 formula vs hand-computed data.
- [ ] Authz tests — User cannot delete; non-admin cannot hit settings PUT / user routes.
- [ ] Migration test — `0001`→`0002` up + down on a populated DB.
- [ ] Manual regression: production / sales / transactions / assets CRUD; dashboard vs a spreadsheet.

---

## 4. Open questions (block the `[?]` items)

| Q | Question | Blocks |
|---|---|---|
| Q-001 | kg per karung of feed? | feed→kg conversion, FCR |
| Q-002 | kg/karung global, per feed type, or per transaction? | TXN-004/005 design |
| Q-003 | Exact permissions for a normal user? | AUTH-003 |
| Q-004 | Current depreciation method (straight-line?)? | ASSET-003 |
| Q-005 | How do sold-asset proceeds interact with book value? | ASSET-006 |
| Q-006 | Is FCR target 0.2 confirmed? | DASH-003 target line |
| Q-007 | HDP from estimated egg count, or will exact counts be recorded? | DASH-004 |
| Q-008 | FB-019 chart of accounts — which txn/sale/debt/asset flows map to which statement line? | FB-019 |
| Q-009 | FB-019 — how does the Rp 140,000,000 investor capital enter (opening equity? cash-in)? | FB-019 |

Rule: anything unconfirmed ships **configurable** (a Setting) or **hidden until set** — never a
hardcoded guess.

---

## 5. FB-019 — "Performance Financial" tab (epic, not yet scoped)

New in the xlsx, priority **High**. A full MTD/YTD financial-reporting module — its own project,
blocked on an accounting spec (Q-008/Q-009). Components listed by the owner:

- **ROI** against investor capital of **Rp 140,000,000**
- **Cash flow** — investing / operating / financing activities + net change in cash
- **Equity** — opening capital, additional capital
- **P&L** — sales revenue, depreciation expense, gross profit, net profit
- **Balance sheet** — accumulated depreciation, payables, receivables, retained earnings, asset book
  value, total assets, total liabilities + equity
- **Bank reconciliation** — cash-in / cash-out movements
- **EBITDA**

Do not start until the owner supplies a chart of accounts and the mapping rules.

---

## 6. PR sequence (all target `dev`)

1. ~~`feat/phase5-ux`~~ — **merged** (rebrand, version, Estimasi Margin, AUTH-004).
2. `feat/settings-scalars` — **open** — settings endpoints + Settings UI for the four scalars.
3. **`feat/model-fields-api`** — surface `quantity` / `average_egg_weight_kg` / `unit_price` through
   schemas → mappers → routers → forms; add `estimated_egg_count`, transaction auto-total. *(next)*
4. `feat/decimal-precision` — shared 3-dp helpers system-wide (GEN-003 / PROD-001 / SALE-001 /
   FB-013 / FB-015). May fold into #3.
5. `feat/asset-lifecycle` — `AssetStatusUpdate` CRUD + active-quantity + reason rules + UI (Phase 3,
   FB-018).
6. `feat/analytics-fcr-hdp` — Phase 2 formulas + Phase 4 dashboard charts (FB-006/008/009).
7. `chore/test-harness` — Phase 6; ideally alongside 5–6, not last.
8. `feat/performance-financial` — FB-019 epic, only after its spec exists.
