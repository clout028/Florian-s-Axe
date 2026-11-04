/* ===========================================================
   REGION: WYCH HOLLOW — the Dead Village
   The first village the Hollow ever took, a century ago, where Florian
   struck its heart. The grey is still thick here: every step risks
   Corruption (the "exposure" checks).
   Key flags: wych_children, wych_lantern, wych_exposure
   =========================================================== */

/* Each deeper step into Wych Hollow: resist the grey, or let it in. */
function exposure(c, dc) {
  const r = Dice.d(20) + Character.checkBonus(c, 'con').total + (hasItem('monk_beads') ? 2 : 0);
  if (r >= dc) { note(`${c.name} resists the grey (CON ${r} vs ${dc})`, 'good'); return true; }
  corrupt(c, 1);
  return false;
}

SCENES.wych_start = {
  title: 'Wych Hollow',
  first: s => { G.party.forEach(c => exposure(c, 10)); },
  text: s => P(
    raidLine('wych'),
    twistLine('wych'),
    `Wych Hollow was the first village the Hollow ever took, a hundred years ago. It is still there. The cottages stand with their doors open. Washing still hangs on the lines, grey and stiff as paper. There is no wind, no birdsong, no colour at all. Your own breath sounds too loud.`,
    `This is where Florian struck the Hollow's heart. The Keepers left <b>${regionFrag('wych').name}</b> in the old chapel at the village's centre, reasoning that nobody would ever be mad enough to go and fetch it.`,
    G.villain === 'abbess' && `And this, you realise, is where Seraphine came from. Her village. Her daughter's grave is somewhere here.`,
    `Every breath here tastes of ash. The longer you stay, the deeper the grey will get into you.`
  ),
  choices: s => [
    { label: 'Go straight for the chapel', next: 'wych_square' },
    {
      label: 'Search the cottages for anything useful',
      check: { skill: 'investigation', dc: 12 },
      success: { effects: () => { flag('wych_lantern'); addPack('potion'); }, text: (s, c) => P(`In a cottage cellar, ${c.char.name} finds a Keeper's lantern, still full of oil — and a little blue flame catches on the first try. Where its light falls, the grey retreats an inch. There is also a healing draught, a century old and somehow still good.`), next: 'wych_square' },
      failure: { effects: () => G.party.forEach(c => exposure(c, 12)), text: P(`You search for an hour and find nothing but dust that settles in your lungs.`), next: 'wych_square' },
    },
  ],
};

SCENES.wych_square = {
  title: 'The Village Square',
  first: s => { G.party.forEach(c => exposure(c, has('wych_lantern') ? 9 : 12)); },
  text: s => P(
    `In the village square, around the dry fountain, stand a dozen children. Grey, motionless, perfectly still, holding hands in a ring as though they were in the middle of a game when the Hollow came. They have been standing there for a hundred years.`,
    `As you pass, one of them turns its head and looks at you.`,
    `"Are you here to play?" it asks, in a voice like dry leaves.`
  ),
  choices: s => [
    {
      label: '"Yes. What game are you playing?"',
      check: { skill: 'insight', dc: 13 },
      success: {
        effects: () => { flag('wych_children'); giveXp(60); G._clue = addClue(); },
        text: (s, c) => { const cl = G._clue; G._clue = null; return P(`${c.char.name} kneels to the grey child's height. It's a counting game, the child explains — they count, and when they reach a hundred, someone comes to take them home. "We counted," it says. "It's been a hundred. Are you the someone?"`, `${c.char.name} says yes. The ring of children lets go of each other's hands for the first time in a century, and one by one, they crumble into soft white ash that blows away on a wind that wasn't there before. The last one whispers something as it goes:`, cl ? `<b>${cl}</b>` : `"Thank you."`); },
        next: 'wych_chapel',
      },
      failure: { effects: () => G.party.forEach(c => exposure(c, 13)), text: P(`You try to play along. But the game changes as you play, and you realise too late that it was never a game — it was a doorway. You stumble out of the ring with grey in your mouth.`), next: 'wych_chapel' },
    },
    {
      label: 'Hold up the Keeper\'s lantern',
      req: () => has('wych_lantern'),
      effects: () => { flag('wych_children'); },
      text: P(`The little blue flame shines on the ring of children. They blink, as though waking, and look up at the light with something like wonder. Then, one by one, they let go of each other's hands and drift apart into soft white ash. It is the gentlest thing you have ever seen.`),
      next: 'wych_chapel',
    },
    { label: 'Walk past quickly without answering', effects: () => flag('wych_ignored'), text: P(`You don't look back. Behind you, small voices start counting again from one.`), next: 'wych_chapel' },
  ],
};

SCENES.wych_chapel = {
  title: 'The Chapel of the Last Stand',
  first: s => { G.party.forEach(c => exposure(c, has('wych_lantern') ? 10 : 13)); },
  text: s => P(
    `The chapel roof is gone. In its place, the sky is a flat white disc. On the altar, set into a groove where Florian once drove his axe into the stone, lies ${regionFrag('wych').name}.`,
    `Between you and it, the floor is cracked — and something is rising out of the crack. Not a beast. A memory of one: a <b>Grey Stalker</b>, a thing of ash and long limbs that the Hollow left behind to guard its old wound.`,
    has('wych_children') && `As it rises, you hear — very faint — a dozen children counting, encouraging you. <i>One, two, three…</i>`
  ),
  choices: s => [
    {
      label: 'Fight it',
      combat: {
        enemies: s => [foe('grey_stalker')].concat(solo() ? [] : [foe('hollowed', { name: 'Ash-Husk' })]),
        actions: s => battleActions('keeper_lantern', 'fragment_light'),
        win: { text: s => P(`The Grey Stalker comes apart like a struck cobweb. You lift ${regionFrag('wych').name} from the altar groove.`), next: 'wych_win' },
        flee: { text: P(`You run from the chapel, through the dead village, and do not stop until you see colour again.`), next: 'wych_lost' },
        lose: { text: P(`You wake at the village's edge with no memory of how you got there. The chapel is behind you. So, still, is the fragment — and something else is coming to claim it.`), next: 'wych_lost' },
      },
    },
    {
      label: 'Run past it, grab the fragment and run out',
      check: { skill: 'acrobatics', dc: 15, mods: () => [has('wych_children') && { label: 'The children count for you', value: 2 }] },
      success: { text: (s, c) => P(`${c.char.name} sprints between the Stalker's legs, snatches the fragment off the altar and keeps running. The thing's long fingers rake the air an inch behind them.`), next: 'wych_win' },
      failure: { effects: (s, c) => { hurt(c.char, '2d6'); exposure(c.char, 14); }, text: (s, c) => P(`The Stalker's hand closes around ${c.char.name} and they feel the grey pour into them. They tear free — but the thing is between you and the door now.`), next: 'wych_stalker' },
    },
    hollowOption('Kneel, and let the Hollow see you as its own', s => P(`${mostCorrupt().name} kneels in the dust and lets the grey look at them. The Stalker tilts its head — then, slowly, steps aside, like a servant. You take the fragment. It is very cold.`), 'wych_win', 2),
  ],
};

SCENES.wych_stalker = {
  title: 'The Grey Stalker',
  text: P(`It unfolds to its full height, ash streaming from its limbs.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      enemies: s => [foe('grey_stalker')],
      actions: s => battleActions('keeper_lantern'),
      win: { text: s => P(`The Stalker falls apart. You take ${regionFrag('wych').name} from the altar.`), next: 'wych_win' },
      flee: { text: P(`You flee the dead village.`), next: 'wych_lost' },
      lose: { text: P(`You wake at the village's edge, grey to the bone, empty-handed.`), next: 'wych_lost' },
    },
  }],
};

SCENES.wych_win = {
  title: 'Recovered',
  first: s => { gainFragment('wych'); if (G.villain === 'abbess' && !G.clues.includes(V().clues[2])) { G.clues.push(V().clues[2]); note('Secret learned about ' + V().short, 'clue'); } if (has('wych_children')) chronicle('Released the lost children of Wych Hollow after a hundred years.'); },
  text: s => P(
    `<b>${regionFrag('wych').name}</b> — ${regionFrag('wych').desc}. As you carry it out of the chapel, a single blade of green grass pushes up through the dust at the door.`,
    G.villain === 'abbess' && `On your way out, you pass a small grave under a yew tree, the only green thing in the village. The stone reads: <i>Lissa. Keep living, Mama.</i>`,
    G.villain === 'abbess' && `<i>(You have learned the truth about Seraphine's daughter.)</i>`,
    has('wych_ignored') && `Behind you, faintly, children are still counting.`
  ),
  choices: [{ label: 'Leave the dead village', next: 'wych_end' }],
};

SCENES.wych_lost = {
  title: 'The Grey Keeps Its Own',
  first: s => { loseFragment('wych'); doom(1); },
  text: s => P(`Days later, ${V().minionPlural} — who do not seem to fear the grey at all — walk into Wych Hollow and walk out again with ${regionFrag('wych').name}. You watch them go from the ridge, too far away to stop them.`),
  choices: [{ label: 'Leave', next: 'wych_end' }],
};

SCENES.wych_end = {
  title: 'Colour Again',
  first: s => finishRegion('wych'),
  text: P(`When you crest the ridge and see a green field again, one of you laughs out loud for no reason at all.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
