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
- **One-click hint button** — Request hints without typing during coding rounds
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
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                      │
│                 Next.js 15 + React 19 + Tailwind v4                 │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Landing  │→ │Persona Select│→ │ Interview │→ │  Scorecard   │  │
│  │  Page    │  │ + PDF Upload │  │   Page    │  │    Page      │  │
│  └──────────┘  └──────────────┘  └───────────┘  └──────────────┘  │
│                                         │                            │
│                          ┌──────────────┼──────────────┐            │
│                          │              │              │            │
│                    ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐      │
│                    │  Voice   │  │  Monaco  │  │  Webcam  │      │
│                    │ TTS/STT  │  │  Editor  │  │   Feed   │      │
│                    └──────────┘  └──────────┘  └──────────┘      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND                                       │
│                   Python + FastAPI                                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    API Routes                                   │ │
│  │  /api/sessions/start    → Create session + store resume/JD     │ │
│  │  /api/interview/chat    → Send message to current agent        │ │
│  │  /api/interview/next    → Advance to next round                │ │
│  │  /api/upload/parse-pdf  → Extract text from PDF                │ │
│  │  /api/sessions/scorecard → Get evaluation results              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                             │                                        │
│  ┌──────────────────────────▼─────────────────────────────────────┐ │
│  │              Google ADK (Agent Development Kit)                  │ │
│  │                                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │                 Orchestrator Agent                        │   │ │
│  │  │         Routes to correct persona based on round         │   │ │
│  │  └──────┬──────────┬──────────────┬──────────────┬─────────┘   │ │
│  │         │          │              │              │              │ │
│  │  ┌──────▼───┐ ┌────▼─────┐ ┌─────▼──────┐ ┌────▼──────┐     │ │
│  │  │ HR Agent │ │ Manager  │ │ Technical  │ │  Coding   │     │ │
│  │  │ STAR     │ │ Scenario │ │ Sys Design │ │ Hints Only│     │ │
│  │  │ Method   │ │ Based    │ │ Adaptive   │ │ Progressive│    │ │
│  │  └──────┬───┘ └────┬─────┘ └─────┬──────┘ └────┬──────┘     │ │
│  │         └──────────┴──────────────┴──────────────┘              │ │
│  │                             │                                    │ │
│  │                    MongoDB MCP Toolset                           │ │
│  └─────────────────────────────┬──────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ stdio (npx mongodb-mcp-server)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MongoDB MCP Server                                 │
│              (Official: mongodb-js/mongodb-mcp-server)                │
│                                                                      │
│  Tools exposed to agents:                                            │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │   find     │ │ aggregate  │ │ insert-many  │ │ update-many  │  │
│  └────────────┘ └────────────┘ └──────────────┘ └──────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │   count    │ │list-colls  │ │ coll-schema  │ │ delete-many  │  │
│  └────────────┘ └────────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ MongoDB Wire Protocol (TLS)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas (Cloud)                            │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   questions       │  │    sessions       │  │   evaluations    │  │
│  │ - round_type      │  │ - session_id      │  │ - session_id     │  │
│  │ - difficulty      │  │ - candidate_name  │  │ - round_type     │  │
│  │ - title           │  │ - rounds[]        │  │ - scores{}       │  │
│  │ - prompt          │  │ - resume_text     │  │ - feedback       │  │
│  │ - examples[]      │  │ - job_description │  │ - overall_score  │  │
│  │ - constraints[]   │  │ - messages[]      │  │ - hint_count     │  │
│  │ - hints[]         │  │ - created_at      │  │ - created_at     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow (Single Message)

```
User speaks/types → Frontend → POST /api/interview/chat
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │ 1. Fetch session from MongoDB (motor)    │
                    │ 2. Determine current round               │
                    │ 3. Build context (resume + JD + session) │
                    │ 4. Send to ADK Agent                     │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │ ADK Agent (e.g., Technical Agent)        │
                    │                                          │
                    │ • Receives message + context             │
                    │ • May call MongoDB MCP tools:            │
                    │   - find() → check candidate history     │
                    │   - aggregate() → calc avg scores        │
                    │   - insert-many() → save evaluation      │
                    │ • Generates personalized response        │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │ Response returned to frontend            │
                    │ • Displayed in chat                      │
                    │ • Read aloud via TTS                     │
                    │ • Saved to session messages in MongoDB   │
                    └─────────────────────────────────────────┘
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

### Screenshots

| Landing Page | Persona Selection |
|:---:|:---:|
| ![Landing](images/01.png) | ![Select](images/02.png) |

| Interview (Chat + Voice) | Scorecard |
|:---:|:---:|
| ![Interview](images/03.png) | ![Scorecard](images/04.png) |

### Platform Flow

1. **Landing** → Get Started
2. **Select** → Choose interview rounds + upload resume/JD (PDF)
3. **Interview** → Chat with AI (voice or text) + code editor for coding round
4. **Scorecard** → View rubric scores, feedback, and growth tracking

---

## Team

Built by [sreeram2001](https://github.com/sreeram2001) for the Google Cloud Rapid Agent Hackathon 2026.

## License

MIT
