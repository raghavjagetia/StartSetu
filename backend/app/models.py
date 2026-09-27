import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class Role(str, enum.Enum):
    department = "department"
    startup = "startup"
    admin = "admin"


class ChallengeStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    piloting = "piloting"
    scaled = "scaled"


class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    shortlisted = "shortlisted"
    approved = "approved"
    rejected = "rejected"


class PilotStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    terminated = "terminated"


class MilestoneStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    verified = "verified"
    paid = "paid"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    org_name = Column(String(255), nullable=True)
    role = Column(Enum(Role), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    startup_profile = relationship(
        "StartupProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    department_profile = relationship(
        "DepartmentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class StartupProfile(Base):
    __tablename__ = "startup_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    startup_name = Column(String(255), nullable=False, default="")
    dpiit_number = Column(String(100), nullable=True)
    incorporation_date = Column(DateTime, nullable=True)
    sector = Column(String(120), nullable=True)
    annual_turnover_lakhs = Column(Float, nullable=True, default=0)
    team_size = Column(Integer, nullable=True, default=1)
    description = Column(Text, nullable=True, default="")
    website = Column(String(255), nullable=True)
    state = Column(String(120), nullable=True)

    user = relationship("User", back_populates="startup_profile")


class DepartmentProfile(Base):
    __tablename__ = "department_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    department_name = Column(String(255), nullable=False, default="")
    state = Column(String(120), nullable=True, default="Maharashtra")
    contact_number = Column(String(50), nullable=True)

    user = relationship("User", back_populates="department_profile")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False, default="")
    sector = Column(String(120), nullable=False, default="Any")
    budget_max_lakhs = Column(Float, nullable=True)

    # Relaxed eligibility norms (rules engine checks against these)
    max_incorporation_years = Column(Integer, nullable=False, default=10)
    max_turnover_lakhs = Column(Float, nullable=False, default=10000)
    require_dpiit = Column(Boolean, nullable=False, default=True)

    status = Column(Enum(ChallengeStatus), nullable=False, default=ChallengeStatus.open)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("User")
    applications = relationship("Application", back_populates="challenge", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    startup_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    pitch = Column(Text, nullable=True, default="")
    is_eligible = Column(Boolean, nullable=False, default=False)
    eligibility_reasons = Column(JSON, nullable=True, default=list)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.applied)
    created_at = Column(DateTime, default=datetime.utcnow)

    challenge = relationship("Challenge", back_populates="applications")
    startup = relationship("User")
    pilot = relationship("Pilot", back_populates="application", uselist=False, cascade="all, delete-orphan")


class Pilot(Base):
    __tablename__ = "pilots"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    startup_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(Enum(PilotStatus), nullable=False, default=PilotStatus.active)
    total_amount_lakhs = Column(Float, nullable=False, default=0)
    contract_terms = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="pilot")
    challenge = relationship("Challenge")
    department = relationship("User", foreign_keys=[department_id])
    startup = relationship("User", foreign_keys=[startup_id])
    milestones = relationship("Milestone", back_populates="pilot", cascade="all, delete-orphan", order_by="Milestone.id")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    pilot_id = Column(Integer, ForeignKey("pilots.id"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    amount_lakhs = Column(Float, nullable=False, default=0)
    due_date = Column(DateTime, nullable=True)

    status = Column(Enum(MilestoneStatus), nullable=False, default=MilestoneStatus.pending)
    deliverable_note = Column(Text, nullable=True, default="")
    deliverable_file = Column(String(500), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    review_comment = Column(Text, nullable=True, default="")

    pilot = relationship("Pilot", back_populates="milestones")


class EvaluationTemplate(Base):
    __tablename__ = "evaluation_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    max_incorporation_years = Column(Integer, nullable=False, default=10)
    max_turnover_lakhs = Column(Float, nullable=False, default=10000)
    require_dpiit = Column(Boolean, nullable=False, default=True)
    criteria_notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
