/* ===========================================================
   REGION: FROSTHOLLOW PEAK — the Silent Bell
   Key flags: abbot_cured, peak_bell_secret, monks ally, monks_lost
   =========================================================== */

SCENES.peak_start = {
  title: 'Frosthollow Peak',
  text: s => P(
    raidLine('peak'),
    `The Monastery of the Silent Order sits on the very summit of Frosthollow Peak. For a hundred years, its great bell has rung once every dawn — the monks say it rings to remind the Hollow that someone is still awake.`,
    `Three days ago, it stopped. The villagers in the valley below haven't dared climb up to find out why.`,
    `The Keepers' records are clear on one thing: <b>${regionFrag('peak').name}</b> was set into the bell itself. A blizzard is closing on the peak. There are two ways up.`
  ),
  choices: s => [
    {
      label: 'Take the long pilgrim stair', hint: 'Safe, but slow',
      effects: () => doom(1),
      text: P(`Four thousand steps, carved into the mountain by pilgrims. It takes a full day and a night, and your legs are shaking by the end, but you arrive whole.`),
      next: 'peak_gate',
    },
    {
      label: 'Climb the ice-face directly',
      check: { skill: 'athletics', dc: 14 },
      success: { text: (s, c) => P(`${c.char.name} leads the climb, cutting handholds in the blue ice. You haul yourselves over the lip of the summit as the blizzard hits.`), next: 'peak_gate' },
      failure: { effects: () => hurtAll('1d6'), text: (s, c) => P(`An overhang gives way under ${c.char.name}. You dangle over the drop until frozen fingers find a hold. You reach the top bruised, half-frozen and late.`), next: 'peak_gate' },
    },
    {
      label: '[Ranger] Find the goat-track',
      req: () => hasClass('ranger'),
      text: s => P(`${classChar('ranger').name} spots the faint line of droppings and scuffed rock that marks a mountain-goat track. It winds up the shoulder of the peak, sheltered from the wind. You reach the summit by afternoon, warm and quick.`),
      next: 'peak_gate',
    },
  ],
};

SCENES.peak_gate = {
  title: 'The Silent Monastery',
  text: s => P(
    `The monastery gate stands open, snow drifting into the courtyard. Monks in grey robes move silently through the yard — sweeping, carrying water, tending fires — but their eyes are the flat, colourless grey of the Hollow, and they do not look at you.`,
    `A sweet, rotten smell hangs over everything. From the refectory comes the sound of laughter and a thread of grey smoke: incense. And from the bell tower above, a low, rumbling growl. Something huge is curled around the bell. Something with scales.`,
    `In the chapel doorway, a wizened old monk in chains is beckoning to you urgently. His eyes are only half-grey.`
  ),
  choices: s => [
    { label: 'Go to the chained monk', next: 'peak_abbot' },
    { label: 'Climb straight to the bell tower', next: 'peak_tower' },
  ],
};

SCENES.peak_abbot = {
  title: 'Abbot Ilvar',
  text: s => P(
    has('abbot_cured')
      ? `Abbot Ilvar sits on the chapel steps, clear-eyed now, wrapped in a blanket.`
      : `"Abbot Ilvar," the old monk rasps. "I chained myself, before the smoke took my mind entirely." His voice is thin and slurred. "${V().minionPlural}. They came with Hollow-incense and burned it in the refectory, and my brothers… went grey. They meant to make us hand over the bell. Then the wyrm came, drawn to the fragment's power, and drove even them away from the tower. Now they wait in the refectory, burning more incense, for the wyrm to leave."`,
    !has('monks_freed') && !has('monks_lost') && `"Destroy the censers," he begs, "and my brothers may wake."`
  ),
  choices: s => [
    {
      label: 'Tend to the Abbot\'s Hollow-sickness',
      req: () => !has('abbot_cured'), once: 'abbot_heal',
      check: { skill: 'medicine', dc: 14, mods: () => [hasClass('cleric') && { label: 'Cleric\'s prayers', value: 2 }] },
      success: {
        effects: () => { flag('abbot_cured'); flag('peak_bell_secret'); G._clue = addClue(); },
        text: (s, c) => { const cl = G._clue; G._clue = null; return P(`${c.char.name} burns away the grey with snow-water and prayer. The Abbot's eyes clear. He grips their hand. "Listen. The wyrm hates the bell's true note — that's why it smothers the bell with its body. Pull the third rope, not the great one, and it will flee." He hesitates. "And there is something else. Before the smoke took me, I heard the cultists talking."`, cl && `<b>${cl}</b>`); },
        next: 'peak_abbot',
      },
      failure: { text: (s, c) => P(`${c.char.name} does what they can, but the grey runs too deep. The old monk slumps, murmuring. You'll get no more from him until the incense is gone.`), next: 'peak_abbot' },
    },
    {
      label: 'Storm the refectory and smash the censers',
      req: () => !has('monks_freed') && !has('monks_lost'),
      combat: {
        intro: s => `The ${V().minionPlural} leap up from their meal, knocking over censers of grey smoke.`,
        actions: s => battleActions('censers'),
        enemies: s => { const l = [minion(), minion()]; if (!solo()) l.push(minion()); return l; },
        win: {
          effects: () => { flag('monks_freed'); addAlly('monks', 'the monks of the Silent Order'); addGear('monk_beads'); },
          text: P(`You stamp out the last censer. All through the monastery, monks stop where they stand, blinking, as the grey drains from their eyes. One by one, they come to the refectory door and bow to you, wordless. A young monk presses a string of prayer beads into your hands — and they all look up at the bell tower.`),
          next: 'peak_tower',
        },
        flee: { effects: () => { flag('monks_lost'); doom(1); }, text: P(`You retreat into the snow. Behind you, the cultists stoke the incense higher, and the monks sink deeper into the grey.`), next: 'peak_tower' },
        lose: { effects: () => { flag('monks_lost'); doom(1); }, text: P(`You're thrown out into the snow, bloody. When you stagger back, the refectory is barred and thick with smoke. The monks will not be waking.`), next: 'peak_tower' },
      },
    },
    { label: 'Go up to the bell tower', next: 'peak_tower' },
  ],
};

SCENES.peak_tower = {
  title: 'The Bell Tower',
  text: s => P(
    `The bell tower is open to the storm. The great bronze bell hangs in the centre — and coiled around it, blue-white and glittering with frost, is a <b>Frost Wyrm</b>. It is smothering the bell with its body. In the bell's mouth, set into the iron clapper, you see the glint of ${regionFrag('peak').name}.`,
    `Three bell-ropes hang down beside the stair: one thick as a man's arm, two thinner. Below them hangs a frame of four small chanting-bells.`,
    (has('abbot_cured') || hasAlly('monks')) && `The monks taught you the chant the small bells ring each dawn. Played right, the great bell will answer it.`,
    has('peak_bell_secret') && `<i>The third rope, not the great one</i>, the Abbot said.`,
    hasAlly('monks') && `The monks of the Silent Order have followed you up the stair, silent, holding staves.`,
    `The wyrm opens one pale eye and looks at you.`
  ),
  choices: s => [
    hollowOption('Speak to the wyrm in the tongue of the Hollow',
      s => P(`${mostCorrupt().name} hisses something no human throat should be able to make. The wyrm's pale eyes go wide — it knows that voice. It uncoils from the bell and flees into the storm without a backward glance.`, `As you pry the fragment loose, you realise the monks on the stair have gone silent and drawn back from you.`),
      'peak_win', 1, () => flag('monks_fear')),
    {
      label: 'Fight the wyrm',
      combat: {
        actions: s => battleActions('ring_bell'),
        enemies: s => [foe('frost_wyrm')],
        allyStrikes: s => hasAlly('monks') ? [{ name: 'The monks', verb: 'strike with their staves at', dmg: '1d6+2' }] : [],
        win: { text: s => P(`The Frost Wyrm topples off the tower with a shriek and vanishes into the storm. You climb into the bell and pry ${regionFrag('peak').name} out of the clapper.`), next: 'peak_win' },
        flee: { text: P(`You retreat down the stair. Above, the wyrm settles back around the bell, and a few hours later, it takes wing, carrying the clapper in its claws.`), next: 'peak_lost' },
        lose: { text: P(`The wyrm's frozen breath hurls you down the stair. When you wake, it is gone — and so is the clapper, torn out and carried off in its claws toward the north, where ${V().short}'s hunters wait.`), next: 'peak_lost' },
      },
    },
    {
      label: 'Ring the monks\' chant on the small bells', hint: '🧩 Sequence — listen, then repeat the pattern',
      req: () => has('abbot_cured') || hasAlly('monks'), showLocked: true,
      puzzle: { type: 'bells', key: 'peak_bells', listens: hasAlly('monks') ? 2 : 1 },
      solved: { effects: () => giveXp(40), text: P(`The last note rings out — and the great bell, struck in sympathy, answers it with a single pure, enormous tone that rolls out over the mountains. The wyrm screams as though burned and flings itself off the tower into the storm.`), next: 'peak_win' },
      failed: { effects: () => hurtAll('1d6'), text: P(`A sour note. The bells clash, and the wyrm uncoils with a hiss of frozen fury.`), next: 'peak_wyrm_fight' },
    },
    {
      label: 'Haul on a bell-rope to ring the true note',
      check: { skill: 'athletics', dc: s => has('peak_bell_secret') ? 11 : 16 },
      success: {
        effects: () => giveXp(70),
        text: (s, c) => P(`${c.char.name} ${has('peak_bell_secret') ? 'seizes the third rope, as the Abbot told you,' : 'throws their weight on a rope at random'} and heaves. The bell swings under the wyrm's coils and rings out — a single pure, enormous note that rolls out over the mountains.`,
          `The wyrm screams as though burned. It uncoils in a frenzy and flings itself off the tower into the storm. The note goes on and on. In the valley far below, you imagine, people are looking up.`),
        next: 'peak_win',
      },
      failure: { effects: (s, c) => hurt(c.char, '1d8'), text: (s, c) => P(`${c.char.name} hauls on the rope. It's the wrong one: the bell gives a dull, cracked clank and the wyrm, enraged, lashes out with its tail.`), next: 'peak_wyrm_fight' },
    },
    {
      label: 'Creep up while it dozes and pry the fragment loose',
      check: { skill: 'stealth', dc: 15 },
      success: { effects: () => giveXp(50), text: (s, c) => P(`${c.char.name} climbs into the bell's mouth, inches from the wyrm's frozen breath, and works the fragment free of the clapper with a dagger. The wyrm sighs in its sleep. You leave it there.`), next: 'peak_win' },
      failure: { text: (s, c) => P(`${c.char.name}'s boot scrapes on the bronze. The wyrm's eye snaps fully open.`), next: 'peak_wyrm_fight' },
    },
  ],
};

SCENES.peak_wyrm_fight = {
  title: 'The Wyrm Wakes',
  text: P(`The Frost Wyrm uncoils from the bell with a hiss like a glacier cracking.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('ring_bell'),
      enemies: s => [foe('frost_wyrm')],
      allyStrikes: s => hasAlly('monks') ? [{ name: 'The monks', verb: 'strike with their staves at', dmg: '1d6+2' }] : [],
      win: { text: s => P(`The wyrm falls from the tower into the storm. You pry ${regionFrag('peak').name} out of the clapper with numb fingers.`), next: 'peak_win' },
      flee: { text: P(`You retreat. Hours later, the wyrm takes wing, the bell's clapper in its claws.`), next: 'peak_lost' },
      lose: { text: s => P(`The wyrm's breath hurls you down the stair. When you wake, it is gone — and so is the clapper, carried north toward ${V().short}'s hunters.`), next: 'peak_lost' },
    },
  }],
};

SCENES.peak_win = {
  title: 'Recovered',
  first: s => { gainFragment('peak'); flag('bell_rang'); if (has('monks_fear') && hasAlly('monks')) { loseAlly('monks'); note('The monks will not follow one who speaks with the Hollow\'s voice.', 'bad'); } },
  text: s => P(
    `<b>${regionFrag('peak').name}</b> — ${regionFrag('peak').desc} — is cold as the mountain in your hands, then slowly warms.`,
    has('monks_fear') ? `The monks do not ring the bell for you. Abbot Ilvar meets you at the gate and will not take your hand. "We will pray for you," he says, and it does not sound like comfort.` : hasAlly('monks') ? `The monks ring the great bell for you as you leave — properly, the true note, the way it has rung every dawn for a hundred years. Abbot Ilvar walks you to the gate. "When you face the darkness," he says, "the Silent Order will break its silence. We will come."` : has('monks_lost') ? `Behind you, the grey monks go on sweeping the courtyard, seeing nothing. You could not save them.` : `The grey-eyed monks still move silently through the courtyard. Whether they will wake, you cannot say.`
  ),
  choices: [{ label: 'Descend the mountain', next: 'peak_end' }],
};

SCENES.peak_lost = {
  title: 'The Empty Bell',
  first: s => { loseFragment('peak'); doom(1); },
  text: s => P(`The bell hangs empty and silent, its clapper gone. ${regionFrag('peak').name} is on its way to ${V().short}. For the first time in a hundred years, there will be no dawn bell on Frosthollow.`),
  choices: [{ label: 'Descend the mountain', next: 'peak_end' }],
};

SCENES.peak_end = {
  title: 'The Long Descent',
  first: s => { finishRegion('peak'); if (has('monks_freed')) chronicle('Freed the monks of the Silent Order from the Hollow-incense.'); },
  text: P(`The storm has blown itself out. You pick your way down the mountain in thin, bright sunlight.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
