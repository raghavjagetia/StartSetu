import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..deps import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["pilots"])


def _to_out(p: models.Pilot) -> schemas.PilotOut:
    out = schemas.PilotOut.model_validate(p)
    out.challenge_title = p.challenge.title if p.challenge else None
    out.department_name = (
        p.department.department_profile.department_name
        if p.department and p.department.department_profile
        else (p.department.org_name if p.department else None)
    )
    out.startup_name = (
        p.startup.startup_profile.startup_name if p.startup and p.startup.startup_profile else None
    )
    return out


@router.get("/pilots/mine", response_model=list[schemas.PilotOut])
def my_pilots(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Pilot)
    if user.role == models.Role.department:
        query = query.filter(models.Pilot.department_id == user.id)
    elif user.role == models.Role.startup:
        query = query.filter(models.Pilot.startup_id == user.id)
    pilots = query.order_by(models.Pilot.created_at.desc()).all()
    return [_to_out(p) for p in pilots]


def _get_pilot_or_403(pilot_id: int, user: models.User, db: Session) -> models.Pilot:
    pilot = db.query(models.Pilot).filter(models.Pilot.id == pilot_id).first()
    if not pilot:
        raise HTTPException(status_code=404, detail="Pilot not found")
    if user.role == models.Role.department and pilot.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your pilot")
    if user.role == models.Role.startup and pilot.startup_id != user.id:
        raise HTTPException(status_code=403, detail="Not your pilot")
    return pilot


@router.get("/pilots/{pilot_id}", response_model=schemas.PilotOut)
def get_pilot(pilot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    pilot = _get_pilot_or_403(pilot_id, user, db)
    return _to_out(pilot)


@router.post("/milestones/{milestone_id}/submit", response_model=schemas.MilestoneOut)
async def submit_milestone(
    milestone_id: int,
    deliverable_note: str = Form(...),
    file: UploadFile | None = File(None),
    user: models.User = Depends(require_role(models.Role.startup)),
    db: Session = Depends(get_db),
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if milestone.pilot.startup_id != user.id:
        raise HTTPException(status_code=403, detail="Not your milestone")
    if milestone.status in (models.MilestoneStatus.verified, models.MilestoneStatus.paid):
        raise HTTPException(status_code=400, detail="Milestone already verified")

    milestone.deliverable_note = deliverable_note
    milestone.status = models.MilestoneStatus.submitted
    milestone.submitted_at = datetime.utcnow()

    if file is not None and file.filename:
        os.makedirs(settings.upload_dir, exist_ok=True)
        ext = os.path.splitext(file.filename)[1]
        stored_name = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(settings.upload_dir, stored_name)
        content = await file.read()
        with open(path, "wb") as f:
            f.write(content)
        milestone.deliverable_file = stored_name

    db.commit()
    db.refresh(milestone)
    return milestone


@router.post("/milestones/{milestone_id}/verify", response_model=schemas.MilestoneOut)
def verify_milestone(
    milestone_id: int,
    payload: schemas.MilestoneVerify,
    user: models.User = Depends(require_role(models.Role.department)),
    db: Session = Depends(get_db),
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    if milestone.pilot.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your pilot")
    if milestone.status != models.MilestoneStatus.submitted:
        raise HTTPException(status_code=400, detail="Milestone has not been submitted for review")

    milestone.review_comment = payload.comment
    milestone.verified_at = datetime.utcnow()
    milestone.status = models.MilestoneStatus.paid if payload.approve else models.MilestoneStatus.rejected

    db.commit()
    db.refresh(milestone)

    pilot = milestone.pilot
    all_done = all(m.status == models.MilestoneStatus.paid for m in pilot.milestones)
    if all_done:
        pilot.status = models.PilotStatus.completed
        pilot.challenge.status = models.ChallengeStatus.scaled
        db.commit()

    return milestone
