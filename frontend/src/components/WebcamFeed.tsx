"use client";

import { useEffect, useRef, useState } from "react";

export default function WebcamFeed() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 160, height: 160, facingMode: "user" },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setActive(true);
            }
        } catch {
            setError(true);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
            setActive(false);
        }
    };

    useEffect(() => {
        // Auto-start camera
        startCamera();
        return () => stopCamera();
    }, []);

    if (error) {
        return (
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-xs text-spotify-muted">No cam</span>
            </div>
        );
    }

    return (
        <div className="relative group">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-28 h-28 rounded-2xl object-cover border-2 transition-all ${active ? "border-spotify-green/30 shadow-lg shadow-spotify-green/10" : "border-white/10"
                    }`}
            />
            {active && (
                <>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
                    <button
                        onClick={stopCamera}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        ✕
                    </button>
                </>
            )}
        </div>
    );
}
