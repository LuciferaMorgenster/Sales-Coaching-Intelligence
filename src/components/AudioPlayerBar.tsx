/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Gauge,
  Radio,
} from 'lucide-react';
import { Utterance } from '../types/sales';

interface AudioPlayerBarProps {
  audioUrl?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onRateChange: (rate: number) => void;
  transcript: Utterance[];
  salesRepName: string;
  prospectName: string;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioUrl,
  duration,
  currentTime,
  isPlaying,
  playbackRate,
  onPlayPause,
  onSeek,
  onRateChange,
  transcript,
  salesRepName,
  prospectName,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(0.85);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync HTMLAudioElement with props
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Determine current active speaker
  const currentUtterance = transcript.find(
    (u) => currentTime >= u.startTime && currentTime <= u.endTime
  );
  const isRep = currentUtterance?.speaker === 'Speaker A';
  const isProspect = currentUtterance?.speaker === 'Speaker B';

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    onSeek(target);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      {/* Hidden audio element for real audio playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onTimeUpdate={() => {
            // Handled authoritative in parent or sync
          }}
          onEnded={() => {
            onPlayPause();
          }}
        />
      )}

      {/* Top row: Active speaker telemetry & audio scrubber */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Active speaker readout */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full shrink-0 transition-colors ${
              isPlaying
                ? isRep
                  ? 'bg-sky-400 ring-4 ring-sky-400/20 animate-pulse'
                  : isProspect
                  ? 'bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse'
                  : 'bg-amber-400'
                : 'bg-slate-600'
            }`}
          />
          <div className="text-xs">
            <span className="text-slate-400 font-medium">Active Speaker: </span>
            {currentUtterance ? (
              <span className={`font-semibold ${isRep ? 'text-sky-300' : 'text-emerald-300'}`}>
                {currentUtterance.speakerName || (isRep ? salesRepName : prospectName)} (
                {currentUtterance.speakerRole})
              </span>
            ) : (
              <span className="text-slate-500 italic">Call Pause / Transition</span>
            )}
          </div>
        </div>

        {/* Dynamic audio animated wave bars */}
        <div className="flex items-center gap-1 h-4">
          {[12, 24, 16, 28, 14, 20, 10, 26, 18, 12].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? isRep
                    ? 'bg-sky-400'
                    : isProspect
                    ? 'bg-emerald-400'
                    : 'bg-slate-500'
                  : 'bg-slate-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, (height * (Math.sin(currentTime * 8 + i) + 1.2)) / 2)}px` : '4px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Skip Back 5s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onPlayPause}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Call</span>
              </>
            )}
          </button>

          {/* Skip Forward 5s */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Speed and Volume */}
        <div className="flex items-center gap-3">
          {/* Playback Speed */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => onRateChange(rate)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  playbackRate === rate
                    ? 'bg-slate-800 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Mute Toggle */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded hover:text-slate-200"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 h-1 bg-slate-800 rounded appearance-none accent-slate-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
