from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from .models import ApplicationStatus, ChallengeStatus, MilestoneStatus, PilotStatus, Role


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    org_name: Optional[str] = None
    role: Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    org_name: Optional[str] = None
    role: Role
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Profiles ----------
class StartupProfileIn(BaseModel):
    startup_name: str
    dpiit_number: Optional[str] = None
    incorporation_date: Optional[datetime] = None
    sector: Optional[str] = None
    annual_turnover_lakhs: Optional[float] = 0
    team_size: Optional[int] = 1
    description: Optional[str] = ""
    website: Optional[str] = None
    state: Optional[str] = None


class StartupProfileOut(StartupProfileIn):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class DepartmentProfileIn(BaseModel):
    department_name: str
    state: Optional[str] = "Maharashtra"
    contact_number: Optional[str] = None


class DepartmentProfileOut(DepartmentProfileIn):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# ---------- Challenges ----------
class ChallengeIn(BaseModel):
    title: str
    description: str
    sector: str = "Any"
    budget_max_lakhs: Optional[float] = None
    max_incorporation_years: int = 10
    max_turnover_lakhs: float = 10000
    require_dpiit: bool = True
    deadline: Optional[datetime] = None


class ChallengeOut(BaseModel):
    id: int
    department_id: int
    department_name: Optional[str] = None
    title: str
    description: str
    sector: str
    budget_max_lakhs: Optional[float]
    max_incorporation_years: int
    max_turnover_lakhs: float
    require_dpiit: bool
    status: ChallengeStatus
    deadline: Optional[datetime]
    created_at: datetime
    application_count: int = 0

    class Config:
        from_attributes = True


class ChallengeStatusUpdate(BaseModel):
    status: ChallengeStatus


class MatchOut(BaseModel):
    startup_id: int
    startup_name: str
    email: str
    sector: Optional[str]
    dpiit_number: Optional[str]
    annual_turnover_lakhs: Optional[float]
    is_eligible: bool
    reasons: list[str]
    fit_score: int
    already_applied: bool


# ---------- Applications ----------
class ApplicationIn(BaseModel):
    pitch: Optional[str] = ""


class ApplicationOut(BaseModel):
    id: int
    challenge_id: int
    challenge_title: Optional[str] = None
    startup_id: int
    startup_name: Optional[str] = None
    pitch: Optional[str]
    is_eligible: bool
    eligibility_reasons: list[str]
    status: ApplicationStatus
    created_at: datetime
    has_pilot: bool = False
    pilot_id: Optional[int] = None

    class Config:
        from_attributes = True


class MilestoneTemplateIn(BaseModel):
    title: str
    description: Optional[str] = ""
    amount_lakhs: float
    due_date: Optional[datetime] = None


class ApplicationApprove(BaseModel):
    contract_terms: Optional[str] = (
        "Standard StartSetu pilot agreement: deliverables verified per milestone; "
        "IP developed during the pilot is jointly licensed to the department for "
        "public-service use; data handled per applicable state data-protection norms; "
        "payment released within 15 days of milestone verification."
    )
    milestones: list[MilestoneTemplateIn]


class ApplicationReject(BaseModel):
    reason: Optional[str] = ""


# ---------- Pilots / Milestones ----------
class MilestoneOut(BaseModel):
    id: int
    pilot_id: int
    title: str
    description: Optional[str]
    amount_lakhs: float
    due_date: Optional[datetime]
    status: MilestoneStatus
    deliverable_note: Optional[str]
    deliverable_file: Optional[str]
    submitted_at: Optional[datetime]
    verified_at: Optional[datetime]
    review_comment: Optional[str]

    class Config:
        from_attributes = True


class PilotOut(BaseModel):
    id: int
    application_id: int
    challenge_id: int
    challenge_title: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    startup_id: int
    startup_name: Optional[str] = None
    status: PilotStatus
    total_amount_lakhs: float
    contract_terms: Optional[str]
    created_at: datetime
    milestones: list[MilestoneOut] = []

    class Config:
        from_attributes = True


class MilestoneSubmit(BaseModel):
    deliverable_note: str


class MilestoneVerify(BaseModel):
    approve: bool
    comment: Optional[str] = ""


# ---------- Admin ----------
class TemplateIn(BaseModel):
    name: str
    description: Optional[str] = ""
    max_incorporation_years: int = 10
    max_turnover_lakhs: float = 10000
    require_dpiit: bool = True
    criteria_notes: Optional[str] = ""


class TemplateOut(TemplateIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsOut(BaseModel):
    total_challenges: int
    open_challenges: int
    total_startups: int
    total_departments: int
    total_applications: int
    eligible_applications: int
    total_pilots: int
    active_pilots: int
    completed_pilots: int
    total_milestones: int
    paid_milestones: int
    total_paid_lakhs: float
    total_committed_lakhs: float
    challenges_by_month: list[dict]
    pilots_by_status: list[dict]
    milestones_by_status: list[dict]
