/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CoachingCard, CoachingItem } from '../types/sales';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  Copy,
  Check,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';

interface CoachingCardViewProps {
  card: CoachingCard;
  onSeek: (seconds: number) => void;
}

export const CoachingCardView: React.FC<CoachingCardViewProps> = ({ card, onSeek }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'strengths' | 'opportunities'>('all');
  const [copied, setCopied] = useState(false);
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    const text = `
=== SALES COACHING INTELLIGENCE CARD ===
Consultative Score: ${card.consultativeScore}/100
Summary: ${card.overallExecutiveSummary}

3 THINGS DONE WELL:
${card.salespersonStrengths
  .map(
    (s, i) =>
      `${i + 1}. [${s.impactCategory}] ${s.title} (${formatTime(s.timestamp)})\n   ${s.description}\n   Quote: ${s.transcriptExcerpt}`
  )
  .join('\n\n')}

3 MISSED OPPORTUNITIES:
${card.missedOpportunities
  .map(
    (o, i) =>
      `${i + 1}. [${o.impactCategory}] ${o.title} (${formatTime(o.timestamp)})\n   ${o.description}\n   Quote: ${o.transcriptExcerpt}\n   Recommended Talk Track: ${o.recommendedTalkTrack}`
  )
  .join('\n\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Play talk track using speech synthesis or /api/generate-tts
  const handleListenTalkTrack = async (item: CoachingItem) => {
    if (!item.recommendedTalkTrack) return;
    setPlayingTtsId(item.id);

    try {
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.recommendedTalkTrack }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(data.audioBase64);
          audio.onended = () => setPlayingTtsId(null);
          audio.onerror = () => setPlayingTtsId(null);
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }

    // Browser SpeechSynthesis fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.recommendedTalkTrack);
      utterance.rate = 1.0;
      utterance.onend = () => setPlayingTtsId(null);
      utterance.onerror = () => setPlayingTtsId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingTtsId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header with Consultative Score & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              AI Consultative Coaching Card
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>B2B Discovery Rubric</span>
              <span aria-hidden="true">·</span>
              <span>3 Strengths & 3 Opportunities</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Tab Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (6)
            </button>
            <button
              onClick={() => setActiveTab('strengths')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'strengths'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3 Strengths
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'opportunities'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3 Opportunities
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors shrink-0"
            title="Copy coaching card to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Consultative Score Banner */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Executive Coaching Synthesis</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {card.overallExecutiveSummary}
          </p>
          {card.keyThemes && card.keyThemes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="text-slate-500 font-medium">Core Themes:</span>
              {card.keyThemes.map((theme, i) => (
                <React.Fragment key={theme}>
                  <span className="text-slate-300">{theme}</span>
                  {i < card.keyThemes.length - 1 && <span aria-hidden="true" className="text-slate-600">·</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-center justify-center p-3 sm:px-5 rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-center gap-2 sm:gap-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Consultative Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
              {card.consultativeScore}
            </span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
        </div>
      </div>

      {/* Main Coaching Sections */}
      <div className="space-y-6">
        {/* 3 Things Done Well */}
        {(activeTab === 'all' || activeTab === 'strengths') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>3 Things The Salesperson Did Well</span>
            </div>

            <div className="space-y-3">
              {card.salespersonStrengths.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-emerald-900/30 hover:border-emerald-600/50 rounded-xl p-4 transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="text-emerald-400 font-medium">{item.impactCategory}</span>
                          <span aria-hidden="true">·</span>
                          <span>Consultative Strength</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSeek(item.timestamp)}
                      className="flex items-center gap-1 font-mono text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded px-2 py-1 transition-colors shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current text-emerald-400" />
                      <span>{formatTime(item.timestamp)}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    {item.description}
                  </p>

                  <div className="ml-8 bg-slate-900/80 border-l-2 border-emerald-500 rounded-r-lg p-2.5 text-xs text-slate-300 font-mono italic">
                    {item.transcriptExcerpt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 Missed Opportunities */}
        {(activeTab === 'all' || activeTab === 'opportunities') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>3 Missed Opportunities & Better Talk Tracks</span>
            </div>

            <div className="space-y-3">
              {card.missedOpportunities.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-amber-900/30 hover:border-amber-600/50 rounded-xl p-4 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="text-amber-400 font-medium">{item.impactCategory}</span>
                          <span aria-hidden="true">·</span>
                          <span>High-Impact Growth Area</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSeek(item.timestamp)}
                      className="flex items-center gap-1 font-mono text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded px-2 py-1 transition-colors shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                      <span>{formatTime(item.timestamp)}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    {item.description}
                  </p>

                  <div className="ml-8 bg-slate-900/80 border-l-2 border-amber-500 rounded-r-lg p-2.5 text-xs text-slate-400 font-mono italic">
                    {item.transcriptExcerpt}
                  </div>

                  {/* Recommended Talk Track */}
                  {item.recommendedTalkTrack && (
                    <div className="ml-8 bg-sky-950/30 border border-sky-900/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-sky-400 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Recommended Consultative Talk Track
                        </span>

                        <button
                          onClick={() => handleListenTalkTrack(item)}
                          className="flex items-center gap-1 text-[11px] text-sky-300 hover:text-white bg-sky-900/40 hover:bg-sky-800/60 border border-sky-800/60 rounded px-2 py-0.5 transition-colors"
                        >
                          <Volume2 className={`w-3 h-3 ${playingTtsId === item.id ? 'animate-pulse text-sky-200' : ''}`} />
                          <span>{playingTtsId === item.id ? 'Speaking...' : 'Listen Talk Track'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-sky-100 font-medium leading-relaxed">
                        {item.recommendedTalkTrack}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
