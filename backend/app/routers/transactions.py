from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_current_user, get_db, require_admin

router = APIRouter(prefix="/api/transactions", tags=["transactions"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[schemas.TransactionOut])
def list_transactions(
    date_from: date | None = None,
    date_to: date | None = None,
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    transactions = crud.get_transactions(db, date_from=date_from, date_to=date_to, category=category, search=search)
    return [crud.transaction_to_out(t) for t in transactions]


@router.post("", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(payload: schemas.TransactionCreate, db: Session = Depends(get_db)):
    transaction = crud.create_transaction(db, payload)
    return crud.transaction_to_out(transaction)


@router.get("/{transaction_id}", response_model=schemas.TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = crud.get_transaction(db, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return crud.transaction_to_out(transaction)


@router.put("/{transaction_id}", response_model=schemas.TransactionOut)
def update_transaction(transaction_id: int, payload: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    transaction = crud.get_transaction(db, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    transaction = crud.update_transaction(db, transaction, payload)
    return crud.transaction_to_out(transaction)


@router.delete("/{transaction_id}", dependencies=[Depends(require_admin)])
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = crud.get_transaction(db, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    crud.delete_transaction(db, transaction)
    return {"deleted": True}
