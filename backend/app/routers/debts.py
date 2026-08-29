from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_current_user, get_db, require_admin

router = APIRouter(prefix="/api/debts", tags=["debts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[schemas.DebtOut])
def list_debts(search: str | None = None, db: Session = Depends(get_db)):
    debts = crud.get_debts(db, search=search)
    return [crud.debt_to_out(d) for d in debts]


@router.post("", response_model=schemas.DebtOut, status_code=201)
def create_debt(payload: schemas.DebtCreate, db: Session = Depends(get_db)):
    debt = crud.create_debt(db, payload)
    return crud.debt_to_out(debt)


@router.get("/{debt_id}", response_model=schemas.DebtOut)
def get_debt(debt_id: int, db: Session = Depends(get_db)):
    debt = crud.get_debt(db, debt_id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")
    return crud.debt_to_out(debt)


@router.put("/{debt_id}", response_model=schemas.DebtOut)
def update_debt(debt_id: int, payload: schemas.DebtUpdate, db: Session = Depends(get_db)):
    debt = crud.get_debt(db, debt_id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")
    debt = crud.update_debt(db, debt, payload)
    return crud.debt_to_out(debt)


@router.patch("/{debt_id}/payment", response_model=schemas.DebtOut)
def record_payment(debt_id: int, payload: schemas.DebtPayment, db: Session = Depends(get_db)):
    debt = crud.get_debt(db, debt_id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")
    debt = crud.record_debt_payment(db, debt, payload)
    return crud.debt_to_out(debt)


@router.delete("/{debt_id}", dependencies=[Depends(require_admin)])
def delete_debt(debt_id: int, db: Session = Depends(get_db)):
    debt = crud.get_debt(db, debt_id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")
    crud.delete_debt(db, debt)
    return {"deleted": True}
