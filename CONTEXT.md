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
Dropdown Options/Settings (needed to fill out forms). Cannot manage other accounts.
_Avoid_: Member, viewer (viewer would imply read-only everywhere, which is not the case here)
