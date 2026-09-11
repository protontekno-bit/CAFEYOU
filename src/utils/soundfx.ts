import { SoundEffectType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Memainkan efek suara menggunakan Web Audio API murni (tanpa download file eksternal)
 */
export function playSoundEffect(type: SoundEffectType): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (type) {
    case 'applause':
      playApplause(ctx, now);
      break;
    case 'airhorn':
      playAirhorn(ctx, now);
      break;
    case 'cheer':
      playCheer(ctx, now);
      break;
    case 'drumroll':
      playDrumroll(ctx, now);
      break;
    case 'chime':
      playChime(ctx, now);
      break;
  }
}

// Suara Tepuk Tangan (Applause Synthesis)
function playApplause(ctx: AudioContext, start: number) {
  const bufferSize = ctx.sampleRate * 2.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Noise with randomized burst claps
    const t = i / ctx.sampleRate;
    const burst = Math.sin(t * 15 * Math.PI) > 0.3 ? 1 : 0.4;
    data[i] = (Math.random() * 2 - 1) * burst;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, start);
  filter.Q.setValueAtTime(1.5, start);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, start);
  gain.gain.linearRampToValueAtTime(0.5, start + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 2.5);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(start);
  noise.stop(start + 2.5);
}

// Suara Airhorn / Terompet Kafe
function playAirhorn(ctx: AudioContext, start: number) {
  const notes = [466.16, 466.16, 466.16, 466.16, 622.25]; // Bb4 -> Eb5
  const times = [0, 0.12, 0.24, 0.36, 0.48];
  const durations = [0.09, 0.09, 0.09, 0.09, 0.4];

  notes.forEach((freq, idx) => {
    const t = start + times[idx];
    const dur = durations[idx];

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 1.01, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
  });
}

// Suara Sorak / Hore (Cheer)
function playCheer(ctx: AudioContext, start: number) {
  // Paduan nada ceria
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start + idx * 0.08);

    gain.gain.setValueAtTime(0, start + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.2, start + idx * 0.08 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start + idx * 0.08);
    osc.stop(start + 1.2);
  });
}

// Suara Drumroll
function playDrumroll(ctx: AudioContext, start: number) {
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const t = start + (i * 0.06);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + (i * 2), t);

    gain.gain.setValueAtTime(0.15 + (i * 0.01), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Final cymbal crash
  const cymbalTime = start + (steps * 0.06);
  const bufferSize = ctx.sampleRate * 0.8;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
  }
  const cymbal = ctx.createBufferSource();
  cymbal.buffer = buffer;
  const cymbalGain = ctx.createGain();
  cymbalGain.gain.setValueAtTime(0.3, cymbalTime);
  cymbalGain.gain.exponentialRampToValueAtTime(0.001, cymbalTime + 0.8);
  cymbal.connect(cymbalGain);
  cymbalGain.connect(ctx.destination);
  cymbal.start(cymbalTime);
}

// Suara Chime / Ting
function playChime(ctx: AudioContext, start: number) {
  const notes = [1318.51, 1567.98, 2093.0]; // E6, G6, C7
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start + idx * 0.1);

    gain.gain.setValueAtTime(0.2, start + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, start + idx * 0.1 + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start + idx * 0.1);
    osc.stop(start + idx * 0.1 + 1.2);
  });
}
