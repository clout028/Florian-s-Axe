/* ===========================================================
   ICONS — a hand-drawn line icon set (24×24, currentColor).
   Replaces emoji so the interface looks the same everywhere.
   Usage: Icon('sword') → '<svg …>'
   =========================================================== */

const ICON_PATHS = {
  // ---- interface
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5c-.8 0-1.5.7-1.5 1.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z"/><path d="M4 20.5V5.5M20 20.5V5.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 0 4h-2v10a2 2 0 0 1-2 2H5a2 2 0 0 1 0-4h2z"/><path d="M7 16V4M16 8H8M10 12h4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  speaker_off: '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  note: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  quill: '<path d="M20 4C12 4 7 10 6 18l-2 2M6 18c5-1 9-4 10-8l-4 1 4-4c1.5-1.5 3-2.5 4-3"/>',
  // ---- HUD
  coin: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/><path d="M12 9.5v5M10.5 11h3"/>',
  doom: '<path d="M12 3c4.4 0 8 3.4 8 7.6 0 2.5-1.3 4.7-3.3 6.1V20H7.3v-3.3C5.3 15.3 4 13.1 4 10.6 4 6.4 7.6 3 12 3z"/><circle cx="9" cy="11" r="1.6" fill="currentColor"/><circle cx="15" cy="11" r="1.6" fill="currentColor"/><path d="M10 20v-2M14 20v-2"/>',
  frag_head: '<path d="M5 4c5 0 11 3 14 9-4-1-7 0-9 2-1-3-3-6-5-7z"/><path d="M10 15l-6 6"/>',
  frag_haft: '<path d="M7 20L18 4"/><path d="M9.5 16.4l2 1.4M12 12.8l2 1.4M14.5 9.2l2 1.4"/>',
  frag_rune: '<path d="M12 2.5l6.5 9.5-6.5 9.5L5.5 12z"/><path d="M12 7v10M9.5 10l5 4"/>',
  axe: '<path d="M14 3c3 0 6 2.5 7 6-2.5-.5-4.5 0-6 1.5-.5-2.5-2-4.8-4-5.5"/><path d="M15 10.5L4 21.5M12.5 8l3 3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  focus: '<path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3z"/><path d="M10 14.5a2 2 0 0 0 2 2"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  // ---- classes
  warrior: '<path d="M14.5 3.5H20v5.5L9 20l-2.5-2.5z"/><path d="M5 15l4 4M3.5 20.5l2.5-2.5M16 6l2 2"/>',
  rogue: '<path d="M18 3l-9.5 9.5 3 3L21 6V3z"/><path d="M7 12.5l4.5 4.5M5 14.5l4.5 4.5M3 21l3.5-3.5"/>',
  mage: '<path d="M6 21L15.5 8.5"/><circle cx="17" cy="6.5" r="3"/><path d="M17 1.5v1.5M21.8 6.5h-1.5M20.4 3.1l-1 1M13.6 3.1l1 1"/>',
  cleric: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2 2M16.7 16.7l2 2M5.3 18.7l2-2M16.7 7.3l2-2"/>',
  ranger: '<path d="M6 3c6 3 9 9 6 18"/><path d="M6 3c-1 6 1 12 6 18"/><path d="M6 3l0 0M4 12h15M16 9l3 3-3 3"/>',
  bard: '<path d="M14 10a5 5 0 1 1-6.5 6.5c-1.5-1.5-1.5-4 0-5.5S11 9 12 8.5"/><path d="M13 9l6-6M17.5 2.5l2 2M9 15h.01"/><circle cx="9.5" cy="14.5" r="1.3"/>',
  // ---- races
  human: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
  elf: '<path d="M12 21C6 17 4 11 6 4c5 1 11 4 12 10-1 4-3.5 6-6 7z"/><path d="M12 21C11 15 9 10 6 4"/>',
  dwarf: '<path d="M4 7h11l2 2-2 2H4z"/><path d="M10 11v10M17 9h3"/>',
  halfling: '<circle cx="9" cy="9" r="3.2"/><circle cx="15" cy="9" r="3.2"/><circle cx="9" cy="15" r="3.2"/><circle cx="15" cy="15" r="3.2"/><path d="M15 18l3 3"/>',
  halforc: '<path d="M7 9c0 4 1 8 2 11M17 9c0 4-1 8-2 11"/><path d="M5 9c2-4 12-4 14 0M9 20c1-1.5 5-1.5 6 0"/>',
  tiefling: '<path d="M6 13c-3-3-3-8 0-10 0 3 1.5 5 4 6M18 13c3-3 3-8 0-10 0 3-1.5 5-4 6"/><circle cx="12" cy="15" r="5"/>',
  // ---- backgrounds
  knight: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 7v10M8.5 11h7"/>',
  smuggler: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  touched: '<path d="M12 12c0-2 2-3 3.5-2s1 4-1.5 4.5-5-1-5-4.5 3.5-6 7-5 6 5 4 8.5-7 5.5-11 3.5S2 11 4.5 7"/>',
  descendant: '<path d="M14 3c3 0 6 2.5 7 6-2.5-.5-4.5 0-6 1.5-.5-2.5-2-4.8-4-5.5"/><path d="M15 10.5L4 21.5"/>',
  deserter: '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9M16 16l2-2M18 18l2-2"/>',
  healer: '<path d="M12 21V9M12 13c-4 0-6-2-6.5-6 4 0 6 2 6.5 6zM12 11c3.5 0 5.5-2 6-5.5-3.5 0-5.5 2-6 5.5z"/>',
  // ---- actions & choice types
  attack: '<path d="M14.5 3.5H20v5.5L9 20l-2.5-2.5z"/><path d="M5 15l4 4M3.5 20.5l2.5-2.5"/>',
  battle: '<path d="M4 4l10 10M4 4h3.5M4 4v3.5M20 4L10 14M20 4h-3.5M20 4v3.5"/><path d="M8 16l-3 3M16 16l3 3M6.5 14.5l3 3M17.5 14.5l-3 3"/>',
  ability: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  potion: '<path d="M10 3h4M10.5 3v5L6 15a4 4 0 0 0 3.5 6h5A4 4 0 0 0 18 15l-4.5-7V3"/><path d="M7.5 14h9"/>',
  defend: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  flee: '<path d="M13 5.5a1.5 1.5 0 1 0 0-.01M10 9l3-1 2 3 3 1M13 8l-2 6-4 2M11 14l3 2 1 5"/><path d="M3 9h4M2 13h3"/>',
  interrupt: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-3.5L3.5 13a1.5 1.5 0 0 1 2.3-1.9L8 13"/>',
  scene: '<path d="M12 2.5l1.8 5.7h6l-4.9 3.6 1.9 5.7-4.8-3.5-4.8 3.5 1.9-5.7-4.9-3.6h6z"/>',
  hollow: '<path d="M12 12c0-1.5 1.5-2.5 3-1.5s.5 3.5-1.5 4-4.5-1-4.5-4 3.5-5.5 6.5-4.5 5 4.5 3 8-6.5 4.5-10 3"/><path d="M4 18c1 1 2 1.5 3 1.5"/>',
  dice: '<path d="M12 2.5l8.5 5v9L12 21.5l-8.5-5v-9z"/><path d="M12 2.5v6M3.5 7.5L12 8.5l8.5-1M12 8.5L7 16.5h10z"/>',
  puzzle: '<path d="M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H5v-4a2 2 0 1 0 0-4z"/>',
  next: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  shop: '<path d="M5 8h14l-1.5 12h-11z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  rest: '<path d="M3 18v-8M3 14h18v4M21 18v-3a3 3 0 0 0-3-3h-8v2"/><circle cx="6.5" cy="11.5" r="1.5"/>',
  candle: '<path d="M9 21h6M10 21V10h4v11"/><path d="M12 7.5c-1.2-1-1.2-2.5 0-4 1.2 1.5 1.2 3 0 4z"/>',
  heal: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  vote: '<path d="M5 11l4 4 10-10"/><path d="M4 20h16"/>',
  // ---- regions & places
  mire: '<path d="M3 18c2-1 4-1 6 0s4 1 6 0 4-1 6 0M7 18V8M7 8c-1-2 0-4 0-4M12 16V6M12 6c1-1.5 1-3 0-4M17 18v-7M17 11c1.5-1 1.5-3 0-4"/>',
  mines: '<path d="M4 9c5-5 11-5 16 0"/><path d="M12 6.5L7 21M9 13l4 1"/>',
  harbor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 11h8M4 14c0 4 4 7 8 7s8-3 8-7"/>',
  barrow: '<path d="M3 20c2-6 5-9 9-9s7 3 9 9z"/><path d="M5 20V9M8 20v-5M16 20v-5M19 20V9"/>',
  peak: '<path d="M2 20L9 7l4 6 3-4 6 11z"/><path d="M7.5 10l1.5 1.5L11 10"/>',
  orchard: '<circle cx="12" cy="9" r="6"/><path d="M12 15v6M9 21h6M12 15l-3-3M12 13l2.5-2"/>',
  court: '<path d="M3 8c3-1 6-1 9 1 3-2 6-2 9-1-.5 5-3 8-6 8-1.5 0-2.5-1-3-2-.5 1-1.5 2-3 2-3 0-5.5-3-6-8z"/><path d="M7 11h2M15 11h2"/>',
  wych: '<path d="M9 21h6M10 21V11h4v10"/><path d="M12 8c-1.2-1-1.2-2.5 0-4 1.2 1.5 1.2 3 0 4z"/><path d="M5 21V15M19 21v-6"/>',
  town: '<path d="M3 21V10l3-2 3 2v11M9 21V7l3-3 3 3v14M15 21v-9l3-2 3 2v9M2 21h20"/>',
  fortress: '<path d="M4 21V9h3V6h3v3h4V6h3v3h3v12z"/><path d="M10 21v-5a2 2 0 0 1 4 0v5"/>',
  // ---- statuses & intents
  stunned: '<path d="M12 4l1 2.5L15.5 7 13 8l-1 2.5L11 8l-2.5-1L11 6.5zM5 13l.7 1.5 1.6.5-1.6.6L5 17l-.6-1.4-1.6-.6 1.6-.5zM18.5 13l.7 1.5 1.6.5-1.6.6-.7 1.4-.6-1.4-1.6-.6 1.6-.5z"/><path d="M6 20c3-1.5 9-1.5 12 0"/>',
  bleeding: '<path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3z"/>',
  rattled: '<path d="M4 12c2-2 4 2 6 0s4 2 6 0 3 1 4 0"/><circle cx="8" cy="7" r="1" fill="currentColor"/><circle cx="16" cy="7" r="1" fill="currentColor"/><path d="M8 18c2.5-2 5.5-2 8 0"/>',
  exposed: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  burning: '<path d="M12 21c-4 0-6-3-6-6 0-4 3-5 4-9 2 2 3 4 3 6 1-1 1.5-2 1.5-3 2.5 2 3.5 4 3.5 6 0 3-2 6-6 6z"/>',
  chilled: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M10 4.5l2 1.5 2-1.5M10 19.5l2-1.5 2 1.5"/>',
  heavy: '<path d="M4 20l7-7M8 6l6-3 7 7-3 6z"/><path d="M14 3l7 7"/>',
  burst: '<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M5 19l3.5-3.5M15.5 8.5L19 5"/><circle cx="12" cy="12" r="2.5"/>',
  sweep: '<path d="M4 15a9 9 0 0 1 16 0"/><path d="M16 11l4 4 1-5"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0M12 3v2"/>',
  mask: '<path d="M3 8c3-1 6-1 9 1 3-2 6-2 9-1-.5 5-3 8-6 8-1.5 0-2.5-1-3-2-.5 1-1.5 2-3 2-3 0-5.5-3-6-8z"/>',
};

function Icon(name, cls = '') {
  const p = ICON_PATHS[name];
  if (!p) return '';
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/* Hero crest: a framed medallion with the class sigil over a race-coloured field. */
const RACE_TINTS = { human: ['#7a4b2a', '#c98f4f'], elf: ['#2f5a3f', '#8cc59a'], dwarf: ['#5a3a2a', '#d08a5a'], halfling: ['#4a5a2a', '#b8c96a'], halforc: ['#3f4a2f', '#9aab6a'], tiefling: ['#5a1f2a', '#d0607a'] };
function Crest(c, size = 52) {
  const [a, b] = RACE_TINTS[c.race] || ['#4a3a2a', '#c9a24a'];
  const id = 'cr' + c.id;
  const corr = Math.min(10, c.corruption || 0) / 10;
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs>
    <circle cx="32" cy="32" r="29" fill="url(#${id})"/>
    <circle cx="32" cy="32" r="29" fill="#8d939b" opacity="${(corr * 0.75).toFixed(2)}"/>
    <circle cx="32" cy="32" r="29" fill="none" stroke="#e8c26a" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="24.5" fill="none" stroke="#1a120a" stroke-opacity=".45" stroke-width="1"/>
    <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff4dc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))">${ICON_PATHS[c.cls] || ''}</g>
    <circle cx="51" cy="51" r="9" fill="#1d1510" stroke="#e8c26a" stroke-width="1.5"/>
    <g transform="translate(44.5 44.5) scale(.54)" fill="none" stroke="#f0d79a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[c.race] || ''}</g>
  </svg>`;
}

/* Enemy portraits: simple silhouettes chosen by name/type. */
function enemyKind(e) {
  const n = e.name.toLowerCase();
  if (e.boss) return 'boss';
  if (/leech/.test(n)) return 'leech';
  if (/wolf/.test(n)) return 'wolf';
  if (/wyrm/.test(n)) return 'wyrm';
  if (/warden|troll/.test(n)) return 'troll';
  if (/brute/.test(n)) return 'brute';
  if (/treant/.test(n)) return 'treant';
  if (/shade|wight|stalker|heir/.test(n)) return 'shade';
  if (/husk/.test(n)) return 'husk';
  if (/duelist|mask/.test(n)) return 'duelist';
  if (e.lieutenant) return 'knight';
  if (/thug|hunter|guard|bodyguard|knife|cudgel|captain|quill/.test(n)) return 'brawler';
  return 'cultist';
}
const ENEMY_ART = {
  cultist: '<path d="M32 7C23 7 19 16 19 24c0 6 2 10 4 12L10 60h44L41 36c2-2 4-6 4-12 0-8-4-17-13-17z"/><path d="M24 25c0-5 4-9 8-9s8 4 8 9c0 5-4 9-8 9s-8-4-8-9z" fill="#000" opacity=".85"/><circle cx="29" cy="26" r="1.4" fill="#ff8a4a"/><circle cx="35" cy="26" r="1.4" fill="#ff8a4a"/><path d="M32 40v20" stroke-opacity=".25"/>',
  brawler: '<circle cx="32" cy="20" r="8"/><path d="M14 60c0-14 6-26 18-26s18 12 18 26z"/><path d="M14 44l-6 6 4 4M50 44l6 6-4 4"/><path d="M27 22h10" stroke-opacity=".6"/>',
  husk: '<path d="M32 12c-5 0-8 4-8 9s3 8 8 8 8-3 8-8-3-9-8-9zM22 54l2-20c1-3 4-4 8-4s7 1 8 4l2 20zM20 34l-6 12M44 34l6 12"/><circle cx="29" cy="21" r="1.4" fill="#ddd"/><circle cx="35" cy="21" r="1.4" fill="#ddd"/>',
  wolf: '<path d="M10 40l6-10 4-12 4 8h12l4-8 4 12 6 10-6 8H16z"/><circle cx="25" cy="34" r="1.6" fill="#e6e6e6"/><circle cx="39" cy="34" r="1.6" fill="#e6e6e6"/><path d="M28 44l4 3 4-3" stroke="#000" stroke-width="1.5" fill="none"/>',
  leech: '<path d="M14 44c0-10 8-22 18-22s18 12 18 22c0 4-4 6-8 4-3-2-6-3-10-3s-7 1-10 3c-4 2-8 0-8-4z"/><circle cx="32" cy="30" r="5" fill="#000" opacity=".7"/><path d="M28 30h8M32 26v8" stroke="#d9c8b8" stroke-width="1.2"/>',
  troll: '<path d="M18 56V34c-4-2-6-7-4-12 3-7 10-10 18-10s15 3 18 10c2 5 0 10-4 12v22z"/><circle cx="26" cy="26" r="2" fill="#9fe37a"/><circle cx="38" cy="26" r="2" fill="#9fe37a"/><path d="M14 40l-6 10M50 40l6 10"/>',
  brute: '<path d="M16 56V30c0-8 7-16 16-16s16 8 16 16v26z"/><path d="M24 24l4 6-3 8M40 24l-4 6 3 8M28 44l4-4 4 4" stroke="#ffb14a" stroke-width="2" fill="none"/><circle cx="27" cy="28" r="2" fill="#ffd27a"/><circle cx="37" cy="28" r="2" fill="#ffd27a"/>',
  wyrm: '<path d="M6 46c6-2 10-8 14-16s10-14 18-14c6 0 10 4 12 8-4-1-8 0-10 3 6 0 10 3 12 7-6-2-10 0-12 2 4 2 6 6 6 10H6z"/><circle cx="40" cy="24" r="1.6" fill="#cfefff"/>',
  treant: '<path d="M26 56V36c-6-2-10-8-10-14 0-8 7-14 16-14s16 6 16 14c0 6-4 12-10 14v20z"/><path d="M26 40l-10 8M38 40l10 8M26 26h3M35 26h3" stroke="#9aa3ad" stroke-width="2" fill="none"/>',
  shade: '<path d="M32 8c-9 0-14 8-14 17 0 6 2 11 4 15l-6 16 8-6 4 6 4-6 4 6 4-6 8 6-6-16c2-4 4-9 4-15 0-9-5-17-14-17z" opacity=".9"/><circle cx="27" cy="24" r="2" fill="#cfefff"/><circle cx="37" cy="24" r="2" fill="#cfefff"/>',
  duelist: '<path d="M32 10c-6 0-10 5-10 11s4 9 10 9 10-3 10-9-4-11-10-11zM20 56l3-22c2-3 5-4 9-4s7 1 9 4l3 22z"/><path d="M24 20c3-1 5-1 8 1 3-2 5-2 8-1-.5 3-2 4.5-4 4.5-1 0-2-.5-4-1.5-2 1-3 1.5-4 1.5-2 0-3.5-1.5-4-4.5z" fill="#c9ccd1"/><path d="M48 14L36 44" stroke="#c9ccd1" stroke-width="2"/>',
  knight: '<path d="M22 56V32c0-10 4-18 10-18s10 8 10 18v24z"/><path d="M24 26h16v6H24z" fill="#000" opacity=".6"/><path d="M27 29h10" stroke="#ff8a4a" stroke-width="1.5"/><path d="M16 30l-4 20M48 30l4 20"/>',
  boss: '<path d="M32 6l4 6 6-4-1 8 7 1-5 6c3 4 4 9 4 14v19H17V37c0-5 1-10 4-14l-5-6 7-1-1-8 6 4z"/><circle cx="27" cy="28" r="2.2" fill="#ff5a3a"/><circle cx="37" cy="28" r="2.2" fill="#ff5a3a"/><path d="M27 38c3 2 7 2 10 0" stroke="#000" stroke-width="1.6" fill="none"/>',
};
function EnemyPortrait(e) {
  const k = enemyKind(e);
  const glow = e.hollow ? '#c9d2de' : k === 'brute' ? '#ff8a3a' : k === 'wyrm' ? '#9fd8ff' : k === 'treant' ? '#b8d89a' : k === 'boss' ? '#ff5a3a' : k === 'troll' ? '#9fe37a' : k === 'leech' ? '#c9b6a8' : k === 'duelist' ? '#e0c0ff' : '#ff9a6a';
  const id = 'eg-' + e.uid;
  return `<svg class="eportrait" viewBox="0 0 64 64" aria-hidden="true"><defs>
    <radialGradient id="${id}" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${glow}" stop-opacity=".85"/><stop offset=".45" stop-color="${glow}" stop-opacity=".28"/><stop offset="1" stop-color="#07060d"/></radialGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1626"/><stop offset="1" stop-color="#05040a"/></linearGradient></defs>
    <rect width="64" height="64" fill="#07060d"/><rect width="64" height="64" fill="url(#${id})"/>
    <g fill="url(#${id}f)" stroke="${glow}" stroke-opacity=".55" stroke-width="1" stroke-linejoin="round" transform="translate(0 4)">${ENEMY_ART[k]}</g>
    </svg>`;
}
