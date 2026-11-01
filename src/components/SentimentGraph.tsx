/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { SentimentPoint } from '../types/sales';
import { Activity, Info, Zap } from 'lucide-react';

interface SentimentGraphProps {
  timeline: SentimentPoint[];
  durationSeconds: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const SentimentGraph: React.FC<SentimentGraphProps> = ({
  timeline,
  durationSeconds,
  currentTime,
  onSeek,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SentimentPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const rawId = useId();
  const gradId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        No sentiment progression data available for this call.
      </div>
    );
  }

  // Dimensions for SVG
  const width = 800;
  const height = 240;
  const padding = { top: 28, right: 32, bottom: 44, left: 44 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Map time to X coordinate
  const getX = (time: number) => {
    const ratio = Math.min(1, Math.max(0, time / (durationSeconds || 1)));
    return padding.left + ratio * graphWidth;
  };

  // Map engagement score (0 - 100) to Y coordinate
  const getY = (score: number) => {
    const ratio = Math.min(100, Math.max(0, score)) / 100;
    return padding.top + (1 - ratio) * graphHeight;
  };

  // Generate smooth SVG paths using monotone / catmull-rom or bezier
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const repPoints = timeline.map((pt) => ({ x: getX(pt.time), y: getY(pt.repEngagement) }));
  const prospectPoints = timeline.map((pt) => ({ x: getX(pt.time), y: getY(pt.prospectEngagement) }));

  const repPath = createSmoothPath(repPoints);
  const prospectPath = createSmoothPath(prospectPoints);

  // Closed area for prospect engagement to create rich gradient
  const prospectArea = `${prospectPath} L ${prospectPoints[prospectPoints.length - 1].x} ${padding.top + graphHeight} L ${prospectPoints[0].x} ${padding.top + graphHeight} Z`;

  // Current playhead position
  const currentX = getX(currentTime);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle click on SVG to seek
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clickX - (padding.left / width) * rect.width) / ((graphWidth / width) * rect.width)));
    const targetSeconds = Math.round(ratio * durationSeconds);
    onSeek(targetSeconds);
  };

  // Find point closest to current time for callout
  const activeTimelineItem = timeline.reduce((prev, curr) => {
    return Math.abs(curr.time - currentTime) < Math.abs(prev.time - currentTime) ? curr : prev;
  }, timeline[0]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Sentiment & Engagement Timeline
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Interactive curve</span>
              <span aria-hidden="true">·</span>
              <span>Click anywhere to scrub audio</span>
              <span aria-hidden="true">·</span>
              <span>100-point scale</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
            <span className="font-medium text-slate-200">Prospect Sentiment</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs shadow-sky-400/50" />
            <span className="font-medium text-slate-200">Sales Rep Energy</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onClick={handleSvgClick}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            setHoverX(clickX);
            const ratio = (clickX - (padding.left / width) * rect.width) / ((graphWidth / width) * rect.width);
            const hoverSec = ratio * durationSeconds;
            const nearest = timeline.reduce((prev, curr) => {
              return Math.abs(curr.time - hoverSec) < Math.abs(prev.time - hoverSec) ? curr : prev;
            }, timeline[0]);
            setHoveredPoint(nearest);
          }}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoverX(null);
          }}
        >
          <defs>
            <linearGradient id={`prospectGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`repGrad-${gradId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & Y-axis labels */}
          {[100, 75, 50, 25, 0].map((score) => {
            const y = getY(score);
            return (
              <g key={score}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth="1"
                  strokeDasharray={score === 50 ? '4 4' : undefined}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-mono tabular-nums"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Time markers on X axis */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const timeVal = Math.round(pct * durationSeconds);
            const x = padding.left + pct * graphWidth;
            return (
              <g key={pct}>
                <line
                  x1={x}
                  y1={padding.top + graphHeight}
                  x2={x}
                  y2={padding.top + graphHeight + 6}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + graphHeight + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono tabular-nums"
                >
                  {formatSeconds(timeVal)}
                </text>
              </g>
            );
          })}

          {/* Shaded Area for Prospect Engagement */}
          <path d={prospectArea} fill={`url(#prospectGrad-${gradId})`} />

          {/* Rep Engagement Line */}
          <path
            d={repPath}
            fill="none"
            stroke={`url(#repGrad-${gradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-150"
          />

          {/* Prospect Engagement Line */}
          <path
            d={prospectPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-150"
          />

          {/* Event nodes along the timeline */}
          {timeline.map((point, idx) => {
            const x = getX(point.time);
            const yProspect = getY(point.prospectEngagement);
            const isNegative = point.sentimentType === 'objection' || point.prospectEngagement < 50;
            const isHigh = point.sentimentType === 'high_rapport' || point.prospectEngagement > 80;

            return (
              <g key={idx} className="cursor-pointer group">
                <circle
                  cx={x}
                  cy={yProspect}
                  r={isNegative ? 5.5 : 4}
                  fill={isNegative ? '#EF4444' : isHigh ? '#10B981' : '#F59E0B'}
                  stroke="#0F172A"
                  strokeWidth="2"
                  className="transition-transform group-hover:scale-150"
                />
              </g>
            );
          })}

          {/* Active Audio Playhead Vertical Marker */}
          <line
            x1={currentX}
            y1={padding.top}
            x2={currentX}
            y2={padding.top + graphHeight}
            stroke="#F8FAFC"
            strokeWidth="1.75"
            strokeDasharray="2 2"
          />
          <circle
            cx={currentX}
            cy={padding.top + 3}
            r="4.5"
            fill="#F8FAFC"
            stroke="#0284C7"
            strokeWidth="2"
          />
        </svg>

        {/* Hover / Active Context Tooltip */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute top-2 bg-slate-950/95 border border-slate-700/80 rounded-lg p-2.5 shadow-xl text-xs z-20 backdrop-blur-md max-w-xs"
            style={{
              left: `${Math.min(75, Math.max(5, (getX(hoveredPoint.time) / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
              <span>Time: {formatSeconds(hoveredPoint.time)}</span>
              <span className="text-emerald-400 font-semibold">{hoveredPoint.prospectEngagement}% Client Sentiment</span>
            </div>
            {hoveredPoint.sentimentNote && (
              <p className="text-slate-200 text-xs leading-relaxed">
                {hoveredPoint.sentimentNote}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Moment Inspector Bar (synchronously tracks current audio position) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400">Current Moment:</span>
          <span className="font-mono text-slate-200 tabular-nums">
            {formatSeconds(currentTime)}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-300 truncate max-w-md">
            {activeTimelineItem?.sentimentNote || 'Conversation progressing'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] shrink-0">
          <span className="text-sky-400">Rep: {activeTimelineItem?.repEngagement || 75}%</span>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-400">Client: {activeTimelineItem?.prospectEngagement || 70}%</span>
        </div>
      </div>
    </div>
  );
};
