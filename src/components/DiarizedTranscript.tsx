/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Utterance } from '../types/sales';
import { Search, User, ShieldCheck, Play, ArrowDownRight, MessageSquareQuote } from 'lucide-react';

interface DiarizedTranscriptProps {
  transcript: Utterance[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  talkRatio: { repPercentage: number; prospectPercentage: number };
  salesRepName: string;
  prospectName: string;
}

export const DiarizedTranscript: React.FC<DiarizedTranscriptProps> = ({
  transcript,
  currentTime,
  onSeek,
  talkRatio,
  salesRepName,
  prospectName,
}) => {
  const [filterSpeaker, setFilterSpeaker] = useState<'all' | 'Speaker A' | 'Speaker B'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Filter transcript
  const filteredUtterances = transcript.filter((item) => {
    if (filterSpeaker !== 'all' && item.speaker !== filterSpeaker) return false;
    if (searchQuery.trim()) {
      return item.text.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Auto scroll to active line
  useEffect(() => {
    if (autoScroll && activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentTime, autoScroll]);

  // Determine sentiment styling
  const getSentimentBadge = (sentiment: Utterance['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <span className="text-emerald-400 font-medium">Positive Momentum</span>;
      case 'objection':
        return <span className="text-red-400 font-medium">Critical Objection</span>;
      case 'hesitant':
        return <span className="text-amber-400 font-medium">Hesitation / Doubt</span>;
      case 'negative':
        return <span className="text-rose-400 font-medium">High Friction</span>;
      default:
        return <span className="text-slate-400 font-medium">Neutral Exchange</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-full min-h-[540px]">
      {/* Header with Talk Ratio Bar */}
      <div className="space-y-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Diarized Call Transcript
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Speaker A (Rep) vs Speaker B (Prospect)</span>
                <span aria-hidden="true">·</span>
                <span>{transcript.length} turns</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Auto-follow audio</span>
          </label>
        </div>

        {/* Talk-to-Listen Ratio Breakdown */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="font-semibold">{talkRatio.repPercentage}%</span>
              <span className="text-slate-400 text-[11px] font-sans">Rep ({salesRepName.split(' ')[0]})</span>
            </div>
            <div className="text-slate-500 text-[11px] font-sans">Talk-to-Listen Ratio</div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="text-slate-400 text-[11px] font-sans">Prospect ({prospectName.split(' ')[0]})</span>
              <span className="font-semibold">{talkRatio.prospectPercentage}%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${talkRatio.repPercentage}%` }}
              title={`Sales Rep: ${talkRatio.repPercentage}%`}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${talkRatio.prospectPercentage}%` }}
              title={`Prospect: ${talkRatio.prospectPercentage}%`}
            />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterSpeaker('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSpeaker === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Turns ({transcript.length})
            </button>
            <button
              onClick={() => setFilterSpeaker('Speaker A')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSpeaker === 'Speaker A'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rep Only
            </button>
            <button
              onClick={() => setFilterSpeaker('Speaker B')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterSpeaker === 'Speaker B'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prospect Only
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcript phrases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[440px] focus:outline-none"
      >
        {filteredUtterances.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No spoken dialogue matches your current filter or search criteria.
          </div>
        ) : (
          filteredUtterances.map((item) => {
            const isRep = item.speaker === 'Speaker A';
            const isActive = currentTime >= item.startTime && currentTime <= item.endTime;

            return (
              <div
                key={item.id}
                ref={isActive ? activeItemRef : null}
                onClick={() => onSeek(item.startTime)}
                className={`group relative rounded-xl p-3.5 border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? isRep
                      ? 'bg-sky-950/30 border-sky-500 shadow-sm shadow-sky-500/10 ring-1 ring-sky-500/20'
                      : 'bg-emerald-950/30 border-emerald-500 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                    : isRep
                    ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/70'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/70'
                }`}
              >
                {/* Speaker Header */}
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold ${
                        isRep
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isRep ? 'A' : 'B'}
                    </div>
                    <span className="font-medium text-slate-200">
                      {item.speakerName || (isRep ? salesRepName : prospectName)}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className={`text-[11px] ${isRep ? 'text-sky-400/90' : 'text-emerald-400/90'}`}>
                      {item.speakerRole}
                    </span>
                  </div>

                  {/* Timestamp & Sentiment */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="text-[11px]">{getSentimentBadge(item.sentiment)}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(item.startTime);
                      }}
                      className="flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 group-hover:border-slate-700 transition-colors"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{formatTime(item.startTime)}</span>
                    </button>
                  </div>
                </div>

                {/* Spoken Text */}
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-8">
                  {item.text}
                </p>

                {/* Key Takeaway / Callout if flagged */}
                {item.keyTakeaway && (
                  <div className="mt-2.5 ml-8 pt-2 border-t border-slate-800/60 flex items-start gap-1.5 text-xs text-slate-400">
                    <ArrowDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="italic">{item.keyTakeaway}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
