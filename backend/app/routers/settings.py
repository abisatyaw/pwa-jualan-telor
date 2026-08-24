from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/options", response_model=list[schemas.DropdownOptionOut])
def list_options(list_key: str, db: Session = Depends(get_db)):
    return crud.get_options(db, list_key)


@router.post("/options", response_model=schemas.DropdownOptionOut, status_code=201)
def create_option(payload: schemas.DropdownOptionCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_option(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Opsi tersebut sudah ada") from None


@router.delete("/options/{option_id}")
def delete_option(option_id: int, db: Session = Depends(get_db)):
    option = crud.get_option(db, option_id)
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    crud.delete_option(db, option)
    return {"deleted": True}
