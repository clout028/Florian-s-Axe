/* ===========================================================
   PUZZLES — challenges for the player, not the character.
   Every puzzle:
     - is generated per run and remembered (reloading shows the same one),
     - offers a skill-check hint, so nobody is ever stuck,
     - can be given up, which leads to the story's "failed" branch,
     - rewards solving it yourself with XP on top of the story outcome.
   A choice declares { puzzle: { type, key, ... }, solved: outcome, failed: outcome }.
   =========================================================== */

const RIDDLES = [
  { q: 'The more of me you take, the more of me you leave behind. What am I?', a: ['footsteps', 'steps', 'footprints', 'tracks'], wrong: ['Breath', 'Time', 'Memories'] },
  { q: 'I have cities but no houses, forests but no trees, and rivers without a drop of water. What am I?', a: ['map', 'a map', 'the map'], wrong: ['A dream', 'A painting', 'A grave'] },
  { q: 'I can run but never walk. I have a mouth but never speak, and a bed but never sleep. What am I?', a: ['river', 'a river', 'stream', 'a stream'], wrong: ['A road', 'The wind', 'A hound'] },
  { q: 'Feed me and I live. Give me a drink and I die. What am I?', a: ['fire', 'a fire', 'flame', 'a flame'], wrong: ['A plant', 'The Hollow', 'Hunger'] },
  { q: 'I follow you all day, yet vanish in the dark. What am I?', a: ['shadow', 'a shadow', 'your shadow', 'my shadow'], wrong: ['A hound', 'A ghost', 'A thought'] },
  { q: 'Say my name and I am gone. What am I?', a: ['silence'], wrong: ['A secret', 'A wish', 'A spell'] },
  { q: 'I am light as a feather, yet the strongest knight cannot hold me for long. What am I?', a: ['breath', 'a breath', 'your breath'], wrong: ['A shield', 'A sword', 'A cloud'] },
  { q: 'What has many teeth, but never bites?', a: ['comb', 'a comb', 'saw', 'a saw', 'key', 'a key', 'rake', 'a rake'], wrong: ['A skull', 'A wolf', 'A gate'] },
  { q: 'What has a neck but no head, and wears a cork for a cap?', a: ['bottle', 'a bottle', 'flask', 'a flask'], wrong: ['A swan', 'A lute', 'A ghost'] },
  { q: 'What has a ring, but no finger?', a: ['bell', 'a bell', 'the bell'], wrong: ['A tree', 'A crown', 'A well'] },
  { q: 'What can you keep after you have given it away?', a: ['promise', 'a promise', 'your word', 'word', 'oath', 'an oath', 'vow', 'a vow'], wrong: ['A coin', 'A secret', 'A gift'] },
  { q: 'What belongs to you, yet others use it far more than you do?', a: ['name', 'your name', 'my name', 'a name'], wrong: ['Your coin', 'Your sword', 'Your time'] },
  { q: 'The one who makes it sells it. The one who buys it never uses it. The one who uses it never sees it. What is it?', a: ['coffin', 'a coffin', 'casket', 'a casket', 'grave', 'a grave'], wrong: ['A crown', 'A gift', 'A spell'] },
  { q: 'What flies without wings and weeps without eyes?', a: ['cloud', 'a cloud', 'clouds', 'rain cloud'], wrong: ['A ghost', 'A song', 'A bat'] },
  { q: 'What goes through a door, but never goes in and never comes out?', a: ['keyhole', 'a keyhole', 'key hole'], wrong: ['A draught', 'A rumour', 'A key'] },
  { q: 'The poor have it, the rich need it, and if you eat it you will die. What is it?', a: ['nothing'], wrong: ['Gold', 'Poison', 'Bread'] },
  { q: 'What can fill a hall from floor to rafters, yet takes up no room at all?', a: ['light', 'the light', 'sound', 'music', 'darkness'], wrong: ['Smoke', 'Water', 'Air'] },
  { q: 'What has a head and a tail, but no body?', a: ['coin', 'a coin'], wrong: ['A snake', 'A comet', 'A ghost'] },
  { q: 'What gets wetter the more it dries?', a: ['towel', 'a towel', 'cloth', 'a cloth', 'rag', 'a rag'], wrong: ['A river', 'A sponge', 'The moss'] },
  { q: 'What has an eye but cannot see?', a: ['needle', 'a needle', 'storm', 'a storm', 'potato'], wrong: ['A statue', 'A blind man', 'A skull'] },
  { q: 'What goes up and never comes down?', a: ['age', 'your age', 'my age', 'years'], wrong: ['Smoke', 'A bird', 'A prayer'] },
  { q: 'What is always ahead of you, yet can never be seen?', a: ['future', 'the future', 'tomorrow'], wrong: ['The road', 'The horizon', 'Your nose'] },
  { q: 'I shave every day, yet my beard never grows shorter. Who am I?', a: ['barber', 'a barber', 'the barber'], wrong: ['A monk', 'A goat', 'A king'] },
  { q: 'What breaks, but never falls, and what falls, but never breaks?', a: ['day and night', 'dawn and night', 'daybreak and nightfall', 'day', 'dawn'], wrong: ['Glass and snow', 'Hearts and rain', 'Bones and leaves'] },
];

const RUNES = [
  { s: 'ᚠ', n: 'Fehu' }, { s: 'ᚢ', n: 'Uruz' }, { s: 'ᚦ', n: 'Thurs' }, { s: 'ᚨ', n: 'Ansuz' }, { s: 'ᚱ', n: 'Raido' }, { s: 'ᚲ', n: 'Kenaz' },
];
const BELLS = [
  { n: 'Dawn', f: 392, c: '#e9b949' }, { n: 'Ember', f: 494, c: '#d46a3a' }, { n: 'Frost', f: 587, c: '#7fb3d9' }, { n: 'Dusk', f: 698, c: '#9a7fd1' },
];
const GUEST_MASKS = ['Fox', 'Owl', 'Stag', 'Swan', 'Raven'];
const GUEST_ATTRS = {
  ring: { label: 'Ring', vals: ['a silver ring', 'a gold ring', 'no ring'] },
  drink: { label: 'Drinking', vals: ['red wine', 'pear cordial', 'nothing at all'] },
  accent: { label: 'Accent', vals: ['northern', 'lake-country', 'southern'] },
  gloves: { label: 'Gloves', vals: ['grey gloves', 'white gloves', 'bare hands'] },
};

const Puzzles = {
  difficulty() { return { story: -1, normal: 0, hardcore: 1, mythic: 1 }[G.difficulty || 'normal'] || 0; },

  /* Generate (or recall) the puzzle instance for a choice. */
  state(p) {
    const k = 'pz_' + p.key;
    if (G.flags[k]) return G.flags[k];
    const d = Puzzles.difficulty();
    let st;
    if (p.type === 'riddle') {
      const used = G.flags.riddles_used || [];
      const pool = p.fixed ? null : RIDDLES.map((r, i) => i).filter(i => !used.includes(i));
      const idx = p.fixed ? -1 : Dice.pick(pool.length ? pool : RIDDLES.map((r, i) => i));
      if (idx >= 0) G.flags.riddles_used = used.concat([idx]);
      const r = p.fixed || RIDDLES[idx];
      st = { q: r.q, a: r.a, options: Dice.shuffle([cap(r.a[0])].concat(r.wrong)), tries: 2, removed: [] };
    } else if (p.type === 'cipher') {
      st = { shift: 3 + Dice.d(20), plain: p.text().toUpperCase(), tries: 3, revealed: false };
    } else if (p.type === 'code') {
      st = { code: Dice.shuffle([0, 1, 2, 3, 4, 5]).slice(0, 4), guesses: [], tries: 7 - d - (p.harder ? 1 : 0), known: {} };
    } else if (p.type === 'bells') {
      const len = 5 + d;
      st = { seq: Array.from({ length: len }, () => Dice.d(4) - 1), listens: p.listens || 1, tries: 2 };
    } else if (p.type === 'whodunit') {
      st = Puzzles.makeWhodunit(p.clueBonus ? p.clueBonus() : 0);
    } else if (p.type === 'dice') {
      st = { bet: p.bet || 10, pip: Puzzles.pipScore(), pot: 0, rolls: [], over: false, loaded: false };
    }
    G.flags[k] = st;
    return st;
  },

  makeWhodunit(bonus) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const guests = GUEST_MASKS.map(m => ({ mask: m, ring: Dice.d(3) - 1, drink: Dice.d(3) - 1, accent: Dice.d(3) - 1, gloves: Dice.d(3) - 1 }));
      const agent = Dice.d(5) - 1;
      const keys = Dice.shuffle(Object.keys(GUEST_ATTRS));
      let cands = guests.map((g, i) => i);
      const clues = [];
      for (const k of keys) {
        const v = guests[agent][k];
        const next = cands.filter(i => guests[i][k] === v);
        if (next.length < cands.length) { clues.push({ k, v }); cands = next; }
        if (cands.length === 1) break;
      }
      if (cands.length !== 1 || clues.length < 2) continue;
      const known = Math.min(clues.length, clues.length - 1 + bonus);
      return { guests, agent, clues, known, tries: 1 };
    }
    return null;
  },

  clueText(c) {
    const v = GUEST_ATTRS[c.k].vals[c.v];
    return { ring: `The accomplice wears ${v}.`, drink: `The accomplice has been drinking ${v}.`, accent: `The accomplice speaks with a ${v} accent.`, gloves: `The accomplice wears ${v}.` }[c.k];
  },

  pipScore() { let s = 0; while (s < 14) { const r = Dice.d(6); if (r === 1) return Dice.d(6) + 8; s += r; } return s; },

  caesar(text, shift) { return text.replace(/[A-Z]/g, ch => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26 + 26) % 26 + 65)); },

  /* Best character's roll for a hint. */
  hintRoll(skill, dc) {
    const c = alive().slice().sort((a, b) => Character.checkBonus(b, skill).total - Character.checkBonus(a, skill).total)[0] || G.party[0];
    const b = Character.checkBonus(c, skill).total;
    const roll = Dice.d(20);
    return { c, roll, total: roll + b, ok: roll === 20 || (roll !== 1 && roll + b >= dc) };
  },

  /* Entry from the engine. */
  start(ch) { UI.showPuzzle(ch, Puzzles.state(ch.puzzle)); },

  finish(ch, result, extra) {
    G._notes = [];
    const st = G.flags['pz_' + ch.puzzle.key];
    if (result === 'solved') {
      G.flags.puzzles_solved = (G.flags.puzzles_solved || 0) + 1;
      giveXp(ch.puzzle.xp || 40);
      if (ch.puzzle.type !== 'dice') note('Solved it yourself!', 'level');
    }
    const outcome = result === 'solved' ? ch.solved : ch.failed;
    Engine.resolve(outcome, Object.assign({ puzzle: st }, extra || {}));
  },
};

/* Puzzle choices used by the story files */
function riddleChoice(label, key, solved, failed, opts = {}) {
  return Object.assign({ label, hint: 'Riddle — answer it yourself', puzzle: Object.assign({ type: 'riddle', key }, opts), solved, failed }, opts.choice || {});
}
function cipherChoice(key, next, label) {
  return {
    label: label || 'Decipher the coded letter', hint: 'Cipher — read it yourself (or let a scholar try)',
    req: () => G.clues.length < V().clues.length,
    puzzle: { type: 'cipher', key, text: () => V().clues.find(c => !G.clues.includes(c)) || '' },
    solved: { effects: (s, ctx) => { ctx.clue = addClue(); }, text: (s, ctx) => P(`The letters shift into words under your fingers. It reads:`, ctx.clue && `<b>${ctx.clue}</b>`), next },
    failed: { text: P(`It stays gibberish. In the end you burn it, so at least the enemy can't use it either.`), next },
  };
}

/* A push-your-luck dice game against an NPC. Stake is paid up front. */
function diceGame(label, key, next, opts = {}) {
  const who = opts.opponent || 'Pip';
  return {
    label, once: opts.once, cost: { gold: 10 }, hint: `Push your luck — beat ${who}'s score without rolling a 1`,
    puzzle: { type: 'dice', key: 'dice_' + key, bet: 10, opponent: who, title: `${who}'s Bones`, xp: 15 },
    solved: { effects: () => addGold(20), text: (s, ctx) => P(`${who} stares at the bones, then at you, and pushes the pot across the table. "Beginner's luck," ${who === 'Pip' ? 'he grumbles' : 'the old man grumbles'}. You both know it wasn't.`), next },
    failed: { effects: (s, ctx) => { if (ctx.tie) addGold(10); if (ctx.caught) G.flags.cheat_caught = true; }, text: (s, ctx) => P(ctx.tie ? `A tie. ${who} slides your stake back with a sniff. "Again sometime."` : ctx.caught ? `${who} catches the die in your palm and gives you a long, wounded look. "I'll be keeping that stake," ${who === 'Pip' ? 'he says' : 'the old man says'}. "And telling everyone."` : `${who} rakes in your coins with a grin. "The house thanks you."`), next },
  };
}
