"""Dashboard routes — user history, progress tracking, session analytics."""

from fastapi import APIRouter, HTTPException
from app.database import get_db
from datetime import datetime, timezone

router = APIRouter()


@router.get("/history")
async def get_user_history(email: str):
    """Get all sessions and evaluations for a user."""
    db = get_db()

    user = await db.users.find_one({"email": email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all sessions for this user
    sessions = await db.sessions.find(
        {"email": email.lower()}
    ).sort("created_at", -1).to_list(length=50)

    # Get all evaluations for these sessions
    session_ids = [s["session_id"] for s in sessions]
    evaluations = await db.evaluations.find(
        {"session_id": {"$in": session_ids}}
    ).to_list(length=200)

    # Build evaluation lookup by session_id
    eval_by_session = {}
    for ev in evaluations:
        sid = ev["session_id"]
        if sid not in eval_by_session:
            eval_by_session[sid] = []
        eval_by_session[sid].append({
            "round_type": ev.get("round_type", "unknown"),
            "overall_score": ev.get("overall_score", 0),
            "scores": ev.get("scores", {}),
            "feedback": ev.get("feedback", ""),
            "hint_count": ev.get("hint_count", 0),
            "created_at": ev.get("created_at", "").isoformat() if isinstance(ev.get("created_at"), datetime) else str(ev.get("created_at", "")),
        })

    # Build session list
    session_list = []
    for s in sessions:
        sid = s["session_id"]
        evals = eval_by_session.get(sid, [])
        avg_score = sum(e["overall_score"] for e in evals) / len(evals) if evals else 0

        session_list.append({
            "session_id": sid,
            "rounds": s.get("rounds", []),
            "status": s.get("status", "active"),
            "created_at": s.get("created_at", "").isoformat() if isinstance(s.get("created_at"), datetime) else str(s.get("created_at", "")),
            "evaluations": evals,
            "avg_score": round(avg_score, 1),
            "rounds_completed": len(evals),
            "total_rounds": len(s.get("rounds", [])),
        })

    return {"sessions": session_list, "total_sessions": len(session_list)}


@router.get("/progress")
async def get_user_progress(email: str):
    """Get progress analytics — score trends, strengths, weaknesses."""
    db = get_db()

    user = await db.users.find_one({"email": email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all evaluations for this user (across all sessions)
    session_ids = user.get("sessions", [])
    evaluations = await db.evaluations.find(
        {"session_id": {"$in": session_ids}}
    ).sort("created_at", 1).to_list(length=200)

    if not evaluations:
        return {
            "total_rounds_completed": 0,
            "avg_overall_score": 0,
            "score_trend": [],
            "by_round_type": {},
            "strengths": [],
            "weaknesses": [],
        }

    # Score trend over time
    score_trend = []
    for ev in evaluations:
        score_trend.append({
            "score": ev.get("overall_score", 0),
            "round_type": ev.get("round_type", "unknown"),
            "created_at": ev.get("created_at", "").isoformat() if isinstance(ev.get("created_at"), datetime) else str(ev.get("created_at", "")),
        })

    # Average by round type
    by_round_type = {}
    for ev in evaluations:
        rt = ev.get("round_type", "unknown")
        if rt not in by_round_type:
            by_round_type[rt] = {"scores": [], "dimensions": {}}
        by_round_type[rt]["scores"].append(ev.get("overall_score", 0))

        # Aggregate dimension scores
        for dim, score in ev.get("scores", {}).items():
            if isinstance(score, (int, float)):
                if dim not in by_round_type[rt]["dimensions"]:
                    by_round_type[rt]["dimensions"][dim] = []
                by_round_type[rt]["dimensions"][dim].append(score)

    # Compute averages
    round_type_summary = {}
    all_dimensions = {}
    for rt, data in by_round_type.items():
        avg = sum(data["scores"]) / len(data["scores"])
        dim_avgs = {}
        for dim, scores in data["dimensions"].items():
            dim_avg = sum(scores) / len(scores)
            dim_avgs[dim] = round(dim_avg, 1)
            if dim not in all_dimensions:
                all_dimensions[dim] = []
            all_dimensions[dim].append(dim_avg)

        round_type_summary[rt] = {
            "avg_score": round(avg, 1),
            "sessions_count": len(data["scores"]),
            "dimensions": dim_avgs,
        }

    # Strengths and weaknesses (dimensions with avg >= 4 vs <= 2.5)
    strengths = []
    weaknesses = []
    for dim, scores in all_dimensions.items():
        avg = sum(scores) / len(scores)
        if avg >= 4:
            strengths.append({"dimension": dim, "avg_score": round(avg, 1)})
        elif avg <= 2.5:
            weaknesses.append({"dimension": dim, "avg_score": round(avg, 1)})

    overall_scores = [ev.get("overall_score", 0) for ev in evaluations]
    avg_overall = sum(overall_scores) / len(overall_scores)

    return {
        "total_rounds_completed": len(evaluations),
        "avg_overall_score": round(avg_overall, 1),
        "score_trend": score_trend,
        "by_round_type": round_type_summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
    }


@router.post("/save-proctoring")
async def save_proctoring(session_id: str, warning_count: int, round_type: str):
    """Save proctoring warning data to the session."""
    db = get_db()

    await db.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                f"proctoring.{round_type}": {
                    "warning_count": warning_count,
                    "saved_at": datetime.now(timezone.utc),
                }
            }
        },
    )

    # Also update evaluation if it exists
    await db.evaluations.update_one(
        {"session_id": session_id, "round_type": round_type},
        {"$set": {"proctoring_warnings": warning_count}},
    )

    return {"status": "saved"}


@router.delete("/clear-empty-sessions")
async def clear_empty_sessions(email: str):
    """Delete sessions that have no evaluations (0 rounds completed)."""
    db = get_db()

    # Get all sessions for this user
    sessions = await db.sessions.find({"email": email.lower()}).to_list(length=200)

    deleted_count = 0
    for session in sessions:
        sid = session["session_id"]
        # Check if this session has any evaluations
        eval_count = await db.evaluations.count_documents({"session_id": sid})
        if eval_count == 0:
            await db.sessions.delete_one({"session_id": sid})
            # Remove from user's sessions array
            await db.users.update_one(
                {"email": email.lower()},
                {"$pull": {"sessions": sid}}
            )
            deleted_count += 1

    return {"deleted": deleted_count}


@router.delete("/session/{session_id}")
async def delete_session(session_id: str, email: str):
    """Delete a specific session and its evaluations."""
    db = get_db()

    await db.sessions.delete_one({"session_id": session_id})
    await db.evaluations.delete_many({"session_id": session_id})
    await db.users.update_one(
        {"email": email.lower()},
        {"$pull": {"sessions": session_id}}
    )

    return {"status": "deleted"}
