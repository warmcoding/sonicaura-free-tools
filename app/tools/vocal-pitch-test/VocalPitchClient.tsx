'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

// Vocal Warm-up Reference Pitches (low to high, covering standard vocal ranges)
const VOCAL_REFERENCE_PITCHES = [
    { name: 'C3', freq: 130.81, label: 'Low Chest Voice (C3)' },
    { name: 'G3', freq: 196.00, label: 'Low Mid Range (G3)' },
    { name: 'C4', freq: 261.63, label: 'Middle C (C4)' },
    { name: 'G4', freq: 392.00, label: 'Passaggio / High Mid (G4)' },
    { name: 'C5', freq: 523.25, label: 'High Head Voice (C5)' },
    { name: 'E5', freq: 659.25, label: 'High Soprano (E5)' },
];

export default function VocalPitchClient() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [currentNote, setCurrentNote] = useState<string>('--');
    const [currentPitch, setCurrentPitch] = useState<number>(0);
    const [centsOff, setCentsOff] = useState<number>(0); // Deviation in cents

    // ---- Vocal-specific evaluation metrics ----
    const [lowestPitch, setLowestPitch] = useState<{ note: string; freq: number } | null>(null);
    const [highestPitch, setHighestPitch] = useState<{ note: string; freq: number } | null>(null);
    const [vocalScore, setVocalScore] = useState<number>(100);
    const [scoreHistory, setScoreHistory] = useState<number[]>([]);
    const [hearMyself, setHearMyself] = useState(false); // Live headphone-monitor toggle

    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    // Pitch smoothing queue (median filter that removes momentary noise and octave jumps)
    const pitchHistory = useRef<number[]>([]);

    useEffect(() => {
        return () => {
            // Release audio and animation-frame resources when the component unmounts
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close();
            }
        };
    }, []);

    // Note / frequency conversion and cents calculation
    const getNoteAndCents = (frequency: number) => {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const midi = 69 + 12 * Math.log2(frequency / 440);
        const roundedMidi = Math.round(midi);
        const noteIndex = ((roundedMidi % 12) + 12) % 12;
        const octave = Math.floor(roundedMidi / 12) - 1;
        const noteName = `${noteNames[noteIndex]}${octave}`;

        // Exact frequency of the matching standard note
        const exactFreq = 440 * Math.pow(2, (roundedMidi - 69) / 12);
        const cents = Math.floor(1200 * Math.log2(frequency / exactFreq));

        return { noteName, cents, midiVal: roundedMidi };
    };

    // Smoothing filter: take the median over a window to reject momentary howls and low-frequency rumble
    const smoothPitch = (newPitch: number): number => {
        if (newPitch === -1) {
            pitchHistory.current = [];
            return -1;
        }
        pitchHistory.current.push(newPitch);
        if (pitchHistory.current.length > 5) {
            pitchHistory.current.shift();
        }
        // Sort and take the median
        const sorted = [...pitchHistory.current].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    };

    // Autocorrelation pitch detection
    const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
        const SIZE = buf.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / SIZE);

        // Noise gate raised to a moderate 0.015 to handle typical microphone floor noise
        if (rms < 0.015) return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        const sliceBuf = buf.slice(r1, r2);
        const c = new Array(sliceBuf.length).fill(0);
        for (let i = 0; i < sliceBuf.length; i++) {
            for (let j = 0; j < sliceBuf.length - i; j++) {
                c[i] += sliceBuf[j] * sliceBuf[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < sliceBuf.length; i++) {
            if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
        }
        let T0 = maxpos;
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        const freq = sampleRate / T0;
        // Detection window covers vocal harmonics and fundamentals, with the ceiling widened to 1200Hz to accommodate sopranos
        return (freq > 60 && freq < 1200) ? freq : -1;
    };

    // Play a reference pitch
    const playReferenceTone = async (freq: number) => {
        await Tone.start();
        const synth = new Tone.Synth().toDestination();
        // Shortened to 0.8s so the reference cue stays crisp and unobtrusive
        synth.triggerAttackRelease(freq, '0.8s');
    };

    const startTuner = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);

            // Build the headphone-monitor path (a Gain node controls the level)
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = hearMyself ? 0.3 : 0;
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNodeRef.current = gainNode;

            setIsListening(true);
            const buffer = new Float32Array(2048);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');

            // Data buffer for the time-series curve
            const rollingPitches: Array<{ cents: number; active: boolean }> = new Array(80).fill({ cents: 0, active: false });

            const updateTuner = () => {
                if (!analyser || !ctx || !canvas) return;
                analyser.getFloatTimeDomainData(buffer);

                const rawPitch = autoCorrelate(buffer, audioCtx.sampleRate);
                const pitch = smoothPitch(rawPitch);

                // Paint a minimal, tech-flavoured frosted panel background
                ctx.fillStyle = '#09090b';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Paint the perfectly centred 0-cent (In Tune) axis
                ctx.strokeStyle = '#10b98122';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();

                if (pitch !== -1) {
                    const roundedPitch = Math.round(pitch * 10) / 10;
                    setCurrentPitch(roundedPitch);
                    const { noteName, cents, midiVal } = getNoteAndCents(pitch);
                    setCurrentNote(noteName);
                    setCentsOff(cents);

                    // 1. Automatic lowest/highest range tracking (covers a modest to wide vocal range, A1-C7)
                    if (midiVal >= 33 && midiVal <= 96) {
                        setLowestPitch(prev => (!prev || midiVal < getNoteAndCents(prev.freq).midiVal) ? { note: noteName, freq: roundedPitch } : prev);
                        setHighestPitch(prev => (!prev || midiVal > getNoteAndCents(prev.freq).midiVal) ? { note: noteName, freq: roundedPitch } : prev);
                    }

                    // 2. Dynamic scoring (anything within 10 cents counts as dead-on; beyond 10 cents the score starts dropping linearly)
                    const diff = Math.abs(cents);
                    let stepScore = 100;
                    if (diff > 8) {
                        stepScore = Math.max(0, 100 - (diff - 8) * 2.2);
                    }
                    setScoreHistory(prev => {
                        const next = [...prev, stepScore];
                        if (next.length > 50) next.shift();
                        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
                        setVocalScore(avg);
                        return next;
                    });

                    // 3. Push the current pitch deviation onto the scrolling track
                    rollingPitches.push({ cents, active: true });
                } else {
                    setCurrentNote('--');
                    setCentsOff(0);
                    rollingPitches.push({ cents: 0, active: false });
                }

                // Keep the queue at a fixed length
                if (rollingPitches.length > 80) {
                    rollingPitches.shift();
                }

                // 4. Render the scrolling pitch waveform curve in real time
                const pointWidth = canvas.width / 80;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                for (let i = 0; i < rollingPitches.length - 1; i++) {
                    const p1 = rollingPitches[i];
                    const p2 = rollingPitches[i + 1];
                    if (!p1.active || !p2.active) continue;

                    const x1 = i * pointWidth;
                    // The vertical centre is the 0-cent reference: +50 cents sits above the axis, -50 cents below it
                    const y1 = canvas.height / 2 - (p1.cents / 50) * (canvas.height * 0.42);
                    const x2 = (i + 1) * pointWidth;
                    const y2 = canvas.height / 2 - (p2.cents / 50) * (canvas.height * 0.42);

                    const isMatch = Math.abs(p1.cents) <= 10;
                    ctx.strokeStyle = isMatch ? '#10b981' : '#3b82f6'; // Bright green within 10 cents, deep blue when slightly off
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }

                animationFrameIdRef.current = requestAnimationFrame(updateTuner);
            };

            updateTuner();
        } catch (err) {
            console.error("Microphone access failed:", err);
            alert("Please allow microphone access to start your vocal pitch test.");
        }
    };

    // Toggle the headphone monitor on and off
    const handleToggleHearMyself = () => {
        const nextState = !hearMyself;
        setHearMyself(nextState);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = nextState ? 0.35 : 0;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[650px]">
            {/* Top-level evaluation data panel */}
            <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-center flex flex-col justify-center">
                    <span className="text-[10px] text-zinc-500 tracking-wider block font-bold mb-1">REALTIME SCORE</span>
                    <span className="text-3xl font-black font-mono text-emerald-400">
                        {isListening ? `${vocalScore}` : '--'}
                    </span>
                    <span className="text-[8px] text-zinc-600 mt-1 uppercase tracking-wider">Overall Accuracy</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-center flex flex-col justify-center">
                    <span className="text-[10px] text-zinc-500 tracking-wider block font-bold mb-1">LOWEST NOTE</span>
                    <span className="text-xl font-bold font-mono text-cyan-400 truncate">
                        {lowestPitch ? `${lowestPitch.note}` : '--'}
                    </span>
                    <span className="text-[8px] text-zinc-600 mt-1">
                        {lowestPitch ? `${lowestPitch.freq}Hz` : 'Lowest Pitch Hit'}
                    </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-center flex flex-col justify-center">
                    <span className="text-[10px] text-zinc-500 tracking-wider block font-bold mb-1">HIGHEST NOTE</span>
                    <span className="text-xl font-bold font-mono text-indigo-400 truncate">
                        {highestPitch ? `${highestPitch.note}` : '--'}
                    </span>
                    <span className="text-[8px] text-zinc-600 mt-1">
                        {highestPitch ? `${highestPitch.freq}Hz` : 'Highest Pitch Hit'}
                    </span>
                </div>
            </div>

            {/* Main tuner dial panel */}
            <div className="relative w-full h-[230px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col items-center justify-between p-6 shadow-2xl">

                {/* Top readout: note and cents deviation */}
                <div className="flex justify-between items-center w-full z-20">
                    <div>
                        <span className="text-[10px] text-zinc-500 tracking-wider block font-semibold mb-0.5">CURRENT NOTE</span>
                        <span className={`text-4xl font-mono font-black ${Math.abs(centsOff) <= 10 && currentNote !== '--' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                            {currentNote}
                        </span>
                    </div>

                    <div className="text-center">
                        <span className="text-[10px] text-zinc-500 tracking-wider block font-semibold mb-0.5">CENTS OFF</span>
                        <span className={`text-xl font-mono font-extrabold ${centsOff > 0 ? 'text-blue-400' : centsOff < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {centsOff > 0 ? `+${centsOff}` : centsOff} ¢
                        </span>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] text-zinc-500 tracking-wider block font-semibold mb-0.5">FREQUENCY</span>
                        <span className="text-xl font-mono font-bold text-zinc-300">{currentPitch} Hz</span>
                    </div>
                </div>

                {/* Scrolling pitch trajectory canvas */}
                <div className="relative w-full h-[85px] flex items-center justify-center">
                    <canvas ref={canvasRef} width={580} height={85} className="w-full h-full rounded-lg" />
                    {!isListening && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-30 rounded-2xl">
                            <button
                                onClick={startTuner}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                            >
                                Start Vocal Test
                            </button>
                        </div>
                    )}
                </div>

                {/* Centre-alignment legend at the bottom */}
                <div className="w-full flex justify-between text-[10px] text-zinc-600 font-mono px-2">
                    <span>-50¢ (Flat ♭)</span>
                    <span className="text-emerald-500 font-bold">0¢ (In Tune)</span>
                    <span>+50¢ (Sharp ♯)</span>
                </div>
            </div>

            {/* Warm-up reference scale and tuning calibration */}
            <div className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400 font-semibold">Vocal Warm-up Reference (Click to play tone):</span>
                    {/* Headphone monitor */}
                    <button
                        onClick={handleToggleHearMyself}
                        className={`px-3 py-1 text-[11px] rounded-full border transition-all ${hearMyself
                            ? 'bg-indigo-600/20 border-indigo-400 text-indigo-400 shadow-md font-bold'
                            : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        🎧 Headphone Monitor: {hearMyself ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {VOCAL_REFERENCE_PITCHES.map((str) => (
                        <button
                            key={str.name}
                            onClick={() => {
                                playReferenceTone(str.freq);
                            }}
                            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-zinc-800/30 border-zinc-700/60 hover:border-zinc-500 hover:bg-zinc-800/80 text-zinc-300 transition-all group"
                        >
                            <span className="text-sm font-black group-hover:text-indigo-400 transition-colors">{str.name}</span>
                            <span className="text-[10px] text-zinc-500 mt-1 font-mono">{str.freq}Hz</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}