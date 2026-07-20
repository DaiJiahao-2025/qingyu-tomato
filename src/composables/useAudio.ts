// ============================================================
// Audio subsystem — Web Audio API + HTMLAudioElement wrapper.
// Pure functions (no Vue reactivity). Accept params, don't read store.
// ============================================================

interface AudioEngine {
  ctx: AudioContext;
  master: GainNode;
  nodes: AudioNode[];
}

interface MusicTrack {
  id: string;
  tone: "rain" | "cafe" | "fire";
  src: string;
}

let audioEngine: AudioEngine | null = null;
let musicAudio: HTMLAudioElement | null = null;
let voiceAudio: HTMLAudioElement | null = null;

// ---- Web Audio Engine (lazy singleton) ----

function getAudioEngine(): AudioEngine | null {
  if (audioEngine) return audioEngine;
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return null;
  const ctx = new AudioContextCtor();
  const master = ctx.createGain();
  master.gain.value = 0.25;
  master.connect(ctx.destination);
  audioEngine = { ctx, master, nodes: [] };
  return audioEngine;
}

// ---- Voice playback ----

export function playVoice(
  source: string | null,
  volume: number,
  muted: boolean,
  onFallback: () => void
): void {
  if (muted) return;
  if (!source) {
    onFallback();
    return;
  }
  if (voiceAudio) {
    voiceAudio.pause();
    voiceAudio = null;
  }
  voiceAudio = new Audio(source);
  voiceAudio.volume = volume;
  voiceAudio.addEventListener("error", () => onFallback(), { once: true });
  voiceAudio.play().catch(() => onFallback());
}

export function speakLine(line: string, volume: number): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = "zh-CN";
    utterance.volume = volume;
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    return;
  }
  softBeep(volume);
}

// ---- Background music ----

export function startMusic(
  musicId: string,
  volume: number,
  muted: boolean,
  catalog: MusicTrack[]
): void {
  if (muted) return;
  const engine = getAudioEngine();
  if (!engine) return;
  stopMusic(false);
  engine.ctx.resume();
  engine.master.gain.value = volume;
  const music = catalog.find((m) => m.id === musicId) || catalog[0];
  if (!music) return;

  if (music.src) {
    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      startGeneratedMusic(engine, music);
    };
    musicAudio = new Audio(music.src);
    musicAudio.loop = true;
    musicAudio.volume = volume;
    musicAudio.addEventListener("error", fallback, { once: true });
    musicAudio.play().catch(fallback);
    return;
  }
  startGeneratedMusic(engine, music);
}

export function stopMusic(close = true): void {
  if (musicAudio) {
    musicAudio.pause();
    musicAudio = null;
  }
  if (!audioEngine) return;
  audioEngine.nodes.forEach((node) => {
    try {
      if (typeof (node as any).stop === "function") (node as any).stop();
      if (typeof node.disconnect === "function") node.disconnect();
    } catch {
      // Already stopped
    }
  });
  audioEngine.nodes = [];
  if (close) updateMusicVolume();
}

export function updateMusicVolume(volume?: number): void {
  if (volume !== undefined && audioEngine) {
    audioEngine.master.gain.value = volume;
    if (musicAudio) musicAudio.volume = volume;
  }
}

// ---- Generated ambient music (fallback when mp3 unavailable) ----

function startGeneratedMusic(engine: AudioEngine, music: MusicTrack): void {
  if (music.tone === "rain") createNoiseLoop(engine, 900);
  if (music.tone === "cafe") createToneLoop(engine, 146.83, 196);
  if (music.tone === "fire") createNoiseLoop(engine, 180);
}

function createToneLoop(engine: AudioEngine, freqA: number, freqB: number): void {
  const oscA = engine.ctx.createOscillator();
  const oscB = engine.ctx.createOscillator();
  const gain = engine.ctx.createGain();
  oscA.frequency.value = freqA;
  oscB.frequency.value = freqB;
  oscA.type = "sine";
  oscB.type = "triangle";
  gain.gain.value = 0.08;
  oscA.connect(gain);
  oscB.connect(gain);
  gain.connect(engine.master);
  oscA.start();
  oscB.start();
  engine.nodes.push(oscA, oscB, gain);
}

function createNoiseLoop(engine: AudioEngine, filterFreq: number): void {
  const bufferSize = engine.ctx.sampleRate * 2;
  const buffer = engine.ctx.createBuffer(1, bufferSize, engine.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const gain = engine.ctx.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  gain.gain.value = 0.1;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(engine.master);
  noise.start();
  engine.nodes.push(noise, filter, gain);
}

// ---- Soft beep (last-resort audio feedback) ----

function softBeep(volume: number): void {
  const engine = getAudioEngine();
  if (!engine) return;
  engine.ctx.resume();
  const osc = engine.ctx.createOscillator();
  const gain = engine.ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 523.25;
  gain.gain.setValueAtTime(Math.max(0.01, volume * 0.16), engine.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, engine.ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(engine.ctx.destination);
  osc.start();
  osc.stop(engine.ctx.currentTime + 0.62);
}
