/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SAMPLE_CALLS } from './data/sampleCalls';
import { CallAnalysis } from './types/sales';
import { Header } from './components/Header';
import { SentimentGraph } from './components/SentimentGraph';
import { DiarizedTranscript } from './components/DiarizedTranscript';
import { CoachingCardView } from './components/CoachingCardView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { CallIntakeModal } from './components/CallIntakeModal';
import { generateSyntheticCallAudio } from './utils/audioSynthesizer';
import {
  Clock,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  BarChart2,
  Briefcase,
  Users,
} from 'lucide-react';

export default function App() {
  const [calls, setCalls] = useState<CallAnalysis[]>(SAMPLE_CALLS);
  const [activeCallId, setActiveCallId] = useState<string>(SAMPLE_CALLS[0].id);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<string, string>>({});

  const activeCall = calls.find((c) => c.id === activeCallId) || calls[0];

  // Playback timer loop
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Initialize or fetch synthetic audio for sample calls
  useEffect(() => {
    let isCancelled = false;

    async function loadAudioForCall(call: CallAnalysis) {
      if (audioUrlMap[call.id]) return;

      if (call.audioBlobUrl) {
        setAudioUrlMap((prev) => ({ ...prev, [call.id]: call.audioBlobUrl! }));
        return;
      }

      try {
        const url = await generateSyntheticCallAudio(call.transcript, call.durationSeconds);
        if (!isCancelled) {
          setAudioUrlMap((prev) => ({ ...prev, [call.id]: url }));
        }
      } catch (err) {
        console.warn('Audio synthesis fallback error:', err);
      }
    }

    loadAudioForCall(activeCall);

    return () => {
      isCancelled = true;
    };
  }, [activeCall.id]);

  // Audio playback state ticker
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const deltaSeconds = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const nextTime = prev + deltaSeconds * playbackRate;
        if (nextTime >= activeCall.durationSeconds) {
          setIsPlaying(false);
          return activeCall.durationSeconds;
        }
        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackRate, activeCall.durationSeconds]);

  // Handle call switch
  const handleSelectCall = (callId: string) => {
    setActiveCallId(callId);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (currentTime >= activeCall.durationSeconds) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  // Handle seek from any source (graph, player, transcript, coaching card)
  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(activeCall.durationSeconds, seconds));
    setCurrentTime(clamped);
  };

  // Handle new analysis completion from intake modal
  const handleAnalysisComplete = (newCall: CallAnalysis, audioUrl: string) => {
    setCalls((prev) => [newCall, ...prev]);
    setActiveCallId(newCall.id);
    setAudioUrlMap((prev) => ({ ...prev, [newCall.id]: audioUrl }));
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Header */}
      <Header
        currentCall={activeCall}
        allCalls={calls}
        onSelectCall={handleSelectCall}
        onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-36">
        {/* Deal Context & Executive Telemetry Strip */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold tracking-wide uppercase">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Enterprise Deal Overview</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                {activeCall.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                {activeCall.dealContext}
              </p>
            </div>

            {/* Participants */}
            <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-400">Speaker A:</span>
                <span className="font-semibold text-slate-200">{activeCall.salesRepName}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Speaker B:</span>
                <span className="font-semibold text-slate-200">{activeCall.prospectName}</span>
              </div>
            </div>
          </div>

          {/* Quick Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Total Call Length</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-200 tabular-nums">
                {formatDuration(activeCall.durationSeconds)}
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Talk Ratio (Rep/Client)</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-200 tabular-nums">
                <span className="text-sky-400">{activeCall.talkRatio.repPercentage}%</span>
                <span className="text-slate-600 mx-1">/</span>
                <span className="text-emerald-400">{activeCall.talkRatio.prospectPercentage}%</span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Discovery Questions</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-200 tabular-nums">
                {activeCall.metrics.repQuestions} Rep · {activeCall.metrics.prospectQuestions} Client
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sentiment Trajectory</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                {activeCall.metrics.customerSentimentTrend}
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols on lg): Sentiment Graph & Diarized Transcript */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Sentiment Graph */}
            <SentimentGraph
              timeline={activeCall.sentimentTimeline}
              durationSeconds={activeCall.durationSeconds}
              currentTime={currentTime}
              onSeek={handleSeek}
            />

            {/* Diarized Transcript */}
            <DiarizedTranscript
              transcript={activeCall.transcript}
              currentTime={currentTime}
              onSeek={handleSeek}
              talkRatio={activeCall.talkRatio}
              salesRepName={activeCall.salesRepName}
              prospectName={activeCall.prospectName}
            />
          </div>

          {/* Right Column (5 cols on lg): AI Coaching Card */}
          <div className="lg:col-span-5">
            <CoachingCardView
              card={activeCall.coachingCard}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </main>

      {/* Docked Sticky Bottom Audio Player Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 max-w-7xl mx-auto pointer-events-none">
        <div className="pointer-events-auto">
          <AudioPlayerBar
            audioUrl={audioUrlMap[activeCall.id]}
            duration={activeCall.durationSeconds}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onRateChange={setPlaybackRate}
            transcript={activeCall.transcript}
            salesRepName={activeCall.salesRepName}
            prospectName={activeCall.prospectName}
          />
        </div>
      </footer>

      {/* Audio Intake Modal */}
      <CallIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        onSelectSample={handleSelectCall}
      />
    </div>
  );
}
