/* ===========================================================
   SOUND — everything is synthesized with WebAudio (no audio files).
   Short effects for dice, hits and choices, and a quiet ambient
   drone that changes with the place you're in.
   =========================================================== */

const SETTINGS_KEY = 'florians-axe-settings-v1';
const Settings = {
  data: { sfx: true, music: true, musicVol: 0.7, pacing: true, voice: undefined, voiceName: 'auto', voiceRate: 0.95, musicV: 2 },
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (saved.musicV !== 2) { delete saved.music; }   // the old drone was off by default; the new score is on
      Object.assign(Settings.data, saved);
    } catch (e) { /* ignore */ }
  },
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
    // iOS: treat game audio as media (plays even with the ringer switch on silent)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* unsupported */ }
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

  /* Scene music is handled by the Music score (js/music.js). */
  ambient(key) {
    if (typeof Music === 'undefined') return;
    if (UI.fast) return;
    Music.play(key);
  },
  stopAmbient() { if (typeof Music !== 'undefined') Music.stop(); },
};
