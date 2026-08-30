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


@router.get("/average-egg-weight", response_model=schemas.AverageEggWeight)
def get_average_egg_weight(db: Session = Depends(get_db)):
    return schemas.AverageEggWeight(value=crud.get_average_egg_weight_kg(db))


@router.put(
    "/average-egg-weight", response_model=schemas.AverageEggWeight, dependencies=[Depends(require_admin)]
)
def update_average_egg_weight(payload: schemas.AverageEggWeight, db: Session = Depends(get_db)):
    return schemas.AverageEggWeight(value=crud.set_average_egg_weight_kg(db, payload.value))


@router.get("/hdp-target", response_model=schemas.HdpTarget)
def get_hdp_target(db: Session = Depends(get_db)):
    return schemas.HdpTarget(value=crud.get_hdp_target_percentage(db))


@router.put("/hdp-target", response_model=schemas.HdpTarget, dependencies=[Depends(require_admin)])
def update_hdp_target(payload: schemas.HdpTarget, db: Session = Depends(get_db)):
    return schemas.HdpTarget(value=crud.set_hdp_target_percentage(db, payload.value))


@router.get("/fcr-target", response_model=schemas.FcrTargetOut)
def get_fcr_target(db: Session = Depends(get_db)):
    return schemas.FcrTargetOut(value=crud.get_fcr_target(db))


@router.put("/fcr-target", response_model=schemas.FcrTargetOut, dependencies=[Depends(require_admin)])
def update_fcr_target(payload: schemas.FcrTarget, db: Session = Depends(get_db)):
    return schemas.FcrTargetOut(value=crud.set_fcr_target(db, payload.value))


@router.get("/kg-per-karung", response_model=list[schemas.KgPerKarungRow])
def list_kg_per_karung(db: Session = Depends(get_db)):
    return [
        schemas.KgPerKarungRow(feed_type=feed_type, value=value)
        for feed_type, value in crud.get_all_kg_per_karung(db)
    ]


@router.put(
    "/kg-per-karung", response_model=schemas.KgPerKarungRow, dependencies=[Depends(require_admin)]
)
def update_kg_per_karung(payload: schemas.KgPerKarungUpdate, db: Session = Depends(get_db)):
    value = crud.set_kg_per_karung(db, payload.feed_type, payload.value)
    return schemas.KgPerKarungRow(feed_type=payload.feed_type, value=value)


@router.get("/investor-capital", response_model=schemas.IntSetting)
def get_investor_capital(db: Session = Depends(get_db)):
    return schemas.IntSetting(value=crud.get_investor_capital(db))


@router.put("/investor-capital", response_model=schemas.IntSetting, dependencies=[Depends(require_admin)])
def update_investor_capital(payload: schemas.IntSetting, db: Session = Depends(get_db)):
    return schemas.IntSetting(value=crud.set_investor_capital(db, payload.value))


@router.get("/opening-bank-cash", response_model=schemas.IntSetting)
def get_opening_bank_cash(db: Session = Depends(get_db)):
    return schemas.IntSetting(value=crud.get_opening_bank_cash(db))


@router.put("/opening-bank-cash", response_model=schemas.IntSetting, dependencies=[Depends(require_admin)])
def update_opening_bank_cash(payload: schemas.IntSetting, db: Session = Depends(get_db)):
    return schemas.IntSetting(value=crud.set_opening_bank_cash(db, payload.value))
