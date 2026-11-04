/* ===========================================================
   REGION: SILVERBOUGH — the Weeping Orchard
   The elves of Silverbough guard the Heartwood, the great tree whose
   wood once made Florian's haft. The Hollow has crept into its roots.
   Key flags: orchard_side (burners|tenders), heartwood_saved, elves ally
   =========================================================== */

SCENES.orchard_start = {
  title: 'Silverbough',
  text: s => P(
    raidLine('orchard'),
    twistLine('orchard'),
    `Silverbough is an orchard the size of a forest: silver-barked trees in perfect rows, planted by elves before there were kingdoms. At its heart stands the Heartwood, the tree that gave Florian's haft its wood — and the Keepers buried <b>${regionFrag('orchard').name}</b> among its roots, where the tree would guard it.`,
    `The orchard is weeping. Sap runs grey down the silver bark. Leaves fall in summer. At the gate, two elves are arguing so fiercely they don't notice you: a stern woman in a forester's cloak with a torch in her hand, and an old man with soil on his knees.`,
    `"The Hollow is in the Heartwood's roots," the woman snaps. "We burn it now, or it spreads to every tree we have." — "You'd burn the oldest living thing in the world," the old man says, "because you're frightened."`
  ),
  choices: s => [
    { label: 'Hear them both out', next: 'orchard_council' },
    { label: '[Elf] Speak to them in the old tongue', req: () => hasRace('elf'), effects: () => flag('orchard_kin'), text: s => P(`${raceChar('elf').name} speaks in the language of the first orchards. Both elves fall silent and bow. "Kin," the woman says, embarrassed. "Forgive us. I am Warden Ithil. This is Root-Keeper Olen. You find us… divided."`), next: 'orchard_council' },
  ],
};

SCENES.orchard_council = {
  title: 'Fire or Root',
  text: s => P(
    `Warden Ithil wants to burn the Heartwood before the grey spreads. "It's already lost. We save the orchard, or we lose everything." The fragment, she admits, would survive the fire. "Steel and crystal don't burn."`,
    `Root-Keeper Olen wants to go down into the roots and cut the Hollow out by hand. "There is a heart-root, deep below. If the rot is cut away from it, the tree will live. But no elf has gone down there in a thousand years, and the roots… the roots have teeth now."`,
    `Both of them look at you. You came for the fragment. But you could tip the balance.`,
    has('orchard_kin') && `As kin, ${raceChar('elf').name}'s word will carry great weight here.`
  ),
  choices: s => [
    {
      label: 'Side with Ithil — burn the Heartwood',
      effects: () => { flag('orchard_side', 'burners'); },
      text: P(`Olen closes his eyes. Ithil nods once, grimly, and calls for oil. "It's the right choice," she says. "It's just not a kind one."`),
      next: 'orchard_burn',
    },
    {
      label: 'Side with Olen — go down into the roots',
      effects: () => { flag('orchard_side', 'tenders'); },
      text: P(`Olen's face lights up. Ithil throws down her torch in disgust. "Then go. If you are not back by dusk, I burn it with you in it."`),
      next: 'orchard_roots',
    },
    {
      label: 'Propose a middle way: you go down, Ithil stands ready with fire',
      check: { skill: 'persuasion', dc: s => has('orchard_kin') ? 11 : 14 },
      success: { effects: () => { flag('orchard_side', 'tenders'); flag('orchard_united'); }, text: (s, c) => P(`${c.char.name} lays it out: you'll go down and try to save the tree. If you fail, or the grey spreads, Ithil burns it. For a long moment the two elves glare at each other. Then Ithil grips Olen's arm. "Dusk," she says. "Not one minute more." For the first time in weeks, Silverbough is united.`), next: 'orchard_roots' },
      failure: { effects: () => flag('orchard_side', 'tenders'), text: P(`Neither elf will budge. In the end Ithil storms off to gather oil, and Olen leads you to the roots alone. "She'll burn it whether you're down there or not," he warns.`), next: 'orchard_roots' },
    },
  ],
};

SCENES.orchard_burn = {
  title: 'The Burning of the Heartwood',
  text: s => P(`They pour oil around the Heartwood's trunk as the sun sets. Ithil lights it herself. The fire climbs the silver bark like something hungry, and the tree screams — a sound like wind in a thousand branches.`,
    `Then the roots erupt from the earth. The Hollow inside the tree does not want to burn: a huge grey shape of root and rot heaves itself out of the ground, flaming, and comes for the elves.`),
  choices: s => [{
    label: 'Fight the burning thing!',
    combat: {
      enemies: s => [foe('rot_treant'), foe('hollowed', { name: 'Root-Husk' })],
      actions: s => battleActions('fire_arrows'),
      allyStrikes: s => [{ name: 'Ithil\'s foresters', verb: 'loose arrows at', dmg: '1d6+1' }],
      win: {
        effects: () => { flag('heartwood_burned'); addAlly('elves', 'the foresters of Silverbough'); chronicle('Burned the Heartwood of Silverbough to stop the Hollow spreading.'); },
        text: s => P(`The rot-thing collapses into the flames. By dawn the Heartwood is a black pillar, and the grey has not spread to a single other tree. In the ashes among its roots, you find ${regionFrag('orchard').name}, untouched by the fire.`,
          `Ithil stands over the ashes a long time. "Thank you," she says, though it plainly costs her. "When you march on the one who did this, Silverbough's archers will be there." Olen is nowhere to be seen.`),
        next: 'orchard_win',
      },
      flee: { effects: () => flag('heartwood_burned'), text: P(`You fall back from the flames. The rot-thing drags itself, burning, into the dark — and something glitters in its roots as it goes.`), next: 'orchard_lost' },
      lose: { effects: () => flag('heartwood_burned'), text: P(`The thing hurls you aside. When you wake, the Heartwood is ash, and the rot-thing is gone into the night — with the fragment caught in its roots.`), next: 'orchard_lost' },
    },
  }],
};

SCENES.orchard_roots = {
  title: 'Beneath the Heartwood',
  text: s => P(`Olen leads you down through a split in the earth beneath the Heartwood. The roots form a cathedral of living wood, lit by glowing moss — but grey rot creeps along every surface, and the roots twitch as you pass.`,
    `"The heart-root is below," Olen whispers. "And so is the rot's heart. Mind the roots. They remember how to grip."`,
    twistLine('orchard', 'inner'),
    has('orchard_united') && `Above, you know, Ithil is waiting with her torch, counting the minutes.`),
  choices: s => [
    {
      label: 'Move carefully through the grasping roots',
      check: { skill: 'acrobatics', dc: 13 },
      success: { text: (s, c) => P(`${c.char.name} picks a path between the twitching roots, never touching the grey. You reach the heart-root without a scratch.`), next: 'orchard_heart' },
      failure: { effects: (s, c) => { hurt(c.char, '1d8'); doom(1); }, text: (s, c) => P(`A root whips around ${c.char.name}'s ankle and hauls them into the rot. You hack them free, but it costs time — and the grey touched their skin.`), next: 'orchard_heart' },
    },
    {
      label: 'Ask Olen to sing the roots to sleep',
      check: { skill: 'performance', dc: 12, mods: () => [has('orchard_kin') && { label: 'Elvish kin', value: 2 }] },
      success: { effects: () => flag('roots_sleep'), text: (s, c) => P(`Olen begins an old song, and ${c.char.name} joins in, catching the melody. The roots slow, then still. You walk through the sleeping forest of wood without being touched.`), next: 'orchard_heart' },
      failure: { effects: (s, c) => hurt(c.char, '1d6'), text: P(`The song falters. The roots wake angry, and you have to fight your way down through them.`), next: 'orchard_heart' },
    },
    hollowOption('Walk through the rot — it will not touch one of its own', s => P(`${mostCorrupt().name} steps into the grey and it parts around them like water around a stone. Olen stares. "What are you?" he whispers. He follows at a distance after that.`), 'orchard_heart', 1, () => flag('olen_afraid')),
  ],
};

SCENES.orchard_heart = {
  title: 'The Heart-Root',
  text: s => P(`At the bottom of the roots, a vast heart-root pulses with slow golden light — dimming, smothered by a grey growth like a fist of fungus. Wedged in the rot, half-swallowed, is <b>${regionFrag('orchard').name}</b>.`,
    `The rot is aware of you. Tendrils of grey rise from it like cobras, and a shape begins to pull itself out of the fungus: a <b>Rot-Treant</b>, the Hollow's guardian.`),
  choices: s => [
    {
      label: 'Cut the rot away while it\'s still waking',
      check: { skill: 'medicine', dc: 14, mods: () => [has('roots_sleep') && { label: 'Sleeping roots', value: 2 }, hasClass('cleric') && { label: 'Cleric\'s prayers', value: 2 }] },
      success: {
        effects: () => { flag('heartwood_saved'); giveXp(80); },
        text: (s, c) => P(`${c.char.name} works like a surgeon, slicing the grey growth away from the heart-root in long careful strokes while it thrashes. The guardian half-forms, screams, and collapses back into slime as its heart is cut out. The golden light swells. Above you, the whole tree groans like something waking from a long fever.`),
        next: 'orchard_win',
      },
      failure: { text: (s, c) => P(`${c.char.name} cuts, but not deep enough. The guardian tears itself free of the root, furious.`), next: 'orchard_heart_fight' },
    },
    { label: 'Fight the guardian', next: 'orchard_heart_fight' },
  ],
};

SCENES.orchard_heart_fight = {
  title: 'The Rot-Treant',
  text: P(`The Rot-Treant rises, grey sap dripping from limbs like broken branches.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      enemies: s => [foe('rot_treant')],
      actions: s => battleActions('heart_root'),
      allyStrikes: s => [{ name: 'Olen', verb: 'slashes with a pruning-knife at', dmg: '1d4+1' }],
      win: { effects: () => flag('heartwood_saved'), text: P(`The Rot-Treant comes apart in a spray of grey pulp. Freed, the heart-root flares gold. Above you, the whole tree groans like something waking from a long fever.`), next: 'orchard_win' },
      flee: { text: P(`You flee up through the roots. Behind you, the grey closes over the heart-root. Above, Ithil sees you emerge — alone, empty-handed — and reaches for her torch.`), next: 'orchard_lost' },
      lose: { text: P(`You wake at the mouth of the roots, dragged out by Olen. Below, the grey has swallowed everything — and the fragment with it.`), next: 'orchard_lost' },
    },
  }],
};

SCENES.orchard_win = {
  title: 'Recovered',
  first: s => {
    gainFragment('orchard');
    if (has('heartwood_saved')) { addAlly('elves', 'the elves of Silverbough'); addGear('silver_bow'); chronicle('Saved the Heartwood of Silverbough by cutting the Hollow from its roots.'); G._clue = addClue(); }
  },
  text: s => {
    const c = G._clue; G._clue = null;
    return P(
      `<b>${regionFrag('orchard').name}</b> — ${regionFrag('orchard').desc} — is yours.`,
      has('heartwood_saved') && `When you climb out, the orchard is changed. The grey is draining out of the bark. New leaves are unfurling. Ithil is on her knees at the Heartwood's trunk, weeping, and Olen is laughing like a boy.`,
      has('heartwood_saved') && `Ithil gives you a bow of silver wood. "From the Heartwood's own branch. It has never been given to anyone outside Silverbough." Then she adds, quietly: "The rot spoke as it died. It said a name, and something more."`,
      c && `<b>${c}</b>`,
      has('olen_afraid') && `Olen thanks you — but he will not stand close to ${mostCorrupt().name}.`
    );
  },
  choices: [{ label: 'Leave Silverbough', next: 'orchard_end' }],
};

SCENES.orchard_lost = {
  title: 'Ashes and Rot',
  first: s => { loseFragment('orchard'); doom(1); if (!has('heartwood_burned')) flag('heartwood_burned'); },
  text: s => P(`The Heartwood burns that night — by Ithil's hand or the Hollow's, it hardly matters. When the ash settles, ${regionFrag('orchard').name} is gone. ${V().minionPlural} were seen on the north road at dawn, carrying something that glittered.`,
    `Silverbough will survive, Ithil says. It will just be smaller, and greyer, and sadder. Like everything.`),
  choices: [{ label: 'Leave Silverbough', next: 'orchard_end' }],
};

SCENES.orchard_end = {
  title: 'The Silver Road',
  first: s => finishRegion('orchard'),
  text: P(`Silver leaves drift down around you as you leave the orchard behind.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
