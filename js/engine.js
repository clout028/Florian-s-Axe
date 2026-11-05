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
  if (n > 0 && G.flags.doom_ward > 0) { G.flags.doom_ward--; note('The Woodcutter\'s Ward holds back the grey', 'good'); return; }
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
  const clue = v.clues.find(c => !G.clues.includes(c));
  if (!clue) return '';
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

/* ---------- Corruption: the Hollow's price ---------- */
function corrupt(c, n = 1) {
  if (n > 0 && c.cleanHands) { c.cleanHands = false; n -= 1; note(`${c.name}'s clean hands turn the grey aside`, 'good'); if (!n) return; }
  const before = c.corruption || 0;
  c.corruption = Math.max(0, Math.min(10, before + n));
  if (n > 0) note(`${c.name} +${n} Corruption (${c.corruption}/10)`, 'doom');
  else if (n < 0 && before > 0) note(`${c.name} ${n} Corruption (${c.corruption}/10)`, 'good');
  if (before < 3 && c.corruption >= 3) note(`Grey veins spread under ${c.name}'s skin. Grey Fire awakens in them.`, 'doom');
  if (before < 5 && c.corruption >= 5) note(`${c.name}'s eyes have begun to grey. (−1 Wisdom & Charisma checks)`, 'doom');
  if (before < 7 && c.corruption >= 7) note(`The Hollow whispers to ${c.name} in their sleep now. It calls them heir.`, 'doom');
  if (n > 0 && c.corruption >= 7) flag('deep_corruption');
}
function cleanseAll(n = 1) { G.party.forEach(c => { if (c.corruption) corrupt(c, -n); }); }
const maxCorruption = () => Math.max(0, ...G.party.map(c => c.corruption || 0));
const mostCorrupt = () => G.party.slice().sort((a, b) => (b.corruption || 0) - (a.corruption || 0))[0];

/* ---------- Injuries ---------- */
function injure(c, id) {
  c.injuries = c.injuries || [];
  const pool = Object.keys(INJURIES).filter(k => !c.injuries.includes(k));
  if (!pool.length) return null;
  const pick = id && pool.includes(id) ? id : Dice.pick(pool);
  const oldMax = Character.maxHp(c);
  c.injuries.push(pick);
  c.hp = Math.max(1, Math.min(c.hp, Character.maxHp(c)));
  if (Character.maxHp(c) < oldMax) c.hp = Math.min(c.hp, Character.maxHp(c));
  note(`${c.name} suffers a lasting injury: ${INJURIES[pick].name} (${INJURIES[pick].desc})`, 'bad');
  return pick;
}
function healInjury(c, id) {
  if (!c.injuries || !c.injuries.length) return;
  const which = id || c.injuries[0];
  c.injuries = c.injuries.filter(k => k !== which);
  note(`${c.name}'s ${INJURIES[which].name} has healed`, 'good');
}
const injuryCount = () => G.party.reduce((a, c) => a + ((c.injuries || []).length), 0);

/* A dark shortcut, offered only to those the Hollow already has a grip on. */
function hollowOption(label, text, next, cost = 1, extra) {
  return {
    label: `[Hollow] ${label}`, hollow: true,
    hint: `Corruption 3+ · costs ${cost} Corruption`,
    req: () => maxCorruption() >= 3,
    effects: () => { const c = mostCorrupt(); corrupt(c, cost); flag('used_hollow', (G.flags.used_hollow || 0) + 1); if (extra) extra(c); },
    text, next,
  };
}

/* Can the Hollow make an offer right now? (story checks) */
function temptReady() { return (G.temptCD || 0) <= 0; }

/* Scale an enemy for party size and how far into the adventure we are. */
function foe(t, overrides = {}) {
  const base = typeof t === 'string' ? ENEMIES[t] : t;
  const lvl = tier();
  const diff = DIFFICULTIES[G.difficulty || 'normal'];
  const mult = (base.noScale ? 1 : (1 + 0.22 * lvl)) * (solo() ? 0.85 : 1.8) * diff.hp;
  const e = Object.assign({}, base, overrides);
  e.maxHp = Math.round(e.hp * mult);
  e.hp = e.maxHp;
  e.atk = e.atk + (base.noScale ? 0 : lvl) - (solo() ? 1 : 0) + diff.atk;
  e.dmgBonus = base.noScale ? 1 : lvl;
  e.xp = Math.round((e.xp || 20) * (1 + 0.2 * lvl));
  e.uid = Math.random().toString(36).slice(2, 7);
  return e;
}
function minion(name) { return foe(V().minionStats, { name: name || V().minion }); }
function lieutenant(extra = {}) {
  const l = V().lieutenant;
  return foe({ name: `${l.name} ${l.title}`, hp: l.hp, ac: l.ac, atk: l.atk, dmg: l.dmg, xp: 120, lieutenant: true, big: true }, extra);
}

/* ---------- Engine ---------- */
const Engine = {
  newGame(chars, opts = {}) {
    const villain = Dice.pick(Object.keys(VILLAINS));
    const regions = Dice.shuffle(Object.keys(REGIONS)).slice(0, 3);
    const frags = Dice.shuffle(Object.keys(FRAGMENTS));
    const fragLoc = {};
    regions.forEach((r, i) => { fragLoc[r] = frags[i]; });
    const interludes = Dice.shuffle(['int_traveler', 'int_merchant', 'int_village', 'int_shrine', 'int_bridge', 'int_pilgrims']);
    const twists = {};
    regions.forEach(r => { twists[r] = Dice.pick(['storm', 'guide', 'hunters', 'fog', 'calm', 'calm']); });
    G = {
      v: 1,
      party: chars,
      gold: 25,
      pack: { potion: 2 },
      stash: [],
      villain, regions, fragLoc, twists,
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
      difficulty: opts.difficulty || 'normal',
      temptCD: 5,
      fallen: [],
      bondType: chars.length === 2 ? (opts.bondType || 'strangers') : undefined,
    };
    if (G.bondType) G.bond = BONDS[G.bondType].start;
    chars.forEach(c => { c.corruption = c.corruption || 0; c.injuries = c.injuries || []; });
    if (typeof Meta !== 'undefined') Meta.applyStart(opts.gift);
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
      if (G.temptCD > 0) G.temptCD--;
      if (first && sc.first) sc.first(G);
      if (sc.enter) sc.enter(G);
      if (sc.ending && typeof Meta !== 'undefined') Meta.recordEnding(id, sc.ending).forEach(a => note(`🏆 Achievement: ${ACHIEVEMENTS[a].name}`, 'level'));
    }
    if (!sc.ending) Engine.save(); else Engine.clearSave();
    const title = typeof sc.title === 'function' ? sc.title(G) : sc.title;
    const text = typeof sc.text === 'function' ? sc.text(G) : sc.text;
    const choices = Engine.choicesFor(sc);
    UI.renderScene({ id, title, text, choices, notes: G._notes.slice(), ending: sc.ending, art: sc.art, vote: !!sc.vote && G.party.length === 2 && alive().length === 2 && choices.filter(c => !c.locked).length > 1 });
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
    }).filter(Boolean).reduce((acc, ch) => {
      acc.push(ch);
      // Masteries from the skill tree: win the check outright for 1 Focus
      if (ch.check && !ch.locked && !ch.noBypass && !ch.hollow && typeof masteryOptions === 'function') {
        const dc = typeof ch.check.dc === 'function' ? ch.check.dc(G) : ch.check.dc;
        const opt = masteryOptions(ch.check.skill, dc)[0];
        if (opt) {
          const plain = String(ch.label).replace(/^\s*\[[^\]]+\]\s*/, '');
          acc.push({ label: `<b>[${PERKS[opt.perk].name}]</b> ${plain}`, icon: 'star', perkBypass: { char: opt.char, perk: opt.perk, orig: ch },
            hint: `${opt.char.name} succeeds without rolling · 1 Focus` });
        }
      }
      return acc;
    }, []);
  },

  choose(ch) {
    if (ch.locked) return;
    if (ch.once) flag('once_' + ch.once);
    G._notes = [];
    if (ch.perkBypass) { if (ch.perkBypass.orig.once) flag('once_' + ch.perkBypass.orig.once); if (ch.perkBypass.orig.cost && ch.perkBypass.orig.cost.gold) addGold(-ch.perkBypass.orig.cost.gold); Engine.usePerk(ch); return; }
    if (ch.cost && ch.cost.gold) addGold(-ch.cost.gold);
    if (ch.puzzle) { Puzzles.start(ch); return; }
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
    const cur = G.flags.currentRegion, tw = cur && !G.regionsDone.includes(cur) && TWISTS[twistOf(cur)];
    if (tw && tw.checks) situ.push({ label: tw.name, value: tw.checks });
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
  rollCheck(ch, opt, useFocus, dc, helper) {
    const c = opt.char;
    let roll = Dice.d(20);
    let rerolled = false;
    if (roll === 1 && RACES[c.race].lucky) { roll = Dice.d(20); rerolled = true; }
    let focusRoll = 0;
    if (useFocus && c.focus > 0) {
      c.focus--;
      focusRoll = Dice.roll(c.cls === 'bard' ? '1d6' : '1d4').total;
    }
    const helpBonus = helper ? 2 : 0;
    const total = roll + opt.total + focusRoll + helpBonus;
    const success = roll === 20 || (roll !== 1 && total >= dc);
    const partial = !success && roll !== 1 && total >= dc - 3 && !ch.noPartial;
    const ctx = { char: c, roll, total, dc, success, partial, crit: roll === 20, fumble: roll === 1, margin: total - dc, focusRoll, rerolled, parts: opt.parts, helper, helpBonus };
    return ctx;
  },

  finishCheck(ch, ctx) {
    G._notes = [];
    if (!ctx.success) {
      const fork = Engine.failureFork(ch, ctx);
      if (fork) { UI.showFork(fork); return; }
    }
    Engine.completeCheck(ch, ctx);
  },

  completeCheck(ch, ctx) {
    const outcome = ctx.success ? ch.success : ch.failure;
    if (ctx.success && !ch.noXp) giveXp(15, ctx.char);
    if (ctx.success && ctx.helper) giveXp(10, ctx.helper);
    if (!ctx.success && ctx.helper) hurt(ctx.helper, '1d4');
    if (ctx.fumble && Dice.chance(0.25) && ['athletics', 'acrobatics', 'str', 'dex', 'con', 'stealth'].includes(ch.check.skill)) injure(ctx.char);
    Engine.resolve(outcome, ctx);
  },

  /* A narrow miss lets the players buy success at a price; the Hollow may also make an offer. */
  failureFork(ch, ctx) {
    const c = ctx.char;
    const options = [];
    const succeed = (label, apply) => () => {
      G._notes = [];
      apply();
      ctx.success = true; ctx.bought = label;
      Engine.completeCheck(ch, ctx);
    };
    const hollowOk = temptReady() && !ch.noTempt;
    if (ctx.partial) {
      const costs = [
        { label: 'Take the hit', desc: `${c.name} gets it done but gets hurt — and may be injured.`, apply: () => { hurt(c, `1d6+${tier()}`); if (Dice.chance(0.35)) injure(c); } },
        { label: 'Take the long way', desc: 'It works, but it costs precious time. +1 Doom.', apply: () => doom(1) },
        G.gold >= 10 && { label: 'Pay your way through', desc: 'Bribes, broken gear, dropped coin. −10 gold.', apply: () => addGold(-10) },
        c.focus >= 2 && { label: 'Push past your limits', desc: `${c.name} burns through their reserves. −2 Focus.`, apply: () => drainFocus(c, 2) },
      ].filter(Boolean);
      Dice.shuffle(costs).slice(0, 3).forEach(o => options.push({ label: o.label, desc: o.desc, run: succeed(o.label, o.apply) }));
      if (hollowOk) options.push({ label: 'Let the Hollow carry you', desc: `Easy. Too easy. ${c.name} +1 Corruption.`, hollow: true, run: succeed('Hollow', () => { corrupt(c, 1); G.temptCD = 3; chronicle(`${c.name} let the Hollow guide their hand.`); }) });
      options.push({ label: 'Accept the failure', desc: 'Some things should not be forced.', run: () => { G._notes = []; Engine.completeCheck(ch, ctx); } });
      return { ctx, heading: `So close — ${ctx.total} against ${ctx.dc}.`, text: `${c.name} can still make this work. But nothing comes free.`, options };
    }
    if (hollowOk && !ctx.fumble && Dice.chance(0.4)) {
      G.temptCD = 4;
      options.push({ label: 'Accept the Hollow\'s help', desc: `Failure becomes success. ${c.name} +2 Corruption.`, hollow: true, run: succeed('Hollow', () => { corrupt(c, 2); chronicle(`${c.name} accepted the Hollow's help.`); }) });
      options.push({ label: 'Refuse it', desc: 'Fail on your own terms.', run: () => { G._notes = []; flag('refusals', (G.flags.refusals || 0) + 1); Engine.completeCheck(ch, ctx); } });
      return { ctx, hollow: true, heading: 'The Hollow whispers.', text: `As ${c.name} fails, the world goes quiet and grey at the edges. A voice like falling ash speaks inside their head: <i>"Let me. Just this once. What harm could it do?"</i>`, options };
    }
    return null;
  },

  combatActions(def) {
    const list = def.actions ? def.actions(G).filter(Boolean) : [];
    if (!solo() && G.bond >= 8) list.push(Object.assign({}, BATTLE_ACTIONS.as_one));
    if (G.pack.grey_cure) list.push(Object.assign({}, BATTLE_ACTIONS.cure_husks));
    return list;
  },

  startCombat(def) {
    const enemies = def.enemies(G);
    const cur = G.flags.currentRegion;
    if (cur && !G.regionsDone.includes(cur) && raidedHere(cur) && !def.deadly && enemies.length && !enemies.some(e => e.lieutenant)) enemies.push(minion(V().minion + ' raider'));
    if (cur && !G.regionsDone.includes(cur) && twistOf(cur) === 'fog' && !def.deadly && enemies.length) enemies.push(foe('hollowed'));
    const intro = typeof def.intro === 'function' ? def.intro(G) : def.intro;
    Combat.start({
      enemies, intro, allyStrikes: def.allyStrikes ? def.allyStrikes(G) : [], actions: Engine.combatActions(def),
      heroBuffs: (def.deadly && has('knight_resolve') && bgHero('knight')) ? { [bgHero('knight').id]: 2 } : {},
      noSurrender: def.noSurrender, noTempt: def.noTempt,
      fleeable: def.fleeable !== false && !def.deadly, fleeDC: def.fleeDC || 12,
      onEnd: (result, cctx) => {
        G._notes = [];
        // revive fallen heroes after the battle (unless it was a defeat - handled by outcome)
        if (result === 'win') {
          const xp = enemies.reduce((a, e) => a + (e.xp || 20), 0);
          Engine.deathSaves();
          G.party.forEach(c => { if (c.hp <= 0) c.hp = 1; });
          giveXp(xp);
          if (typeof hasPerk === 'function' && hasPerk('field_medic')) { const n = Dice.roll('1d6').total; G.party.forEach(c => { if (c.hp > 0) Character.heal(c, n); }); note(`Field Medic: the party recovers ${n} HP`, 'good'); }
          if (cctx.surrendered) { Engine.surrenderFork(def, cctx); return; }
          Engine.resolve(def.win, cctx);
        } else if (result === 'flee') {
          G.party.forEach(c => { if (c.hp <= 0) c.hp = 1; });
          Engine.resolve(def.flee || def.lose, cctx);
        } else {
          if (def.deadly || DIFFICULTIES[G.difficulty || 'normal'].permadeath) { Engine.go(def.loseScene || 'end_defeat'); return; }
          G.party.forEach(c => { if (Dice.chance(0.45)) injure(c); });
          giveXp(Math.round(enemies.reduce((a, e) => a + (e.xp || 20), 0) / 3));
          G.party.forEach(c => { c.hp = Math.max(1, Math.floor(Character.maxHp(c) / 3)); });
          note('Defeated — you wake battered and bruised', 'bad');
          Engine.resolve(def.lose, cctx);
        }
      },
    });
  },
};
/* Two players disagree: argue it out. */
Engine.vote = function (a, b) {
  G._notes = [];
  const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/^\[[^\]]+\]\s*/, '');
  if (a === b || a.label === b.label) {
    bond(1);
    const notes = G._notes.slice(); G._notes = [];
    UI.showOutcome({ text: P(`You look at each other and nod. You are of one mind.`), notes, onContinue: () => Engine.choose(a) });
    return;
  }
  const [p1, p2] = G.party;
  const r1 = Dice.d(20) + Character.checkBonus(p1, 'persuasion').total + (G.bondType === 'mentor' ? 1 : 0);
  const r2 = Dice.d(20) + Character.checkBonus(p2, 'persuasion').total;
  const w = r1 >= r2 ? p1 : p2, l = w === p1 ? p2 : p1, win = w === p1 ? a : b;
  bond(-1);
  chronicle(`${w.name} overruled ${l.name}: "${strip(win.label)}".`);
  const notes = G._notes.slice(); G._notes = [];
  UI.showOutcome({
    text: P(`${p1.name} wants to <b>${strip(a.label).toLowerCase()}</b>. ${p2.name} wants to <b>${strip(b.label).toLowerCase()}</b>.`,
      `It turns into an argument — low and fierce. (${p1.name} rolls ${r1}, ${p2.name} rolls ${r2}.) In the end, ${l.name} throws up their hands. "Fine. Your way. But I'm remembering this."`),
    notes, onContinue: () => Engine.choose(win),
  });
};

/* Beaten enemies beg for mercy. What you do with them is remembered. */
Engine.surrenderFork = function (def, cctx) {
  const who = cctx.surrendered.length === 1 ? cctx.surrendered[0] : `${numWord(cctx.surrendered.length)} survivors`;
  const notes = G._notes.slice();
  const finish = (text) => {
    const win = Object.assign({}, def.win, { text: () => P(text) });
    Engine.resolve(win, cctx);
  };
  const lead = alive()[0] || G.party[0];
  UI.showFork({
    ctx: cctx, notes,
    heading: 'They yield.',
    text: `The ${who} kneel${cctx.surrendered.length === 1 ? 's' : ''} in the dirt, weapons cast aside, hands raised. "Please. We only did what we were told."`,
    options: [
      { label: 'Spare them', desc: 'Let them go. Mercy has a way of being remembered.', run: () => { G._notes = []; G.flags.mercy = (G.flags.mercy || 0) + 1; finish(`You let them go. They scramble away without looking back${G.flags.mercy >= 2 ? ' — but one of them stops at the edge of sight, and looks at you for a long moment before vanishing' : ''}.`); } },
      { label: 'Question them, then let them go', desc: `${lead.name} makes an Intimidation check.`, run: () => {
        G._notes = [];
        const best = alive().slice().sort((a, b) => Character.checkBonus(b, 'intimidation').total - Character.checkBonus(a, 'intimidation').total)[0] || lead;
        const r = Dice.d(20) + Character.checkBonus(best, 'intimidation').total;
        if (r >= 12) {
          const clue = addClue();
          if (clue) finish(`${best.name} leans in close (rolled ${r}). The prisoner talks fast: <b>${clue}</b> Then you let them run.`);
          else { addGold(15); finish(`${best.name} leans in (rolled ${r}). The prisoner knows nothing new, but hands over a purse to be allowed to leave.`); }
        } else finish(`${best.name} presses them (rolled ${r}), but they are more afraid of ${V().short} than of you. You let them go.`);
      } },
      { label: 'Execute them', desc: 'They would not spare you. The Hollow feeds on cold blood: +1 Corruption.', hollow: true, run: () => { G._notes = []; G.flags.cruelty = (G.flags.cruelty || 0) + 1; corrupt(lead, 1); finish(`It is quick, and it is quiet, and afterwards nobody says anything for a while.`); } },
    ],
  });
};

/* Hardcore: heroes left dying at the end of a battle must fight for their lives. */
Engine.deathSaves = function () {
  if (!DIFFICULTIES[G.difficulty || 'normal'].permadeath) return;
  G.party.slice().forEach(c => {
    if (c.hp > 0) return;
    const r = Dice.d(20) + mod(c.stats.con);
    if (r >= 10) { note(`${c.name} clings to life (death save ${r})`, 'good'); injure(c); return; }
    G.party.splice(G.party.indexOf(c), 1);
    G.fallen.push({ name: c.name, desc: Character.describe(c), level: c.level, where: G.scene });
    chronicle(`${c.name} the ${Character.describe(c)} fell, and did not rise again.`);
    note(`${c.name} has died (death save ${r}).`, 'bad');
    flag('hero_died');
  });
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const numWord = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][n] || String(n);

/* ---------- Scene-specific battle actions ----------
   Each battle can offer one or two things only that place allows.
   success/failure run inside Combat with (hero, target). */
const BATTLE_ACTIONS = {
  burning_cart: { label: 'Kick the burning cart into them', desc: 'Fire and splintered wood on every foe', skill: 'athletics', dc: 12,
    success: () => { Combat.hitAll('2d6', 'The flaming cart'); Combat.statusAll('burning', 2); }, failure: h => Combat.hurtHero(h, '1d4', 'The cart lurches back and') },
  lantern_oil: { label: 'Hurl a lantern of oil', desc: 'Set the floor ablaze around them', skill: 'dex', dc: 12,
    success: () => { Combat.hitAll('1d8', 'Burning oil'); Combat.statusAll('burning', 2); }, failure: h => Combat.hurtHero(h, '1d4', 'Spilled oil') },
  chandelier: { label: 'Drop the chandelier', desc: 'Crush one foe and stun it', skill: 'acrobatics', dc: 13, target: 'enemy',
    success: (h, t) => { Combat.hitOne(t, '3d6', 'The iron chandelier'); if (t.hp > 0) t.status.stunned = 1; } },
  runaway_wagon: { label: 'Cut a wagon loose down the bank', desc: 'A ton of timber rolling into the shallows', skill: 'athletics', dc: 13,
    success: () => Combat.hitAll('2d8', 'The runaway wagon'), failure: h => Combat.hurtHero(h, '1d6', 'The wagon swings wide and') },
  dredge_chain: { label: 'Yank a dredging chain', desc: 'Pull a foe into the black water and stun it', skill: 'athletics', dc: 13, target: 'enemy',
    success: (h, t) => { Combat.hitOne(t, '1d8', 'The cold water'); if (t.hp > 0) t.status.stunned = 1; } },
  warden_chain: { label: 'Snap the Warden\'s rusted chain', desc: 'Break Florian\'s old binding — it reels, exposed', skill: 'athletics', dc: 14,
    success: () => Combat.livingEnemies().forEach(e => { e.status.stunned = 1; e.status.exposed = 3; }), failure: h => Combat.hurtHero(h, '1d8', 'The Warden swats you away and') },
  crucible: { label: 'Tip a crucible of molten bronze', desc: 'Pour it onto the cultists (the Brute won\'t care)', skill: 'athletics', dc: 14,
    success: () => Combat.livingEnemies().forEach(e => { if (!e.fire) Combat.hitOne(e, '3d6', 'Molten bronze'); }), failure: h => Combat.hurtHero(h, '1d6', 'Splashing bronze') },
  sluice: { label: 'Turn the old sluice-wheel', desc: 'Water douses the Brute — it is weakened and stunned', skill: 'athletics', dc: 15,
    success: () => Combat.livingEnemies().forEach(e => { if (e.fire) { Combat.hitOne(e, '2d10', 'The deluge'); e.status.stunned = 1; e.status.exposed = 2; } }) },
  rigging: { label: 'Cut the rigging and drop the sail', desc: 'Tangle every foe in canvas', skill: 'acrobatics', dc: 13,
    success: () => Combat.statusAll('stunned', 1), failure: h => Combat.hurtHero(h, '1d6', 'A loose spar') },
  barrels: { label: 'Roll a rum barrel into them', desc: 'Knock a foe flat', skill: 'athletics', dc: 12, target: 'enemy',
    success: (h, t) => { Combat.hitOne(t, '2d6', 'The barrel'); if (t.hp > 0) t.status.exposed = 2; } },
  keeper_sigil: { label: 'Raise the Keeper\'s Amulet', desc: 'Remind the dead who they once served', skill: 'lore', dc: 12, req: () => hasItem('keeper_amulet'),
    success: () => { Combat.statusAll('rattled', 1); Combat.statusAll('exposed', 2); Combat.log('The shades flinch from the sigil.', 'crit'); } },
  grave_salt: { label: 'Scatter grave-salt from the urns', desc: 'Burns the Hollow-touched', skill: 'sleight', dc: 12,
    success: () => Combat.livingEnemies().forEach(e => Combat.hitOne(e, e.hollow ? '3d6' : '1d4', 'Grave-salt')) },
  ring_bell: { label: 'Ring the great bell', desc: 'The true note stuns the wyrm', skill: 'athletics', dc: 14,
    success: () => Combat.livingEnemies().forEach(e => { e.status.stunned = 1; e.status.exposed = 2; Combat.hitOne(e, '1d10', 'The bell\'s note'); }), failure: h => Combat.hurtHero(h, '1d6', 'The swinging rope') },
  censers: { label: 'Kick the censers into the hearth', desc: 'Burn the Hollow-incense — and singe the cultists', skill: 'dex', dc: 12,
    success: () => { Combat.hitAll('1d6', 'Exploding incense'); Combat.statusAll('rattled', 1); } },
  firebrand: { label: 'Wave a burning brand', desc: 'Hollow-things fear the flame', skill: 'survival', dc: 12,
    success: () => { Combat.statusAll('rattled', 1); Combat.livingEnemies().forEach(e => { if (Dice.chance(0.5)) e.status.burning = 2; }); } },
  well_rope: { label: 'Swing on the well-rope', desc: 'Kick a husk into the dark water', skill: 'acrobatics', dc: 13, target: 'enemy',
    success: (h, t) => Combat.hitOne(t, '3d6', 'The fall') },
  rockslide: { label: 'Bring down the loose rock', desc: 'Bury the ambushers on the ridge', skill: 'athletics', dc: 14,
    success: () => Combat.hitAll('2d8', 'The rockslide'), failure: h => Combat.hurtHero(h, '1d8', 'Falling stones') },
  ballista: { label: 'Turn their own ballista', desc: 'One enormous bolt', skill: 'int', dc: 13, target: 'enemy',
    success: (h, t) => { Combat.hitOne(t, '4d8', 'The ballista bolt'); if (t.hp > 0) t.status.stunned = 1; } },
  fragment_light: { label: 'Raise a fragment of Florian\'s Axe', desc: 'Its light breaks the Hollow\'s armour', skill: 'lore', dc: 13, req: () => fragCount('party') > 0 || hasItem('florians_axe'),
    success: () => Combat.livingEnemies().forEach(e => { e.status.exposed = 3; e.status.rattled = 1; }), failure: h => Combat.hurtHero(h, '1d6', 'The Hollow lashes at the light and') },
  florian_call: { label: 'Call on Florian\'s name', desc: 'His shade strikes alongside you', req: () => hasAlly('florian'),
    success: () => Combat.livingEnemies().forEach(e => Combat.hitOne(e, '3d6', 'Florian\'s ghostly axe')) },
};
BATTLE_ACTIONS.cure_husks = {
  label: 'Throw the Grey-Cure over the husks', desc: 'Uses one Grey-Cure: every hollowed husk wakes and flees, cured',
  success: () => {
    if (!G.pack.grey_cure) return;
    G.pack.grey_cure--; if (!G.pack.grey_cure) delete G.pack.grey_cure;
    let n = 0;
    Combat.livingEnemies().forEach(e => { if (/Husk/.test(e.name)) { e.hp = 0; e.yielded = true; n++; } });
    G.flags.cured_husks = (G.flags.cured_husks || 0) + n;
    Combat.log(n ? `The tincture shimmers in the air. ${n === 1 ? 'A husk stops' : n + ' husks stop'}, blink${n === 1 ? 's' : ''} — and run${n === 1 ? 's' : ''} away, crying, human again.` : 'The tincture shimmers in the air — but there are no husks here to wake.', 'heal');
  },
};
function battleActions(...keys) {
  return keys.map(k => BATTLE_ACTIONS[k]).filter(a => a && (!a.req || a.req())).map(a => Object.assign({}, a, { req: undefined }));
}

/* ---------- Region twists: each run, each region gets a random complication ---------- */
const TWISTS = {
  storm: { name: 'Storm', line: 'A howling storm has rolled in. Everything is harder in this weather. (−1 to all checks here)', inner: 'The storm rages on above.', checks: -1 },
  guide: { name: 'A Local Guide', line: 'A local who hates the enemy offers to help you, for nothing. (+1 to all checks here)', inner: 'Your guide whispers advice at every turn.', checks: 1 },
  hunters: { name: 'Bounty Hunters', line: 'Wanted posters with your faces on them are nailed to every tree. The enemy has put a price on your heads.', inner: '', checks: 0, ambush: true },
  fog: { name: 'Grey Fog', line: 'A grey fog has settled over everything here. Husks walk in it. (Every battle here has an extra Hollowed Husk.)', inner: 'The grey fog clings to everything.', checks: 0, husk: true },
  calm: { name: 'Calm', line: '', inner: '', checks: 0 },
};
function twistOf(rid) { return (G.twists || {})[rid]; }
function twistLine(rid, where) {
  const t = TWISTS[twistOf(rid)];
  if (!t) return '';
  const txt = where === 'inner' ? t.inner : t.line;
  return txt ? `<i>${txt}</i>` : '';
}
Object.assign(BATTLE_ACTIONS, {
  fire_arrows: { label: 'Light the foresters\' arrows', desc: 'Every foe takes fire and starts burning', skill: 'survival', dc: 12,
    success: () => { Combat.hitAll('1d8', 'Flaming arrows'); Combat.statusAll('burning', 2); } },
  heart_root: { label: 'Press your hands to the heart-root', desc: 'Its golden light sears the rot (radiant)', skill: 'wis', dc: 13,
    success: () => Combat.hitAll('3d6', 'Golden light', true), failure: h => Combat.hurtHero(h, '1d6', 'The rot lashes back and') },
  wine_toss: { label: 'Throw wine in their eyes', desc: 'Cheap, effective: the foe is exposed', skill: 'sleight', dc: 11, target: 'enemy',
    success: (h, t) => { t.status.exposed = 2; t.status.rattled = 1; Combat.log(`${t.name} sputters, blinded.`, 'crit'); } },
  keeper_lantern: { label: 'Raise the Keeper\'s lantern', desc: 'Its blue flame burns the grey', req: () => has('wych_lantern'),
    success: () => { Combat.hitAll('2d6', 'The blue flame', true); Combat.statusAll('exposed', 2); } },
  bridge_shove: { label: 'Shove it toward the edge', desc: 'One good push and it goes over the side', skill: 'athletics', dc: 16, target: 'enemy',
    success: (h, t) => { Combat.hitOne(t, '4d6', 'The fall into the gorge'); if (t.hp > 0) t.status.stunned = 1; }, failure: h => Combat.hurtHero(h, '1d8', 'The troll shoves back and') },
});
