/* ===========================================================
   REGION: THE EMBERDEEP MINES — the Deep Forge
   Key flags: mines_promise, mines_greedy, mines_alerted, miners ally,
   miners_died, miners_some_died, broke_promise, mines_captured
   =========================================================== */

const minesForgeCount = () => (solo() ? 1 : 2) + (G.doom >= 5 ? 1 : 0) - (hasAlly('miners') ? 1 : 0);

SCENES.mines_start = {
  title: 'Emberdeep',
  text: s => P(
    raidLine('mines'),
    `Emberdeep clings to the side of the mountain, a town of stone halls and soot-black chimneys. Every chimney is cold. The great gates to the mine are barred from the inside, and a dwarf with a singed beard and a bandaged arm stands guard on the wrong side of them.`,
    `"Brannoc Ashbeard, foreman," he grunts. "If you've come for work, there's none." When you show him the Keeper's Map, his face changes. "So it's true. You're after what we keep in the Deep Forge."`,
    `The story comes out in a rush. Three days ago ${V().minionPlural} seized the lower mine and forced the night shift to dig toward the old vault where Emberdeep's clans have guarded <b>${regionFrag('mines').name}</b> for a century. Yesterday the tunnel collapsed. "Twenty of my miners are trapped down there," Brannoc says. "Alive, last we heard them tapping. The cultists didn't even slow down."`
  ),
  choices: s => [
    {
      label: 'Promise to bring the miners home',
      effects: () => flag('mines_promise'),
      text: P(`Brannoc grips your forearm. "Then you'll want the old ventilation shaft. It comes out near the collapse, behind their guards." He draws you a map on the back of a wage-slip.`),
      next: 'mines_shaft',
    },
    {
      label: '[Dwarf] Swear an oath on the clan-stone',
      req: () => hasRace('dwarf'),
      effects: () => { flag('mines_promise'); addGear('rune_key'); },
      text: s => P(`${raceChar('dwarf').name} lays a hand on the clan-stone by the gate and speaks the old oath in the deep tongue. Brannoc's eyes shine. "Kin," he says roughly, and presses an iron key etched with runes into their hand. "The vault-key. My grandfather's grandfather's. The seal will open for this and nothing else — and the old flood-sluices too, if you know the runes." He sends you to the ventilation shaft.`),
      next: 'mines_shaft',
    },
    {
      label: 'Demand payment up front',
      check: { skill: 'persuasion', dc: 12 },
      success: { effects: () => { addGold(25); flag('mines_greedy'); }, text: (s, c) => P(`Brannoc stares at ${c.char.name}, then counts out twenty-five gold from a strongbox with shaking hands. "Mercenaries," he mutters. "Fine. The ventilation shaft. Go."`), next: 'mines_shaft' },
      failure: { effects: () => flag('mines_greedy'), text: P(`Brannoc spits at your feet. "Twenty of my people are dying in the dark, and you want coin?" He tells you where the ventilation shaft is anyway — then turns his back on you.`), next: 'mines_shaft' },
    },
    {
      label: 'Take the main lift straight down',
      text: P(`"Your funeral," Brannoc says, and unbars the gate. The main lift is a great iron cage on a chain. It groans as it descends into the red-lit dark. At the bottom, torches — and voices.`),
      next: 'mines_lift',
    },
  ],
};

SCENES.mines_shaft = {
  title: 'The Ventilation Shaft',
  text: P(`The shaft is a black chimney, barely wide enough for armour, dropping hundreds of feet into warm, sulphur-smelling air. Ancient iron rungs are hammered into the rock, half of them rusted through.`),
  choices: s => [
    {
      label: 'Climb down',
      check: { skill: 'athletics', dc: 13 },
      success: { text: (s, c) => P(`${c.char.name} tests every rung and finds the sound ones. You reach the bottom silent and unseen, in a side tunnel near the collapse.`), next: 'mines_junction' },
      failure: {
        effects: (s, c) => { hurt(c.char, '2d6'); flag('mines_alerted'); },
        text: (s, c) => P(`A rung snaps. ${c.char.name} drops the last twenty feet onto a heap of slag with a crash that echoes through the whole mountain. Somewhere below, someone shouts. They know you're here.`),
        next: 'mines_junction',
      },
    },
  ],
};

SCENES.mines_lift = {
  title: 'The Lift Guards',
  text: s => P(`Two ${V().minionPlural} are waiting at the bottom of the lift, crossbows raised. "Brannoc sent more fools," one laughs.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      enemies: s => [minion(), minion()],
      fleeable: false,
      win: { effects: () => flag('mines_alerted'), text: P(`The lift guards are down, but the noise has carried. Deeper in, you hear boots running.`), next: 'mines_junction' },
      lose: { effects: () => flag('mines_captured'), text: P(`A crossbow-butt to the head. Darkness.`), next: 'mines_captive' },
    },
  }],
};

SCENES.mines_captive = {
  title: 'In Chains',
  text: s => P(
    `You wake to the clink of chains and the smell of sweat. You're shackled in a rough-hewn gallery among a dozen soot-streaked dwarves — survivors of the collapse, dragged out only to be put back to work. A single cultist with a whip dozes on a crate by the tunnel mouth.`,
    `"You came down here for us?" an old miner whispers. "Then you're even madder than Brannoc."`
  ),
  choices: s => [
    {
      label: 'Wrench the chains out of the rock',
      check: { skill: 'athletics', dc: 14 },
      success: { effects: () => addAlly('miners', 'the miners of Emberdeep'), text: (s, c) => P(`${c.char.name} braces against the wall and heaves until the bolt tears free of the stone. The guard wakes up just in time to be buried under a dozen furious dwarves. The miners are free — and they want blood.`), next: 'mines_forge' },
      failure: { effects: (s, c) => { hurt(c.char, '1d6'); flag('miners_died'); doom(1); }, text: (s, c) => P(`The bolt won't move. The guard wakes and lays into ${c.char.name} with the whip. Hours pass. When a tremor finally cracks the wall and loosens your chain, you slip away in the dust — but the guards herd the miners deeper, and you can't follow.`), next: 'mines_forge' },
    },
    {
      label: 'Pick the lock with a hidden pin',
      check: { skill: 'sleight', dc: 13 },
      success: { effects: () => addAlly('miners', 'the miners of Emberdeep'), text: (s, c) => P(`${c.char.name} works a bent pin into the lock and opens it with a click. Then the next. Then the next. When the guard finally stirs, he's surrounded by unchained dwarves holding pickaxes.`), next: 'mines_forge' },
      failure: { effects: (s, c) => { hurt(c.char, '1d6'); flag('miners_died'); doom(1); }, text: (s, c) => P(`The pin snaps in the lock. The guard notices and beats ${c.char.name} senseless. When you finally break free in the confusion of a tremor, the miners have been herded away deeper into the mountain.`), next: 'mines_forge' },
    },
    {
      label: 'Whisper a plan to the miners and lead an uprising',
      check: { skill: 'persuasion', dc: 12 },
      success: { effects: () => addAlly('miners', 'the miners of Emberdeep'), text: (s, c) => P(`${c.char.name} whispers to each miner in turn. At the signal, they all yank their chains at once and the rotten support beam they're bolted to splits in half. The guard never stands a chance. "Now," says the old miner, hefting a pick, "let's go and get our forge back."`), next: 'mines_forge' },
      failure: { effects: () => { flag('miners_died'); doom(1); }, text: P(`The miners are too frightened. One of them panics and calls out to the guard, hoping for mercy. You're beaten again — and hours later, in the confusion of a tremor, you slip away alone. The miners are herded deeper.`), next: 'mines_forge' },
    },
  ],
};

SCENES.mines_junction = {
  vote: true,
  title: 'The Collapse',
  text: s => P(
    `The tunnel forks. To the left, a wall of fallen rock, and behind it, faint and regular: <i>tap… tap… tap.</i> The trapped miners — still alive. To the right, the passage slopes down toward a red glow and the clang of hammers on stone. The Deep Forge. The cultists are close to breaking the vault.`,
    has('mines_alerted') && `And now they know you're here.`,
    `Digging the miners out will take time. Time the cultists will use.`
  ),
  choices: s => [
    {
      label: 'Dig the miners out first',
      check: { skill: 'athletics', dc: 14, mods: () => [hasRace('dwarf') && { label: 'Dwarven stonecraft', value: 2 }] },
      success: { effects: () => { addAlly('miners', 'the miners of Emberdeep'); doom(1); }, text: (s, c) => P(`${c.char.name} finds the keystone of the rockfall and levers it free. The pile collapses outward and twenty filthy, gasping dwarves stumble out into the lantern-light. It took hours. But every one of them is alive, and every one of them picks up a tool and follows you toward the forge.`), next: 'mines_forge' },
      failure: { effects: (s, c) => { hurt(c.char, '2d6'); addAlly('miners', 'the miners of Emberdeep'); flag('miners_some_died'); doom(1); }, text: (s, c) => P(`You pull the wrong stone. The ceiling groans and comes down, and ${c.char.name} is half-buried. When you've dug yourselves and the miners free, four of them are dead under the rock. The survivors don't blame you. They pick up their tools and follow you toward the forge with grim faces.`), next: 'mines_forge' },
    },
    {
      label: '[Arcana] Shatter the rockfall carefully with magic',
      req: () => G.party.some(c => ['mage', 'cleric', 'bard'].includes(c.cls)),
      check: { skill: 'arcana', dc: 13 },
      success: { effects: () => { addAlly('miners', 'the miners of Emberdeep'); }, text: (s, c) => P(`${c.char.name} lays both hands on the rock and feels for its grain. A pulse of force — and the rockfall splits neatly down the middle. It takes minutes, not hours. The miners pour out, blinking, and grab their picks.`), next: 'mines_forge' },
      failure: { effects: (s, c) => { hurt(c.char, '2d6'); addAlly('miners', 'the miners of Emberdeep'); flag('miners_some_died'); doom(1); }, text: (s, c) => P(`The spell cracks the rock — and the ceiling too. ${c.char.name} is slammed to the ground. Digging out takes hours, and four of the miners don't survive the second fall. The rest follow you, silent.`), next: 'mines_forge' },
    },
    {
      label: 'Leave them — the fragment comes first',
      effects: () => { flag('miners_died'); if (has('mines_promise')) flag('broke_promise'); },
      text: s => P(has('mines_promise') ? `You promised Brannoc. You walk away anyway. The tapping follows you down the tunnel for a long time before it fades.` : `You turn your back on the tapping. It follows you down the tunnel for a long time before it fades.`),
      next: 'mines_forge',
    },
  ],
};

SCENES.mines_forge = {
  title: 'The Deep Forge',
  text: s => P(
    `The Deep Forge is a cathedral of stone around a channel of molten rock. Anvils the size of wagons stand in rows. At the far end, a round vault door of black iron bears a dwarven seal — and it's half broken already.`,
    `Hammering at the seal is a <b>Cinder Brute</b>, a hulking thing of slag and flame bound in chains of Hollow-grey iron. ${cap(numWord(minesForgeCount() + (hasAlly('miners') ? 1 : 0)))} ${V().minionPlural} drive it on with whips${has('mines_alerted') ? ' — and they have turned, weapons ready, to face you' : ''}.`,
    hasAlly('miners') && `Behind you, the miners of Emberdeep grip their picks. "Our forge," growls the oldest. "Our fight." They will take on one of the cultists themselves.`,
    hasItem('rune_key') && `High on the wall, you see an old iron sluice-gate marked with the same runes as your key. Water from the mountain's heart, held back for a century.`
  ),
  choices: s => [
    hollowOption('Call the Hollow-chains to tighten — and choke the Brute',
      s => P(`${mostCorrupt().name} reaches out and the grey iron on the Brute answers like a dog answering its master. The chains cinch tight. The Brute's fire gutters, sputters, and goes out, leaving a cooling husk. The cultists stare at you — then flee, shrieking that you are one of the Chosen.`, hasAlly('miners') && `The miners do not cheer. They look at you the way they looked at the cultists.`),
      'mines_vault', 1, () => { flag('mines_fought'); if (hasAlly('miners')) flag('miners_afraid'); }),
    {
      label: 'Attack!',
      combat: {
        intro: s => hasAlly('miners') ? 'The miners roar and charge with you.' : 'The Brute turns from the vault with a hiss of steam.',
        actions: s => battleActions('crucible', 'sluice'),
        enemies: s => { const l = [foe('cinder_brute')]; for (let i = 0; i < minesForgeCount(); i++) l.push(minion()); return l; },
        allyStrikes: s => hasAlly('miners') ? [{ name: 'The miners', verb: 'swing their picks at', dmg: '1d8+2' }] : [],
        win: { effects: () => flag('mines_fought'), text: P(`The Cinder Brute crumbles into cooling slag. The last cultist flees into the deep roads, or dies trying. The forge is yours.`), next: 'mines_vault' },
        flee: { text: P(`You retreat up the tunnel. Behind you, the Brute's hammer finally breaks the seal.`), next: 'mines_lost' },
        lose: { text: P(`You're driven back, burned and broken. As you crawl away, you hear the vault seal shatter.`), next: 'mines_lost' },
      },
    },
    {
      label: 'Use the Rune-Key to open the old flood-sluice',
      req: () => hasItem('rune_key'),
      check: { skill: 'lore', dc: 12 },
      success: {
        effects: () => giveXp(60),
        text: (s, c) => P(`${c.char.name} fits the key and turns it through the runes in the right order. With a roar, a century of mountain water thunders down into the lava channel. The forge vanishes in a scalding cloud. When it clears, the Cinder Brute is a cracked, black statue — and the cultists who weren't swept away are fighting blind.`),
        next: 'mines_forge_mop',
      },
      failure: {
        effects: (s, c) => hurt(c.char, '2d4'),
        text: (s, c) => P(`The key turns — the wrong way. A jet of scalding steam blasts out of the gate, scorching ${c.char.name}, and every head in the forge turns.`),
        next: 'mines_forge_fight',
      },
    },
    {
      label: '[Arcana] Break the Hollow-chains binding the Brute',
      req: () => G.party.some(c => Character.checkBonus(c, 'arcana').total >= 3),
      check: { skill: 'arcana', dc: 15 },
      success: {
        effects: () => { giveXp(80); flag('mines_fought'); },
        text: (s, c) => P(`${c.char.name} finds the knot of Hollow-magic in the Brute's chains and unpicks it. The chains fall away. The Brute straightens, looks at the whips, looks at the cultists — and turns on them with a sound like an erupting volcano. In a minute it's over, and the freed creature sinks back into the lava channel where it was born.`),
        next: 'mines_vault',
      },
      failure: { text: (s, c) => P(`The Hollow-magic bites back. ${c.char.name} reels away, and the Brute lunges for you, its masters howling.`), next: 'mines_forge_fight' },
    },
  ],
};

SCENES.mines_forge_mop = {
  title: 'Steam and Steel',
  text: s => P(`Through the steam, the surviving cultists stumble toward you.`),
  choices: s => [{
    label: 'Finish them',
    combat: {
      actions: s => battleActions('crucible'),
      enemies: s => { const l = []; for (let i = 0; i < Math.max(1, minesForgeCount()); i++) l.push(minion()); return l; },
      allyStrikes: s => hasAlly('miners') ? [{ name: 'The miners', verb: 'swing their picks at', dmg: '1d8+2' }] : [],
      win: { effects: () => flag('mines_fought'), text: P(`The forge is silent but for dripping water. It's yours.`), next: 'mines_vault' },
      flee: { text: P(`You retreat — and the cultists break the weakened seal.`), next: 'mines_lost' },
      lose: { text: P(`You go down in the steam. When you wake, the vault stands open and empty.`), next: 'mines_lost' },
    },
  }],
};

SCENES.mines_forge_fight = {
  title: 'Fire in the Deep',
  text: P(`The Cinder Brute comes at you, lava dripping from its fists.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('crucible', 'sluice'),
      enemies: s => { const l = [foe('cinder_brute')]; for (let i = 0; i < minesForgeCount(); i++) l.push(minion()); return l; },
      allyStrikes: s => hasAlly('miners') ? [{ name: 'The miners', verb: 'swing their picks at', dmg: '1d8+2' }] : [],
      win: { effects: () => flag('mines_fought'), text: P(`The Cinder Brute collapses into slag. The forge is yours.`), next: 'mines_vault' },
      flee: { text: P(`You fall back up the tunnel. Behind you, the seal breaks.`), next: 'mines_lost' },
      lose: { text: P(`You're driven back, burned and broken. As you crawl away, you hear the vault seal shatter.`), next: 'mines_lost' },
    },
  }],
};

SCENES.mines_vault = {
  route: s => (hasItem('rune_key') || has('vault_open')) ? 'mines_vault_open' : 'mines_lock',
};

SCENES.mines_lock = {
  title: 'The Rune Seal',
  text: s => P(`The vault door is sealed with a dwarven rune-lock: four stone dials, each carved with the same six runes. The cultists hammered at it for days without opening it. Brannoc said only the clan elders knew the combination.`,
    `Turn the wrong combination too many times, and the old dwarves built the lock to jam for a day and a night.`),
  choices: s => [
    {
      label: 'Work out the combination', hint: '🧩 Code lock — ● right rune, right place · ○ right rune, wrong place',
      puzzle: { type: 'code', key: 'mines_lock', title: 'The rune seal', flavor: 'The dials grind under your fingers. Something deep inside the door clicks with every right rune.', hintLabel: 'Read the foreman\'s ledger for hints', hintSkill: 'lore' },
      solved: { effects: () => flag('vault_open'), text: (s, ctx) => P(`The last dial clicks home. Deep in the door, a hundred-year-old bolt slides back${ctx.guesses <= 3 ? ', and you hear a sound like a dwarf\'s approving grunt from somewhere in the stone' : ''}.`), next: 'mines_vault_open' },
      failed: { effects: () => { flag('vault_open'); doom(1); }, text: P(`The lock seizes with a sound like a slammed coffin lid. It takes a day and a night of hammering to break the hinges instead — a day the Hollow uses well.`), next: 'mines_vault_open' },
    },
    { label: 'Smash the hinges instead', check: { skill: 'athletics', dc: 15 }, success: { effects: () => flag('vault_open'), text: P(`You find the weak point in the hinges and break them in an hour of sweating, ringing work.`), next: 'mines_vault_open' }, failure: { effects: () => { flag('vault_open'); doom(1); hurtAll('1d4'); }, text: P(`It takes all night, and all your strength, but the hinges break at last.`), next: 'mines_vault_open' } },
  ],
};

SCENES.mines_vault_open = {
  title: 'The Vault',
  first: s => { gainFragment('mines'); },
  text: s => P(
    `${hasItem('rune_key') ? 'The Rune-Key turns in the cracked seal, and' : 'With a groan of old iron,'} the vault door swings open. Inside, on a plinth of black basalt, rests <b>${regionFrag('mines').name}</b> — ${regionFrag('mines').desc}.`,
    has('mines_fought') && G.clues.length < V().clues.length && `Among the dead cultists' gear you find a satchel of orders. One page is written in cipher.`
  ),
  choices: s => [has('mines_fought') && cipherChoice('mines_letter', 'mines_end', 'Decipher the coded page'), { label: 'Return to the surface', next: 'mines_end' }],
};

SCENES.mines_lost = {
  title: 'The Empty Vault',
  first: s => { loseFragment('mines'); doom(1); },
  text: s => P(`When you return to the forge, the vault stands open and empty. The cultists are gone into the deep roads with ${regionFrag('mines').name}. Somewhere far away, ${V().short} is smiling.`),
  choices: [{ label: 'Return to the surface', next: 'mines_end' }],
};

SCENES.mines_end = {
  title: 'Emberdeep',
  first: s => {
    finishRegion('mines');
    if (hasAlly('miners')) { addGold(30); addPack('potion', 2); chronicle(`Rescued the miners of Emberdeep${has('miners_some_died') ? ', though four died in the rockfall' : ''}.`); }
    if (has('miners_died')) chronicle(`Left the trapped miners of Emberdeep to their fate${has('broke_promise') ? ', breaking a promise to Brannoc' : ''}.`);
  },
  text: s => {
    if (hasAlly('miners')) return P(
      `When you climb out into the daylight, the whole town is waiting. Wives, husbands, children and grandparents fall on the miners with shouts and sobs. Brannoc embraces each of his people in turn${has('miners_some_died') ? ', and stands for a long time over the four who came up on stretchers' : ''}.`,
      has('miners_afraid') && `The miners give you a wide berth. They saw what you did to the Brute.`,
      `Then he turns to you. "Emberdeep owes you a debt," he says, pressing a heavy purse and two healing draughts into your hands. "When you march on ${V().short}, send word. The clans will come."`
    );
    return P(
      `Brannoc is waiting at the gate. He looks past you, at the empty tunnel, for a long time.`,
      has('broke_promise') ? `"You promised," is all he says. Then he goes to tell the families.` : `"I see," he says quietly, and goes to tell the families.`,
      `Emberdeep's chimneys stay cold as you leave.`
    );
  },
  choices: [{ label: 'Take the road', next: 'road' }],
};
