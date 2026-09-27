import csv
import io
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/templates", response_model=list[schemas.TemplateOut])
def list_templates(
    user: models.User = Depends(require_role(models.Role.admin, models.Role.department)),
    db: Session = Depends(get_db),
):
    return db.query(models.EvaluationTemplate).order_by(models.EvaluationTemplate.created_at.desc()).all()


@router.post("/templates", response_model=schemas.TemplateOut)
def create_template(
    payload: schemas.TemplateIn,
    user: models.User = Depends(require_role(models.Role.admin)),
    db: Session = Depends(get_db),
):
    template = models.EvaluationTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    user: models.User = Depends(require_role(models.Role.admin)),
    db: Session = Depends(get_db),
):
    template = db.query(models.EvaluationTemplate).filter(models.EvaluationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"ok": True}


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    user: models.User = Depends(require_role(models.Role.admin)),
    db: Session = Depends(get_db),
):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.get("/analytics", response_model=schemas.AnalyticsOut)
def analytics(
    user: models.User = Depends(require_role(models.Role.admin)),
    db: Session = Depends(get_db),
):
    challenges = db.query(models.Challenge).all()
    applications = db.query(models.Application).all()
    pilots = db.query(models.Pilot).all()
    milestones = db.query(models.Milestone).all()

    challenges_by_month: dict[str, int] = defaultdict(int)
    for c in challenges:
        key = c.created_at.strftime("%Y-%m")
        challenges_by_month[key] += 1

    pilots_by_status = Counter(p.status.value for p in pilots)
    milestones_by_status = Counter(m.status.value for m in milestones)

    return schemas.AnalyticsOut(
        total_challenges=len(challenges),
        open_challenges=sum(1 for c in challenges if c.status == models.ChallengeStatus.open),
        total_startups=db.query(models.User).filter(models.User.role == models.Role.startup).count(),
        total_departments=db.query(models.User).filter(models.User.role == models.Role.department).count(),
        total_applications=len(applications),
        eligible_applications=sum(1 for a in applications if a.is_eligible),
        total_pilots=len(pilots),
        active_pilots=sum(1 for p in pilots if p.status == models.PilotStatus.active),
        completed_pilots=sum(1 for p in pilots if p.status == models.PilotStatus.completed),
        total_milestones=len(milestones),
        paid_milestones=sum(1 for m in milestones if m.status == models.MilestoneStatus.paid),
        total_paid_lakhs=sum(m.amount_lakhs for m in milestones if m.status == models.MilestoneStatus.paid),
        total_committed_lakhs=sum(p.total_amount_lakhs for p in pilots),
        challenges_by_month=[{"month": k, "count": v} for k, v in sorted(challenges_by_month.items())],
        pilots_by_status=[{"status": k, "count": v} for k, v in pilots_by_status.items()],
        milestones_by_status=[{"status": k, "count": v} for k, v in milestones_by_status.items()],
    )


@router.get("/export/pilots")
def export_pilots(
    user: models.User = Depends(require_role(models.Role.admin)),
    db: Session = Depends(get_db),
):
    pilots = db.query(models.Pilot).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "pilot_id",
            "challenge",
            "department",
            "startup",
            "status",
            "total_amount_lakhs",
            "milestones_total",
            "milestones_paid",
            "created_at",
        ]
    )
    for p in pilots:
        writer.writerow(
            [
                p.id,
                p.challenge.title if p.challenge else "",
                p.department.org_name if p.department else "",
                p.startup.startup_profile.startup_name if p.startup and p.startup.startup_profile else "",
                p.status.value,
                p.total_amount_lakhs,
                len(p.milestones),
                sum(1 for m in p.milestones if m.status == models.MilestoneStatus.paid),
                p.created_at.isoformat(),
            ]
        )

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=startsetu_pilots.csv"},
    )
