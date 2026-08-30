"""Bridge for databases that existed before Alembic was adopted (2026-08-30).

Run this once, before `alembic upgrade head`, on any database. Those older
databases have their tables already created (via the old `Base.metadata.create_all`
startup call) but no `alembic_version` table, so a plain `alembic upgrade head`
would try to CREATE TABLE statements that already exist and fail. This script
detects that case and stamps the database at the baseline revision (a no-op
schema-wise, since the baseline migration reproduces the pre-Alembic schema
exactly) so `upgrade head` then only applies genuinely new migrations.

A brand-new, genuinely empty database is left untouched so the baseline
migration creates its tables normally.

An `alembic_version` table that exists but holds no row (left behind by an
`alembic` command that ran before this script on a pre-Alembic database) is
treated the same as a missing one - otherwise `upgrade head` would restart from
base and fail on the already-existing tables.
"""

import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text  # noqa: E402

from app.database import engine  # noqa: E402

BASELINE_REVISION = "0001"


def main() -> None:
    tables = set(inspect(engine).get_table_names())
    if "alembic_version" in tables:
        with engine.connect() as conn:
            current = conn.execute(text("SELECT version_num FROM alembic_version")).first()
        if current is not None:
            print("bootstrap_alembic: already tracked, nothing to do")
            return
        print("bootstrap_alembic: empty alembic_version table, treating as pre-Alembic")
    if "users" not in tables:
        print("bootstrap_alembic: empty database, letting the baseline migration create tables")
        return
    print(f"bootstrap_alembic: pre-Alembic database detected, stamping at {BASELINE_REVISION}")
    subprocess.run([sys.executable, "-m", "alembic", "stamp", BASELINE_REVISION], check=True, cwd=BACKEND_DIR)


if __name__ == "__main__":
    main()
