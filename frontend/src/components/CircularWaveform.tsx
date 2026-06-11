"use client";

import { useEffect, useRef } from "react";

interface CircularWaveformProps {
    isActive: boolean;
    color?: string; // "green" | "red" | "blue" | "purple"
    size?: number;
}

export default function CircularWaveform({ isActive, color = "green", size = 220 }: CircularWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number | null>(null);
    const barsRef = useRef<number[]>(Array(60).fill(0));

    const colorMap: Record<string, { bar: string; glow: string }> = {
        green: { bar: "#1DB954", glow: "rgba(29, 185, 84, 0.3)" },
        red: { bar: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" },
        blue: { bar: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" },
        purple: { bar: "#a855f7", glow: "rgba(168, 85, 247, 0.3)" },
        orange: { bar: "#f97316", glow: "rgba(249, 115, 22, 0.3)" },
    };

    const { bar: barColor, glow: glowColor } = colorMap[color] || colorMap.green;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const numBars = 60;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.35;
        const maxBarHeight = size * 0.12;
        const minBarHeight = size * 0.02;
        const barWidth = 3;

        const draw = () => {
            ctx.clearRect(0, 0, size, size);

            for (let i = 0; i < numBars; i++) {
                const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;

                // Animate bar heights
                if (isActive) {
                    const target = minBarHeight + Math.random() * maxBarHeight;
                    barsRef.current[i] += (target - barsRef.current[i]) * 0.3;
                } else {
                    barsRef.current[i] += (minBarHeight - barsRef.current[i]) * 0.1;
                }

                const barHeight = barsRef.current[i];

                const x1 = centerX + Math.cos(angle) * radius;
                const y1 = centerY + Math.sin(angle) * radius;
                const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius + barHeight);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = barColor;
                ctx.lineWidth = barWidth;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            // Inner glow when active
            if (isActive) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
                ctx.fillStyle = glowColor;
                ctx.fill();
            }

            animRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isActive, size, barColor, glowColor]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: size, height: size }}
            className="transition-opacity duration-300"
        />
    );
}
