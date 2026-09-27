from sqlalchemy.orm import Session

from . import models
from .config import settings
from .security import hash_password


def seed_admin(db: Session) -> None:
    existing = db.query(models.User).filter(models.User.email == settings.admin_email).first()
    if existing:
        return

    admin = models.User(
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        full_name="StartSetu Admin",
        org_name="Maharashtra State Innovation Society",
        role=models.Role.admin,
    )
    db.add(admin)
    db.commit()


def seed_templates(db: Session) -> None:
    if db.query(models.EvaluationTemplate).count() > 0:
        return

    defaults = [
        models.EvaluationTemplate(
            name="Standard DPIIT Relaxed Norms",
            description="Default relaxed eligibility used for most department challenges.",
            max_incorporation_years=10,
            max_turnover_lakhs=10000,
            require_dpiit=True,
            criteria_notes="Based on Public Procurement (Preference to Make in India) Order relaxations for DPIIT-recognized startups.",
        ),
        models.EvaluationTemplate(
            name="Early-Stage Deep Tech",
            description="For pre-revenue or early-stage deep-tech pilots.",
            max_incorporation_years=5,
            max_turnover_lakhs=2000,
            require_dpiit=True,
            criteria_notes="Tighter incorporation window; suited to R&D-heavy pilots with smaller budgets.",
        ),
        models.EvaluationTemplate(
            name="Scale-Up Ready",
            description="For startups pilot-tested elsewhere, ready for state-wide scale-up.",
            max_incorporation_years=15,
            max_turnover_lakhs=25000,
            require_dpiit=False,
            criteria_notes="Relaxed further for proven solutions moving from pilot to scale.",
        ),
    ]
    db.add_all(defaults)
    db.commit()
