'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';


export default function MetronomeClient() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState<number>(120);
    const [beatsPerBar, setBeatsPerBar] = useState<number>(4);
    const [currentBeat, setCurrentBeat] = useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const timerRef = useRef<number | null>(null);
    const nextNoteTimeRef = useRef<number>(0);
    const currentBeatRef = useRef<number>(0);
    const bpmRef = useRef<number>(bpm);
    const beatsPerBarRef = useRef<number>(beatsPerBar);

    // Keep refs in sync so the closures always read the latest state
    useEffect(() => { bpmRef.current = bpm; }, [bpm]);
    useEffect(() => { beatsPerBarRef.current = beatsPerBar; }, [beatsPerBar]);

    // Play the click sound for a beat
    const playClick = (isAccented: boolean) => {
        const synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();

        const freq = isAccented ? 1200 : 800;
        synth.triggerAttackRelease(freq, '32n');
    };

    // Beat scheduling loop
    useEffect(() => {
        let animationFrameId: number;

        const scheduler = () => {
            if (!isPlaying) return;

            const now = Tone.now();
            const secondsPerBeat = 60.0 / bpmRef.current;

            while (nextNoteTimeRef.current < now + 0.1) {
                const isAccented = currentBeatRef.current === 0;
                playClick(isAccented);
                setCurrentBeat(currentBeatRef.current + 1);

                nextNoteTimeRef.current += secondsPerBeat;
                currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerBarRef.current;
            }

            animationFrameId = requestAnimationFrame(scheduler);
        };

        if (isPlaying) {
            Tone.start();
            nextNoteTimeRef.current = Tone.now() + 0.05;
            currentBeatRef.current = 0;
            scheduler();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying]);

    // Canvas visual animation: a high-precision pendulum plus pulsing beat dots
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let angle = 0;

        const render = () => {
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height - 20;

            // Draw the beat indicator dots
            const radius = 12;
            const spacing = 40;
            const totalWidth = beatsPerBar * spacing;
            const startX = centerX - totalWidth / 2 + spacing / 2;

            for (let i = 0; i < beatsPerBar; i++) {
                const x = startX + i * spacing;
                const y = 40;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                if (isPlaying && currentBeat - 1 === i) {
                    ctx.fillStyle = i === 0 ? '#10b981' : '#3b82f6'; // First beat highlights green, the rest blue
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 15;
                } else {
                    ctx.fillStyle = '#27272a';
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
                ctx.shadowBlur = 0; // Reset the shadow

                // Beat number label
                ctx.fillStyle = '#71717a';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${i + 1}`, x, y + 4);
            }

            // Draw the moving pendulum
            if (isPlaying) {
                const speedFactor = bpm / 60;
                angle = Math.sin(Date.now() * 0.005 * speedFactor) * 0.6;
            } else {
                angle = 0;
            }

            const length = 90;
            const endX = centerX + length * Math.sin(angle);
            const endY = centerY - length * Math.cos(angle);

            ctx.strokeStyle = '#52525b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Rounded head at the tip of the pendulum
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            ctx.fill();

            animId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animId);
        };
    }, [isPlaying, currentBeat, beatsPerBar, bpm]);

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            {/*
              Skip link: targets the <h1> rather than <main> because <GlobalHeader> renders as
              the first child of <main> on every page — see app/page.tsx for the rationale.
            */}
            <a
                href="#main-content"
                className="fixed top-4 left-[-9999px] z-[60] whitespace-nowrap rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:left-4"
            >
                Skip to main content
            </a>

            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h1
                    id="main-content"
                    tabIndex={-1}
                    className="text-3xl font-bold mb-2 mt-2 text-center scroll-mt-24"
                >
                    Online Metronome
                </h1>
                <p className="text-zinc-400 mb-8 text-center">High-precision BPM tempo generator and interactive visual beat counter for daily practice.</p>

                <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[650px]">
                    {/* Metronome dial and visualisation area */}
                    <div className="relative w-full h-[220px] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-between p-6 shadow-2xl">

                        {/* BPM readout at the top */}
                        <div className="flex justify-between items-center w-full z-20">
                            <div>
                                <span className="text-[10px] text-zinc-500 tracking-wider block">TEMPO (BPM)</span>
                                <span className="text-3xl font-mono font-black text-blue-400">
                                    {bpm}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] text-zinc-500 tracking-wider block">TIME SIGNATURE</span>
                                <span className="text-xl font-mono font-bold text-emerald-400">
                                    {beatsPerBar}/4
                                </span>
                            </div>
                        </div>

                        {/* Animated canvas */}
                        <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none">
                            <canvas ref={canvasRef} width={580} height={150} className="w-full h-full" />
                        </div>

                        {/* Transport button at the bottom */}
                        <div className="z-20 w-full flex justify-center mt-auto">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`px-10 py-2.5 font-bold rounded-xl shadow-lg transition transform hover:scale-105 text-white ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
                                    }`}
                            >
                                {isPlaying ? 'Stop Beat' : 'Start Beat'}
                            </button>
                        </div>
                    </div>

                    {/* Fine-tuning panel */}
                    <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex flex-col space-y-4">
                        {/* BPM slider */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Speed Adjustment</span>
                                <span className="font-mono text-zinc-200">{bpm} BPM</span>
                            </div>
                            <input
                                type="range"
                                min="40"
                                max="240"
                                value={bpm}
                                onChange={(e) => setBpm(Number(e.target.value))}
                                className="w-full accent-blue-600 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                            />
                        </div>

                        {/* Time signature picker */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                            <span className="text-xs text-zinc-400">Beats Per Bar:</span>
                            <div className="flex space-x-2">
                                {[2, 3, 4, 6].map((beats) => (
                                    <button
                                        key={beats}
                                        onClick={() => setBeatsPerBar(beats)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${beatsPerBar === beats
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                            : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        {beats}/4
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </main>
    );
}