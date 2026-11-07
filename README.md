# Sales Coaching Intelligence Platform

An enterprise conversation intelligence and sales enablement platform that analyzes recorded sales calls to provide speaker-diarized transcripts, interactive engagement telemetry, and actionable consultative coaching cards powered by Google Gemini.

---

## 💖 Sponsor Sales Coaching Intelligence Platform

Sales Coaching Intelligence Platform is an open-source project built with passion and dedication. Want to support the continued development of this project? You can!

**Sponsor this project by making a donation via PayPal:**

<div align="center">

### ☕ [Donate via PayPal](https://paypal.me/luciferamorgenster)

📧 **PayPal:** `luciferamorgenster@gmail.com`

</div>

Every donation, big or small, helps keep Ivory Tower BBS alive, fund new features, and support ongoing development. Thank you for your generosity! 🙏

---

## Features

### 1. Multimodal Audio Intake & Playback
- **Audio File Upload**: Drag-and-drop or upload `.mp3`, `.wav`, `.m4a`, `.webm`, and `.ogg` files up to 50MB.
- **Live Microphone Recording**: In-browser microphone recorder with real-time audio timer and instant preview.
- **Preloaded Enterprise Sales Scenarios**: Three pre-analyzed consultative B2B sales calls ready for testing:
  1. *Enterprise Cloud Migration - Discovery & Scoping* ($280K ARR)
  2. *FinTech Compliance Platform - Pricing & Security Negotiation* ($140K ARR)
  3. *AI Customer Support Automation - Pilot Qualification* ($190K ACV)
- **Synchronized Audio Player Bar**: Transport controls (Play/Pause, $\pm 5$s seek, variable speeds $0.75\times$ to $1.5\times$, volume/mute) with active speaker detection and dynamic audio waveforms.

### 2. Diarized Dual-Speaker Transcript
- **Speaker A vs Speaker B Separation**: Accurately maps Sales Representative turns versus Prospect/Customer turns with speaker names, roles, and timestamps.
- **Talk-to-Listen Ratio**: Visual comparison bar displaying the percentage of time spoken by the Rep versus the Prospect.
- **Synchronized Playback Highlighting**: Smooth auto-scroll following the active speaker utterance as the audio plays.
- **Bidirectional Seeking**: Clicking any transcript turn immediately seeks the audio player to that exact second.
- **Filters & Search**: Fast filtering by speaker (*All Turns*, *Rep Only*, *Prospect Only*) and full-text keyword search.

### 3. Interactive Sentiment & Engagement Graph
- **Dual-Curve Timeline**: Smooth SVG time-series visualization tracking Prospect Sentiment (Emerald) and Sales Representative Energy (Sky/Indigo) across call duration.
- **Interactive Scrubber**: Click anywhere on the graph to seek the audio player to that moment in time.
- **Moment Markers**: Flags key turning points (rapport surges, pricing objections, SLA hesitations) with detailed hover cards.
- **Synchronized Moment Inspector**: Real-time ticker displaying the contextual takeaway and sentiment score corresponding to the current playhead position.

### 4. AI-Generated Consultative Coaching Card
- **Consultative Rubric Score**: 100-point sales effectiveness rating based on B2B consultative methodology (SPIN / Challenger Selling).
- **3 Things Done Well (Salesperson Strengths)**:
  - Specific impact category (*Discovery*, *Objection Handling*, *Value Proposition*, *Closing*, etc.).
  - Verbatim transcript quote and clickable timestamp button.
  - Tactical explanation of why the response was effective.
- **3 Missed Opportunities & Better Talk Tracks**:
  - Diagnostic breakdown of unaddressed objections or premature concessions.
  - Verbatim transcript quote of the missed moment.
  - **Recommended Consultative Talk Track**: Concrete, ready-to-use alternative script.
  - **Listen Talk Track (AI TTS)**: Generates spoken audio using `gemini-3.8-flash-lite-tts` (or browser SpeechSynthesis) so reps can hear the tone and pacing.
- **1-Click Export**: Copies structured coaching notes directly to clipboard for CRM or 1:1 notes.

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19 + Vite)                      │
│   • Tailwind CSS v4 styling with anti-slop executive B2B design        │
│   • Lucide React icons & Web Audio API synthesis                       │
│   • Interactive SVG Sentiment Graph with bidirectional audio binding   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP /api/*
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Server (server.ts)                      │
│   • Full-stack proxy running on port 3000                              │
│   • GoogleGenAI SDK (@google/genai) with server-side API key handling  │
├────────────────────────────────────────────────────────────────────────┤
│   • POST /api/analyze-audio                                            │
│       1. Model: gemini-3.5-transcribe (verbatim audio transcription)   │
│       2. Model: gemini-3.8-flash (structured JSON schema analysis)     │
│   • POST /api/generate-tts                                             │
│       - Model: gemini-3.8-flash-lite-tts (spoken talk track synthesis) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack & Dependencies

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Express, Node.js, `tsx`
- **AI & Speech SDK**: `@google/genai`
  - `gemini-3.5-transcribe` for speech-to-text audio transcription
  - `gemini-3.8-flash` for multimodal sales reasoning, diarization, sentiment tracking, and coaching cards
  - `gemini-3.8-flash-lite-tts` for talk track voice synthesis

---

## Environment Variables

Configure your environment in `.env` (or via AI Studio **Settings > Secrets**):

```env
# GEMINI_API_KEY: Required for Gemini transcription, analysis, and TTS calls.
GEMINI_API_KEY="your-gemini-api-key"
```

---

## Running the Application

### Development
```bash
npm run dev
```
Starts the full-stack Express server at `http://localhost:3000` with Vite middleware mounted.

### Build & Production
```bash
npm run build
npm start
```
Compiles client assets with Vite and serves the production bundle via Express on port 3000.

---

<div align="center">

### 💖 Support Sales Coaching Intelligence

This project is open-source and built with love.\
Help keep the project alive and fund its continued development!

**[☕ Donate via PayPal — luciferamorgenster@gmail.com](https://paypal.me/luciferamorgenster)**

Thank you for your support! 🙏

</div>
