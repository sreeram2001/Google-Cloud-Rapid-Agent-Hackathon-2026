# HireAgent — AI Multi-Persona Interview Platform

## Hackathon: Google Cloud Rapid Agent Hackathon 2026
## Partner Track: MongoDB
## Deadline: June 11, 2026

---

## 💡 The Idea

An AI-powered interview platform with multiple agent personas that simulate a real multi-round hiring process. Companies use it to screen candidates. Students use it to practice.

The killer feature: the **Coding Round** where the AI acts like a real interviewer — gives hints, nudges, asks clarifying questions — but NEVER gives the answer directly.

---

## 🎭 The 4 Personas (Rounds)

### Round 1: HR Agent
- Behavioral & cultural fit questions
- STAR method evaluation
- Assesses: communication, motivation, team fit, red flags
- Example: "Tell me about a time you disagreed with a teammate. How did you handle it?"

### Round 2: Manager Agent
- Scenario-based situational questions
- Project management, prioritization, leadership
- Assesses: decision-making, ownership, conflict resolution
- Example: "You have 2 deadlines overlapping and your team is short-staffed. Walk me through your approach."

### Round 3: Technical Agent
- Concepts, system design, domain knowledge
- Adapts difficulty in real-time based on candidate responses
- Assesses: depth of knowledge, ability to explain, architectural thinking
- Example: "How would you design a URL shortener that handles 10M requests/day?"

### Round 4: Coding Agent (⭐ Star Feature)
- A coding problem is displayed on the left
- Monaco Editor (code editor) on the right
- Student writes code live
- Agent behavior:
  - Watches what they're writing
  - If stuck for 2+ min → offers a gentle nudge
  - If student asks for help → gives HINT only (never code)
  - If going wrong direction → asks a guiding question
  - Escalates hints progressively (vague → more specific)
  - After submission → evaluates on rubric (approach, correctness, edge cases, style, complexity)
- This mimics what a real interviewer does in a Google/Amazon coding round

---

## 🏗️ Architecture (High Level)

```
FRONTEND (Next.js + TypeScript + Tailwind)
├── Landing page (company/student login)
├── Interview lobby (select round or do all 4)
├── Chat interface (for rounds 1-3)
├── Coding interface (for round 4)
│   ├── Problem statement panel (left)
│   ├── Monaco code editor (right)
│   └── AI chat/hints panel (bottom or side)
└── Results/scorecard page

BACKEND (Python + FastAPI)
├── Google ADK orchestrator (manages multi-agent flow)
├── 4 Agent definitions (each with unique system prompt + tools)
├── MongoDB MCP Server integration
├── Code evaluation engine
└── Session management

DATABASE (MongoDB Atlas)
├── questions collection (problem bank per round)
├── sessions collection (full interview transcripts)
├── candidates collection (profiles, history)
├── evaluations collection (rubric scores per round)
└── companies collection (custom job descriptions, rubrics)

LLM: Gemini 2.0 Flash (via Vertex AI)
HOSTING: Google Cloud Run
```

---

## 🔌 Why MongoDB Track?

1. Interview data is inherently unstructured — different rounds produce different shapes of data
2. Conversation histories are nested documents (perfect for MongoDB)
3. Question bank needs flexible schemas (coding questions have test cases, HR questions don't)
4. MongoDB MCP Server lets the agent directly query/store data during the interview
5. Atlas Search for finding similar questions, preventing repeats
6. Aggregation pipelines for candidate analytics dashboard

---

## 🧠 The "Hints Only" Coding Agent — How It Works

System prompt strategy:
- "You are a senior technical interviewer. You NEVER provide code solutions."
- "When asked for help, you may only: ask a clarifying question, suggest thinking about a specific concept, point out an edge case they missed, or ask what data structure might fit."
- "Progressive hint levels: Level 1 (very vague), Level 2 (directional), Level 3 (nearly explicit but still no code)"
- Track hint count — more hints = lower score on "independence" rubric

Evaluation rubric (scored 1-5 each):
- Problem understanding (did they ask clarifying questions?)
- Approach/algorithm choice
- Code correctness
- Edge case handling
- Code style/readability
- Time/space complexity awareness
- Independence (how many hints needed?)

---

## 🎯 Key Differentiators (vs. existing tools)

| Existing Tools | HireAgent |
|---------------|-----------|
| Static question banks | AI adapts questions based on responses |
| Pass/fail scoring | Multi-dimensional rubric scoring |
| No interviewer interaction | Real-time hints and nudges |
| Single round | Full 4-round pipeline |
| Generic feedback | Specific, actionable feedback per dimension |
| No memory | Remembers past sessions, tracks growth |

---


### Must have:
- [ ] 2 working personas (Technical + Coding) — these demo best
- [ ] Monaco editor with basic code execution/evaluation
- [ ] Hints-only behavior in coding round
- [ ] Rubric-based scorecard at the end
- [ ] MongoDB storing questions + sessions
- [ ] Deployed on Cloud Run

### Nice to have (if time permits):
- [ ] HR + Manager rounds
- [ ] Company customization (upload job description)
- [ ] Candidate dashboard with progress over time
- [ ] Code execution sandbox (run tests against student code)

---

## 🤔 Open Questions to Decide

1. Do we run student code server-side (security risk) or just have LLM evaluate the logic?
   - Recommendation: LLM evaluation for hackathon, sandboxed execution as stretch goal

2. Do we use WebSocket for real-time chat or simple REST polling?
   - Recommendation: WebSocket for the coding round (feels more interactive), REST for other rounds

3. Question bank — do we seed it or have the LLM generate questions?
   - Recommendation: Seed 20-30 curated questions in MongoDB, LLM can generate follow-ups

4. How much of the ADK multi-agent pattern do we use vs. simple prompt switching?
   - Recommendation: Use ADK properly (separate agent per persona with tools) — judges will look for this