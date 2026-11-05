/* ===========================================================
   SOUND — everything is synthesized with WebAudio (no audio files).
   Short effects for dice, hits and choices, and a quiet ambient
   drone that changes with the place you're in.
   =========================================================== */

const SETTINGS_KEY = 'florians-axe-settings-v1';
const Settings = {
  data: { sfx: true, music: false, pacing: true },
  load() { try { Object.assign(Settings.data, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* ignore */ } },
  save() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(Settings.data)); } catch (e) { /* ignore */ } },
};
Settings.load();

const Sound = {
  ctx: null, master: null, amb: null, ambKey: null,

  ensure() {
    if (Sound.ctx) return Sound.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    Sound.ctx = new AC();
    Sound.master = Sound.ctx.createGain();
    Sound.master.gain.value = 0.5;
    Sound.master.connect(Sound.ctx.destination);
    return Sound.ctx;
  },

  tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slide) {
    const c = Sound.ctx; const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(Sound.master); o.start(t); o.stop(t + dur + 0.05);
  },

  noise(dur, vol = 0.2, when = 0, filter = 1200) {
    const c = Sound.ctx; const t = c.currentTime + when;
    const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(Sound.master); src.start(t);
  },

  play(name) {
    if (!Settings.data.sfx || UI.fast) return;
    if (!Sound.ensure()) return;
    if (Sound.ctx.state === 'suspended') Sound.ctx.resume();
    const T = Sound.tone, N = Sound.noise;
    switch (name) {
      case 'click': T(520, 0.06, 'triangle', 0.08); break;
      case 'dice': for (let i = 0; i < 6; i++) { N(0.04, 0.18, i * 0.07, 2500); T(300 + Math.random() * 400, 0.03, 'square', 0.03, i * 0.07); } break;
      case 'success': T(523, 0.15, 'triangle', 0.15); T(659, 0.15, 'triangle', 0.15, 0.1); T(784, 0.3, 'triangle', 0.15, 0.2); break;
      case 'crit': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.35, 'triangle', 0.15, i * 0.08)); break;
      case 'fail': T(220, 0.35, 'sawtooth', 0.08, 0, 140); break;
      case 'hit': N(0.12, 0.3, 0, 900); T(140, 0.12, 'square', 0.07, 0, 70); break;
      case 'miss': N(0.15, 0.08, 0, 3000); break;
      case 'hurt': N(0.18, 0.3, 0, 500); T(110, 0.2, 'sawtooth', 0.08, 0, 60); break;
      case 'heal': [392, 523, 659].forEach((f, i) => T(f, 0.4, 'sine', 0.1, i * 0.06)); break;
      case 'hollow': T(90, 1.2, 'sine', 0.2, 0, 45); N(1.0, 0.06, 0, 400); break;
      case 'boss': T(70, 0.9, 'sawtooth', 0.12, 0, 50); T(105, 0.9, 'sawtooth', 0.08); break;
      case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.25, 'triangle', 0.12, i * 0.07)); break;
      case 'victory': [392, 523, 659, 784, 1047].forEach((f, i) => T(f, 0.6, 'triangle', 0.13, i * 0.15)); break;
      case 'defeat': [330, 294, 262, 196].forEach((f, i) => T(f, 0.7, 'sine', 0.12, i * 0.3)); break;
      case 'coin': T(1319, 0.08, 'square', 0.05); T(1760, 0.12, 'square', 0.05, 0.06); break;
    }
  },

  /* Ambient drone: two detuned oscillators through a slow filter sweep. */
  AMBIENT: {
    town: [196, 294], village: [174, 261], tavern: [164, 246], road: [220, 330], mire: [110, 164], mines: [98, 147], harbor: [196, 293],
    barrow: [123, 185], peak: [233, 349], orchard: [261, 392], court: [247, 370], wych: [82, 123], fortress: [73, 110], camp: [147, 220],
    dawn: [261, 392], grey: [65, 98],
  },
  ambient(key) {
    if (!Settings.data.music || UI.fast) { Sound.stopAmbient(); return; }
    if (key === Sound.ambKey && Sound.amb) return;
    if (!Sound.ensure()) return;
    Sound.stopAmbient();
    const c = Sound.ctx, [f1, f2] = Sound.AMBIENT[key] || Sound.AMBIENT.road;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 2);
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
    const lfo = c.createOscillator(), lfoG = c.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 300; lfo.connect(lfoG); lfoG.connect(filt.frequency);
    const oscs = [f1, f1 * 1.005, f2].map((f, i) => { const o = c.createOscillator(); o.type = i === 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.connect(filt); o.start(); return o; });
    filt.connect(g); g.connect(Sound.master); lfo.start();
    Sound.amb = { g, oscs, lfo }; Sound.ambKey = key;
  },
  stopAmbient() {
    if (!Sound.amb) return;
    const { g, oscs, lfo } = Sound.amb, c = Sound.ctx;
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1);
    setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop(); }, 1100);
    Sound.amb = null; Sound.ambKey = null;
  },
};
