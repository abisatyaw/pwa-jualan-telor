# Prorated book-value write-off on partial asset disposal

Assets are batches under a single `acquisition_price` depreciated straight-line (e.g. one Asset row
can represent 100 chickens bought together, or one Kandang). A "sold" Asset Status Update can reduce
only part of that quantity (e.g. 20 of 100 chickens), but book value lives on the whole Asset row. We
write off `remaining_book_value * (quantity_change / quantity_at_time_of_event)` on each sold event,
rather than zeroing the entire row's book value the first time any quantity is sold — the latter would
drastically overstate the write-off for a small partial sale.

Because this front-loads book value down outside the normal monthly schedule, the "month/year book
value reaches zero" estimate (ASSET-003) must recompute dynamically as
`today + remaining_book_value / monthly_depreciation_rate` rather than staying fixed at
`acquisition_date + depreciation_months` — a reader who only knows the original straight-line formula
would otherwise be confused why the zero-date shown moves after a partial sale.
