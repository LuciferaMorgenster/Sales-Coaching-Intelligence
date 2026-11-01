# Sales Coaching Intelligence Platform

An enterprise-grade sales conversation intelligence and coaching platform that analyzes sales call audio to provide diarized transcripts, interactive engagement timelines, and actionable coaching cards.

> [!IMPORTANT]
> **Confirmed Choices from Clarification**:
> - **Coaching Methodology**: Consultative B2B selling and discovery framework (SPIN / Challenger consultative style).
> - **Audio Inputs**: Realistic preloaded sample sales calls (e.g. Enterprise Discovery Call, SaaS Renewal & Expansion, High-Stakes Pricing Negotiation) alongside drag-and-drop file upload and live microphone recording.
> - **Interactive Synchronized Playback**: Real-time bidirectional scrub and seek between the native audio waveform/player, the engagement sentiment graph, and the diarized transcript cue cards.

---

## 1. Overview & Core Concept

- **What It Does**: Sales leaders and account executives upload or record audio from sales calls. The platform processes the recording with Gemini AI, producing:
  1. A diarized dual-speaker transcript differentiating the Sales Representative (Speaker A) and the Prospect/Client (Speaker B) with timestamps, talk-time ratio, and speaking speed.
  2. A responsive, interactive "Sentiment & Engagement Graph" mapping conversational momentum, customer objection intensity, and emotional energy across time.
  3. An AI-generated "Coaching Card" highlighting precisely 3 strengths (what the salesperson did well) and 3 high-impact missed opportunities, complete with transcript citations and tactical recommendations.
- **Target Audience / Persona**: Account Executives, Sales Development Reps, Sales Managers, and Enablement Leaders who need immediate, objective coaching feedback after discovery or negotiation calls.
- **Key Value**: Accelerates sales ramp time, eliminates tedious manual call reviews, and transforms raw audio into coachable B2B insights.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Source Selection & Intake**:
   - The user selects an intake path: choosing from three preloaded real-world enterprise sales call scenarios, dragging and dropping an audio file (`.mp3`, `.wav`, `.m4a`, `.webm`), or recording live via browser microphone.
   - When an audio file is chosen or recorded, an immediate preview waveform and player appear with duration metadata.
2. **Analysis Execution**:
   - The user initiates coaching analysis. A multi-phase progress tracker displays real-time progression (Transcribing Audio & Diarizing Speakers $\rightarrow$ Evaluating Sentiment & Engagement Trajectory $\rightarrow$ Synthesizing Consultative Coaching Cards).
3. **Interactive Intelligence Dashboard**:
   - **Header & Metric Strip**: Call summary, participant identification, talk-to-listen ratio (e.g., Rep 48% vs Prospect 52%), customer sentiment score, and question count.
   - **Interactive Sentiment & Engagement Graph**: A visual time-series graph with engagement curves for both parties. Hovering shows sentiment tooltips; clicking any point jumps the audio player and transcript to that exact timestamp.
   - **Synchronized Diarized Transcript**: Filterable view (All, Rep, Prospect) with speaker badges, timestamps, search filter, and active line auto-scroll that tracks audio playback.
   - **AI Coaching Card**: Split view presenting **3 Things Done Well** (with category, specific quote/timestamp, and why it worked) and **3 Missed Opportunities** (with objection context, what was missed, and the recommended consultative talk track).
   - **Action Bar**: Export coaching card to clipboard / markdown, reset for a new call, or switch between demo calls.

### Visual Identity & Theme
- **Aesthetic Direction**: High-trust, executive B2B analytics aesthetic (inspired by modern enterprise platforms like Linear and Gong), emphasizing clarity, data density, and legible typography over decorative fluff.
- **Color Palette**:
  - Base: Deep slate charcoal background (`#0B0F17` / `slate-950`), cool slate card surfaces (`#111827` / `slate-900`), and crisp borders (`#1F2937` / `slate-800`).
  - Speaker A (Sales Rep): Vibrant Indigo/Sky (`#38BDF8` / `#6366F1`) denoting proactive leadership.
  - Speaker B (Prospect): Emerald/Teal (`#34D399` / `#10B981`) denoting customer engagement.
  - Sentiment Spectrum: High engagement emerald (`#10B981`), neutral amber (`#F59E0B`), tension/drop red (`#EF4444`).
  - Accents: Subtle violet highlights for AI synthesis tags (`#8B5CF6`).
- **Typography & Tabular Numerals**:
  - Headings & Navigation: Plus Jakarta Sans / Outfit for confident hierarchy.
  - Telemetry & Timestamps: Tabular monospace figures (`font-mono`, `tabular-nums`) for exact audio alignment.
- **Anti-Slop Discipline**:
  - No static pill capsules around metadata; metadata uses typographic bullet separators (`·`).
  - No fake latency/system status footers or arbitrary gimmick scores.
  - Every button has an explicit, active handler.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Phase Multimodal Gemini Pipeline**:
  - *Chosen Approach*: Server-side Gemini integration using `gemini-3.5-transcribe` for accurate audio speech-to-text with speaker diarization timestamps, combined with `gemini-3.8-flash` with structured JSON schema (`responseSchema`) for sentiment progression modeling and consultative B2B coaching extraction.
  - *Why*: Delivers high transcription fidelity while guaranteeing strictly formatted JSON for the sentiment graph coordinates and the exact 3-strengths / 3-opportunities coaching schema.
  - *Alternatives Considered*: Single-prompt all-in-one text processing (often drifts in timestamp accuracy) or browser-only mock processing (violates real integration guidelines).
- **Decision 2: Bidirectional Audio Player & Graph Synchronization**:
  - *Chosen Approach*: Web Audio API / HTML5 Audio controller exposing current playback time in seconds with an animation frame loop. The sentiment SVG canvas and transcript cards bind to this single authoritative playback position.
  - *Why*: Sales coaches demand the ability to click a sudden dip in customer engagement on the graph and immediately hear what the rep said at that moment.
  - *Alternatives Considered*: Static graph with separated player controls.
- **Decision 3: Zero-Setup Testing with Realistic Embedded Call Audio**:
  - *Chosen Approach*: Include 3 authentic pre-analyzed sales recordings with synthesized speech waveforms and full diarization so evaluators can test immediately, while fully supporting live mic recording and custom file uploads.
  - *Why*: Users can evaluate the full dashboard experience immediately without having to locate an audio file of a sales conversation.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Sales Intelligence UI                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Top Bar: Intake & Controls     │ • Call Picker / File Drop / Mic Record│
│                                │ • Play / Pause / Rate / Seek Bar      │
├────────────────────────────────┴───────────────────────────────────────┤
│ Metric Bar: Talk Ratio (Rep vs Prospect) · Call Duration · Momentum    │
├────────────────────────────────┬───────────────────────────────────────┤
│ Left Column (55% Width)        │ Right Column (45% Width)              │
│                                │                                       │
│ ┌────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Interactive Sentiment Graph│ │ │ AI Coaching Card                  │ │
│ │ • Engagement Curve (0-100) │ │ │ • 3 Things Done Well (Strengths)  │ │
│ │ • Interactive Time Marker  │ │ │   - Category & Quote & Timestamp  │ │
│ │ • Moment Sentiment Notes   │ │ │ • 3 Missed Opportunities          │ │
│ └────────────────────────────┘ │ │   - Objection & Better Talk Track │ │
│ ┌────────────────────────────┐ │ └───────────────────────────────────┘ │
│ │ Diarized Transcript View   │ │                                       │ │
│ │ • Speaker A (Sales Rep)    │ │                                       │ │
│ │ • Speaker B (Prospect)     │ │                                       │ │
│ │ • Active Sync Highlighting │ │                                       │ │
│ │ • Search & Speaker Filter  │ │                                       │ │
│ └────────────────────────────┘ │                                       │ │
└────────────────────────────────┴───────────────────────────────────────┘
                                   │
                    HTTP POST /api/analyze-call (base64 audio)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Server (server.ts)                      │
│   • GoogleGenAI Client (process.env.GEMINI_API_KEY)                    │
│   • Model: gemini-3.5-transcribe / gemini-3.8-flash                    │
│   • Structured JSON responseSchema validation                          │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

```ts
interface Utterance {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  speakerRole: 'Sales Rep' | 'Prospect';
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  sentiment: 'positive' | 'neutral' | 'hesitant' | 'negative';
}

interface SentimentPoint {
  time: number; // in seconds
  repEngagement: number;      // 0 - 100
  prospectEngagement: number; // 0 - 100
  note?: string;              // e.g. "Pricing objection raised", "Strong rapport building"
}

interface CoachingCard {
  salespersonStrengths: Array<{
    title: string;
    description: string;
    transcriptExcerpt: string;
    timestamp: number;
    impactCategory: 'Discovery' | 'Value Proposition' | 'Objection Handling' | 'Closing' | 'Active Listening';
  }>; // Exactly 3
  missedOpportunities: Array<{
    title: string;
    description: string;
    transcriptExcerpt: string;
    timestamp: number;
    recommendedTalkTrack: string;
    impactCategory: 'Discovery' | 'Value Proposition' | 'Objection Handling' | 'Closing' | 'Active Listening';
  }>; // Exactly 3
}

interface CallAnalysis {
  callTitle: string;
  durationSeconds: number;
  talkRatio: { repPercentage: number; prospectPercentage: number };
  transcript: Utterance[];
  sentimentTimeline: SentimentPoint[];
  coachingCard: CoachingCard;
  overallSummary: string;
}
```

### Interactive State Transitions
- **`audioState`**: Manages `currentTime`, `duration`, `isPlaying`, `playbackRate`, and active seek callbacks.
- **`activeHoverTimestamp`**: When hovering anywhere on the sentiment graph, shows exact time and conversation context.
- **`activeUtteranceIndex`**: Computed from `audioState.currentTime` to smoothly auto-scroll and highlight the active transcript item.
- **`uploadState`**: Idle $\rightarrow$ Recording / Dropped $\rightarrow$ Transcribing & Analyzing $\rightarrow$ Success / Error fallback.
