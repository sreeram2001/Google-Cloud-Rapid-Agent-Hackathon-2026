"""Orchestrator agent that routes to the appropriate persona agent."""

from google.adk.agents import Agent
from app.agents.hr_agent import hr_agent
from app.agents.manager_agent import manager_agent
from app.agents.technical_agent import technical_agent
from app.agents.coding_agent import coding_agent
from app.config import settings

ORCHESTRATOR_SYSTEM_PROMPT = """You are the orchestrator for HireIntOS, an AI interview platform.

Your job is to route the conversation to the correct specialist interviewer agent
based on the selected interview round.

Available agents:
- hr_agent: Behavioral/cultural fit interview
- manager_agent: Situational/management interview
- technical_agent: System design and technical concepts
- coding_agent: Live coding with hints-only approach

When a session starts, route to the appropriate agent based on the round_type.
Do NOT conduct interviews yourself — always delegate to the specialist.
"""

orchestrator_agent = Agent(
    name="orchestrator_agent",
    model=settings.GEMINI_MODEL,
    instruction=ORCHESTRATOR_SYSTEM_PROMPT,
    sub_agents=[hr_agent, manager_agent, technical_agent, coding_agent],
)
