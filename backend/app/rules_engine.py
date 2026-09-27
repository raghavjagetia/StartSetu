"""Deterministic eligibility & matching rules engine.

Checks a startup's profile against a challenge's (relaxed) procurement
norms, mirroring the "Preference to Make in India" / DPIIT-recognition
style relaxations described in the proposal. Returns a boolean verdict
plus human-readable reasons so departments can audit every match.
"""
from datetime import datetime

from .models import Challenge, StartupProfile


def evaluate_eligibility(profile: StartupProfile | None, challenge: Challenge) -> tuple[bool, list[str]]:
    reasons: list[str] = []

    if profile is None:
        return False, ["Startup has not completed its eligibility profile yet."]

    is_eligible = True

    if challenge.require_dpiit and not profile.dpiit_number:
        is_eligible = False
        reasons.append("Missing DPIIT recognition number (required for this challenge).")
    elif profile.dpiit_number:
        reasons.append(f"DPIIT recognized ({profile.dpiit_number}).")

    if profile.incorporation_date:
        age_years = (datetime.utcnow() - profile.incorporation_date).days / 365.25
        if age_years > challenge.max_incorporation_years:
            is_eligible = False
            reasons.append(
                f"Incorporated {age_years:.1f} years ago, exceeds relaxed limit of "
                f"{challenge.max_incorporation_years} years."
            )
        else:
            reasons.append(
                f"Incorporation age {age_years:.1f} yrs within relaxed limit of "
                f"{challenge.max_incorporation_years} yrs."
            )
    else:
        is_eligible = False
        reasons.append("Incorporation date missing from profile.")

    turnover = profile.annual_turnover_lakhs or 0
    if turnover > challenge.max_turnover_lakhs:
        is_eligible = False
        reasons.append(
            f"Annual turnover ₹{turnover:.0f}L exceeds relaxed cap of "
            f"₹{challenge.max_turnover_lakhs:.0f}L."
        )
    else:
        reasons.append(
            f"Annual turnover ₹{turnover:.0f}L within relaxed cap of "
            f"₹{challenge.max_turnover_lakhs:.0f}L."
        )

    if challenge.sector and challenge.sector.lower() != "any":
        if (profile.sector or "").strip().lower() != challenge.sector.strip().lower():
            reasons.append(
                f"Sector mismatch: startup is in '{profile.sector or 'unspecified'}', "
                f"challenge targets '{challenge.sector}' (soft flag, does not block eligibility)."
            )

    return is_eligible, reasons


def fit_score(profile: StartupProfile | None, challenge: Challenge) -> int:
    """A simple 0-100 problem-solution fit score used as a stand-in for the
    planned NLP-based scoring model. Rewards sector match, DPIIT recognition,
    and headroom under the relaxed norms so departments can rank matches."""
    if profile is None:
        return 0

    score = 40  # baseline for meeting hard eligibility
    if profile.sector and challenge.sector and profile.sector.strip().lower() == challenge.sector.strip().lower():
        score += 30
    if profile.dpiit_number:
        score += 15
    if profile.annual_turnover_lakhs is not None and challenge.max_turnover_lakhs:
        headroom = 1 - min(profile.annual_turnover_lakhs / max(challenge.max_turnover_lakhs, 1), 1)
        score += round(headroom * 15)
    return max(0, min(100, score))
