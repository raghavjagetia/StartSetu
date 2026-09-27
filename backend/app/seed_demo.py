"""Realistic demo dataset so a fresh deploy (e.g. on Render) doesn't show up
empty. Idempotent: skipped entirely if any Challenge already exists.
All demo accounts share one password so evaluators can log in as anyone.
"""
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from . import models
from .security import hash_password

DEMO_PASSWORD = "Demo@1234"


def _years_ago(years: float) -> datetime:
    return datetime.utcnow() - timedelta(days=int(years * 365.25))


def _months_ago(months: int) -> datetime:
    return datetime.utcnow() - timedelta(days=months * 30)


def _make_department(db: Session, email: str, full_name: str, department_name: str) -> models.User:
    user = models.User(
        email=email,
        password_hash=hash_password(DEMO_PASSWORD),
        full_name=full_name,
        org_name=department_name,
        role=models.Role.department,
    )
    db.add(user)
    db.flush()
    db.add(models.DepartmentProfile(user_id=user.id, department_name=department_name, state="Maharashtra"))
    return user


def _make_startup(db: Session, email: str, full_name: str, **profile_kwargs) -> models.User:
    user = models.User(
        email=email,
        password_hash=hash_password(DEMO_PASSWORD),
        full_name=full_name,
        org_name=profile_kwargs.get("startup_name"),
        role=models.Role.startup,
    )
    db.add(user)
    db.flush()
    db.add(models.StartupProfile(user_id=user.id, state="Maharashtra", **profile_kwargs))
    return user


def seed_demo_data(db: Session) -> None:
    if db.query(models.Challenge).count() > 0:
        return

    # ---------------- Departments ----------------
    dept_agri = _make_department(db, "dept.agriculture@startsetu.demo", "Anjali Deshmukh", "Department of Agriculture")
    dept_health = _make_department(db, "dept.health@startsetu.demo", "Suresh Patil", "Department of Public Health")
    dept_edu = _make_department(db, "dept.education@startsetu.demo", "Meera Kulkarni", "Department of School Education")
    dept_urban = _make_department(db, "dept.urbandev@startsetu.demo", "Vikram Rao", "Urban Development Department")
    dept_water = _make_department(db, "dept.water@startsetu.demo", "Sunita Joshi", "Water Resources Department")

    # ---------------- Startups ----------------
    s_agrosense = _make_startup(
        db, "agrosense@startsetu.demo", "Rahul Verma",
        startup_name="AgroSense Pvt Ltd", dpiit_number="DIPP100234", incorporation_date=_years_ago(3),
        sector="AgriTech", annual_turnover_lakhs=180, team_size=14,
        description="IoT soil-moisture sensing and irrigation scheduling for smallholder farmers.",
        website="https://agrosense.example.com",
    )
    s_krishimitra = _make_startup(
        db, "krishimitra@startsetu.demo", "Pooja Nair",
        startup_name="KrishiMitra AI", dpiit_number="DIPP100455", incorporation_date=_years_ago(5),
        sector="AgriTech", annual_turnover_lakhs=620, team_size=22,
        description="AI-based crop disease detection from smartphone images.",
        website="https://krishimitra.example.com",
    )
    s_healthbridge = _make_startup(
        db, "healthbridge@startsetu.demo", "Arjun Mehta",
        startup_name="HealthBridge Innovations", dpiit_number="DIPP100678", incorporation_date=_years_ago(4),
        sector="HealthTech", annual_turnover_lakhs=340, team_size=18,
        description="Telemedicine kiosks with vital-sign capture for rural primary health centers.",
        website="https://healthbridge.example.com",
    )
    s_meditrack = _make_startup(
        db, "meditrack@startsetu.demo", "Kavita Iyer",
        startup_name="MediTrack Solutions", dpiit_number="DIPP100789", incorporation_date=_years_ago(7),
        sector="HealthTech", annual_turnover_lakhs=1450, team_size=35,
        description="AI-assisted diagnostic triage for district hospitals.",
        website="https://meditrack.example.com",
    )
    s_eduspark = _make_startup(
        db, "eduspark@startsetu.demo", "Rohan Gupta",
        startup_name="EduSpark Technologies", dpiit_number="DIPP100890", incorporation_date=_years_ago(2),
        sector="EdTech", annual_turnover_lakhs=90, team_size=9,
        description="Adaptive learning app aligned to state board curriculum.",
        website="https://eduspark.example.com",
    )
    s_skillbridge = _make_startup(
        db, "skillbridge@startsetu.demo", "Neha Singh",
        startup_name="SkillBridge Learning", dpiit_number=None, incorporation_date=_years_ago(6),
        sector="EdTech", annual_turnover_lakhs=210, team_size=12,
        description="Micro-learning modules for digital literacy in Zilla Parishad schools.",
        website="https://skillbridge.example.com",
    )
    s_urbanflow = _make_startup(
        db, "urbanflow@startsetu.demo", "Aditya Kulkarni",
        startup_name="UrbanFlow Mobility", dpiit_number="DIPP101001", incorporation_date=_years_ago(4),
        sector="Mobility", annual_turnover_lakhs=780, team_size=26,
        description="AI-based adaptive traffic-signal control for tier-2 cities.",
        website="https://urbanflow.example.com",
    )
    s_aquaguard = _make_startup(
        db, "aquaguard@startsetu.demo", "Priyanka Shah",
        startup_name="AquaGuard Systems", dpiit_number="DIPP101122", incorporation_date=_years_ago(8),
        sector="CleanTech", annual_turnover_lakhs=2600, team_size=40,
        description="Low-cost IoT sensors for river and reservoir water-quality monitoring.",
        website="https://aquaguard.example.com",
    )
    s_paynext = _make_startup(
        db, "paynext@startsetu.demo", "Karan Malhotra",
        startup_name="PayNext Fintech", dpiit_number="DIPP101233", incorporation_date=_years_ago(9),
        sector="FinTech", annual_turnover_lakhs=4200, team_size=55,
        description="Digital payment rails for municipal fee collection.",
        website="https://paynext.example.com",
    )
    s_govconnect = _make_startup(
        db, "govconnect@startsetu.demo", "Simran Kaur",
        startup_name="GovConnect Systems", dpiit_number="DIPP101344", incorporation_date=_years_ago(1),
        sector="GovTech", annual_turnover_lakhs=45, team_size=6,
        description="Citizen grievance redressal chatbot for state departments.",
        website="https://govconnect.example.com",
    )
    db.flush()

    # ---------------- Challenges ----------------
    def make_challenge(dept, title, description, sector, budget, max_incorp, max_turnover, require_dpiit, status, months_old):
        c = models.Challenge(
            department_id=dept.id,
            title=title,
            description=description,
            sector=sector,
            budget_max_lakhs=budget,
            max_incorporation_years=max_incorp,
            max_turnover_lakhs=max_turnover,
            require_dpiit=require_dpiit,
            status=status,
            created_at=_months_ago(months_old),
        )
        db.add(c)
        db.flush()
        return c

    c1 = make_challenge(
        dept_agri, "Smart irrigation monitoring for drought-prone talukas",
        "Deploy IoT-based soil moisture sensing and automated irrigation scheduling across drought-prone talukas.",
        "AgriTech", 40, 8, 800, True, models.ChallengeStatus.open, 1,
    )
    c2 = make_challenge(
        dept_agri, "AI-based crop disease early warning system",
        "Build an early-warning system that flags crop disease outbreaks from farmer-submitted images.",
        "AgriTech", 60, 10, 1000, True, models.ChallengeStatus.piloting, 4,
    )
    c3 = make_challenge(
        dept_health, "Tele-health kiosks for rural primary health centers",
        "Set up telemedicine kiosks with basic vital-sign capture at rural PHCs, linked to district hospitals.",
        "HealthTech", 50, 6, 500, True, models.ChallengeStatus.open, 1,
    )
    c4 = make_challenge(
        dept_health, "AI-assisted diagnostic support for district hospitals",
        "AI-assisted triage and diagnostic support to reduce load on radiologists at district hospitals.",
        "HealthTech", 120, 10, 2000, True, models.ChallengeStatus.scaled, 6,
    )
    c5 = make_challenge(
        dept_edu, "Adaptive learning platform for government schools",
        "Adaptive, offline-capable learning app aligned to the state board curriculum for grades 6-10.",
        "EdTech", 35, 5, 300, True, models.ChallengeStatus.open, 2,
    )
    c6 = make_challenge(
        dept_edu, "Digital literacy micro-learning for ZP schools",
        "Short-format digital literacy modules for Zilla Parishad school students and teachers.",
        "EdTech", 25, 10, 500, False, models.ChallengeStatus.piloting, 3,
    )
    c7 = make_challenge(
        dept_urban, "Smart traffic management for tier-2 cities",
        "Adaptive traffic-signal control and congestion analytics for tier-2 municipal corporations.",
        "Mobility", 90, 8, 1000, True, models.ChallengeStatus.open, 1,
    )
    c8 = make_challenge(
        dept_water, "IoT-based water quality monitoring in rivers",
        "Real-time water-quality monitoring network for major river stretches and reservoirs.",
        "CleanTech", 70, 12, 3000, True, models.ChallengeStatus.closed, 5,
    )

    # ---------------- Applications ----------------
    def make_application(challenge, startup, pitch, status=models.ApplicationStatus.applied):
        from .rules_engine import evaluate_eligibility

        profile = startup.startup_profile
        eligible, reasons = evaluate_eligibility(profile, challenge)
        app = models.Application(
            challenge_id=challenge.id,
            startup_id=startup.id,
            pitch=pitch,
            is_eligible=eligible,
            eligibility_reasons=reasons,
            status=status,
        )
        db.add(app)
        db.flush()
        return app

    make_application(c1, s_agrosense, "We already run soil-moisture pilots in 3 districts and can scale fast.")
    make_application(c1, s_krishimitra, "Our imaging pipeline extends naturally to irrigation-need prediction.")

    app_c2 = make_application(
        c2, s_krishimitra, "Our disease-detection model is field-tested across 400 farms.",
        status=models.ApplicationStatus.approved,
    )

    make_application(c3, s_healthbridge, "Our kiosks are already deployed at 12 PHCs in Vidarbha.")
    make_application(c3, s_meditrack, "We can adapt our diagnostic stack for kiosk-based triage.")

    app_c4 = make_application(
        c4, s_meditrack, "Our triage model has been validated at 3 district hospitals already.",
        status=models.ApplicationStatus.approved,
    )

    make_application(c5, s_eduspark, "Our adaptive engine is aligned to Maharashtra state board curriculum.")
    make_application(c5, s_skillbridge, "We'd like to extend our micro-learning content to this curriculum.")

    app_c6 = make_application(
        c6, s_skillbridge, "Our micro-learning modules are already used in 40 ZP schools.",
        status=models.ApplicationStatus.approved,
    )

    make_application(c7, s_urbanflow, "Our adaptive signal control cut congestion 18% in a pilot city.")
    make_application(c7, s_paynext, "We can extend our payments infra to smart-parking monetisation.")
    make_application(c7, s_govconnect, "Our chatbot stack can front citizen traffic-violation queries.")

    make_application(c8, s_aquaguard, "Our sensor network already covers 2 river stretches in the state.", status=models.ApplicationStatus.rejected)

    db.flush()

    # ---------------- Pilots & Milestones ----------------
    def make_pilot(application, department, startup, status, total, terms, milestones):
        pilot = models.Pilot(
            application_id=application.id,
            challenge_id=application.challenge_id,
            department_id=department.id,
            startup_id=startup.id,
            status=status,
            total_amount_lakhs=total,
            contract_terms=terms,
        )
        db.add(pilot)
        db.flush()
        for m in milestones:
            db.add(models.Milestone(pilot_id=pilot.id, **m))
        return pilot

    standard_terms = (
        "Standard StartSetu pilot agreement: deliverables verified per milestone; IP developed "
        "during the pilot is jointly licensed to the department for public-service use; data handled "
        "per applicable state data-protection norms; payment released within 15 days of milestone "
        "verification."
    )

    make_pilot(
        app_c2, dept_agri, s_krishimitra, models.PilotStatus.active, 60, standard_terms,
        [
            dict(
                title="Pilot deployment across 10 villages", amount_lakhs=20,
                description="Deploy disease-detection app to 10 pilot villages.",
                status=models.MilestoneStatus.paid,
                deliverable_note="Deployed to 10 villages; 2,400 farmer scans logged in first month.",
                submitted_at=_months_ago(3), verified_at=_months_ago(3) + timedelta(days=10),
                review_comment="Verified via field visit.",
            ),
            dict(
                title="State-wide rollout readiness report", amount_lakhs=40, due_date=_months_ago(-1),
                description="Readiness assessment for scaling beyond the pilot district.",
                status=models.MilestoneStatus.pending,
            ),
        ],
    )

    make_pilot(
        app_c4, dept_health, s_meditrack, models.PilotStatus.completed, 120, standard_terms,
        [
            dict(
                title="Diagnostic model validation at 3 hospitals", amount_lakhs=45,
                description="Validate triage model against radiologist ground truth.",
                status=models.MilestoneStatus.paid,
                deliverable_note="94% concordance with radiologist review across 1,200 cases.",
                submitted_at=_months_ago(5), verified_at=_months_ago(5) + timedelta(days=8),
                review_comment="Validation report accepted.",
            ),
            dict(
                title="Rollout to 15 district hospitals", amount_lakhs=75,
                description="Full rollout with on-site training for radiology staff.",
                status=models.MilestoneStatus.paid,
                deliverable_note="Rolled out to 15 hospitals; training completed for 60 staff.",
                submitted_at=_months_ago(2), verified_at=_months_ago(2) + timedelta(days=6),
                review_comment="Confirmed via hospital sign-off letters.",
            ),
        ],
    )

    make_pilot(
        app_c6, dept_edu, s_skillbridge, models.PilotStatus.active, 25, standard_terms,
        [
            dict(
                title="Content library for 100 schools", amount_lakhs=10,
                description="Build and localize micro-learning content library.",
                status=models.MilestoneStatus.paid,
                deliverable_note="Content library live across 100 ZP schools in Marathi and English.",
                submitted_at=_months_ago(2), verified_at=_months_ago(2) + timedelta(days=5),
                review_comment="Spot-checked 10 schools; content confirmed live.",
            ),
            dict(
                title="Teacher training completion report", amount_lakhs=15,
                description="Train teachers across all 100 schools and report completion.",
                status=models.MilestoneStatus.submitted,
                deliverable_note="Training completed for 210 teachers; completion report attached.",
                submitted_at=_months_ago(0),
            ),
        ],
    )

    db.commit()
