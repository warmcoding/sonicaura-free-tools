'use client';

import React, { useState } from 'react';
import * as Tone from 'tone';
import GlobalHeader from '@/components/Header';
import StudioCTA from '@/components/StudioCTA';
import Comment from '@/components/Comment';
import ToolGuide from '@/components/ToolGuide';
import { EAR_TRAINING_GUIDE } from '@/lib/tool-content';

export default function EarTrainingClient() {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'answered'>('idle');
    const [score, setScore] = useState<number>(0);
    const [questionCount, setQuestionCount] = useState<number>(0);
    const [feedback, setFeedback] = useState<string>('Click button below to hear and compare tones.');
    const [correctAnswer, setCorrectAnswer] = useState<'higher' | 'lower'>('higher');

    // Stores the two frequencies being compared in this round
    const [currentFreqs, setCurrentFreqs] = useState<{ base: number; target: number }>({ base: 440, target: 440 });

    // Start a new ear-training round
    const startNewRound = async () => {
        await Tone.start();
        setGameState('playing');
        setFeedback('Playing tones, please listen carefully...');

        const baseFreq = 440; // Reference is A4 (440Hz)
        const centsOffset = Math.floor(Math.random() * 30) + 10;
        const isHigher = Math.random() > 0.5;
        const targetFreq = baseFreq * Math.pow(2, (isHigher ? centsOffset : -centsOffset) / 1200);

        setCorrectAnswer(isHigher ? 'higher' : 'lower');
        setCurrentFreqs({ base: baseFreq, target: targetFreq });

        // Play the first tone (the reference)
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease(baseFreq, '4n', Tone.now());

        // Play the second tone (the comparison) 0.8s later
        setTimeout(() => {
            synth.triggerAttackRelease(targetFreq, '4n', Tone.now());
            setFeedback('Tones completed! Was the second pitch higher or lower?');
            setGameState('answered');
        }, 800);
    };

    // Handle the user's guess
    const handleGuess = (guess: 'higher' | 'lower') => {
        setQuestionCount((prev) => prev + 1);
        if (guess === correctAnswer) {
            setScore((prev) => prev + 1);
            setFeedback('🎉 Correct! Excellent auditory pitch sensitivity.');
        } else {
            setFeedback('❌ Incorrect. Daily practice significantly improves your musical ear!');
        }
        setGameState('idle');
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
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h1
                    id="main-content"
                    tabIndex={-1}
                    className="text-3xl font-bold mb-2 mt-2 text-center scroll-mt-24"
                >
                    Ear Training & Pitch Test
                </h1>
                <p className="text-zinc-400 mb-8 text-center">Sharpen your musical ear by distinguishing microtonal pitch variations.</p>

                <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[650px]">
                    {/* Main ear-training console */}
                    <div className="relative w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-between p-6 shadow-2xl">

                        {/* Score and progress at the top */}
                        <div className="flex justify-between items-center w-full z-20 mb-6">
                            <div>
                                <span className="text-[10px] text-zinc-500 tracking-wider block">SCORE / TOTAL</span>
                                <span className="text-3xl font-mono font-black text-emerald-400">
                                    {score} <span className="text-zinc-600 text-lg">/ {questionCount}</span>
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-500 tracking-wider block">MODE</span>
                                <span className="text-sm font-mono font-bold text-blue-400">Pitch Ear Training</span>
                            </div>
                        </div>

                        {/* Main prompt area */}
                        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center my-4 min-h-[100px] flex flex-col items-center justify-center">
                            <p className="text-sm text-zinc-300 font-medium">{feedback}</p>
                        </div>

                        {/* Answer buttons */}
                        <div className="w-full flex flex-col space-y-3">
                            {gameState === 'idle' && (
                                <button
                                    onClick={startNewRound}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-102"
                                >
                                    Play Test Tones
                                </button>
                            )}

                            {gameState === 'answered' && (
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => handleGuess('higher')}
                                        className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
                                    >
                                        📈 Higher (2nd Tone)
                                    </button>
                                    <button
                                        onClick={() => handleGuess('lower')}
                                        className="py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition"
                                    >
                                        📉 Lower (2nd Tone)
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-full text-center text-[10px] text-zinc-500 font-mono mt-6">
                            Test your relative pitch accuracy by comparing two consecutive tones.
                        </div>
                    </div>
                </div>

                {/* How-to steps + FAQ: the copy and the HowTo / FAQPage structured data share one source */}
                <ToolGuide content={EAR_TRAINING_GUIDE} />

                {/* Feedback form */}
                <Comment />

                {/* Bottom-of-page cross-sell */}
                <StudioCTA />
            </div>
        </main>
    );
}