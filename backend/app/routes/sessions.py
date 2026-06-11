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
        "email": request.email,
        "rounds": [r.value for r in request.rounds],
        "current_round_index": 0,
        "status": "active",
        "resume_text": request.resume_text,
        "job_description": request.job_description,
        "messages": [],
        "created_at": datetime.now(timezone.utc),
    }

    await db.sessions.insert_one(session)

    # Link session to user account
    if request.email:
        await db.users.update_one(
            {"email": request.email.lower()},
            {"$push": {"sessions": session_id}}
        )

    return StartSessionResponse(
        session_id=session_id,
        rounds=request.rounds,
        status="active",
    )


@router.get("/{session_id}/scorecard")
async def get_scorecard(session_id: str):
    """Get the final scorecard for a completed session."""
    db = get_db()

    # Get session to know which rounds were selected
    session_doc = await db.sessions.find_one({"session_id": session_id})
    selected_rounds = session_doc.get("rounds", []) if session_doc else []

    # Get all evaluations for this session
    evaluations = await db.evaluations.find(
        {"session_id": session_id}
    ).to_list(length=20)

    eval_responses = []
    total = 0.0
    completed_rounds = set()

    for ev in evaluations:
        score = ev.get("overall_score", 0)
        total += score
        round_type = ev.get("round_type", "unknown")
        completed_rounds.add(round_type)
        eval_responses.append({
            "session_id": session_id,
            "round_type": round_type,
            "scores": ev.get("scores", {}),
            "feedback": ev.get("feedback", ""),
            "overall_score": score,
            "hint_count": ev.get("hint_count", 0),
        })

    # Add placeholder entries for rounds that weren't evaluated yet
    for round_type in selected_rounds:
        if round_type not in completed_rounds:
            eval_responses.append({
                "session_id": session_id,
                "round_type": round_type,
                "scores": {},
                "feedback": "Round not yet evaluated. Complete the round and let the agent finish its assessment.",
                "overall_score": 0.0,
                "hint_count": 0,
            })

    avg_score = total / len(evaluations) if evaluations else 0
    completed_count = len(evaluations)
    total_count = len(selected_rounds)

    return ScorecardResponse(
        session_id=session_id,
        evaluations=eval_responses,
        overall_feedback=f"Completed {completed_count}/{total_count} round(s). Average score: {avg_score:.1f}/5" if completed_count > 0 else "No rounds evaluated yet. Complete your interview rounds to see scores.",
        total_score=avg_score,
    )
