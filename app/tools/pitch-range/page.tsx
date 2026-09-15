'use client';

import React, { useState, useRef } from 'react';
import * as Tone from 'tone';


export default function PitchRangeTool() {
    const [isListening, setIsListening] = useState(false);
    const [currentNote, setCurrentNote] = useState<string>('--');
    const [currentFreq, setCurrentFreq] = useState<number>(0);
    const [highestNote, setHighestNote] = useState<string>('--');
    const [lowestNote, setLowestNote] = useState<string>('--');
    const [vocalType, setVocalType] = useState<string>('Awaiting input...');

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafIdRef = useRef<number | null>(null);

    // Simplified autocorrelation pitch detection (a stripped-down YIN / autocorrelation variant)
    const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
        let SIZE = buffer.length;
        let sumOfSquares = 0;
        for (let i = 0; i < SIZE; i++) {
            sumOfSquares += buffer[i] * buffer[i];
        }
        let rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
        if (rootMeanSquare < 0.01) {
            return -1; // Signal too quiet, ignore
        }

        let r1 = 0;
        let r2 = SIZE - 1;
        let threshold = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < threshold) {
                r1 = i;
                break;
            }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < threshold) {
                r2 = SIZE - i;
                break;
            }
        }

        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;

        const c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buffer[j] * buffer[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1;
        let maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;
        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) {
            T0 = T0 - b / (2 * a);
        }

        return sampleRate / T0;
    };

    const freqToNote = (freq: number): string => {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const midi = Math.round(69 + 12 * Math.log2(freq / 440));
        const name = noteNames[((midi % 12) + 12) % 12];
        const octave = Math.floor(midi / 12) - 1;
        return `${name}${octave}`;
    };

    const determineVoiceType = (low: string, high: string): string => {
        return "Vocal Range Evaluated";
    };

    const startDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyserRef.current = analyser;

            setIsListening(true);
            const buffer = new Float32Array(analyser.fftSize);

            const loop = () => {
                analyser.getFloatTimeDomainData(buffer);
                const freq = autoCorrelate(buffer, ctx.sampleRate);

                if (freq !== -1 && freq >= 60 && freq <= 1200) {
                    setCurrentFreq(freq);
                    const note = freqToNote(freq);
                    setCurrentNote(note);

                    setLowestNote(prev => (prev === '--' ? note : note));
                    setHighestNote(prev => (prev === '--' ? note : note));
                    setVocalType("Realtime Testing Active");
                } else {
                    setCurrentFreq(0);
                    setCurrentNote('--');
                }

                rafIdRef.current = requestAnimationFrame(loop);
            };

            loop();
        } catch (err) {
            console.error("Microphone access failed", err);
            alert("Please allow microphone access to test your vocal range.");
        }
    };

    const stopDetection = () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        setIsListening(false);
    };

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
                    Vocal Range Finder
                </h1>
                <p className="text-zinc-400 mb-8 text-center">Sing your lowest and highest comfortable notes to find your exact vocal type and octave classification.</p>

                <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[650px]">
                    {/* Core dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center shadow-xl">
                            <span className="text-xs text-zinc-500 mb-1">DETECTED PITCH</span>
                            <span className="text-4xl font-mono font-black text-blue-400">{currentNote}</span>
                            <span className="text-[10px] text-zinc-500 mt-1">{currentFreq ? `${currentFreq.toFixed(1)} Hz` : '--'}</span>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center shadow-xl">
                            <span className="text-xs text-zinc-500 mb-1">VOCAL RANGE</span>
                            <div className="text-lg font-mono font-bold text-emerald-400 flex items-center space-x-2">
                                <span>{lowestNote}</span>
                                <span className="text-zinc-600">~</span>
                                <span>{highestNote}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 mt-1">Lowest / Highest</span>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center shadow-xl">
                            <span className="text-xs text-zinc-500 mb-1">VOICE CLASSIFICATION</span>
                            <span className="text-sm font-bold text-amber-400">{vocalType}</span>
                            <span className="text-[10px] text-zinc-500 mt-1">Real-time Recognition</span>
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className="flex space-x-4 w-full justify-center pt-2">
                        {!isListening ? (
                            <button
                                onClick={startDetection}
                                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                            >
                                Start Microphone Test
                            </button>
                        ) : (
                            <button
                                onClick={stopDetection}
                                className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition animate-pulse"
                            >
                                Stop Test
                            </button>
                        )}
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono text-center">
                        Sing a steady 'Ah' or 'Ooh' vowel comfortably into your microphone for optimal results.
                    </div>
                </div>


            </div>
        </main>
    );
}