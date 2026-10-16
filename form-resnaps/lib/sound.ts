// Pustaka efek suara sintetis (Web Audio API murni) tanpa file eksternal.
// Digunakan untuk umpan balik instan pada layar gerbang panitia dan layar sukses tamu.

let audioCtx: AudioContext | null = null;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext: typeof AudioContext;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      if (typeof window.AudioContext !== "undefined") {
        audioCtx = new window.AudioContext();
      } else if ("webkitAudioContext" in window) {
        const win = window as unknown as WindowWithWebkitAudio;
        audioCtx = new win.webkitAudioContext();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Nada lonceng sukses merdu (akord C-E-G harmonik) */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.55);
  });
}

/** Bunyi blip futuristik saat kamera berhasil memindai */
export function playScanBlip() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, now); // A5
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // Naik ke A6

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

/** Nada peringatan lembut saat ada kendala / sesi habis */
export function playWarningTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [330, 311.13].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0.1, now + idx * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 0.2);
  });
}
