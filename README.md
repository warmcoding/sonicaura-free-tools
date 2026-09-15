# Sonicaura‑Free‑Tools

Open‑source collection of free browser‑native audio tools from **Sonicaura Studio**.
All tools run largely inside your browser, built with Next.js, Tailwind CSS and WebAssembly.

> Note: This repository provides frontend source code for demo purposes.
> Some WASM binaries and private backend APIs are **not included**.
> For full‑featured production experience, please visit our official website.

## Live Demos
| Tool Name | Live Demo | Source Directory |
|---|---|---|
| Vocal Pitch Test | [🔗 Try Demo](https://www.sonicaurastudio.com/tools/vocal-pitch-test) | `/src/app/tools/vocal-pitch-test` |


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
