"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
});

interface Message {
    role: "user" | "agent";
    content: string;
}

export default function InterviewPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentRound, setCurrentRound] = useState<string>("loading");
    const [code, setCode] = useState("# Write your solution here\n");
    const [showEditor, setShowEditor] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        initSession();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const initSession = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/interview/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: "Hello, I'm ready to begin the interview.",
                }),
            });
            const data = await res.json();
            setCurrentRound(data.round_type);
            setShowEditor(data.round_type === "coding");
            setMessages([{ role: "agent", content: data.reply }]);
        } catch (error) {
            console.error("Failed to init session:", error);
            setMessages([
                {
                    role: "agent",
                    content: "Failed to connect to the server. Please try again.",
                },
            ]);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/interview/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMessage,
                    code: showEditor ? code : undefined,
                }),
            });
            const data = await res.json();
            setCurrentRound(data.round_type);
            setShowEditor(data.round_type === "coding");
            setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) => [
                ...prev,
                { role: "agent", content: "Error communicating with the server." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const submitCode = async () => {
        setIsLoading(true);
        try {
            await fetch("http://localhost:8000/api/interview/submit-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    code,
                    language: "python",
                }),
            });

            const res = await fetch("http://localhost:8000/api/interview/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: "I've submitted my final solution. Please evaluate my code.",
                    code,
                }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "user", content: "📤 Code submitted for evaluation" },
                { role: "agent", content: data.reply },
            ]);
        } catch (error) {
            console.error("Failed to submit code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const roundConfig: Record<string, { label: string; color: string }> = {
        hr: { label: "🤝 HR Round", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        manager: { label: "📋 Manager Round", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        technical: { label: "🧠 Technical Round", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
        coding: { label: "💻 Coding Round", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
        loading: { label: "⏳ Connecting...", color: "bg-white/5 text-spotify-muted border-white/10" },
    };

    const currentConfig = roundConfig[currentRound] || roundConfig.loading;

    return (
        <main className="h-screen flex flex-col bg-spotify-black">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 glass border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold font-[family-name:var(--font-display)]">
                        <span className="text-gradient">HireInt</span><span className="text-white">OS</span>
                    </h1>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full border ${currentConfig.color}`}>
                    {currentConfig.label}
                </span>
                <button
                    onClick={() => router.push(`/scorecard/${sessionId}`)}
                    className="text-xs text-spotify-muted hover:text-spotify-green transition-colors cursor-pointer"
                >
                    End & View Scorecard →
                </button>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat panel */}
                <div className={`flex flex-col ${showEditor ? "w-1/2 border-r border-white/5" : "w-full max-w-3xl mx-auto"}`}>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user"
                                            ? "bg-spotify-green/10 text-white border border-spotify-green/20 rounded-br-sm"
                                            : "glass-strong text-spotify-subtext rounded-bl-sm"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="glass-strong text-spotify-muted p-4 rounded-2xl rounded-bl-sm text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                        <span className="text-xs">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex gap-3 glass-strong rounded-2xl p-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your response..."
                                rows={2}
                                className="flex-1 bg-transparent px-4 py-2 text-sm resize-none focus:outline-none placeholder:text-spotify-muted"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="self-end px-5 py-2.5 bg-spotify-green rounded-xl text-spotify-black text-sm font-bold disabled:opacity-30 hover:bg-spotify-green-light transition-all cursor-pointer"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* Code editor panel (coding round only) */}
                {showEditor && (
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 glass">
                            <span className="text-sm text-spotify-subtext font-medium">Solution Editor</span>
                            <button
                                onClick={submitCode}
                                disabled={isLoading}
                                className="px-5 py-2 bg-spotify-green rounded-full text-spotify-black text-xs font-bold hover:bg-spotify-green-light transition-all disabled:opacity-30 cursor-pointer glow-green"
                            >
                                Submit Code
                            </button>
                        </div>
                        <div className="flex-1 bg-[#0d0d0d]">
                            <MonacoEditor
                                height="100%"
                                defaultLanguage="python"
                                theme="vs-dark"
                                value={code}
                                onChange={(value) => setCode(value || "")}
                                options={{
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    minimap: { enabled: false },
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    padding: { top: 16 },
                                    renderLineHighlight: "gutter",
                                    cursorBlinking: "smooth",
                                    smoothScrolling: true,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
