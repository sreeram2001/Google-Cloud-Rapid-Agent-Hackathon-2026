"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RoundType = "hr" | "manager" | "technical" | "coding";

interface PersonaOption {
    id: RoundType;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    accent: string;
    glowColor: string;
}

const PERSONAS: PersonaOption[] = [
    {
        id: "hr",
        title: "HR Agent",
        subtitle: "Behavioral & Cultural Fit",
        description: "Practice STAR-method behavioral questions tailored to your resume and target role.",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop&crop=face",
        accent: "from-emerald-600 to-teal-700",
        glowColor: "shadow-emerald-500/20",
    },
    {
        id: "manager",
        title: "Manager Agent",
        subtitle: "Situational & Leadership",
        description: "Navigate scenario-based questions about prioritization, conflict resolution, and ownership.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face",
        accent: "from-blue-600 to-indigo-700",
        glowColor: "shadow-blue-500/20",
    },
    {
        id: "technical",
        title: "Technical Agent",
        subtitle: "System Design & Concepts",
        description: "Discuss architecture and CS fundamentals relevant to your target role. Adapts to your level.",
        image: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=400&h=500&fit=crop&crop=face",
        accent: "from-purple-600 to-pink-700",
        glowColor: "shadow-purple-500/20",
    },
    {
        id: "coding",
        title: "Coding Agent",
        subtitle: "Live Coding with Hints",
        description: "Solve problems with an AI that gives hints — never answers. Just like the real thing.",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=500&fit=crop",
        accent: "from-orange-600 to-red-700",
        glowColor: "shadow-orange-500/20",
    },
];

export default function SelectPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<RoundType[]>([]);
    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [isStarting, setIsStarting] = useState(false);
    const [resumeFileName, setResumeFileName] = useState("");
    const [jdFileName, setJdFileName] = useState("");

    const toggle = (id: RoundType) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (text: string) => void,
        setFileName: (name: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        if (file.name.endsWith(".pdf")) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("http://localhost:8000/api/upload/parse-pdf", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (data.text) {
                    setter(data.text);
                } else {
                    alert(data.error || "Failed to parse PDF");
                }
            } catch {
                alert("Failed to upload PDF. Make sure the backend is running.");
            }
        } else {
            const text = await file.text();
            setter(text);
        }
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
        <main className="min-h-screen px-6 py-10 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 mesh-gradient" />
            <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-spotify-green/8 rounded-full blur-[150px] animate-pulse-glow" />
            <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-spotify-green/3 rounded-full blur-[200px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10 animate-slide-up">
                    <button
                        onClick={() => router.push("/")}
                        className="text-spotify-muted hover:text-spotify-green transition-colors text-sm mb-4 inline-flex items-center gap-1 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                        Pick Your <span className="text-gradient">Interviewers</span>
                    </h1>
                    <p className="text-spotify-subtext mt-3 text-lg">
                        Select one or more rounds. Upload your resume for personalized questions.
                    </p>
                </div>

                {/* Persona Cards — Glass Mirror Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 animate-slide-up stagger-1">
                    {PERSONAS.map((persona) => {
                        const isSelected = selected.includes(persona.id);
                        return (
                            <button
                                key={persona.id}
                                onClick={() => toggle(persona.id)}
                                className={`group relative rounded-3xl overflow-hidden text-left transition-all duration-500 cursor-pointer backdrop-blur-sm ${isSelected
                                        ? `ring-2 ring-spotify-green/70 scale-[1.03] shadow-2xl ${persona.glowColor}`
                                        : "hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40"
                                    }`}
                            >
                                {/* Image with mirror/glass overlay */}
                                <div className="relative h-52 overflow-hidden">
                                    <img
                                        src={persona.image}
                                        alt={persona.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {/* Color overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-t ${persona.accent} opacity-50 mix-blend-multiply`} />
                                    {/* Glass/mirror reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent" />
                                    {/* Bottom fade */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                    {/* Selected badge */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-spotify-green/90 backdrop-blur-md flex items-center justify-center shadow-lg shadow-spotify-green/30 animate-slide-up">
                                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Title on image */}
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className="font-bold text-white text-lg leading-tight drop-shadow-lg font-[family-name:var(--font-display)]">
                                            {persona.title}
                                        </h3>
                                        <p className="text-white/60 text-xs mt-0.5">{persona.subtitle}</p>
                                    </div>
                                </div>

                                {/* Card body — frosted glass */}
                                <div className={`p-4 backdrop-blur-xl transition-all duration-300 border-t border-white/5 ${isSelected
                                        ? "bg-spotify-green/5 border-t-spotify-green/20"
                                        : "bg-white/[0.02] group-hover:bg-white/[0.04]"
                                    }`}>
                                    <p className="text-xs text-spotify-subtext leading-relaxed line-clamp-2">
                                        {persona.description}
                                    </p>
                                    <div className="mt-3">
                                        <span className={`text-xs font-semibold tracking-wide ${isSelected ? "text-spotify-green" : "text-spotify-muted"}`}>
                                            {isSelected ? "✓ Selected" : "Click to select"}
                                        </span>
                                    </div>
                                </div>

                                {/* Outer glass border */}
                                <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none group-hover:border-white/20 transition-colors duration-300" />
                            </button>
                        );
                    })}
                </div>

                {/* Resume + JD Upload — Glass panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 animate-slide-up stagger-2">
                    <div className="relative rounded-2xl overflow-hidden">
                        {/* Mirror glass background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-2xl" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="relative p-6">
                            <label className="flex items-center gap-3 text-sm font-semibold text-white mb-4">
                                <span className="w-9 h-9 rounded-xl bg-spotify-green/10 border border-spotify-green/20 flex items-center justify-center text-base backdrop-blur-sm">📄</span>
                                Resume
                            </label>
                            <textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Paste your resume here or upload a PDF..."
                                rows={3}
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-spotify-green/40 focus:ring-2 focus:ring-spotify-green/10 focus:bg-black/30 transition-all placeholder:text-spotify-muted backdrop-blur-sm"
                            />
                            <div className="mt-3 flex items-center gap-3">
                                <label className="px-4 py-2 rounded-full text-xs font-medium text-spotify-subtext cursor-pointer hover:text-white transition-all bg-white/5 border border-white/10 hover:border-spotify-green/30 hover:bg-white/10 backdrop-blur-sm">
                                    Upload PDF
                                    <input
                                        type="file"
                                        accept=".pdf,.txt,.md"
                                        onChange={(e) => handleFileUpload(e, setResumeText, setResumeFileName)}
                                        className="hidden"
                                    />
                                </label>
                                {resumeFileName && (
                                    <span className="text-xs text-spotify-green flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-pulse" />
                                        {resumeFileName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden">
                        {/* Mirror glass background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-2xl" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="relative p-6">
                            <label className="flex items-center gap-3 text-sm font-semibold text-white mb-4">
                                <span className="w-9 h-9 rounded-xl bg-spotify-green/10 border border-spotify-green/20 flex items-center justify-center text-base backdrop-blur-sm">💼</span>
                                Job Description
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here or upload a PDF..."
                                rows={3}
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-spotify-green/40 focus:ring-2 focus:ring-spotify-green/10 focus:bg-black/30 transition-all placeholder:text-spotify-muted backdrop-blur-sm"
                            />
                            <div className="mt-3 flex items-center gap-3">
                                <label className="px-4 py-2 rounded-full text-xs font-medium text-spotify-subtext cursor-pointer hover:text-white transition-all bg-white/5 border border-white/10 hover:border-spotify-green/30 hover:bg-white/10 backdrop-blur-sm">
                                    Upload PDF
                                    <input
                                        type="file"
                                        accept=".pdf,.txt,.md"
                                        onChange={(e) => handleFileUpload(e, setJobDescription, setJdFileName)}
                                        className="hidden"
                                    />
                                </label>
                                {jdFileName && (
                                    <span className="text-xs text-spotify-green flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-pulse" />
                                        {jdFileName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer action bar — glass */}
                <div className="relative rounded-2xl overflow-hidden animate-slide-up stagger-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                    <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-spotify-green/30 to-transparent" />

                    <div className="relative flex items-center justify-between p-5">
                        <div>
                            <p className="text-sm text-white font-semibold">
                                {selected.length === 0
                                    ? "Select at least one interviewer to begin"
                                    : `${selected.length} round${selected.length > 1 ? "s" : ""} selected`}
                            </p>
                            <p className="text-xs text-spotify-muted mt-0.5">
                                {selected.length > 0 && selected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" → ")}
                            </p>
                        </div>
                        <button
                            onClick={startInterview}
                            disabled={selected.length === 0 || isStarting}
                            className="px-8 py-3 bg-spotify-green rounded-full text-spotify-black font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-spotify-green-light hover:scale-105 transition-all duration-300 cursor-pointer glow-green-strong"
                        >
                            {isStarting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Starting...
                                </span>
                            ) : (
                                "Begin Interview →"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
