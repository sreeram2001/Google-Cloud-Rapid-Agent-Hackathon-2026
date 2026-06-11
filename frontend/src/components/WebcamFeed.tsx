"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useProctoring } from "@/hooks/useProctoring";

export default function WebcamFeed({ onWarningChange }: { onWarningChange?: (count: number) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState(false);
    const [videoReady, setVideoReady] = useState<HTMLVideoElement | null>(null);

    // Proctoring — eye tracking + distraction detection
    const { isLookingAway, warningCount, gazeDirection } = useProctoring(videoReady, active);

    // Notify parent of warning count changes
    useEffect(() => {
        if (onWarningChange) onWarningChange(warningCount);
    }, [warningCount, onWarningChange]);

    const startCamera = useCallback(async () => {
        if (streamRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 320, facingMode: "user" },
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setActive(true);
                setError(false);
                setVideoReady(videoRef.current);
            }
        } catch {
            setError(true);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setActive(false);
        setVideoReady(null);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            startCamera();
        }, 500);

        return () => {
            clearTimeout(timer);
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    if (error) {
        return (
            <button
                onClick={() => { setError(false); startCamera(); }}
                className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:border-spotify-green/30 transition-all"
            >
                <span className="text-xs text-spotify-muted">Enable cam</span>
            </button>
        );
    }

    return (
        <div className="relative group">
            {/* Warning overlay when looking away */}
            {isLookingAway && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 animate-slide-up">
                    <div className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 backdrop-blur-sm whitespace-nowrap">
                        <span className="text-xs text-red-400 font-medium">
                            ⚠️ Eyes on screen!
                        </span>
                    </div>
                </div>
            )}

            {/* Video feed */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-28 h-28 rounded-2xl object-cover border-2 transition-all scale-x-[-1] ${isLookingAway
                    ? "border-red-500/70 shadow-lg shadow-red-500/20"
                    : active
                        ? "border-spotify-green/30 shadow-lg shadow-spotify-green/10"
                        : "border-white/10"
                    }`}
            />

            {/* Status indicators */}
            {active && (
                <>
                    {/* Gaze direction indicator */}
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-colors ${isLookingAway ? "bg-red-500 animate-pulse" : "bg-spotify-green animate-pulse"
                        }`} />

                    {/* Warning count badge */}
                    {warningCount > 0 && (
                        <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow-lg">
                            {warningCount}
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={stopCamera}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        ✕
                    </button>
                </>
            )}

            {!active && !error && (
                <button
                    onClick={startCamera}
                    className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center cursor-pointer"
                >
                    <span className="text-xs text-white">Start cam</span>
                </button>
            )}
        </div>
    );
}
