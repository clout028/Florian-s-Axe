/* ===========================================================
   FACTIONS & REPUTATION
   Five groups remember how you treat them: the Keepers, the
   Emberdeep dwarves, the Saltcliff smugglers, the Silverbough
   elves and the Order (the Hearth knights and the Silent
   monks). Standing runs from −5 to +5 and comes from two
   sources: what the story already records (allies helped or
   abandoned, places saved or burned), plus deeds done in side
   quests and exploration.

   What it changes:
   • a +1/+2 bonus (or −1) to the faction's kind of skill check
   • shop prices, and extra goods
   • services in Hearthmoor (archive, herbalist, infirmary)
   • who speaks well of you in the epilogue
   =========================================================== */

const FACTIONS = {
  keepers: { name: 'The Keepers', icon: 'scroll', skills: ['lore', 'arcana', 'investigation'], skillLabel: 'Keepers\' lore',
    blurb: 'The old guardians of Florian\'s secrets. They keep archives, grudges, and a very long memory.' },
  dwarves: { name: 'The Emberdeep Dwarves', icon: 'mines', skills: ['athletics', 'intimidation'], skillLabel: 'Dwarven grit',
    blurb: 'Miners and smiths whose forges built half the valley. They trade in fairness and in grudges.' },
  smugglers: { name: 'The Saltcliff Smugglers', icon: 'harbor', skills: ['deception', 'sleight', 'stealth'], skillLabel: 'Gutter whispers',
    blurb: 'A port full of people who will sell you anything, once. They notice who pays and who doesn\'t.' },
  elves: { name: 'The Silverbough Elves', icon: 'orchard', skills: ['survival', 'perception'], skillLabel: 'Elven friends',
    blurb: 'Keepers of the great Heartwood. Slow to trust, and slower to forget.' },
  order: { name: 'The Order of the Hearth', icon: 'candle', skills: ['medicine', 'insight', 'persuasion'], skillLabel: 'The Order\'s blessing',
    blurb: 'The Knights of the Hearth and the Silent Order of Frosthollow. They protect the weak and keep vigil over the dead.' },
};
const FACTION_IDS = Object.keys(FACTIONS);

function pqSafe(a, b) { try { return typeof pq === 'function' && pq(a, b); } catch (e) { return false; } }

const Rep = {
  /* What the story already says about you. */
  base(f) {
    let v = 0;
    const A = hasAlly, H = has;
    if (f === 'keepers') { v += (A('keeper') ? 2 : 0) + (A('imra') ? 1 : 0) + (A('florian') ? 2 : 0) + (H('keeper_alive') ? 1 : 0) - (H('keeper_dead') ? 2 : 0) - (H('florian_destroyed') ? 3 : 0) - (H('broke_promise') ? 1 : 0) + (H('barrow_secret') ? 1 : 0); }
    if (f === 'dwarves') { v += (A('miners') ? 3 : 0) - (H('miners_died') ? 3 : 0) - (H('miners_some_died') ? 1 : 0) - (H('mines_greedy') ? 1 : 0); }
    if (f === 'smugglers') { v += (A('vosk') ? 3 : 0) + (H('harbor_bought') ? 1 : 0) - (H('harbor_exposed') ? 2 : 0) - (pqSafe('smuggler', 'enemy') ? 2 : 0) + (pqSafe('smuggler', 'ally') ? 2 : 0); }
    if (f === 'elves') { v += (A('elves') ? 3 : 0) - (H('heartwood_burned') ? 4 : 0) + (H('heartwood_saved') ? 1 : 0) + (H('orchard_united') ? 1 : 0); }
    if (f === 'order') { v += (A('monks') ? 3 : 0) + (A('knights') ? 3 : 0) - (H('monks_lost') ? 3 : 0) + (H('hearth_defended') ? 1 : 0) + (H('abbot_cured') ? 1 : 0) + (H('bell_rang') ? 1 : 0); }
    return v;
  },
  get(f) { return Math.max(-5, Math.min(5, Rep.base(f) + ((G.rep || {})[f] || 0))); },
  add(f, n) {
    if (!n || !FACTIONS[f]) return;
    G.rep = G.rep || {};
    const before = Rep.get(f);
    G.rep[f] = (G.rep[f] || 0) + n;
    const after = Rep.get(f);
    if (after !== before) note(`${FACTIONS[f].name}: ${Rep.title(after)}`, n > 0 ? 'good' : 'bad');
    else note(`${FACTIONS[f].name}: ${n > 0 ? '+' : ''}${n} standing`, n > 0 ? 'good' : 'bad');
  },
  title(v) { return v >= 4 ? 'Revered' : v >= 2 ? 'Honoured' : v >= 1 ? 'Friendly' : v === 0 ? 'Unknown' : v >= -1 ? 'Wary' : v >= -3 ? 'Distrusted' : 'Hated'; },

  /* Situational bonus for a skill check, for the check panel. */
  mods(skill) {
    const out = [];
    FACTION_IDS.forEach(f => {
      if (!FACTIONS[f].skills.includes(skill)) return;
      const v = Rep.get(f);
      const m = v >= 4 ? 2 : v >= 2 ? 1 : v <= -3 ? -1 : 0;
      if (m) out.push({ label: FACTIONS[f].skillLabel, value: m });
    });
    return out;
  },

  /* Price multiplier for an item at the market. */
  price(it) {
    let m = 1;
    const d = Rep.get('dwarves'), s = Rep.get('smugglers'), e = Rep.get('elves'), o = Rep.get('order');
    if (it.slot === 'weapon' || it.slot === 'armor') m *= d >= 4 ? 0.7 : d >= 2 ? 0.85 : d <= -2 ? 1.25 : 1;
    if (it.slot === 'trinket' || it.escape) m *= s >= 2 ? 0.85 : s <= -2 ? 1.2 : 1;
    if (it.focus) m *= e >= 2 ? 0.8 : 1;
    if (it.heal) m *= o >= 2 ? 0.85 : 1;
    return m;
  },

  /* A Hearthmoor line or two about who thinks well (or badly) of you. */
  rumors() {
    const r = [];
    FACTION_IDS.forEach(f => {
      const v = Rep.get(f);
      if (v >= 4) r.push({ keepers: 'The Keepers have started calling you "the Hands of Florian" — and not as a joke.', dwarves: 'A dwarf in the market raises his tankard as you pass. "Clan-friend!"', smugglers: 'A boy slips you a gull-feather. Saltcliff speaks well of you; the gutter doors are open.', elves: 'An elf in a silver cloak bows low as you pass. Silverbough has not bowed to mortals in a hundred years.', order: 'Knights fall silent and straighten as you walk by. The Order honours you.' }[f]);
      else if (v <= -3) r.push({ keepers: 'A Keeper turns away as you pass, hand over the sigil at their breast.', dwarves: 'A dwarf spits in the dust. The Emberdeep clans remember you.', smugglers: 'Doors close along the quay. Someone has put a price on a hat the colour of yours.', elves: 'Elven traders no longer come to the market. The ones who do glare at you.', order: 'Two Hearth knights follow you for a whole street, saying nothing at all.' }[f]);
    });
    return r;
  },

  /* Hearthmoor services unlocked by good standing. */
  hubChoices() {
    const list = [];
    const j = 'rep_' + G.regionsDone.length;
    if (Rep.get('keepers') >= 3 && !has('archive_' + j)) list.push({ label: 'Consult the Keepers\' archive', icon: 'scroll', hint: 'Honoured by the Keepers: a secret, freely given',
      effects: () => { flag('archive_' + j); G._arch = addClue(); giveXp(20); },
      text: () => { const c = G._arch; G._arch = null; return P(`The Keepers wave you straight through the archive doors. Hours later, with ink on your fingers, you find it.`, c ? `<b>${c}</b>` : `You learn nothing about ${V().short} you do not already know — but a lot about how Florian lived.`); }, next: 'hub_main' });
    if (Rep.get('elves') >= 2 && !has('herbs_' + j)) list.push({ label: 'Visit the Silverbough herbalist', icon: 'heal', hint: 'Friends of the elves: a free tonic and a poultice',
      effects: () => { flag('herbs_' + j); addPack('focus_tonic', 1); G.party.forEach(c => Character.heal(c, Dice.roll('1d8').total)); },
      text: P(`A silver-cloaked elf is selling herbs from a stall near the well. When she sees you, she packs a bundle into your hands. "No coin," she says. "Silverbough remembers."`), next: 'hub_main' });
    if (Rep.get('order') >= 2 && !has('infirm_' + j)) list.push({ label: 'Visit the Order\'s infirmary', icon: 'rest', hint: 'The Order tends your wounds for free',
      effects: () => { flag('infirm_' + j); healAll('full'); },
      text: P(`The Order's infirmary is quiet and smells of camphor. A knight-sister waves you toward the beds. "You've done the Order a service. Rest."`), next: 'hub_main' });
    return list;
  },

  epilogue() {
    const e = [];
    const t = f => Rep.get(f);
    if (t('keepers') >= 3) e.push('The Keepers add a new wing to the archive and put your names above the door.'); else if (t('keepers') <= -3) e.push('The Keepers strike your names from the archive. It is a gesture, nothing more, but it hurts.');
    if (t('dwarves') >= 3) e.push('Emberdeep forges your weapons in the old style, and a dwarf-child is named after you.'); else if (t('dwarves') <= -3) e.push('The Emberdeep clans will never forgive you. They say it to each other in the long dark.');
    if (t('smugglers') >= 3) e.push('Saltcliff names a pier after you. It is, naturally, not on any chart.'); else if (t('smugglers') <= -3) e.push('Saltcliff never forgets a slight, and has a long list.');
    if (t('elves') >= 3) e.push('Silverbough sends you a seedling from the Heartwood. It grows beside your door.'); else if (t('elves') <= -3) e.push('Silverbough is closed to you for the rest of your life.');
    if (t('order') >= 3) e.push('The Order raises a small shrine in your honour at the Hearthmoor gate.'); else if (t('order') <= -3) e.push('The Order\'s knights stop saluting you, and then stop speaking of you at all.');
    return e;
  },

  /* Passive power from the Order's blessing, folded into hero stats. */
  fx() { const o = (typeof G !== 'undefined' && G && G.rep) ? Rep.get('order') : 0; return o >= 4 ? { focus: 1 } : null; },
};

/* ---- wire factions in ---- */
(function () {
  // check bonuses
  const co = Engine.checkOptions;
  Engine.checkOptions = function (ch) {
    const info = co.call(this, ch);
    const mods = Rep.mods(ch.check.skill);
    if (mods.length) info.options.forEach(o => { o.parts = o.parts.concat(mods); o.total += mods.reduce((a, p) => a + p.value, 0); });
    return info;
  };
  // hub services & rumours
  const hb = SCENES.hub_main;
  const choices = hb.choices;
  hb.choices = s => { const l = choices(s); const i = l.findIndex(c => c.ui === 'shop'); l.splice(i < 0 ? l.length : i, 0, ...Rep.hubChoices()); return l; };
  const text = hb.text;
  hb.text = s => text(s) + Rep.rumors().slice(0, 2).map(x => `<p>${x}</p>`).join('');
})();

/* The Order's blessing is a passive: merge it into hero stats via Character.fx. */
(function () {
  const fx = Character.fx;
  Character.fx = function (c) {
    const out = fx.call(this, c);
    const add = Rep.fx();
    if (add && add.focus) out.focus += add.focus;
    return out;
  };
})();
