"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RoundType = "hr" | "manager" | "technical" | "coding";

interface PersonaOption {
    id: RoundType;
    emoji: string;
    title: string;
    subtitle: string;
    description: string;
}

const PERSONAS: PersonaOption[] = [
    {
        id: "hr",
        emoji: "🤝",
        title: "HR Agent",
        subtitle: "Behavioral & Cultural Fit",
        description:
            "Practice STAR-method behavioral questions tailored to your resume and target role.",
    },
    {
        id: "manager",
        emoji: "📋",
        title: "Manager Agent",
        subtitle: "Situational & Leadership",
        description:
            "Navigate scenario-based questions about prioritization, conflict resolution, and decision-making.",
    },
    {
        id: "technical",
        emoji: "🧠",
        title: "Technical Agent",
        subtitle: "System Design & Concepts",
        description:
            "Discuss architecture and CS fundamentals relevant to your target role. Adapts to your level.",
    },
    {
        id: "coding",
        emoji: "💻",
        title: "Coding Agent",
        subtitle: "Live Coding with Hints",
        description:
            "Solve coding problems with an AI interviewer that gives hints — never answers. Just like a real interview.",
    },
];

export default function SelectPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<RoundType[]>([]);
    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [isStarting, setIsStarting] = useState(false);

    const toggle = (id: RoundType) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (text: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setter(text);
    };

    const startInterview = async () => {
        if (selected.length === 0) return;
        setIsStarting(true);

        try {
            const res = await fetch("http://localhost:8000/api/sessions/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidate_name: "Demo User",
                    rounds: selected,
                    resume_text: resumeText,
                    job_description: jobDescription,
                }),
            });
            const data = await res.json();
            router.push(`/interview/${data.session_id}`);
        } catch (error) {
            console.error("Failed to start session:", error);
            setIsStarting(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center px-6 py-12">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold mb-2">Choose Your Interview Rounds</h1>
                <p className="text-gray-400 mb-8">
                    Select one or more personas to practice with. Upload your resume and job description for personalized questions.
                </p>

                {/* Resume + JD Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📄 Resume (paste or upload .txt)
                        </label>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste your resume here..."
                            rows={4}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-500"
                        />
                        <input
                            type="file"
                            accept=".txt,.md"
                            onChange={(e) => handleFileUpload(e, setResumeText)}
                            className="mt-2 text-xs text-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            💼 Job Description (paste or upload .txt)
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here..."
                            rows={4}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-500"
                        />
                        <input
                            type="file"
                            accept=".txt,.md"
                            onChange={(e) => handleFileUpload(e, setJobDescription)}
                            className="mt-2 text-xs text-gray-500"
                        />
                    </div>
                </div>

                {/* Persona Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {PERSONAS.map((persona) => {
                        const isSelected = selected.includes(persona.id);
                        return (
                            <button
                                key={persona.id}
                                onClick={() => toggle(persona.id)}
                                className={`p-6 rounded-xl text-left transition-all border cursor-pointer ${isSelected
                                        ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                                        : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{persona.emoji}</span>
                                    <div>
                                        <h3 className="font-semibold">{persona.title}</h3>
                                        <p className="text-sm text-gray-500">{persona.subtitle}</p>
                                    </div>
                                    {isSelected && (
                                        <span className="ml-auto text-purple-400 text-xl">✓</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    {persona.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {selected.length === 0
                            ? "Select at least one round"
                            : `${selected.length} round${selected.length > 1 ? "s" : ""} selected`}
                    </p>
                    <button
                        onClick={startInterview}
                        disabled={selected.length === 0 || isStarting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all cursor-pointer"
                    >
                        {isStarting ? "Starting..." : "Begin Interview →"}
                    </button>
                </div>
            </div>
        </main>
    );
}
