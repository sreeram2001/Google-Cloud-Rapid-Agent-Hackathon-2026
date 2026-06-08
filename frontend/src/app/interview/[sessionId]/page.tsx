"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
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
    const sessionId = params.sessionId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentRound, setCurrentRound] = useState<string>("loading");
    const [code, setCode] = useState("# Write your solution here\n");
    const [showEditor, setShowEditor] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch session info and start the first round
        initSession();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const initSession = async () => {
        try {
            // Send initial message to kick off the interview
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

            // Tell the agent the code was submitted
            const res = await fetch("http://localhost:8000/api/interview/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message:
                        "I've submitted my final solution. Please evaluate my code.",
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

    const roundLabel: Record<string, string> = {
        hr: "🤝 HR Round",
        manager: "📋 Manager Round",
        technical: "🧠 Technical Round",
        coding: "💻 Coding Round",
        loading: "⏳ Loading...",
    };

    return (
        <main className="h-screen flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/80">
                <h1 className="text-lg font-semibold">HireIntOS</h1>
                <span className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                    {roundLabel[currentRound] || currentRound}
                </span>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat panel */}
                <div
                    className={`flex flex-col ${showEditor ? "w-1/2 border-r border-gray-800" : "w-full max-w-3xl mx-auto"}`}
                >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-xl text-sm whitespace-pre-wrap ${msg.role === "user"
                                            ? "bg-blue-600/20 text-blue-100 border border-blue-800/50"
                                            : "bg-gray-800/60 text-gray-200 border border-gray-700/50"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-800/60 text-gray-400 p-4 rounded-xl text-sm border border-gray-700/50">
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your response..."
                                rows={2}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-500"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-purple-500 transition-colors cursor-pointer"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* Code editor panel (coding round only) */}
                {showEditor && (
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
                            <span className="text-sm text-gray-400">Solution Editor</span>
                            <button
                                onClick={submitCode}
                                disabled={isLoading}
                                className="px-4 py-1.5 bg-green-600 rounded-md text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                Submit Code
                            </button>
                        </div>
                        <div className="flex-1">
                            <MonacoEditor
                                height="100%"
                                defaultLanguage="python"
                                theme="vs-dark"
                                value={code}
                                onChange={(value) => setCode(value || "")}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    padding: { top: 16 },
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
