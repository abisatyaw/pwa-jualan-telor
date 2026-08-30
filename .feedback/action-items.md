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

## 2. FB status (from xlsx v2)

`[»]` = in an open PR (stack #17, PRs #12–#21, all target `dev`).

| FB | Title | xlsx status | Here |
|----|-------|-------------|------|
| FB-001 | Login + roles | Rejected (done by owner) | `[x]` |
| FB-002 | Admin can't create user | In Review (Test) | `[x]` |
| FB-003 | Rename to Cinz Farm | In Review (Test) | `[x]` |
| FB-004 | Indonesian dates | In Review (Test) | `[x]` |
| FB-005 | "Estimasi Margin" | In Review (Test) | `[x]` |
| FB-006 | Weekly production histogram | Approved | `[»]` #14 |
| FB-007 | Dashboard production 3 dp | Approved | `[x]` |
| FB-008 | FCR trend | Approved | `[»]` #15 |
| FB-009 | HDP graph | Approved | `[»]` #15 |
| FB-010 | QTY on Add Asset | Approved | `[»]` #12 |
| FB-011 | Total acquisition value | Approved | `[»]` #12 |
| FB-012 | Zero-book-value month/year | New | `[»]` #19 |
| FB-013 | Production kg 3 dp | Approved | `[»]` #13 |
| FB-014 | Avg egg weight input | Approved | `[»]` #12 |
| FB-015 | Sales qty 3 dp | Approved | `[»]` #13 |
| FB-016 | Transaction QTY / unit price / total | Approved | `[»]` #12 |
| FB-017 | Feed in karung + conversion | New | `[»]` #18 (factor via Setting, 0 until set) |
| FB-018 | "Update Status Aset" tab | New | `[»]` #20 |
| FB-019 | "Performance Financial" tab | New | `[»]` #21 (assumptions listed on the page) |
| FB-020 | Streamline UI; categorise Settings | Refined (Critical) | `[»]` `feat/ui-v2` stack (Settings groups were #16) |

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
5. **`feat/ui-streamline`** (#16) — Settings page split into labelled, collapsible category groups.
   FB-020 (first pass; the rest is the `feat/ui-v2` stack in §3a).
6. **`feat/feed-karung`** (#18) — feed qty in karung; `feed_consumption_kg` converts via
   `kg_per_karung:<feed_type>` (0 until an admin sets it). FB-017.
7. **`feat/asset-zero-date`** (#19) — `AssetOut.book_value_zero_date`; full-month depreciation
   convention. FB-012.
8. **`feat/asset-status-updates`** (#20) — `/api/asset-status-updates` + "Update Status Aset" page;
   `active_quantity`; sold ⇒ prorated book-value write-off. FB-018.
9. **`feat/performance-financial`** (#21) — `/api/financial` + `/keuangan` page (P&L, cash flow,
   balance sheet, bank rec, EBITDA, ROI, MTD/YTD); investor-capital & opening-cash Settings.
   FB-019 — best-effort, assumptions listed on the page.

## 3a. `feat/ui-v2` stack — FB-020 UI streamline (frontend only, base `dev`)

Refined with the owner into a navigation + information-architecture change. One overarching branch
`feat/ui-v2`; linear child stack:

1. `feat/ui-v2-nav` — main nav → 6 destinations (Dashboard, Transaksi, Produksi, Penjualan, Aset,
   Keuangan); Setting → header gear; shared `PageTabs` component.
2. `feat/ui-v2-aset-tabs` — Aset gets Daftar/Update-Status tabs; `/aset/status` redirects;
   Dashboard quick-action row.
3. `feat/ui-v2-keuangan-tabs` — Hutang folds into Keuangan (Laporan/Hutang tabs); `/hutang`
   redirects.
4. `feat/ui-v2-dashboard-tabs` — Dashboard split into Ringkasan/Produksi/Keuangan/Stok tabs.
5. `feat/ui-v2-settings-subgroups` — "Parameter Perhitungan" split into Konversi Satuan / Target
   Produksi / Keuangan.
6. `feat/ui-v2-docs` — CONTEXT.md (Hutang, Navigation destination, Tab), CLAUDE.md hutang fix,
   ADR 0006, this file.

"Tab" now means an in-page `?tab=` switcher, never a route (ADR 0006). No backend changes.

Open questions Q-001/Q-002 (kg per karung) and Q-004 (depreciation method / zero-date target) are
worked around, not answered — the owner should confirm.

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
