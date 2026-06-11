"""Pydantic models for API request/response."""

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class RoundType(str, Enum):
    HR = "hr"
    MANAGER = "manager"
    TECHNICAL = "technical"
    CODING = "coding"


class StartSessionRequest(BaseModel):
    candidate_name: str = "Demo User"
    email: str = ""  # Link session to user account
    rounds: list[RoundType]
    resume_text: str = ""  # Candidate's resume content
    job_description: str = ""  # Target job description


class StartSessionResponse(BaseModel):
    session_id: str
    rounds: list[RoundType]
    status: str = "active"


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    code: Optional[str] = None  # For coding round — current editor content


class ChatMessageResponse(BaseModel):
    reply: str
    round_type: RoundType
    is_complete: bool = False
    hint_level: Optional[int] = None  # For coding round


class SubmitCodeRequest(BaseModel):
    session_id: str
    code: str
    language: str = "python"


class EvaluationResponse(BaseModel):
    session_id: str
    round_type: RoundType
    scores: dict
    feedback: str
    overall_score: float
    hint_count: int = 0


class ScorecardResponse(BaseModel):
    session_id: str
    evaluations: list[EvaluationResponse]
    overall_feedback: str
    total_score: float
