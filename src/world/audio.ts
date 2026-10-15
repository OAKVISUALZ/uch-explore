/**
 * audio.ts - Procedural Tropical Ambient Soundscape Synthesizer
 * 
 * Uses Web Audio API to procedurally generate soothing equatorial outdoor soundscapes:
 * gentle morning birdsong and rustling breeze during day, cicadas at sunset,
 * and rhythmic crickets at night. Zero external audio downloads.
 */

import { TimeOfDay } from './lighting';

export class AmbientAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted = true;
  private timeOfDay: TimeOfDay = 'day';

  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private chirpTimer: number | null = null;

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      this.initAudioContext();
      this.startAmbient();
    } else {
      this.stopAmbient();
    }

    return !this.isMuted;
  }

  public isAudioActive(): boolean {
    return !this.isMuted;
  }

  public setTimeOfDay(time: TimeOfDay): void {
    this.timeOfDay = time;
  }

  private initAudioContext(): void {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  private startAmbient(): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // 1. Gentle Wind / Breeze Buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration for warm breeze
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.6;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.noiseNode.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);
    this.noiseNode.start();

    // 2. Periodic Birdsong / Crickets
    this.scheduleNextChirp();
  }

  private scheduleNextChirp(): void {
    if (this.isMuted || !this.ctx) return;

    const delay = this.timeOfDay === 'night' ? 900 + Math.random() * 400 : 3500 + Math.random() * 5000;

    this.chirpTimer = window.setTimeout(() => {
      if (this.timeOfDay === 'night') {
        this.playCricketChirp();
      } else {
        this.playBirdChirp();
      }
      this.scheduleNextChirp();
    }, delay);
  }

  private playBirdChirp(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 2400 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  private playCricketChirp(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4600 + Math.random() * 400, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  private stopAmbient(): void {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    if (this.chirpTimer) {
      clearTimeout(this.chirpTimer);
      this.chirpTimer = null;
    }
  }
}
