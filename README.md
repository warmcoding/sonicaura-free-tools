# Sonicaura‑Free‑Tools

Open‑source collection of free browser‑native audio tools from **Sonicaura Studio**.
All tools run largely inside your browser, built with Next.js, Tailwind CSS and WebAssembly.

> ⚠️ Note: This repository provides frontend source code for demo purposes.
> Some WASM binaries and private backend APIs are **not included**.
> For full‑featured production experience, please visit our official website.

## Live Demos
| Tool Name | Live Demo | Source Directory |
|---|---|---|
| Vocal Pitch Test | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/vocal-pitch-test) | `/src/app/tools/vocal-pitch-test` |
| Audio & Video Format Converter | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/convert) | `/src/app/tools/convert` |
| Online Metronome | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/metronome) | `/src/app/tools/metronome` |
| Virtual Piano Keyboard | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/piano) | `/src/app/tools/piano` |
| Ear Training & Pitch Test | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/ear-training) | `/src/app/tools/ear-training` |
| Vocal Range Finder | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/pitch-range) | `/src/app/tools/pitch-range` |

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- WebAssembly for audio processing
- Tone.js

## Getting Started
### Prerequisites
Node.js >= 20

#### Setup steps (Mac / Unix / Linux)
```bash
# step 1: create next project
cd "your project folder"
npx create-next-app@latest demo

# step 2: install tone.js
npm install tone

# step3: run dev server
npm run dev
