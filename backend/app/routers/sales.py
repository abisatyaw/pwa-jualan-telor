from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_db

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.get("", response_model=list[schemas.SaleOut])
def list_sales(
    date_from: date | None = None,
    date_to: date | None = None,
    product_type: str | None = None,
    payment_status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    sales = crud.get_sales(
        db,
        date_from=date_from,
        date_to=date_to,
        product_type=product_type,
        payment_status=payment_status,
        search=search,
    )
    return [crud.sale_to_out(s) for s in sales]


@router.post("", response_model=schemas.SaleOut, status_code=201)
def create_sale(payload: schemas.SaleCreate, db: Session = Depends(get_db)):
    sale = crud.create_sale(db, payload)
    return crud.sale_to_out(sale)


@router.get("/{sale_id}", response_model=schemas.SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = crud.get_sale(db, sale_id)
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return crud.sale_to_out(sale)


@router.put("/{sale_id}", response_model=schemas.SaleOut)
def update_sale(sale_id: int, payload: schemas.SaleUpdate, db: Session = Depends(get_db)):
    sale = crud.get_sale(db, sale_id)
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    sale = crud.update_sale(db, sale, payload)
    return crud.sale_to_out(sale)


@router.patch("/{sale_id}/payment", response_model=schemas.SaleOut)
def record_payment(sale_id: int, payload: schemas.SalePayment, db: Session = Depends(get_db)):
    sale = crud.get_sale(db, sale_id)
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    sale = crud.record_sale_payment(db, sale, payload)
    return crud.sale_to_out(sale)


@router.delete("/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = crud.get_sale(db, sale_id)
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    crud.delete_sale(db, sale)
    return {"deleted": True}
