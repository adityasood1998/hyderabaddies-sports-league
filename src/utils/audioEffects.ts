// Synthesized Web Audio API effects + Arcade Mortal Kombat Announcer for Flat 2110

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function speakArcadePhrase(text: string, pitch = 0.35, rate = 0.82) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Web Audio synth handles primary sound even if speechSynthesis is unavailable
  }
}

export type MKPhrase = 'ROUND 1' | 'FIGHT!' | 'FATALITY!' | 'FLAWLESS VICTORY';

export function playMortalKombatAnnouncer(phrase: MKPhrase): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (phrase === 'ROUND 1') {
    // Deep martial arts temple gong + rising synth
    playGongHit(ctx, now, 110, 1.4);
    playBrassNote(ctx, now + 0.12, 146.83, 0.45);
    playBrassNote(ctx, now + 0.45, 164.81, 0.55);
    speakArcadePhrase('Round One', 0.4, 0.85);
  } else if (phrase === 'FIGHT!') {
    // Aggressive power chord + explosive percussive hit
    playGongHit(ctx, now, 82.41, 0.9);
    playBrassNote(ctx, now, 220, 0.35);
    playBrassNote(ctx, now + 0.05, 329.63, 0.45);
    playNoiseImpact(ctx, now, 0.35);
    speakArcadePhrase('Fight!', 0.3, 0.95);
  } else if (phrase === 'FATALITY!') {
    // Ominous descending minor doom chord
    playGongHit(ctx, now, 65.41, 2.0);
    playBrassNote(ctx, now + 0.1, 196.0, 0.5);
    playBrassNote(ctx, now + 0.55, 185.0, 0.5);
    playBrassNote(ctx, now + 1.0, 155.56, 0.9);
    speakArcadePhrase('Fatality!', 0.2, 0.72);
  } else if (phrase === 'FLAWLESS VICTORY') {
    // Heroic championship fanfare triad
    playGongHit(ctx, now, 98.0, 1.8);
    playBrassNote(ctx, now, 261.63, 0.28);
    playBrassNote(ctx, now + 0.25, 329.63, 0.28);
    playBrassNote(ctx, now + 0.5, 392.0, 0.35);
    playBrassNote(ctx, now + 0.82, 523.25, 0.85);
    speakArcadePhrase('Flawless Victory', 0.35, 0.8);
  }
}

function playGongHit(ctx: AudioContext, startTime: number, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.72, startTime + duration);

  mod.type = 'triangle';
  mod.frequency.setValueAtTime(freq * 1.414, startTime);
  modGain.gain.setValueAtTime(80, startTime);
  modGain.gain.exponentialRampToValueAtTime(1, startTime + duration);

  gain.gain.setValueAtTime(0.45, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  mod.connect(modGain);
  modGain.connect(osc.frequency);
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  mod.start(startTime);
  osc.stop(startTime + duration);
  mod.stop(startTime + duration);
}

function playBrassNote(ctx: AudioContext, startTime: number, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, startTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4, startTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration);

  gain.gain.setValueAtTime(0.01, startTime);
  gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playNoiseImpact(ctx: AudioContext, startTime: number, duration: number) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(420, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(startTime);
}

/**
 * Synthesized Tiger Roar for Sheru the Mascot
 */
export function playTigerRoar(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 1.15;

  // Low guttural sawtooth growl
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.linearRampToValueAtTime(135, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(52, now + duration);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(28, now); // Growl flutter
  lfoGain.gain.setValueAtTime(22, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(680, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + duration);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.42, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  lfo.start(now);
  osc.stop(now + duration);
  lfo.stop(now + duration);

  // Breath roar noise layer
  playNoiseImpact(ctx, now + 0.05, 0.75);
}

/**
 * Playful Puppy Squeaks & Happy Yips for Mia the Beagle
 */
export function playPuppySqueak(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const squeakTimes = [0, 0.18, 0.42];

  squeakTimes.forEach((offset, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = idx === 1 ? 980 : 860;
    osc.frequency.setValueAtTime(baseFreq, now + offset);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + offset + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + offset + 0.14);

    gain.gain.setValueAtTime(0.01, now + offset);
    gain.gain.linearRampToValueAtTime(0.24, now + offset + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + offset);
    osc.stop(now + offset + 0.15);
  });
}

/**
 * Dramatic Broom Swoosh & Scolding Bell for Bai the Maid
 */
export function playMaidScoldSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Broom swoosh (filtered noise sweep)
  const duration = 0.35;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const swooshes = [0, 0.28];
  swooshes.forEach((offset) => {
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now + offset);
    filter.frequency.exponentialRampToValueAtTime(1400, now + offset + 0.18);
    filter.frequency.exponentialRampToValueAtTime(400, now + offset + 0.32);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now + offset);
    gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.34);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now + offset);
  });

  // Dramatic stinger note
  playBrassNote(ctx, now + 0.1, 440, 0.22);
  playBrassNote(ctx, now + 0.32, 554.37, 0.35);
}

/**
 * Wheel of Chores tick & win fanfare
 */
export function playWheelTick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(620, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.045);
}
