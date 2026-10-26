// Web Audio API zero-dependency chime synthesizer for Solana Memecoin alerts
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

export function isAudioAlertEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const val = localStorage.getItem('solpulse_audio_alerts');
  return val === null ? true : val === 'true';
}

export function setAudioAlertEnabled(enabled: boolean) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('solpulse_audio_alerts', String(enabled));
  }
}

/**
 * Play a high-tech crystal chime when a breakout memecoin is detected
 */
export function playBreakoutChime() {
  if (!isAudioAlertEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic frequencies for high-conviction alpha alert (A5 -> E6 -> A6)
    const notes = [
      { freq: 880, start: now, dur: 0.18 },
      { freq: 1318.5, start: now + 0.08, dur: 0.22 },
      { freq: 1760, start: now + 0.16, dur: 0.35 }
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, note.start);

      // Smooth attack and decay
      gain.gain.setValueAtTime(0.001, note.start);
      gain.gain.exponentialRampToValueAtTime(0.12, note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(note.start);
      osc.stop(note.start + note.dur);
    });
  } catch {
    // Graceful fallback if user hasn't interacted with page yet
  }
}

/**
 * Play a subtle click feedback for rapid order routing
 */
export function playQuickActionClick() {
  if (!isAudioAlertEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore audio errors
  }
}
