"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const onEndCallbackRef = useRef<(() => void) | null>(null);

    // Load voices on mount — macOS needs voiceschanged event
    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        // Force load voices
        window.speechSynthesis.getVoices();

        const handleVoicesChanged = () => {
            window.speechSynthesis.getVoices();
        };

        window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
        return () => {
            window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        };
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();
        onEndCallbackRef.current = onEnd || null;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Pick best available voice — prefer premium/natural voices on macOS
        const voices = window.speechSynthesis.getVoices();
        const preferredNames = [
            "Zoe (Premium)",       // macOS premium
            "Samantha (Premium)",  // macOS premium  
            "Karen (Premium)",     // macOS premium (Australian)
            "Daniel (Premium)",    // macOS premium (British)
            "Zoe",                 // macOS natural
            "Samantha",            // macOS natural female
            "Daniel",              // macOS natural male (British)
            "Karen",               // macOS natural female (Australian)
            "Moira",              // macOS natural female (Irish)
            "Tessa",              // macOS
            "Google UK English Female",
            "Google UK English Male",
            "Google US English",
            "Microsoft Zira",
            "Microsoft David",
        ];

        let selectedVoice = null;
        for (const name of preferredNames) {
            const found = voices.find((v) => v.name.includes(name));
            if (found) {
                selectedVoice = found;
                break;
            }
        }
        // Fallback: pick any English voice that isn't "compact" or "enhanced" (those are low quality)
        if (!selectedVoice) {
            selectedVoice = voices.find((v) => v.lang.startsWith("en") && !v.name.includes("compact")) ||
                voices.find((v) => v.lang.startsWith("en")) || null;
        }
        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEndCallbackRef.current) {
                onEndCallbackRef.current();
                onEndCallbackRef.current = null;
            }
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== "undefined") {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return { speak, stop, isSpeaking };
}

export function useSpeechToText() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<any>(null);

    const startListening = useCallback(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) return;

        // Stop previous if exists
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            let finalTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                finalTranscript += event.results[i][0].transcript;
            }
            setTranscript(finalTranscript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
            setIsListening(false);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript("");
    }, []);

    return { startListening, stopListening, isListening, transcript, resetTranscript };
}
