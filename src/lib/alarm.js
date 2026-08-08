// Shared alarm sound player.
// Preset ids are synthesised via the Web Audio API (no file needed);
// uploaded http(s) urls are played back as audio.
export function playAlarm(url) {
  if (url && /^https?:\/\//.test(url)) {
    try {
      const a = new Audio(url);
      a.volume = 0.7;
      a.play().catch(() => {});
      setTimeout(() => { try { a.pause(); a.currentTime = 0; } catch {} }, 4000);
    } catch {}
    return;
  }
  playPresetTone(url || "chime");
}

function playPresetTone(id) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
    if (id === "siren") {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.45);
      osc.frequency.linearRampToValueAtTime(420, now + 0.9);
      osc.connect(master);
      osc.start(now);
      osc.stop(now + 1.4);
    } else if (id === "arcade") {
      [523, 659, 784, 1047, 880].forEach((f, i) => beep(ctx, master, f, now + i * 0.12, 0.1));
    } else {
      [880, 1175, 1568].forEach((f, i) => beep(ctx, master, f, now + i * 0.18, 0.32));
    }
    setTimeout(() => { try { ctx.close(); } catch {} }, 4000);
  } catch {}
}

function beep(ctx, master, freq, start, dur) {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(0.3, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}