/* ===========================================================
   META-PROGRESSION — the Keeper's Archive.
   Persists across tales (localStorage): past runs, fallen heroes,
   achievements and unlocked legacy gifts.
   =========================================================== */

const ARCHIVE_KEY = 'florians-axe-archive-v1';

const ACHIEVEMENTS = {
  first_tale: { name: 'The First Tale', desc: 'Finish a tale, however it ends.' },
  victory: { name: 'The Seal Restored', desc: 'Win a tale.' },
  every_villain: { name: 'Three Shadows', desc: 'Defeat Morvane, Seraphine and Kharsk (across tales).' },
  redeemer: { name: 'The Person Inside', desc: 'Turn the villain against the Hollow with the truth.' },
  whole_axe: { name: 'Made Whole', desc: 'Reforge Florian\'s Axe on the great anvil.' },
  field_forge: { name: 'Bare Hands', desc: 'Reforge the axe in the Hollow\'s breath.' },
  untouched: { name: 'Unstained', desc: 'Win with no Corruption on any hero.' },
  grey_heir: { name: 'The Grey Heir', desc: 'Take the Hollow\'s crown.' },
  merciful: { name: 'Mercy\'s Long Memory', desc: 'Spare three or more enemies in one tale.' },
  ruthless: { name: 'No Prisoners', desc: 'Execute three or more enemies in one tale.' },
  hardcore: { name: 'Iron Will', desc: 'Win on Hardcore.' },
  mythic: { name: 'Legend', desc: 'Win on Mythic.' },
  swift: { name: 'Before the Grey', desc: 'Win with Doom at 3 or less.' },
  host: { name: 'Florian Never Swung Alone', desc: 'Reach the final battle with six or more allies.' },
  personal: { name: 'Unfinished Business', desc: 'Complete a hero\'s personal quest with its best outcome.' },
  sacrifice: { name: 'The Price', desc: 'Pay the price at the sealing.' },
  sharp: { name: 'Sharp Mind', desc: 'Solve five puzzles yourself in one tale.' },
  soulbound: { name: 'Fight as One', desc: 'Finish a two-player tale with a bond of 10.' },
};

const LEGACY_GIFTS = {
  none: { name: 'No gift', desc: 'Begin with nothing but your wits.', unlock: () => true },
  purse: { name: 'The Keepers\' Purse', desc: 'Begin with +40 gold.', unlock: a => a.achievements.first_tale, hint: 'Finish any tale' },
  tales: { name: 'Veteran\'s Tales', desc: 'Every hero begins with +60 XP.', unlock: a => a.achievements.first_tale, hint: 'Finish any tale' },
  ward: { name: 'Woodcutter\'s Ward', desc: 'The first two times the Hollow would spread, it doesn\'t.', unlock: a => a.achievements.victory, hint: 'Win a tale' },
  clean: { name: 'Clean Hands', desc: 'Each hero ignores their first point of Corruption.', unlock: a => a.achievements.untouched, hint: 'Win with no Corruption' },
  map: { name: 'Annotated Map', desc: 'Begin knowing one secret about the villain.', unlock: a => a.achievements.redeemer, hint: 'Turn a villain with the truth' },
};

const Meta = {
  load() {
    try { const a = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || 'null'); if (a) return Object.assign(Meta.blank(), a); } catch (e) { /* ignore */ }
    return Meta.blank();
  },
  blank() { return { runs: [], achievements: {}, villainsBeaten: {}, fallen: [] }; },
  save(a) { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); } catch (e) { /* ignore */ } },

  unlocked(a = Meta.load()) {
    const d = Object.keys(DIFFICULTIES).filter(k => !DIFFICULTIES[k].unlock || DIFFICULTIES[k].unlock(a));
    const g = Object.keys(LEGACY_GIFTS).filter(k => LEGACY_GIFTS[k].unlock(a));
    return { difficulties: d, gifts: g };
  },

  award(a, id, fresh) {
    if (a.achievements[id]) return;
    a.achievements[id] = new Date().toISOString().slice(0, 10);
    fresh.push(id);
  },

  /* Called once when a tale ends. */
  recordEnding(sceneId, kind) {
    if (!G || G.recorded) return [];
    G.recorded = true;
    const a = Meta.load();
    const fresh = [];
    const won = kind === 'victory';
    a.runs.unshift({
      date: new Date().toISOString().slice(0, 10),
      heroes: G.party.map(c => ({ name: c.name, desc: Character.describe(c), level: c.level, background: c.background, corruption: c.corruption || 0 }))
        .concat((G.fallen || []).map(f => ({ name: f.name, desc: f.desc, level: f.level, died: true }))),
      villain: G.villain, ending: sceneId, won, doom: G.doom, difficulty: G.difficulty,
      allies: G.allies.length, chronicle: G.chronicle.slice(0, 12),
    });
    a.runs = a.runs.slice(0, 30);
    (G.fallen || []).forEach(f => a.fallen.unshift({ name: f.name, desc: f.desc, villain: G.villain }));
    if (sceneId === 'end_dark') a.greyHeir = { name: mostCorrupt().name, desc: Character.describe(mostCorrupt()), villain: G.villain };
    else if (won) a.greyHeir = null;
    if (won) a.lastHero = { name: G.party[0] ? G.party[0].name : 'a hero', desc: G.party[0] ? Character.describe(G.party[0]) : '' };
    a.fallen = a.fallen.slice(0, 20);

    Meta.award(a, 'first_tale', fresh);
    if (won) {
      Meta.award(a, 'victory', fresh);
      a.villainsBeaten[G.villain] = true;
      if (Object.keys(VILLAINS).every(v => a.villainsBeaten[v])) Meta.award(a, 'every_villain', fresh);
      if (G.party.every(c => !(c.corruption))) Meta.award(a, 'untouched', fresh);
      if (G.difficulty === 'hardcore') Meta.award(a, 'hardcore', fresh);
      if (G.difficulty === 'mythic') Meta.award(a, 'mythic', fresh);
      if (G.doom <= 3) Meta.award(a, 'swift', fresh);
    }
    if (has('villain_redeemed')) Meta.award(a, 'redeemer', fresh);
    if (has('axe_reforged')) Meta.award(a, 'whole_axe', fresh);
    if (has('field_forged')) Meta.award(a, 'field_forge', fresh);
    if (sceneId === 'end_dark') Meta.award(a, 'grey_heir', fresh);
    if (sceneId === 'end_sacrifice') Meta.award(a, 'sacrifice', fresh);
    if ((G.flags.mercy || 0) >= 3) Meta.award(a, 'merciful', fresh);
    if ((G.flags.cruelty || 0) >= 3) Meta.award(a, 'ruthless', fresh);
    if (has('host_of_allies')) Meta.award(a, 'host', fresh);
    if (pq('knight', 'redeemed') || pq('healer', 'cure') || pq('smuggler', 'ally') || pq('deserter', 'inside') || pq('descendant', 'blood') || pq('touched', 'closed')) Meta.award(a, 'personal', fresh);
    if (!solo() && G.bond >= 10) Meta.award(a, 'soulbound', fresh);
    if ((G.flags.puzzles_solved || 0) >= 5) Meta.award(a, 'sharp', fresh);
    Meta.save(a);
    return fresh;
  },

  /* At the start of a tale: apply gifts and pick legacy encounters. */
  applyStart(gift) {
    const a = Meta.load();
    G.legacy = null;
    if (a.greyHeir && a.greyHeir.villain) G.legacy = { type: 'heir', name: a.greyHeir.name, desc: a.greyHeir.desc };
    else if (a.fallen.length && Dice.chance(0.6)) { const f = Dice.pick(a.fallen); G.legacy = { type: 'grave', name: f.name, desc: f.desc }; }
    else if (a.lastHero && Dice.chance(0.5)) G.legacy = { type: 'statue', name: a.lastHero.name, desc: a.lastHero.desc };
    if (G.legacy) G.interludes.unshift('int_legacy');
    G.gift = gift || 'none';
    if (gift === 'purse') G.gold += 40;
    if (gift === 'tales') G.party.forEach(c => Character.addXp(c, 60));
    if (gift === 'ward') G.flags.doom_ward = 2;
    if (gift === 'clean') G.party.forEach(c => { c.cleanHands = true; });
    if (gift === 'map') { G._notes = []; addClue(); G._notes = []; }
  },
};

/* A harder mode, unlocked by winning. */
DIFFICULTIES.mythic = { name: 'Mythic', desc: 'Enemies are tougher and hit harder. The ballads will remember you. (Unlocked by winning a tale.)', hp: 1.3, atk: 1, unlock: a => a.achievements.victory };

/* ---------------- The legacy encounter on the road ---------------- */
SCENES.int_legacy = {
  title: s => G.legacy.type === 'heir' ? 'The Grey Heir' : G.legacy.type === 'grave' ? 'A Grave by the Road' : 'The Statue at the Crossroads',
  text: s => {
    const L = G.legacy;
    if (L.type === 'grave') return P(`By the roadside, under a hawthorn, there is a grave you have never seen before — and yet you know the name carved on it: <b>${L.name}</b>, the ${L.desc}. A hero of another tale, who fell before the end.`,
      `Someone has left a carved wooden axe on the grave. It is fresh.`);
    if (L.type === 'statue') return P(`At a crossroads stands a weathered statue of a ${L.desc.toLowerCase()} leaning on an axe. The plinth reads: <b>${L.name}, who sealed the Hollow once before.</b>`,
      `The Keepers' books never mentioned it. But the statue's face is somehow familiar, and its stone eyes are looking north.`);
    return P(`A figure is waiting in the middle of the road, wrapped in grey. When it lowers its hood, you know the face — from another tale, a tale that ended badly. <b>${L.name}</b>, the ${L.desc}, who took the Hollow's crown.`,
      `"I remember you," the Grey Heir says, though that's impossible. "Or I remember someone like you. Someone who thought they could win." Grey fire crawls over their hands. "Turn back. I'm asking nicely, for the person I used to be."`);
  },
  choices: s => {
    const L = G.legacy;
    if (L.type === 'grave') return [
      { label: 'Kneel and pay your respects', effects: () => { restoreFocus(); giveXp(50); chronicle(`Paid respects at the grave of ${L.name}, a hero of another tale.`); }, text: P(`You kneel. For a moment you could swear there is a hand on your shoulder, and a voice: <i>"Finish it. For me."</i> You stand up feeling clearer than you have in days.`), next: 'hub' },
      { label: 'Take the wooden axe as a keepsake', effects: () => addGear('lucky_coin'), text: P(`You take the little carved axe and leave a coin in its place. It feels lucky. It feels like a promise.`), next: 'hub' },
    ];
    if (L.type === 'statue') return [{ label: 'Touch the axe on the plinth', effects: () => { healAll('full'); cleanseAll(1); }, text: P(`The stone is warm. All the aches of the road go out of you at once, and a little of the grey with them.`), next: 'hub' }];
    return [
      {
        label: 'Remind them who they were',
        check: { skill: 'persuasion', dc: 15 }, noTempt: true,
        success: { effects: () => { flag('heir_redeemed'); chronicle(`Reached ${L.name}, the Grey Heir, and set them free.`); G._notes = []; addClue(); giveXp(120); }, text: (s, c) => P(`${c.char.name} talks about the road, the woodcutter, the friends who believed in them. The grey fire gutters. ${L.name} sits down in the dirt and weeps. "Go," they say at last. "And take this — I know things about your enemy. I was meant to be its heir." They tell you everything they know, and walk off south, into the sun.`), next: 'hub' },
        failure: { text: P(`"I told you," the Grey Heir says sadly, and raises their hands.`), next: 'int_legacy_fight' },
      },
      { label: 'Draw steel', next: 'int_legacy_fight' },
    ];
  },
};

SCENES.int_legacy_fight = {
  title: 'The Grey Heir',
  text: s => P(`${G.legacy.name} comes at you wreathed in grey fire — fighting with all the skill of a hero, and none of the mercy.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      noSurrender: true,
      enemies: s => [foe({ name: `${G.legacy.name}, the Grey Heir`, hp: 38, ac: 15, atk: 5, dmg: '2d6+1', xp: 200, big: true, hollow: true,
        phases: [{ line: `"I was you," ${G.legacy.name} snarls. "I was you, and I said yes, and it felt so good—"`, atk: 1 }] })],
      actions: s => battleActions('fragment_light'),
      win: { effects: () => { flag('heir_slain'); addGear('lucky_coin'); chronicle(`Defeated ${G.legacy.name}, the Grey Heir of another tale.`); }, text: s => P(`${G.legacy.name} falls. As the grey burns off, the face underneath looks only tired, and grateful. "Don't say yes," they whisper. "Whatever it offers. Don't." Then they are gone.`), next: 'hub' },
      flee: { effects: () => doom(1), text: P(`You flee. Behind you the Grey Heir laughs, and the laugh follows you for miles.`), next: 'hub' },
      lose: { effects: () => { doom(1); G.party.forEach(c => corrupt(c, 1)); }, text: P(`You wake on the road. The Grey Heir spared you — and left something of the grey in you, as a gift.`), next: 'hub' },
    },
  }],
};
