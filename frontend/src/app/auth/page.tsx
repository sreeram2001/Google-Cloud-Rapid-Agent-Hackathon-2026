"use client";
import { API_URL } from "@/lib/config";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
            const body = isLogin
                ? { email, password }
                : { name, email, password };

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Something went wrong");
                return;
            }

            // Store user info in localStorage
            localStorage.setItem("user", JSON.stringify({ name: data.name, email: data.email }));
            router.push("/select");
        } catch {
            setError("Failed to connect to server. Make sure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center relative overflow-hidden mesh-gradient">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-spotify-green/5 rounded-full blur-[150px] animate-pulse-glow" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-spotify-green/3 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="text-center mb-8 animate-slide-up">
                    <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">
                        <span className="text-gradient">HireInt</span><span className="text-white">OS</span>
                    </h1>
                    <p className="text-spotify-muted text-sm mt-2">AI-Powered Interview Practice</p>
                </div>

                {/* Auth Card */}
                <div className="relative rounded-3xl overflow-hidden animate-slide-up stagger-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl" />
                    <div className="absolute inset-0 border border-white/10 rounded-3xl" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="relative p-8">
                        {/* Toggle */}
                        <div className="flex rounded-full bg-black/30 p-1 mb-8">
                            <button
                                onClick={() => { setIsLogin(true); setError(""); }}
                                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${isLogin
                                    ? "bg-spotify-green text-spotify-black"
                                    : "text-spotify-muted hover:text-white"
                                    }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => { setIsLogin(false); setError(""); }}
                                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${!isLogin
                                    ? "bg-spotify-green text-spotify-black"
                                    : "text-spotify-muted hover:text-white"
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label className="text-xs text-spotify-subtext font-medium mb-1.5 block">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                        required={!isLogin}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green/50 focus:ring-2 focus:ring-spotify-green/10 transition-all placeholder:text-spotify-muted"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-spotify-subtext font-medium mb-1.5 block">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green/50 focus:ring-2 focus:ring-spotify-green/10 transition-all placeholder:text-spotify-muted"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-spotify-subtext font-medium mb-1.5 block">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green/50 focus:ring-2 focus:ring-spotify-green/10 transition-all placeholder:text-spotify-muted"
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-spotify-green rounded-xl text-spotify-black font-bold text-sm hover:bg-spotify-green-light hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed glow-green mt-2"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {isLogin ? "Logging in..." : "Creating account..."}
                                    </span>
                                ) : (
                                    isLogin ? "Login" : "Create Account"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-spotify-muted mt-6 animate-slide-up stagger-2">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(""); }}
                        className="text-spotify-green hover:underline cursor-pointer"
                    >
                        {isLogin ? "Sign up" : "Login"}
                    </button>
                </p>
            </div>
        </main>
    );
}
