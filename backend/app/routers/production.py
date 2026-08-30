from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_current_user, get_db, require_admin

router = APIRouter(prefix="/api/productions", tags=["productions"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[schemas.ProductionOut])
def list_productions(
    date_from: date | None = None,
    date_to: date | None = None,
    chicken_group: str | None = None,
    db: Session = Depends(get_db),
):
    productions = crud.get_productions(db, date_from=date_from, date_to=date_to, chicken_group=chicken_group)
    return [crud.production_to_out(p) for p in productions]


@router.post("", response_model=schemas.ProductionOut, status_code=201)
def create_production(payload: schemas.ProductionCreate, db: Session = Depends(get_db)):
    return crud.production_to_out(crud.create_production(db, payload))


@router.get("/{production_id}", response_model=schemas.ProductionOut)
def get_production(production_id: int, db: Session = Depends(get_db)):
    production = crud.get_production(db, production_id)
    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")
    return crud.production_to_out(production)


@router.put("/{production_id}", response_model=schemas.ProductionOut)
def update_production(production_id: int, payload: schemas.ProductionUpdate, db: Session = Depends(get_db)):
    production = crud.get_production(db, production_id)
    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")
    return crud.production_to_out(crud.update_production(db, production, payload))


@router.delete("/{production_id}", dependencies=[Depends(require_admin)])
def delete_production(production_id: int, db: Session = Depends(get_db)):
    production = crud.get_production(db, production_id)
    if production is None:
        raise HTTPException(status_code=404, detail="Production not found")
    crud.delete_production(db, production)
    return {"deleted": True}
