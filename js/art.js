/* ===========================================================
   ART — painted-style full-screen landscapes, drawn as SVG.
   Every place is built from layered ridges with aerial perspective
   (far layers fade into the sky colour), glowing light sources,
   fog, silhouettes and animated particles. The Hollow's Doom drains
   the colour out of the world as it rises.
   =========================================================== */

const Art = {
  W: 1600, H: 900,

  rng(seed) { let s = 2166136261; for (const ch of String(seed)) { s ^= ch.charCodeAt(0); s = Math.imul(s, 16777619) >>> 0; } return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); },
  hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  mix(a, b, t) { const A = Art.hex(a), B = Art.hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); },

  /* A smooth natural ridge; returns the path and a height lookup for placing things on it. */
  ridge(r, base, amp, opts = {}) {
    const W = Art.W, step = 16;
    const f = [0.002 + r() * 0.002, 0.006 + r() * 0.004, 0.017 + r() * 0.01], ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    const rough = opts.rough || 0.15, jag = opts.jag || 0;
    const ys = [];
    for (let x = 0; x <= W + step; x += step) {
      let n = 0.55 * Math.sin(x * f[0] + ph[0]) + 0.3 * Math.sin(x * f[1] + ph[1]) + rough * Math.sin(x * f[2] + ph[2]);
      if (jag) n += jag * Math.abs(Math.sin(x * 0.011 + ph[1])) * Math.sin(x * 0.004 + ph[2]);
      if (opts.peak) { const d = (x - opts.peak.x) / opts.peak.w; n += opts.peak.h * Math.exp(-d * d); }
      ys.push(base - amp * n);
    }
    let d = `M0 ${Art.H} L0 ${ys[0].toFixed(1)}`;
    ys.forEach((y, i) => { d += ` L${i * step} ${y.toFixed(1)}`; });
    d += ` L${W} ${Art.H} Z`;
    return { d, yAt: x => ys[Math.max(0, Math.min(ys.length - 1, Math.round(x / step)))] };
  },

  pine(x, y, h, c) { const w = h * 0.36; return `<path d="M${x} ${y - h} L${x + w * 0.55} ${y - h * 0.55} L${x + w * 0.3} ${y - h * 0.55} L${x + w} ${y - h * 0.05} L${x + w * 0.12} ${y - h * 0.05} L${x + w * 0.12} ${y} L${x - w * 0.12} ${y} L${x - w * 0.12} ${y - h * 0.05} L${x - w} ${y - h * 0.05} L${x - w * 0.3} ${y - h * 0.55} L${x - w * 0.55} ${y - h * 0.55} Z" fill="${c}"/>`; },
  broadTree(x, y, s, c, r) { let o = `<path d="M${x - 3 * s} ${y} Q${x} ${y - 30 * s} ${x - 2 * s} ${y - 60 * s} L${x + 3 * s} ${y - 60 * s} Q${x + 3 * s} ${y - 30 * s} ${x + 4 * s} ${y} Z" fill="${c}"/>`; for (let i = 0; i < 7; i++) o += `<circle cx="${x + (r() - 0.5) * 60 * s}" cy="${y - 62 * s - r() * 38 * s}" r="${(18 + r() * 16) * s}" fill="${c}"/>`; return o; },
  deadTree(x, y, s, c) { return `<path d="M${x} ${y} C${x - 2} ${y - 30 * s} ${x + 4} ${y - 50 * s} ${x} ${y - 80 * s} M${x + 1} ${y - 45 * s} C${x - 14 * s} ${y - 55 * s} ${x - 22 * s} ${y - 62 * s} ${x - 30 * s} ${y - 78 * s} M${x + 1} ${y - 58 * s} C${x + 12 * s} ${y - 68 * s} ${x + 20 * s} ${y - 74 * s} ${x + 26 * s} ${y - 92 * s} M${x - 16 * s} ${y - 60 * s} L${x - 20 * s} ${y - 72 * s}" stroke="${c}" stroke-width="${5 * s}" stroke-linecap="round" fill="none"/>`; },
  house(x, y, w, h, c, lit) { return `<path d="M${x} ${y} V${y - h} L${x + w / 2} ${y - h - w * 0.55} L${x + w} ${y - h} V${y} Z" fill="${c}"/>${lit ? `<rect x="${x + w * 0.38}" y="${y - h * 0.62}" width="${w * 0.24}" height="${h * 0.3}" rx="2" fill="${lit}" class="flicker"/>` : ''}`; },
  tower(x, y, w, h, c, lit) { return `<path d="M${x} ${y} V${y - h} L${x + w / 2} ${y - h - w * 1.4} L${x + w} ${y - h} V${y} Z" fill="${c}"/>${lit ? `<rect x="${x + w * 0.4}" y="${y - h * 0.7}" width="${w * 0.2}" height="${h * 0.12}" fill="${lit}" class="flicker"/>` : ''}`; },

  glow(x, y, r, c, op, id) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})" opacity="${op}"/><defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}"/><stop offset=".35" stop-color="${c}" stop-opacity=".45"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`; },
  fog(y, h, c, op) { return `<rect x="-100" y="${y}" width="1800" height="${h}" fill="${c}" opacity="${op}" filter="url(#blur-xl)" class="drift"/>`; },
  stars(r, n) { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.6 + 0.4).toFixed(1)}" fill="#fff" class="${r() > 0.7 ? 'twinkle' : ''}" style="animation-delay:${(r() * 4).toFixed(1)}s" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`; return s; },

  particles(type, r, n) {
    if (!type) return '';
    let s = '<g class="particles">';
    for (let i = 0; i < n; i++) {
      const x = r() * 1600, y = type === 'snow' || type === 'ash' || type === 'rain' ? r() * 900 : 400 + r() * 500;
      const dur = (type === 'rain' ? 0.6 + r() * 0.5 : 6 + r() * 10).toFixed(1), del = (-r() * 12).toFixed(1);
      const rad = { ember: 1.5 + r() * 2.2, snow: 1.5 + r() * 2.5, firefly: 2 + r() * 2, ash: 1.5 + r() * 2.5, mote: 1.2 + r() * 2, rain: 1 }[type];
      const col = { ember: '#ffb15a', snow: '#ffffff', firefly: '#c9ff8a', ash: '#cfd3d8', mote: '#fff3c4', rain: '#bcd6ff' }[type];
      s += type === 'rain'
        ? `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 10).toFixed(0)}" y2="${(y + 34).toFixed(0)}" stroke="${col}" stroke-width="1.3" opacity=".35" class="p-rain" style="animation-duration:${dur}s;animation-delay:${del}s"/>`
        : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(1)}" fill="${col}" class="p-${type}" style="animation-duration:${dur}s;animation-delay:${del}s"/>`;
    }
    return s + '</g>';
  },

  /* Which painting suits a scene */
  keyFor(id) {
    if (!id) return 'title';
    if (/^end_(victory|redemption|florian|sacrifice)/.test(id)) return 'dawn';
    if (/^end_/.test(id)) return 'grey';
    const pre = id.split('_')[0];
    if (['mire', 'mines', 'harbor', 'barrow', 'peak', 'orchard', 'court', 'wych'].includes(pre)) return pre;
    if (pre === 'fin') return 'fortress';
    if (id === 'camp' || id === 'vision' || id === 'int_shrine' || id === 'int_shrine_end') return 'camp';
    if (/^(hub|bg|villain|siege)/.test(id)) return 'town';
    if (pre === 'pro') return G && G.flags.hook === 'thornbury' ? 'village' : G && G.flags.hook === 'caravan' ? 'road' : 'tavern';
    return 'road';
  },

  /* Palettes: sky top/mid/horizon, the colour nearest the viewer, light, particles. */
  P: {
    title: { sky: ['#070a1c', '#1b1f4a', '#5a3d7a'], near: '#05060f', light: '#ffcf7a', fog: '#8a7fc0', cel: 'moon', part: 'ember', stars: 160 },
    town: { sky: ['#1d1846', '#7a3d78', '#ff9e6b'], near: '#140f26', light: '#ffd28a', fog: '#e7a6b5', cel: 'sun-low', part: 'mote', stars: 40 },
    village: { sky: ['#090b22', '#2a1a4a', '#c2453a'], near: '#07060f', light: '#ff7a3a', fog: '#ff8a4a', cel: 'none', part: 'ember', stars: 80 },
    tavern: { sky: ['#06101c', '#123049', '#2f5a6e'], near: '#030a10', light: '#ffc46a', fog: '#7fa9c0', cel: 'none', part: 'rain', stars: 0 },
    road: { sky: ['#2c6fb3', '#7fb6dc', '#ffe0b0'], near: '#0f2a22', light: '#fff3d2', fog: '#ffffff', cel: 'sun', part: 'mote', stars: 0 },
    mire: { sky: ['#0d2622', '#2f5a4e', '#9ec7a2'], near: '#04110d', light: '#dcffc0', fog: '#bfe8cc', cel: 'sun-pale', part: 'firefly', stars: 0 },
    mines: { sky: ['#1a0716', '#61163a', '#ff6a3a'], near: '#0b0306', light: '#ff8a3a', fog: '#ff6a4a', cel: 'none', part: 'ember', stars: 20 },
    harbor: { sky: ['#0e5aa6', '#45a3d9', '#d9f2ff'], near: '#062a40', light: '#ffffff', fog: '#ffffff', cel: 'sun', part: 'none', stars: 0 },
    barrow: { sky: ['#03061a', '#12205a', '#4a6aa8'], near: '#020414', light: '#dfe8ff', fog: '#9fb5ff', cel: 'moon', part: 'mote', stars: 220 },
    peak: { sky: ['#20306e', '#7f8fd0', '#ffc2c8'], near: '#0d1530', light: '#ffe8f0', fog: '#ffffff', cel: 'sun-low', part: 'snow', stars: 0 },
    orchard: { sky: ['#2e7a7a', '#9ed8c0', '#fff4c8'], near: '#0f2a26', light: '#fff6d0', fog: '#ffffff', cel: 'sun', part: 'mote', stars: 0 },
    court: { sky: ['#4a2a7a', '#e0709a', '#ffd6a0'], near: '#1a0f2a', light: '#fff0c0', fog: '#ffd6e0', cel: 'sun-low', part: 'mote', stars: 0 },
    wych: { sky: ['#9aa0a6', '#c8ccd0', '#eef0f2'], near: '#3a3d42', light: '#ffffff', fog: '#ffffff', cel: 'white', part: 'ash', stars: 0 },
    fortress: { sky: ['#050307', '#2a0d1a', '#8a1f1f'], near: '#030204', light: '#ff4a2a', fog: '#7a6a7a', cel: 'none', part: 'ash', stars: 30 },
    camp: { sky: ['#030617', '#0f1a45', '#2d3a78'], near: '#02030a', light: '#ff9a3a', fog: '#4a5aa8', cel: 'moon-small', part: 'ember', stars: 260 },
    dawn: { sky: ['#3a5ab0', '#ff9aa8', '#ffe7a0'], near: '#142a1e', light: '#fff2b8', fog: '#ffffff', cel: 'sunrise', part: 'mote', stars: 0 },
    grey: { sky: ['#2a2c30', '#4a4d52', '#7d8186'], near: '#101113', light: '#d8d8d8', fog: '#bfc2c6', cel: 'none', part: 'ash', stars: 0 },
  },

  scene(id) {
    const key = Art.keyFor(id);
    const P = Art.P[key];
    const r = Art.rng(key + (G ? G.villain + G.started : 'title'));
    const W = Art.W, H = Art.H;
    const horizon = P.sky[2];
    // n layers from far (close to horizon colour) to near
    const layer = t => Art.mix(Art.mix(horizon, P.sky[1], 0.25), P.near, t);
    let s = `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".55" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/></linearGradient>
      <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${Art.mix(horizon, P.sky[1], 0.4)}"/><stop offset="1" stop-color="${P.near}"/></linearGradient>
      <filter id="blur-xl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
      <filter id="blur-m"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .6 0"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    if (P.stars) s += `<g>${Art.stars(r, P.stars)}</g>`;
    // celestial body with bloom
    const cel = {
      moon: [1180, 170, 54], 'moon-small': [1260, 140, 30], sun: [1240, 190, 70], 'sun-low': [1000, 500, 95], 'sun-pale': [420, 230, 46], white: [800, 210, 120], sunrise: [800, 600, 150],
    }[P.cel];
    if (cel) {
      s += Art.glow(cel[0], cel[1], cel[2] * 6, P.light, P.cel === 'white' ? 0.5 : 0.55, 'bloom');
      s += `<circle cx="${cel[0]}" cy="${cel[1]}" r="${cel[2]}" fill="${P.cel.startsWith('moon') ? '#f3f0ff' : P.light}" opacity="${P.cel === 'sun-pale' ? 0.55 : 0.95}"/>`;
      if (P.cel.startsWith('moon')) s += `<circle cx="${cel[0] + cel[2] * 0.3}" cy="${cel[1] - cel[2] * 0.2}" r="${cel[2] * 0.22}" fill="#000" opacity=".06"/><circle cx="${cel[0] - cel[2] * 0.35}" cy="${cel[1] + cel[2] * 0.3}" r="${cel[2] * 0.15}" fill="#000" opacity=".05"/>`;
      if (P.cel === 'sunrise' || key === 'court' || key === 'orchard') for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 8); s += `<path d="M${cel[0]} ${cel[1]} L${cel[0] + Math.cos(a - 0.04) * 1400} ${cel[1] + Math.sin(a - 0.04) * 1400} L${cel[0] + Math.cos(a + 0.04) * 1400} ${cel[1] + Math.sin(a + 0.04) * 1400} Z" fill="${P.light}" opacity=".07" class="ray" style="animation-delay:${i * 0.7}s"/>`; }
    }
    // clouds
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${r() * W}" cy="${80 + r() * 260}" rx="${180 + r() * 260}" ry="${22 + r() * 30}" fill="${P.fog}" opacity="${key === 'tavern' || key === 'fortress' ? 0.18 : 0.12}" filter="url(#blur-xl)" class="drift" style="animation-delay:${-r() * 30}s"/>`;

    const add = Art.compose[key] || Art.compose.road;
    s += add(r, P, layer);

    s += Art.particles(P.part === 'none' ? null : P.part, r, P.part === 'rain' ? 140 : P.part === 'snow' ? 110 : 55);
    s += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
    s += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".07"/>`;
    const doomGrey = G ? Math.min(0.8, G.doom * 0.075) : 0;
    const sat = key === 'wych' || key === 'grey' || key === 'title' ? 1 : 1 - doomGrey;
    const pfx = 'a' + (Art._n = (Art._n || 0) + 1) + '-';
    s = s.replace(/id="([^"]+)"/g, `id="${pfx}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${pfx}$1)`);
    return `<svg class="scene-art" data-key="${key}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${key} illustration" style="filter:saturate(${sat.toFixed(2)})">${s}</svg>`;
  },

  /* ---------- Per-place compositions ---------- */
  compose: {
    title(r, P, L) {
      let s = '';
      s += `<path d="M0 0 C 400 120 900 40 1600 160 L1600 0 Z" fill="#5fd4c4" opacity=".05" filter="url(#blur-xl)"/>`;
      const far = Art.ridge(r, 600, 120, { jag: 0.6, peak: { x: 820, w: 160, h: 1.4 } });
      s += `<path d="${far.d}" fill="${L(0.25)}"/>`;
      const fx = 820, fy = far.yAt(820);
      s += `<path d="M${fx - 16} ${fy + 4} L${fx - 8} ${fy - 120} L${fx} ${fy - 140} L${fx + 8} ${fy - 120} L${fx + 16} ${fy + 4} Z" fill="${L(0.4)}"/>` + Art.glow(fx, fy - 130, 120, '#ff4a2a', 0.6, 'spire') + `<circle cx="${fx}" cy="${fy - 128}" r="5" fill="#ff7a4a" class="flicker"/>`;
      s += Art.fog(560, 140, P.fog, 0.25);
      const mid = Art.ridge(r, 700, 70);
      s += `<path d="${mid.d}" fill="${L(0.6)}"/>`;
      for (let x = 30; x < 1600; x += 22 + r() * 30) if (x < 560 || x > 1050) s += Art.pine(x, mid.yAt(x) + 6, 40 + r() * 40, L(0.68));
      s += Art.fog(700, 120, P.fog, 0.18);
      const near = Art.ridge(r, 830, 50);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      for (let x = 0; x < 1600; x += 40 + r() * 50) if (x < 380 || x > 1220) s += Art.pine(x, near.yAt(x) + 10, 120 + r() * 120, P.near);
      return s;
    },
    town(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 520, 90, { rough: 0.3 });
      s += `<path d="${far.d}" fill="${L(0.2)}"/>` + Art.fog(470, 110, P.fog, 0.3);
      const mid = Art.ridge(r, 640, 50);
      s += `<path d="${mid.d}" fill="${L(0.5)}"/>`;
      const base = 640, cx = 800, c = L(0.75);
      s += `<path d="M${cx - 380} ${base + 30} V${base - 40} H${cx + 380} V${base + 30} Z" fill="${c}"/>`;
      for (let i = 0; i < 16; i++) s += `<rect x="${cx - 378 + i * 48}" y="${base - 54}" width="26" height="16" fill="${c}"/>`;
      for (let i = 0; i < 14; i++) { const x = cx - 340 + i * 50 + r() * 10; s += Art.house(x, base - 38, 34 + r() * 10, 30 + r() * 40, Art.mix(c, '#000', 0.15), r() > 0.35 ? P.light : null); }
      s += Art.tower(cx - 420, base + 30, 60, 170, c, P.light) + Art.tower(cx + 360, base + 30, 60, 170, c, P.light) + Art.tower(cx - 30, base - 30, 54, 120, Art.mix(c, '#000', 0.1), P.light);
      s += `<path d="M${cx + 120} ${base - 90} c 14 -30 -14 -50 4 -90 c 16 -30 -6 -50 8 -80" stroke="${P.fog}" stroke-width="16" fill="none" opacity=".18" filter="url(#blur-m)" class="drift"/>`;
      s += Art.glow(cx, base - 60, 420, P.light, 0.22, 'townglow');
      const near = Art.ridge(r, 820, 40);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      for (let x = 0; x < 1600; x += 40 + r() * 40) if (x < 300 || x > 1300) s += Art.broadTree(x, near.yAt(x) + 10, 1.3 + r() * 0.6, P.near, r);
      return s;
    },
    village(r, P, L) {
      let s = Art.glow(800, 640, 700, '#ff5a2a', 0.5, 'fireglow');
      const far = Art.ridge(r, 560, 80);
      s += `<path d="${far.d}" fill="${L(0.35)}"/>`;
      const mid = Art.ridge(r, 690, 40);
      s += `<path d="${mid.d}" fill="${L(0.7)}"/>`;
      for (let i = 0; i < 10; i++) { const x = 360 + i * 90 + r() * 20; s += Art.house(x, mid.yAt(x) + 10, 60, 40 + r() * 20, L(0.85), '#ffb060'); }
      s += `<path d="M760 ${mid.yAt(760) - 50} q 30 -80 -10 -160 q 40 -60 10 -140" stroke="#ff7a3a" stroke-width="40" fill="none" opacity=".25" filter="url(#blur-xl)"/>`;
      const near = Art.ridge(r, 840, 30);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      for (let x = 0; x < 1600; x += 50 + r() * 50) if (x < 330 || x > 1270) s += Art.pine(x, near.yAt(x) + 10, 140 + r() * 120, P.near);
      return s;
    },
    tavern(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 560, 90);
      s += `<path d="${far.d}" fill="${L(0.3)}"/>`;
      for (let x = 0; x < 1600; x += 18 + r() * 20) s += Art.pine(x, far.yAt(x) + 8, 40 + r() * 30, L(0.4));
      s += Art.fog(560, 120, P.fog, 0.2);
      const g = Art.ridge(r, 780, 20);
      s += `<path d="${g.d}" fill="${L(0.85)}"/>`;
      const bx = 980, by = g.yAt(1100);
      s += `<path d="M${bx} ${by} V${by - 170} L${bx + 140} ${by - 280} L${bx + 280} ${by - 170} V${by} Z" fill="${P.near}"/><rect x="${bx + 250}" y="${by - 260}" width="28" height="80" fill="${P.near}"/>`;
      [[40, 120], [190, 120], [110, 60]].forEach(([dx, dy]) => { s += `<rect x="${bx + dx}" y="${by - dy - 50}" width="44" height="50" rx="3" fill="${P.light}" class="flicker"/>`; });
      s += Art.glow(bx + 140, by - 100, 360, P.light, 0.3, 'innglow');
      s += `<path d="M${bx + 120} ${by} V${by - 70} H${bx + 160} V${by} Z" fill="${P.light}" opacity=".9"/>`;
      for (let x = 0; x < 900; x += 40 + r() * 60) s += Art.pine(x, g.yAt(x) + 10, 160 + r() * 140, P.near);
      return s;
    },
    road(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 500, 110, { jag: 0.4 });
      s += `<path d="${far.d}" fill="${L(0.15)}"/>` + Art.fog(460, 120, P.fog, 0.35);
      const mid = Art.ridge(r, 620, 70);
      s += `<path d="${mid.d}" fill="${L(0.4)}"/>`;
      for (let x = 0; x < 1600; x += 20 + r() * 26) if (r() > 0.4) s += Art.pine(x, mid.yAt(x) + 6, 30 + r() * 26, L(0.5));
      const m2 = Art.ridge(r, 720, 50);
      s += `<path d="${m2.d}" fill="${L(0.65)}"/>`;
      s += `<path d="M720 900 C 760 820 900 790 860 740 S 760 690 820 ${m2.yAt(820) + 4}" stroke="${Art.mix(P.sky[2], L(0.65), 0.45)}" stroke-width="70" fill="none" stroke-linecap="round" opacity=".8"/>`;
      const near = Art.ridge(r, 850, 40);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      for (let x = 0; x < 1600; x += 45 + r() * 50) if (x < 420 || x > 1180) s += Art.broadTree(x, near.yAt(x) + 14, 1.6 + r() * 0.8, P.near, r);
      return s;
    },
    mire(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 540, 50);
      s += `<path d="${far.d}" fill="${L(0.25)}"/>`;
      for (let x = 0; x < 1600; x += 30 + r() * 40) s += Art.deadTree(x, far.yAt(x) + 6, 0.6 + r() * 0.4, L(0.35));
      s += Art.fog(500, 140, P.fog, 0.35);
      s += `<rect y="600" width="1600" height="300" fill="url(#water)"/>`;
      for (let i = 0; i < 40; i++) s += `<rect x="${r() * 1600}" y="${610 + r() * 280}" width="${40 + r() * 160}" height="2" fill="#fff" opacity="${(0.04 + r() * 0.08).toFixed(2)}" class="shimmer" style="animation-delay:${-r() * 6}s"/>`;
      const sx = 1120, sy = 610;
      s += `<path d="M${sx - 30} ${sy} L${sx - 14} ${sy - 230} L${sx + 6} ${sy - 260} L${sx + 18} ${sy - 210} L${sx + 30} ${sy} Z" fill="${L(0.6)}"/><path d="M${sx - 30} ${sy} L${sx - 14} ${sy + 170} L${sx + 18} ${sy + 160} L${sx + 30} ${sy} Z" fill="${L(0.6)}" opacity=".25"/>`;
      for (let i = 0; i < 9; i++) { const x = 60 + i * 180 + r() * 60, sc = 1.2 + r() * 1.4, y = 640 + r() * 200; if (x > 520 && x < 1080 && y < 760) continue; s += Art.deadTree(x, y, sc, P.near) + `<g opacity=".22" transform="translate(0 ${2 * y}) scale(1 -1)">${Art.deadTree(x, y, sc, P.near)}</g>`; }
      s += Art.fog(700, 120, P.fog, 0.2);
      return s;
    },
    mines(r, P, L) {
      let s = Art.glow(800, 820, 900, '#ff3a1a', 0.35, 'lavaglow');
      const far = Art.ridge(r, 470, 220, { jag: 1.2, rough: 0.4 });
      s += `<path d="${far.d}" fill="${L(0.3)}"/>`;
      s += Art.fog(460, 160, P.fog, 0.18);
      const mid = Art.ridge(r, 650, 130, { jag: 0.9 });
      s += `<path d="${mid.d}" fill="${L(0.62)}"/>`;
      const mx = 780, my = mid.yAt(780) + 60;
      s += `<path d="M${mx - 80} ${my + 40} Q${mx} ${my - 110} ${mx + 80} ${my + 40} Z" fill="#120407"/><path d="M${mx - 56} ${my + 40} Q${mx} ${my - 70} ${mx + 56} ${my + 40} Z" fill="#ff8a3a" opacity=".85" class="flicker"/>` + Art.glow(mx, my, 260, '#ff8a3a', 0.45, 'minemouth');
      s += `<path d="M${mx} ${my + 40} C ${mx + 80} 760 ${mx - 160} 820 ${mx - 40} 900" stroke="#ff6a2a" stroke-width="10" fill="none" opacity=".8" class="flicker"/><path d="M${mx} ${my + 40} C ${mx + 80} 760 ${mx - 160} 820 ${mx - 40} 900" stroke="#ff6a2a" stroke-width="40" fill="none" opacity=".25" filter="url(#blur-m)"/>`;
      for (let i = 0; i < 5; i++) { const x = 220 + i * 290; s += `<rect x="${x}" y="${mid.yAt(x) - 60}" width="18" height="90" fill="${L(0.8)}"/>` + `<path d="M${x + 9} ${mid.yAt(x) - 64} q 10 -40 -6 -80" stroke="${P.fog}" stroke-width="12" opacity=".15" fill="none" filter="url(#blur-m)" class="drift"/>`; }
      const near = Art.ridge(r, 860, 50, { jag: 0.5 });
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      return s;
    },
    harbor(r, P, L) {
      let s = '';
      s += `<rect y="520" width="1600" height="380" fill="url(#water)"/>`;
      for (let i = 0; i < 70; i++) s += `<rect x="${r() * 1600}" y="${530 + r() * 360}" width="${20 + r() * 120}" height="2.5" fill="#fff" opacity="${(0.08 + r() * 0.2).toFixed(2)}" class="shimmer" style="animation-delay:${-r() * 6}s"/>`;
      s += `<path d="M0 900 L0 300 C 90 290 190 330 260 420 C 320 500 330 600 380 900 Z" fill="#f1ede4"/><path d="M0 900 L0 360 C 80 360 170 400 230 470 C 280 540 290 650 330 900 Z" fill="#cfc8bb"/>`;
      s += `<path d="M1600 900 L1600 360 C 1500 360 1400 400 1350 470 C 1310 540 1300 650 1260 900 Z" fill="#e6e1d6"/>`;
      for (let i = 0; i < 8; i++) s += Art.house(20 + i * 34, 330 + i * 12 + r() * 10, 28, 26, ['#ffffff', '#f6e7d6', '#e9f2ff'][i % 3], null);
      const bx = 820, by = 600;
      s += `<path d="M${bx - 150} ${by} L${bx + 160} ${by} L${bx + 120} ${by + 44} L${bx - 120} ${by + 44} Z" fill="#2a1a14"/><rect x="${bx - 4}" y="${by - 230}" width="8" height="230" fill="#2a1a14"/><rect x="${bx + 70}" y="${by - 170}" width="6" height="170" fill="#2a1a14"/>`;
      s += `<path d="M${bx + 6} ${by - 220} C ${bx + 110} ${by - 190} ${bx + 110} ${by - 70} ${bx + 6} ${by - 40} Z" fill="#fbf6ec"/><path d="M${bx - 6} ${by - 210} C ${bx - 100} ${by - 180} ${bx - 100} ${by - 80} ${bx - 6} ${by - 50} Z" fill="#f0e9dc"/><path d="M${bx + 76} ${by - 160} C ${bx + 140} ${by - 140} ${bx + 140} ${by - 60} ${bx + 76} ${by - 40} Z" fill="#fbf6ec"/>`;
      s += `<path d="M${bx} ${by - 232} l30 8 -30 8z" fill="#c0392b"/>`;
      s += `<g opacity=".25" transform="translate(0 ${2 * by + 88}) scale(1 -1)"><path d="M${bx + 6} ${by - 220} C ${bx + 110} ${by - 190} ${bx + 110} ${by - 70} ${bx + 6} ${by - 40} Z" fill="#fff"/></g>`;
      for (let i = 0; i < 9; i++) { const x = 400 + r() * 800, y = 110 + r() * 220; s += `<path d="M${x} ${y} q 9 -9 18 0 q 9 -9 18 0" stroke="#fff" stroke-width="2.5" fill="none" class="gull" style="animation-delay:${-r() * 8}s"/>`; }
      return s;
    },
    barrow(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 600, 60);
      s += `<path d="${far.d}" fill="${L(0.3)}"/>` + Art.fog(560, 120, P.fog, 0.2);
      const mid = Art.ridge(r, 720, 40);
      s += `<path d="${mid.d}" fill="${L(0.6)}"/>`;
      s += `<ellipse cx="820" cy="${mid.yAt(820) + 40}" rx="330" ry="170" fill="${L(0.72)}"/><path d="M790 ${mid.yAt(820) - 20} h60 v70 h-60 z" fill="#01020a"/><path d="M800 ${mid.yAt(820) - 10} h40 v60 h-40 z" fill="#8fb0ff" opacity=".18" class="flicker"/>`;
      for (let i = 0; i < 12; i++) { const x = 120 + i * 120 + r() * 30; if (x > 470 && x < 1170) continue; const h = 60 + r() * 70, y = mid.yAt(x) + 20; s += `<path d="M${x} ${y} L${x + 4} ${y - h} Q${x + 14} ${y - h - 10} ${x + 26} ${y - h + 4} L${x + 30} ${y} Z" fill="${L(0.82)}"/>`; }
      s += Art.fog(740, 140, P.fog, 0.15);
      const near = Art.ridge(r, 860, 30);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      return s;
    },
    peak(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 620, 160, { jag: 1, peak: { x: 800, w: 260, h: 2.4 } });
      s += `<path d="${far.d}" fill="${L(0.25)}"/>`;
      const top = far.yAt(800);
      s += `<path d="M${640} ${top + 160} L${800} ${top} L${960} ${top + 160} L${900} ${top + 130} L${860} ${top + 160} L${820} ${top + 120} L${760} ${top + 170} L${700} ${top + 130} Z" fill="#ffffff" opacity=".85"/>`;
      s += Art.tower(782, top + 8, 36, 50, L(0.6), P.light) + `<rect x="760" y="${top + 8}" width="80" height="26" fill="${L(0.6)}"/>` + Art.glow(800, top - 10, 80, P.light, 0.5, 'bellglow');
      s += Art.fog(560, 160, P.fog, 0.3);
      const mid = Art.ridge(r, 760, 110, { jag: 0.8 });
      s += `<path d="${mid.d}" fill="${L(0.55)}"/>`;
      for (let x = 0; x < 1600; x += 16 + r() * 18) if (r() > 0.3) s += Art.pine(x, mid.yAt(x) + 6, 30 + r() * 30, L(0.65));
      const near = Art.ridge(r, 870, 50, { jag: 0.4 });
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      return s;
    },
    orchard(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 600, 50);
      s += `<path d="${far.d}" fill="${L(0.2)}"/>`;
      for (let i = 0; i < 5; i++) for (let x = 0; x < 1600; x += 60) { const y = 600 + i * 50, sc = 0.4 + i * 0.25; if (x > 600 && x < 1000 && i < 3) continue; s += `<circle cx="${x + (i % 2) * 30 + r() * 10}" cy="${y - 20 * sc}" r="${22 * sc}" fill="${Art.mix('#d6efe6', L(0.3 + i * 0.12), 0.5)}"/><rect x="${x + (i % 2) * 30 - 2 * sc}" y="${y - 20 * sc}" width="${4 * sc}" height="${24 * sc}" fill="#e8efe8" opacity=".7"/>`; }
      const tx = 800, ty = 720;
      s += `<path d="M${tx - 40} ${ty} C ${tx - 30} ${ty - 160} ${tx - 60} ${ty - 260} ${tx - 20} ${ty - 360} L${tx + 20} ${ty - 360} C ${tx + 60} ${ty - 260} ${tx + 30} ${ty - 160} ${tx + 40} ${ty} Z" fill="#eef3ee"/><path d="M${tx - 10} ${ty - 200} c -6 40 0 80 4 120" stroke="#9aa3ad" stroke-width="6" fill="none" opacity=".6"/>`;
      for (let i = 0; i < 22; i++) s += `<circle cx="${tx + (r() - 0.5) * 520}" cy="${ty - 380 - (r() - 0.3) * 200}" r="${50 + r() * 60}" fill="${Art.mix('#e6fff4', '#9ed8c0', r() * 0.6)}" opacity=".92"/>`;
      s += Art.glow(tx, ty - 420, 380, '#fffbe0', 0.35, 'treeglow');
      const near = Art.ridge(r, 870, 30);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      return s;
    },
    court(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 560, 70);
      s += `<path d="${far.d}" fill="${L(0.25)}"/>`;
      s += `<rect y="600" width="1600" height="300" fill="url(#water)"/>`;
      for (let i = 0; i < 50; i++) s += `<rect x="${r() * 1600}" y="${610 + r() * 280}" width="${30 + r() * 140}" height="2" fill="#fff" opacity="${(0.06 + r() * 0.14).toFixed(2)}" class="shimmer" style="animation-delay:${-r() * 6}s"/>`;
      const cx = 800, by = 600, c = '#f6efe6', roof = '#e0b04a';
      const castle = `<path d="M${cx - 220} ${by} V${by - 130} H${cx + 220} V${by} Z" fill="${c}"/>` + Art.tower(cx - 260, by, 70, 250, c, '#ffd27a').replace(`fill="${c}"/>`, `fill="${c}"/>`) + Art.tower(cx + 190, by, 70, 250, c, '#ffd27a') + Art.tower(cx - 40, by - 130, 80, 140, c, '#ffd27a') + `<path d="M${cx - 266} ${by - 250} L${cx - 225} ${by - 348} L${cx - 184} ${by - 250} Z M${cx + 184} ${by - 250} L${cx + 225} ${by - 348} L${cx + 266} ${by - 250} Z M${cx - 46} ${by - 270} L${cx} ${by - 382} L${cx + 46} ${by - 270} Z" fill="${roof}"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${cx - 190 + i * 50}" y="${by - 90}" width="14" height="24" rx="7" fill="#ffd27a" class="flicker" style="animation-delay:${i * 0.3}s"/>`).join('');
      s += castle + `<g opacity=".3" transform="translate(0 ${2 * by}) scale(1 -1)">${castle}</g>`;
      s += Art.glow(cx, by - 120, 500, '#ffd6a0', 0.25, 'castleglow');
      for (let x = 0; x < 1600; x += 50 + r() * 50) if (x < 380 || x > 1220) s += Art.broadTree(x, 610, 1.1 + r() * 0.5, L(0.6), r);
      return s;
    },
    wych(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 600, 50);
      s += `<path d="${far.d}" fill="${L(0.25)}"/>` + Art.fog(540, 160, '#ffffff', 0.4);
      const mid = Art.ridge(r, 720, 30);
      s += `<path d="${mid.d}" fill="${L(0.55)}"/>`;
      for (let i = 0; i < 11; i++) { const x = 140 + i * 120; if (x > 640 && x < 960) continue; s += Art.house(x, mid.yAt(x) + 8, 70, 50, L(0.62), null); }
      s += `<path d="M770 ${mid.yAt(800)} V${mid.yAt(800) - 140} L800 ${mid.yAt(800) - 200} L830 ${mid.yAt(800) - 140} V${mid.yAt(800)} Z" fill="${L(0.7)}"/>`;
      for (let i = 0; i < 6; i++) s += Art.deadTree(60 + i * 300 + r() * 60, 860, 1.4 + r() * 0.6, L(0.85));
      const near = Art.ridge(r, 880, 20);
      s += `<path d="${near.d}" fill="${L(0.8)}"/>`;
      return s;
    },
    fortress(r, P, L) {
      let s = Art.glow(800, 560, 700, '#ff2a1a', 0.35, 'doomglow');
      const far = Art.ridge(r, 600, 140, { jag: 1 });
      s += `<path d="${far.d}" fill="${L(0.35)}"/>`;
      const cx = 800, by = 640, c = L(0.75);
      if (G && G.villain === 'abbess') s += `<path d="M${cx - 190} ${by} V${by - 200} L${cx} ${by - 330} L${cx + 190} ${by - 200} V${by} Z" fill="${c}"/>` + Art.tower(cx - 250, by, 60, 280, c) + Art.tower(cx + 190, by, 60, 280, c) + `<circle cx="${cx}" cy="${by - 200}" r="44" fill="#c9ced6" opacity=".55"/><circle cx="${cx}" cy="${by - 200}" r="44" fill="none" stroke="${c}" stroke-width="8"/>`;
      else if (G && G.villain === 'kharsk') { for (let i = 0; i < 40; i++) s += `<path d="M${cx - 420 + i * 21} ${by} L${cx - 412 + i * 21} ${by - 110 - r() * 30} L${cx - 404 + i * 21} ${by} Z" fill="${c}"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${cx - 200 + i * 100} ${by - 100} L${cx - 150 + i * 100} ${by - 190} L${cx - 100 + i * 100} ${by - 100} Z" fill="${Art.mix(c, '#5a0a0a', 0.5)}"/>`; }
      else s += `<path d="M${cx - 60} ${by} L${cx - 30} ${by - 420} L${cx} ${by - 470} L${cx + 30} ${by - 420} L${cx + 60} ${by} Z" fill="${c}"/><path d="M${cx - 120} ${by} L${cx - 90} ${by - 220} L${cx - 70} ${by} Z M${cx + 70} ${by} L${cx + 90} ${by - 260} L${cx + 120} ${by} Z" fill="${c}"/>` + `<circle cx="${cx}" cy="${by - 420}" r="8" fill="#ff6a3a" class="flicker"/>` + Art.glow(cx, by - 420, 120, '#ff4a2a', 0.6, 'spireglow');
      s += Art.fog(600, 140, P.fog, 0.25);
      const near = Art.ridge(r, 860, 50, { jag: 0.6 });
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      for (let i = 0; i < 6; i++) s += Art.deadTree(80 + i * 290 + r() * 60, near.yAt(80 + i * 290) + 10, 1.6, P.near);
      return s;
    },
    camp(r, P, L) {
      let s = `<path d="M0 260 C 300 200 600 320 900 240 S 1400 180 1600 260" stroke="#5fd4c4" stroke-width="60" fill="none" opacity=".08" filter="url(#blur-xl)"/>`;
      const far = Art.ridge(r, 600, 110, { jag: 0.4 });
      s += `<path d="${far.d}" fill="${L(0.35)}"/>`;
      for (let x = 0; x < 1600; x += 16 + r() * 20) s += Art.pine(x, far.yAt(x) + 6, 30 + r() * 30, L(0.42));
      const near = Art.ridge(r, 820, 30);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      const fx = 800, fy = near.yAt(800) + 20;
      s += Art.glow(fx, fy - 30, 420, '#ff8a3a', 0.5, 'campglow');
      s += `<path d="M${fx - 40} ${fy} L${fx} ${fy - 90} L${fx + 40} ${fy} Z" fill="#ff8a3a" class="flame"/><path d="M${fx - 22} ${fy} L${fx} ${fy - 56} L${fx + 22} ${fy} Z" fill="#ffe08a" class="flame" style="animation-delay:.2s"/><path d="M${fx - 60} ${fy + 6} L${fx + 60} ${fy - 6} M${fx - 60} ${fy - 6} L${fx + 60} ${fy + 6}" stroke="#1a0a04" stroke-width="10"/>`;
      for (let x = 0; x < 1600; x += 50 + r() * 60) if (x < 450 || x > 1150) s += Art.pine(x, near.yAt(x) + 10, 180 + r() * 160, P.near);
      return s;
    },
    dawn(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 620, 80);
      s += `<path d="${far.d}" fill="${L(0.2)}"/>` + Art.fog(580, 140, P.fog, 0.4);
      const mid = Art.ridge(r, 720, 60);
      s += `<path d="${mid.d}" fill="${L(0.45)}"/>`;
      for (let x = 0; x < 1600; x += 30 + r() * 40) if (x < 560 || x > 1040) s += Art.broadTree(x, mid.yAt(x) + 10, 0.7 + r() * 0.3, L(0.55), r);
      const near = Art.ridge(r, 860, 40);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      return s;
    },
    grey(r, P, L) {
      let s = '';
      const far = Art.ridge(r, 560, 90);
      s += `<path d="${far.d}" fill="${L(0.3)}"/>` + Art.fog(520, 200, P.fog, 0.35);
      const mid = Art.ridge(r, 720, 60);
      s += `<path d="${mid.d}" fill="${L(0.6)}"/>`;
      for (let i = 0; i < 7; i++) s += Art.deadTree(80 + i * 240 + r() * 60, mid.yAt(80 + i * 240) + 10, 1.1 + r() * 0.5, L(0.75));
      const near = Art.ridge(r, 860, 30);
      s += `<path d="${near.d}" fill="${P.near}"/>`;
      return s;
    },
  },

  /* ---------------- The journey map: a night-sky chart of the valley ---------------- */
  MAP_POS: {
    hearthmoor: [310, 230], stronghold: [305, 42],
    wych: [185, 88], peak: [440, 88], barrow: [120, 172], mines: [505, 172],
    orchard: [72, 262], mire: [165, 320], court: [335, 345], harbor: [525, 305],
  },

  map() {
    const pos = Art.MAP_POS;
    const [hx, hy] = pos.hearthmoor;
    const doom = G.doom;
    const r = Art.rng('map' + G.started);
    let s = `<svg class="journey-map" viewBox="0 0 600 420" role="img" aria-label="Map of the valley">
      <defs>
        <radialGradient id="mapbg" cx="50%" cy="55%" r="75%"><stop offset="0" stop-color="#1b2550"/><stop offset="1" stop-color="#080b1f"/></radialGradient>
        <radialGradient id="haze" cx="${pos.stronghold[0] / 6}%" cy="${pos.stronghold[1] / 4.2}%" r="${18 + doom * 9}%"><stop offset="0" stop-color="#a7adb5" stop-opacity=".75"/><stop offset="1" stop-color="#a7adb5" stop-opacity="0"/></radialGradient>
        <radialGradient id="mk-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="600" height="420" rx="18" fill="url(#mapbg)"/>`;
    for (let i = 0; i < 90; i++) s += `<circle cx="${r() * 600}" cy="${r() * 420}" r="${r() * 0.9 + 0.2}" fill="#fff" opacity="${0.15 + r() * 0.4}"/>`;
    s += `<path d="M0 340 C 120 310 200 370 300 380 S 480 350 600 370 L600 420 L0 420 Z" fill="#2a5a9a" opacity=".35"/>`;
    for (let i = 0; i < 6; i++) { const x = 30 + r() * 540, y = 30 + r() * 120; s += `<path d="M${x} ${y + 14} l12 -16 l12 16" stroke="#6a7ac0" stroke-width="1.5" fill="none" opacity=".5"/>`; }
    G.regions.forEach(rr => { const [x, y] = pos[rr]; s += `<line x1="${hx}" y1="${hy}" x2="${x}" y2="${y}" stroke="#8fa0e0" stroke-width="1.5" stroke-dasharray="4 6" opacity=".6"/>`; });
    s += `<line x1="${hx}" y1="${hy}" x2="${pos.stronghold[0]}" y2="${pos.stronghold[1]}" stroke="#ff6a5a" stroke-width="1.5" stroke-dasharray="2 6" opacity=".7"/>`;
    G.regionsDone.forEach(rr => { const [x, y] = pos[rr]; s += `<path d="M${hx} ${hy} L${x} ${y}" stroke="#ffd27a" stroke-width="3" fill="none" opacity=".85"/>`; });
    s += `<rect width="600" height="420" rx="18" fill="url(#haze)"/>`;
    const ic = (name, x, y, size, col) => `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</g>`;
    Object.keys(REGIONS).forEach(rr => {
      const [x, y] = pos[rr];
      const onMap = G.regions.includes(rr), done = G.regionsDone.includes(rr);
      const f = G.fragLoc[rr];
      const state = !onMap ? 'off' : done ? (G.fragments[f] === 'party' ? 'won' : 'lost') : 'open';
      const ring = { off: '#3a4470', won: '#ffd27a', lost: '#ff6a5a', open: '#cfd8ff' }[state];
      const raided = G.flags.raid_target === rr && G.flags.raid_state !== 'repelled';
      s += `<g opacity="${onMap ? 1 : 0.4}">${state === 'open' || state === 'won' ? `<circle cx="${x}" cy="${y}" r="34" fill="url(#mk-glow)" opacity="${state === 'won' ? 0.9 : 0.4}"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${onMap ? 17 : 12}" fill="#0d1230" stroke="${ring}" stroke-width="2"/>${ic(rr, x, y, onMap ? 18 : 13, ring)}
        <text x="${x}" y="${y + (onMap ? 33 : 26)}" text-anchor="middle" font-size="11.5" font-family="Cinzel, serif" fill="${onMap ? '#e6e9ff' : '#6a74a8'}" letter-spacing=".5">${REGIONS[rr].short}</text>
        ${raided ? `<circle cx="${x + 15}" cy="${y - 14}" r="6" fill="#ff6a3a"/>` : ''}${state === 'won' ? ic('axe', x - 22, y - 14, 12, '#ffd27a') : ''}${state === 'lost' ? ic('doom', x - 22, y - 14, 12, '#ff6a5a') : ''}</g>`;
    });
    s += `<circle cx="${hx}" cy="${hy}" r="40" fill="url(#mk-glow)"/><circle cx="${hx}" cy="${hy}" r="17" fill="#2a1a10" stroke="#ffd27a" stroke-width="2"/>${ic('town', hx, hy, 18, '#ffd27a')}<text x="${hx}" y="${hy + 34}" text-anchor="middle" font-size="12" font-family="Cinzel, serif" fill="#ffe7b0">Hearthmoor</text>`;
    const [sx, sy] = pos.stronghold;
    s += `<circle cx="${sx}" cy="${sy}" r="17" fill="#1a0608" stroke="#ff6a5a" stroke-width="2"/>${ic('fortress', sx, sy, 17, '#ff8a7a')}<text x="${sx + 26}" y="${sy + 4}" font-size="11.5" font-family="Cinzel, serif" fill="#ffb0a8">${cap(V().stronghold)}</text>`;
    const cur = G.flags.currentRegion && !G.regionsDone.includes(G.flags.currentRegion) ? pos[G.flags.currentRegion] : (/^fin_/.test(G.scene) ? pos.stronghold : pos.hearthmoor);
    s += `<circle class="you-are-here" cx="${cur[0]}" cy="${cur[1]}" r="25" fill="none" stroke="#5fd4c4" stroke-width="2.5"/>`;
    s += `<text x="18" y="404" font-size="11" font-family="Cormorant Garamond, serif" fill="#9aa3d0">Gold ring: fragment recovered · red: lost · ember: raided · grey haze: the Hollow's reach (Doom ${doom})</text></svg>`;
    return s;
  },
};
