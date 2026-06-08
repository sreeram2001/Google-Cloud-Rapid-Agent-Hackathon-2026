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

    const roundLabel: Record<string, string> = {
        hr: "🤝 HR Round",
        manager: "📋 Manager Round",
        technical: "🧠 Technical Round",
        coding: "💻 Coding Round",
    };

    if (!scorecard) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-gray-400">Loading scorecard...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Your Scorecard</h1>
                <p className="text-gray-400 mb-8">{scorecard.overall_feedback}</p>

                {/* Overall score */}
                <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-gray-800">
                    <p className="text-sm text-gray-400 mb-1">Overall Score</p>
                    <p className="text-4xl font-bold">
                        {scorecard.total_score.toFixed(1)}
                        <span className="text-lg text-gray-500"> / 5.0</span>
                    </p>
                </div>

                {/* Per-round evaluations */}
                <div className="space-y-6">
                    {scorecard.evaluations.map((evaluation, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-xl bg-gray-900/50 border border-gray-800"
                        >
                            <h3 className="font-semibold mb-3">
                                {roundLabel[evaluation.round_type] || evaluation.round_type}
                            </h3>

                            {/* Scores */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {Object.entries(evaluation.scores).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="text-gray-400 capitalize">
                                            {key.replace(/_/g, " ")}
                                        </span>
                                        <span className="font-medium">
                                            {value}
                                            <span className="text-gray-600">/5</span>
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {evaluation.hint_count > 0 && (
                                <p className="text-xs text-yellow-500 mb-2">
                                    💡 Hints used: {evaluation.hint_count}
                                </p>
                            )}

                            <p className="text-sm text-gray-300">{evaluation.feedback}</p>
                        </div>
                    ))}
                </div>

                {scorecard.evaluations.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                        No evaluations yet. Complete an interview round to see your scores.
                    </p>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push("/select")}
                        className="px-6 py-3 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                        Start New Interview
                    </button>
                </div>
            </div>
        </main>
    );
}
