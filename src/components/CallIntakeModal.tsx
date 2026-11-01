/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Mic,
  Square,
  FileAudio,
  CheckCircle,
  Loader2,
  X,
  Sparkles,
  PlayCircle,
  Radio,
  FileText,
} from 'lucide-react';
import { CallAnalysis } from '../types/sales';
import { SAMPLE_CALLS } from '../data/sampleCalls';

interface CallIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (call: CallAnalysis, audioUrl: string) => void;
  onSelectSample: (sampleId: string) => void;
}

export const CallIntakeModal: React.FC<CallIntakeModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  onSelectSample,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'samples'>('samples');
  const [dealContext, setDealContext] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  // File drag & drop handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  // Start live microphone recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Microphone access denied or unavailable: ' + (err.message || ''));
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Convert Blob or File to Base64
  const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Trigger Gemini Analysis pipeline on custom audio
  const handleAnalyze = async () => {
    const targetAudio = selectedFile || recordedBlob;
    if (!targetAudio) {
      setErrorMessage('Please select or record an audio file first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep('Uploading audio and launching Gemini intelligence pipeline...');

    try {
      const audioBase64 = await fileToBase64(targetAudio);
      const audioUrl = URL.createObjectURL(targetAudio);

      setAnalysisStep('Transcribing speech & diarizing Speaker A vs Speaker B with gemini-3.5-transcribe...');

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: targetAudio.type || 'audio/webm',
          fileName: selectedFile?.name || 'mic_recording.webm',
          callContext: dealContext,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      setAnalysisStep('Generating sentiment timeline & consultative coaching card...');
      const analyzedData: CallAnalysis = await response.json();

      onAnalysisComplete(analyzedData, audioUrl);
      onClose();
    } catch (err: any) {
      console.error('Call analysis failed:', err);
      setErrorMessage(
        err.message || 'Failed to analyze sales call audio. Please ensure GEMINI_API_KEY is configured in Settings > Secrets.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Sales Call Intelligence Intake
              </h3>
              <p className="text-xs text-slate-400">
                Upload call recording, capture microphone audio, or inspect preloaded B2B scenarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'samples'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preloaded Sample Calls (3)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Audio File
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'record'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Record Live Microphone
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* TAB 1: PRELOADED SAMPLES */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Instantly load authentic consultative B2B sales conversations with full diarization, synced audio, and AI coaching:
              </p>

              <div className="space-y-2.5">
                {SAMPLE_CALLS.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => {
                      onSelectSample(call.id);
                      onClose();
                    }}
                    className="group bg-slate-950/60 border border-slate-800 hover:border-sky-500/60 rounded-xl p-3.5 cursor-pointer transition-all hover:bg-slate-950/90"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                          {call.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {call.dealContext}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                          <span>Rep: {call.salesRepName}</span>
                          <span aria-hidden="true">·</span>
                          <span>Prospect: {call.prospectName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-emerald-400">{call.coachingCard.consultativeScore}/100 Score</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors text-slate-400 shrink-0">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD AUDIO FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center space-y-3 bg-slate-950/40 transition-colors cursor-pointer"
                onClick={() => document.getElementById('audio-file-input')?.click()}
              >
                <input
                  id="audio-file-input"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {selectedFile ? selectedFile.name : 'Click or drag sales call audio here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports MP3, WAV, M4A, WEBM, OGG (Up to 50MB)
                  </p>
                </div>
              </div>

              {/* Deal Context Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Deal Context / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp $150K ERP Discovery Call with VP Supply Chain"
                  value={dealContext}
                  onChange={(e) => setDealContext(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: RECORD LIVE MIC */}
          {activeTab === 'record' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-slate-950 border border-slate-800">
                <Mic
                  className={`w-8 h-8 transition-colors ${
                    isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
                  {Math.floor(recordingSeconds / 60)}:
                  {(recordingSeconds % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isRecording
                    ? 'Recording live audio from your microphone...'
                    : recordedBlob
                    ? 'Recording complete and ready for analysis'
                    : 'Click start to record your roleplay or live sales pitch'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-2 transition-colors"
                  >
                    <Radio className="w-4 h-4" />
                    <span>{recordedBlob ? 'Record Again' : 'Start Recording'}</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2 transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current text-rose-500" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>

              {recordedBlob && (
                <div className="pt-2 text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Audio captured ({Math.round(recordedBlob.size / 1024)} KB)</span>
                </div>
              )}
            </div>
          )}

          {/* Analysis Progress Loading State */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-800/40 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sky-400 text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Audio with Gemini AI</span>
              </div>
              <p className="text-xs text-slate-300">{analysisStep}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {(activeTab === 'upload' || activeTab === 'record') && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!selectedFile && !recordedBlob)}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-500/20"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Sales Coaching Intelligence</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
