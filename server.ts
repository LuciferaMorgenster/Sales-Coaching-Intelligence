/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large audio uploads up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * POST /api/analyze-audio
 * Accepts base64 encoded audio and performs:
 * 1. Transcription using gemini-3.5-transcribe
 * 2. Diarization, Sentiment Timeline, and Coaching Card synthesis using gemini-3.8-flash with JSON schema
 */
app.post('/api/analyze-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', fileName = 'sales_call_recording', callContext = '' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audio data' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the server environment. Please set it in Settings > Secrets.',
      });
    }

    // Clean base64 string
    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, '');

    console.log(`[Audio Analysis] Starting transcription with gemini-3.5-transcribe (${mimeType})...`);

    // Step 1: Transcribe audio using gemini-3.5-transcribe
    let transcriptRaw = '';
    try {
      const transcribeResponse = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: 'Transcribe this sales conversation recording verbatim. Capture every speaker turn clearly, marking speaker changes and spoken phrases with timing cues where possible.',
            },
          ],
        },
      });
      transcriptRaw = transcribeResponse.text || '';
      console.log(`[Audio Analysis] Transcription completed (${transcriptRaw.length} chars).`);
    } catch (transcribeErr: any) {
      console.warn('[Audio Analysis] gemini-3.5-transcribe encountered an issue, proceeding with multimodal analysis:', transcribeErr.message);
    }

    // Step 2: Use gemini-3.8-flash to perform B2B sales coaching intelligence, diarization, sentiment tracking, and coaching card extraction
    console.log('[Audio Analysis] Synthesizing sales coaching intelligence with gemini-3.8-flash...');

    const promptText = `
You are an elite B2B Sales Coaching Intelligence expert specializing in consultative selling (SPIN Selling, Challenger, and MEDDIC discovery).
Analyze this recorded sales conversation.

Context about this deal/call: ${callContext || 'B2B enterprise consultative sales call'}
Verbatim transcription draft:
"""
${transcriptRaw.slice(0, 15000)}
"""

Perform the following:
1. Provide a concise title and deal context summary.
2. Diarize the entire conversation between Speaker A (Sales Rep) and Speaker B (Prospect/Customer). Provide clean, accurate start and end timestamps in seconds, speaker roles, verbatim spoken text, utterance sentiment ('positive', 'neutral', 'hesitant', 'objection', 'negative'), and brief key takeaways for pivotal lines.
3. Calculate talk ratio (percentage of time Sales Rep spoke vs Prospect spoke).
4. Generate a granular Sentiment and Engagement timeline across the duration of the call:
   - Provide timestamps from 0 to total duration (at least 6-12 representative time intervals).
   - For each point, score repEngagement (0-100) and prospectEngagement (0-100).
   - Add sentiment notes explaining what triggered shifts in engagement (e.g. "Prospect expressed concern regarding integration timeline", "Rep shared compelling customer ROI case study", "Pricing hesitation raised").
5. Create an AI Coaching Card adhering strictly to:
   - Exactly 3 things the salesperson did well (Strengths) with clear category ('Discovery', 'Value Proposition', 'Objection Handling', 'Closing', 'Active Listening', 'Next Steps'), exact quote/excerpt, timestamp, and why it was effective.
   - Exactly 3 missed opportunities with category, objection/context, transcript quote/timestamp, and a concrete, ready-to-use recommended consultative talk track.
   - An overall executive coaching synthesis and consultative score (0-100).
`;

    // Multimodal payload: include both audio part and prompt text so Gemini has acoustic cues as well as the text
    const audioPart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [audioPart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            dealContext: { type: Type.STRING },
            salesRepName: { type: Type.STRING },
            prospectName: { type: Type.STRING },
            durationSeconds: { type: Type.NUMBER },
            talkRatio: {
              type: Type.OBJECT,
              properties: {
                repPercentage: { type: Type.NUMBER },
                prospectPercentage: { type: Type.NUMBER },
              },
              required: ['repPercentage', 'prospectPercentage'],
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                repQuestions: { type: Type.NUMBER },
                prospectQuestions: { type: Type.NUMBER },
                longestMonologueSeconds: { type: Type.NUMBER },
                customerSentimentTrend: {
                  type: Type.STRING,
                  enum: ['Upward', 'Steady', 'Volatile', 'Downward'],
                },
              },
              required: ['repQuestions', 'prospectQuestions', 'longestMonologueSeconds', 'customerSentimentTrend'],
            },
            transcript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  speaker: { type: Type.STRING, enum: ['Speaker A', 'Speaker B'] },
                  speakerRole: { type: Type.STRING, enum: ['Sales Rep', 'Prospect'] },
                  speakerName: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  sentiment: {
                    type: Type.STRING,
                    enum: ['positive', 'neutral', 'hesitant', 'objection', 'negative'],
                  },
                  keyTakeaway: { type: Type.STRING },
                },
                required: ['speaker', 'speakerRole', 'startTime', 'endTime', 'text', 'sentiment'],
              },
            },
            sentimentTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.NUMBER },
                  repEngagement: { type: Type.NUMBER },
                  prospectEngagement: { type: Type.NUMBER },
                  sentimentNote: { type: Type.STRING },
                  sentimentType: {
                    type: Type.STRING,
                    enum: ['high_rapport', 'objection', 'hesitation', 'interest', 'neutral'],
                  },
                },
                required: ['time', 'repEngagement', 'prospectEngagement'],
              },
            },
            coachingCard: {
              type: Type.OBJECT,
              properties: {
                overallExecutiveSummary: { type: Type.STRING },
                consultativeScore: { type: Type.NUMBER },
                keyThemes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                salespersonStrengths: {
                  type: Type.ARRAY,
                  description: 'Exactly 3 things the salesperson did well',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      transcriptExcerpt: { type: Type.STRING },
                      timestamp: { type: Type.NUMBER },
                      impactCategory: {
                        type: Type.STRING,
                        enum: ['Discovery', 'Value Proposition', 'Objection Handling', 'Closing', 'Active Listening', 'Next Steps'],
                      },
                    },
                    required: ['title', 'description', 'transcriptExcerpt', 'timestamp', 'impactCategory'],
                  },
                },
                missedOpportunities: {
                  type: Type.ARRAY,
                  description: 'Exactly 3 missed opportunities',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      transcriptExcerpt: { type: Type.STRING },
                      timestamp: { type: Type.NUMBER },
                      recommendedTalkTrack: { type: Type.STRING },
                      impactCategory: {
                        type: Type.STRING,
                        enum: ['Discovery', 'Value Proposition', 'Objection Handling', 'Closing', 'Active Listening', 'Next Steps'],
                      },
                    },
                    required: ['title', 'description', 'transcriptExcerpt', 'timestamp', 'recommendedTalkTrack', 'impactCategory'],
                  },
                },
              },
              required: ['overallExecutiveSummary', 'consultativeScore', 'salespersonStrengths', 'missedOpportunities', 'keyThemes'],
            },
          },
          required: ['title', 'dealContext', 'durationSeconds', 'talkRatio', 'metrics', 'transcript', 'sentimentTimeline', 'coachingCard'],
        },
      },
    });

    const parsed = JSON.parse(analysisResponse.text || '{}');

    // Ensure IDs exist for list keys
    if (parsed.transcript && Array.isArray(parsed.transcript)) {
      parsed.transcript = parsed.transcript.map((u: any, idx: number) => ({
        ...u,
        id: u.id || `utt-${idx + 1}`,
      }));
    }

    if (parsed.coachingCard?.salespersonStrengths) {
      parsed.coachingCard.salespersonStrengths = parsed.coachingCard.salespersonStrengths.map((s: any, idx: number) => ({
        ...s,
        id: s.id || `str-${idx + 1}`,
      }));
    }

    if (parsed.coachingCard?.missedOpportunities) {
      parsed.coachingCard.missedOpportunities = parsed.coachingCard.missedOpportunities.map((m: any, idx: number) => ({
        ...m,
        id: m.id || `opp-${idx + 1}`,
      }));
    }

    const result = {
      ...parsed,
      id: `call-${Date.now()}`,
      isCustomUpload: true,
    };

    console.log('[Audio Analysis] Successfully generated call intelligence dashboard payload.');
    res.json(result);
  } catch (error: any) {
    console.error('[Audio Analysis Error]:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze sales call audio.',
    });
  }
});

/**
 * POST /api/generate-tts
 * Generates spoken audio for coach recommendations using gemini-3.8-flash-lite-tts
 */
app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text to synthesize' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Clear, confident, consultative enterprise sales professional',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from TTS model' });
    }

    res.json({
      audioBase64: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error('[TTS Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Coaching Intelligence platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
