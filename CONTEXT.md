# Telur Tracker

Tracks the day-to-day operations of an egg-farming/selling business: assets, production, sales,
daily transactions (expenses), debts, and a summary dashboard.

## Language

**Kotak**:
A unit of egg quantity distinct from Kg. Converts to a fixed number of Kg via a business-defined
conversion factor (currently 15, moving to an editable Setting rather than a hardcoded constant).
_Avoid_: Box, crate

**Dropdown Option (Opsi)**:
A value for a categorical field (e.g. asset type, product type, transaction category), seeded with
sensible defaults. Readable by any authenticated user (needed to populate choices on business-record
forms), but only an Admin can add or remove options — this avoids requiring a developer deploy to add
a category while keeping the shared list free of typo-duplicates (creation is case-insensitive
deduped).
_Avoid_: Enum, category constant

**Setting**:
A single business-config scalar value (key/value), distinct from a Dropdown Option's list-of-choices
shape. First instance: the Kotak→Kg conversion factor. Admin-only to change.
_Avoid_: Config, preference

**Admin (role)**:
A user with full CRUD (Create/Read/Update/Delete) on business records, plus sole authority to manage
Dropdown Options, Settings, and other user accounts (single-tenant: one business, no self-service
signup).
_Avoid_: Superuser, owner

**User (role)**:
A user with CRU (Create/Read/Update, not Delete) on business records, and read-only access to
Dropdown Options/Settings (needed to fill out forms). Cannot manage other accounts. This is the only
non-admin role — individual people (e.g. specific staff members) are just distinct usernames under
this one role, not separate roles.
_Avoid_: Member, viewer (viewer would imply read-only everywhere, which is not the case here)

**Karung**:
A sack, the purchase unit for feed transactions. Converts to Kg via a Setting keyed per `feed_type`
(different feed types weigh differently per sack), unlike Kotak which has one fixed factor.
_Avoid_: Sack (Karung matches the Indonesian-term convention already used for Kotak)

**Estimated Egg Count**:
Derived from a production record's `quantity_kg` divided by that record's `average_egg_weight_kg`.
The average egg weight is entered per production record, defaulting from a Setting but overridable
per entry, since egg weight drifts by season and flock age.
_Avoid_: Egg count (ambiguous against a future direct headcount, if ever recorded)

**Active Chicken Count**:
The headcount of a chicken group as of a given date: the sum of `quantity` across that group's
chicken assets (`asset_type = "Ayam"`) acquired on or before that date, minus quantity reductions
from Asset Status Updates dated on or before that date. Used as HDP's denominator; reconstructed
per-date for historical trends rather than read as a live snapshot.
_Avoid_: Flock size, hen count

**Asset Status Update**:
A dated, append-only record of a change in an asset's active quantity, with a reason (`dead`, `sold`,
`missing`) and its own `quantity_change`. `dead`/`missing` only apply to chicken assets; `sold`
applies to any asset type. Distinct from editing the Asset record itself via the normal update path.
_Avoid_: Asset history, status log

**FCR (Feed Conversion Rate)**:
Farm-wide ratio of feed consumed to eggs produced in a period (`feed_kg / egg_kg`), not broken out
per chicken group. Its target is a business value stored as a Setting, left unset until the business
confirms the real number rather than defaulting to an assumed one.
_Avoid_: Feed ratio

**HDP (Hen Day Production)**:
Daily egg-laying rate as a percentage for a specific date: `estimated_egg_count / active_chicken_count
* 100`. The historical HDP trend uses each date's reconstructed Active Chicken Count, not today's
current count.
_Avoid_: Lay rate
