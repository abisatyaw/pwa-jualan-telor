from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_current_user, get_db, require_admin

router = APIRouter(prefix="/api/settings", tags=["settings"], dependencies=[Depends(get_current_user)])


@router.get("/options", response_model=list[schemas.DropdownOptionOut])
def list_options(list_key: str, db: Session = Depends(get_db)):
    return crud.get_options(db, list_key)


@router.post("/options", response_model=schemas.DropdownOptionOut, status_code=201, dependencies=[Depends(require_admin)])
def create_option(payload: schemas.DropdownOptionCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_option(db, payload)
    except crud.DuplicateOptionError:
        raise HTTPException(status_code=400, detail="Opsi tersebut sudah ada") from None


@router.delete("/options/{option_id}", dependencies=[Depends(require_admin)])
def delete_option(option_id: int, db: Session = Depends(get_db)):
    option = crud.get_option(db, option_id)
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    crud.delete_option(db, option)
    return {"deleted": True}


@router.get("/kotak-to-kg", response_model=schemas.KotakConversion)
def get_kotak_to_kg(db: Session = Depends(get_db)):
    return schemas.KotakConversion(value=crud.get_kotak_to_kg(db))


@router.put("/kotak-to-kg", response_model=schemas.KotakConversion, dependencies=[Depends(require_admin)])
def update_kotak_to_kg(payload: schemas.KotakConversion, db: Session = Depends(get_db)):
    return schemas.KotakConversion(value=crud.set_kotak_to_kg(db, payload.value))
