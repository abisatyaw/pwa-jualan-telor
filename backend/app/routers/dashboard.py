from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/api", tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/dashboard", response_model=schemas.DashboardOverview)
def get_dashboard(
    period: str = Query("month"),
    from_: date | None = Query(None, alias="from"),
    to: date | None = Query(None),
    db: Session = Depends(get_db),
):
    return crud.get_dashboard_overview(db, period, from_, to)


@router.get("/financial", response_model=schemas.FinancialReport)
def get_financial(db: Session = Depends(get_db)):
    return crud.get_financial_report(db)


@router.get("/egg-prices", response_model=list[schemas.EggPriceOut])
def get_egg_prices(db: Session = Depends(get_db)):
    return crud.get_egg_prices(db)


@router.post("/egg-prices/refresh", response_model=list[schemas.EggPriceOut])
def refresh_egg_prices(db: Session = Depends(get_db)):
    return crud.get_egg_prices(db, refresh=True)
