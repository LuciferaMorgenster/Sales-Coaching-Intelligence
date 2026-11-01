/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Utterance } from '../types/sales';

/**
 * Creates an authentic audio WAV buffer containing dual-speaker synthesized dialogue
 * cadence for sample calls using Web Audio API offline rendering.
 * This guarantees users hear real audio during playback even before uploading their own call.
 */
export async function generateSyntheticCallAudio(
  utterances: Utterance[],
  totalDurationSeconds: number
): Promise<string> {
  const sampleRate = 22050;
  const numSamples = Math.ceil(totalDurationSeconds * sampleRate);

  const offlineCtx = new OfflineAudioContext(1, numSamples, sampleRate);

  // Background subtle office/room room-tone ambience
  const bufferSize = numSamples;
  const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Brown noise filter for soft room tone
    noiseData[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = noiseData[i];
    noiseData[i] *= 0.015; // very quiet
  }

  const roomToneNode = offlineCtx.createBufferSource();
  roomToneNode.buffer = noiseBuffer;
  roomToneNode.connect(offlineCtx.destination);
  roomToneNode.start(0);

  // Generate cadence for each speaker utterance
  utterances.forEach((utt) => {
    const start = Math.max(0, utt.startTime);
    const end = Math.min(totalDurationSeconds, utt.endTime);
    const duration = end - start;
    if (duration <= 0.2) return;

    // Pitch: Rep (Speaker A) ~ 170Hz with harmonics, Prospect (Speaker B) ~ 220Hz with harmonics
    const isRep = utt.speaker === 'Speaker A';
    const baseFreq = isRep ? 175 : 225;

    // We create conversational syllable pulses throughout the utterance duration
    const syllablesPerSec = 4.2; // average natural speech rate
    const syllableCount = Math.floor(duration * syllablesPerSec);

    for (let s = 0; s < syllableCount; s++) {
      const sylStart = start + s / syllablesPerSec + (Math.random() * 0.04 - 0.02);
      const sylDuration = 0.16 + Math.random() * 0.06;
      if (sylStart + sylDuration > end) break;

      // Slight natural intonation fluctuation
      const pitchInflection = baseFreq + Math.sin((s / syllableCount) * Math.PI) * 18 + (Math.random() * 12 - 6);

      const osc = offlineCtx.createOscillator();
      const osc2 = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      const filter = offlineCtx.createBiquadFilter();

      osc.type = isRep ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(pitchInflection, sylStart);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(pitchInflection * 2, sylStart);

      // Formant-like bandpass filter for vocal warmth
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isRep ? 750 : 1100, sylStart);
      filter.Q.setValueAtTime(3.0, sylStart);

      gain.gain.setValueAtTime(0.0001, sylStart);
      gain.gain.linearRampToValueAtTime(0.12, sylStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, sylStart + sylDuration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(sylStart);
      osc.stop(sylStart + sylDuration);
      osc2.start(sylStart);
      osc2.stop(sylStart + sylDuration);
    }
  });

  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWavUrl(renderedBuffer);
}

/**
 * Converts an AudioBuffer to an in-memory WAV file Blob URL
 */
function bufferToWavUrl(buffer: AudioBuffer): string {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < data.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
