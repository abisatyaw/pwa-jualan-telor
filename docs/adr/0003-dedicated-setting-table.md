# Dedicated Setting table for scalar config, separate from Dropdown Options

The Kotak→Kg conversion factor was a hardcoded constant (`KOTAK_TO_KG` in `crud.py`) but is actually
business-configurable and needs to move into Settings. Rather than reuse `DropdownOption` with a
reserved `list_key` (e.g. `"kotak_to_kg"`, reading its single row as the value), we introduce a
separate `Setting` key/value table. `DropdownOption` models a *list of choices* for a categorical
field; a conversion factor is a single scalar, not a choice from a list, and overloading the list
table for it would confuse a future reader trying to understand why a "list" has exactly one entry.
The `Setting` table also gives any future scalar business config a natural home without further
schema contortion. Like Dropdown Options, Settings are Admin-only to change.
