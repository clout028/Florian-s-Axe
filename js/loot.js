/* ===========================================================
   LOOT, RELICS, SETS & CRAFTING
   Items now have a rarity (common → relic), many carry a
   backstory, and three families form SETS with bonuses for
   wearing two or three pieces. Battles drop crafting
   materials and the occasional piece of gear; the
   Hearthmoor smith turns materials into permanent upgrades.
   Rarity shows on each hero's crest.
   =========================================================== */

const RARITIES = {
  common: { name: 'Common', color: '#b9c0cc', rank: 0 },
  uncommon: { name: 'Uncommon', color: '#7fe3a1', rank: 1 },
  rare: { name: 'Rare', color: '#6db8ff', rank: 2 },
  epic: { name: 'Epic', color: '#c28bff', rank: 3 },
  relic: { name: 'Relic', color: '#ffcf6a', rank: 4 },
};

/* Rarity for everything that already existed. */
(function () {
  const uncommon = ['fine_sword', 'fine_bow', 'fine_rapier', 'runed_staff', 'holy_mace', 'studded', 'breastplate', 'splint', 'warded_robes', 'lucky_coin', 'greataxe', 'scalemail', 'chainmail'];
  const rare = ['smuggler_cutlass', 'keeper_amulet', 'marsh_lantern', 'rune_key', 'monk_beads', 'frost_mail', 'silver_bow'];
  Object.keys(ITEMS).forEach(k => { if (!ITEMS[k].rarity) ITEMS[k].rarity = uncommon.includes(k) ? 'uncommon' : rare.includes(k) ? 'rare' : 'common'; });
  ITEMS.barrow_blade.rarity = 'epic';
  ITEMS.florians_axe.rarity = 'relic';
  ITEMS.silver_bow.lore = 'Grown, not carved: the Heartwood gave one branch for it, and asked a hundred years of service in return.';
  ITEMS.barrow_blade.lore = 'It was buried with a king who had never lost a duel, and wanted to be buried with the proof.';
  ITEMS.keeper_amulet.lore = 'Every Keeper wears one. Each is cut from the same stone as Florian\'s hearth.';
  ITEMS.smuggler_cutlass.lore = 'The hilt is wrapped in sailcloth that has been bled on at least four times.';
})();

/* ---- new gear: loot-table pieces, relics and the three sets ---- */
Object.assign(ITEMS, {
  // The Emberforged set (dwarven)
  ember_axe: { name: 'Cinder-Axe of Emberdeep', slot: 'weapon', dmg: '1d10', stat: 'str', attack: 1, damage: 2, rarity: 'rare', set: 'emberforged', unique: true, lore: 'Forged in the last good hour of the Deep Forge. The head is still faintly warm.' },
  ember_plate: { name: 'Emberforged Plate', slot: 'armor', ac: 17, maxDex: 0, rarity: 'rare', set: 'emberforged', fireResist: true, unique: true, lore: 'Slag-black and impossibly heavy. Dwarven plate that forgot how to be cold.' },
  ember_signet: { name: 'Forgemaster\'s Signet', slot: 'trinket', ac: 1, skills: { athletics: 2 }, rarity: 'rare', set: 'emberforged', unique: true, desc: '+1 AC, +2 Athletics', lore: 'Stamped with a hammer and a rising flame. Whoever wears it is owed a drink in any dwarven hall.' },
  // The Wardens' set (elven)
  warden_blade: { name: 'Leafblade of the Wardens', slot: 'weapon', dmg: '1d8', stat: 'dex', finesse: true, attack: 2, rarity: 'rare', set: 'wardens', unique: true, lore: 'Light as a willow branch and sharper than a thought. Silverbough forgets the names of the people it gives these to — not the blades.' },
  warden_cloak: { name: 'Cloak of the Wardens', slot: 'armor', ac: 13, maxDex: 9, skills: { stealth: 2, perception: 1 }, rarity: 'rare', set: 'wardens', unique: true, lore: 'Woven from silver leaves that have never quite finished falling.' },
  warden_ring: { name: 'Heartwood Ring', slot: 'trinket', skills: { perception: 2, survival: 2 }, rarity: 'rare', set: 'wardens', unique: true, desc: '+2 Perception & Survival', lore: 'Carved from a single root of the Heartwood. It hums when the Hollow is near.' },
  // The Tidewalker set (smugglers)
  tide_cutlass: { name: 'Tidebreaker Cutlass', slot: 'weapon', dmg: '1d8', stat: 'dex', attack: 1, damage: 1, rarity: 'rare', set: 'tide', unique: true, lore: 'Every smuggler has lost a hand to a rival. This blade has no such stories — only the rivals.' },
  tide_coat: { name: 'Oilskin Longcoat', slot: 'armor', ac: 13, maxDex: 9, skills: { deception: 1, sleight: 1 }, rarity: 'rare', set: 'tide', unique: true, lore: 'Seventeen hidden pockets. Eighteen if you count the one that smells.' },
  tide_pearl: { name: 'Black Pearl Charm', slot: 'trinket', checks: 1, rarity: 'rare', set: 'tide', unique: true, desc: '+1 to every skill check', lore: 'Pulled from the throat of a drowned captain. It brings the same luck he had, right up until it doesn\'t.' },
  // Lone relics
  wolfsbane: { name: 'Wolfsbane', slot: 'weapon', dmg: '1d8', stat: 'str', finesse: true, attack: 2, damage: 1, radiant: true, rarity: 'epic', unique: true, lore: 'A silver-edged blade carried by Sela\'s grandmother. It has never missed a Hollow-thing it was sure about.' },
  grave_lantern: { name: 'Keeper\'s Grave-Lantern', slot: 'trinket', ac: 1, skills: { lore: 2, insight: 2 }, focus: 1, rarity: 'epic', unique: true, desc: '+1 AC, +1 Focus, +2 Lore & Insight', lore: 'The flame is a blue the colour of a sleeping city. It does not burn; it remembers.' },
  mirror_shield: { name: 'Mirrorbright Aegis', slot: 'armor', ac: 16, maxDex: 2, fireResist: true, rarity: 'epic', unique: true, lore: 'A polished disc that shows the viewer what they are most afraid of — and then makes it hard to hit.' },
  whetstone_of_florian: { name: 'Florian\'s Whetstone', slot: 'trinket', attack: 0, checks: 0, spellAttack: 1, rarity: 'relic', unique: true, desc: '+1 spell hit; sharpens a weapon each dawn (+1 attack)', lore: 'Smoothed by one hundred years of a woodcutter\'s thumb. Hold it and you can almost hear him humming.', skills: { athletics: 1 } },
  hearthmoor_horn: { name: 'Horn of Hearthmoor', slot: 'trinket', focus: 2, skills: { performance: 2, persuasion: 2 }, rarity: 'epic', unique: true, desc: '+2 Focus, +2 Performance & Persuasion', lore: 'Blown from the walls whenever the town needed to be brave. It still remembers how.' },
  grey_fang: { name: 'Greyfang Dagger', slot: 'weapon', dmg: '1d6', stat: 'dex', finesse: true, attack: 2, damage: 3, rarity: 'epic', unique: true, cursed: true, lore: 'Taken from the hand of something that used to be a thief. It is eager. It is much too eager.' },
});

/* Set bonuses: wear 2 or 3 pieces. */
const ITEM_SETS = {
  emberforged: { name: 'Emberforged', pieces: ['ember_axe', 'ember_plate', 'ember_signet'], b2: { damage: 1, desc: '+1 damage' }, b3: { damage: 2, hp: 10, ac: 1, desc: '+2 damage, +10 HP, +1 AC' } },
  wardens: { name: 'Silverbough Wardens', pieces: ['warden_blade', 'warden_cloak', 'warden_ring'], b2: { attack: 1, desc: '+1 attack' }, b3: { attack: 2, crit: 19, skills: { stealth: 2 }, desc: '+2 attack, crit on 19–20, +2 Stealth' } },
  tide: { name: 'Saltcliff Tidewalker', pieces: ['tide_cutlass', 'tide_coat', 'tide_pearl'], b2: { skills: { deception: 1, sleight: 1 }, desc: '+1 Deception & Sleight' }, b3: { attack: 1, damage: 1, statChecks: { dex: 1, cha: 1 }, desc: '+1 attack, +1 damage, +1 Dex & Cha checks' } },
};

/* Crafting materials */
const MATERIALS = {
  iron: { name: 'Iron Ore', icon: 'heavy', desc: 'Good ore for tempering steel.' },
  ember: { name: 'Ember Stone', icon: 'burning', desc: 'Still warm from the Deep Forge.' },
  silverleaf: { name: 'Silverleaf', icon: 'heal', desc: 'Elven herbs that pull the grey from wounds.' },
  shard: { name: 'Grey Shard', icon: 'hollow', desc: 'Crystallised Hollow. Cold to the touch; faintly hungry.' },
};

/* Extra consumables */
Object.assign(ITEMS, {
  silverleaf_tonic: { name: 'Silverleaf Tonic', consumable: true, heal: '3d4+3', focus: 1, price: 24, rarity: 'uncommon', desc: 'Restores 3d4+3 HP and 1 Focus' },
  grey_cure: { name: 'Grey-Cure', consumable: true, heal: '2d4', cleanse: 2, price: 45, rarity: 'rare', desc: 'Restores 2d4 HP and cleanses 2 Corruption' },
});

const Loot = {
  /* items grouped by rarity, for random drops */
  pool(r) {
    return Object.keys(ITEMS).filter(k => ITEMS[k].rarity === r && !ITEMS[k].consumable && ITEMS[k].slot && (ITEMS[k].unique || ITEMS[k].rarity !== 'common') && k !== 'florians_axe' && k !== 'barrow_blade' && !['silver_bow', 'frost_mail', 'keeper_amulet', 'marsh_lantern', 'rune_key', 'monk_beads', 'smuggler_cutlass', 'whetstone_of_florian'].includes(k));
  },
  pick(r) { const p = Loot.pool(r).filter(k => !hasItem(k)); return p.length ? Dice.pick(p) : null; },

  /* Call after a won battle. */
  drop(enemies, ctx) {
    if (!G || !enemies || !enemies.length) return;
    const cur = G.flags.currentRegion;
    let mats = 0;
    enemies.forEach(e => {
      if (mats >= 3) return;
      const rolls = [['iron', 0.2], ['shard', e.hollow ? 0.4 : 0.04], ['ember', cur === 'mines' || e.fire ? 0.35 : 0.03], ['silverleaf', cur === 'orchard' || cur === 'mire' ? 0.25 : 0.04]];
      rolls.forEach(([m, p]) => { if (mats < 3 && Dice.chance(p)) { G.mats[m] = (G.mats[m] || 0) + 1; mats++; note(`+1 ${MATERIALS[m].name}`, 'good'); } });
    });
    // one gear roll per battle, driven by the toughest foe
    const best = enemies.reduce((a, e) => (e.boss ? 3 : e.lieutenant ? 2 : e.big ? 1 : 0) > (a.boss ? 3 : a.lieutenant ? 2 : a.big ? 1 : 0) ? e : a, enemies[0]);
    const p = best.boss ? 1 : best.lieutenant ? 0.7 : best.big ? 0.3 : 0.05 + 0.01 * tier();
    if (!Dice.chance(p)) return;
    const roll = Math.random();
    const r = best.boss ? (roll < 0.35 ? 'epic' : 'rare') : best.lieutenant ? (roll < 0.15 ? 'epic' : roll < 0.7 ? 'rare' : 'uncommon') : (roll < 0.1 ? 'rare' : 'uncommon');
    const id = Loot.pick(r) || Loot.pick('rare') || Loot.pick('uncommon');
    if (id) { addGear(id); chronicle(`Found ${ITEMS[id].name}.`); }
  },

  /* ---- sets & tempering ---- */
  setCount(c, setId) { return ITEM_SETS[setId].pieces.filter(id => c.equip.weapon === id || c.equip.armor === id || c.equip.trinket === id).length; },
  activeSets(c) {
    const out = [];
    Object.keys(ITEM_SETS).forEach(k => { const n = Loot.setCount(c, k); if (n >= 2) out.push({ id: k, n, set: ITEM_SETS[k] }); });
    return out;
  },
  setFx(c) {
    const out = [];
    Loot.activeSets(c).forEach(s => { out.push(s.set.b2); if (s.n >= 3) out.push(s.set.b3); });
    return out;
  },
  temper(c, k) { return ((c.temper || {})[k]) || 0; },
  topRarity(c) { return ['weapon', 'armor', 'trinket'].reduce((a, s) => { const it = ITEMS[c.equip[s]]; return it && RARITIES[it.rarity || 'common'].rank > RARITIES[a].rank ? (it.rarity || 'common') : a; }, 'common'); },

  /* Smith recipes. */
  RECIPES: [
    { id: 'temper_w', name: 'Temper your weapon', desc: '+1 attack with the chosen hero\'s weapon. Up to three times.', cost: { gold: 15, iron: 2 }, hero: true,
      ok: c => Loot.temper(c, 'weapon') < 3, apply: c => { c.temper = c.temper || {}; c.temper.weapon = Loot.temper(c, 'weapon') + 1; } },
    { id: 'temper_a', name: 'Reinforce armour', desc: '+1 AC. Up to twice.', cost: { gold: 15, iron: 2 }, hero: true,
      ok: c => Loot.temper(c, 'armor') < 2, apply: c => { c.temper = c.temper || {}; c.temper.armor = Loot.temper(c, 'armor') + 1; } },
    { id: 'ember', name: 'Ember-infuse a weapon', desc: '+1 damage. Up to twice.', cost: { gold: 10, ember: 2, iron: 1 }, hero: true,
      ok: c => Loot.temper(c, 'fire') < 2, apply: c => { c.temper = c.temper || {}; c.temper.fire = Loot.temper(c, 'fire') + 1; } },
    { id: 'ward', name: 'Bind a Grey Shard into a ward', desc: '+1 spell attack and +1 damage against Hollow-things (permanent).', cost: { gold: 10, shard: 3 }, hero: true,
      ok: c => Loot.temper(c, 'ward') < 1, apply: c => { c.temper = c.temper || {}; c.temper.ward = 1; } },
    { id: 'brew', name: 'Brew a Silverleaf Tonic', desc: 'Two Silverleaf make a Silverleaf Tonic.', cost: { silverleaf: 2 }, hero: false, apply: () => { G.pack.silverleaf_tonic = (G.pack.silverleaf_tonic || 0) + 1; } },
    { id: 'cure', name: 'Distil a Grey-Cure', desc: 'Shards and silverleaf make a Grey-Cure (restores HP, cleanses 2 Corruption).', cost: { gold: 12, shard: 2, silverleaf: 1 }, hero: false, apply: () => { G.pack.grey_cure = (G.pack.grey_cure || 0) + 1; } },
    { id: 'smelt', name: 'Sell surplus ore', desc: 'Three Iron Ore fetch 24 gold.', cost: { iron: 3 }, hero: false, apply: () => { G.gold += 24; } },
  ],
  discount() { const d = Rep.get('dwarves'); return d >= 4 ? 0.5 : d >= 2 ? 0.75 : d <= -2 ? 1.25 : 1; },
  cost(r) { const c = {}; Object.keys(r.cost).forEach(k => { c[k] = k === 'gold' ? Math.round(r.cost[k] * Loot.discount()) : r.cost[k]; }); return c; },
  canPay(c) { return Object.keys(c).every(k => k === 'gold' ? G.gold >= c[k] : (G.mats[k] || 0) >= c[k]); },
  pay(c) { Object.keys(c).forEach(k => { if (k === 'gold') G.gold -= c[k]; else G.mats[k] -= c[k]; }); },
};

/* tempering is applied via Character stats */
(function () {
  const fx = Character.fx;
  Character.fx = function (c) {
    const out = fx.call(this, c);
    Loot.setFx(c).forEach(f => {
      ['attack', 'damage', 'ac', 'hp', 'focus', 'spellAttack', 'spellDamage'].forEach(k => { if (f[k]) out[k] += f[k]; });
      if (f.skills) for (const k in f.skills) out.skills[k] = (out.skills[k] || 0) + f.skills[k];
      if (f.statChecks) for (const k in f.statChecks) out.statChecks[k] = (out.statChecks[k] || 0) + f.statChecks[k];
      if (f.crit) out.crit = Math.min(out.crit, f.crit);
    });
    if (c.temper) { out.attack += c.temper.weapon || 0; out.ac += c.temper.armor || 0; out.damage += c.temper.fire || 0; if (c.temper.ward) out.spellAttack += 1; }
    if (c.equip.trinket === 'whetstone_of_florian') out.attack += 1;
    if (c.equip.weapon === 'grey_fang') out.ac -= 1;   // it is much too eager
    return out;
  };
})();

function shopStock() {
  const s = SHOP_STOCK.slice();
  if (Rep.get('elves') >= 2) s.push('silverleaf_tonic');
  if (Rep.get('smugglers') >= 2) s.push('grey_cure');
  return s;
}
const compGone = () => !!(G.companion && G.companion.gone);
