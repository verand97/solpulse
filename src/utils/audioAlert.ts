// Web Audio API zero-dependency chime synthesizer for Solana Memecoin alerts
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let limiter: DynamicsCompressorNode | null = null;

// Track last play time per sound key to prevent acoustic clutter & clipping
const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 600;

function initAudioGraph(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Master Limiter to prevent clipping and protect hearing
      limiter = audioCtx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-12, audioCtx.currentTime);
      limiter.knee.setValueAtTime(8, audioCtx.currentTime);
      limiter.ratio.setValueAtTime(16, audioCtx.currentTime);
      limiter.attack.setValueAtTime(0.003, audioCtx.currentTime);
      limiter.release.setValueAtTime(0.2, audioCtx.currentTime);

      // Master Volume Gain
      masterGain = audioCtx.createGain();
      const vol = isAudioAlertEnabled() ? getAlertVolume() : 0.0;
      masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);

      masterGain.connect(limiter);
      limiter.connect(audioCtx.destination);
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global user interaction warmup to satisfy modern browser autoplay policies
if (typeof window !== 'undefined') {
  const warmUp = () => {
    initAudioGraph();
    window.removeEventListener('pointerdown', warmUp);
    window.removeEventListener('keydown', warmUp);
  };
  window.addEventListener('pointerdown', warmUp, { passive: true, once: true });
  window.addEventListener('keydown', warmUp, { passive: true, once: true });
}

export function isAudioAlertEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const val = localStorage.getItem('solpulse_audio_alerts');
  return val === null ? true : val === 'true';
}

export function setAudioAlertEnabled(enabled: boolean) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('solpulse_audio_alerts', String(enabled));
  }
  if (masterGain && audioCtx) {
    const targetVol = enabled ? getAlertVolume() : 0.0;
    masterGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.03);
  }
}

export function getAlertVolume(): number {
  if (typeof localStorage === 'undefined') return 0.6;
  const val = localStorage.getItem('solpulse_audio_volume');
  if (val === null) return 0.6;
  const num = parseFloat(val);
  return isNaN(num) ? 0.6 : Math.max(0, Math.min(1, num));
}

export function setAlertVolume(volume: number) {
  const clamped = Math.max(0, Math.min(1, volume));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('solpulse_audio_volume', clamped.toFixed(2));
  }
  if (masterGain && audioCtx && isAudioAlertEnabled()) {
    masterGain.gain.setTargetAtTime(clamped, audioCtx.currentTime, 0.03);
  }
}

function checkCooldown(key: string): boolean {
  const now = Date.now();
  const last = cooldownMap.get(key) || 0;
  if (now - last < COOLDOWN_MS) return false;
  cooldownMap.set(key, now);
  return true;
}

/**
 * Play a high-tech crystal chime when a breakout memecoin is detected
 * Dual-harmonic synthesizer (A5 -> E6 -> A6) with soft resonance
 */
export function playBreakoutChime() {
  if (!isAudioAlertEnabled()) return;
  if (!checkCooldown('breakout')) return;

  try {
    const ctx = initAudioGraph();
    if (!ctx || !masterGain) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: now, dur: 0.22, gain: 0.20 },
      { freq: 1318.5, start: now + 0.08, dur: 0.28, gain: 0.22 },
      { freq: 1760, start: now + 0.16, dur: 0.42, gain: 0.25 }
    ];

    notes.forEach(note => {
      // Primary crystal tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, note.start);

      // Subtle 2nd harmonic overtone for crystalline shimmer
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(note.freq * 2, note.start);

      gain.gain.setValueAtTime(0.0001, note.start);
      gain.gain.exponentialRampToValueAtTime(note.gain, note.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.dur);

      overtoneGain.gain.setValueAtTime(0.0001, note.start);
      overtoneGain.gain.exponentialRampToValueAtTime(note.gain * 0.25, note.start + 0.01);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.dur * 0.6);

      osc.connect(gain);
      overtone.connect(overtoneGain);

      gain.connect(masterGain!);
      overtoneGain.connect(masterGain!);

      osc.start(note.start);
      osc.stop(note.start + note.dur);
      overtone.start(note.start);
      overtone.stop(note.start + note.dur * 0.6);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a cautionary low dual-tone warning pulse when a rug or high risk is flagged
 */
export function playRiskWarningChime() {
  if (!isAudioAlertEnabled()) return;
  if (!checkCooldown('warning')) return;

  try {
    const ctx = initAudioGraph();
    if (!ctx || !masterGain) return;

    const now = ctx.currentTime;
    // Lower cautionary descending intervals (Eb4 -> Bb3)
    const tones = [
      { freq: 311.13, start: now, dur: 0.14 },
      { freq: 233.08, start: now + 0.12, dur: 0.26 }
    ];

    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(t.freq, t.start);

      // Warm low-pass filter to prevent harshness
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t.start);

      gain.gain.setValueAtTime(0.0001, t.start);
      gain.gain.exponentialRampToValueAtTime(0.18, t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t.start + t.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain!);

      osc.start(t.start);
      osc.stop(t.start + t.dur);
    });
  } catch {
    // Ignore audio error
  }
}

/**
 * Play a brief confirmation chirp for successful user actions (e.g., watchlist add, wallet connected)
 */
export function playSuccessChime() {
  if (!isAudioAlertEnabled()) return;
  if (!checkCooldown('success')) return;

  try {
    const ctx = initAudioGraph();
    if (!ctx || !masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.08); // G6

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Ignore audio error
  }
}

/**
 * Play a subtle tactile click feedback for rapid order routing & button clicks
 */
export function playQuickActionClick() {
  if (!isAudioAlertEnabled()) return;
  try {
    const ctx = initAudioGraph();
    if (!ctx || !masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Ignore audio errors
  }
}
