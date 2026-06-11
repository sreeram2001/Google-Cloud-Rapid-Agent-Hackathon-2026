"""HireIntOS Backend — FastAPI + Google ADK + MongoDB."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, dashboard, interview, sessions, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="HireIntOS API",
    description="AI Multi-Persona Interview Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "hireintos-api"}
