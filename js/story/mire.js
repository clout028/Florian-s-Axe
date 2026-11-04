/* ===========================================================
   REGION: THE MIREWOOD FEN — the Drowned Shrine
   Key flags: gusk_spy, mire_warned, mire_tracks, mire_words,
   nan ally / nan_curse / nan_threatened, mire_minions_dead
   =========================================================== */

SCENES.mire_start = {
  title: 'The Mirewood Fen',
  first: s => { if (Dice.chance(0.55)) flag('gusk_spy'); },
  text: s => P(
    `The road ends at a rotting jetty where the Mirewood Fen begins. Black water threads between drowned oaks, and in places the moss has gone the colour of old ash — the Hollow's touch, creeping in from the north.`,
    `According to the Keeper's Map, the Keepers hid <b>${regionFrag('mire').name}</b> in the Drowned Shrine at the fen's heart, where Florian once bound "a guardian of peat and oak" to watch over it.`,
    `A ferryman in a patched coat leans on his pole at the jetty. "Gusk's the name. I'll pole you to the heart of the fen for ten gold." Off to the west, a thread of green-tinged smoke rises from a hut on stilts. The ferryman follows your gaze and makes a warding sign. "Old Nan's place. Wouldn't."`
  ),
  choices: s => [
    { label: 'Hire Gusk\'s punt', cost: { gold: 10 }, hint: '10 gold', next: 'mire_ferry' },
    {
      label: 'Find your own way through the reeds',
      check: { skill: 'survival', dc: 13 },
      success: {
        effects: () => flag('mire_tracks'),
        text: (s, c) => P(`${c.char.name} reads the fen like a book — the firm tussocks, the bubbles that mean bottomless mud. Halfway in, you find fresh bootprints pressed into the moss, and a dropped scrap of cloth marked with ${V().sigil}. ${V().minionPlural} are already ahead of you, heading for the shrine.`),
        next: 'mire_crossroads',
      },
      failure: {
        text: (s, c) => P(`One wrong step and ${c.char.name} is waist-deep in sucking black mud. As you haul them free, the water around you begins to ripple. Something long and pale is coming.`),
        next: 'mire_leeches',
      },
    },
    { label: 'Climb up to the witch\'s stilt-hut', next: 'mire_nan' },
  ],
};

SCENES.mire_ferry = {
  title: 'Gusk\'s Punt',
  text: s => P(
    `Gusk poles you out into the mist. The jetty vanishes behind you within a dozen strokes. He hums tunelessly, but his eyes keep sliding to your packs — and once, when he thinks you aren't looking, toward a stand of dead trees where the water lies flat and black.`
  ),
  choices: s => [
    {
      label: 'Watch him closely',
      check: { skill: 'insight', dc: 12 },
      success: {
        effects: () => { if (has('gusk_spy')) flag('mire_warned'); else flag('mire_nan_tip'); },
        text: (s, c) => has('gusk_spy')
          ? P(`${c.char.name} catches it as his sleeve rides up: a fresh tattoo of ${V().sigil}. Confronted, Gusk crumples. "They paid me! Said to tip you into the leech-pools. There's — there's a pack of 'em at the shrine, dredging for something." He poles you to the dry ridge, then flees into the mist without his fee.`,
            `You know what's waiting for you now. That's worth more than ten gold.`)
          : P(`${c.char.name} watches him and sees only fear. When you ask, he admits it: "The grey took my Marta last winter. I don't like going near the dead water." Before he drops you at the dry ridge, he adds, "If it's the shrine you want — Old Nan knows its secrets. She's mean, but she's not grey."`),
        next: 'mire_crossroads',
      },
      failure: {
        text: (s, c) => has('gusk_spy')
          ? P(`You notice nothing until the punt lurches. Gusk has leapt clear onto a root and kicked the boat over. You plunge into the cold black water of the leech-pools as he scrambles away, laughing nervously.`)
          : P(`If anything is wrong, you can't see it. Gusk sets you down at a dry ridge in the middle of the fen and wishes you luck.`),
        next: s => has('gusk_spy') ? 'mire_leeches' : 'mire_crossroads',
      },
    },
    {
      label: 'Make friendly conversation',
      check: { skill: 'persuasion', dc: 12 },
      success: {
        effects: () => { if (has('gusk_spy')) flag('mire_warned'); else flag('mire_nan_tip'); },
        text: (s, c) => has('gusk_spy')
          ? P(`${c.char.name} talks about home, about family, about the grey. Gusk's pole stops moving. "I can't do it," he blurts. "They paid me to dump you in the leech-pools. There's a pack of 'em at the shrine." Shame-faced, he takes you to the dry ridge and refuses your coin.`)
          : P(`Gusk warms to ${c.char.name} quickly. By the time he sets you down on a dry ridge, you know about his late wife, his bad knee, and — usefully — that "Old Nan knows how to get past whatever lives in that shrine, if you can stand her."`),
        next: 'mire_crossroads',
      },
      failure: {
        text: (s, c) => has('gusk_spy')
          ? P(`Gusk only grunts at your chatter. Then the punt lurches — he has leapt clear onto a root and kicked it over. You plunge into the cold, writhing water of the leech-pools.`)
          : P(`Gusk answers in grunts. Eventually he sets you down on a dry ridge and poles away without a word.`),
        next: s => has('gusk_spy') ? 'mire_leeches' : 'mire_crossroads',
      },
    },
  ],
};

SCENES.mire_leeches = {
  title: 'The Leech-Pools',
  text: P(`Pale, eyeless leeches as long as your arm surge through the water toward you, their mouths ringed with needle teeth.`),
  choices: s => [{
    label: 'Fight your way to the bank',
    combat: {
      enemies: s => solo() ? [foe('bog_leech'), foe('bog_leech')] : [foe('bog_leech'), foe('bog_leech'), foe('bog_leech')],
      fleeDC: 11,
      win: { text: P(`You crawl out onto a dry ridge, gasping, picking the last severed leech-mouth from your skin.`), next: 'mire_crossroads' },
      flee: { effects: () => { hurtAll('1d4'); }, text: P(`You thrash to the bank and haul yourselves out, trailing blood.`), next: 'mire_crossroads' },
      lose: { effects: () => { doom(1); addGold(-Math.min(G.gold, 10)); }, text: P(`The leeches drag you under. You wake hours later on a mud-bank, drained and shaking, your coin-purse lighter where it tore open. Precious time is lost.`), next: 'mire_crossroads' },
    },
  }],
};

SCENES.mire_crossroads = {
  title: 'The Dry Ridge',
  text: s => P(
    `From the ridge you can see across the fen. To the west, green smoke still rises from the witch's stilt-hut. To the east, the broken spire of the Drowned Shrine leans out of the mist like a crooked finger.`,
    has('mire_warned') && `Thanks to Gusk's confession, you know ${V().minionPlural} are already at the shrine — and they don't know you're coming.`,
    has('mire_tracks') && `The bootprints you found lead straight toward the spire.`,
    has('mire_nan_tip') && `Gusk said Old Nan knows how to get past whatever guards the shrine.`
  ),
  choices: s => [
    { label: 'Visit Old Nan', req: () => !G.visited.mire_nan, next: 'mire_nan' },
    { label: 'Head for the Drowned Shrine', next: 'mire_shrine' },
  ],
};

SCENES.mire_nan = {
  title: 'Old Nan',
  text: s => P(
    `The stilt-hut is hung with bones, bottles and drying frogs. Old Nan is smaller than you expected, and much older, with one milky eye and one that misses nothing. A goat with grey, crumbling patches in its coat bleats miserably in the corner.`,
    `"Florian's hunters," she cackles, before you've said a word. "Come about the Warden, have you? Florian bound it to the shrine with words. Without the words, it'll drown you like kittens." She grins. "I know the words. What's it worth to you?"`
  ),
  choices: s => [
    {
      label: 'Ask about the grey sickness on her goat — and offer to treat it',
      check: { skill: 'medicine', dc: 13, mods: () => [hasClass('cleric') && { label: 'Cleric\'s blessing', value: 2 }] },
      success: {
        effects: () => { flag('mire_words'); addGear('marsh_lantern'); addAlly('nan', 'Old Nan, the bog-witch'); },
        text: (s, c) => P(`${c.char.name} scrapes the grey rot away, packs the wounds with bog-myrtle and a muttered prayer. The goat stops shaking. Old Nan watches in silence, then sniffs hard.`,
          `"Nobody does anything for Nan," she mutters. She teaches you Florian's binding words — <i>"Root to root, I keep my oath"</i> — and presses a lantern of cold green marsh-light into your hands. "It shows the true path. And when you go to face the big one, Nan will be watching."`),
        next: 'mire_shrine',
      },
      failure: {
        effects: () => flag('mire_words'),
        text: (s, c) => P(`${c.char.name} tries, but the rot runs too deep. The goat bleats and kicks. Nan shoos you away from it — but there's something softer in her face.`,
          `"Tried, at least. More than most." She tells you the words — <i>"Root to root, I keep my oath"</i> — and nothing more.`),
        next: 'mire_shrine',
      },
    },
    {
      label: 'Pay for the words (20 gold)', cost: { gold: 20 },
      effects: () => flag('mire_words'),
      text: P(`Nan bites each coin. "Root to root, I keep my oath," she recites. "Say it to the Warden, and say it like you mean it." She turns back to her goat. Your business is done.`),
      next: 'mire_shrine',
    },
    {
      label: `Ask what she knows about ${VILLAINS[G.villain].short}`, once: 'nan_clue',
      effects: () => { G._clue = addClue(); },
      text: s => { const c = G._clue; G._clue = null; return P(`Nan spits into the fire. "Oh, Nan hears things. The frogs talk, the herons talk." Her good eye glitters.`, c ? `<b>${c}</b>` : `"But you know it all already, don't you?"`, `"There. That one was free."`); },
      next: 'mire_nan',
    },
    {
      label: 'Threaten her into talking',
      check: { skill: 'intimidation', dc: 15 },
      success: {
        effects: () => { flag('mire_words'); flag('nan_threatened'); addGear('marsh_lantern'); },
        text: (s, c) => P(`${c.char.name} kicks over her cauldron. Nan shrinks back. "Root to root, I keep my oath! Those are the words! Take the lantern, take it, and get out!"`, `You leave with what you came for. Behind you, she is muttering something that does not sound like a blessing.`),
        next: 'mire_shrine',
      },
      failure: {
        effects: () => flag('nan_curse'),
        text: (s, c) => P(`Nan laughs in ${c.char.name}'s face and flicks a pinch of grey dust into their eyes. "Big brave hunters." When the stinging stops, she is gone, and so is her hut's ladder. You feel her curse settle on you like a wet cloak.`, `<i>(Cursed: −2 to checks at the Drowned Shrine.)</i>`),
        next: 'mire_shrine',
      },
    },
    { label: 'Leave without bargaining', next: 'mire_shrine' },
  ],
};

const mireCount = () => (solo() ? 2 : 3) + (G.doom >= 5 ? 1 : 0);
const nanCurse = () => has('nan_curse') && { label: 'Nan\'s curse', value: -2 };
const lantern = () => hasItem('marsh_lantern') && { label: 'Marsh-lantern', value: 2 };

SCENES.mire_shrine = {
  title: 'The Drowned Shrine',
  text: s => P(
    `The Drowned Shrine is half-sunk in black water: a ring of mossy pillars around a pool, and in the centre, a statue of Florian himself, up to his chest in the fen, his stone axe raised.`,
    `${has('mire_warned') ? 'Just as Gusk warned, ' + numWord(mireCount()) : cap(numWord(mireCount()))} ${V().minionPlural} stand on the pillars, lowering grappling chains into the pool. One of them crows: "I felt it! It's down there!"`,
    hasItem('marsh_lantern') && `Nan's lantern flickers. In its green light you see a hidden line of stepping stones around the back of the shrine, invisible to the naked eye.`,
    (has('mire_warned') || has('mire_tracks')) && `They haven't seen you yet.`
  ),
  choices: s => [
    {
      label: 'Attack while they\'re busy with the chains',
      combat: {
        intro: s => (has('mire_warned') || has('mire_tracks')) ? 'You fall on them from behind. The first one dies without knowing you were there.' : 'They drop their chains and draw steel.',
        actions: s => battleActions('dredge_chain'),
        enemies: s => {
          const n = mireCount();
          const list = []; for (let i = 0; i < n; i++) list.push(minion());
          if (has('mire_warned') || has('mire_tracks')) list.shift();
          return list;
        },
        win: { effects: () => flag('mire_minions_dead'), text: P(`The last cultist topples into the pool. In the silence, the black water begins to bubble.`), next: 'mire_pool' },
        flee: { effects: () => doom(1), text: P(`You retreat into the mist, but the cultists keep dredging. By the time you creep back, they have something on the end of a chain — and the water is heaving.`), next: 'mire_pool' },
        lose: { text: s => P(`You go down on the slick stone. The cultists leave you for dead and haul their chains up — and on the end of one, glittering, is ${regionFrag('mire').name}.`), next: 'mire_lost' },
      },
    },
    {
      label: 'Creep around the back to the pool',
      check: { skill: 'stealth', dc: 14, mods: () => [lantern(), nanCurse()] },
      success: { effects: () => flag('mire_sneaked'), text: (s, c) => P(`${c.char.name} leads you along ${hasItem('marsh_lantern') ? 'the lantern-lit stepping stones' : 'the slick back wall'}, out of sight. You reach the edge of the pool. The cultists, busy with their chains, never look your way.`), next: 'mire_pool' },
      failure: { text: (s, c) => P(`A stone rolls under ${c.char.name}'s foot and splashes into the water. Every head turns.`), next: 'mire_shrine_fight' },
    },
    {
      label: '[Arcana] Ignite the marsh-gas bubbling under their feet',
      req: () => G.party.some(c => c.cls === 'mage' || Character.checkBonus(c, 'arcana').total >= 4),
      check: { skill: 'arcana', dc: 13, mods: () => [nanCurse()] },
      success: {
        effects: () => { flag('mire_minions_dead'); giveXp(60); },
        text: (s, c) => P(`${c.char.name} murmurs a word and flicks a spark into the gas rising between the pillars. The fen erupts in a sheet of blue fire. When the smoke clears, the cultists are gone — blown into the water or fled screaming. The pool is yours.`),
        next: 'mire_pool',
      },
      failure: {
        effects: (s, c) => hurt(c.char, '2d6'),
        text: (s, c) => P(`The gas ignites too early — right under ${c.char.name}. They're thrown backward, singed and smoking, and every cultist turns toward the bang.`),
        next: 'mire_shrine_fight',
      },
    },
    {
      label: 'Signal Old Nan',
      req: () => hasAlly('nan'),
      effects: () => { flag('mire_minions_dead'); giveXp(60); },
      text: P(`You raise the marsh-lantern high. Out across the fen, a dozen green lights answer — will-o'-wisps, bobbing toward the shrine. The cultists stare, then follow them, mesmerised, deep into the mire. You hear splashing, then screams, then nothing. Somewhere, an old woman cackles.`),
      next: 'mire_pool',
    },
  ],
};

SCENES.mire_shrine_fight = {
  title: 'Steel in the Shallows',
  text: s => P(`The ${V().minionPlural} come at you across the slick stones.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('dredge_chain'),
      enemies: s => { const n = mireCount(); const l = []; for (let i = 0; i < n; i++) l.push(minion()); return l; },
      win: { effects: () => flag('mire_minions_dead'), text: P(`The last cultist sinks beneath the black water. Then the pool itself begins to churn.`), next: 'mire_pool' },
      flee: { effects: () => doom(1), text: P(`You fall back into the mist. When you return, the cultists have dredged something up — and the water is heaving.`), next: 'mire_pool' },
      lose: { text: s => P(`You go down on the slick stone. The cultists leave you for dead and haul up their chains — ${regionFrag('mire').name} gleaming on the end of one.`), next: 'mire_lost' },
    },
  }],
};

SCENES.mire_pool = {
  title: 'The Drowned Warden',
  text: s => P(
    `You look into the black pool and see it: <b>${regionFrag('mire').name}</b>, ${regionFrag('mire').desc}, resting on a sunken altar.`,
    `Then the pool heaves. Something vast rises out of it — a hulk of peat and drowned oak, water pouring from it, with a rusted chain around its neck that ends in a plate stamped with Florian's mark. The Drowned Warden. Its hollow eyes find you.`,
    !has('mire_minions_dead') && !has('mire_sneaked') && `The surviving cultists scatter as it rises.`
  ),
  choices: s => [
    {
      label: 'Speak Florian\'s binding words: "Root to root, I keep my oath."',
      req: () => has('mire_words'),
      effects: () => { giveXp(80); },
      text: s => P(`The words leave your lips and the Warden goes still. Slowly — with a sound like a tree falling — it kneels in the water and lowers its great head. Then it reaches into the pool and lifts ${regionFrag('mire').name} out in its mossy fist, offering it to you.`,
        `It has waited a hundred years for someone to say those words. As you take the fragment, the Warden sinks back beneath the water, and is still.`),
      next: 'mire_win',
    },
    {
      label: 'Recall the Keepers\' oath from old ballads',
      req: () => !has('mire_words'),
      check: { skill: 'lore', dc: 15, mods: () => [nanCurse()] },
      success: {
        effects: () => flag('mire_words'),
        text: (s, c) => P(`${c.char.name} digs through half-remembered songs: <i>the woodsman bound the marsh-beast with a promise, root to root…</i> "Root to root, I keep my oath!" The Warden halts mid-lunge and kneels, offering up ${regionFrag('mire').name} from the depths.`),
        next: 'mire_win',
      },
      failure: { text: (s, c) => P(`${c.char.name} shouts every oath they can think of. None of them is the right one. The Warden's fist comes down.`), next: 'mire_warden_fight' },
    },
    {
      label: 'Dive past it and snatch the fragment',
      check: { skill: 'athletics', dc: 15, mods: () => [nanCurse()] },
      success: {
        effects: () => flag('warden_robbed'),
        text: (s, c) => P(`${c.char.name} dives into the freezing water, kicks down past the Warden's legs and closes a fist around the fragment. You haul them out and run, the Warden bellowing behind you. It is bound to the shrine — it cannot follow.`),
        next: 'mire_win',
      },
      failure: {
        effects: (s, c) => hurt(c.char, '2d6'),
        text: (s, c) => P(`${c.char.name} dives — and a hand like a falling log pins them to the bottom. When you drag them out, coughing black water, the Warden is between you and the altar.`),
        next: 'mire_warden_fight',
      },
    },
    hollowOption('Command the Warden in the Hollow\'s voice',
      s => P(`${mostCorrupt().name} opens their mouth and something else speaks — a sound like wind across a field of ash. The Warden freezes. Then, slowly, it sinks to its knees, and its mossy eyes go grey. It lifts the fragment out of the pool and offers it up, trembling.`, `You take it. The Warden does not rise again. You are not sure it is still alive.`),
      'mire_win', 1, () => flag('warden_broken')),
    { label: 'Fight the Warden', next: 'mire_warden_fight' },
  ],
};

SCENES.mire_warden_fight = {
  title: 'The Warden Rises',
  text: P(`The Drowned Warden wades toward you, the water boiling around its knees.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('warden_chain'),
      enemies: s => [foe('warden')],
      fleeDC: 12,
      win: { text: s => P(`The Warden crashes into the pool and breaks apart into peat and rotten timber. The rusted chain slides off its neck. You wade in and lift ${regionFrag('mire').name} from the altar.`), next: 'mire_win' },
      flee: { text: P(`You scramble away from the shrine. The Warden will not follow — but neither can you get past it now.`), next: 'mire_lost' },
      lose: { text: P(`The Warden hurls you out of the shrine like rag dolls. By the time you can stand, the remaining cultists have found a way around it.`), next: 'mire_lost' },
    },
  }],
};

SCENES.mire_win = {
  title: 'Recovered',
  first: s => {
    gainFragment('mire');
    if (has('mire_minions_dead')) G._clue = addClue();
  },
  text: s => {
    const c = G._clue; G._clue = null;
    return P(
      `${regionFrag('mire').name} is heavier than it looks, and warm, as though something inside it is still alive. When you hold it, the grey moss on the nearby trees shrinks back a little.`,
      c && `On the body of the cultist leader you find a sealed letter. Most of it is orders, but one line stops you cold:`,
      c && `<b>${c}</b>`,
      hasAlly('nan') && `As you leave, a green light bobs alongside you to the edge of the fen, then winks out. Old Nan will remember this.`,
      has('nan_threatened') && `As you leave, you feel watched. Old Nan will remember how you treated her.`
    );
  },
  choices: [{ label: 'Leave the fen', next: 'mire_end' }],
};

SCENES.mire_lost = {
  title: 'Lost to the Fen',
  first: s => { loseFragment('mire'); doom(1); },
  text: s => P(
    `By the time you reach the altar, it is bare. Muddy chain-marks lead away into the mist — ${V().minionPlural} carrying ${regionFrag('mire').name} back to ${V().short}.`,
    `You stand in the cold water for a long time. ${V().short} is stronger tonight, and it's your fault.`,
    `<i>But not every fight is won by the axe alone. If ${V().short} carries this piece, you may yet take it back from ${V().object}.</i>`
  ),
  choices: [{ label: 'Leave the fen', next: 'mire_end' }],
};

SCENES.mire_end = {
  title: 'Leaving the Mirewood',
  first: s => finishRegion('mire'),
  text: s => P(`The fen closes behind you. The road back toward Hearthmoor winds through grey-touched hills.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
