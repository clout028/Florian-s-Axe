/* ===========================================================
   Story engine: game state, scenes, choices, checks, effects.
   Scenes are registered into SCENES by the files in js/story/.
   =========================================================== */

const SCENES = {};
let G = null;           // the live game state (serializable)
const SAVE_KEY = 'florians-axe-save-v1';

/* ---------- Helpers usable by story files ---------- */
const V = () => VILLAINS[G.villain];
const party = () => G.party;
const alive = () => G.party.filter(c => c.hp > 0);
const solo = () => G.party.length === 1;
/* Pick wording for 1 vs 2 players */
const both = (one, two) => (solo() ? one : two);
const names = () => G.party.map(c => c.name).join(' and ');
const has = k => !!G.flags[k];
const flag = (k, v = true) => { G.flags[k] = v; };
const tier = () => G.regionsDone.length;
const hasRace = r => G.party.some(c => c.race === r);
const hasClass = k => G.party.some(c => c.cls === k);
const raceChar = r => G.party.find(c => c.race === r);
const classChar = k => G.party.find(c => c.cls === k);
const hasItem = id => G.party.some(c => c.equip.trinket === id || c.equip.weapon === id || c.equip.armor === id) || G.stash.includes(id);
const hasAlly = id => G.allies.includes(id);
const fragCount = who => Object.values(G.fragments).filter(v => v === who).length;
const regionFrag = rid => FRAGMENTS[G.fragLoc[rid]];

/* Paragraph builder. Falsy lines are skipped, so conditionals read naturally. */
function P(...lines) { return lines.filter(Boolean).map(l => `<p>${l}</p>`).join(''); }

function note(text, kind = '') { G._notes.push({ text, kind }); }

function addGold(n) {
  if (!n) return;
  G.gold = Math.max(0, G.gold + n);
  note(`${n > 0 ? '+' : ''}${n} gold`, n > 0 ? 'good' : 'bad');
}

function addPack(id, n = 1) {
  G.pack[id] = (G.pack[id] || 0) + n;
  note(`+${n} ${ITEMS[id].name}`, 'good');
}

function addGear(id) {
  if (hasItem(id)) return;
  const free = ITEMS[id].slot === 'trinket' && G.party.find(c => !c.equip.trinket);
  if (free) {
    free.equip.trinket = id;
    free.focus = Math.min(free.focus + (ITEMS[id].focus || 0), Character.maxFocus(free));
    note(`Found: ${ITEMS[id].name} — ${free.name} wears it`, 'good');
    return;
  }
  G.stash.push(id);
  note(`Found: ${ITEMS[id].name} (equip from a character sheet)`, 'good');
}

function giveXp(n, who) {
  const targets = who ? [who] : G.party;
  targets.forEach(c => {
    const lv = Character.addXp(c, n);
    if (lv) note(`${c.name} reached level ${c.level}! Spend skill points on their sheet.`, 'level');
  });
  note(`+${n} XP${who ? ' (' + who.name + ')' : ''}`, 'xp');
}

/* Damage a character outside combat — never kills, but can leave them at 1 HP. */
function hurt(c, expr) {
  const amt = typeof expr === 'number' ? expr : Dice.roll(expr).total;
  Character.hurt(c, amt, false);
  note(`${c.name} −${amt} HP`, 'bad');
  return amt;
}
function hurtAll(expr) { let t = 0; G.party.forEach(c => { t = hurt(c, expr); }); return t; }
function healAll(expr) {
  G.party.forEach(c => {
    if (expr === 'full') { Character.rest(c); return; }
    const amt = Dice.roll(expr).total;
    Character.heal(c, amt);
  });
  note(expr === 'full' ? 'Party fully rested' : `Party healed (${expr})`, 'good');
}
function restoreFocus() { G.party.forEach(c => { c.focus = Character.maxFocus(c); }); note('Focus restored', 'good'); }
function drainFocus(c, n = 1) { c.focus = Math.max(0, c.focus - n); note(`${c.name} −${n} Focus`, 'bad'); }

function doom(n = 1) {
  G.doom = Math.max(0, Math.min(10, G.doom + n));
  if (n > 0) note(`The Hollow spreads (+${n} Doom)`, 'doom');
  else if (n < 0) note(`The Hollow recedes (${n} Doom)`, 'good');
}

function addAlly(id, label) {
  if (G.allies.includes(id)) return;
  G.allies.push(id);
  G.allyNames[id] = label;
  note(`Ally gained: ${label}`, 'ally');
}
function loseAlly(id) { G.allies = G.allies.filter(a => a !== id); }

/* Gain the next clue about the villain; returns its text for narration. */
function addClue() {
  const v = V();
  if (G.clues.length >= v.clues.length) return '';
  const clue = v.clues[G.clues.length];
  G.clues.push(clue);
  note('Secret learned about ' + v.short, 'clue');
  return clue;
}

function gainFragment(rid) {
  const f = G.fragLoc[rid];
  G.fragments[f] = 'party';
  note(`Recovered ${FRAGMENTS[f].name}!`, 'frag');
  chronicle(`Recovered ${FRAGMENTS[f].name} in ${REGIONS[rid].name}.`);
}
function loseFragment(rid) {
  const f = G.fragLoc[rid];
  G.fragments[f] = 'villain';
  note(`${FRAGMENTS[f].name} fell into ${V().short}'s hands`, 'bad');
  chronicle(`${FRAGMENTS[f].name} was lost to ${V().short} in ${REGIONS[rid].name}.`);
}

function chronicle(text) { G.chronicle.push(text); }

/* Scale an enemy for party size and how far into the adventure we are. */
function foe(t, overrides = {}) {
  const base = typeof t === 'string' ? ENEMIES[t] : t;
  const lvl = tier();
  const mult = (base.noScale ? 1 : (1 + 0.22 * lvl)) * (solo() ? 0.85 : 1.8);
  const e = Object.assign({}, base, overrides);
  e.maxHp = Math.round(e.hp * mult);
  e.hp = e.maxHp;
  e.atk = e.atk + (base.noScale ? 0 : lvl) - (solo() ? 1 : 0);
  e.dmgBonus = base.noScale ? 1 : lvl;
  e.xp = Math.round((e.xp || 20) * (1 + 0.2 * lvl));
  e.uid = Math.random().toString(36).slice(2, 7);
  return e;
}
function minion(name) { return foe(V().minionStats, { name: name || V().minion }); }
function lieutenant(extra = {}) {
  const l = V().lieutenant;
  return foe({ name: `${l.name} ${l.title}`, hp: l.hp, ac: l.ac, atk: l.atk, dmg: l.dmg, xp: 120, lieutenant: true }, extra);
}

/* ---------- Engine ---------- */
const Engine = {
  newGame(chars) {
    const villain = Dice.pick(Object.keys(VILLAINS));
    const regions = Dice.shuffle(Object.keys(REGIONS)).slice(0, 3);
    const frags = Dice.shuffle(Object.keys(FRAGMENTS));
    const fragLoc = {};
    regions.forEach((r, i) => { fragLoc[r] = frags[i]; });
    const interludes = Dice.shuffle(['int_traveler', 'int_merchant', 'int_village', 'int_shrine']);
    G = {
      v: 1,
      party: chars,
      gold: 25,
      pack: { potion: 2 },
      stash: [],
      villain, regions, fragLoc,
      fragments: { head: null, haft: null, rune: null },
      regionsDone: [],
      interludes,       // random order of road encounters
      hook: Dice.pick(['pro_thornbury', 'pro_tavern', 'pro_caravan']),
      flags: {}, doom: 0, clues: [], allies: [], allyNames: {},
      rival: { met: 0, beaten: 0, lost: 0, spared: false, slain: false, scarred: false },
      chronicle: [],
      visited: {},
      scene: null,
      lead: 0,
      _notes: [],
      started: Date.now(),
    };
    Engine.go(G.hook);
  },

  save() {
    try { const copy = Object.assign({}, G, { _notes: [] }); localStorage.setItem(SAVE_KEY, JSON.stringify(copy)); } catch (e) { /* storage unavailable */ }
  },
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      G = JSON.parse(raw);
      G._notes = [];
      Engine.go(G.scene, true);
      return true;
    } catch (e) { return false; }
  },
  clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } },

  /* Enter a scene. `resume` re-renders without re-running first-visit effects. */
  go(id, resume) {
    const sc = SCENES[id];
    if (!sc) { console.error('Missing scene', id); UI.error('Missing scene: ' + id); return; }
    if (sc.route) { Engine.go(sc.route(G)); return; }
    G.scene = id;
    G._notes = [];
    const first = !G.visited[id];
    if (!resume) {
      G.visited[id] = (G.visited[id] || 0) + 1;
      if (first && sc.first) sc.first(G);
      if (sc.enter) sc.enter(G);
    }
    if (!sc.ending) Engine.save(); else Engine.clearSave();
    const title = typeof sc.title === 'function' ? sc.title(G) : sc.title;
    const text = typeof sc.text === 'function' ? sc.text(G) : sc.text;
    const choices = Engine.choicesFor(sc);
    UI.renderScene({ id, title, text, choices, notes: G._notes.slice(), ending: sc.ending, art: sc.art });
    G._notes = [];
  },

  choicesFor(sc) {
    const list = (typeof sc.choices === 'function' ? sc.choices(G) : sc.choices) || [];
    return list.filter(Boolean).map(ch => {
      const locked = ch.req && !ch.req(G);
      if (locked && !ch.showLocked) return null;
      if (ch.once && has('once_' + ch.once)) return null;
      const out = Object.assign({}, ch);
      out.locked = locked;
      if (ch.cost && ch.cost.gold && G.gold < ch.cost.gold) out.locked = true, out.lockReason = 'Not enough gold';
      if (ch.check && !out.hint) {
        const dc = typeof ch.check.dc === 'function' ? ch.check.dc(G) : ch.check.dc;
        const sk = SKILLS[ch.check.skill] ? SKILLS[ch.check.skill].name : STAT_NAMES[ch.check.skill];
        out.hint = `${sk} check · DC ${dc}`;
      }
      if (ch.combat && !out.hint) out.hint = 'Battle';
      return out;
    }).filter(Boolean);
  },

  choose(ch) {
    if (ch.locked) return;
    if (ch.once) flag('once_' + ch.once);
    G._notes = [];
    if (ch.cost && ch.cost.gold) addGold(-ch.cost.gold);
    if (ch.check) { UI.showCheck(ch, Engine.checkOptions(ch)); return; }
    if (ch.combat) { Engine.startCombat(ch.combat); return; }
    Engine.resolve(ch, {});
  },

  /* Apply an outcome {effects, text, next}. ch may itself be an outcome. */
  resolve(outcome, ctx) {
    if (!outcome) return;
    if (outcome.effects) outcome.effects(G, ctx);
    const text = typeof outcome.text === 'function' ? outcome.text(G, ctx) : outcome.text;
    const next = typeof outcome.next === 'function' ? outcome.next(G, ctx) : outcome.next;
    const notes = G._notes.slice();
    G._notes = [];
    if (text || notes.length) {
      UI.showOutcome({ text, notes, ctx, onContinue: () => Engine.go(next || G.scene) });
    } else {
      Engine.go(next || G.scene);
    }
  },

  /* For a check: compute each character's bonus so the players can choose who attempts it. */
  checkOptions(ch) {
    const chk = ch.check;
    const dc = typeof chk.dc === 'function' ? chk.dc(G) : chk.dc;
    const situ = chk.mods ? chk.mods(G).filter(Boolean) : [];
    return {
      dc,
      skill: chk.skill,
      skillName: SKILLS[chk.skill] ? SKILLS[chk.skill].name : STAT_NAMES[chk.skill],
      options: alive().length ? alive().map(c => {
        const b = Character.checkBonus(c, chk.skill);
        const parts = b.parts.concat(situ);
        return { char: c, parts, total: parts.reduce((a, p) => a + p.value, 0) };
      }) : [],
    };
  },

  /* Roll the d20 for a check. Returns ctx. */
  rollCheck(ch, opt, useFocus, dc) {
    const c = opt.char;
    let roll = Dice.d(20);
    let rerolled = false;
    if (roll === 1 && RACES[c.race].lucky) { roll = Dice.d(20); rerolled = true; }
    let focusRoll = 0;
    if (useFocus && c.focus > 0) {
      c.focus--;
      focusRoll = Dice.roll(c.cls === 'bard' ? '1d6' : '1d4').total;
    }
    const total = roll + opt.total + focusRoll;
    const success = roll === 20 || (roll !== 1 && total >= dc);
    const ctx = { char: c, roll, total, dc, success, crit: roll === 20, fumble: roll === 1, margin: total - dc, focusRoll, rerolled, parts: opt.parts };
    return ctx;
  },

  finishCheck(ch, ctx) {
    G._notes = [];
    const outcome = ctx.success ? ch.success : ch.failure;
    if (ctx.success && !ch.noXp) giveXp(15, ctx.char);
    Engine.resolve(outcome, ctx);
  },

  startCombat(def) {
    const enemies = def.enemies(G);
    const intro = typeof def.intro === 'function' ? def.intro(G) : def.intro;
    Combat.start({
      enemies, intro, allyStrikes: def.allyStrikes ? def.allyStrikes(G) : [], fleeable: def.fleeable !== false && !def.deadly, fleeDC: def.fleeDC || 12,
      onEnd: (result, cctx) => {
        G._notes = [];
        // revive fallen heroes after the battle (unless it was a defeat - handled by outcome)
        if (result === 'win') {
          const xp = enemies.reduce((a, e) => a + (e.xp || 20), 0);
          G.party.forEach(c => { if (c.hp <= 0) c.hp = 1; });
          giveXp(xp);
          Engine.resolve(def.win, cctx);
        } else if (result === 'flee') {
          G.party.forEach(c => { if (c.hp <= 0) c.hp = 1; });
          Engine.resolve(def.flee || def.lose, cctx);
        } else {
          if (def.deadly) { Engine.go(def.loseScene || 'end_defeat'); return; }
          giveXp(Math.round(enemies.reduce((a, e) => a + (e.xp || 20), 0) / 3));
          G.party.forEach(c => { c.hp = Math.max(1, Math.floor(Character.maxHp(c) / 3)); });
          note('Defeated — you wake battered and bruised', 'bad');
          Engine.resolve(def.lose, cctx);
        }
      },
    });
  },
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const numWord = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][n] || String(n);
