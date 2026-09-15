'use client';

import React, { useState } from 'react';
import * as Tone from 'tone';
import GlobalHeader from '@/components/Header';
import StudioCTA from '@/components/StudioCTA';
import Comment from '@/components/Comment';
import ToolGuide from '@/components/ToolGuide';
import { PIANO_GUIDE } from '@/lib/tool-content';

// Defines the piano key data: the full multi-octave run from B2 to B7
const generatePianoKeys = () => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keys = [];

    // Octaves 2 through 7 (starts at B2, ends at B7)
    for (let octave = 2; octave <= 7; octave++) {
        for (let i = 0; i < noteNames.length; i++) {
            const name = noteNames[i];
            const note = `${name}${octave}`;

            // Trim the range: start at B2 (drop C2~A#2) and end at B7 (drop anything past it)
            if (octave === 2 && i < 11) continue; // B2 sits at index 11
            if (octave === 7 && i > 11) continue; // Stop at B7

            // Derive the standard frequency (A4 = 440Hz)
            const midi = (octave + 1) * 12 + i;
            const freq = 440 * Math.pow(2, (midi - 69) / 12);

            const type = name.includes('#') ? 'black' : 'white';
            keys.push({ note, type, freq });
        }
    }
    return keys;
};

const PIANO_KEYS = generatePianoKeys();

export default function PianoClient() {
    const [activeNote, setActiveNote] = useState<string | null>(null);

    // Trigger playback of a piano note
    const playNote = async (note: string, freq: number) => {
        await Tone.start();
        const synth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.8 }
        }).toDestination();

        synth.triggerAttackRelease(freq, '4n');
        setActiveNote(note);

        setTimeout(() => {
            setActiveNote((prev) => (prev === note ? null : prev));
        }, 200);
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
            <GlobalHeader type="tool" />
            <div className="max-w-5xl mx-auto flex flex-col items-center">
                <h1
                    id="main-content"
                    tabIndex={-1}
                    className="text-3xl font-bold mb-2 mt-2 text-center scroll-mt-24"
                >
                    Virtual Piano Keyboard
                </h1>
                <p className="text-zinc-400 mb-8 text-center">Play chords, verify pitches, and practice scales with full 61-key multi-octave acoustic tones.</p>

                <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[900px]">
                    {/* Virtual piano console */}
                    <div className="relative w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-between p-6 shadow-2xl">

                        {/* Status readout at the top */}
                        <div className="flex justify-between items-center w-full z-20 mb-6">
                            <div>
                                <span className="text-[10px] text-zinc-500 tracking-wider block">CURRENT NOTE</span>
                                <span className="text-3xl font-mono font-black text-emerald-400">
                                    {activeNote || '--'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-500 tracking-wider block">RANGE</span>
                                <span className="text-sm font-mono font-bold text-blue-400">B2 - B7 (Multi-Octave)</span>
                            </div>
                        </div>

                        {/* Horizontally scrollable keyboard container (allows a wide keyboard) */}
                        <div className="relative w-full overflow-x-auto pb-4 pt-2 flex justify-start scrollbar-thin scrollbar-thumb-zinc-800">
                            <div className="relative flex items-start h-[140px] bg-zinc-900 border border-zinc-800 rounded-xl p-2 select-none min-w-max">
                                {PIANO_KEYS.map((k, index) => {
                                    if (k.type === 'white') {
                                        return (
                                            <button
                                                key={k.note}
                                                onClick={() => playNote(k.note, k.freq)}
                                                className={`relative w-9 h-32 bg-zinc-100 hover:bg-zinc-200 active:bg-blue-500 text-zinc-900 rounded-b-lg border border-zinc-300 flex flex-col justify-end items-center pb-3 transition shadow-md ${activeNote === k.note ? '!bg-blue-600 !text-white' : ''
                                                    }`}
                                            >
                                                <span className="text-[9px] font-mono font-bold opacity-60">{k.note}</span>
                                            </button>
                                        );
                                    } else {
                                        // Black keys are absolutely positioned into the gaps between white keys
                                        return (
                                            <button
                                                key={k.note}
                                                onClick={() => playNote(k.note, k.freq)}
                                                className={`absolute z-10 w-6 h-18 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-b-md border border-zinc-700 flex flex-col justify-end items-center pb-2 transition shadow-lg ${activeNote === k.note ? '!bg-blue-500 !text-white' : ''
                                                    }`}
                                                style={{
                                                    left: `${getBlackKeyLeftPosition(index)}px`,
                                                }}
                                            >
                                                <span className="text-[8px] font-mono hidden xl:inline">{k.note}</span>
                                            </button>
                                        );
                                    }
                                })}
                            </div>
                        </div>

                        <div className="w-full text-center text-[10px] text-zinc-500 font-mono mt-2">
                            Scroll horizontally to explore B2 to B7 full multi-octave piano keys.
                        </div>
                    </div>
                </div>

                {/* How-to steps + FAQ: the copy and the HowTo / FAQPage structured data share one source */}
                <ToolGuide content={PIANO_GUIDE} />

                {/* Feedback form */}
                <Comment />

                {/* Bottom-of-page cross-sell */}
                <StudioCTA />
            </div>
        </main>
    );
}

// Helper: computes the exact left offset in pixels for a black key from its overall key index
function getBlackKeyLeftPosition(index: number): number {
    // Each white key is roughly 36px wide (w-9); accumulate over the white-key baseline grid to place black keys
    let whiteKeyCount = 0;
    for (let i = 0; i < index; i++) {
        if (PIANO_KEYS[i].type === 'white') {
            whiteKeyCount++;
        }
    }
    // Nudged slightly left so it overlaps the seam between two white keys
    return whiteKeyCount * 36 - 10 + 8; // The +8 compensates for the container padding
}