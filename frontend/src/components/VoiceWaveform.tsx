"use client";

export default function VoiceWaveform({ isActive }: { isActive: boolean }) {
    if (!isActive) return null;

    return (
        <div className="flex items-center gap-1 py-2">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="w-1 bg-spotify-green rounded-full animate-pulse"
                    style={{
                        height: `${12 + Math.random() * 16}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: `${0.4 + Math.random() * 0.4}s`,
                    }}
                />
            ))}
        </div>
    );
}
