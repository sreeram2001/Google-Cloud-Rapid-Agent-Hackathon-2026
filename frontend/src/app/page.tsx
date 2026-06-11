"use client";

import { useRouter } from "next/navigation";

const PERSONAS = [
    {
        title: "HR Agent",
        tag: "Behavioral",
        // SVG icon inline — chat bubbles representing conversation
        icon: (
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="28" height="20" rx="4" fill="#1DB954" fillOpacity="0.8" />
                <rect x="16" y="20" width="28" height="20" rx="4" fill="#1ED760" fillOpacity="0.6" />
                <circle cx="14" cy="18" r="2" fill="white" />
                <circle cx="18" cy="18" r="2" fill="white" />
                <circle cx="22" cy="18" r="2" fill="white" />
            </svg>
        ),
        accent: "from-emerald-500/30 to-teal-600/10",
        border: "border-emerald-500/20 hover:border-emerald-400/40",
        glow: "group-hover:shadow-emerald-500/10",
    },
    {
        title: "Manager Agent",
        tag: "Situational",
        // SVG icon — org chart / hierarchy
        icon: (
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                <rect x="16" y="4" width="16" height="12" rx="3" fill="#3b82f6" fillOpacity="0.8" />
                <rect x="4" y="28" width="14" height="12" rx="3" fill="#60a5fa" fillOpacity="0.6" />
                <rect x="30" y="28" width="14" height="12" rx="3" fill="#60a5fa" fillOpacity="0.6" />
                <path d="M24 16V22M24 22H11M24 22H37M11 22V28M37 22V28" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        accent: "from-blue-500/30 to-indigo-600/10",
        border: "border-blue-500/20 hover:border-blue-400/40",
        glow: "group-hover:shadow-blue-500/10",
    },
    {
        title: "Technical Agent",
        tag: "System Design",
        // SVG icon — system architecture / nodes
        icon: (
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="6" fill="#a855f7" fillOpacity="0.8" />
                <circle cx="10" cy="12" r="4" fill="#c084fc" fillOpacity="0.6" />
                <circle cx="38" cy="12" r="4" fill="#c084fc" fillOpacity="0.6" />
                <circle cx="10" cy="36" r="4" fill="#c084fc" fillOpacity="0.6" />
                <circle cx="38" cy="36" r="4" fill="#c084fc" fillOpacity="0.6" />
                <path d="M13 14L21 21M27 21L35 14M13 34L21 27M27 27L35 34" stroke="#d8b4fe" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        accent: "from-purple-500/30 to-pink-600/10",
        border: "border-purple-500/20 hover:border-purple-400/40",
        glow: "group-hover:shadow-purple-500/10",
    },
    {
        title: "Coding Agent",
        tag: "Live + Hints",
        // SVG icon — code brackets
        icon: (
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                <path d="M16 14L6 24L16 34" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <path d="M32 14L42 24L32 34" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                <path d="M28 8L20 40" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            </svg>
        ),
        accent: "from-orange-500/30 to-red-600/10",
        border: "border-orange-500/20 hover:border-orange-400/40",
        glow: "group-hover:shadow-orange-500/10",
    },
];

const FEATURES = [
    {
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="#1DB954" strokeWidth="2" opacity="0.3" />
                <circle cx="16" cy="16" r="7" stroke="#1DB954" strokeWidth="2" opacity="0.6" />
                <circle cx="16" cy="16" r="2.5" fill="#1DB954" />
                <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#1DB954" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </svg>
        ),
        title: "AI-Personalized",
        description: "Questions tailored from your resume & target role",
    },
    {
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="12" width="6" height="16" rx="2" fill="#60a5fa" fillOpacity="0.6" />
                <rect x="13" y="7" width="6" height="21" rx="2" fill="#3b82f6" fillOpacity="0.8" />
                <rect x="22" y="4" width="6" height="24" rx="2" fill="#2563eb" fillOpacity="0.9" />
                <circle cx="7" cy="9" r="2" fill="#93c5fd" fillOpacity="0.8" />
                <circle cx="16" cy="4" r="2" fill="#93c5fd" fillOpacity="0.8" />
                <circle cx="25" cy="2" r="1.5" fill="#93c5fd" fillOpacity="0.8" />
            </svg>
        ),
        title: "4 Expert Agents",
        description: "HR, Manager, Technical, and Coding interviewers",
    },
    {
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <path d="M16 4C16 4 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 4 16 4Z" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
                <path d="M16 8C16 8 12 12 12 17C12 19.2091 13.7909 21 16 21C18.2091 21 20 19.2091 20 17C20 12 16 8 16 8Z" fill="#fbbf24" fillOpacity="0.6" />
                <path d="M13 26V29M16 26V30M19 26V29" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        title: "Hints, Not Answers",
        description: "Coding agent guides you without revealing solutions",
    },
    {
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <rect x="3" y="3" width="26" height="26" rx="4" stroke="#a855f7" strokeWidth="1.5" opacity="0.4" />
                <rect x="7" y="14" width="4" height="11" rx="1" fill="#c084fc" fillOpacity="0.7" />
                <rect x="14" y="10" width="4" height="15" rx="1" fill="#a855f7" fillOpacity="0.8" />
                <rect x="21" y="7" width="4" height="18" rx="1" fill="#9333ea" fillOpacity="0.9" />
                <path d="M7 12L12 9L18 11L25 6" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            </svg>
        ),
        title: "Rubric Scorecard",
        description: "Multi-dimensional feedback after every round",
    },
];

export default function Home() {
    const router = useRouter();

    return (
        <main className="min-h-screen relative overflow-hidden mesh-gradient">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-spotify-green/5 rounded-full blur-[150px] animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-spotify-green/3 rounded-full blur-[120px]" />

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
                <div className="font-[family-name:var(--font-display)] text-xl font-bold">
                    <span className="text-gradient">HireInt</span><span className="text-white">OS</span>
                </div>
                <button
                    onClick={() => router.push("/auth")}
                    className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm"
                >
                    Get Started
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 text-center px-6 pt-16 pb-20 max-w-5xl mx-auto">
                <div className="animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                        <div className="w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
                        <span className="text-xs font-medium text-spotify-subtext tracking-wider uppercase">
                            AI-Powered Interview Practice
                        </span>
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-[family-name:var(--font-display)] tracking-tight leading-[0.9] animate-slide-up stagger-1">
                    <span className="text-white">Ace your next</span>
                    <br />
                    <span className="text-gradient">interview.</span>
                </h1>

                <p className="text-lg md:text-xl text-spotify-subtext mt-6 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-2">
                    Practice with AI interviewers that read your resume, adapt in real-time,
                    give progressive hints, and score you on a professional rubric.
                </p>

                <div className="flex items-center justify-center animate-slide-up stagger-3">
                    <button
                        onClick={() => router.push("/auth")}
                        className="px-10 py-4 bg-spotify-green rounded-full text-spotify-black text-lg font-bold hover:bg-spotify-green-light hover:scale-105 transition-all duration-300 cursor-pointer glow-green-strong"
                    >
                        Get Started
                    </button>
                </div>
            </section>

            {/* Persona Cards — Product Style with Cartoon Avatars */}
            <section className="relative z-10 px-6 pb-16 max-w-5xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 animate-slide-up stagger-4">
                    {PERSONAS.map((persona, i) => (
                        <div
                            key={persona.title}
                            onClick={() => router.push("/select")}
                            className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl ${persona.glow}`}
                        >
                            {/* Glass card */}
                            <div className={`relative border ${persona.border} rounded-3xl bg-gradient-to-b ${persona.accent} backdrop-blur-xl transition-all duration-500`}>
                                {/* Top shine / mirror reflection */}
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent rounded-t-3xl" />

                                {/* Icon */}
                                <div className="flex justify-center pt-8 pb-3">
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-500">
                                        {persona.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-4 pb-5 text-center">
                                    <h3 className="font-bold text-white text-sm font-[family-name:var(--font-display)]">
                                        {persona.title}
                                    </h3>
                                    <span className="text-[11px] text-spotify-muted mt-1 inline-block px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                        {persona.tag}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FEATURES.map((feature, i) => (
                        <div
                            key={feature.title}
                            className="relative rounded-2xl overflow-hidden animate-slide-up group hover:scale-[1.02] transition-transform duration-300"
                            style={{ animationDelay: `${0.6 + i * 0.1}s`, opacity: 0 }}
                        >
                            {/* Glass background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl" />
                            <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-white/15 transition-colors" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                            <div className="relative p-5">
                                <div className="mb-3">{feature.icon}</div>
                                <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
                                <p className="text-xs text-spotify-muted leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


        </main>
    );
}
