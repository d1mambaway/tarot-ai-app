/**
 * Synthesized sound effects using Web Audio API
 * No external audio files needed — sounds are generated in-browser
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Card flip whoosh sound — short filtered noise burst */
export function playFlipSound() {
  const c = getCtx();
  if (!c) return;

  const t = c.currentTime;
  const duration = 0.15;
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);

  for (let i = 0; i < len; i++) {
    const progress = i / len;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 1.5) * 0.3;
  }

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(600, t + duration);
  filter.Q.value = 1.5;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(t);
}

/** Mystical chime — ascending arpeggio when all cards are revealed */
export function playRevealChime() {
  const c = getCtx();
  if (!c) return;

  const t = c.currentTime;
  // C5 → E5 → G5 → C6 (major arpeggio)
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = t + i * 0.1;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.06, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.0);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 1.0);
  });
}
