/* ===========================================================
   Florian's Axe — static game data
   Races, classes, skill trees, abilities, items, enemies, villains
   =========================================================== */

const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const STAT_NAMES = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

const SKILLS = {
  athletics: { name: 'Athletics', stat: 'str' },
  acrobatics: { name: 'Acrobatics', stat: 'dex' },
  stealth: { name: 'Stealth', stat: 'dex' },
  sleight: { name: 'Sleight of Hand', stat: 'dex' },
  arcana: { name: 'Arcana', stat: 'int' },
  lore: { name: 'Lore', stat: 'int' },
  investigation: { name: 'Investigation', stat: 'int' },
  perception: { name: 'Perception', stat: 'wis' },
  survival: { name: 'Survival', stat: 'wis' },
  medicine: { name: 'Medicine', stat: 'wis' },
  insight: { name: 'Insight', stat: 'wis' },
  persuasion: { name: 'Persuasion', stat: 'cha' },
  deception: { name: 'Deception', stat: 'cha' },
  intimidation: { name: 'Intimidation', stat: 'cha' },
  performance: { name: 'Performance', stat: 'cha' },
};

const RACES = {
  human: {
    name: 'Human', icon: '🧑',
    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    skills: { persuasion: 1 },
    trait: 'Versatile — +1 to every stat and one extra skill point at level 1.',
    extraPoint: true,
    desc: 'Restless and adaptable, humans settled the river valleys Florian once defended.',
  },
  elf: {
    name: 'Elf', icon: '🧝',
    bonus: { dex: 2, int: 1 },
    skills: { perception: 2 },
    trait: 'Keen Senses — +2 Perception. Can read the old elvish script.',
    desc: 'Long-lived wanderers who remember the Hollow\'s first coming as their grandparents\' tale.',
  },
  dwarf: {
    name: 'Dwarf', icon: '⛏️',
    bonus: { con: 2, str: 1 },
    skills: { lore: 1 },
    trait: 'Stoneborn — +2 max HP per level. Can read dwarven runes.',
    hpPerLevel: 2,
    desc: 'Stubborn delvers of the deep halls, whose smiths first shaped the axe\'s head.',
  },
  halfling: {
    name: 'Halfling', icon: '🍀',
    bonus: { dex: 2, cha: 1 },
    skills: { stealth: 1 },
    trait: 'Lucky — a natural 1 on any d20 is rerolled once.',
    lucky: true,
    desc: 'Small, cheerful, and far braver than the big folk ever expect.',
  },
  halforc: {
    name: 'Half-Orc', icon: '🪓',
    bonus: { str: 2, con: 1 },
    skills: { intimidation: 2 },
    trait: 'Relentless — once per battle, drop to 1 HP instead of falling.',
    relentless: true,
    desc: 'Caught between two peoples, belonging fully to neither — and tougher for it.',
  },
  tiefling: {
    name: 'Tiefling', icon: '😈',
    bonus: { cha: 2, int: 1 },
    skills: { deception: 2 },
    trait: 'Infernal Legacy — +1 ability damage and half damage from fire.',
    fireResist: true, abilityDamage: 1,
    desc: 'Marked by an ancestor\'s bargain, often mistrusted, rarely forgotten.',
  },
};

/* Each class: hit die, stat priority (for assigning the stat array), proficient skills,
   starting gear, base ability and a two-branch skill tree (3 tiers each). */
const CLASSES = {
  warrior: {
    name: 'Warrior', icon: '⚔️', hd: 10, focus: 2,
    priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    skills: ['athletics', 'intimidation', 'survival'],
    weapon: 'longsword', armor: 'chainmail', ability: 'power_strike',
    desc: 'Masters of steel who stand in front so others may live.',
    tree: [
      { name: 'Weapon Master', nodes: [
        { id: 'w_a1', name: 'Honed Edge', desc: '+1 to attack rolls.', fx: { attack: 1 } },
        { id: 'w_a2', name: 'Cleave', desc: 'Ability: strike every enemy at once (2 Focus).', fx: { ability: 'cleave' } },
        { id: 'w_a3', name: 'Executioner', desc: '+3 weapon damage.', fx: { damage: 3 } },
      ] },
      { name: 'Bulwark', nodes: [
        { id: 'w_b1', name: 'Shield Wall', desc: '+1 Armor Class.', fx: { ac: 1 } },
        { id: 'w_b2', name: 'Second Wind', desc: 'Ability: heal yourself 1d10 + level (1 Focus).', fx: { ability: 'second_wind' } },
        { id: 'w_b3', name: 'Unbreakable', desc: '+10 max HP, +2 Athletics and Intimidation.', fx: { hp: 10, skills: { athletics: 2, intimidation: 2 } } },
      ] },
    ],
  },
  rogue: {
    name: 'Rogue', icon: '🗡️', hd: 8, focus: 3,
    priority: ['dex', 'con', 'cha', 'int', 'wis', 'str'],
    skills: ['stealth', 'acrobatics', 'sleight', 'deception', 'perception'],
    weapon: 'shortsword', armor: 'leather', ability: 'sneak_attack',
    desc: 'Quick hands, quicker wits — the knife you never saw.',
    tree: [
      { name: 'Assassin', nodes: [
        { id: 'r_a1', name: 'Silent Step', desc: '+2 Stealth, +1 damage.', fx: { skills: { stealth: 2 }, damage: 1 } },
        { id: 'r_a2', name: 'Shadowstep', desc: 'Ability: vanish and strike, +3d6 damage (2 Focus).', fx: { ability: 'shadowstep' } },
        { id: 'r_a3', name: 'Killing Blow', desc: '+2 attack, critical hits on 19–20.', fx: { attack: 2, crit: 19 } },
      ] },
      { name: 'Trickster', nodes: [
        { id: 'r_b1', name: 'Silver Tongue', desc: '+2 Deception and Acrobatics.', fx: { skills: { deception: 2, acrobatics: 2 } } },
        { id: 'r_b2', name: 'Evasion', desc: '+2 Armor Class.', fx: { ac: 2 } },
        { id: 'r_b3', name: 'Lucky Break', desc: '+2 to every Dexterity and Charisma check.', fx: { statChecks: { dex: 2, cha: 2 } } },
      ] },
    ],
  },
  mage: {
    name: 'Mage', icon: '🔮', hd: 8, focus: 4, spellStat: 'int',
    priority: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
    skills: ['arcana', 'lore', 'investigation'],
    weapon: 'dagger', armor: 'robes', ability: 'firebolt',
    desc: 'Scholars of the weave who bend fire and force to their will.',
    tree: [
      { name: 'Evoker', nodes: [
        { id: 'm_a1', name: 'Kindled Will', desc: '+1 spell attack, +2 spell damage.', fx: { spellAttack: 1, spellDamage: 2 } },
        { id: 'm_a2', name: 'Fireball', desc: 'Ability: 3d6 fire to every enemy (3 Focus).', fx: { ability: 'fireball' } },
        { id: 'm_a3', name: 'Empowered Magic', desc: '+1d6 to all spell damage.', fx: { spellDie: '1d6' } },
      ] },
      { name: 'Scholar', nodes: [
        { id: 'm_b1', name: 'Deep Study', desc: '+2 Arcana and Lore.', fx: { skills: { arcana: 2, lore: 2 } } },
        { id: 'm_b2', name: 'Magic Missile', desc: 'Ability: 3 darts that never miss, 1d4+1 each (1 Focus).', fx: { ability: 'magic_missile' } },
        { id: 'm_b3', name: 'Arcane Reservoir', desc: '+2 max Focus, +1 AC.', fx: { focus: 2, ac: 1 } },
      ] },
    ],
  },
  cleric: {
    name: 'Cleric', icon: '✨', hd: 8, focus: 3, spellStat: 'wis',
    priority: ['wis', 'con', 'str', 'dex', 'cha', 'int'],
    skills: ['medicine', 'insight', 'lore', 'persuasion'],
    weapon: 'mace', armor: 'scalemail', ability: 'heal', ability2: 'sacred_flame',
    desc: 'Keepers of the old light, whose prayers mend flesh and burn the Hollow.',
    tree: [
      { name: 'Dawn', nodes: [
        { id: 'c_a1', name: 'Smite', desc: 'Ability: weapon strike +2d8 radiant, double vs. Hollow (1 Focus).', fx: { ability: 'smite' } },
        { id: 'c_a2', name: 'Burning Faith', desc: '+1 attack, +2 damage.', fx: { attack: 1, damage: 2 } },
        { id: 'c_a3', name: 'Radiant Burst', desc: 'Ability: 2d8 radiant to every enemy (3 Focus).', fx: { ability: 'radiant_burst' } },
      ] },
      { name: 'Life', nodes: [
        { id: 'c_b1', name: 'Mender', desc: 'Healing restores +level extra HP. +2 Medicine.', fx: { healBonus: true, skills: { medicine: 2 } } },
        { id: 'c_b2', name: 'Bless', desc: 'Ability: party gains +2 to attacks for the battle (2 Focus).', fx: { ability: 'bless' } },
        { id: 'c_b3', name: 'Sanctuary', desc: '+1 AC, +2 Perception and Insight.', fx: { ac: 1, skills: { perception: 2, insight: 2 } } },
      ] },
    ],
  },
  ranger: {
    name: 'Ranger', icon: '🏹', hd: 10, focus: 2,
    priority: ['dex', 'con', 'wis', 'str', 'int', 'cha'],
    skills: ['survival', 'perception', 'stealth', 'athletics'],
    weapon: 'longbow', armor: 'leather', ability: 'aimed_shot',
    desc: 'Trackers of the wild roads, at home where maps end.',
    tree: [
      { name: 'Marksman', nodes: [
        { id: 'g_a1', name: 'Steady Aim', desc: '+1 to attack rolls.', fx: { attack: 1 } },
        { id: 'g_a2', name: 'Volley', desc: 'Ability: 1d8 + DEX to every enemy (2 Focus).', fx: { ability: 'volley' } },
        { id: 'g_a3', name: 'Deadeye', desc: '+2 damage, critical hits on 19–20.', fx: { damage: 2, crit: 19 } },
      ] },
      { name: 'Wanderer', nodes: [
        { id: 'g_b1', name: 'Pathfinder', desc: '+2 Survival and Perception.', fx: { skills: { survival: 2, perception: 2 } } },
        { id: 'g_b2', name: 'Wolf Companion', desc: 'A loyal wolf bites a foe every round (1d4+1, growing with level).', fx: { companion: true } },
        { id: 'g_b3', name: 'Hardy', desc: '+1 AC, +6 max HP.', fx: { ac: 1, hp: 6 } },
      ] },
    ],
  },
  bard: {
    name: 'Bard', icon: '🎻', hd: 8, focus: 3, spellStat: 'cha',
    priority: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    skills: ['persuasion', 'performance', 'deception', 'insight', 'lore'],
    weapon: 'rapier', armor: 'studded', ability: 'vicious_mockery',
    desc: 'Singers of old songs whose words cut deeper than any blade.',
    tree: [
      { name: 'Valor', nodes: [
        { id: 'b_a1', name: 'Duelist', desc: '+1 attack, +1 AC.', fx: { attack: 1, ac: 1 } },
        { id: 'b_a2', name: 'Inspire', desc: 'Ability: an ally heals 1d8 and gains +2 attack (1 Focus).', fx: { ability: 'inspire' } },
        { id: 'b_a3', name: 'Blade Flourish', desc: '+1d6 weapon damage.', fx: { weaponDie: '1d6' } },
      ] },
      { name: 'Lore', nodes: [
        { id: 'b_b1', name: 'Loremaster', desc: '+2 Lore and Persuasion.', fx: { skills: { lore: 2, persuasion: 2 } } },
        { id: 'b_b2', name: 'Song of Rest', desc: 'Ability: whole party heals 1d6 + CHA (2 Focus).', fx: { ability: 'song_of_rest' } },
        { id: 'b_b3', name: 'Legend\'s Voice', desc: '+2 to every Charisma check, +2 spell damage.', fx: { statChecks: { cha: 2 }, spellDamage: 2 } },
      ] },
    ],
  },
};

/* Combat abilities. kind: weapon (uses weapon attack), spell (uses spell stat), heal, buff, auto */
const ABILITIES = {
  power_strike: { name: 'Power Strike', cost: 1, target: 'enemy', kind: 'weapon', extraDie: '1d8', desc: 'Weapon attack with +1d8 damage.' },
  cleave: { name: 'Cleave', cost: 2, target: 'allEnemies', kind: 'weapon', desc: 'Weapon attack against every enemy.' },
  second_wind: { name: 'Second Wind', cost: 1, target: 'self', kind: 'heal', heal: '1d10', addLevel: true, desc: 'Heal yourself.' },
  sneak_attack: { name: 'Sneak Attack', cost: 0, target: 'enemy', kind: 'weapon', extraDie: '2d4', desc: 'Strike a weak spot for +2d4 (free).' },
  shadowstep: { name: 'Shadowstep', cost: 2, target: 'enemy', kind: 'weapon', extraDie: '3d6', advantage: true, desc: 'Attack with advantage, +3d6.' },
  firebolt: { name: 'Firebolt', cost: 0, target: 'enemy', kind: 'spell', die: '1d12', element: 'fire', desc: 'Hurl fire (free).' },
  fireball: { name: 'Fireball', cost: 3, target: 'allEnemies', kind: 'spell', die: '3d6', autoHit: true, element: 'fire', desc: 'Engulf every enemy.' },
  magic_missile: { name: 'Magic Missile', cost: 1, target: 'enemy', kind: 'spell', die: '3d4+3', autoHit: true, desc: 'Never misses.' },
  sacred_flame: { name: 'Sacred Flame', cost: 0, target: 'enemy', kind: 'spell', die: '1d8', radiant: true, desc: 'Radiant fire, double vs. Hollow (free).' },
  heal: { name: 'Healing Word', cost: 1, target: 'ally', kind: 'heal', heal: '2d8', addStat: true, desc: 'Heal an ally.' },
  smite: { name: 'Smite', cost: 1, target: 'enemy', kind: 'weapon', extraDie: '2d8', radiant: true, desc: 'Radiant strike, double vs. Hollow.' },
  radiant_burst: { name: 'Radiant Burst', cost: 3, target: 'allEnemies', kind: 'spell', die: '2d8', autoHit: true, radiant: true, desc: 'Light burns all foes.' },
  bless: { name: 'Bless', cost: 2, target: 'party', kind: 'buff', buff: { attack: 2 }, desc: 'Party +2 to attack this battle.' },
  aimed_shot: { name: 'Aimed Shot', cost: 1, target: 'enemy', kind: 'weapon', toHit: 5, extraDie: '1d8', desc: '+5 to hit, +1d8 damage.' },
  volley: { name: 'Volley', cost: 2, target: 'allEnemies', kind: 'weapon', autoHit: true, desc: 'Arrows rain on every enemy.' },
  vicious_mockery: { name: 'Vicious Mockery', cost: 0, target: 'enemy', kind: 'spell', die: '2d6', debuff: true, desc: 'Cutting words: damage and -2 to the foe\'s next attack (free).' },
  inspire: { name: 'Inspire', cost: 1, target: 'ally', kind: 'heal', heal: '1d8', buff: { attack: 2 }, desc: 'Heal an ally and steel their arm.' },
  song_of_rest: { name: 'Song of Rest', cost: 2, target: 'party', kind: 'heal', heal: '1d6', addStat: true, desc: 'Heal the whole party.' },
};

/* Items. Weapons: dmg die, stat, attack bonus. Armor: base AC + max dex. Trinkets: skill/check bonuses. */
const ITEMS = {
  // weapons
  longsword: { name: 'Longsword', slot: 'weapon', dmg: '1d8', stat: 'str', price: 15 },
  shortsword: { name: 'Shortsword', slot: 'weapon', dmg: '1d6', stat: 'dex', price: 10 },
  dagger: { name: 'Dagger', slot: 'weapon', dmg: '1d4', stat: 'dex', price: 4 },
  mace: { name: 'Mace', slot: 'weapon', dmg: '1d6', stat: 'str', price: 8 },
  longbow: { name: 'Longbow', slot: 'weapon', dmg: '1d8', stat: 'dex', price: 15 },
  rapier: { name: 'Rapier', slot: 'weapon', dmg: '1d8', stat: 'dex', price: 15 },
  greataxe: { name: 'Greataxe', slot: 'weapon', dmg: '1d12', stat: 'str', price: 30 },
  fine_sword: { name: 'Hearthmoor Steel Sword', slot: 'weapon', dmg: '1d8', stat: 'str', attack: 1, damage: 1, price: 45 },
  fine_bow: { name: 'Yew Warbow', slot: 'weapon', dmg: '1d10', stat: 'dex', attack: 1, price: 45 },
  fine_rapier: { name: 'Duelist\'s Rapier', slot: 'weapon', dmg: '1d8', stat: 'dex', attack: 1, damage: 1, price: 45 },
  runed_staff: { name: 'Runed Staff', slot: 'weapon', dmg: '1d6', stat: 'str', spellAttack: 1, spellDamage: 2, price: 50 },
  holy_mace: { name: 'Sunforged Mace', slot: 'weapon', dmg: '1d8', stat: 'str', attack: 1, radiant: true, price: 50 },
  smuggler_cutlass: { name: 'Smuggler\'s Cutlass', slot: 'weapon', dmg: '1d8', stat: 'dex', attack: 1, damage: 2, unique: true },
  barrow_blade: { name: 'Barrow-King\'s Blade', slot: 'weapon', dmg: '1d10', stat: 'str', attack: 2, radiant: true, unique: true },
  florians_axe: { name: 'Florian\'s Axe (Reforged)', slot: 'weapon', dmg: '2d8', stat: 'str', finesse: true, attack: 3, damage: 3, radiant: true, unique: true, desc: 'Whole again. It hums against the Hollow.' },
  // armor
  robes: { name: 'Warding Robes', slot: 'armor', ac: 12, maxDex: 9, price: 2 },
  leather: { name: 'Leather Armor', slot: 'armor', ac: 11, maxDex: 9, price: 10 },
  scalemail: { name: 'Scale Mail', slot: 'armor', ac: 14, maxDex: 2, price: 30 },
  chainmail: { name: 'Chain Mail', slot: 'armor', ac: 16, maxDex: 0, price: 40 },
  studded: { name: 'Studded Leather', slot: 'armor', ac: 12, maxDex: 9, price: 35 },
  breastplate: { name: 'Breastplate', slot: 'armor', ac: 14, maxDex: 2, price: 50 },
  splint: { name: 'Splint Mail', slot: 'armor', ac: 17, maxDex: 0, price: 60 },
  warded_robes: { name: 'Archmage\'s Robes', slot: 'armor', ac: 14, maxDex: 9, price: 40 },
  silver_bow: { name: 'Heartwood Bow', slot: 'weapon', dmg: '1d10', stat: 'dex', attack: 2, damage: 1, radiant: true, unique: true },
  frost_mail: { name: 'Frost-Silver Mail', slot: 'armor', ac: 15, maxDex: 3, unique: true, fireResist: true },
  // trinkets
  rope: { name: 'Rope & Grapple', slot: 'trinket', skills: { athletics: 2 }, price: 8, desc: '+2 Athletics' },
  thieves_tools: { name: 'Thieves\' Tools', slot: 'trinket', skills: { sleight: 2, investigation: 1 }, price: 15, desc: '+2 Sleight, +1 Investigation' },
  lucky_coin: { name: 'Lucky Coin', slot: 'trinket', checks: 1, price: 40, desc: '+1 to every skill check' },
  keeper_amulet: { name: 'Keeper\'s Amulet', slot: 'trinket', ac: 1, skills: { lore: 2 }, unique: true, desc: '+1 AC, +2 Lore' },
  marsh_lantern: { name: 'Nan\'s Marsh-Lantern', slot: 'trinket', skills: { perception: 2, survival: 2 }, unique: true, desc: '+2 Perception & Survival. Reveals hidden paths.' },
  rune_key: { name: 'Dwarven Rune-Key', slot: 'trinket', skills: { lore: 1, arcana: 1 }, unique: true, desc: 'Opens dwarven seals. +1 Lore & Arcana' },
  monk_beads: { name: 'Prayer Beads of the Silent Order', slot: 'trinket', skills: { insight: 2, medicine: 2 }, focus: 1, unique: true, desc: '+2 Insight & Medicine, +1 Focus' },
  // consumables (party pack)
  potion: { name: 'Healing Potion', consumable: true, heal: '2d4+2', price: 12, desc: 'Restores 2d4+2 HP' },
  greater_potion: { name: 'Greater Healing Potion', consumable: true, heal: '4d4+4', price: 30, desc: 'Restores 4d4+4 HP' },
  focus_tonic: { name: 'Focus Tonic', consumable: true, focus: 2, price: 20, desc: 'Restores 2 Focus' },
  smoke_bomb: { name: 'Smoke Bomb', consumable: true, escape: true, price: 18, desc: 'Guaranteed escape from a fleeable battle' },
};

const SHOP_STOCK = ['potion', 'greater_potion', 'focus_tonic', 'smoke_bomb', 'rope', 'thieves_tools', 'lucky_coin',
  'greataxe', 'fine_sword', 'fine_bow', 'fine_rapier', 'runed_staff', 'holy_mace',
  'studded', 'breastplate', 'splint', 'warded_robes'];

/* Enemy templates. hollow: takes double radiant damage. */
const ENEMIES = {
  bog_leech: { name: 'Bog Leech', hp: 7, ac: 10, atk: 3, dmg: '1d4+1', xp: 15 },
  hollow_wolf: { name: 'Hollow Wolf', hp: 11, ac: 12, atk: 4, dmg: '1d6+2', xp: 25, hollow: true, bleeds: true },
  hollowed: { name: 'Hollowed Husk', hp: 14, ac: 10, atk: 3, dmg: '1d8', xp: 30, hollow: true },
  thug: { name: 'Dock Thug', hp: 12, ac: 12, atk: 3, dmg: '1d6+2', xp: 25, canSurrender: true },
  wight: { name: 'Barrow Wight', hp: 20, ac: 13, atk: 4, dmg: '1d8+2', xp: 50, hollow: true },
  warden: { name: 'The Drowned Warden', hp: 40, ac: 13, atk: 5, dmg: '2d6', xp: 140, big: true, phases: [{ line: 'The Warden bellows, and the pool rises with it — black water roars around your knees.', atk: 1 }] },
  cinder_brute: { name: 'Cinder Brute', hp: 40, ac: 13, atk: 5, dmg: '2d6+1', fire: true, xp: 140, big: true, phases: [{ line: 'Cracks split the Cinder Brute\'s slag-skin, and white-hot fire pours out of them. It moves faster now.', atk: 1 }] },
  frost_wyrm: { name: 'Frost Wyrm', hp: 42, ac: 14, atk: 5, dmg: '2d6', xp: 160, sweep: true, big: true, chills: true, phases: [{ line: 'The wyrm shrieks and coils tighter around the bell. Frost spreads across the tower floor in jagged ferns.', atk: 1 }] },
  rot_treant: { name: 'Rot-Treant', hp: 44, ac: 13, atk: 5, dmg: '2d6', xp: 150, hollow: true, big: true, phases: [{ line: 'The Rot-Treant tears a root from the earth and swings it like a club. Grey spores fill the air.', atk: 1 }] },
  court_blade: { name: 'Grey Duelist', hp: 26, ac: 14, atk: 5, dmg: '1d8+2', xp: 120, big: true, bleeds: true, phases: [{ line: '"Not bad," the duelist murmurs, and switches the blade to their other hand. They were holding back.', atk: 1 }] },
  grey_stalker: { name: 'Grey Stalker', hp: 40, ac: 14, atk: 5, dmg: '2d6', xp: 150, hollow: true, big: true, chills: true, phases: [{ line: 'The Grey Stalker\'s limbs lengthen with a sound like cracking ice. The light in the chapel dims.', atk: 1 }] },
  toll_troll: { name: 'Bridge Troll', hp: 36, ac: 12, atk: 5, dmg: '2d6', xp: 110, big: true },
  shade_guard: { name: 'Restless Shade', hp: 16, ac: 12, atk: 4, dmg: '1d8+1', xp: 40, hollow: true },
};

/* The three villains. One is chosen for each run; their identity colors every scene. */
const VILLAINS = {
  morvane: {
    id: 'morvane',
    name: 'Morvane the Ashen',
    short: 'Morvane',
    title: 'the Ashen Sorcerer',
    pronoun: 'he', possessive: 'his', object: 'him',
    look: 'a gaunt sorcerer in smoldering robes, ash drifting from his fingertips like snow',
    motive: 'He claims Florian\'s blood runs in his veins, and that the axe is his birthright — not to seal the Hollow, but to command it.',
    goal: 'reforge the axe in Hollow-fire and make himself its master',
    minion: 'Ash-Sworn cultist', minions: 'Ash-Sworn', minionPlural: 'Ash-Sworn cultists',
    minionStats: { hp: 10, ac: 12, atk: 3, dmg: '1d6+1', xp: 25, canSurrender: true },
    sigil: 'a black flame inside a broken circle',
    lieutenant: { name: 'Sable', title: 'the Ash Knight', he: 'she', his: 'her', him: 'her', desc: 'a knight in soot-blackened plate whose visor glows like a banked coal', hp: 28, ac: 15, atk: 5, dmg: '1d10+2' },
    stronghold: 'the Ashen Spire', strongholdDesc: 'a tower of fused black glass rising from a crater of grey dust',
    boss: { name: 'Morvane the Ashen', hp: 70, ac: 14, atk: 6, dmg: '2d6+2', fire: true, xp: 400 },
    phases: [
      { line: '"You think you can hurt me? I have been burning for thirty years!" Morvane rakes ash from the air and it hardens into soldiers.', summon: 1 },
      { line: 'Morvane\'s robes are on fire now, and so is he. "If I cannot have it," he screams, "NO ONE WILL!" The Hollow pours through him unchecked.', atk: 2, desperate: true },
    ],
    clues: [
      'Morvane was born Morvan Thane — a grandson of the Keepers, cast out as a boy for trying to steal the Keeper\'s Map.',
      'The ash that falls from Morvane is his own body. The Hollow is burning him away from the inside in exchange for its power.',
      'A letter from Morvan\'s mother, never sent: "The axe will not answer a single hand. Florian never swung it alone. That is the secret your grandfather would not tell you."',
    ],
    truthLabel: 'Tell Morvan the axe was never meant for one hand — offer him a place beside you',
    truthSkill: 'persuasion',
    truthWin: 'Morvane\'s hands shake. The ash stops falling. "Morvan," he whispers, tasting the name. "No one has called me that in thirty years." He lowers his staff — and the Hollow, cheated of its vessel, tears itself free of him with a scream.',
    truthLose: 'Morvane\'s face twists. "You sound like them. Like all the Keepers who shut their doors on me." The ash falls thicker. There will be no talking now.',
  },
  abbess: {
    id: 'abbess',
    name: 'the Pale Abbess Seraphine',
    short: 'Seraphine',
    title: 'the Pale Abbess',
    pronoun: 'she', possessive: 'her', object: 'her',
    look: 'a tall woman in grey vestments, her face serene, her eyes the colourless grey of the Hollow',
    motive: 'She preaches that the Hollow is mercy: an end to grief, hunger and pain. She means to destroy the fragments so the seal can never be renewed.',
    goal: 'shatter the fragments beyond mending and let the Hollow\'s "peace" cover the world',
    minion: 'Grey Penitent', minions: 'Grey Penitents', minionPlural: 'Grey Penitents',
    minionStats: { hp: 10, ac: 11, atk: 3, dmg: '1d6+1', xp: 25, canSurrender: true },
    sigil: 'an empty grey circle painted over the eyes',
    lieutenant: { name: 'Brother Hollis', title: 'the Confessor', he: 'he', his: 'his', him: 'him', desc: 'a broad, smiling monk who carries a censer of grey smoke and a flanged iron mace', hp: 28, ac: 14, atk: 5, dmg: '1d10+2' },
    stronghold: 'the Pale Cathedral', strongholdDesc: 'a ruined cathedral whose stained glass has gone the colour of dishwater',
    boss: { name: 'Seraphine, the Pale Abbess', hp: 66, ac: 14, atk: 6, dmg: '2d6+2', heals: true, xp: 400 },
    phases: [
      { line: '"Children," Seraphine calls softly, "come and rest." Grey figures shuffle out of the pews toward you.', summon: 1 },
      { line: 'Seraphine\'s serenity shatters. "Lissa, help me!" she sobs — and something answers from beneath the floor, in a voice that is not a child\'s at all.', atk: 2, desperate: true },
    ],
    clues: [
      'Seraphine was once a healer in the village of Wych Hollow. Plague took everyone she treated — including her daughter, Lissa.',
      'The Hollow speaks to Seraphine in Lissa\'s voice. Her journal records every word. The "daughter" asks her for more and more souls.',
      'Lissa\'s true grave lies in Wych Hollow, untouched by the blight — and on it, carved by Seraphine\'s own hand: "Keep living, Mama." The Hollow\'s voice has been lying to her.',
    ],
    truthLabel: 'Tell Seraphine the voice is not Lissa — it is the Hollow, wearing her grief',
    truthSkill: 'insight',
    truthWin: 'The Abbess staggers as though struck. "Keep living," she breathes. "She wrote that. I wrote that, for her." Grey tears run down her face — and the Hollow, losing its grip, howls out of her in a storm of ash.',
    truthLose: '"Liar!" Seraphine\'s serenity cracks into fury. "She speaks to me every night. You would take her from me twice?" There will be no talking now.',
  },
  kharsk: {
    id: 'kharsk',
    name: 'Warlord Kharsk Ironjaw',
    short: 'Kharsk',
    title: 'the Iron Warlord',
    pronoun: 'he', possessive: 'his', object: 'him',
    look: 'a towering warlord with a jaw of riveted iron and a cloak of wolf-pelts',
    motive: 'His clan\'s lands are dying. He has struck a pact: deliver the axe, and the Hollow will spare his people while it devours everyone else.',
    goal: 'deliver the axe to the Hollow so his clan alone is spared',
    minion: 'Ironjaw raider', minions: 'Ironjaw raiders', minionPlural: 'Ironjaw raiders',
    minionStats: { hp: 12, ac: 12, atk: 4, dmg: '1d8', xp: 28, canSurrender: true },
    sigil: 'a red iron jaw on a black field',
    lieutenant: { name: 'Grutha', title: 'Bonebreaker', he: 'she', his: 'her', him: 'her', desc: 'a scarred shield-maiden with a maul as long as she is tall', hp: 30, ac: 14, atk: 5, dmg: '1d12+2' },
    stronghold: 'the Iron Camp at Blackscar', strongholdDesc: 'a palisade of sharpened black logs around a hill of war-tents',
    boss: { name: 'Kharsk Ironjaw', hp: 74, ac: 15, atk: 6, dmg: '2d8+1', xp: 400 },
    phases: [
      { line: 'Kharsk spits blood through his iron jaw and roars for his guard. "IRONJAW! TO ME!"', summon: 1 },
      { line: '"For my son," Kharsk growls, and the grey light of the pact floods his eyes. He stops defending himself entirely.', atk: 2, desperate: true },
    ],
    clues: [
      'The Ironjaw clan is starving. Kharsk\'s raiders send every coin and crust they seize back north to the clan-holds.',
      'The pact is a lie. Scouts\' letters report the Hollow already creeping into the Ironjaw homeland, despite the bargain.',
      'Kharsk\'s own son, Dorn, has been hollowed. Kharsk keeps him chained in his tent, telling no one, praying the pact will cure him.',
    ],
    truthLabel: 'Show Kharsk the proof: the Hollow lied, and his homeland is already dying',
    truthSkill: 'persuasion',
    truthWin: 'Kharsk reads the scouts\' letters twice, then crushes them in his iron fist. "It took my son," he growls, "and it smiled while it bargained." He turns his great axe away from you — toward the grey thing now crawling out of the earth behind him.',
    truthLose: 'Kharsk tears the letters in half. "Forgeries. Lies from soft southern tongues." He hefts his axe. There will be no talking now.',
  },
};

/* Fragments of Florian's Axe. Assigned randomly to three regions each run. */
const FRAGMENTS = {
  head: { name: 'the Axe-Head', short: 'Head', desc: 'a crescent of star-pale dwarven steel, still sharp after a century' },
  haft: { name: 'the Heartwood Haft', short: 'Haft', desc: 'a length of dark oak, warm to the touch, carved with Florian\'s oath' },
  rune: { name: 'the Binding Rune', short: 'Rune', desc: 'a pommel-stone of blue crystal with a sigil that pulses like a heartbeat' },
};

const XP_TABLE = [0, 60, 150, 280, 440, 640, 880, 1200];
const MAX_LEVEL = 8;

/* Lasting injuries. fx feeds combat numbers; checks are penalties to skills/stats ('all' = every check). */
const INJURIES = {
  broken_arm: { name: 'Broken Arm', desc: '−1 attack, −2 Athletics', fx: { attack: -1 }, checks: { athletics: -2 } },
  cracked_ribs: { name: 'Cracked Ribs', desc: '−6 max HP', fx: { hp: -6 }, checks: {} },
  concussion: { name: 'Concussion', desc: '−2 to Intelligence and Wisdom checks', fx: {}, checks: { int: -2, wis: -2 } },
  twisted_ankle: { name: 'Twisted Ankle', desc: '−1 AC, −2 to Dexterity checks', fx: { ac: -1 }, checks: { dex: -2 } },
  burned_hands: { name: 'Burned Hands', desc: '−1 damage, −2 Sleight of Hand', fx: { damage: -1 }, checks: { sleight: -2 } },
  hollow_bite: { name: 'Hollow-Bite', desc: '−1 to every check; the grey itches at you', fx: {}, checks: { all: -1 } },
  scarred_face: { name: 'Fresh Scar', desc: '−2 Persuasion, +2 Intimidation', fx: {}, checks: { persuasion: -2, intimidation: 2 } },
};

/* The Hollow's gift — available to anyone with Corruption 3+. */
ABILITIES.grey_fire = { name: 'Grey Fire', cost: 0, target: 'enemy', kind: 'spell', die: '3d8', autoHit: true, corrupting: true, desc: 'The Hollow burns through you: 3d8, never misses. +1 Corruption.' };

const DIFFICULTIES = {
  story: { name: 'Story', desc: 'Gentler battles. For players who are here for the tale.', hp: 0.75, atk: -1 },
  normal: { name: 'Adventurer', desc: 'The intended challenge. Defeat bends the story but rarely ends it.', hp: 1, atk: 0 },
  hardcore: { name: 'Hardcore', desc: 'Permadeath. Heroes left dying after a battle may not wake. Lose any battle and the tale ends.', hp: 1.1, atk: 0, permadeath: true },
};
