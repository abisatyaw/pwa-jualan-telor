# Cinz Farm v1.0 — Action Items

Tracks the `Feedback Requests` sheet in `Feedback Telor Apss (1).xlsx` (`FB-001`…`FB-020`). Update
as items land. Integration branch is **`dev`**; the agent never touches `main`.

Legend: `[x]` on `dev` · `[»]` in an open/stacked PR · `[ ]` not started · `[✗]` blocked (Need Refinement / owner)

---

## 1. What's on `dev`

- **Phase 5 UX** — Cinz Farm rebrand, version on login, "Estimasi Margin", AUTH-004 fix.
- **Dashboard** — Indonesian dates in the chart + weekly cards; production/stock figures at fixed
  3 dp.
- **Foundation** — Alembic; migration `0002` (`assets.quantity`,
  `productions.average_egg_weight_kg`, `daily_transactions.unit_price`, `asset_status_updates`
  table); `crud` settings helpers; ADR 0004/0005.
- **Settings scalars** — `GET/PUT` endpoints + Settings-page UI for average egg weight, HDP target,
  FCR target, kg-per-karung.
- **Infra** — `develop` → `dev`; both deploys are manual (`workflow_dispatch`).

**Already satisfied:** GEN-002 dates; AUTH-001/002 permissions. **Q-003 answered** — the owner
created `cins`/`cins` and `mami`/`mami`, both plain `user` role; no special "normal user" tier
needed, so AUTH-003 needs no work.

---

## 2. FB status (from xlsx v1)

| FB | Title | xlsx status | Here |
|----|-------|-------------|------|
| FB-001 | Login + roles | Rejected (done by owner) | `[x]` |
| FB-002 | Admin can't create user | In Review (Test) | `[x]` |
| FB-003 | Rename to Cinz Farm | In Review (Test) | `[x]` |
| FB-004 | Indonesian dates | In Review (Test) | `[x]` |
| FB-005 | "Estimasi Margin" | In Review (Test) | `[x]` |
| FB-006 | Weekly production histogram | Approved | `[»]` `feat/weekly-production-chart` |
| FB-007 | Dashboard production 3 dp | Approved | `[x]` |
| FB-008 | FCR trend | Approved | `[»]` `feat/fcr-hdp-analytics` |
| FB-009 | HDP graph | Approved | `[»]` `feat/fcr-hdp-analytics` |
| FB-010 | QTY on Add Asset | Approved | `[»]` `feat/model-fields-api` (#12) |
| FB-011 | Total acquisition value | Approved | `[»]` `feat/model-fields-api` (#12) |
| FB-012 | Zero-book-value month/year | **Need Refinement** | `[✗]` target/example undefined |
| FB-013 | Production kg 3 dp | Approved | `[»]` `feat/decimal-precision` |
| FB-014 | Avg egg weight input | Approved | `[»]` `feat/model-fields-api` (#12) |
| FB-015 | Sales qty 3 dp | Approved | `[»]` `feat/decimal-precision` |
| FB-016 | Transaction QTY / unit price / total | Approved | `[»]` `feat/model-fields-api` (#12) |
| FB-017 | Feed in karung + conversion | **Need Refinement** | `[✗]` Q-001/Q-002 |
| FB-018 | "Update Status Aset" tab | **Need Refinement** | `[✗]` |
| FB-019 | "Performance Financial" tab | **Need Refinement** | `[✗]` needs chart-of-accounts spec |
| FB-020 | Streamline UI; categorise Settings | **Need Refinement** (Critical) | `[»]` `feat/ui-streamline` |

---

## 3. The stack (bottom → top, all target `dev`)

1. **`feat/model-fields-api`** (PR #12, open) — surface `quantity` / `average_egg_weight_kg` /
   `unit_price` through schemas → mappers → routers → forms; `total_acquisition_value`,
   `estimated_egg_count`, transaction auto-total. FB-010/011/014/016.
2. **`feat/decimal-precision`** — `quantize_qty` (round 3 dp) on write + read for
   `sale.quantity` / `production.quantity_kg` / `transaction.qty`; `step="0.001"` on the sale form;
   `formatQty` in the production / sales / transaction lists. FB-013/015, GEN-003. *(+ this doc)*
3. **`feat/weekly-production-chart`** — backend groups production by ISO week within the selected
   month; bar chart on the dashboard. FB-006.
4. **`feat/fcr-hdp-analytics`** — `crud` formulas: `egg_production_kg(period)`,
   `feed_consumption_kg(period)` (kg feed for now — karung conversion is FB-017, deferred),
   `active_chicken_count(as_of_date)` per ADR 0005, FCR, HDP. Dashboard payload gains FCR + HDP
   trend series; two trend charts with target lines (FCR from `get_fcr_target()`, hidden when
   unset; HDP target from `get_hdp_target_percentage()`). FB-008/009.
5. **`feat/ui-streamline`** — Settings page split into labelled, collapsible category groups; nav /
   layout tidy-up. FB-020.

Not in the stack (blocked): FB-012, FB-017, FB-018, FB-019.

---

## 4. Open questions

| Q | Question | Blocks | State |
|---|---|---|---|
| Q-001 | kg per karung of feed? | FB-017, precise FCR | open |
| Q-002 | kg/karung global / per feed type / per txn? | FB-017 | open |
| Q-003 | Normal-user permissions? | — | **answered** — plain `user` role |
| Q-004 | Depreciation method + zero-date target/format? | FB-012 | open (Need Refinement) |
| Q-005 | Sold-asset proceeds vs book value? | FB-018 | open (Need Refinement) |
| Q-006 | FCR target 0.2 confirmed? | FB-008 target line | xlsx still says 0.2; treat as configurable |
| Q-007 | HDP from estimated vs recorded egg count? | FB-009 | using estimated (from avg egg weight) |
| Q-008 | FB-019 chart of accounts / statement-line mapping | FB-019 | open |
| Q-009 | FB-019 — how the Rp 140,000,000 capital enters | FB-019 | open |

Rule: unconfirmed values ship as a Setting or stay hidden — never a hardcoded guess.

---

## 5. FB-019 — "Performance Financial" epic (deferred)

MTD/YTD reporting: ROI vs Rp 140,000,000 capital, cash-flow statement, equity roll-forward, P&L,
balance sheet, bank reconciliation, EBITDA. Blocked on Q-008/Q-009 — do not start until the owner
supplies a chart of accounts and mapping rules.
