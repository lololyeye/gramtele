/**
 * All sound is synthesized with WebAudio, so there are no audio files. The context is only
 * created after a user gesture when the player unmutes, which respects autoplay rules.
 */
import type { Settings } from '../game/types';

type Sfx = 'key' | 'enter' | 'message' | 'notify' | 'click' | 'error';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ui: GainNode | null = null;
  private keys: GainNode | null = null;
  private ambient: GainNode | null = null;
  private master: GainNode | null = null;
  private s: Settings['sound'] = { master: 0.7, ui: 0.6, keys: 0.3, ambient: 0.3, muted: true };

  apply(s: Settings['sound']) {
    this.s = s;
    if (!s.muted) this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master!.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.03);
    this.ui!.gain.setTargetAtTime(s.ui, t, 0.03);
    this.keys!.gain.setTargetAtTime(s.keys, t, 0.03);
    this.ambient!.gain.setTargetAtTime(s.ambient * 0.5, t, 0.25);
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private ensure() {
    if (this.ctx || typeof AudioContext === 'undefined') return;
    const c = new AudioContext();
    this.ctx = c;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.ui = c.createGain();
    this.keys = c.createGain();
    this.ambient = c.createGain();
    this.ui.connect(this.master);
    this.keys.connect(this.master);
    this.ambient.connect(this.master);
    this.startRoomTone(c, this.ambient);
  }

  /** A low room tone: filtered noise with a slow drift, like a server closet through a wall. */
  private startRoomTone(c: AudioContext, out: GainNode) {
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = last * 0.985 + (Math.random() * 2 - 1) * 0.015;
      d[i] = last * 3;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain).connect(lp.frequency);
    src.connect(lp).connect(out);
    src.start();
    lfo.start();
  }

  play(sfx: Sfx) {
    if (this.s.muted || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    const tone = (freq: number, at: number, dur: number, peak: number, out: GainNode, type: OscillatorType = 'sine') => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + at);
      g.gain.linearRampToValueAtTime(peak, t + at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g).connect(out);
      o.start(t + at);
      o.stop(t + at + dur + 0.02);
    };
    switch (sfx) {
      case 'key':
        tone(1400 + Math.random() * 500, 0, 0.018, 0.05, this.keys!, 'square');
        break;
      case 'enter':
        tone(620, 0, 0.04, 0.08, this.keys!, 'square');
        break;
      case 'click':
        tone(880, 0, 0.05, 0.07, this.ui!);
        break;
      case 'message':
        tone(660, 0, 0.14, 0.12, this.ui!);
        tone(880, 0.09, 0.2, 0.1, this.ui!);
        break;
      case 'notify':
        tone(520, 0, 0.22, 0.1, this.ui!, 'triangle');
        break;
      case 'error':
        tone(170, 0, 0.16, 0.14, this.ui!, 'sawtooth');
        break;
    }
  }
}

export const audio = new AudioEngine();
