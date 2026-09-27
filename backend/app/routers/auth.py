from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenResponse)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if payload.role == models.Role.admin:
        raise HTTPException(status_code=403, detail="Admin accounts cannot self-register")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        org_name=payload.org_name,
        role=payload.role,
    )
    db.add(user)
    db.flush()

    if payload.role == models.Role.startup:
        db.add(models.StartupProfile(user_id=user.id, startup_name=payload.org_name or payload.full_name))
    elif payload.role == models.Role.department:
        db.add(models.DepartmentProfile(user_id=user.id, department_name=payload.org_name or payload.full_name))

    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id), user.role.value)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(str(user.id), user.role.value)
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user
