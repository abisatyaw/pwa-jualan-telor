from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import get_db

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=list[schemas.AssetOut])
def list_assets(asset_type: str | None = None, search: str | None = None, db: Session = Depends(get_db)):
    assets = crud.get_assets(db, asset_type=asset_type, search=search)
    return [crud.asset_to_out(a) for a in assets]


@router.post("", response_model=schemas.AssetOut, status_code=201)
def create_asset(payload: schemas.AssetCreate, db: Session = Depends(get_db)):
    asset = crud.create_asset(db, payload)
    return crud.asset_to_out(asset)


@router.get("/{asset_id}", response_model=schemas.AssetOut)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = crud.get_asset(db, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return crud.asset_to_out(asset)


@router.put("/{asset_id}", response_model=schemas.AssetOut)
def update_asset(asset_id: int, payload: schemas.AssetUpdate, db: Session = Depends(get_db)):
    asset = crud.get_asset(db, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset = crud.update_asset(db, asset, payload)
    return crud.asset_to_out(asset)


@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = crud.get_asset(db, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    crud.delete_asset(db, asset)
    return {"deleted": True}
