/* ===========================================================
   ROAD INTERLUDES — encounters on the way back to Hearthmoor.
   After region 1 and 3: a random one. After region 2: the rival.
   =========================================================== */

/* ---------- The wounded ranger ---------- */
SCENES.int_traveler = {
  vote: true,
  title: 'Wolves on the Road',
  text: s => P(
    `On a lonely stretch of road, you hear howling. In a ditch below, a woman in a ranger's green cloak is pinned under a dead horse, swinging a broken bow at three lean wolves with grey, crumbling fur and eyes like wet ash. Hollow-wolves.`,
    `"Don't just stand there!" she yells.`
  ),
  choices: s => [
    {
      label: 'Charge the wolves',
      combat: {
        actions: s => battleActions('firebrand'),
        enemies: s => solo() ? [foe('hollow_wolf'), foe('hollow_wolf')] : [foe('hollow_wolf'), foe('hollow_wolf'), foe('hollow_wolf')],
        win: { text: P(`The last wolf yelps and falls. You heave the horse off the ranger's leg.`), next: 'int_traveler_tend' },
        flee: { effects: () => flag('sela_abandoned'), text: P(`You run. The ranger's shouts follow you down the road, then stop.`), next: 'hub' },
        lose: { effects: () => flag('sela_abandoned'), text: P(`The wolves drive you off, bloodied. When you return with torches, there is nothing in the ditch but the dead horse.`), next: 'hub' },
      },
    },
    {
      label: 'Drive them off with fire',
      check: { skill: 'survival', dc: 13 },
      success: { text: (s, c) => P(`${c.char.name} snatches up a dead branch, wraps it in oil-soaked cloth and lights it. The wolves flinch from the flames — Hollow-things hate warmth — and bolt for the trees.`), next: 'int_traveler_tend' },
      failure: { text: (s, c) => P(`The torch sputters out in ${c.char.name}'s hand. The wolves turn toward you, hackles raised.`), next: 'int_traveler_fight' },
    },
    {
      label: 'Keep walking — you can\'t save everyone',
      effects: () => flag('sela_abandoned'),
      text: P(`You keep your eyes on the road. The ranger's shouts follow you a long way.`),
      next: 'hub',
    },
  ],
};

SCENES.int_traveler_fight = {
  title: 'Wolves on the Road',
  text: P(`The Hollow-wolves leap.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('firebrand'),
      enemies: s => solo() ? [foe('hollow_wolf'), foe('hollow_wolf')] : [foe('hollow_wolf'), foe('hollow_wolf'), foe('hollow_wolf')],
      win: { text: P(`The last wolf falls. You heave the horse off the ranger's leg.`), next: 'int_traveler_tend' },
      flee: { effects: () => flag('sela_abandoned'), text: P(`You run. The ranger's shouts stop behind you.`), next: 'hub' },
      lose: { effects: () => flag('sela_abandoned'), text: P(`The wolves drive you off. When you return, the ditch is empty.`), next: 'hub' },
    },
  }],
};

SCENES.int_traveler_tend = {
  title: 'Sela',
  text: P(`"Sela," the ranger grunts, as you help her sit up. "Scout for the Hearthmoor watch." There's a deep bite in her forearm, and the skin around it is already turning grey.`),
  choices: s => [{
    label: 'Clean the bite before the grey spreads',
    check: { skill: 'medicine', dc: 12, mods: () => [hasAlly('nan') && { label: 'Nan\'s bog-myrtle', value: 2 }, hasClass('cleric') && { label: 'Cleric\'s prayers', value: 2 }] },
    success: {
      effects: () => { addAlly('sela', 'Sela, scout of Hearthmoor'); chronicle('Saved Sela the ranger from the Hollow-wolves.'); },
      text: (s, c) => P(`${c.char.name} cuts away the grey flesh and packs the wound. Sela doesn't make a sound, though she goes white. When it's done, the grey has stopped spreading.`,
        `"I owe you my life," she says. "I know the country around ${V().stronghold} better than anyone alive. When you go there, I'm coming with you."`),
      next: 'hub',
    },
    failure: {
      effects: () => { flag('sela_lost'); },
      text: (s, c) => P(`${c.char.name} does what they can, but the grey keeps creeping up Sela's arm. She looks at it for a long moment, then gets up. "I know how this ends," she says quietly. "Better I walk away from people while I still can." She limps off into the trees before you can stop her.`),
      next: 'hub',
    },
  }],
};

/* ---------- The peddler ---------- */
SCENES.int_merchant = {
  title: 'Pip\'s Wagon',
  text: s => P(
    `A brightly painted wagon is stopped at a crossroads, its mule munching thistles. Its owner, a cheerful gnome named Pip, waves you over. "Customers! Real ones, with boots and everything! Come, come — I've got things you won't find in Hearthmoor."`,
    G.doom >= 4 && `Even Pip's cheer is a little strained. "Heading south," he admits. "Far south. The grey's coming."`
  ),
  choices: s => [
    { label: 'Browse his wares', ui: 'shop' },
    {
      label: 'Buy a rumour (10 gold)', cost: { gold: 10 }, once: 'pip_rumour',
      effects: () => { G._clue = addClue(); },
      text: s => { const c = G._clue; G._clue = null; return P(`Pip leans in close. "A cousin of a cousin of mine cooks for the other lot," he whispers.`, c ? `<b>${c}</b>` : `"…but it seems you know more than my cousin does!"`); },
      next: 'int_merchant',
    },
    diceGame('Play a round of Pip\'s Bones (stake 10 gold)', 'pip', 'int_merchant', { opponent: 'Pip', once: 'pip_dice' }),
    { label: 'Wish Pip luck and move on', next: 'hub' },
  ],
};

/* ---------- The grey village ---------- */
SCENES.int_village = {
  vote: true,
  title: 'Greywater',
  text: s => P(
    `The village of Greywater straddles a little river. Too many doors are shut. In the square, a woman with a grey-streaked face stands guard over a stone well-house with a plank nailed across its door.`,
    `"Headwoman Tamsin," she says. "The sickness came up from the well. It's in the water, in the people. Half of us are greying." She looks at your weapons. "Something's down there. Something that makes it worse. We've no one left who can go down."`
  ),
  choices: s => [
    {
      label: 'Go down the well and destroy whatever is there',
      combat: {
        intro: 'At the bottom of the well, in a cave of grey slime, shambling figures turn toward you — villagers who went down and never came up.',
        actions: s => battleActions('well_rope'),
        enemies: s => solo() ? [foe('hollowed'), foe('hollowed')] : [foe('hollowed'), foe('hollowed'), foe('hollowed')],
        win: {
          effects: () => { flag('greywater_saved'); doom(-1); chronicle('Purged the Hollow from the well of Greywater.'); },
          text: P(`Behind the husks you find it: a crack in the rock, bleeding grey mist into the water. You collapse the passage over it. Within a day, the river runs clear and the grey begins to fade from people's faces. Tamsin weeps openly.`),
          next: 'hub',
        },
        flee: { effects: () => { flag('greywater_lost'); doom(1); }, text: P(`You scramble back up the rope. Tamsin looks at your faces and nails the plank back over the door without a word.`), next: 'hub' },
        lose: { effects: () => { flag('greywater_lost'); doom(1); }, text: P(`The villagers haul you out half-dead. The sickness will run its course in Greywater.`), next: 'hub' },
      },
    },
    {
      label: 'Brew a cure from what grows by the river',
      check: { skill: 'medicine', dc: 15, mods: () => [hasAlly('nan') && { label: 'Old Nan\'s remedies', value: 3 }, hasClass('cleric') && { label: 'Cleric\'s prayers', value: 2 }, hasItem('monk_beads') && { label: 'Prayer beads', value: 0 }] },
      success: {
        effects: () => { flag('greywater_saved'); doom(-1); chronicle('Brewed a cure for the grey sickness of Greywater.'); },
        text: (s, c) => P(`${c.char.name} works through the night, boiling willow-bark and bog-myrtle and sunleaf into a bitter tea. By morning, the first villagers to drink it are sitting up. Tamsin seals the well herself. "We'll use the river," she says. "And we'll remember."`),
        next: 'hub',
      },
      failure: {
        effects: (s, c) => { flag('greywater_lost'); doom(1); },
        text: (s, c) => P(`${c.char.name} tries everything. Nothing works. Two days lost, and Greywater is no better. Tamsin thanks you anyway, which is worse.`),
        next: 'hub',
      },
    },
    {
      label: 'Tell her you can\'t stay',
      effects: () => { flag('greywater_lost'); doom(1); },
      text: P(`Tamsin nods as though she expected nothing else. Behind you, someone begins to ring a handbell, slowly.`),
      next: 'hub',
    },
  ],
};

/* ---------- Florian's roadside shrine ---------- */
SCENES.int_shrine = {
  title: 'The Woodcutter\'s Shrine',
  first: s => { healAll('full'); },
  text: s => P(
    `At dusk you reach a tiny roadside shrine: a stone hut, a carved wooden figure of Florian with an axe on his shoulder, and a hundred years of offerings — ribbons, coins, children's drawings. Someone has left a dry stack of firewood. You make camp.`,
    !solo() && `${G.party[0].name} and ${G.party[1].name} sit up late by the fire, talking about home, and what they'll do when this is over. It's the first time either of them has said it out loud: <i>when</i>, not <i>if</i>.`,
    `That night, you dream of a broad-shouldered man splitting logs in the snow. He looks up and smiles at you, and says something you can't quite hear.`
  ),
  choices: s => [
    {
      label: 'Try to hold on to the dream',
      check: { skill: 'insight', dc: 12 },
      success: {
        effects: () => { G._clue = addClue(); },
        text: (s, c) => { const cl = G._clue; G._clue = null; return P(`${c.char.name} reaches into the dream and holds on. The woodcutter's words come clear: "Every enemy was a person once. Find the person, and you'll find the crack in the armour."`, cl ? `Then the dream shifts, and ${c.char.name} sees something they shouldn't be able to know:` : '', cl && `<b>${cl}</b>`); },
        next: 'int_shrine_end',
      },
      failure: { text: P(`The dream slips away like water. You wake rested, at least.`), next: 'int_shrine_end' },
    },
    { label: 'Leave an offering (5 gold) and pray for luck', cost: { gold: 5 }, effects: () => { restoreFocus(); giveXp(30); }, text: P(`You leave your coins among the others. In the morning, your minds feel sharp and clear.`), next: 'int_shrine_end' },
  ],
};

SCENES.int_shrine_end = {
  title: 'Morning',
  text: P(`Rested and whole, you take the road again.`),
  choices: [{ label: 'Continue to Hearthmoor', next: 'hub' }],
};

/* ---------- The rival's ambush (always after the second region) ---------- */
SCENES.int_rival = {
  title: s => `${V().lieutenant.name} Returns`,
  first: s => { G.rival.met++; },
  text: s => {
    const l = V().lieutenant;
    const fixedGreet = G.rival.scarred
      ? `"Remember this?" ${l.name} touches the scar across ${l.his} cheek. "I do. Every morning."`
      : G.rival.beaten ? `"We have unfinished business," ${l.name} says. "You made me look a fool in front of my followers."`
        : `"I told you I'd take what's yours," ${l.name} says pleasantly. "I keep my word."`;
    return P(
      `The road narrows through a cutting of red rock. Too quiet. You realise it a moment too late: figures rise on the ridges on both sides, and ahead, blocking the road, stands ${l.desc}.`,
      fixedGreet,
      fragCount('party') ? `${cap(l.he)} holds out a gloved hand. "The fragments. Now."` : `${cap(l.he)} smiles. "No fragments? Then I'll settle for your heads."`
    );
  },
  choices: s => [
    {
      label: 'Fight!',
      combat: {
        actions: s => battleActions('rockslide'),
        noSurrender: true,
        enemies: s => { const l = [lieutenant()]; if (!solo()) l.push(minion()); if (G.doom >= 5) l.push(minion()); return l; },
        win: { effects: () => { G.rival.beaten++; }, text: s => P(`${V().lieutenant.name} goes down on one knee in the dust, ${V().lieutenant.his} weapon knocked from ${V().lieutenant.his} hand, followers dead or fled. "Finish it, then," ${V().lieutenant.he} spits.`), next: 'int_rival_mercy' },
        flee: {
          effects: () => { G.rival.lost++; const lost = Math.min(G.gold, 20); addGold(-lost); },
          text: P(`You break through the line and run, abandoning packs and purses. Behind you, the lieutenant laughs.`), next: 'hub',
        },
        lose: {
          effects: () => {
            G.rival.lost++;
            const held = Object.keys(G.fragments).filter(k => G.fragments[k] === 'party');
            if (held.length) { const f = Dice.pick(held); G.fragments[f] = 'villain'; G._stolen = f; note(`${FRAGMENTS[f].name} was taken!`, 'bad'); chronicle(`${V().lieutenant.name} ambushed you on the road and stole ${FRAGMENTS[f].name}.`); doom(1); }
            else { G._stolen = null; addGold(-Math.min(G.gold, 25)); }
          },
          text: s => { const f = G._stolen; G._stolen = null; return P(`You wake in the dust of the cutting.`, f ? `Your packs have been torn open. ${FRAGMENTS[f].name} is gone. ${V().lieutenant.name} has taken it to ${V().short}.` : `Your purses have been cut. ${V().lieutenant.name} has left a message scratched in the dirt: <i>NEXT TIME.</i>`); },
          next: 'hub',
        },
      },
    },
  ],
};

SCENES.int_rival_mercy = {
  vote: true,
  title: 'Mercy or Justice',
  text: s => P(`${V().lieutenant.name} kneels before you, bleeding, glaring up. ${V().lieutenant.his.charAt(0).toUpperCase() + V().lieutenant.his.slice(1)} followers are gone. It would be very easy to end this — and ${V().lieutenant.he} would certainly not show you the same mercy.`),
  choices: s => [
    {
      label: 'Interrogate the lieutenant first',
      once: 'rival_interrogate',
      check: { skill: 'intimidation', dc: 13 },
      success: { effects: () => { G._clue = addClue(); }, text: (s, c) => { const cl = G._clue; G._clue = null; return P(`${c.char.name} leans close. Something in their eyes makes ${V().lieutenant.name} talk.`, cl ? `<b>${cl}</b>` : `But ${V().lieutenant.he} knows nothing you haven't already learned.`); }, next: 'int_rival_mercy' },
      failure: { text: s => P(`${V().lieutenant.name} only laughs at you, blood on ${V().lieutenant.his} teeth.`), next: 'int_rival_mercy' },
    },
    {
      label: 'Finish the lieutenant — mercy is wasted here',
      effects: () => { G.rival.slain = true; addGold(20); chronicle(`Slew ${V().lieutenant.name} ${V().lieutenant.title} on the road.`); },
      text: s => P(`It's over quickly. ${V().lieutenant.name} ${V().lieutenant.title} will trouble no one again. On the body you find a purse of gold and ${V().short}'s seal. Somewhere, ${V().short} will feel the loss.`),
      next: 'hub',
    },
    {
      label: 'Let the lieutenant go',
      effects: () => { G.rival.spared = true; chronicle(`Spared ${V().lieutenant.name} ${V().lieutenant.title} on the road.`); },
      text: s => P(`You lower your weapons. "Go," ${G.party[0].name} says. "Tell ${V().short} what happened here."`, `${V().lieutenant.name} stares at you as though you've spoken a foreign language. Then ${V().lieutenant.he} picks up ${V().lieutenant.his} weapon — slowly — sheathes it, and limps away without a word. At the top of the ridge, ${V().lieutenant.he} looks back once.`),
      next: 'hub',
    },
  ],
};

/* ---------- The toll bridge ---------- */
SCENES.int_bridge = {
  title: 'The Toll Bridge',
  text: s => P(`The road crosses a gorge on an old stone bridge. Sitting in the middle of it, filling it entirely, is a troll with a tax-collector's ledger balanced on one knee. "Toll," it rumbles. "Twenty gold. Or a riddle. Or a fight. Troll is not fussy."`,
    G.doom >= 5 && `It glances nervously at the grey haze on the horizon. "Troll is thinking of retiring. Somewhere south."`),
  choices: s => [
    { label: 'Pay the toll (20 gold)', cost: { gold: 20 }, text: P(`The troll writes your names in its ledger with enormous care, misspelling all of them, and waves you across.`), next: 'hub' },
    riddleChoice('Ask for the riddle', 'troll',
      { effects: () => addGold(10), text: P(`The troll claps its enormous hands. "Correct! Troll has not been beaten in forty years!" It is so delighted that it pays <i>you</i> ten gold, "for the entertainment", and waves you across.`), next: 'hub' },
      { effects: () => addGold(-Math.min(G.gold, 20)), text: P(`Wrong. The troll sighs, deeply disappointed in you, and takes the toll anyway.`), next: 'hub' }),
    {
      label: 'Fight your way across',
      combat: {
        enemies: s => [foe('toll_troll')],
        actions: s => battleActions('bridge_shove'),
        win: { effects: () => addGold(30), text: P(`The troll yields, sulking, and lets you pass. You help yourself to its strongbox on the way. It's mostly buttons, but not entirely.`), next: 'hub' },
        flee: { text: P(`You take the long way round. It costs you most of a day.`), effects: () => doom(1), next: 'hub' },
        lose: { effects: () => addGold(-Math.min(G.gold, 30)), text: P(`The troll sits on you until you pay. Then it charges you extra, for the inconvenience.`), next: 'hub' },
      },
    },
  ],
};

/* ---------- The pilgrims ---------- */
SCENES.int_pilgrims = {
  vote: true,
  title: 'Pilgrims on the Road',
  text: s => P(`A straggling line of pilgrims — old people, children, a priest with a bad leg — is trudging south, away from the grey. They are going to the shrine at Hearthmoor to pray for the woodcutter's return. Their leader, a tired young woman, sees your weapons and hurries over.`,
    `"Please. There are husks in the woods ahead. We'll never make it alone. We can't pay." She looks at the children. "Not in coin."`),
  choices: s => [
    {
      label: 'Escort them to Hearthmoor',
      effects: () => { doom(1); G.flags.mercy = (G.flags.mercy || 0) + 1; addPack('potion', 2); restoreFocus(); chronicle('Escorted a band of pilgrims safely to Hearthmoor.'); flag('pilgrims_saved'); },
      text: P(`It takes two slow days. Once, husks come out of the trees and you fight them off at the edge of the camp while the children hide in the carts. But every pilgrim reaches Hearthmoor alive. They have no coin — but the priest blesses you, and the old women press herb-draughts on you until your packs bulge.`),
      next: 'hub',
    },
    {
      label: 'Point them to a safer road and wish them luck',
      check: { skill: 'survival', dc: 13 },
      success: { effects: () => flag('pilgrims_saved'), text: P(`You sketch a route around the woods, along a stream the husks won't cross. The leader studies it, then grips your hand. Later, in Hearthmoor, you hear they made it.`), next: 'hub' },
      failure: { effects: () => flag('pilgrims_lost'), text: P(`You draw them a route. You never find out whether they followed it. You never hear of them again.`), next: 'hub' },
    },
    { label: 'Keep moving', effects: () => flag('pilgrims_lost'), text: P(`The pilgrims watch you go. Nobody says anything. They don't need to.`), next: 'hub' },
  ],
};
