// Sound effects using Web Audio API — no external files needed
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.12) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playBanSound() {
  playTone(220, 0.25, "sawtooth", 0.08);
  setTimeout(() => playTone(165, 0.35, "sawtooth", 0.06), 80);
}

export function playPickSound() {
  playTone(523, 0.12, "sine", 0.10);
  setTimeout(() => playTone(659, 0.15, "sine", 0.08), 80);
  setTimeout(() => playTone(784, 0.2, "sine", 0.06), 160);
}

export function playConfirmSound() {
  playTone(440, 0.1, "sine", 0.10);
  setTimeout(() => playTone(554, 0.1, "sine", 0.08), 60);
  setTimeout(() => playTone(659, 0.12, "sine", 0.08), 120);
  setTimeout(() => playTone(880, 0.3, "sine", 0.06), 180);
}

export function playTimerWarningSound() {
  playTone(880, 0.08, "square", 0.05);
}

export function playTimerEndSound() {
  playTone(330, 0.3, "sawtooth", 0.10);
  setTimeout(() => playTone(220, 0.5, "sawtooth", 0.08), 200);
}

export function playClickSound() {
  playTone(1200, 0.04, "sine", 0.06);
}

export function playErrorSound() {
  playTone(200, 0.15, "square", 0.08);
  setTimeout(() => playTone(160, 0.25, "square", 0.06), 120);
}

export function playCopySound() {
  playTone(880, 0.06, "sine", 0.07);
  setTimeout(() => playTone(1100, 0.08, "sine", 0.05), 60);
}

export function playTimerTickSound() {
  playTone(1000, 0.06, "sine", 0.10);
}

export function playBankTimeWarning() {
  playTone(660, 0.1, "square", 0.07);
  setTimeout(() => playTone(880, 0.12, "square", 0.05), 100);
}
