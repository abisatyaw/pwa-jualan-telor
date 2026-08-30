import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from . import crud
from .database import SessionLocal
from .routers import assets, auth, dashboard, debts, production, sales, settings, transactions, users

# Schema is managed by Alembic migrations (see migrations/), not create_all.
# Run `alembic upgrade head` (via scripts/bootstrap_alembic.py first, for
# databases that predate Alembic) before starting the app.

with SessionLocal() as db:
    crud.seed_default_options(db)
    crud.seed_egg_price_sources(db)
    crud.seed_default_settings(db)
    crud.seed_admin_user(db)

app = FastAPI(title="Telur Tracker")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3001,http://127.0.0.1:3001").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "degraded", "detail": "database unreachable"})
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(assets.router)
app.include_router(production.router)
app.include_router(sales.router)
app.include_router(transactions.router)
app.include_router(debts.router)
app.include_router(settings.router)
app.include_router(dashboard.router)

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
