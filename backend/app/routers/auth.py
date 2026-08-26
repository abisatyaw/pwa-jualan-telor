from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas, security
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.UserOut)
def login(payload: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, payload.username)
    if user is None or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")
    session = crud.create_session(db, user)
    response.set_cookie(
        key=security.SESSION_COOKIE_NAME,
        value=session.token,
        httponly=True,
        samesite="lax",
        secure=security.COOKIE_SECURE,
        max_age=int(security.SESSION_TTL.total_seconds()),
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=security.SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    if session_token:
        crud.delete_session(db, session_token)
    response.delete_cookie(security.SESSION_COOKIE_NAME)


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user
