"""Interview chat routes — handles message exchange with agents."""

from fastapi import APIRouter
from app.database import get_db
from app.models import ChatMessageRequest, ChatMessageResponse, SubmitCodeRequest
from app.agents import hr_agent, manager_agent, technical_agent, coding_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from datetime import datetime, timezone

router = APIRouter()

# Map round types to agents
AGENT_MAP = {
    "hr": hr_agent,
    "manager": manager_agent,
    "technical": technical_agent,
    "coding": coding_agent,
}

# In-memory session service for ADK
session_service = InMemorySessionService()


def build_context_message(session_doc: dict, round_type: str) -> str:
    """Build a context preamble from resume + JD for the agent's first message."""
    resume = session_doc.get("resume_text", "")
    jd = session_doc.get("job_description", "")

    context_parts = []
    if resume:
        context_parts.append(f"[CANDIDATE RESUME]:\n{resume}")
    if jd:
        context_parts.append(f"[JOB DESCRIPTION]:\n{jd}")

    if not context_parts:
        return ""

    return (
        "Use the following context to tailor your interview questions. "
        "Ask questions relevant to the candidate's experience and the target role. "
        "Do NOT repeat the resume back to the candidate.\n\n"
        + "\n\n".join(context_parts)
    )


@router.post("/chat", response_model=ChatMessageResponse)
async def chat(request: ChatMessageRequest):
    """Send a message to the current interview agent and get a response."""
    db = get_db()

    # Get session from MongoDB
    session_doc = await db.sessions.find_one({"session_id": request.session_id})
    if not session_doc:
        return ChatMessageResponse(
            reply="Session not found.", round_type="hr", is_complete=True
        )

    current_round_index = session_doc.get("current_round_index", 0)
    rounds = session_doc.get("rounds", [])

    if current_round_index >= len(rounds):
        return ChatMessageResponse(
            reply="All rounds completed! Check your scorecard.",
            round_type=rounds[-1] if rounds else "hr",
            is_complete=True,
        )

    current_round = rounds[current_round_index]
    agent = AGENT_MAP.get(current_round)

    if not agent:
        return ChatMessageResponse(
            reply=f"Unknown round type: {current_round}",
            round_type=current_round,
            is_complete=True,
        )

    # Build the message — include code context for coding round
    message_text = request.message
    if request.code and current_round == "coding":
        message_text += f"\n\n[Current code in editor]:\n```\n{request.code}\n```"

    # Create ADK runner and session
    runner = Runner(agent=agent, app_name="hireintos", session_service=session_service)

    # Get or create ADK session
    adk_session_id = f"{request.session_id}_{current_round}"
    adk_session = await session_service.get_session(
        app_name="hireintos", user_id="candidate", session_id=adk_session_id
    )

    # If first message in this round, prepend resume/JD context
    if not adk_session:
        adk_session = await session_service.create_session(
            app_name="hireintos", user_id="candidate", session_id=adk_session_id
        )
        # Inject context as a system-level preamble in the first user message
        context = build_context_message(session_doc, current_round)
        if context:
            message_text = f"{context}\n\n---\n\nCandidate says: {message_text}"

    # Send message to agent
    user_content = Content(parts=[Part(text=message_text)], role="user")

    response_text = ""
    try:
        async for event in runner.run_async(
            user_id="candidate", session_id=adk_session_id, new_message=user_content
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_text += part.text
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            response_text = "⚠️ API rate limit reached. Please wait a moment and try again."
        else:
            response_text = f"⚠️ Error communicating with AI: {error_msg[:200]}"

    # Save message to MongoDB session
    await db.sessions.update_one(
        {"session_id": request.session_id},
        {
            "$push": {
                "messages": {
                    "round": current_round,
                    "user": request.message,
                    "agent": response_text,
                    "timestamp": datetime.now(timezone.utc),
                }
            }
        },
    )

    return ChatMessageResponse(
        reply=response_text,
        round_type=current_round,
        is_complete=False,
    )


@router.post("/next-round")
async def next_round(session_id: str):
    """Advance to the next interview round."""
    db = get_db()

    result = await db.sessions.find_one_and_update(
        {"session_id": session_id},
        {"$inc": {"current_round_index": 1}},
        return_document=True,
    )

    if not result:
        return {"error": "Session not found"}

    new_index = result["current_round_index"]
    rounds = result["rounds"]

    if new_index >= len(rounds):
        return {"status": "all_rounds_complete", "round_index": new_index}

    return {
        "status": "advanced",
        "current_round": rounds[new_index],
        "round_index": new_index,
    }


@router.post("/submit-code")
async def submit_code(request: SubmitCodeRequest):
    """Submit code for evaluation in the coding round."""
    db = get_db()

    # Store the submission
    await db.sessions.update_one(
        {"session_id": request.session_id},
        {
            "$set": {
                "code_submission": {
                    "code": request.code,
                    "language": request.language,
                    "submitted_at": datetime.now(timezone.utc),
                }
            }
        },
    )

    return {"status": "submitted", "message": "Code submitted for evaluation."}
