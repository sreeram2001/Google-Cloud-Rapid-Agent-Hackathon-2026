"use client";
import { API_URL } from "@/lib/config";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Evaluation {
    round_type: string;
    overall_score: number;
    scores: Record<string, number>;
    feedback: string;
    hint_count: number;
    created_at: string;
}

interface Session {
    session_id: string;
    rounds: string[];
    status: string;
    created_at: string;
    evaluations: Evaluation[];
    avg_score: number;
    rounds_completed: number;
    total_rounds: number;
}

interface Progress {
    total_rounds_completed: number;
    avg_overall_score: number;
    score_trend: { score: number; round_type: string; created_at: string }[];
    by_round_type: Record<string, { avg_score: number; sessions_count: number; dimensions: Record<string, number> }>;
    strengths: { dimension: string; avg_score: number }[];
    weaknesses: { dimension: string; avg_score: number }[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);
        fetchData(u.email);
    }, [router]);

    const fetchData = async (email: string) => {
        try {
            const [historyRes, progressRes] = await Promise.all([
                fetch(`${API_URL}/api/dashboard/history?email=${encodeURIComponent(email)}`),
                fetch(`${API_URL}/api/dashboard/progress?email=${encodeURIComponent(email)}`),
            ]);

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setSessions(historyData.sessions);
            }
            if (progressRes.ok) {
                const progressData = await progressRes.json();
                setProgress(progressData);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const roundColors: Record<string, string> = {
        hr: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        manager: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        technical: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        coding: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    };

    const roundLabels: Record<string, string> = {
        hr: "HR",
        manager: "Manager",
        technical: "Technical",
        coding: "Coding",
    };

    const getScoreColor = (score: number) => {
        if (score >= 4) return "text-spotify-green";
        if (score >= 3) return "text-yellow-400";
        if (score >= 2) return "text-orange-400";
        return "text-red-400";
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center mesh-gradient">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-spotify-green animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-3 h-3 rounded-full bg-spotify-green animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-3 h-3 rounded-full bg-spotify-green animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 mesh-gradient" />
            <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-spotify-green/5 rounded-full blur-[150px]" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-slide-up">
                    <div>
                        <button
                            onClick={() => router.push("/select")}
                            className="text-spotify-muted hover:text-spotify-green transition-colors text-sm mb-3 inline-flex items-center gap-1 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">
                            <span className="text-white">Your </span><span className="text-gradient">Dashboard</span>
                        </h1>
                        <p className="text-spotify-muted text-sm mt-1">Track your interview progress over time</p>
                    </div>
                    {user && (
                        <div className="text-right">
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-xs text-spotify-muted">{user.email}</p>
                        </div>
                    )}
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-up stagger-1">
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                        <div className="relative p-5">
                            <p className="text-xs text-spotify-muted uppercase tracking-wider mb-1">Total Sessions</p>
                            <p className="text-3xl font-bold text-white">{sessions.length}</p>
                        </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                        <div className="relative p-5">
                            <p className="text-xs text-spotify-muted uppercase tracking-wider mb-1">Rounds Completed</p>
                            <p className="text-3xl font-bold text-white">{progress?.total_rounds_completed || 0}</p>
                        </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                        <div className="relative p-5">
                            <p className="text-xs text-spotify-muted uppercase tracking-wider mb-1">Avg Score</p>
                            <p className={`text-3xl font-bold ${getScoreColor(progress?.avg_overall_score || 0)}`}>
                                {progress?.avg_overall_score || 0}<span className="text-lg text-spotify-muted">/5</span>
                            </p>
                        </div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                        <div className="relative p-5">
                            <p className="text-xs text-spotify-muted uppercase tracking-wider mb-1">Best Area</p>
                            <p className="text-lg font-bold text-spotify-green">
                                {progress?.strengths?.[0]?.dimension || "—"}
                            </p>
                            {progress?.strengths?.[0] && (
                                <p className="text-xs text-spotify-muted">{progress.strengths[0].avg_score}/5</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Round Type Breakdown */}
                {progress && Object.keys(progress.by_round_type).length > 0 && (
                    <div className="mb-8 animate-slide-up stagger-2">
                        <h2 className="text-lg font-semibold text-white mb-4">Performance by Round Type</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(progress.by_round_type).map(([rt, data]) => (
                                <div key={rt} className="relative rounded-2xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl" />
                                    <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                                    <div className="relative p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${roundColors[rt] || "text-white"}`}>
                                                {roundLabels[rt] || rt}
                                            </span>
                                            <span className={`text-lg font-bold ${getScoreColor(data.avg_score)}`}>
                                                {data.avg_score}
                                            </span>
                                        </div>
                                        <p className="text-xs text-spotify-muted mb-3">{data.sessions_count} session{data.sessions_count > 1 ? "s" : ""}</p>
                                        {/* Dimension scores */}
                                        <div className="space-y-2">
                                            {Object.entries(data.dimensions).slice(0, 4).map(([dim, score]) => (
                                                <div key={dim} className="flex items-center justify-between">
                                                    <span className="text-xs text-spotify-muted capitalize">{dim.replace(/_/g, " ")}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-spotify-green rounded-full transition-all"
                                                                style={{ width: `${(score / 5) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-spotify-subtext w-6 text-right">{score}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strengths & Weaknesses */}
                {progress && (progress.strengths.length > 0 || progress.weaknesses.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-slide-up stagger-3">
                        {progress.strengths.length > 0 && (
                            <div className="relative rounded-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-white/[0.02] backdrop-blur-xl" />
                                <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl" />
                                <div className="relative p-5">
                                    <h3 className="text-sm font-semibold text-emerald-400 mb-3">💪 Strengths</h3>
                                    <div className="space-y-2">
                                        {progress.strengths.map((s) => (
                                            <div key={s.dimension} className="flex items-center justify-between">
                                                <span className="text-sm text-white capitalize">{s.dimension.replace(/_/g, " ")}</span>
                                                <span className="text-sm text-emerald-400 font-medium">{s.avg_score}/5</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {progress.weaknesses.length > 0 && (
                            <div className="relative rounded-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-white/[0.02] backdrop-blur-xl" />
                                <div className="absolute inset-0 border border-red-500/20 rounded-2xl" />
                                <div className="relative p-5">
                                    <h3 className="text-sm font-semibold text-red-400 mb-3">⚡ Areas to Improve</h3>
                                    <div className="space-y-2">
                                        {progress.weaknesses.map((w) => (
                                            <div key={w.dimension} className="flex items-center justify-between">
                                                <span className="text-sm text-white capitalize">{w.dimension.replace(/_/g, " ")}</span>
                                                <span className="text-sm text-red-400 font-medium">{w.avg_score}/5</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Session History */}
                <div className="animate-slide-up stagger-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Session History</h2>
                        {sessions.some(s => s.rounds_completed === 0) && (
                            <button
                                onClick={async () => {
                                    if (!user) return;
                                    await fetch(`${API_URL}/api/dashboard/clear-empty-sessions?email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
                                    setSessions(sessions.filter(s => s.rounds_completed > 0));
                                }}
                                className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            >
                                Clear Empty Sessions
                            </button>
                        )}
                    </div>
                    {sessions.length === 0 ? (
                        <div className="relative rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl" />
                            <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                            <div className="relative p-8 text-center">
                                <p className="text-spotify-muted">No sessions yet. Start your first interview!</p>
                                <button
                                    onClick={() => router.push("/select")}
                                    className="mt-4 px-6 py-2.5 bg-spotify-green rounded-full text-spotify-black text-sm font-bold hover:bg-spotify-green-light transition-all cursor-pointer"
                                >
                                    Start Interview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div key={session.session_id} className="relative rounded-2xl overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl" />
                                    <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-white/20 transition-colors" />
                                    <div className="relative p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Score circle */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${session.avg_score >= 4 ? "border-spotify-green/50 bg-spotify-green/10" : session.avg_score >= 2.5 ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/20 bg-white/5"}`}>
                                                <span className={`text-sm font-bold ${getScoreColor(session.avg_score)}`}>
                                                    {session.avg_score > 0 ? session.avg_score : "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {session.rounds.map((r) => (
                                                        <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full border ${roundColors[r] || "text-white border-white/20"}`}>
                                                            {roundLabels[r] || r}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-spotify-muted">
                                                    {formatDate(session.created_at)} · {session.rounds_completed}/{session.total_rounds} rounds completed
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/scorecard/${session.session_id}`)}
                                            className="text-xs text-spotify-muted hover:text-spotify-green transition-colors cursor-pointer"
                                        >
                                            View Scorecard →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
