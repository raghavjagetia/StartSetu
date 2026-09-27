from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_role
from ..rules_engine import evaluate_eligibility

router = APIRouter(prefix="/api", tags=["applications"])


def _to_out(a: models.Application) -> schemas.ApplicationOut:
    out = schemas.ApplicationOut.model_validate(a)
    out.challenge_title = a.challenge.title if a.challenge else None
    out.startup_name = (
        a.startup.startup_profile.startup_name if a.startup and a.startup.startup_profile else None
    )
    out.has_pilot = a.pilot is not None
    out.pilot_id = a.pilot.id if a.pilot else None
    return out


@router.post("/challenges/{challenge_id}/apply", response_model=schemas.ApplicationOut)
def apply_to_challenge(
    challenge_id: int,
    payload: schemas.ApplicationIn,
    user: models.User = Depends(require_role(models.Role.startup)),
    db: Session = Depends(get_db),
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if challenge.status != models.ChallengeStatus.open:
        raise HTTPException(status_code=400, detail="This challenge is no longer accepting applications")

    existing = (
        db.query(models.Application)
        .filter(
            models.Application.challenge_id == challenge_id,
            models.Application.startup_id == user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this challenge")

    profile = user.startup_profile
    eligible, reasons = evaluate_eligibility(profile, challenge)

    application = models.Application(
        challenge_id=challenge_id,
        startup_id=user.id,
        pitch=payload.pitch,
        is_eligible=eligible,
        eligibility_reasons=reasons,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return _to_out(application)


@router.get("/applications/mine", response_model=list[schemas.ApplicationOut])
def my_applications(
    user: models.User = Depends(require_role(models.Role.startup)),
    db: Session = Depends(get_db),
):
    apps = (
        db.query(models.Application)
        .filter(models.Application.startup_id == user.id)
        .order_by(models.Application.created_at.desc())
        .all()
    )
    return [_to_out(a) for a in apps]


@router.get("/challenges/{challenge_id}/applications", response_model=list[schemas.ApplicationOut])
def challenge_applications(
    challenge_id: int,
    user: models.User = Depends(require_role(models.Role.department, models.Role.admin)),
    db: Session = Depends(get_db),
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if user.role == models.Role.department and challenge.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your challenge")

    apps = (
        db.query(models.Application)
        .filter(models.Application.challenge_id == challenge_id)
        .order_by(models.Application.created_at.desc())
        .all()
    )
    return [_to_out(a) for a in apps]


@router.post("/applications/{application_id}/approve", response_model=schemas.PilotOut)
def approve_application(
    application_id: int,
    payload: schemas.ApplicationApprove,
    user: models.User = Depends(require_role(models.Role.department)),
    db: Session = Depends(get_db),
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.challenge.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your challenge")
    if application.status == models.ApplicationStatus.approved:
        raise HTTPException(status_code=400, detail="Application already approved")
    if not payload.milestones:
        raise HTTPException(status_code=400, detail="At least one milestone is required")

    application.status = models.ApplicationStatus.approved

    total = sum(m.amount_lakhs for m in payload.milestones)
    pilot = models.Pilot(
        application_id=application.id,
        challenge_id=application.challenge_id,
        department_id=user.id,
        startup_id=application.startup_id,
        total_amount_lakhs=total,
        contract_terms=payload.contract_terms,
    )
    db.add(pilot)
    db.flush()

    for m in payload.milestones:
        db.add(
            models.Milestone(
                pilot_id=pilot.id,
                title=m.title,
                description=m.description,
                amount_lakhs=m.amount_lakhs,
                due_date=m.due_date,
            )
        )

    application.challenge.status = models.ChallengeStatus.piloting
    db.commit()
    db.refresh(pilot)

    out = schemas.PilotOut.model_validate(pilot)
    out.challenge_title = pilot.challenge.title
    out.department_name = pilot.department.org_name
    out.startup_name = pilot.startup.startup_profile.startup_name if pilot.startup.startup_profile else None
    return out


@router.post("/applications/{application_id}/reject", response_model=schemas.ApplicationOut)
def reject_application(
    application_id: int,
    payload: schemas.ApplicationReject,
    user: models.User = Depends(require_role(models.Role.department)),
    db: Session = Depends(get_db),
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.challenge.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your challenge")

    application.status = models.ApplicationStatus.rejected
    db.commit()
    db.refresh(application)
    return _to_out(application)
