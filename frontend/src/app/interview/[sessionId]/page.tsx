"use client";
import { API_URL } from "@/lib/config";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import CircularWaveform from "@/components/CircularWaveform";
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
    const [sessionTime, setSessionTime] = useState(0);
    const [proctoringWarnings, setProctoringWarnings] = useState(0);

    // Voice
    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
    const { startListening, stopListening, isListening, transcript, resetTranscript } = useSpeechToText();
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => setSessionTime((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // Cleanup: stop audio/mic when navigating away
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Also stop on any route change via beforeunload
    useEffect(() => {
        const handleBeforeUnload = () => {
            window.speechSynthesis.cancel();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.speechSynthesis.cancel();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

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
            const res = await fetch(`${API_URL}/api/interview/chat`, {
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
            if (voiceEnabled) speak(data.reply, () => { if (voiceEnabled) startListening(); });
        } catch (error) {
            console.error("Failed to init session:", error);
            setMessages([
                { role: "agent", content: "Failed to connect to the server. Please try again." },
            ]);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        if (isListening) stopListening();
        stopSpeaking();

        const userMessage = input.trim();
        setInput("");
        resetTranscript();
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/interview/chat`, {
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
            if (voiceEnabled) speak(data.reply, () => { if (voiceEnabled) startListening(); });
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
            await fetch(`${API_URL}/api/interview/submit-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, code, language: "python" }),
            });

            const res = await fetch(`${API_URL}/api/interview/chat`, {
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
            if (voiceEnabled) speak(data.reply, () => { if (voiceEnabled) startListening(); });
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
            const res = await fetch(`${API_URL}/api/interview/chat`, {
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
            if (voiceEnabled) speak(data.reply, () => { if (voiceEnabled) startListening(); });
        } catch (error) {
            console.error("Failed to get hint:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const finishRound = async () => {
        stopSpeaking();
        if (isListening) stopListening();
        setIsLoading(true);

        try {
            // Save proctoring data
            if (proctoringWarnings > 0) {
                await fetch(`${API_URL}/api/dashboard/save-proctoring?session_id=${sessionId}&warning_count=${proctoringWarnings}&round_type=${currentRound}`, {
                    method: "POST",
                });
            }

            // Tell the agent to wrap up and save evaluation
            const res = await fetch(`${API_URL}/api/interview/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: "The round is now ending. Please wrap up, provide brief feedback, and save your evaluation to MongoDB immediately.",
                    code: showEditor ? code : undefined,
                }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
            if (voiceEnabled) speak(data.reply);
        } catch (error) {
            console.error("Failed to finish round:", error);
        } finally {
            setIsLoading(false);
            setRoundComplete(true);
        }
    };

    const goToNextRound = async () => {
        setIsLoading(true);
        stopSpeaking();
        try {
            const res = await fetch(`${API_URL}/api/interview/next-round?session_id=${sessionId}`, {
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

                const chatRes = await fetch(`${API_URL}/api/interview/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: sessionId, message: "Hello, I'm ready for the next round." }),
                });
                const chatData = await chatRes.json();
                setCurrentRound(chatData.round_type);
                setShowEditor(chatData.round_type === "coding");
                setMessages([{ role: "agent", content: chatData.reply }]);
                if (voiceEnabled) speak(chatData.reply, () => { if (voiceEnabled) startListening(); });
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

    const roundConfig: Record<string, { label: string; color: string; waveColor: string; title: string }> = {
        hr: { label: "🤝 HR Round", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", waveColor: "green", title: "HR Interviewer" },
        manager: { label: "📋 Manager Round", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", waveColor: "blue", title: "Hiring Manager" },
        technical: { label: "🧠 Technical Round", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", waveColor: "purple", title: "Technical Interviewer" },
        coding: { label: "💻 Coding Round", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", waveColor: "orange", title: "Coding Interviewer" },
        loading: { label: "⏳ Connecting...", color: "bg-white/5 text-spotify-muted border-white/10", waveColor: "green", title: "Connecting..." },
    };

    const currentConfig = roundConfig[currentRound] || roundConfig.loading;
    const isVoiceRound = currentRound !== "coding" && !showEditor;

    // --- VOICE-FIRST UI for non-coding rounds ---
    if (isVoiceRound) {
        return (
            <main className="h-screen flex flex-col bg-spotify-black">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 glass border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold font-[family-name:var(--font-display)] cursor-pointer" onClick={() => router.push("/")}>
                            <span className="text-gradient">HireInt</span><span className="text-white">OS</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-spotify-muted font-mono">{formatTime(sessionTime)}</span>
                        <span className={`text-xs px-3 py-1.5 rounded-full border ${currentConfig.color}`}>
                            {currentConfig.label}
                        </span>
                        <button
                            onClick={() => { setVoiceEnabled(!voiceEnabled); if (isSpeaking) stopSpeaking(); }}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${voiceEnabled ? "border-spotify-green/30 text-spotify-green bg-spotify-green/5" : "border-white/10 text-spotify-muted"}`}
                        >
                            {voiceEnabled ? "🔊" : "🔇"}
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {!roundComplete && !allComplete && currentRound !== "loading" && (
                            <button
                                onClick={finishRound}
                                className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            >
                                End Round
                            </button>
                        )}
                        <button
                            onClick={() => router.push(`/scorecard/${sessionId}`)}
                            className="text-xs text-spotify-muted hover:text-spotify-green transition-colors cursor-pointer"
                        >
                            Scorecard →
                        </button>
                    </div>
                </header>

                {/* Main voice UI */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Webcam - top right */}
                    <div className="absolute top-6 right-6">
                        <WebcamFeed onWarningChange={setProctoringWarnings} />
                    </div>

                    {/* Central waveform area */}
                    <div className="flex flex-col items-center gap-6">
                        {/* Circular Waveform */}
                        <div className="relative">
                            <CircularWaveform
                                isActive={isSpeaking || isListening}
                                color={isSpeaking ? currentConfig.waveColor : isListening ? "red" : "green"}
                                size={240}
                            />
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                {isLoading ? (
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-spotify-green/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                ) : (
                                    <span className="text-xs text-spotify-muted font-medium">
                                        {isSpeaking ? "🎙️" : isListening ? "👂" : "💬"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Agent name / status */}
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-display)]">
                                {currentConfig.title}
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-spotify-green animate-pulse" : isListening ? "bg-red-500 animate-pulse" : isLoading ? "bg-yellow-400 animate-pulse" : "bg-white/20"}`} />
                                <span className="text-sm text-spotify-muted">
                                    {isSpeaking ? "Speaking..." : isListening ? "Listening..." : isLoading ? "Thinking..." : "Ready"}
                                </span>
                            </div>
                        </div>

                        {/* Last message preview */}
                        {messages.length > 0 && (
                            <div className="max-w-lg max-h-40 overflow-y-auto text-center px-6">
                                <p className="text-sm text-spotify-subtext leading-relaxed">
                                    {messages[messages.length - 1].content}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom controls */}
                    {!roundComplete && !allComplete && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full max-w-lg px-6">
                            {/* Mic + Send row */}
                            <div className="flex items-center gap-4 w-full">
                                {/* Big mic button */}
                                <button
                                    onClick={toggleMic}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${isListening
                                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
                                        : "bg-white/10 text-spotify-muted hover:bg-white/20 hover:text-white border border-white/10"
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                    </svg>
                                </button>

                                {/* Text input */}
                                <div className="flex-1 flex gap-2 glass-strong rounded-2xl p-2">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isListening ? "Listening..." : "Type or speak..."}
                                        className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none placeholder:text-spotify-muted"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={isLoading || !input.trim()}
                                        className="px-5 py-2 bg-spotify-green rounded-xl text-spotify-black text-sm font-bold disabled:opacity-30 hover:bg-spotify-green-light transition-all cursor-pointer"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Round complete overlay */}
                    {(roundComplete || allComplete) && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                            <div className="glass-strong rounded-2xl p-6 text-center animate-slide-up">
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
                </div>
            </main>
        );
    }

    // --- CODING ROUND UI (chat + editor) ---
    return (
        <main className="h-screen flex flex-col bg-spotify-black">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 glass border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold font-[family-name:var(--font-display)] cursor-pointer" onClick={() => router.push("/")}>
                        <span className="text-gradient">HireInt</span><span className="text-white">OS</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-spotify-muted font-mono">{formatTime(sessionTime)}</span>
                    <span className={`text-xs px-3 py-1.5 rounded-full border ${currentConfig.color}`}>
                        {currentConfig.label}
                    </span>
                    <button
                        onClick={() => { setVoiceEnabled(!voiceEnabled); if (isSpeaking) stopSpeaking(); }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${voiceEnabled ? "border-spotify-green/30 text-spotify-green bg-spotify-green/5" : "border-white/10 text-spotify-muted"}`}
                    >
                        {voiceEnabled ? "🔊" : "🔇"}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {!roundComplete && !allComplete && (
                        <button
                            onClick={finishRound}
                            className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                            End Round
                        </button>
                    )}
                    <button
                        onClick={() => router.push(`/scorecard/${sessionId}`)}
                        className="text-xs text-spotify-muted hover:text-spotify-green transition-colors cursor-pointer"
                    >
                        Scorecard →
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat panel */}
                <div className="w-1/2 flex flex-col border-r border-white/5">
                    {/* Webcam + speaking indicator */}
                    <div className="flex items-center justify-between px-6 pt-4">
                        <div className="flex items-center gap-3">
                            {isSpeaking && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-spotify-green">
                                    <CircularWaveform isActive={true} color="green" size={24} />
                                    <span>Speaking...</span>
                                </div>
                            )}
                            {isListening && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-red-400">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span>Listening...</span>
                                </div>
                            )}
                        </div>
                        <WebcamFeed onWarningChange={setProctoringWarnings} />
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

                    {/* Next Round / Scorecard */}
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
                                        <p className="text-spotify-muted text-xs mb-4">Ready for the next?</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={goToNextRound} disabled={isLoading} className="px-6 py-2.5 bg-spotify-green rounded-full text-spotify-black text-sm font-bold hover:bg-spotify-green-light hover:scale-105 transition-all cursor-pointer glow-green disabled:opacity-40">
                                                {isLoading ? "Loading..." : "Next Round →"}
                                            </button>
                                            <button onClick={() => router.push(`/scorecard/${sessionId}`)} className="px-6 py-2.5 rounded-full text-sm font-medium text-spotify-subtext border border-white/10 hover:border-white/20 hover:text-white transition-all cursor-pointer">
                                                End & View Scorecard
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    {!roundComplete && !allComplete && (
                        <div className="p-4 border-t border-white/5">
                            <div className="flex gap-3 glass-strong rounded-2xl p-2">
                                <button
                                    onClick={toggleMic}
                                    className={`self-end p-2.5 rounded-xl transition-all cursor-pointer ${isListening
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-white/5 text-spotify-muted hover:text-white hover:bg-white/10 border border-white/5"
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                    </svg>
                                </button>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isListening ? "Listening..." : "Type or speak..."}
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

                {/* Code editor */}
                <div className="w-1/2 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 glass">
                        <span className="text-sm text-spotify-subtext font-medium">Solution Editor</span>
                        <div className="flex items-center gap-2">
                            {!roundComplete && (
                                <button onClick={requestHint} disabled={isLoading} className="px-4 py-2 rounded-full text-xs font-medium border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5">
                                    💡 Hint
                                </button>
                            )}
                            <button onClick={submitCode} disabled={isLoading || roundComplete} className="px-5 py-2 bg-spotify-green rounded-full text-spotify-black text-xs font-bold hover:bg-spotify-green-light transition-all disabled:opacity-30 cursor-pointer glow-green">
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
            </div>
        </main>
    );
}
