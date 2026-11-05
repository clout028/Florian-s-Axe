/* ===========================================================
   MUSIC — an original, generative soundtrack synthesized live
   with WebAudio (no audio files).

   Every place has its own theme: a key, mode, tempo, chord
   progression and a written melody, played by synthesized harp,
   lute, flute, horns, strings, choir, bells and drums through a
   shared hall reverb. Themes build over a four-pass cycle (pad →
   + bass & melody → + percussion → a quieter breakdown) so a long
   scene never loops flatly. Battles and bosses switch to their own
   cues, with a victory or defeat stinger afterwards.
   =========================================================== */

const MUSIC_SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10],
  hminor: [0, 2, 3, 5, 7, 8, 11], whole: [0, 2, 4, 6, 8, 10],
};

/* Theme data. root = MIDI note of the tonic in the pad register.
   prog = chord roots as scale degrees, one per bar. mel.m = [[degree, beats], …]; null degree = rest.
   Pattern strings are one character per sixteenth step ('.' = silent). */
const THEMES = {
  title: { bpm: 66, beats: 4, root: 50, mode: 'dorian', verb: 0.55, lp: 7500,
    prog: [0, 6, 3, 0, 2, 6, 3, 4],
    pad: { type: 'strings', vol: 0.5 }, sub: 0.5,
    bass: { pat: '1.......5.......', vol: 0.5, from: 1 },
    arp: { inst: 'harp', pat: '0.1.2.3.2.1.2.1.', oct: 1, vol: 0.5, from: 0 },
    mel: { inst: 'flute', oct: 1, vol: 0.9, from: 1, bars: 8, alt: 'horn',
      m: [[4, 1.5], [7, .5], [7, 2], [6, 1], [4, 1], [6, 2], [5, 1.5], [3, .5], [5, 1], [6, 1], [7, 3], [null, 1], [7, 1.5], [6, .5], [4, 2], [6, 1], [7, 1], [8, 2], [9, 1.5], [8, .5], [7, 1], [5, 1], [4, 2], [6, 1], [7, 1]] },
    perc: { f: 'X.......x.......', from: 2 }, tex: ['wind'] },

  town: { bpm: 94, beats: 4, root: 55, mode: 'major', verb: 0.3, lp: 9000,
    prog: [0, 4, 5, 3, 0, 3, 4, 0],
    pad: { type: 'strings', vol: 0.28 },
    bass: { pat: '1...5...1...5...', vol: 0.55 },
    arp: { inst: 'lute', pat: '0.1.2.1.0.1.2.1.', oct: 1, vol: 0.55 },
    mel: { inst: 'flute', oct: 1, vol: 0.85, from: 1, bars: 8,
      m: [[2, 1], [4, 1], [7, 2], [6, 1.5], [5, .5], [4, 2], [5, 1], [4, 1], [2, 1], [4, 1], [3, 2], [2, 1], [1, 1], [2, 1], [4, 1], [7, 1.5], [6, .5], [7, 1], [5, 1], [4, 1], [3, 1], [1, 1], [4, 1], [6, 2], [7, 3], [null, 1]] },
    perc: { f: 'X...x...X...x.x.', x: 'x.x.x.x.x.x.x.x.', from: 2 }, tex: [] },

  village: { bpm: 100, beats: 4, root: 52, mode: 'aeolian', verb: 0.35, lp: 6500,
    prog: [0, 5, 6, 0],
    pad: { type: 'strings', vol: 0.4 }, sub: 0.6,
    bass: { pat: '1.1.1.1.1.1.1.1.', vol: 0.55 },
    arp: { inst: 'pluck', pat: '0.2.0.2.0.2.0.2.', oct: 1, vol: 0.4, from: 1 },
    mel: { inst: 'horn', oct: 1, vol: 0.75, from: 1, bars: 4,
      m: [[0, 1], [2, 1], [4, 2], [5, 2], [4, 1], [2, 1], [6, 2], [5, 1], [4, 1], [4, 2], [2, 1], [0, 1]] },
    perc: { t: 'X.......X.x.....', k: 'X.......X.......', from: 0 }, tex: ['fire'] },

  tavern: { bpm: 122, beats: 4, root: 57, mode: 'mixo', verb: 0.18, lp: 9500,
    prog: [0, 6, 3, 0],
    pad: { type: 'strings', vol: 0.12 },
    bass: { pat: '1...5...1...5...', vol: 0.6 },
    arp: { inst: 'lute', pat: '.0.1.0.1.0.1.0.1', oct: 1, vol: 0.45 },
    mel: { inst: 'reed', oct: 1, vol: 0.7, bars: 4, from: 0,
      m: [[4, .5], [2, .5], [0, .5], [2, .5], [4, 1], [7, 1], [6, 1], [4, 1], [5, .5], [4, .5], [2, 1], [3, .5], [5, .5], [7, .5], [5, .5], [3, 1], [5, 1], [4, .5], [2, .5], [0, .5], [2, .5], [4, 2]] },
    perc: { f: 'X.x.x.X.x.x.X.x.', x: 'x.x.x.x.x.x.x.x.', b: '..x...x...x...x.', from: 0 }, tex: [] },

  road: { bpm: 84, beats: 4, root: 57, mode: 'dorian', verb: 0.32, lp: 9000,
    prog: [0, 6, 3, 0, 2, 6, 3, 4],
    pad: { type: 'strings', vol: 0.22 },
    bass: { pat: '1.......5.......', vol: 0.5, from: 1 },
    arp: { inst: 'lute', pat: '0.1.2.1.0.1.2.1.', oct: 1, vol: 0.5 },
    mel: { inst: 'flute', oct: 1, vol: 0.85, from: 1, bars: 8,
      m: [[0, 1], [2, 1], [4, 1.5], [2, .5], [1, 1], [3, 1], [2, 1], [1, 1], [3, 1.5], [5, .5], [7, 2], [6, 1], [4, 1], [2, 2], [2, 1], [4, 1], [6, 1], [4, 1], [1, 1], [3, 1], [6, 2], [5, 1.5], [3, .5], [5, 1], [7, 1], [4, 2], [6, 1], [4, 1]] },
    perc: { f: 'X.......x...x...', from: 2 }, tex: ['wind'] },

  mire: { bpm: 52, beats: 4, root: 45, mode: 'whole', verb: 0.65, lp: 4200,
    prog: [0, 1, 0, 1], passes: 4,
    pad: { type: 'choir', vol: 0.35 }, sub: 0.8,
    arp: { inst: 'bell', pat: '0...........2...', oct: 2, vol: 0.4, from: 0 },
    mel: { inst: 'bell', oct: 2, vol: 0.55, from: 1, bars: 4, m: [[0, 2], [null, 1], [2, 1], [4, 2], [3, 2], [1, 1.5], [0, .5], [null, 2], [2, 2], [5, 2]] },
    perc: { f: '....X.......x...', from: 2 }, tex: ['water', 'frogs'] },

  mines: { bpm: 78, beats: 4, root: 48, mode: 'dorian', verb: 0.3, lp: 5500,
    prog: [0, 6, 2, 3, 0, 6, 4, 0],
    pad: { type: 'choir', vol: 0.3 }, sub: 0.7,
    bass: { pat: '1...1.1.5...1.1.', vol: 0.7 },
    mel: { inst: 'horn', oct: 0, vol: 0.8, from: 1, bars: 8,
      m: [[0, 2], [2, 1], [4, 1], [6, 2], [4, 1], [2, 1], [2, 2], [4, 1], [6, 1], [3, 2], [2, 1], [1, 1], [0, 1], [0, 1], [2, 1], [4, 1], [6, 1], [6, 1], [4, 1], [2, 1], [4, 2], [2, 1], [1, 1], [0, 3], [null, 1]] },
    perc: { t: 'X.......x.......', c: '....X.......X...', from: 1 }, tex: ['fire'] },

  harbor: { bpm: 104, beats: 3, root: 50, mode: 'mixo', verb: 0.28, lp: 9500,
    prog: [0, 3, 6, 0],
    pad: { type: 'strings', vol: 0.14 },
    bass: { pat: '1.....5.....', vol: 0.55 },
    arp: { inst: 'lute', pat: '0.1.2.1.2.1.', oct: 1, vol: 0.45 },
    mel: { inst: 'reed', oct: 1, vol: 0.62, bars: 4, from: 0,
      m: [[0, 1], [2, .5], [4, .5], [7, 1], [7, 1], [5, .5], [3, .5], [5, 1], [6, 1], [4, .5], [6, .5], [8, 1], [7, 1.5], [4, .5], [0, 1]] },
    perc: { f: 'X.....x.x...', x: 'x.x.x.x.x.x.', from: 1 }, tex: ['water'] },

  barrow: { bpm: 50, beats: 4, root: 40, mode: 'aeolian', verb: 0.7, lp: 4500,
    prog: [0, 5, 3, 4], passes: 4,
    pad: { type: 'choir', vol: 0.45 }, sub: 0.9,
    arp: { inst: 'bell', pat: '0.......2.......', oct: 2, vol: 0.4, from: 1 },
    mel: { inst: 'choir', oct: 2, vol: 0.5, from: 1, bars: 4, m: [[0, 3], [2, 1], [4, 4], [3, 2], [2, 1], [0, 1], [1, 2], [0, 2]] },
    perc: { t: 'X...............', from: 2 }, tex: ['wind'] },

  peak: { bpm: 62, beats: 4, root: 53, mode: 'lydian', verb: 0.6, lp: 9000,
    prog: [0, 1, 4, 0, 0, 1, 5, 4],
    pad: { type: 'strings', vol: 0.3 },
    arp: { inst: 'bell', pat: '0...2...3...2...', oct: 2, vol: 0.38 },
    mel: { inst: 'horn', oct: 1, vol: 0.55, from: 1, bars: 8, alt: 'flute',
      m: [[4, 2], [7, 2], [8, 1], [7, 1], [5, 2], [4, 2], [2, 1], [4, 1], [4, 2], [2, 2], [7, 1.5], [6, .5], [4, 2], [8, 2], [9, 1], [8, 1], [7, 1], [5, 1], [7, 2], [4, 3], [null, 1]] },
    perc: { t: 'X.......x.......', from: 2 }, tex: ['wind'] },

  orchard: { bpm: 74, beats: 4, root: 50, mode: 'major', verb: 0.5, lp: 10000,
    prog: [0, 4, 5, 3, 0, 4, 3, 0],
    pad: { type: 'strings', vol: 0.26 },
    arp: { inst: 'harp', pat: '0.1.2.3.2.1.2.3.', oct: 1, vol: 0.55 },
    bass: { pat: '1.......5.......', vol: 0.45, from: 1 },
    mel: { inst: 'flute', oct: 1, vol: 0.8, from: 1, bars: 8,
      m: [[2, 1], [4, 1], [7, 2], [6, 1.5], [4, .5], [2, 2], [5, 1], [7, 1], [9, 2], [8, 1.5], [7, .5], [5, 1], [3, 1], [2, 1], [4, .5], [5, .5], [7, 2], [8, 1], [6, 1], [4, 2], [3, 1], [5, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 2]] },
    perc: { x: '..x...x...x...x.', from: 3 }, tex: ['wind'] },

  court: { bpm: 114, beats: 3, root: 50, mode: 'hminor', verb: 0.45, lp: 10000,
    prog: [0, 3, 4, 0, 5, 3, 4, 0],
    pad: { type: 'strings', vol: 0.3 },
    bass: { pat: '1...5...5...', vol: 0.5 },
    arp: { inst: 'pluck', pat: '..0...1...2.', oct: 1, vol: 0.4, from: 1 },
    mel: { inst: 'pluck', oct: 1, vol: 0.85, from: 0, bars: 8, alt: 'strings',
      m: [[4, 1], [7, 1], [9, 1], [7, 1], [5, 1], [3, 1], [6, 1], [4, 1], [8, 1], [7, 3], [5, 1], [7, 1], [9, 1], [7, 1], [5, 1], [7, 1], [4, 1], [6, 1], [8, 1], [7, 1.5], [6, .5], [7, 1]] },
    perc: { x: 'X.x.x.', from: 2 }, tex: [] },

  wych: { bpm: 44, beats: 4, root: 42, mode: 'phrygian', verb: 0.75, lp: 3800,
    prog: [0, 1, 0, 1], passes: 4,
    pad: { type: 'choir', vol: 0.4 }, sub: 0.9,
    arp: { inst: 'bell', pat: '0.......3.......', oct: 2, vol: 0.32, from: 1 },
    mel: { inst: 'bell', oct: 2, vol: 0.5, from: 1, bars: 4, m: [[0, 3], [1, 1], [null, 2], [4, 2], [3, 1], [1, 1], [0, 2], [1, 4]] },
    perc: { t: 'X.......', from: 3 }, tex: ['wind', 'whispers'] },

  fortress: { bpm: 68, beats: 4, root: 38, mode: 'phrygian', verb: 0.5, lp: 5200,
    prog: [0, 1, 0, 1, 0, 5, 1, 0], passes: 4,
    pad: { type: 'choir', vol: 0.4 }, sub: 0.9,
    bass: { pat: '1...1...1...1.1.', vol: 0.65, from: 0 },
    mel: { inst: 'horn', oct: 1, vol: 0.8, from: 1, bars: 8,
      m: [[0, 2], [4, 1], [3, 1], [1, 2], [3, 1], [5, 1], [4, 2], [3, 1], [2, 1], [1, 3], [null, 1], [0, 1], [0, 1], [2, 1], [4, 1], [5, 2], [4, 1], [3, 1], [1, 2], [3, 1], [1, 1], [0, 3], [null, 1]] },
    perc: { t: 'X.......X...x...', c: '........X.......', from: 0 }, tex: ['wind'] },

  camp: { bpm: 64, beats: 4, root: 45, mode: 'aeolian', verb: 0.4, lp: 7000,
    prog: [0, 5, 2, 6, 0, 3, 4, 0],
    pad: { type: 'strings', vol: 0.16 },
    arp: { inst: 'lute', pat: '0.1.2.1.0.1.2.1.', oct: 1, vol: 0.55 },
    mel: { inst: 'flute', oct: 2, vol: 0.55, from: 1, bars: 8,
      m: [[2, 2], [4, 1], [2, 1], [5, 2], [4, 1], [2, 1], [4, 2], [2, 1], [0, 1], [1, 2], [2, 1], [1, 1], [0, 2], [2, 1], [4, 1], [3, 2], [5, 1], [3, 1], [4, 2], [2, 1], [1, 1], [0, 4]] },
    tex: ['fire'] },

  dawn: { bpm: 76, beats: 4, root: 48, mode: 'major', verb: 0.5, lp: 10000,
    prog: [0, 4, 5, 3, 0, 4, 3, 0], passes: 4,
    pad: { type: 'strings', vol: 0.4 },
    bass: { pat: '1.......5.......', vol: 0.5, from: 0 },
    arp: { inst: 'harp', pat: '0.1.2.3.2.1.2.1.', oct: 1, vol: 0.5 },
    mel: { inst: 'horn', oct: 1, vol: 0.8, from: 0, bars: 8, alt: 'flute',
      m: [[4, 2], [7, 2], [8, 1.5], [7, .5], [6, 2], [7, 1], [9, 1], [12, 2], [10, 1.5], [9, .5], [8, 1], [7, 1], [7, 1], [9, 1], [11, 2], [11, 1.5], [9, .5], [8, 2], [10, 1], [9, 1], [8, 1], [7, 1], [7, 3], [null, 1]] },
    perc: { f: 'X.......x.......', x: '..x...x...x...x.', from: 1 }, tex: [] },

  grey: { bpm: 40, beats: 4, root: 40, mode: 'phrygian', verb: 0.8, lp: 3000,
    prog: [0, 1, 0, 1], passes: 4,
    pad: { type: 'choir', vol: 0.5 }, sub: 1,
    mel: { inst: 'choir', oct: 1, vol: 0.45, from: 1, bars: 4, m: [[0, 4], [1, 2], [0, 2], [3, 4], [1, 2], [0, 2]] },
    tex: ['wind', 'whispers'] },

  /* Battle cues */
  battle: { bpm: 144, beats: 4, root: 50, mode: 'aeolian', verb: 0.2, lp: 9500, passes: 4, intense: true,
    prog: [0, 5, 6, 0, 0, 5, 6, 4],
    pad: { type: 'strings', vol: 0.3 }, sub: 0.6,
    bass: { pat: '1.1.1.1.1.1.1.1.', vol: 0.65 },
    arp: { inst: 'pluck', pat: '0.1.2.1.0.1.2.3.', oct: 1, vol: 0.4, from: 1 },
    mel: { inst: 'horn', oct: 1, vol: 0.75, from: 1, bars: 8,
      m: [[0, .5], [0, .5], [2, .5], [0, .5], [4, 1], [2, 1], [5, .5], [5, .5], [7, .5], [5, .5], [9, 1], [7, 1], [6, .5], [6, .5], [8, .5], [6, .5], [10, 1], [8, 1], [7, 1], [4, 1], [0, 2],
        [4, .5], [4, .5], [7, .5], [4, .5], [9, 1], [7, 1], [5, .5], [5, .5], [7, .5], [5, .5], [8, 1], [7, 1], [6, .5], [6, .5], [8, .5], [6, .5], [11, 1], [9, 1], [8, 1], [6, 1], [4, 1], [2, 1]] },
    perc: { t: 'X..x..x.X..x..x.', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.', k: 'X.......X.X.....', from: 0 }, tex: [] },

  boss: { bpm: 112, beats: 4, root: 38, mode: 'hminor', verb: 0.45, lp: 8500, passes: 4, intense: true,
    prog: [0, 5, 4, 0, 0, 5, 4, 4],
    pad: { type: 'choir', vol: 0.5 }, sub: 0.8,
    bass: { pat: '1..1..1.1..1..1.', vol: 0.7 },
    arp: { inst: 'pluck', pat: '0.1.0.1.0.1.0.1.', oct: 1, vol: 0.34, from: 1 },
    mel: { inst: 'horn', oct: 1, vol: 0.85, from: 0, bars: 8, alt: 'choir',
      m: [[0, 2], [2, 1], [4, 1], [5, 2], [4, 1], [2, 1], [4, 1.5], [6, .5], [7, 1], [6, 1], [7, 3], [null, 1], [0, 1], [0, 1], [2, 1], [4, 1], [5, 1], [7, 1], [9, 2], [8, 2], [6, 2], [7, 4]] },
    perc: { t: 'X.......X.x.x...', c: '....X.......X...', f: '..x...x...x...x.', k: 'X...............', from: 0 }, tex: [] },
};

/* Loudness trim per theme (measured offline so scenes sit at a similar level; battle cues a little hotter). */
Object.entries({ title: 1.12, town: 1.05, village: 0.8, tavern: 1.03, road: 1.0, mire: 1.2, mines: 0.72, harbor: 1.19, barrow: 1.05, peak: 2.0, orchard: 1.12,
  court: 1.2, wych: 1.1, fortress: 0.6, camp: 3.2, dawn: 1.0, grey: 1.06, battle: 0.95, boss: 0.9 }).forEach(([k, g]) => { THEMES[k].gain = g; });

/* ---- helpers ---- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

class MusicEngine {
  constructor(ctx, dest) {
    this.ctx = ctx; this.dest = dest; this.S = null; this.th = null; this.key = null;
    this.i = 0; this.nextT = 0; this.sd = 0.2; this.timer = null; this.rand = Math.random;
    const n = Math.floor(ctx.sampleRate * 2);
    this.noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
    this.ir = this.makeIR(2.8);
  }

  /* A soft hall: stereo noise with an exponential tail, darkened over time. */
  makeIR(secs) {
    const c = this.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let k = 0; k < n; k++) {
        const t = k / n, a = 0.15 + 0.8 * (1 - t);
        lp += (Math.random() * 2 - 1 - lp) * a;
        d[k] = lp * Math.pow(1 - t, 2.6) * (k < 400 ? k / 400 : 1);
      }
    }
    return b;
  }

  /* ---- sessions: one per playing theme, so themes can crossfade ---- */
  session(th, t, fade) {
    const c = this.ctx, S = { th, ctx: c, stop: [] };
    S.out = c.createGain(); S.out.gain.setValueAtTime(0.0001, t); S.out.gain.linearRampToValueAtTime(th.gain || 1, t + fade);
    S.lp = c.createBiquadFilter(); S.lp.type = 'lowpass'; S.lp.frequency.value = th.lp || 9000; S.lp.Q.value = 0.4;
    S.dry = c.createGain(); S.send = c.createGain();
    const conv = c.createConvolver(); conv.buffer = this.ir;
    const wet = c.createGain(); wet.gain.value = th.verb != null ? th.verb : 0.35;
    S.dry.connect(S.lp); S.send.connect(conv); conv.connect(wet); wet.connect(S.lp); S.lp.connect(S.out); S.out.connect(this.dest);
    this.startTextures(S, t);
    return S;
  }
  endSession(S, t, fade) {
    if (!S) return;
    S.out.gain.cancelScheduledValues(t);
    S.out.gain.setValueAtTime(Math.max(S.out.gain.value, 0.0001), t);
    S.out.gain.linearRampToValueAtTime(0.0001, t + fade);
    S.stop.forEach(fn => { try { fn(t + fade + 0.1); } catch (e) { /* ignore */ } });
  }

  route(S, node, pan, wet) {
    let n = node;
    if (pan && S.ctx.createStereoPanner) { const p = S.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); n.connect(p); n = p; }
    n.connect(S.dry);
    if (wet > 0) { const g = S.ctx.createGain(); g.gain.value = wet; n.connect(g); g.connect(S.send); }
  }

  /* Continuous ambience under the music. */
  startTextures(S, t) {
    const c = this.ctx, th = S.th;
    (th.tex || []).forEach(tx => {
      if (tx === 'wind') {
        const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.8;
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 260; lfo.connect(lg); lg.connect(bp.frequency);
        const g = c.createGain(); g.gain.value = 0.05;
        const lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = 0.11; lg2.gain.value = 0.025; lfo2.connect(lg2); lg2.connect(g.gain);
        s.connect(bp); bp.connect(g); this.route(S, g, 0, 0.4);
        s.start(t); lfo.start(t); lfo2.start(t); S.stop.push(e => { s.stop(e); lfo.stop(e); lfo2.stop(e); });
      } else if (tx === 'water') {
        const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
        const g = c.createGain(); g.gain.value = 0.045;
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.18; lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain);
        s.connect(lp); lp.connect(g); this.route(S, g, 0, 0.2);
        s.start(t); lfo.start(t); S.stop.push(e => { s.stop(e); lfo.stop(e); });
      } else if (tx === 'whispers') {
        const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 3;
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.23; lg.gain.value = 900; lfo.connect(lg); lg.connect(bp.frequency);
        const g = c.createGain(); g.gain.value = 0.018;
        s.connect(bp); bp.connect(g); this.route(S, g, 0.4, 0.6);
        s.start(t); lfo.start(t); S.stop.push(e => { s.stop(e); lfo.stop(e); });
      }
      // 'fire' and 'frogs' are sparse random events, handled per step.
    });
  }

  /* ---- instruments ---- */
  osc(type, f, t, end) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; }
  amp(S, t, a, vol, dur, r) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    return g;
  }
  decay(t, vol, ring, a = 0.004) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
    return g;
  }

  play(inst, S, t, f, dur, vel, pan) {
    const fn = this['i_' + inst]; if (fn) fn.call(this, S, t, f, dur, vel, pan || 0);
  }

  i_pluck(S, t, f, dur, v, pan) {
    const ring = Math.min(1.4, 0.45 + dur * 0.8), end = t + ring + 0.05;
    const g = this.decay(t, 0.22 * v, ring);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.3), t + ring * 0.8);
    const a = this.osc('triangle', f, t, end), b = this.osc('sine', f * 2, t, end), bg = this.ctx.createGain(); bg.gain.value = 0.35;
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); this.route(S, g, pan, 0.28);
  }
  i_lute(S, t, f, dur, v, pan) {
    const ring = Math.min(1.1, 0.35 + dur * 0.6), end = t + ring + 0.05;
    const g = this.decay(t, 0.2 * v, ring, 0.003);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(5200, f * 5), t); lp.frequency.exponentialRampToValueAtTime(Math.max(260, f * 1.1), t + ring * 0.7);
    const a = this.osc('sawtooth', f, t, end), b = this.osc('triangle', f * 2, t, end), bg = this.ctx.createGain(); bg.gain.value = 0.25;
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); this.route(S, g, pan, 0.2);
  }
  i_harp(S, t, f, dur, v, pan) {
    const ring = 2.0, end = t + ring + 0.05;
    const g = this.decay(t, 0.2 * v, ring, 0.004);
    const a = this.osc('sine', f, t, end), b = this.osc('triangle', f * 2, t, end), bg = this.ctx.createGain(); bg.gain.value = 0.18;
    const c3 = this.osc('sine', f * 3, t, end), cg = this.ctx.createGain(); cg.gain.setValueAtTime(0.1, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    a.connect(g); b.connect(bg); bg.connect(g); c3.connect(cg); cg.connect(g); this.route(S, g, pan, 0.5);
  }
  i_bell(S, t, f, dur, v, pan) {
    const ring = 3.2, end = t + ring + 0.1, g = this.ctx.createGain(); g.gain.value = 0.16 * v;
    [[1, 1, 3.2], [2.0, 0.5, 2.4], [2.76, 0.4, 1.8], [4.07, 0.22, 1.2], [5.4, 0.12, 0.8]].forEach(([r, a, d]) => {
      const o = this.osc('sine', f * r, t, end), eg = this.ctx.createGain();
      eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(a, t + 0.003); eg.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(eg); eg.connect(g);
    });
    this.route(S, g, pan, 0.65);
  }
  i_flute(S, t, f, dur, v, pan) {
    const end = t + dur + 0.3, g = this.amp(S, t, 0.07, 0.17 * v, dur, 0.22);
    const a = this.osc('sine', f, t, end), b = this.osc('sine', f * 2, t, end), bg = this.ctx.createGain(); bg.gain.value = 0.12;
    const vib = this.osc('sine', 5.2, t, end), vg = this.ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(0.5, dur));
    vib.connect(vg); vg.connect(a.frequency); vg.connect(b.frequency);
    const n = this.ctx.createBufferSource(); n.buffer = this.noise; const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, f * 3); bp.Q.value = 2;
    const ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.045 * v, t + 0.05); ng.gain.exponentialRampToValueAtTime(0.012 * v, t + 0.25); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t, Math.random()); n.stop(end);
    a.connect(g); b.connect(bg); bg.connect(g); this.route(S, g, pan, 0.38);
  }
  i_reed(S, t, f, dur, v, pan) {
    const end = t + dur + 0.2, g = this.amp(S, t, 0.03, 0.12 * v, dur * 0.95, 0.12);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(3600, f * 5); lp.Q.value = 1.2;
    const a = this.osc('square', f, t, end), b = this.osc('sawtooth', f * 1.004, t, end), bg = this.ctx.createGain(); bg.gain.value = 0.5;
    const vib = this.osc('sine', 5.6, t, end), vg = this.ctx.createGain(); vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(a.frequency); vg.connect(b.frequency);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); this.route(S, g, pan, 0.2);
  }
  i_horn(S, t, f, dur, v, pan) {
    const end = t + dur + 0.5, g = this.amp(S, t, 0.14, 0.2 * v, dur, 0.35);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.4;
    lp.frequency.setValueAtTime(f * 1.5, t); lp.frequency.linearRampToValueAtTime(Math.min(3200, f * 5), t + 0.22); lp.frequency.linearRampToValueAtTime(f * 3, t + dur);
    const a = this.osc('sawtooth', f, t, end), b = this.osc('sawtooth', f * 1.006, t, end), c = this.osc('sine', f / 2, t, end), cg = this.ctx.createGain(); cg.gain.value = 0.4;
    a.connect(lp); b.connect(lp); c.connect(cg); cg.connect(lp); lp.connect(g); this.route(S, g, pan, 0.4);
  }
  i_strings(S, t, f, dur, v, pan) {
    const end = t + dur + 0.9, g = this.amp(S, t, 0.28, 0.1 * v, dur, 0.7);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(4200, f * 4);
    const vib = this.osc('sine', 5, t, end), vg = this.ctx.createGain(); vg.gain.value = 6; vib.connect(vg);
    [-9, 0, 8].forEach(cents => { const o = this.osc('sawtooth', f, t, end); o.detune.value = cents; o.connect(lp); vg.connect(o.detune); });
    lp.connect(g); this.route(S, g, pan, 0.5);
  }
  i_pad(S, t, f, dur, v, pan) {
    const end = t + dur + 1.4, g = this.amp(S, t, Math.min(1.0, dur * 0.4), 0.09 * v, dur, 1.2);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1400, t + dur * 0.6); lp.frequency.linearRampToValueAtTime(600, t + dur + 1);
    [-7, 0, 7].forEach(cents => { const o = this.osc('sawtooth', f, t, end); o.detune.value = cents; o.connect(lp); });
    lp.connect(g); this.route(S, g, pan, 0.6);
  }
  i_choir(S, t, f, dur, v, pan) {
    const end = t + dur + 1.2, g = this.amp(S, t, Math.min(0.9, dur * 0.4), 0.11 * v, dur, 1.0);
    const mix = this.ctx.createGain(); mix.gain.value = 1;
    const vib = this.osc('sine', 4.8, t, end), vg = this.ctx.createGain(); vg.gain.value = 8; vib.connect(vg);
    [-10, 0, 9].forEach(cents => { const o = this.osc('sawtooth', f, t, end); o.detune.value = cents; o.connect(mix); vg.connect(o.detune); });
    [[620, 5], [1150, 4], [2500, 2]].forEach(([fq, q], k) => {
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = q;
      const bg = this.ctx.createGain(); bg.gain.value = [1, 0.7, 0.35][k]; mix.connect(bp); bp.connect(bg); bg.connect(g);
    });
    this.route(S, g, pan, 0.7);
  }
  i_bass(S, t, f, dur, v, pan) {
    const d = Math.min(dur, 1.6), end = t + d + 0.3, g = this.amp(S, t, 0.012, 0.3 * v, d * 0.7, 0.25);
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const a = this.osc('sine', f, t, end), b = this.osc('triangle', f, t, end), bg = this.ctx.createGain(); bg.gain.value = 0.45;
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); this.route(S, g, 0, 0.05);
  }
  i_sub(S, t, f, dur, v) {
    const end = t + dur + 1.6, g = this.amp(S, t, 0.9, 0.2 * v, dur, 1.4);
    const a = this.osc('sine', f, t, end); const b = this.osc('sine', f * 1.003, t, end);
    a.connect(g); b.connect(g); this.route(S, g, 0, 0.1);
  }

  /* ---- percussion ---- */
  noiseHit(S, t, dur, vol, type, freq, q, pan, wet) {
    const n = this.ctx.createBufferSource(); n.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = this.decay(t, vol, dur, 0.002); n.connect(f); f.connect(g); n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.05); this.route(S, g, pan || 0, wet || 0.12);
  }
  thump(S, t, f0, f1, dur, vol, wet) {
    const g = this.decay(t, vol, dur, 0.002), o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6); o.connect(g); o.start(t); o.stop(t + dur + 0.05); this.route(S, g, 0, wet || 0.12);
  }
  drum(S, ch, t, v) {
    switch (ch) {
      case 'k': this.thump(S, t, 140, 42, 0.28, 0.5 * v); break;
      case 't': this.thump(S, t, 95, 38, 0.55, 0.62 * v, 0.35); this.noiseHit(S, t, 0.18, 0.12 * v, 'lowpass', 380, 0.5, 0, 0.3); break;
      case 's': this.noiseHit(S, t, 0.16, 0.28 * v, 'bandpass', 1900, 0.8, 0, 0.2); this.thump(S, t, 220, 140, 0.1, 0.2 * v); break;
      case 'h': this.noiseHit(S, t, 0.04, 0.09 * v, 'highpass', 7500, 0.7, 0.25, 0.05); break;
      case 'x': this.noiseHit(S, t, 0.07, 0.07 * v, 'bandpass', 5200, 1.2, -0.3, 0.1); break;
      case 'f': this.thump(S, t, 180, 95, 0.22, 0.4 * v, 0.25); this.noiseHit(S, t, 0.08, 0.1 * v, 'bandpass', 500, 1, 0, 0.2); break;
      case 'b': this.i_bell(S, t, 1568, 0.5, 0.25 * v, 0.3); break;
      case 'c': { const g = this.decay(t, 0.17 * v, 0.9, 0.002); [520, 833, 1247, 1810].forEach((fq, k) => { const o = this.osc('square', fq * (1 + k * 0.003), t, t + 1); const og = this.ctx.createGain(); og.gain.value = [1, 0.7, 0.45, 0.25][k]; o.connect(og); og.connect(g); }); const hp = this.ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1400; g.connect(hp); this.route(S, hp, 0.2, 0.3); break; }
    }
  }

  /* ---- sequencing ---- */
  degMidi(th, d, oct) {
    const sc = MUSIC_SCALES[th.mode], n = sc.length, o = Math.floor(d / n), k = ((d % n) + n) % n;
    return th.root + 12 * ((oct || 0) + o) + sc[k];
  }
  chord(th, d) { return [0, 2, 4, 7].map(k => this.degMidi(th, d + k, 0)); }
  on(L, pass, th) { if (!L) return false; const from = L.from || 0, to = L.to != null ? L.to : (th.passes || 4) - 1; return pass >= from && pass <= to; }

  start(key, t, fade) {
    const th = THEMES[key]; if (!th) return false;
    this.th = th; this.key = key;
    this.S = this.session(th, t, fade);
    this.sd = 60 / th.bpm / 4;
    this.i = 0; this.nextT = t + 0.06;
    // precompute melody events per bar
    this.melBars = null;
    if (th.mel) {
      const spb = th.beats; const bars = []; let cur = [], pos = 0;
      th.mel.m.forEach(([d, b]) => {
        let left = b, start = pos;
        while (left > 1e-6) { const room = spb - pos; const take = Math.min(room, left); if (d != null) cur.push({ d, at: pos, b: take }); pos += take; left -= take; if (pos >= spb - 1e-6) { bars.push(cur); cur = []; pos = 0; } }
      });
      if (cur.length) bars.push(cur);
      this.melBars = bars;
    }
    return true;
  }

  /* Schedule everything that falls before `until`. */
  pump(until) {
    while (this.th && this.nextT < until) { this.step(); this.nextT += this.sd; this.i++; }
  }

  step() {
    const th = this.th, S = this.S, t = this.nextT, sd = this.sd;
    const spb = th.beats * 4, si = this.i % spb, bar = Math.floor(this.i / spb);
    const bl = bar % th.prog.length, pass = Math.floor(bar / th.prog.length) % (th.passes || 4);
    const rootDeg = th.prog[bl], chord = this.chord(th, rootDeg);
    const h = () => (Math.random() - 0.5) * 0.012, vv = () => 0.88 + Math.random() * 0.24;
    const breakdown = pass === 3 && !th.intense;

    if (si === 0) {
      const barDur = spb * sd;
      if (th.pad && this.on({ from: 0 }, pass, th)) {
        const vol = th.pad.vol * (breakdown ? 0.8 : 1);
        chord.slice(0, 3).forEach((m, k) => this.play(th.pad.type === 'choir' ? 'choir' : th.pad.type === 'strings' ? 'strings' : 'pad', S, t, mtof(m + (k === 2 ? 0 : 0)), barDur * 0.98, vol, (k - 1) * 0.35));
        if (th.pad.type !== 'choir' && th.pad.type !== 'pad') this.play('pad', S, t, mtof(chord[0] - 12), barDur * 0.98, vol * 0.7, 0);
      }
      if (th.sub) this.play('sub', S, t, mtof(this.degMidi(th, rootDeg, -1) - 0), barDur * 0.98, th.sub, 0);
      if (this.melBars && th.mel && this.on(th.mel, pass, th) && !(breakdown && !th.mel.alt)) {
        const events = this.melBars[bl % this.melBars.length] || [];
        const inst = (pass === 2 || breakdown) && th.mel.alt ? th.mel.alt : th.mel.inst;
        const oct = th.mel.oct + (pass === 2 && !th.mel.alt && !th.intense ? 0 : 0);
        events.forEach(e => {
          const f = mtof(this.degMidi(th, e.d, oct)), d = e.b * 4 * sd * 0.95;
          this.play(inst, S, t + e.at * 4 * sd + h(), f, d, th.mel.vol * (breakdown ? 0.7 : 1) * vv(), 0.1);
          if (pass === 2 && th.mel.inst !== 'bell' && !th.intense) this.play('harp', S, t + e.at * 4 * sd + 0.02, f * 2, d, 0.28, -0.2);
        });
      }
    }
    if (th.bass && this.on(th.bass, pass, th) && !breakdown) {
      const ch = th.bass.pat[si % th.bass.pat.length];
      if (ch !== '.' && ch !== undefined) {
        let run = 1; while (run < spb && th.bass.pat[(si + run) % th.bass.pat.length] === '.' && si + run < spb) run++;
        const note = ch === '5' ? chord[2] : ch === '3' ? chord[1] : ch === '8' ? chord[3] : chord[0];
        this.play('bass', S, t + h(), mtof(note - 12), run * sd, th.bass.vol * vv(), 0);
      }
    }
    if (th.arp && this.on(th.arp, pass, th)) {
      const ch = th.arp.pat[si % th.arp.pat.length];
      if (ch !== '.' && ch !== undefined) {
        const idx = parseInt(ch, 10), m = chord[idx % 4] + 12 * (th.arp.oct - 0) - (idx >= 4 ? 0 : 0);
        this.play(th.arp.inst, S, t + h(), mtof(m), sd * 3, th.arp.vol * vv() * (breakdown ? 1.15 : 1), ((si % 4) - 1.5) * 0.18);
      }
    }
    if (th.perc && this.on(th.perc, pass, th) && !(breakdown && !th.intense)) {
      ['k', 't', 's', 'h', 'x', 'f', 'c', 'b'].forEach(k => {
        const pat = th.perc[k]; if (!pat) return;
        const ch = pat[si % pat.length];
        if (ch === '.' || ch === undefined) return;
        this.drum(S, k, t, (ch === 'X' ? 1 : 0.62) * vv());
      });
    }
    // sparse random textures
    if ((th.tex || []).includes('fire') && Math.random() < 0.05) this.noiseHit(S, t + Math.random() * sd, 0.02 + Math.random() * 0.03, 0.05 + Math.random() * 0.05, 'highpass', 2500 + Math.random() * 3000, 1, (Math.random() - 0.5) * 0.8, 0.05);
    if ((th.tex || []).includes('frogs') && si % 2 === 0 && Math.random() < 0.04) {
      const f0 = 180 + Math.random() * 120, g = this.decay(t, 0.05, 0.18, 0.01), o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + 0.08); o.frequency.exponentialRampToValueAtTime(f0 * 0.9, t + 0.16); o.connect(g); o.start(t); o.stop(t + 0.25); this.route(S, g, (Math.random() - 0.5) * 1.4, 0.3);
    }
  }

  /* A short one-shot cue played over silence (victory, defeat). */
  stinger(kind, t) {
    const c = this.ctx, th = { root: 50, mode: 'major', verb: 0.55, lp: 9500, tex: [] };
    const S = this.session(th, t, 0.05); const sd = 0.5;
    const n = (inst, m, at, d, v, pan) => this.play(inst, S, t + at, mtof(m), d, v, pan || 0);
    if (kind === 'victory') {
      // D major: rising horn call into a held, glowing chord
      [[62, 0, .45], [66, .45, .45], [69, .9, .45], [74, 1.35, 1.9]].forEach(([m, a, d]) => { n('horn', m, a, d, 0.95); n('strings', m + 12, a, d, 0.6, 0.3); });
      [50, 57, 62, 66, 69, 74].forEach((m, k) => { n('strings', m, 1.35, 2.6, 0.7, (k - 2.5) * 0.2); });
      n('bass', 38, 1.35, 2.4, 1); n('bass', 38, 0, 1.2, 0.9);
      [0, 0.45, 0.9].forEach(a => this.drum(S, 't', t + a, 0.8)); this.drum(S, 't', t + 1.35, 1);
      [81, 86, 90, 93].forEach((m, k) => n('bell', m, 1.4 + k * 0.12, 1, 0.7));
      [74, 78, 81, 86].forEach((m, k) => n('harp', m, 1.35 + k * 0.1, 2, 0.8, 0.3));
      S.dur = 5.2;
    } else {
      // defeat: slow minor descent over a low toll
      [[62, 0], [60, 1.1], [57, 2.2], [50, 3.4]].forEach(([m, a], k) => { n('strings', m, a, 1.7, 0.8); n('strings', m - 12, a, 1.7, 0.6, -0.3); });
      [50, 53, 57].forEach((m, k) => n('choir', m, 3.4, 3, 0.8));
      this.drum(S, 't', t, 0.9); this.drum(S, 't', t + 3.4, 1);
      n('bell', 69, 0.1, 3, 0.5);
      S.dur = 6.5;
    }
    return S;
  }
}

/* ---------------- Runtime controller ---------------- */
const Music = {
  eng: null, bus: null, comp: null, key: null, base: null, locked: false, ducked: false, timer: null, battling: false,
  KEYS: Object.keys(THEMES),

  ensure() {
    if (Music.eng) return Music.eng;
    if (typeof Sound === 'undefined' || !Sound.ensure()) return null;
    const c = Sound.ctx;
    Music.bus = c.createGain();
    Music.comp = c.createDynamicsCompressor();
    Music.comp.threshold.value = -16; Music.comp.knee.value = 24; Music.comp.ratio.value = 3; Music.comp.attack.value = 0.01; Music.comp.release.value = 0.25;
    Music.bus.connect(Music.comp); Music.comp.connect(Sound.master);
    Music.eng = new MusicEngine(c, Music.bus);
    Music.applyVolume();
    return Music.eng;
  },

  volume() { const v = Settings.data.musicVol; return (v == null ? 0.7 : v); },
  applyVolume() {
    if (!Music.bus) return;
    const t = Sound.ctx.currentTime, g = 0.9 * Music.volume() * (Music.ducked ? 0.4 : 1);
    Music.bus.gain.cancelScheduledValues(t); Music.bus.gain.setTargetAtTime(g, t, 0.15);
  },
  duck(on) { Music.ducked = !!on; Music.applyVolume(); },

  tick() {
    const e = Music.eng; if (!e || !e.th) return;
    const now = e.ctx.currentTime;
    if (e.nextT < now - 0.5) e.nextT = now + 0.05;      // tab was asleep: don't burst
    e.pump(now + 0.7);
  },
  run() { if (!Music.timer) Music.timer = setInterval(Music.tick, 90); },
  halt() { if (Music.timer) { clearInterval(Music.timer); Music.timer = null; } },

  /* Switch to a theme with a crossfade. */
  switchTo(key, fade = 1.8) {
    const e = Music.ensure(); if (!e) return;
    if (!THEMES[key]) key = 'road';
    if (Sound.ctx.state === 'suspended') Sound.ctx.resume();
    const t = Sound.ctx.currentTime;
    if (e.S) e.endSession(e.S, t, fade);
    e.start(key, t + 0.02, fade);
    Music.key = key;
    Music.run(); Music.tick();
  },

  /* Scene music. Ignored while a battle cue or stinger owns the sound. */
  play(key) {
    Music.base = key;
    if (!Settings.data.music) { Music.stop(); return; }
    if (Music.battling || Music.locked) return;
    if (key === Music.key && Music.eng && Music.eng.th) return;
    Music.switchTo(key);
  },

  stop() {
    const e = Music.eng; if (!e || !e.S) return;
    e.endSession(e.S, Sound.ctx.currentTime, 0.8);
    e.S = null; e.th = null; Music.key = null; Music.halt();
  },

  battle(boss) {
    Music.battling = true;
    if (!Settings.data.music) return;
    clearTimeout(Music._unlock); Music.locked = false;
    Music.switchTo(boss ? 'boss' : 'battle', 0.5);
  },

  /* Battle over: fade the cue, play a short stinger, then return to the scene's theme. */
  endBattle(result) {
    Music.battling = false;
    if (!Settings.data.music) return;
    const e = Music.ensure(); if (!e) return;
    const t = Sound.ctx.currentTime;
    if (e.S) e.endSession(e.S, t, 0.35);
    e.S = null; e.th = null; Music.key = null; Music.halt();
    if (result === 'flee') { Music.locked = false; if (Music.base) Music.play(Music.base); return; }
    const S = e.stinger(result === 'win' ? 'victory' : 'defeat', t + 0.4);
    Music.locked = true;
    clearTimeout(Music._unlock);
    Music._unlock = setTimeout(() => {
      Music.locked = false;
      e.endSession(S, Sound.ctx.currentTime, 1.5);
      if (Music.base && Settings.data.music) Music.play(Music.base);
    }, (S.dur + 0.4) * 1000);
  },
};
