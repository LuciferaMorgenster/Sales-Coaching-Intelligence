/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeakerId = 'Speaker A' | 'Speaker B';
export type SpeakerRole = 'Sales Rep' | 'Prospect';

export interface Utterance {
  id: string;
  speaker: SpeakerId;
  speakerRole: SpeakerRole;
  speakerName: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  sentiment: 'positive' | 'neutral' | 'hesitant' | 'objection' | 'negative';
  keyTakeaway?: string;
}

export interface SentimentPoint {
  time: number; // seconds into call
  repEngagement: number; // 0 - 100
  prospectEngagement: number; // 0 - 100
  sentimentNote?: string;
  sentimentType?: 'high_rapport' | 'objection' | 'hesitation' | 'interest' | 'neutral';
}

export interface CoachingItem {
  id: string;
  title: string;
  description: string;
  transcriptExcerpt: string;
  timestamp: number; // in seconds where it occurred
  impactCategory: 'Discovery' | 'Value Proposition' | 'Objection Handling' | 'Closing' | 'Active Listening' | 'Next Steps';
  recommendedTalkTrack?: string;
}

export interface CoachingCard {
  salespersonStrengths: CoachingItem[]; // Exactly 3 things done well
  missedOpportunities: CoachingItem[]; // Exactly 3 missed opportunities
  overallExecutiveSummary: string;
  consultativeScore: number; // 0 - 100
  keyThemes: string[];
}

export interface CallAnalysis {
  id: string;
  title: string;
  dealContext: string;
  salesRepName: string;
  prospectName: string;
  durationSeconds: number;
  talkRatio: {
    repPercentage: number;
    prospectPercentage: number;
  };
  metrics: {
    repQuestions: number;
    prospectQuestions: number;
    longestMonologueSeconds: number;
    customerSentimentTrend: 'Upward' | 'Steady' | 'Volatile' | 'Downward';
  };
  transcript: Utterance[];
  sentimentTimeline: SentimentPoint[];
  coachingCard: CoachingCard;
  audioBlobUrl?: string;
  isCustomUpload?: boolean;
}
