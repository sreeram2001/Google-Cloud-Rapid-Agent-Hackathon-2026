"""Tools available to the interview agents via MongoDB."""

from google.adk.tools import FunctionTool
from app.database import get_db
from datetime import datetime, timezone
import random


async def get_coding_question(difficulty: str = "medium") -> dict:
    """Fetch a coding problem from MongoDB with test cases.

    Args:
        difficulty: One of 'easy', 'medium', 'hard'

    Returns:
        A coding problem with title, description, examples, constraints, and hints.
    """
    db = get_db()
    if db is None:
        return {"error": "Database not connected"}

    questions = await db.questions.find(
        {"round_type": "coding", "difficulty": difficulty}
    ).to_list(length=20)

    if not questions:
        return {"error": f"No coding questions found for difficulty: {difficulty}"}

    question = random.choice(questions)
    question["_id"] = str(question["_id"])
    return question


async def save_evaluation(
    session_id: str,
    round_type: str,
    scores: dict,
    feedback: str,
    hint_count: int = 0,
) -> dict:
    """Save an evaluation/scorecard for a completed interview round to MongoDB.

    Args:
        session_id: The interview session ID
        round_type: One of 'hr', 'manager', 'technical', 'coding'
        scores: Dict of rubric dimension -> score (1-5)
        feedback: Text summary of candidate performance
        hint_count: Number of hints given (coding round only)

    Returns:
        Confirmation with the saved evaluation ID.
    """
    db = get_db()
    if db is None:
        return {"error": "Database not connected"}

    evaluation = {
        "session_id": session_id,
        "round_type": round_type,
        "scores": scores,
        "feedback": feedback,
        "hint_count": hint_count,
        "overall_score": sum(scores.values()) / len(scores) if scores else 0,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.evaluations.insert_one(evaluation)
    return {"evaluation_id": str(result.inserted_id), "status": "saved"}


async def evaluate_code(
    code: str, language: str, problem_id: str
) -> dict:
    """Evaluate submitted code against the problem's test cases.

    Args:
        code: The candidate's submitted code
        language: Programming language (python, javascript, java, etc.)
        problem_id: The MongoDB ID of the coding problem

    Returns:
        Evaluation results — code is passed to the agent for LLM-based review.
    """
    return {
        "code": code,
        "language": language,
        "problem_id": problem_id,
        "evaluation_type": "llm_based",
        "note": "Code will be evaluated by the interviewer agent for correctness and style.",
    }


# Wrap as ADK FunctionTools
get_coding_question = FunctionTool(get_coding_question)
save_evaluation = FunctionTool(save_evaluation)
evaluate_code = FunctionTool(evaluate_code)
