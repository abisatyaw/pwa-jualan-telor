from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_current_user, get_db, require_admin

router = APIRouter(
    prefix="/api/asset-status-updates",
    tags=["asset-status-updates"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[schemas.AssetStatusUpdateOut])
def list_asset_status_updates(asset_id: int | None = None, db: Session = Depends(get_db)):
    return [crud.asset_status_update_to_out(u) for u in crud.get_asset_status_updates(db, asset_id)]


@router.post("", response_model=schemas.AssetStatusUpdateOut, status_code=201)
def create_asset_status_update(payload: schemas.AssetStatusUpdateCreate, db: Session = Depends(get_db)):
    try:
        update = crud.create_asset_status_update(db, payload)
    except crud.AssetStatusError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None
    return crud.asset_status_update_to_out(update)


@router.delete("/{update_id}", dependencies=[Depends(require_admin)])
def delete_asset_status_update(update_id: int, db: Session = Depends(get_db)):
    update = crud.get_asset_status_update(db, update_id)
    if update is None:
        raise HTTPException(status_code=404, detail="Status update not found")
    crud.delete_asset_status_update(db, update)
    return {"deleted": True}
