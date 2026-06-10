# HireIntOS — AI Multi-Persona Interview Platform

> Practice interviews with AI agents that read your resume, adapt in real-time, give hints not answers, and score you on professional rubrics.

Built for the **Google Cloud Rapid Agent Hackathon 2026** · MongoDB Partner Track

---

## What It Does

HireIntOS simulates a real multi-round hiring process with 4 specialized AI interviewer agents. Upload your resume and target job description — the agents generate personalized questions, remember your past sessions, and adapt difficulty based on your performance.

### The 4 AI Interviewers

| Agent | What It Does |
|-------|-------------|
| 🤝 **HR Agent** | Behavioral & cultural fit questions using STAR method |
| 📋 **Manager Agent** | Situational scenarios about leadership & prioritization |
| 🧠 **Technical Agent** | System design & CS concepts, adapts to your level |
| 💻 **Coding Agent** | Live coding with progressive hints — never gives the answer |

### Key Features

- **Resume-aware** — Agents generate questions from your resume + job description
- **Voice interaction** — Speak your answers (STT) and hear the agent's questions (TTS)
- **Webcam support** — Video call feel with your camera feed
- **Hints-only coding round** — AI guides you with progressive hints, never reveals solutions
- **Monaco code editor** — Full IDE experience for the coding round
- **Multi-dimensional scorecard** — Rubric-based evaluation per round
- **Candidate memory** — Remembers past sessions, tracks growth over time
- **Adaptive difficulty** — Adjusts question difficulty based on past performance
- **PDF upload** — Upload resume and JD as PDFs

---

## MongoDB MCP Server Integration

This project uses the [MongoDB MCP Server](https://github.com/mongodb-js/mongodb-mcp-server) as the primary tool interface between agents and the database. Agents interact with MongoDB directly through MCP for:

- **Fetching coding problems** — Queries `questions` collection with difficulty filters
- **Candidate history lookup** — Aggregates past evaluations to understand strengths/weaknesses
- **Adaptive difficulty** — Calculates average scores to determine question difficulty
- **Question deduplication** — Checks previously solved problems to avoid repeats
- **Saving evaluations** — Writes detailed rubric scores and feedback
- **Growth tracking** — Compares current vs past performance, notes improvements
- **Session notes** — Saves agent observations for future reference

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 15 + React 19 + Tailwind v4)     │
│  - Voice (TTS/STT) + Webcam + Monaco Editor         │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│  Backend (Python + FastAPI)                          │
│  - Google ADK Orchestrator                          │
│  - 4 Persona Agents (HR, Manager, Technical, Coding)│
└──────────────────────┬──────────────────────────────┘
                       │ MongoDB MCP Server (npx)
┌──────────────────────▼──────────────────────────────┐
│  MongoDB Atlas                                       │
│  - questions, sessions, evaluations collections     │
└─────────────────────────────────────────────────────┘

LLM: Google Gemini 2.5 Flash
Agent Framework: Google ADK
Database Tool: MongoDB MCP Server
Deployment: Google Cloud Run (Docker)
```

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- MongoDB Atlas cluster
- Google Gemini API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your credentials
python -m app.seed_data  # Seed coding questions
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Google Gemini 2.5 Flash |
| Agent Framework | Google ADK (Agent Development Kit) |
| Database Tool | MongoDB MCP Server |
| Backend | Python, FastAPI, Motor (async MongoDB) |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Code Editor | Monaco Editor |
| Voice | Web Speech API (TTS + STT) |
| Database | MongoDB Atlas |
| Deployment | Google Cloud Run |

---

## Demo

The platform flow:

1. **Landing** → Get Started
2. **Select** → Choose interview rounds + upload resume/JD (PDF)
3. **Interview** → Chat with AI (voice or text) + code editor for coding round
4. **Scorecard** → View rubric scores, feedback, and growth tracking

---

## Team

Built by [sreeram2001](https://github.com/sreeram2001) for the Google Cloud Rapid Agent Hackathon 2026.

## License

MIT
