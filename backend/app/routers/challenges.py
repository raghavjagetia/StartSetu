from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_role
from ..rules_engine import evaluate_eligibility, fit_score

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


def _to_out(c: models.Challenge) -> schemas.ChallengeOut:
    out = schemas.ChallengeOut.model_validate(c)
    out.department_name = (
        c.department.department_profile.department_name
        if c.department and c.department.department_profile
        else (c.department.org_name if c.department else None)
    )
    out.application_count = len(c.applications)
    return out


@router.post("", response_model=schemas.ChallengeOut)
def create_challenge(
    payload: schemas.ChallengeIn,
    user: models.User = Depends(require_role(models.Role.department)),
    db: Session = Depends(get_db),
):
    challenge = models.Challenge(department_id=user.id, **payload.model_dump())
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return _to_out(challenge)


@router.get("", response_model=list[schemas.ChallengeOut])
def list_challenges(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Challenge)
    if user.role == models.Role.department:
        query = query.filter(models.Challenge.department_id == user.id)
    elif user.role == models.Role.startup:
        query = query.filter(models.Challenge.status == models.ChallengeStatus.open)
    challenges = query.order_by(models.Challenge.created_at.desc()).all()
    return [_to_out(c) for c in challenges]


@router.get("/{challenge_id}", response_model=schemas.ChallengeOut)
def get_challenge(challenge_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return _to_out(challenge)


@router.patch("/{challenge_id}", response_model=schemas.ChallengeOut)
def update_challenge_status(
    challenge_id: int,
    payload: schemas.ChallengeStatusUpdate,
    user: models.User = Depends(require_role(models.Role.department, models.Role.admin)),
    db: Session = Depends(get_db),
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if user.role == models.Role.department and challenge.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your challenge")

    challenge.status = payload.status
    db.commit()
    db.refresh(challenge)
    return _to_out(challenge)


@router.get("/{challenge_id}/matches", response_model=list[schemas.MatchOut])
def get_matches(
    challenge_id: int,
    user: models.User = Depends(require_role(models.Role.department, models.Role.admin)),
    db: Session = Depends(get_db),
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if user.role == models.Role.department and challenge.department_id != user.id:
        raise HTTPException(status_code=403, detail="Not your challenge")

    applied_ids = {
        a.startup_id
        for a in db.query(models.Application).filter(models.Application.challenge_id == challenge_id).all()
    }

    startups = db.query(models.User).filter(models.User.role == models.Role.startup).all()
    results = []
    for s in startups:
        profile = s.startup_profile
        eligible, reasons = evaluate_eligibility(profile, challenge)
        results.append(
            schemas.MatchOut(
                startup_id=s.id,
                startup_name=profile.startup_name if profile else s.full_name,
                email=s.email,
                sector=profile.sector if profile else None,
                dpiit_number=profile.dpiit_number if profile else None,
                annual_turnover_lakhs=profile.annual_turnover_lakhs if profile else None,
                is_eligible=eligible,
                reasons=reasons,
                fit_score=fit_score(profile, challenge),
                already_applied=s.id in applied_ids,
            )
        )

    results.sort(key=lambda r: (not r.is_eligible, -r.fit_score))
    return results
