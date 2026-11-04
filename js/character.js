/* ===========================================================
   Dice + character rules
   =========================================================== */

const Dice = {
  d(n) { return 1 + Math.floor(Math.random() * n); },
  /* Parse and roll "2d6+3", "1d8", "3d4+3". Returns { total, rolls, expr } */
  roll(expr) {
    if (typeof expr === 'number') return { total: expr, rolls: [], expr: String(expr) };
    const m = String(expr).replace(/\s/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!m) return { total: parseInt(expr, 10) || 0, rolls: [], expr };
    const count = parseInt(m[1] || '1', 10), sides = parseInt(m[2], 10), mod = parseInt(m[3] || '0', 10);
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(Dice.d(sides));
    return { total: rolls.reduce((a, b) => a + b, 0) + mod, rolls, expr };
  },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  chance(p) { return Math.random() < p; },
};

const mod = v => Math.floor((v - 10) / 2);
const signed = n => (n >= 0 ? '+' + n : String(n));

const Character = {
  STANDARD_ARRAY: [15, 14, 13, 12, 10, 8],

  rollStatArray() {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const r = [Dice.d(6), Dice.d(6), Dice.d(6), Dice.d(6)].sort((a, b) => a - b);
      arr.push(r[1] + r[2] + r[3]);
    }
    return arr.sort((a, b) => b - a);
  },

  create(name, raceId, classId, array) {
    const race = RACES[raceId], cls = CLASSES[classId];
    const base = {};
    const sorted = (array || Character.STANDARD_ARRAY).slice().sort((a, b) => b - a);
    cls.priority.forEach((stat, i) => { base[stat] = sorted[i]; });
    const stats = {};
    STATS.forEach(s => { stats[s] = base[s] + (race.bonus[s] || 0); });
    const c = {
      id: 'c' + Math.random().toString(36).slice(2, 8),
      name, race: raceId, cls: classId,
      stats, level: 1, xp: 0,
      skillPoints: race.extraPoint ? 2 : 1,
      tree: [],
      equip: { weapon: cls.weapon, armor: cls.armor, trinket: null },
      hp: 0, focus: 0,
    };
    c.hp = Character.maxHp(c);
    c.focus = Character.maxFocus(c);
    return c;
  },

  /* Aggregate all passive effects from skill tree + equipment */
  fx(c) {
    const out = { attack: 0, damage: 0, ac: 0, hp: 0, focus: 0, skills: {}, statChecks: {}, checks: 0,
      spellAttack: 0, spellDamage: 0, spellDie: null, weaponDie: null, crit: 20, abilities: [], companion: false, healBonus: false };
    const cls = CLASSES[c.cls];
    const addSkills = (sk) => { for (const k in sk) out.skills[k] = (out.skills[k] || 0) + sk[k]; };
    out.abilities.push(cls.ability);
    if (cls.ability2) out.abilities.push(cls.ability2);
    const merge = f => {
      if (!f) return;
      ['attack', 'damage', 'ac', 'hp', 'focus', 'spellAttack', 'spellDamage', 'checks'].forEach(k => { if (f[k]) out[k] += f[k]; });
      if (f.skills) addSkills(f.skills);
      if (f.statChecks) for (const k in f.statChecks) out.statChecks[k] = (out.statChecks[k] || 0) + f.statChecks[k];
      if (f.ability && !out.abilities.includes(f.ability)) out.abilities.push(f.ability);
      if (f.crit) out.crit = Math.min(out.crit, f.crit);
      if (f.spellDie) out.spellDie = f.spellDie;
      if (f.weaponDie) out.weaponDie = f.weaponDie;
      if (f.companion) out.companion = true;
      if (f.healBonus) out.healBonus = true;
    };
    cls.tree.forEach(br => br.nodes.forEach(n => { if (c.tree.includes(n.id)) merge(n.fx); }));
    (c.injuries || []).forEach(id => merge(INJURIES[id] && INJURIES[id].fx));
    if (c.background && typeof BACKGROUNDS !== 'undefined' && BACKGROUNDS[c.background]) merge(BACKGROUNDS[c.background].fx);
    if ((c.corruption || 0) >= 3) merge({ ability: 'grey_fire' });
    const race = RACES[c.race];
    addSkills(race.skills || {});
    ['weapon', 'armor', 'trinket'].forEach(slot => {
      const it = ITEMS[c.equip[slot]];
      if (!it) return;
      if (it.skills) addSkills(it.skills);
      if (it.checks) out.checks += it.checks;
      if (slot === 'trinket' && it.ac) out.ac += it.ac;
      if (it.focus) out.focus += it.focus;
      if (it.spellAttack) out.spellAttack += it.spellAttack;
      if (it.spellDamage) out.spellDamage += it.spellDamage;
    });
    return out;
  },

  prof(c) { return 2 + Math.floor((c.level - 1) / 3); },

  maxHp(c) {
    const cls = CLASSES[c.cls], race = RACES[c.race], con = mod(c.stats.con);
    let hp = cls.hd + con + 6 + (race.hpPerLevel || 0);
    hp += (c.level - 1) * (Math.floor(cls.hd / 2) + 1 + con + (race.hpPerLevel || 0));
    return Math.max(4, hp + Character.fx(c).hp);
  },

  maxFocus(c) {
    return CLASSES[c.cls].focus + Math.floor(c.level / 2) + Character.fx(c).focus;
  },

  ac(c) {
    const armor = ITEMS[c.equip.armor] || ITEMS.robes;
    return armor.ac + Math.min(mod(c.stats.dex), armor.maxDex) + Character.fx(c).ac;
  },

  weapon(c) { return ITEMS[c.equip.weapon] || ITEMS.dagger; },

  weaponStatMod(c) {
    const w = Character.weapon(c);
    if (w.finesse) return Math.max(mod(c.stats.str), mod(c.stats.dex));
    return mod(c.stats[w.stat]);
  },

  attackBonus(c) {
    const w = Character.weapon(c);
    return Character.weaponStatMod(c) + Character.prof(c) + (w.attack || 0) + Character.fx(c).attack;
  },

  damageBonus(c) {
    const w = Character.weapon(c);
    return Character.weaponStatMod(c) + (w.damage || 0) + Character.fx(c).damage;
  },

  spellStat(c) { return CLASSES[c.cls].spellStat || 'wis'; },
  spellMod(c) { return mod(c.stats[Character.spellStat(c)]); },
  spellAttack(c) { return Character.spellMod(c) + Character.prof(c) + Character.fx(c).spellAttack; },

  /* Total bonus for a skill or raw stat check. Returns { total, parts:[{label,value}] } */
  checkBonus(c, skill) {
    const fx = Character.fx(c);
    const stat = SKILLS[skill] ? SKILLS[skill].stat : skill;
    const parts = [{ label: STAT_NAMES[stat], value: mod(c.stats[stat]) }];
    if (SKILLS[skill] && CLASSES[c.cls].skills.includes(skill)) parts.push({ label: 'Proficiency', value: Character.prof(c) });
    if (fx.skills[skill]) parts.push({ label: 'Talents & gear', value: fx.skills[skill] });
    if (fx.statChecks[stat]) parts.push({ label: 'Talent', value: fx.statChecks[stat] });
    if (fx.checks) parts.push({ label: 'Lucky Coin', value: fx.checks });
    let wound = 0;
    (c.injuries || []).forEach(id => { const ch = (INJURIES[id] || {}).checks || {}; wound += (ch[skill] || 0) + (skill !== stat ? (ch[stat] || 0) : 0) + (ch.all || 0); });
    if (wound) parts.push({ label: 'Wounds', value: wound });
    if ((c.corruption || 0) >= 5 && (stat === 'wis' || stat === 'cha')) parts.push({ label: 'Hollow-touched', value: -1 });
    return { total: parts.reduce((a, p) => a + p.value, 0), parts };
  },

  canLearn(c, nodeId) {
    if (c.skillPoints <= 0 || c.tree.includes(nodeId)) return false;
    for (const br of CLASSES[c.cls].tree) {
      const i = br.nodes.findIndex(n => n.id === nodeId);
      if (i === -1) continue;
      return i === 0 || c.tree.includes(br.nodes[i - 1].id);
    }
    return false;
  },

  learn(c, nodeId) {
    if (!Character.canLearn(c, nodeId)) return false;
    const oldMax = Character.maxHp(c), oldFocus = Character.maxFocus(c);
    c.tree.push(nodeId);
    c.skillPoints--;
    c.hp += Character.maxHp(c) - oldMax;
    c.focus += Character.maxFocus(c) - oldFocus;
    return true;
  },

  /* Add xp, returns number of levels gained */
  addXp(c, amount) {
    c.xp += amount;
    let gained = 0;
    while (c.level < MAX_LEVEL && c.xp >= XP_TABLE[c.level]) {
      const oldMax = Character.maxHp(c);
      c.level++;
      c.skillPoints++;
      gained++;
      c.hp += Character.maxHp(c) - oldMax;
      c.focus = Character.maxFocus(c);
    }
    return gained;
  },

  rest(c) { c.hp = Character.maxHp(c); c.focus = Character.maxFocus(c); },
  heal(c, n) { const max = Character.maxHp(c); const before = c.hp; c.hp = Math.min(max, c.hp + n); return c.hp - before; },
  hurt(c, n, allowDown) { c.hp = Math.max(allowDown ? 0 : 1, c.hp - n); },

  describe(c) { return `${RACES[c.race].name} ${CLASSES[c.cls].name}`; },
};
