"use client";

import { useEffect, useRef, useState } from "react";

export default function WebcamFeed() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
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
        return () => stopCamera();
    }, []);

    if (error) return null;

    return (
        <div className="relative">
            {!active ? (
                <button
                    onClick={startCamera}
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                    title="Turn on camera"
                >
                    <svg className="w-6 h-6 text-spotify-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </button>
            ) : (
                <div className="relative group">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-32 h-32 rounded-2xl object-cover border-2 border-spotify-green/30 shadow-lg shadow-spotify-green/10"
                    />
                    <button
                        onClick={stopCamera}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        ×
                    </button>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
                </div>
            )}
            <video ref={active ? undefined : videoRef} className="hidden" />
        </div>
    );
}
