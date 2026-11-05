/* ===========================================================
   SKILL TREES & PERKS
   Each class has two five-step branches (new abilities, tougher
   stats) and every hero can also walk the Wayfarer disciplines,
   which grant PERKS: new things the party can do in the story.

   There are more nodes than skill points (about 8 by level 8),
   so every hero ends up genuinely different.

   Perks come in two flavours:
   - Mastery: a check in the perk's skills with a DC at or below
     its cap can be won outright, by spending 1 Focus, instead of
     rolling. It appears as an extra option on any such check.
   - Knack: a standing effect (a market discount, healing after
     battles, a free clue in each new region…).
   =========================================================== */

/* Level required for the 1st…5th step of a class branch */
const TIER_LEVELS = [1, 2, 3, 4, 6];

Object.assign(ABILITIES, {
  reaping_blow: { name: 'Reaping Blow', cost: 2, target: 'enemy', kind: 'weapon', extraDie: '2d8', advantage: true, desc: 'Attack with advantage, +2d8 damage.' },
  shield_bash: { name: 'Shield Bash', cost: 1, target: 'enemy', kind: 'weapon', extraDie: '1d6', status: { stunned: 1 }, desc: '+1d6 damage and stuns the foe.' },
  venom_blade: { name: 'Venom Blade', cost: 1, target: 'enemy', kind: 'weapon', extraDie: '1d6', status: { bleeding: 3 }, desc: '+1d6 damage; the foe bleeds.' },
  assassinate: { name: 'Assassinate', cost: 3, target: 'enemy', kind: 'weapon', extraDie: '5d6', advantage: true, desc: 'Attack with advantage, +5d6 damage.' },
  frost_lance: { name: 'Frost Lance', cost: 2, target: 'enemy', kind: 'spell', die: '3d8', status: { chilled: 2 }, desc: '3d8 cold; chills the foe (−1 AC).' },
  arcane_tempest: { name: 'Arcane Tempest', cost: 4, target: 'allEnemies', kind: 'spell', die: '4d6', autoHit: true, desc: 'Raw force tears through every enemy.' },
  judgement: { name: 'Judgement', cost: 2, target: 'enemy', kind: 'weapon', extraDie: '3d8', radiant: true, status: { exposed: 2 }, desc: 'Radiant strike +3d8 (double vs. Hollow); exposes the foe.' },
  greater_heal: { name: 'Greater Heal', cost: 2, target: 'ally', kind: 'heal', heal: '4d8', addStat: true, desc: 'Mend grievous wounds.' },
  pinning_shot: { name: 'Pinning Shot', cost: 1, target: 'enemy', kind: 'weapon', toHit: 3, extraDie: '1d6', status: { stunned: 1 }, desc: '+3 to hit, +1d6; pins the foe in place.' },
  caltrops: { name: 'Caltrops & Snares', cost: 2, target: 'allEnemies', kind: 'weapon', autoHit: true, half: true, status: { exposed: 2 }, desc: 'Half damage to every enemy, and they are exposed.' },
  dazzle: { name: 'Dazzling Display', cost: 2, target: 'allEnemies', kind: 'spell', die: '2d6', debuff: true, desc: 'Rattle every enemy with a blaze of showmanship.' },
  anthem: { name: 'Anthem of War', cost: 2, target: 'party', kind: 'buff', buff: { attack: 3 }, desc: 'Party +3 to attack this battle.' },
});

/* Two more steps on every class branch */
const CLASS_EXTENSIONS = {
  warrior: [
    [{ id: 'w_a4', name: 'Reaping Blow', desc: 'Ability: attack with advantage, +2d8 damage (2 Focus).', fx: { ability: 'reaping_blow' } },
     { id: 'w_a5', name: 'Warlord', desc: '+2 attack, critical hits on 19–20. A glare wins Intimidation checks up to DC 14 (1 Focus).', fx: { attack: 2, crit: 19, perks: ['warlord'] } }],
    [{ id: 'w_b4', name: 'Shield Bash', desc: 'Ability: +1d6 damage and stun the foe (1 Focus).', fx: { ability: 'shield_bash' } },
     { id: 'w_b5', name: 'Immovable', desc: '+12 max HP, +1 AC. Brute strength wins Athletics checks up to DC 14 (1 Focus).', fx: { hp: 12, ac: 1, perks: ['immovable'] } }],
  ],
  rogue: [
    [{ id: 'r_a4', name: 'Venom Blade', desc: 'Ability: +1d6 damage and the foe bleeds (1 Focus).', fx: { ability: 'venom_blade' } },
     { id: 'r_a5', name: 'Death\'s Shadow', desc: '+2 damage. Ability: Assassinate — advantage, +5d6 (3 Focus).', fx: { damage: 2, ability: 'assassinate' } }],
    [{ id: 'r_b4', name: 'Light Fingers', desc: '+2 Sleight of Hand and Stealth. Locks and pockets up to DC 13 open for you (1 Focus).', fx: { skills: { sleight: 2, stealth: 2 }, perks: ['light_fingers'] } },
     { id: 'r_b5', name: 'Face of a Hundred Masks', desc: '+2 Deception and Persuasion. Win Deception or Persuasion checks up to DC 14 (1 Focus).', fx: { skills: { deception: 2, persuasion: 2 }, perks: ['masquerade'] } }],
  ],
  mage: [
    [{ id: 'm_a4', name: 'Frost Lance', desc: 'Ability: 3d8 cold, chills the foe (2 Focus).', fx: { ability: 'frost_lance' } },
     { id: 'm_a5', name: 'Arcane Tempest', desc: 'Ability: 4d6 force to every enemy, never misses (4 Focus).', fx: { ability: 'arcane_tempest' } }],
    [{ id: 'm_b4', name: 'Ward of Force', desc: '+2 AC, +1 max Focus.', fx: { ac: 2, focus: 1 } },
     { id: 'm_b5', name: 'Archmage\'s Insight', desc: '+2 spell attack. Win Arcana, Lore or Investigation checks up to DC 14 (1 Focus).', fx: { spellAttack: 2, perks: ['arcanist'] } }],
  ],
  cleric: [
    [{ id: 'c_a4', name: 'Judgement', desc: 'Ability: radiant strike +3d8, exposes the foe (2 Focus).', fx: { ability: 'judgement' } },
     { id: 'c_a5', name: 'Avatar of Light', desc: '+2 attack, +3 damage.', fx: { attack: 2, damage: 3 } }],
    [{ id: 'c_b4', name: 'Greater Heal', desc: 'Ability: heal an ally 4d8 + WIS (2 Focus).', fx: { ability: 'greater_heal' } },
     { id: 'c_b5', name: 'Beacon of Hope', desc: '+8 max HP, +1 AC. Win Medicine or Insight checks up to DC 14 (1 Focus).', fx: { hp: 8, ac: 1, perks: ['beacon'] } }],
  ],
  ranger: [
    [{ id: 'g_a4', name: 'Pinning Shot', desc: 'Ability: +3 to hit, +1d6, the foe is pinned (1 Focus).', fx: { ability: 'pinning_shot' } },
     { id: 'g_a5', name: 'Hawkeye', desc: '+2 attack, +1 damage, critical hits on 18–20.', fx: { attack: 2, damage: 1, crit: 18 } }],
    [{ id: 'g_b4', name: 'Trapwright', desc: 'Ability: snares and caltrops hurt every enemy for half and expose them (2 Focus).', fx: { ability: 'caltrops' } },
     { id: 'g_b5', name: 'Warden of the Wild', desc: '+10 max HP. Win Survival checks up to DC 14 (1 Focus).', fx: { hp: 10, perks: ['warden'] } }],
  ],
  bard: [
    [{ id: 'b_a4', name: 'Dazzling Display', desc: 'Ability: 2d6 to every enemy and rattle them (2 Focus).', fx: { ability: 'dazzle' } },
     { id: 'b_a5', name: 'Epic Finale', desc: '+2 attack, +2 damage.', fx: { attack: 2, damage: 2 } }],
    [{ id: 'b_b4', name: 'Anthem of War', desc: 'Ability: the whole party gains +3 attack for the battle (2 Focus).', fx: { ability: 'anthem' } },
     { id: 'b_b5', name: 'Living Legend', desc: '+1 to every Charisma check. Win Persuasion, Performance or Deception checks up to DC 14 (1 Focus).', fx: { statChecks: { cha: 1 }, perks: ['legend'] } }],
  ],
};
Object.keys(CLASS_EXTENSIONS).forEach(k => {
  CLASSES[k].tree.forEach((br, i) => {
    br.nodes.push(...CLASS_EXTENSIONS[k][i]);
    br.nodes.forEach((n, j) => { n.lvl = TIER_LEVELS[j]; });
  });
});

/* Disciplines open to every class. */
const WAYFARER = [
  { name: 'Diplomat', wayfarer: true, nodes: [
    { id: 'x_dip1', name: 'Smooth Talker', lvl: 2, desc: '+1 Persuasion, Deception and Intimidation. Win those checks up to DC 12 with words alone (1 Focus).', fx: { skills: { persuasion: 1, deception: 1, intimidation: 1 }, perks: ['smooth_talker'] } },
    { id: 'x_dip2', name: 'Master Negotiator', lvl: 5, desc: 'Win those checks up to DC 15. Shopkeepers give you 15% off.', fx: { perks: ['silver_tongue', 'haggler'] } },
  ] },
  { name: 'Scout', wayfarer: true, nodes: [
    { id: 'x_sco1', name: 'Pathfinder', lvl: 2, desc: '+1 Survival and Perception. Win those checks up to DC 12 (1 Focus).', fx: { skills: { survival: 1, perception: 1 }, perks: ['pathfinder'] } },
    { id: 'x_sco2', name: 'Trailblazer', lvl: 5, desc: 'Win them up to DC 15. Every second journey you take costs no Doom.', fx: { perks: ['trailblazer'] } },
  ] },
  { name: 'Scholar', wayfarer: true, nodes: [
    { id: 'x_sch1', name: 'Bookworm', lvl: 2, desc: '+1 Lore, Arcana and Investigation. Win those checks up to DC 12 (1 Focus).', fx: { skills: { lore: 1, arcana: 1, investigation: 1 }, perks: ['bookworm'] } },
    { id: 'x_sch2', name: 'Sage', lvl: 5, desc: 'Win them up to DC 15. You learn a secret about the villain whenever you set out for a new region.', fx: { perks: ['sage'] } },
  ] },
  { name: 'Burglar', wayfarer: true, nodes: [
    { id: 'x_bur1', name: 'Nimble Fingers', lvl: 2, desc: '+1 Sleight of Hand and Stealth. Win those checks up to DC 12 (1 Focus).', fx: { skills: { sleight: 1, stealth: 1 }, perks: ['nimble'] } },
    { id: 'x_bur2', name: 'Shadow Walker', lvl: 5, desc: 'Win them up to DC 15. The party can always slip away from a battle that allows it.', fx: { perks: ['shadow_walker'] } },
  ] },
  { name: 'Brawn', wayfarer: true, nodes: [
    { id: 'x_bra1', name: 'Strongback', lvl: 2, desc: '+4 max HP. Win Athletics and Acrobatics checks up to DC 12 (1 Focus).', fx: { hp: 4, perks: ['strongback'] } },
    { id: 'x_bra2', name: 'Titan', lvl: 5, desc: 'Win them up to DC 15. +1 damage and +1 attack.', fx: { damage: 1, attack: 1, perks: ['titan'] } },
  ] },
  { name: 'Healer', wayfarer: true, nodes: [
    { id: 'x_hea1', name: 'Field Medic', lvl: 2, desc: 'After every victory the party recovers 1d6 HP. Win Medicine and Insight checks up to DC 12 (1 Focus).', fx: { perks: ['field_medic'] } },
    { id: 'x_hea2', name: 'Miracle Worker', lvl: 5, desc: 'Win them up to DC 15. One lasting injury mends each time you rest at the inn for free.', fx: { perks: ['miracle_worker'] } },
  ] },
];

/* Perk catalogue. A perk with `skills` and `dc` is a Mastery. */
const PERKS = {
  smooth_talker: { name: 'Smooth Talker', skills: ['persuasion', 'deception', 'intimidation'], dc: 12 },
  silver_tongue: { name: 'Master Negotiator', skills: ['persuasion', 'deception', 'intimidation'], dc: 15 },
  pathfinder: { name: 'Pathfinder', skills: ['survival', 'perception'], dc: 12 },
  trailblazer: { name: 'Trailblazer', skills: ['survival', 'perception'], dc: 15 },
  bookworm: { name: 'Bookworm', skills: ['lore', 'arcana', 'investigation'], dc: 12 },
  sage: { name: 'Sage', skills: ['lore', 'arcana', 'investigation'], dc: 15 },
  nimble: { name: 'Nimble Fingers', skills: ['sleight', 'stealth'], dc: 12 },
  shadow_walker: { name: 'Shadow Walker', skills: ['sleight', 'stealth'], dc: 15 },
  strongback: { name: 'Strongback', skills: ['athletics', 'acrobatics'], dc: 12 },
  titan: { name: 'Titan', skills: ['athletics', 'acrobatics'], dc: 15 },
  field_medic: { name: 'Field Medic', skills: ['medicine', 'insight'], dc: 12 },
  miracle_worker: { name: 'Miracle Worker', skills: ['medicine', 'insight'], dc: 15 },
  warlord: { name: 'Warlord', skills: ['intimidation'], dc: 14 },
  immovable: { name: 'Immovable', skills: ['athletics'], dc: 14 },
  light_fingers: { name: 'Light Fingers', skills: ['sleight'], dc: 13 },
  masquerade: { name: 'Hundred Masks', skills: ['deception', 'persuasion'], dc: 14 },
  arcanist: { name: 'Archmage\'s Insight', skills: ['arcana', 'lore', 'investigation'], dc: 14 },
  beacon: { name: 'Beacon of Hope', skills: ['medicine', 'insight'], dc: 14 },
  warden: { name: 'Warden of the Wild', skills: ['survival'], dc: 14 },
  legend: { name: 'Living Legend', skills: ['persuasion', 'performance', 'deception'], dc: 14 },
  // knacks (no skills): effects handled where they apply
  haggler: { name: 'Haggler' },
};

/* ---- perk helpers (usable from story files) ---- */
const perksOf = c => Character.fx(c).perks;
const hasPerk = id => G.party.some(c => c.hp > 0 && perksOf(c).includes(id));
const perkHolder = id => G.party.find(c => c.hp > 0 && perksOf(c).includes(id));

/* Everyone in the party who could win this check outright, best option first. */
function masteryOptions(skill, dc) {
  const out = [];
  G.party.forEach(c => {
    if (c.hp <= 0 || c.focus < 1) return;
    perksOf(c).forEach(id => {
      const p = PERKS[id];
      if (p && p.skills && p.skills.includes(skill) && p.dc >= dc) out.push({ char: c, perk: id, cap: p.dc });
    });
  });
  // prefer the tightest fit: it uses the "lowest" perk that still works
  return out.sort((a, b) => a.cap - b.cap);
}

/* Spend a Mastery to win a check without rolling. */
Engine.usePerk = function (ch) {
  const { char, perk, orig } = ch.perkBypass;
  const dc = typeof orig.check.dc === 'function' ? orig.check.dc(G) : orig.check.dc;
  char.focus = Math.max(0, char.focus - 1);
  G._notes = [];
  note(`${char.name} uses ${PERKS[perk].name} (−1 Focus)`, 'good');
  const ctx = { char, roll: undefined, total: dc, dc, success: true, partial: false, crit: false, fumble: false, margin: 4, focusRoll: 0, parts: [], perk: PERKS[perk].name };
  Engine.completeCheck(orig, ctx);
};
