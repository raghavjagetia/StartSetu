from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_role

router = APIRouter(prefix="/api/profile", tags=["profiles"])


@router.get("/startup", response_model=schemas.StartupProfileOut)
def get_startup_profile(
    user: models.User = Depends(require_role(models.Role.startup)),
    db: Session = Depends(get_db),
):
    profile = db.query(models.StartupProfile).filter(models.StartupProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/startup", response_model=schemas.StartupProfileOut)
def update_startup_profile(
    payload: schemas.StartupProfileIn,
    user: models.User = Depends(require_role(models.Role.startup)),
    db: Session = Depends(get_db),
):
    profile = db.query(models.StartupProfile).filter(models.StartupProfile.user_id == user.id).first()
    if not profile:
        profile = models.StartupProfile(user_id=user.id)
        db.add(profile)

    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/department", response_model=schemas.DepartmentProfileOut)
def get_department_profile(
    user: models.User = Depends(require_role(models.Role.department)),
    db: Session = Depends(get_db),
):
    profile = db.query(models.DepartmentProfile).filter(models.DepartmentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/department", response_model=schemas.DepartmentProfileOut)
def update_department_profile(
    payload: schemas.DepartmentProfileIn,
    user: models.User = Depends(require_role(models.Role.department)),
    db: Session = Depends(get_db),
):
    profile = db.query(models.DepartmentProfile).filter(models.DepartmentProfile.user_id == user.id).first()
    if not profile:
        profile = models.DepartmentProfile(user_id=user.id)
        db.add(profile)

    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
