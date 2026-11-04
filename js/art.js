/* ===========================================================
   ART — procedural SVG scene banners and the journey map.
   No image files: every landscape is drawn from layered shapes.
   The Hollow's Doom drains colour from the art as it rises.
   =========================================================== */

const Art = {
  /* Small deterministic RNG so each scene's art is stable between renders */
  rng(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },

  hills(r, y, amp, color, w = 800, n = 7) {
    let d = `M0 200 L0 ${y}`;
    for (let i = 0; i <= n; i++) { const x = (w / n) * i; const yy = y - r() * amp; d += ` Q ${x - w / n / 2} ${yy - amp * 0.4} ${x} ${yy}`; }
    return `<path d="${d} L${w} 200 Z" fill="${color}"/>`;
  },
  mountains(r, base, h, color, n = 5) {
    let d = `M0 200 L0 ${base}`;
    for (let i = 0; i < n; i++) { const x0 = (800 / n) * i, x1 = x0 + 800 / n / 2, x2 = x0 + 800 / n; d += ` L${x1 + (r() - 0.5) * 40} ${base - h * (0.5 + r() * 0.5)} L${x2} ${base - r() * 20}`; }
    return `<path d="${d} L800 200 Z" fill="${color}"/>`;
  },
  tree(x, y, s, c) { return `<path d="M${x} ${y} l${-8 * s} 0 l${8 * s} ${-30 * s} l${8 * s} ${30 * s} Z M${x} ${y - 10 * s} l${-6 * s} 0 l${6 * s} ${-26 * s} l${6 * s} ${26 * s} Z" fill="${c}"/><rect x="${x - s}" y="${y}" width="${2 * s}" height="${6 * s}" fill="${c}"/>`; },
  roundTree(x, y, s, c, t) { return `<rect x="${x - 1.5 * s}" y="${y - 14 * s}" width="${3 * s}" height="${14 * s}" fill="${t}"/><circle cx="${x}" cy="${y - 20 * s}" r="${11 * s}" fill="${c}"/>`; },
  deadTree(x, y, s, c) { return `<path d="M${x} ${y} L${x} ${y - 40 * s} M${x} ${y - 25 * s} L${x - 14 * s} ${y - 38 * s} M${x} ${y - 32 * s} L${x + 12 * s} ${y - 46 * s} M${x - 8 * s} ${y - 32 * s} L${x - 12 * s} ${y - 44 * s}" stroke="${c}" stroke-width="${2.5 * s}" stroke-linecap="round" fill="none"/>`; },
  house(x, y, w, h, c, roof, lit) { return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/><path d="M${x - 3} ${y - h} L${x + w / 2} ${y - h - w * 0.55} L${x + w + 3} ${y - h} Z" fill="${roof}"/>${lit ? `<rect x="${x + w * 0.35}" y="${y - h * 0.65}" width="${w * 0.3}" height="${h * 0.3}" fill="${lit}"/>` : ''}`; },
  tower(x, y, w, h, c, cap) { return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/><path d="M${x - 4} ${y - h} L${x + w / 2} ${y - h - w * 1.3} L${x + w + 4} ${y - h} Z" fill="${cap}"/>`; },
  stars(r, n, c) { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${r() * 800}" cy="${r() * 90}" r="${r() * 1.3 + 0.3}" fill="${c}" opacity="${0.4 + r() * 0.6}"/>`; return s; },

  /* Which banner suits a scene */
  keyFor(id) {
    if (!id) return 'road';
    if (/^end_(victory|redemption|florian|sacrifice)/.test(id)) return 'dawn';
    if (/^end_/.test(id)) return 'grey';
    const pre = id.split('_')[0];
    if (['mire', 'mines', 'harbor', 'barrow', 'peak', 'orchard', 'court', 'wych'].includes(pre)) return pre;
    if (pre === 'fin') return 'fortress';
    if (/^(hub|bg|camp|villain|siege)/.test(id)) return id.startsWith('camp') ? 'camp' : 'town';
    if (pre === 'pro') return G && G.flags.hook === 'thornbury' ? 'village' : G && G.flags.hook === 'caravan' ? 'road' : 'tavern';
    if (id === 'vision') return 'camp';
    return 'road';
  },

  scene(id) {
    const key = Art.keyFor(id);
    const r = Art.rng(key + (G ? G.villain : ''));
    const P = Art.palettes[key] || Art.palettes.road;
    let body = '';
    const sky = `<defs><linearGradient id="sky-${key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset="1" stop-color="${P.sky[1]}"/></linearGradient></defs><rect width="800" height="200" fill="url(#sky-${key})"/>`;
    switch (key) {
      case 'town':
        body += `<circle cx="640" cy="50" r="22" fill="${P.sun}" opacity=".85"/>` + Art.hills(r, 120, 25, P.far) + `<rect x="120" y="120" width="560" height="60" fill="${P.mid}"/>`;
        for (let i = 0; i < 9; i++) body += Art.house(150 + i * 58, 150, 34, 26 + r() * 18, P.near, P.roof, r() > 0.4 ? P.lit : null);
        body += Art.tower(110, 160, 26, 70, P.mid, P.roof) + Art.tower(665, 160, 26, 70, P.mid, P.roof);
        body += `<path d="M420 104 q10 -20 0 -40 q-10 -20 5 -40" stroke="${P.smoke}" stroke-width="6" fill="none" opacity=".35"/>` + Art.hills(r, 178, 8, P.ground);
        break;
      case 'village':
        body += Art.stars(r, 30, '#fff') + Art.hills(r, 130, 20, P.far);
        for (let i = 0; i < 7; i++) body += Art.house(120 + i * 85, 170, 40, 26, P.near, P.roof, P.lit);
        body += `<ellipse cx="400" cy="140" rx="160" ry="60" fill="${P.sun}" opacity=".25"/>` + Art.hills(r, 182, 6, P.ground);
        for (let i = 0; i < 6; i++) body += Art.tree(40 + i * 140 + r() * 30, 190, 1.2, P.tree);
        break;
      case 'tavern':
        body += Art.hills(r, 125, 20, P.far) + Art.house(310, 175, 180, 70, P.near, P.roof, P.lit) + `<rect x="385" y="140" width="30" height="35" fill="${P.lit}" opacity=".8"/>`;
        for (let i = 0; i < 90; i++) body += `<line x1="${r() * 800}" y1="${r() * 200}" x2="${r() * 800 - 6}" y2="${r() * 200 + 14}" stroke="#9fb3c8" stroke-width="1" opacity=".35"/>`;
        for (let i = 0; i < 8; i++) body += Art.tree(i * 110 + r() * 40, 195, 1.4, P.tree);
        break;
      case 'mire':
        body += `<circle cx="200" cy="60" r="26" fill="${P.sun}" opacity=".5"/>` + Art.hills(r, 130, 15, P.far) + `<rect y="150" width="800" height="50" fill="${P.water}"/>`;
        body += `<path d="M560 150 L575 70 L590 150 Z" fill="${P.mid}"/><path d="M570 85 l14 -6" stroke="${P.mid}" stroke-width="4"/>`;
        for (let i = 0; i < 9; i++) body += Art.deadTree(40 + i * 90 + r() * 30, 155 + r() * 10, 0.9 + r() * 0.6, P.tree);
        for (let i = 0; i < 12; i++) body += `<ellipse cx="${r() * 800}" cy="${160 + r() * 35}" rx="${20 + r() * 40}" ry="2" fill="#fff" opacity=".07"/>`;
        for (let i = 0; i < 5; i++) body += `<circle cx="${r() * 800}" cy="${120 + r() * 50}" r="3" fill="#9fe37a" opacity=".7"/>`;
        break;
      case 'mines':
        body += Art.mountains(r, 150, 120, P.far, 4) + Art.mountains(r, 175, 80, P.mid, 6);
        body += `<path d="M360 180 q40 -60 80 0 Z" fill="#1a0f08"/><path d="M372 180 q28 -42 56 0 Z" fill="${P.lit}" opacity=".7"/>`;
        for (let i = 0; i < 4; i++) body += `<rect x="${200 + i * 120}" y="${130 + r() * 20}" width="12" height="50" fill="${P.near}"/>`;
        body += Art.hills(r, 188, 6, P.ground);
        break;
      case 'harbor':
        body += `<circle cx="660" cy="60" r="24" fill="${P.sun}"/><rect y="130" width="800" height="70" fill="${P.water}"/>`;
        body += `<path d="M0 200 L0 70 L90 80 L150 130 L170 200 Z" fill="${P.cliff}"/><path d="M640 200 L680 120 L800 100 L800 200 Z" fill="${P.cliff}"/>`;
        body += `<path d="M330 150 L470 150 L450 166 L350 166 Z" fill="${P.near}"/><rect x="398" y="70" width="4" height="80" fill="${P.near}"/><path d="M402 76 L452 120 L402 132 Z" fill="${P.sail}"/><path d="M398 80 L358 122 L398 130 Z" fill="${P.sail}"/>`;
        for (let i = 0; i < 6; i++) body += `<path d="M${200 + r() * 400} ${30 + r() * 50} q6 -6 12 0 q6 -6 12 0" stroke="#fff" stroke-width="1.6" fill="none"/>`;
        break;
      case 'barrow':
        body += Art.stars(r, 50, '#fff') + `<circle cx="150" cy="50" r="18" fill="${P.sun}"/>` + Art.hills(r, 140, 15, P.far);
        body += `<ellipse cx="420" cy="180" rx="190" ry="70" fill="${P.mid}"/><rect x="400" y="138" width="40" height="34" fill="#0c0b10"/>`;
        for (let i = 0; i < 10; i++) { const x = 40 + i * 78 + r() * 20; if (x > 230 && x < 610) continue; body += `<rect x="${x}" y="${150 - r() * 20}" width="12" height="${40 + r() * 20}" fill="${P.near}"/>`; }
        body += Art.hills(r, 190, 5, P.ground);
        break;
      case 'peak':
        body += `<path d="M150 200 L400 15 L650 200 Z" fill="${P.far}"/><path d="M340 60 L400 15 L460 60 L430 55 L400 70 L370 52 Z" fill="${P.snow}"/>`;
        body += Art.tower(388, 48, 24, 26, P.near, P.roof) + `<circle cx="400" cy="14" r="5" fill="${P.lit}"/>` + Art.mountains(r, 185, 60, P.mid, 6);
        for (let i = 0; i < 60; i++) body += `<circle cx="${r() * 800}" cy="${r() * 200}" r="${r() * 1.6}" fill="#fff" opacity=".7"/>`;
        break;
      case 'orchard':
        body += `<circle cx="600" cy="55" r="22" fill="${P.sun}"/>` + Art.hills(r, 140, 15, P.far);
        body += `<rect x="388" y="70" width="24" height="110" fill="${P.trunk}"/><circle cx="400" cy="60" r="70" fill="${P.canopy}"/><circle cx="350" cy="80" r="40" fill="${P.canopy}"/><circle cx="455" cy="78" r="44" fill="${P.canopy}"/>`;
        for (let i = 0; i < 10; i++) { const x = 30 + i * 80; if (x > 300 && x < 500) continue; body += Art.roundTree(x, 185, 1.1, P.tree, P.trunk); }
        body += `<path d="M395 120 q-4 30 2 60" stroke="#999" stroke-width="3" fill="none" opacity=".5"/>` + Art.hills(r, 192, 4, P.ground);
        break;
      case 'court':
        body += `<circle cx="160" cy="45" r="20" fill="${P.sun}"/><rect y="140" width="800" height="60" fill="${P.water}"/>`;
        body += `<rect x="300" y="90" width="200" height="50" fill="${P.near}"/>` + Art.tower(290, 140, 30, 80, P.near, P.roof) + Art.tower(480, 140, 30, 80, P.near, P.roof) + Art.tower(385, 90, 30, 50, P.near, P.roof);
        for (let i = 0; i < 6; i++) body += `<rect x="${320 + i * 30}" y="110" width="8" height="12" fill="${P.lit}"/>`;
        body += `<g opacity=".25" transform="translate(0 280) scale(1 -1)"><rect x="300" y="90" width="200" height="50" fill="${P.near}"/></g>` + Art.hills(r, 150, 10, P.far);
        break;
      case 'wych':
        body += `<circle cx="400" cy="55" r="34" fill="#f4f4f4"/>` + Art.hills(r, 140, 10, P.far);
        for (let i = 0; i < 8; i++) body += Art.house(70 + i * 90, 175, 40, 26, P.near, P.roof, null);
        body += `<rect x="380" y="110" width="40" height="65" fill="${P.mid}"/><path d="M376 110 L400 80 L424 110" fill="none" stroke="${P.mid}" stroke-width="4"/>`;
        for (let i = 0; i < 5; i++) body += Art.deadTree(30 + i * 190, 190, 1, P.tree);
        break;
      case 'fortress': {
        body += Art.mountains(r, 160, 70, P.far, 5);
        if (G && G.villain === 'abbess') body += `<rect x="330" y="80" width="140" height="100" fill="${P.near}"/>` + Art.tower(350, 80, 24, 50, P.near, P.near) + Art.tower(426, 80, 24, 50, P.near, P.near) + `<circle cx="400" cy="110" r="18" fill="#9aa3ad" opacity=".6"/>`;
        else if (G && G.villain === 'kharsk') { for (let i = 0; i < 26; i++) body += `<path d="M${230 + i * 13} 180 L${236 + i * 13} ${130 - r() * 15} L${242 + i * 13} 180 Z" fill="${P.near}"/>`; body += `<path d="M360 135 L400 95 L440 135 Z" fill="#5a1a14"/>`; }
        else body += `<path d="M380 180 L390 20 L400 10 L410 20 L420 180 Z" fill="${P.near}"/><circle cx="400" cy="40" r="5" fill="#ff7a3d"/>`;
        for (let i = 0; i < 40; i++) body += `<circle cx="${r() * 800}" cy="${r() * 200}" r="${r() * 2}" fill="#bbb" opacity=".5"/>`;
        body += Art.hills(r, 190, 6, P.ground);
        break;
      }
      case 'camp':
        body += Art.stars(r, 70, '#fff') + Art.hills(r, 140, 25, P.far) + Art.hills(r, 175, 12, P.mid);
        body += `<ellipse cx="400" cy="175" rx="80" ry="20" fill="${P.lit}" opacity=".25"/><path d="M385 178 L400 150 L415 178 Z" fill="${P.lit}"/><path d="M392 178 L400 160 L408 178 Z" fill="#fff3b0"/>`;
        for (let i = 0; i < 6; i++) body += Art.tree(60 + i * 140 + r() * 30, 192, 1.3, P.tree);
        break;
      case 'dawn':
        body += `<circle cx="400" cy="150" r="60" fill="${P.sun}"/>` + Art.hills(r, 150, 20, P.far) + Art.hills(r, 178, 12, P.mid);
        for (let i = 0; i < 12; i++) body += `<line x1="400" y1="150" x2="${400 + Math.cos(Math.PI + i * Math.PI / 11) * 400}" y2="${150 + Math.sin(Math.PI + i * Math.PI / 11) * 400}" stroke="${P.sun}" stroke-width="2" opacity=".25"/>`;
        break;
      case 'grey':
        body += Art.hills(r, 130, 20, P.far) + Art.hills(r, 170, 15, P.mid);
        for (let i = 0; i < 80; i++) body += `<circle cx="${r() * 800}" cy="${r() * 200}" r="${r() * 2}" fill="#ddd" opacity=".4"/>`;
        break;
      default:
        body += `<circle cx="620" cy="55" r="22" fill="${P.sun}"/>` + Art.hills(r, 120, 30, P.far) + Art.hills(r, 160, 20, P.mid);
        body += `<path d="M380 200 Q 420 170 390 150 T 420 115" stroke="${P.road}" stroke-width="14" fill="none" opacity=".8"/>`;
        for (let i = 0; i < 7; i++) body += Art.tree(50 + i * 115 + r() * 40, 196, 1.3, P.tree);
    }
    const doomGrey = G ? Math.min(0.85, G.doom * 0.08) : 0;
    const keep = key === 'wych' || key === 'grey' ? 0 : 1 - doomGrey;
    return `<svg class="scene-art" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${key} illustration" style="filter:saturate(${keep.toFixed(2)})">${sky}${body}<rect width="800" height="200" fill="#9aa3ad" opacity="${(doomGrey * 0.25).toFixed(2)}"/></svg>`;
  },

  palettes: {
    town: { sky: ['#f2b56b', '#f7dfb2'], sun: '#fff1c1', far: '#8d9c6d', mid: '#7a6450', near: '#5c4635', roof: '#8e3b2c', lit: '#ffd27a', smoke: '#555', ground: '#4a3a2c' },
    village: { sky: ['#1b1530', '#5a2a2a'], sun: '#ff8a3d', far: '#2c2333', near: '#1e1720', roof: '#3a2228', lit: '#ffb347', ground: '#140f12', tree: '#0f0c10' },
    tavern: { sky: ['#1d2633', '#3a4b5c'], far: '#26313d', near: '#3d2e22', roof: '#2a1f18', lit: '#ffcf7a', tree: '#141b22' },
    road: { sky: ['#8fb6d9', '#e6efe0'], sun: '#fff8d6', far: '#8aa77b', mid: '#5f7f55', road: '#c9b48a', tree: '#2f4a2f' },
    mire: { sky: ['#5d6b5a', '#a9b39a'], sun: '#e9ecd2', far: '#4f5c48', mid: '#2e3529', water: '#1f2a22', tree: '#232a20' },
    mines: { sky: ['#4a2a23', '#c7764a'], far: '#5b3a2e', mid: '#3a2620', near: '#24170f', lit: '#ff9b3d', ground: '#1e140e' },
    harbor: { sky: ['#6fa8d6', '#d8ecf5'], sun: '#fffbe0', water: '#2c6d8f', cliff: '#e8e2d0', near: '#4a3424', sail: '#f3ead8' },
    barrow: { sky: ['#101425', '#3b4466'], sun: '#e8ecff', far: '#2d3550', mid: '#3c4a3a', near: '#7c8090', ground: '#1d241c' },
    peak: { sky: ['#5c7ea8', '#d7e4f2'], far: '#7b8aa0', snow: '#f4f8ff', mid: '#4d5a6c', near: '#3b2f2a', roof: '#6d3b2b', lit: '#ffd27a' },
    orchard: { sky: ['#a9c9a0', '#eef3dc'], sun: '#fffbe0', far: '#8fae86', canopy: '#b9c7c9', tree: '#a8bdb6', trunk: '#d8dcd6', ground: '#6f8a62' },
    court: { sky: ['#e9a98b', '#f8e4c8'], sun: '#fff4d0', water: '#7fa6c2', near: '#efe8dc', roof: '#c9a245', lit: '#ffd27a', far: '#9cb08c' },
    wych: { sky: ['#cfcfcf', '#efefef'], far: '#b9b9b9', mid: '#8f8f8f', near: '#a3a3a3', roof: '#7d7d7d', tree: '#6f6f6f' },
    fortress: { sky: ['#1c1c22', '#5a5560'], far: '#34323a', near: '#141317', ground: '#1a191d' },
    camp: { sky: ['#0d1224', '#26304d'], far: '#1a2138', mid: '#121829', lit: '#ff9b3d', tree: '#0b0f1c' },
    dawn: { sky: ['#f6b26b', '#fde9c4'], sun: '#fff3c0', far: '#8fb07a', mid: '#5c8a52' },
    grey: { sky: ['#5f6266', '#8d9196'], far: '#4b4e52', mid: '#3a3c40' },
  },

  /* ---------------- The journey map ---------------- */
  MAP_POS: {
    hearthmoor: [310, 230], stronghold: [305, 38],
    wych: [185, 80], peak: [440, 82], barrow: [120, 170], mines: [505, 170],
    orchard: [70, 265], mire: [165, 320], court: [335, 345], harbor: [525, 305],
  },

  map() {
    const pos = Art.MAP_POS;
    const [hx, hy] = pos.hearthmoor;
    const doom = G.doom;
    let s = `<svg class="journey-map" viewBox="0 0 600 420" role="img" aria-label="Map of the valley">
      <defs>
        <radialGradient id="haze" cx="${pos.stronghold[0] / 6}%" cy="${pos.stronghold[1] / 4.2}%" r="${20 + doom * 9}%"><stop offset="0" stop-color="#6b6f75" stop-opacity=".85"/><stop offset="1" stop-color="#6b6f75" stop-opacity="0"/></radialGradient>
        <pattern id="parch" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#e9dcbc"/><circle cx="12" cy="18" r="1" fill="#cbb98f"/><circle cx="44" cy="40" r="1.2" fill="#cbb98f"/></pattern>
      </defs>
      <rect width="600" height="420" rx="14" fill="url(#parch)"/>
      <path d="M0 330 Q120 300 200 360 T420 390 T600 360 L600 420 L0 420 Z" fill="#a9c3c9" opacity=".6"/>
      <path d="M500 40 l26 -24 l26 24 M540 62 l20 -20 l20 20 M40 60 l20 -22 l20 22 M70 40 l16 -16 l16 16" stroke="#8b7a5a" stroke-width="3" fill="none"/>`;
    // roads to the three marked regions
    G.regions.forEach(r => { const [x, y] = pos[r]; s += `<line x1="${hx}" y1="${hy}" x2="${x}" y2="${y}" stroke="#8b6a3a" stroke-width="2" stroke-dasharray="6 6"/>`; });
    s += `<line x1="${hx}" y1="${hy}" x2="${pos.stronghold[0]}" y2="${pos.stronghold[1]}" stroke="#5a2a2a" stroke-width="2" stroke-dasharray="2 6"/>`;
    // the route travelled
    let px = hx, py = hy;
    G.regionsDone.forEach(r => { const [x, y] = pos[r]; s += `<path d="M${px} ${py} L${x} ${y} L${hx} ${hy}" stroke="#b07d2a" stroke-width="4" fill="none" opacity=".85"/>`; });
    s += `<rect width="600" height="420" rx="14" fill="url(#haze)"/>`;
    // region markers
    Object.keys(REGIONS).forEach(r => {
      const [x, y] = pos[r];
      const onMap = G.regions.includes(r);
      const done = G.regionsDone.includes(r);
      const f = G.fragLoc[r];
      const state = !onMap ? 'off' : done ? (G.fragments[f] === 'party' ? 'won' : 'lost') : 'open';
      const fill = { off: '#cbbd9c', won: '#d9a441', lost: '#7a3a2e', open: '#fff6e0' }[state];
      const raided = G.flags.raid_target === r && G.flags.raid_state !== 'repelled';
      s += `<g opacity="${onMap ? 1 : 0.45}"><circle cx="${x}" cy="${y}" r="${onMap ? 20 : 14}" fill="${fill}" stroke="#5c4635" stroke-width="2"/>
        <text x="${x}" y="${y + 6}" text-anchor="middle" font-size="${onMap ? 18 : 13}">${REGIONS[r].icon}</text>
        <text x="${x}" y="${y + (onMap ? 36 : 28)}" text-anchor="middle" font-size="12" font-family="Cinzel, serif" fill="#3b2c1e">${REGIONS[r].short}</text>
        ${raided ? `<text x="${x + 18}" y="${y - 14}" font-size="14">🔥</text>` : ''}
        ${state === 'won' ? `<text x="${x - 30}" y="${y - 12}" font-size="12">⚒️</text>` : ''}${state === 'lost' ? `<text x="${x - 30}" y="${y - 12}" font-size="12">💀</text>` : ''}</g>`;
    });
    s += `<circle cx="${hx}" cy="${hy}" r="16" fill="#8e3b2c" stroke="#3b2c1e" stroke-width="2"/><text x="${hx}" y="${hy + 5}" text-anchor="middle" font-size="15">🏰</text><text x="${hx}" y="${hy + 32}" text-anchor="middle" font-size="12" font-family="Cinzel, serif" fill="#3b2c1e">Hearthmoor</text>`;
    const [sx, sy] = pos.stronghold;
    s += `<circle cx="${sx}" cy="${sy}" r="16" fill="#2a2228" stroke="#000" stroke-width="2"/><text x="${sx}" y="${sy + 5}" text-anchor="middle" font-size="14">💀</text><text x="${sx + 22}" y="${sy + 4}" font-size="12" font-family="Cinzel, serif" fill="#2a1f18">${cap(V().stronghold)}</text>`;
    const cur = G.flags.currentRegion && !G.regionsDone.includes(G.flags.currentRegion) ? pos[G.flags.currentRegion] : (/^fin_/.test(G.scene) ? pos.stronghold : pos.hearthmoor);
    s += `<circle class="you-are-here" cx="${cur[0]}" cy="${cur[1]}" r="26" fill="none" stroke="#c4513d" stroke-width="3"/>`;
    s += `<text x="16" y="404" font-size="12" font-family="Crimson Pro, serif" fill="#5c4635">⚒️ fragment recovered · 💀 lost · 🔥 raided · grey haze = the Hollow's reach (Doom ${doom})</text></svg>`;
    return s;
  },
};
