/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Upload,
  ChevronDown,
  Layers,
  HelpCircle,
  Clock,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { CallAnalysis } from '../types/sales';

interface HeaderProps {
  currentCall: CallAnalysis;
  allCalls: CallAnalysis[];
  onSelectCall: (callId: string) => void;
  onOpenIntakeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCall,
  allCalls,
  onSelectCall,
  onOpenIntakeModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold text-sm tracking-wider">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">
                Sales Coaching Intelligence
              </span>
              <span className="text-[10px] uppercase font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Conversation Diarization · Engagement Telemetry · Consultative Coaching
            </p>
          </div>
        </div>

        {/* Call Selector & Primary Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Call Selector Dropdown */}
          <div className="relative">
            <select
              value={currentCall.id}
              onChange={(e) => onSelectCall(e.target.value)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-sky-500 font-medium max-w-[180px] sm:max-w-[260px] truncate"
            >
              {allCalls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Upload / Record Action Button */}
          <button
            onClick={onOpenIntakeModal}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-xs shadow-sky-500/20 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload / Record Call</span>
            <span className="sm:hidden">Intake</span>
          </button>
        </div>
      </div>
    </header>
  );
};
