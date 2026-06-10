"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import VoiceWaveform from "@/components/VoiceWaveform";
import WebcamFeed from "@/components/WebcamFeed";
import { useTextToSpeech, useSpeechToText } from "@/hooks/useSpeech";

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
    const [roundComplete, setRoundComplete] = useState(false);
    const [allComplete, setAllComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
    const { startListening, stopListening, isListening, transcript, resetTranscript } = useSpeechToText();
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    // Sync transcript to input
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

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
            if (data.is_complete) setAllComplete(true);
            setMessages([{ role: "agent", content: data.reply }]);
            if (voiceEnabled) speak(data.reply);
        } catch (error) {
            console.error("Failed to init session:", error);
            setMessages([
                { role: "agent", content: "Failed to connect to the server. Please try again." },
            ]);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        // Stop listening if active
        if (isListening) stopListening();
        stopSpeaking();

        const userMessage = input.trim();
        setInput("");
        resetTranscript();
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
            if (data.is_complete) setAllComplete(true);
            setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
            if (voiceEnabled) speak(data.reply);
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
        stopSpeaking();
        try {
            await fetch("http://localhost:8000/api/interview/submit-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, code, language: "python" }),
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
            if (voiceEnabled) speak(data.reply);
            setRoundComplete(true);
        } catch (error) {
            console.error("Failed to submit code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const requestHint = async () => {
        if (isLoading) return;
        stopSpeaking();
        setMessages((prev) => [...prev, { role: "user", content: "💡 Requesting a hint..." }]);
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/interview/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: "I'm stuck. Can you give me a hint without giving away the answer?",
                    code: code,
                }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
            if (voiceEnabled) speak(data.reply);
        } catch (error) {
            console.error("Failed to get hint:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const finishRound = () => {
        stopSpeaking();
        setRoundComplete(true);
    };

    const goToNextRound = async () => {
        setIsLoading(true);
        stopSpeaking();
        try {
            const res = await fetch(`http://localhost:8000/api/interview/next-round?session_id=${sessionId}`, {
                method: "POST",
            });
            const data = await res.json();

            if (data.status === "all_rounds_complete") {
                setAllComplete(true);
                const msg = "🎉 All rounds completed! Let's check your scorecard.";
                setMessages((prev) => [...prev, { role: "agent", content: msg }]);
                if (voiceEnabled) speak("All rounds completed! Let's check your scorecard.");
            } else {
                setRoundComplete(false);
                setMessages([]);
                setCode("# Write your solution here\n");

                const chatRes = await fetch("http://localhost:8000/api/interview/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: sessionId, message: "Hello, I'm ready for the next round." }),
                });
                const chatData = await chatRes.json();
                setCurrentRound(chatData.round_type);
                setShowEditor(chatData.round_type === "coding");
                setMessages([{ role: "agent", content: chatData.reply }]);
                if (voiceEnabled) speak(chatData.reply);
            }
        } catch (error) {
            console.error("Failed to advance round:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMic = () => {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            startListening();
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
                <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1.5 rounded-full border ${currentConfig.color}`}>
                        {currentConfig.label}
                    </span>
                    {/* Voice toggle */}
                    <button
                        onClick={() => { setVoiceEnabled(!voiceEnabled); if (isSpeaking) stopSpeaking(); }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${voiceEnabled ? "border-spotify-green/30 text-spotify-green bg-spotify-green/5" : "border-white/10 text-spotify-muted"}`}
                        title={voiceEnabled ? "Voice ON" : "Voice OFF"}
                    >
                        {voiceEnabled ? "🔊" : "🔇"}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {!roundComplete && !allComplete && currentRound !== "loading" && (
                        <button
                            onClick={finishRound}
                            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-spotify-subtext hover:text-white hover:border-white/20 transition-all cursor-pointer"
                        >
                            Finish Round
                        </button>
                    )}
                    <button
                        onClick={() => router.push(`/scorecard/${sessionId}`)}
                        className="text-xs text-spotify-muted hover:text-spotify-green transition-colors cursor-pointer"
                    >
                        View Scorecard →
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat panel */}
                <div className={`flex flex-col ${showEditor ? "w-1/2 border-r border-white/5" : "w-full max-w-3xl mx-auto"}`}>
                    {/* Webcam + Agent speaking indicator */}
                    <div className="flex items-center justify-between px-6 pt-4">
                        <div className="flex items-center gap-3">
                            {isSpeaking && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-spotify-green">
                                    <VoiceWaveform isActive={isSpeaking} />
                                    <span>Agent speaking...</span>
                                </div>
                            )}
                        </div>
                        <WebcamFeed />
                    </div>

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

                    {/* Next Round / Scorecard transition */}
                    {(roundComplete || allComplete) && (
                        <div className="p-4 border-t border-white/5">
                            <div className="glass-strong rounded-2xl p-5 text-center animate-slide-up">
                                {allComplete ? (
                                    <>
                                        <p className="text-white font-semibold mb-3">🎉 All rounds completed!</p>
                                        <button
                                            onClick={() => router.push(`/scorecard/${sessionId}`)}
                                            className="px-6 py-2.5 bg-spotify-green rounded-full text-spotify-black text-sm font-bold hover:bg-spotify-green-light hover:scale-105 transition-all cursor-pointer glow-green"
                                        >
                                            View Scorecard
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-white font-semibold mb-1">Round Complete ✓</p>
                                        <p className="text-spotify-muted text-xs mb-4">Ready for the next interviewer?</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={goToNextRound}
                                                disabled={isLoading}
                                                className="px-6 py-2.5 bg-spotify-green rounded-full text-spotify-black text-sm font-bold hover:bg-spotify-green-light hover:scale-105 transition-all cursor-pointer glow-green disabled:opacity-40"
                                            >
                                                {isLoading ? "Loading..." : "Next Round →"}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/scorecard/${sessionId}`)}
                                                className="px-6 py-2.5 rounded-full text-sm font-medium text-spotify-subtext border border-white/10 hover:border-white/20 hover:text-white transition-all cursor-pointer"
                                            >
                                                End & View Scorecard
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input area (typing + mic) */}
                    {!roundComplete && !allComplete && (
                        <div className="p-4 border-t border-white/5">
                            {/* Listening indicator */}
                            {isListening && (
                                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full glass text-xs text-red-400 w-fit">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Listening... speak now
                                </div>
                            )}
                            <div className="flex gap-3 glass-strong rounded-2xl p-2">
                                {/* Mic button */}
                                <button
                                    onClick={toggleMic}
                                    className={`self-end p-2.5 rounded-xl transition-all cursor-pointer ${isListening
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-white/5 text-spotify-muted hover:text-white hover:bg-white/10 border border-white/5"
                                        }`}
                                    title={isListening ? "Stop listening" : "Start speaking"}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                    </svg>
                                </button>

                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isListening ? "Listening..." : "Type or speak your response..."}
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
                    )}
                </div>

                {/* Code editor panel */}
                {showEditor && (
                    <div className="w-1/2 flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 glass">
                            <span className="text-sm text-spotify-subtext font-medium">Solution Editor</span>
                            <div className="flex items-center gap-2">
                                {/* Hint button */}
                                {!roundComplete && (
                                    <button
                                        onClick={requestHint}
                                        disabled={isLoading}
                                        className="px-4 py-2 rounded-full text-xs font-medium border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
                                    >
                                        💡 Hint
                                    </button>
                                )}
                                <button
                                    onClick={submitCode}
                                    disabled={isLoading || roundComplete}
                                    className="px-5 py-2 bg-spotify-green rounded-full text-spotify-black text-xs font-bold hover:bg-spotify-green-light transition-all disabled:opacity-30 cursor-pointer glow-green"
                                >
                                    Submit Code
                                </button>
                            </div>
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
                                    readOnly: roundComplete,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
