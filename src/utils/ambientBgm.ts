/**
 * CAFEYOU — Standby Ambient Background Music (BGM)
 * Menggunakan Web Audio API murni untuk menghasilkan synth pad / electric piano chord
 * yang sangat lembut, menenangkan, dan mengisi jeda panggung saat antrean kosong.
 * 100% bebas lisensi, tidak membebani kuota, dan berhenti otomatis saat lagu baru masuk.
 */

let bgmAudioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let loopTimer: any = null;

function getBgmContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!bgmAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      bgmAudioCtx = new AudioContextClass();
    }
  }
  if (bgmAudioCtx && bgmAudioCtx.state === 'suspended') {
    bgmAudioCtx.resume().catch(() => {});
  }
  return bgmAudioCtx;
}

// Chord progression: Cmaj9 -> Am9 -> Fmaj7 -> Gsus4 (Harmoni Lounge Hangat)
const CHORD_PROGRESSION = [
  [130.81, 164.81, 196.0, 246.94, 293.66], // C3, E3, G3, B3, D4 (Cmaj9)
  [110.0, 130.81, 164.81, 196.0, 246.94], // A2, C3, E3, G3, B3 (Am9)
  [87.31, 130.81, 174.61, 220.0, 261.63],  // F2, C3, F3, A3, C4 (Fmaj7)
  [98.0, 146.83, 196.0, 220.0, 293.66],   // G2, D3, G3, A3, D4 (Gsus4)
];

let currentChordIdx = 0;

function playLoungePadChord(ctx: AudioContext, parentGain: GainNode) {
  if (!isPlaying) return;

  const notes = CHORD_PROGRESSION[currentChordIdx];
  currentChordIdx = (currentChordIdx + 1) % CHORD_PROGRESSION.length;

  const chordDuration = 5.5; // Durasi per chord dalam detik
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    try {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft Warm Sine + Triangle Wave
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass Filter lembut untuk suara ala electric piano / warm ambient pad
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + (idx * 60), now);
      filter.Q.setValueAtTime(1.0, now);

      // Slow swell attack and gentle release
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.05 / (idx + 1), now + 1.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(parentGain);

      osc.start(now);
      osc.stop(now + chordDuration);
    } catch {}
  });

  // Jadwalkan chord berikutnya sedikit bertumpuk (smooth cross-fade)
  loopTimer = setTimeout(() => {
    if (isPlaying && bgmAudioCtx) {
      playLoungePadChord(bgmAudioCtx, parentGain);
    }
  }, (chordDuration - 0.8) * 1000);
}

/**
 * Memulai Ambient BGM santai
 */
export function startAmbientBgm(volume = 0.25): void {
  if (isPlaying) return;

  const ctx = getBgmContext();
  if (!ctx) return;

  isPlaying = true;
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), ctx.currentTime + 2.0);
  masterGain.connect(ctx.destination);

  currentChordIdx = 0;
  playLoungePadChord(ctx, masterGain);
}

/**
 * Menghentikan Ambient BGM dengan smooth fade-out
 */
export function stopAmbientBgm(): void {
  if (!isPlaying) return;
  isPlaying = false;

  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }

  if (masterGain && bgmAudioCtx) {
    try {
      const now = bgmAudioCtx.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      setTimeout(() => {
        try {
          masterGain?.disconnect();
          masterGain = null;
        } catch {}
      }, 1300);
    } catch {
      masterGain = null;
    }
  }
}

/**
 * Mengatur volume BGM saat runtime
 */
export function setAmbientBgmVolume(volume: number): void {
  if (masterGain && bgmAudioCtx) {
    try {
      const clamped = Math.max(0.0001, Math.min(1.0, volume));
      masterGain.gain.setTargetAtTime(clamped, bgmAudioCtx.currentTime, 0.1);
    } catch {}
  }
}

export function isAmbientBgmPlaying(): boolean {
  return isPlaying;
}
