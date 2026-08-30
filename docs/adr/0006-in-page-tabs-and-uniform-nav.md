# In-page tabs over nested routes; one navigation for every role

The FB-020 UI streamline cut the main navigation from 8 flat entries to 6 (Settings moved to a
header gear, Hutang folded into Keuangan) and gave the crowded destinations — Dashboard, Aset,
Keuangan — a sub-view switcher. We implemented every switcher as **client-side tab state in a
`?tab=` query param** (the shared `PageTabs` component), not as nested routes: the sub-views share
one data fetch and one page shell, `?tab=` keeps them linkable and Back-button friendly, and the
legacy paths (`/hutang`, `/aset/status`) stay as redirects so old links and the revert story hold.
This is also why "tab" now has one fixed meaning (see CONTEXT.md) — FB-018 and FB-019 had each
built a "tab" differently (a button vs. a whole route).

The Dashboard's switcher started as four tabs; the "Keuangan" tab was merged back into "Ringkasan"
because the weekly-transactions and receivables sections *are* part of the at-a-glance overview.

Navigation is deliberately **identical for admin and user roles**; the only role difference in the
app is that admins can delete records. We are not building a role-tailored menu.

The whole change ships as the `feat/ui-v2` branch (one PR, six commits) and touches frontend only,
so it can be reverted wholesale or commit by commit if users dislike it.
