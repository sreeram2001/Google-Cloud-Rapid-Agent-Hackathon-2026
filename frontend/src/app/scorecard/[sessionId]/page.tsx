"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Evaluation {
    round_type: string;
    scores: Record<string, number>;
    feedback: string;
    overall_score: number;
    hint_count: number;
}

interface Scorecard {
    session_id: string;
    evaluations: Evaluation[];
    overall_feedback: string;
    total_score: number;
}

export default function ScorecardPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;
    const [scorecard, setScorecard] = useState<Scorecard | null>(null);

    useEffect(() => {
        fetchScorecard();
    }, []);

    const fetchScorecard = async () => {
        try {
            const res = await fetch(
                `http://localhost:8000/api/sessions/${sessionId}/scorecard`
            );
            const data = await res.json();
            setScorecard(data);
        } catch (error) {
            console.error("Failed to fetch scorecard:", error);
        }
    };

    const roundConfig: Record<string, { label: string; gradient: string }> = {
        hr: { label: "🤝 HR Round", gradient: "from-emerald-500/20 to-teal-500/5" },
        manager: { label: "📋 Manager Round", gradient: "from-blue-500/20 to-indigo-500/5" },
        technical: { label: "🧠 Technical Round", gradient: "from-purple-500/20 to-pink-500/5" },
        coding: { label: "💻 Coding Round", gradient: "from-orange-500/20 to-yellow-500/5" },
    };

    if (!scorecard) {
        return (
            <main className="min-h-screen flex items-center justify-center mesh-gradient">
                <div className="flex items-center gap-3 text-spotify-subtext">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    Loading scorecard...
                </div>
            </main>
        );
    }

    const scoreColor = (score: number) => {
        if (score >= 4) return "text-spotify-green";
        if (score >= 3) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <main className="min-h-screen px-6 py-12 mesh-gradient relative">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-spotify-green/5 rounded-full blur-3xl" />

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10 animate-slide-up">
                    <button
                        onClick={() => router.push("/select")}
                        className="text-spotify-muted hover:text-spotify-green transition-colors text-sm mb-6 inline-block cursor-pointer"
                    >
                        ← New Interview
                    </button>
                    <h1 className="text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                        Your <span className="text-gradient">Scorecard</span>
                    </h1>
                    <p className="text-spotify-subtext mt-2">{scorecard.overall_feedback}</p>
                </div>

                {/* Overall score */}
                <div className="mb-10 glass-strong rounded-3xl p-8 text-center glow-green animate-slide-up stagger-1">
                    <p className="text-xs text-spotify-muted uppercase tracking-wider mb-2">Overall Score</p>
                    <p className={`text-6xl font-bold font-[family-name:var(--font-display)] ${scoreColor(scorecard.total_score)}`}>
                        {scorecard.total_score.toFixed(1)}
                        <span className="text-2xl text-spotify-muted font-normal"> / 5.0</span>
                    </p>
                    {/* Score bar */}
                    <div className="mt-4 w-48 h-2 bg-white/5 rounded-full mx-auto overflow-hidden">
                        <div
                            className="h-full bg-spotify-green rounded-full transition-all duration-1000"
                            style={{ width: `${(scorecard.total_score / 5) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Per-round evaluations */}
                <div className="space-y-5">
                    {scorecard.evaluations.map((evaluation, i) => {
                        const config = roundConfig[evaluation.round_type] || { label: evaluation.round_type, gradient: "from-white/5 to-white/2" };
                        const isPending = Object.keys(evaluation.scores).length === 0;
                        return (
                            <div
                                key={i}
                                className={`glass-strong rounded-2xl p-6 animate-slide-up relative overflow-hidden ${isPending ? "opacity-60" : ""}`}
                                style={{ animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-white text-lg">
                                            {config.label}
                                        </h3>
                                        {isPending ? (
                                            <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-spotify-muted">
                                                Pending
                                            </span>
                                        ) : (
                                            <span className={`text-lg font-bold ${scoreColor(evaluation.overall_score)}`}>
                                                {evaluation.overall_score.toFixed(1)}/5
                                            </span>
                                        )}
                                    </div>

                                    {/* Scores grid — only if evaluated */}
                                    {!isPending && (
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {Object.entries(evaluation.scores).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center p-2 rounded-lg bg-black/20">
                                                    <span className="text-xs text-spotify-subtext capitalize">
                                                        {key.replace(/_/g, " ")}
                                                    </span>
                                                    <span className={`text-sm font-bold ${scoreColor(value)}`}>
                                                        {value}<span className="text-spotify-muted font-normal">/5</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {evaluation.hint_count > 0 && (
                                        <p className="text-xs text-yellow-400/80 mb-3 flex items-center gap-1">
                                            <span>💡</span> Hints used: {evaluation.hint_count}
                                        </p>
                                    )}

                                    <p className="text-sm text-spotify-subtext leading-relaxed">{evaluation.feedback}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {scorecard.evaluations.length === 0 && (
                    <div className="glass-strong rounded-2xl p-12 text-center">
                        <p className="text-spotify-muted text-lg">No evaluations yet.</p>
                        <p className="text-spotify-muted text-sm mt-2">Complete an interview round to see your scores here.</p>
                    </div>
                )}

                <div className="mt-10 text-center animate-slide-up stagger-4">
                    <button
                        onClick={() => router.push("/select")}
                        className="px-8 py-3 bg-spotify-green rounded-full text-spotify-black font-bold hover:bg-spotify-green-light hover:scale-105 transition-all duration-300 cursor-pointer glow-green"
                    >
                        Start New Interview
                    </button>
                </div>
            </div>
        </main>
    );
}
