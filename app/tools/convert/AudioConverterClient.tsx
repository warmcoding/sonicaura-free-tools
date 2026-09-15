'use client';

import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function AudioConverterClient() {
    const [file, setFile] = useState<File | null>(null);
    const [targetFormat, setTargetFormat] = useState('mp3');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const ffmpegRef = useRef<FFmpeg | null>(null);

    // Load and initialise FFmpeg
    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return;
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on('progress', ({ progress }) => {
            setProgress(Math.round(progress * 100));
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setDownloadUrl(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setDownloadUrl(null);
        }
    };

    // Core transcoding logic
    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProgress(0);
        setStatusText('Loading encoder...');

        try {
            await loadFFmpeg();
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) return;

            setStatusText('Reading file...');
            const inputName = 'input_file';
            const outputName = `output.${targetFormat}`;

            // Write the uploaded file into FFmpeg's virtual file system
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            setStatusText('Converting format...');
            // Run the actual transcoding command
            if (targetFormat === 'mp3') {
                await ffmpeg.exec(['-i', inputName, '-q:a', '2', outputName]);
            } else {
                // wav
                await ffmpeg.exec(['-i', inputName, outputName]);
            }

            setStatusText('Generating download...');
            const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
            const outputBuffer = new ArrayBuffer(data.byteLength);
            new Uint8Array(outputBuffer).set(data);
            const blob = new Blob([outputBuffer], { type: targetFormat === 'mp3' ? 'audio/mp3' : 'audio/wav' });
            const url = URL.createObjectURL(blob);

            setDownloadUrl(url);
            setProgress(100);
        } catch (error) {
            console.error(error);
            alert('Conversion failed. Please try a different file.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!downloadUrl || !file) return;
        const a = document.createElement('a');
        a.href = downloadUrl;
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        a.download = `${originalName}_converted.${targetFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="w-full bg-[#121215] border border-white/10 rounded-2xl p-8 shadow-2xl">
            {!file ? (
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-zinc-700 hover:border-purple-500/50 rounded-xl p-12 text-center transition cursor-pointer flex flex-col items-center justify-center bg-zinc-900/50"
                >
                    <svg className="w-12 h-12 text-zinc-500 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm font-medium text-zinc-200 mb-1">
                        Drag & drop audio/video file here, or click to browse
                    </p>
                    <p className="text-xs text-zinc-500">
                        Supports .m4a, .mp4, .wav, .mp3 formats
                    </p>
                    <input
                        type="file"
                        accept="audio/*,video/mp4,.m4a,.mp4"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-lg text-white transition cursor-pointer border border-zinc-700"
                    >
                        Browse Files
                    </label>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-3 truncate">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                🎵
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setFile(null);
                                setDownloadUrl(null);
                                setProgress(0);
                            }}
                            className="text-xs text-zinc-400 hover:text-white px-2 py-1 transition"
                        >
                            Change File
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <span className="text-sm text-zinc-300">Convert to format:</span>
                        <select
                            value={targetFormat}
                            onChange={(e) => setTargetFormat(e.target.value)}
                            disabled={isProcessing}
                            className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                        >
                            <option value="mp3">MP3 (Universal)</option>
                            <option value="wav">WAV (Lossless)</option>
                        </select>
                    </div>

                    {isProcessing ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : downloadUrl ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-emerald-400 text-xs">
                                Conversion completed successfully!
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 font-medium text-sm rounded-xl transition shadow-lg shadow-purple-900/20 cursor-pointer"
                            >
                                Download Converted .{targetFormat}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConvert}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 font-medium text-sm rounded-xl transition shadow-lg shadow-purple-900/20 cursor-pointer"
                        >
                            Start Conversion
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}