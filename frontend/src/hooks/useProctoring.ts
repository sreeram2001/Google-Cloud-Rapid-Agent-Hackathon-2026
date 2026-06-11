"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ProctoringState {
    isLookingAway: boolean;
    warningCount: number;
    lastWarningTime: number;
    gazeDirection: "center" | "left" | "right" | "up" | "down";
}

// Eye landmark indices from MediaPipe Face Mesh (468 landmarks)
// Left eye: iris center ~468, Left eye corners: 33, 133
// Right eye: iris center ~473, Right eye corners: 362, 263
const LEFT_EYE_LEFT = 33;
const LEFT_EYE_RIGHT = 133;
const LEFT_IRIS_CENTER = 468;
const RIGHT_EYE_LEFT = 362;
const RIGHT_EYE_RIGHT = 263;
const RIGHT_IRIS_CENTER = 473;

// Nose tip for head pose
const NOSE_TIP = 1;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

export function useProctoring(videoElement: HTMLVideoElement | null, enabled: boolean = true) {
    const [state, setState] = useState<ProctoringState>({
        isLookingAway: false,
        warningCount: 0,
        lastWarningTime: 0,
        gazeDirection: "center",
    });

    const faceMeshRef = useRef<any>(null);
    const animFrameRef = useRef<number | null>(null);
    const lookAwayStartRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const warningCountRef = useRef(0);

    // Threshold: how long they can look away before warning (ms)
    const LOOK_AWAY_THRESHOLD = 2000;
    // Cooldown between beeps (ms)
    const BEEP_COOLDOWN = 3000;

    const playBeep = useCallback(() => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } catch {
            // Audio context might be blocked
        }
    }, []);

    const analyzeGaze = useCallback((landmarks: any[]) => {
        if (!landmarks || landmarks.length < 474) return "center";

        // Get iris positions relative to eye corners
        const leftIris = landmarks[LEFT_IRIS_CENTER];
        const leftEyeL = landmarks[LEFT_EYE_LEFT];
        const leftEyeR = landmarks[LEFT_EYE_RIGHT];

        const rightIris = landmarks[RIGHT_IRIS_CENTER];
        const rightEyeL = landmarks[RIGHT_EYE_LEFT];
        const rightEyeR = landmarks[RIGHT_EYE_RIGHT];

        // Calculate horizontal gaze ratio (0 = looking left, 1 = looking right)
        const leftEyeWidth = leftEyeR.x - leftEyeL.x;
        const leftIrisRatio = (leftIris.x - leftEyeL.x) / leftEyeWidth;

        const rightEyeWidth = rightEyeR.x - rightEyeL.x;
        const rightIrisRatio = (rightIris.x - rightEyeL.x) / rightEyeWidth;

        const avgHorizontalRatio = (leftIrisRatio + rightIrisRatio) / 2;

        // Head pose estimation using nose and face landmarks
        const noseTip = landmarks[NOSE_TIP];
        const leftCheek = landmarks[LEFT_CHEEK];
        const rightCheek = landmarks[RIGHT_CHEEK];
        const forehead = landmarks[FOREHEAD];
        const chin = landmarks[CHIN];

        const faceWidth = rightCheek.x - leftCheek.x;
        const noseCenterRatio = (noseTip.x - leftCheek.x) / faceWidth;

        // Combine iris gaze + head pose for better accuracy
        // Looking left: iris ratio < 0.35 OR head turned right (nose ratio > 0.6)
        // Looking right: iris ratio > 0.65 OR head turned left (nose ratio < 0.4)
        if (avgHorizontalRatio < 0.35 || noseCenterRatio > 0.62) return "left";
        if (avgHorizontalRatio > 0.65 || noseCenterRatio < 0.38) return "right";

        // Vertical: check if looking down (common when reading phone/notes)
        const faceHeight = chin.y - forehead.y;
        const noseVerticalRatio = (noseTip.y - forehead.y) / faceHeight;
        if (noseVerticalRatio > 0.7) return "down";

        return "center";
    }, []);

    useEffect(() => {
        if (!enabled || !videoElement) return;

        let active = true;

        const initFaceMesh = async () => {
            try {
                // Load MediaPipe Face Mesh via CDN script (npm package has bundling issues with Next.js)
                await new Promise<void>((resolve, reject) => {
                    if ((window as any).FaceMesh) { resolve(); return; }
                    const script = document.createElement("script");
                    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
                    script.crossOrigin = "anonymous";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Failed to load FaceMesh script"));
                    document.head.appendChild(script);
                });

                const FaceMeshClass = (window as any).FaceMesh;
                if (!FaceMeshClass) throw new Error("FaceMesh not available on window");

                const faceMesh = new FaceMeshClass({
                    locateFile: (file: string) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true, // Needed for iris landmarks
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults((results: any) => {
                    if (!active) return;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const landmarks = results.multiFaceLandmarks[0];
                        const direction = analyzeGaze(landmarks);

                        const now = Date.now();
                        const isAway = direction !== "center";

                        if (isAway) {
                            if (!lookAwayStartRef.current) {
                                lookAwayStartRef.current = now;
                            }

                            const duration = now - lookAwayStartRef.current;

                            if (duration > LOOK_AWAY_THRESHOLD) {
                                setState((prev) => {
                                    // Play beep if cooldown passed
                                    if (now - prev.lastWarningTime > BEEP_COOLDOWN) {
                                        playBeep();
                                        warningCountRef.current += 1;
                                        return {
                                            isLookingAway: true,
                                            warningCount: warningCountRef.current,
                                            lastWarningTime: now,
                                            gazeDirection: direction as any,
                                        };
                                    }
                                    return { ...prev, isLookingAway: true, gazeDirection: direction as any };
                                });
                            }
                        } else {
                            lookAwayStartRef.current = null;
                            setState((prev) => ({
                                ...prev,
                                isLookingAway: false,
                                gazeDirection: "center",
                            }));
                        }
                    }
                });

                faceMeshRef.current = faceMesh;

                // Process frames
                const processFrame = async () => {
                    if (!active || !videoElement || videoElement.readyState < 2) {
                        animFrameRef.current = requestAnimationFrame(processFrame);
                        return;
                    }
                    await faceMesh.send({ image: videoElement });
                    animFrameRef.current = requestAnimationFrame(processFrame);
                };

                processFrame();
            } catch (err) {
                console.error("Failed to initialize FaceMesh:", err);
            }
        };

        // Delay init to let camera start
        const timer = setTimeout(initFaceMesh, 1500);

        return () => {
            active = false;
            clearTimeout(timer);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (faceMeshRef.current) faceMeshRef.current.close();
        };
    }, [enabled, videoElement, analyzeGaze, playBeep]);

    return state;
}
