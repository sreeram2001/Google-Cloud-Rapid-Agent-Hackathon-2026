# HireIntOS — AI Multi-Persona Interview Platform

An AI-powered interview platform with multiple agent personas that simulate a real multi-round hiring process. Powered by Google Gemini and Google ADK, with MongoDB Atlas for data persistence.

## 🎭 Features

- **Persona Selection** — Choose which interview rounds to practice
- **HR Agent** — Behavioral questions using STAR method
- **Manager Agent** — Situational leadership scenarios
- **Technical Agent** — System design and CS concepts (adaptive difficulty)
- **Coding Agent** — Live coding with progressive hints (never gives answers)
- **Scorecard** — Multi-dimensional rubric evaluation after each round

## 🏗️ Architecture

```
Frontend (Next.js + TypeScript + Tailwind + Monaco Editor)
   ↕ REST API
Backend (Python + FastAPI + Google ADK)
   ↕ MongoDB MCP Server
Database (MongoDB Atlas)
   - questions, sessions, evaluations collections

LLM: Gemini 2.0 Flash (via Google ADK)
Hosting: Google Cloud Run
```

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in your credentials
python -m app.seed_data  # Seed question bank
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## 📦 Hackathon Submission

- **Hackathon:** Google Cloud Rapid Agent Hackathon 2026
- **Partner Track:** MongoDB
- **Deadline:** June 11, 2026

## 🛠️ Tech Stack

- **LLM:** Google Gemini 2.0 Flash
- **Agent Framework:** Google ADK (Agent Development Kit)
- **Backend:** Python, FastAPI
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Monaco Editor
- **Database:** MongoDB Atlas (via MCP Server)
- **Deployment:** Google Cloud Run
