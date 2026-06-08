"""Session management routes."""

from fastapi import APIRouter
from app.database import get_db
from app.models import StartSessionRequest, StartSessionResponse, ScorecardResponse
from datetime import datetime, timezone
import uuid

router = APIRouter()


@router.post("/start", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest):
    """Start a new interview session with selected persona rounds + resume/JD context."""
    db = get_db()
    session_id = str(uuid.uuid4())

    session = {
        "session_id": session_id,
        "candidate_name": request.candidate_name,
        "rounds": [r.value for r in request.rounds],
        "current_round_index": 0,
        "status": "active",
        "resume_text": request.resume_text,
        "job_description": request.job_description,
        "messages": [],
        "created_at": datetime.now(timezone.utc),
    }

    await db.sessions.insert_one(session)

    return StartSessionResponse(
        session_id=session_id,
        rounds=request.rounds,
        status="active",
    )


@router.get("/{session_id}/scorecard", response_model=ScorecardResponse)
async def get_scorecard(session_id: str):
    """Get the final scorecard for a completed session."""
    db = get_db()

    evaluations = await db.evaluations.find(
        {"session_id": session_id}
    ).to_list(length=10)

    if not evaluations:
        return ScorecardResponse(
            session_id=session_id,
            evaluations=[],
            overall_feedback="No evaluations completed yet.",
            total_score=0.0,
        )

    eval_responses = []
    total = 0.0
    for ev in evaluations:
        score = ev.get("overall_score", 0)
        total += score
        eval_responses.append({
            "session_id": session_id,
            "round_type": ev["round_type"],
            "scores": ev["scores"],
            "feedback": ev["feedback"],
            "overall_score": score,
            "hint_count": ev.get("hint_count", 0),
        })

    avg_score = total / len(evaluations) if evaluations else 0

    return ScorecardResponse(
        session_id=session_id,
        evaluations=eval_responses,
        overall_feedback=f"Completed {len(evaluations)} round(s). Average score: {avg_score:.1f}/5",
        total_score=avg_score,
    )
