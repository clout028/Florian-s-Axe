/* ===========================================================
   REGION: SALTCLIFF HARBOR — the midnight auction
   Key flags: harbor_vosk_listening, harbor_proof, harbor_suspect,
   vosk ally, harbor_exposed
   =========================================================== */

const QUILL = () => `Master Quill`;
const quillFoe = () => foe({ name: 'Master Quill', hp: 26, ac: 13, atk: 4, dmg: '1d8+2', xp: 90 });

SCENES.harbor_start = {
  title: 'Saltcliff Harbor',
  text: s => P(
    raidLine('harbor'),
    `Saltcliff is a stack of whitewashed houses clinging to chalk cliffs above a harbor full of ships that fly no flags. Everyone here is selling something, and everyone is watching everyone else.`,
    `It doesn't take long to learn what you came to learn. Years ago, fishermen dredged up a strange relic from the wreck of a Keeper ship. It passed from hand to hand until it reached <b>Captain Maree Vosk</b>, queen of the Saltcliff smugglers. Tonight at midnight, aboard her ship the <i>Gilded Gull</i>, she's auctioning it off: <b>${regionFrag('harbor').name}</b>.`,
    `The favourite to win is a soft-spoken buyer called ${QUILL()}, who arrived three days ago with a chest of gold and a ring bearing ${V().sigil}.`
  ),
  choices: s => [
    { label: 'Buy a seat at the auction (30 gold)', cost: { gold: 30 }, hint: '30 gold', text: P(`A bored clerk takes your gold and hands you a brass token stamped with a gull.`), next: 'harbor_auction' },
    {
      label: 'Forge an invitation',
      check: { skill: 'deception', dc: 13, mods: () => [hasItem('thieves_tools') && { label: 'Thieves\' tools', value: 1 }] },
      success: { text: (s, c) => P(`${c.char.name} spends an hour at a tavern table with ink, wax and a borrowed signet. The result is better than the real thing. The doorman waves you aboard.`), next: 'harbor_auction' },
      failure: { effects: () => flag('harbor_suspect'), text: (s, c) => P(`The doorman holds ${c.char.name}'s invitation up to the lantern and smiles. "Nice try." Two very large sailors escort you off the gangplank. You'll have to find another way aboard.`), next: 'harbor_docks' },
    },
    {
      label: 'Sneak aboard with the cargo',
      check: { skill: 'stealth', dc: 13 },
      success: { text: (s, c) => P(`${c.char.name} slips between the stevedores and you ride a crate of wine down into the Gull's hold.`), next: 'harbor_hold' },
      failure: { effects: () => flag('harbor_suspect'), text: P(`A dockhand spots you and raises the alarm. You scatter into the alleys before anyone can catch you — but the gangplank will be watched now.`), next: 'harbor_docks' },
    },
    {
      label: 'Seek out Captain Vosk and warn her about her buyer',
      check: { skill: 'persuasion', dc: 14 },
      success: {
        effects: () => flag('harbor_vosk_listening'),
        text: (s, c) => P(`You find Vosk in a dockside tavern, boots on the table. She listens to ${c.char.name} with a cold, amused face — but when you mention ${V().sigil}, her smile thins. "I've heard of that sign. Bad for business." She flips you an auction token. "Bring me proof, and we'll talk. Until then, I sell to whoever pays."`),
        next: 'harbor_auction',
      },
      failure: { effects: () => flag('harbor_suspect'), text: P(`Vosk laughs in your faces. "Everyone who loses an auction says the winner is a villain." Her bodyguards walk you to the door. The gangplank will be closed to you now.`), next: 'harbor_docks' },
    },
    {
      label: '[Rogue] Look up the local thieves\' guild',
      req: () => hasClass('rogue'),
      effects: () => flag('harbor_proof'),
      text: s => P(`${classChar('rogue').name} knows the signs. Three chalk marks and a password later, you're drinking with a one-eyed fence called Mags. "Quill? He's been buying lamp-oil. Barrels of it. Grey stuff that smells like a crypt." She sells you a way into the Gull's hold for a song — and a warning: "Whatever he's planning, he's not planning to sail home."`),
      next: 'harbor_hold',
    },
  ],
};

SCENES.harbor_docks = {
  title: 'The Anchor Chain',
  text: P(`Midnight is close. The <i>Gilded Gull</i> rides at anchor, lanterns blazing on her deck. The gangplank is guarded — but her great anchor chain runs down into the black water on the seaward side, where no one is looking.`),
  choices: s => [
    {
      label: 'Swim out and climb the anchor chain',
      check: { skill: 'athletics', dc: 13 },
      success: { text: (s, c) => P(`The water is cold enough to stop your heart. ${c.char.name} goes up the chain hand over hand and helps you over the rail into the shadows by the hold-hatch.`), next: 'harbor_hold' },
      failure: {
        effects: (s, c) => hurt(c.char, '1d6'),
        text: (s, c) => P(`Halfway up, ${c.char.name}'s grip fails on the wet links. You fall back into the sea with a crash. By the time dockhands have fished you out, cursing, the auction is over. Across the harbor, a small boat is pulling away from the <i>Gull</i>, a lantern at its prow. ${QUILL()} won.`),
        next: 'harbor_chase',
      },
    },
  ],
};

SCENES.harbor_hold = {
  title: 'The Gull\'s Hold',
  text: s => P(
    `The hold is dark and smells of tar. Over your heads, you hear footsteps and laughter as the auction begins. Lantern-light leaks through a door at the stern: the strongroom, where the prize is kept until the bidding is over.`,
    `Between you and it, wedged among the wine-crates, are a dozen barrels that weren't on any manifest. One has been cracked. The liquid inside is grey and smells like a grave. <b>Hollow-oil.</b> Enough to turn the <i>Gilded Gull</i> and everyone on her into a pyre.`,
    `${QUILL()} isn't planning to pay. He's planning to burn the ship and everyone aboard it once the fragment is in his hands.`
  ),
  choices: s => [
    {
      label: 'Pick the strongroom lock and steal the fragment now',
      check: { skill: 'sleight', dc: 14, mods: () => [hasItem('thieves_tools') && { label: 'Thieves\' tools', value: 2 }] },
      success: { effects: () => flag('harbor_stole'), text: (s, c) => P(`The lock is good. ${c.char.name} is better. Inside, on velvet, lies ${regionFrag('harbor').name}. You tuck it away and slip back toward the hatch.`), next: 'harbor_escape' },
      failure: { text: (s, c) => P(`The lock snaps a pick off in ${c.char.name}'s fingers and a hidden bell jangles. Boots thunder down the ladder: Quill's men, with Quill behind them. "Ah," he says mildly. "Thieves."`), next: 'harbor_fight' },
    },
    {
      label: 'Crack the strongroom\'s combination lock', hint: '🧩 Code lock — sea-sigils instead of runes',
      puzzle: { type: 'code', key: 'harbor_lock', title: 'Vosk\'s strongroom', flavor: 'A brass lock with four dials. Smugglers\' locks are simple, but they are never kind.', harder: true, hintLabel: 'Look for scratches round the dials', giveUpLabel: 'Leave it' },
      solved: { effects: () => flag('harbor_stole'), text: s => P(`The lock opens with a soft click. Inside, on velvet, lies ${regionFrag('harbor').name}. You tuck it away and slip back toward the hatch.`), next: 'harbor_escape' },
      failed: { text: P(`One wrong turn too many, and a hidden bell jangles. Boots thunder down the ladder: Quill's men, with Quill behind them. "Ah," he says mildly. "Thieves."`), next: 'harbor_fight' },
    },
    {
      label: 'Take a sample of the oil as proof and go up to the auction',
      effects: () => flag('harbor_proof'),
      text: P(`You fill a flask with the stinking grey oil and climb the ladder up onto the lantern-lit deck, where the bidding has already begun.`),
      next: 'harbor_auction',
    },
  ],
};

SCENES.harbor_auction = {
  title: 'The Midnight Auction',
  text: s => P(
    `The deck of the <i>Gilded Gull</i> is crowded with Saltcliff's richest and least honest. Captain Vosk stands at the mast beside a velvet cushion where ${regionFrag('harbor').name} glitters in the lamplight.`,
    `"Five hundred crowns," says ${QUILL()} softly, and the crowd murmurs. No one here can match that.`,
    has('harbor_proof') && `You feel the flask of Hollow-oil in your pocket. Proof.`,
    has('harbor_vosk_listening') && `Vosk catches your eye across the deck and raises one eyebrow: <i>well?</i>`
  ),
  choices: s => [
    {
      label: `Expose ${QUILL()} in front of everyone`,
      check: { skill: 'persuasion', dc: s => 16 - (has('harbor_proof') ? 3 : 0) - (has('harbor_vosk_listening') ? 2 : 0) },
      success: {
        effects: () => { flag('harbor_exposed'); },
        text: (s, c) => P(`${c.char.name} steps up onto a crate and tells them all: the ring, the sign, ${has('harbor_proof') ? 'the barrels of Hollow-oil in the hold — and holds up the flask, letting them smell it' : 'the strange cargo he\'s been buying all week'}. "He means to burn this ship with all of you on it."`,
          `Silence. Then Vosk draws her cutlass. "Search the hold." It takes her sailors a minute to find the barrels. Quill doesn't wait for them to come back — he and his hired thugs draw steel.`),
        next: 'harbor_fight',
      },
      failure: { text: (s, c) => P(`The crowd laughs at ${c.char.name}. Quill smiles thinly. "Sore losers." Vosk bangs her gavel. "Sold, to Master Quill." The fragment goes into a lacquered box under his arm, and he heads for his boat.`), next: 'harbor_chase_choice' },
    },
    hollowOption(`Whisper fear into ${QUILL()}'s mind`,
      s => P(`${mostCorrupt().name} catches Quill's eye across the deck and lets the grey look out of theirs. Quill goes white. His hands start to shake. "I — I withdraw my bid," he stammers, and flees the ship. With no one to match it, Vosk sells you the fragment for a song.`, `Later, you hear that Quill threw himself into the harbor that night. He kept saying the grey was watching him.`),
      'harbor_win', 1, () => { addGold(-Math.min(G.gold, 15)); flag('quill_broken'); }),
    {
      label: 'Snatch the fragment from the cushion and run',
      check: { skill: 'acrobatics', dc: 14 },
      success: { effects: () => flag('harbor_stole'), text: (s, c) => P(`${c.char.name} vaults a table, scoops ${regionFrag('harbor').name} off the cushion and is over the rail before anyone can shout. You land on the quay running.`), next: 'harbor_escape' },
      failure: { text: (s, c) => P(`${c.char.name} gets a hand on the cushion — and Vosk's boot on their wrist. "Bad manners," she says. Quill's thugs are already closing in, scenting an excuse.`), next: 'harbor_fight' },
    },
    {
      label: 'Bid everything you have and appeal to Vosk\'s pride',
      req: () => G.gold >= 40, showLocked: true, hint: 'Requires at least 40 gold',
      check: { skill: 'persuasion', dc: 13, mods: () => [has('harbor_vosk_listening') && { label: 'Vosk is curious', value: 2 }] },
      success: {
        effects: () => { addGold(-G.gold); flag('harbor_bought'); },
        text: (s, c) => P(`${c.char.name} empties your purse onto the cushion. "It's not five hundred crowns. But you'd be selling Florian's Axe to the people who want to end the world, captain — and I hear you like the world. It's where you keep your money."`,
          `The deck goes quiet. Vosk laughs out loud. "Sold — to the honest fools." Quill's face goes very still. He leaves without a word.`),
        next: 'harbor_win',
      },
      failure: { effects: () => {}, text: P(`Vosk weighs your purse in her palm and tosses it back. "Sentiment doesn't pay for ships." The gavel falls. Quill tucks the fragment under his arm and heads for his boat.`), next: 'harbor_chase_choice' },
    },
  ],
};

SCENES.harbor_fight = {
  title: 'Blood on the Deck',
  text: s => P(has('harbor_exposed') ? `Vosk's sailors pour onto the deck behind you, cutlasses out.` : `There's no talking your way out of this.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('rigging', 'barrels'),
      enemies: s => [quillFoe(), foe('thug')].concat(solo() || has('harbor_exposed') ? [] : [foe('thug')]),
      allyStrikes: s => has('harbor_exposed') ? [{ name: 'Vosk\'s sailors', verb: 'slash at', dmg: '1d8+1' }] : [],
      win: { effects: () => flag('harbor_quill_dead'), text: P(`${QUILL()} falls to the deck, his ring rolling away across the planks.`), next: 'harbor_win' },
      flee: { text: P(`You leap over the rail into the black water. By the time you surface, Quill's boat is already pulling away.`), next: 'harbor_chase_choice' },
      lose: { text: P(`You're beaten and thrown over the rail. By the time you drag yourselves onto the quay, Quill's boat is a lantern vanishing out to sea.`), next: 'harbor_lost' },
    },
  }],
};

SCENES.harbor_escape = {
  title: 'Over the Rooftops',
  text: P(`Shouts behind you. Whistles. Quill's thugs pour down the gangplank after you, and you take to the rooftops of Saltcliff, slates sliding under your boots.`),
  choices: s => [{
    label: 'Run!',
    check: { skill: 'acrobatics', dc: 13 },
    success: { text: (s, c) => P(`${c.char.name} leads you across the roofs, leaping gaps, sliding down a laundry line. The shouts fade. You're clear — and the fragment is safe.`), next: 'harbor_win' },
    failure: { effects: (s, c) => hurt(c.char, '1d6'), text: (s, c) => P(`${c.char.name} misjudges a jump and crashes into an alley. Before you can get up, Quill's thugs block both ends.`), next: 'harbor_alley' },
  }],
};

SCENES.harbor_alley = {
  title: 'Cornered',
  text: P(`Two thugs with cudgels close in. "Hand it over and we'll only break your legs."`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('barrels'),
      enemies: s => [foe('thug'), foe('thug')],
      win: { text: P(`The thugs lie groaning. You slip away into the night with the fragment.`), next: 'harbor_win' },
      flee: { text: P(`You break free and run, but in the struggle the fragment is torn from your grip. Behind you, a thug whoops in triumph.`), next: 'harbor_lost' },
      lose: { text: P(`The cudgels come down. When you wake in the gutter, the fragment is gone.`), next: 'harbor_lost' },
    },
  }],
};

SCENES.harbor_chase_choice = {
  title: 'The Boat in the Dark',
  text: s => P(`${QUILL()}'s boat pulls away from the <i>Gull</i> with the fragment aboard, rowing hard for a sleek black cutter waiting beyond the harbor mouth. If he reaches it, he's gone.`),
  choices: s => [
    { label: 'Steal a skiff and give chase', next: 'harbor_chase' },
    { label: 'Let it go', text: P(`You watch the lantern dwindle until it's swallowed by the dark.`), next: 'harbor_lost' },
  ],
};

SCENES.harbor_chase = {
  title: 'Chase on the Water',
  text: s => P(`You cut loose a fishing skiff and row for all you're worth after the lantern. ${QUILL()}'s oarsmen are strong, but their boat is heavy.`),
  choices: s => [{
    label: 'Row with everything you have',
    check: { skill: 'athletics', dc: 13 },
    success: { text: (s, c) => P(`${c.char.name} pulls until their hands bleed. The skiff closes the gap and slams into Quill's boat. He stands, sword in hand. "Persistent," he sighs.`), next: 'harbor_boat_fight' },
    failure: { text: P(`You're gaining — and then you aren't. The lantern reaches the black cutter, and her sails fill. She's gone before you're halfway there.`), next: 'harbor_lost' },
  }],
};

SCENES.harbor_boat_fight = {
  title: 'Steel on the Swell',
  text: P(`The two boats rock together, slapping waves. Quill and his oarsman come at you.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('rigging'),
      enemies: s => [quillFoe(), foe('thug')],
      fleeable: false,
      win: { effects: () => flag('harbor_quill_dead'), text: P(`Quill topples into the sea. His lacquered box floats for a moment before you grab it.`), next: 'harbor_win' },
      lose: { text: P(`You're knocked into the water. Quill's boat rows on, and by the time you've climbed back into your skiff, it has reached the cutter.`), next: 'harbor_lost' },
    },
  }],
};

SCENES.harbor_win = {
  title: 'Recovered',
  first: s => {
    gainFragment('harbor');
    if (has('harbor_exposed') || has('harbor_bought')) { addAlly('vosk', 'Captain Vosk and her smugglers'); chronicle('Earned the friendship of Captain Maree Vosk of Saltcliff.'); }
  },
  text: s => {
    return P(
      `<b>${regionFrag('harbor').name}</b> — ${regionFrag('harbor').desc} — is yours.`,
      has('harbor_quill_dead') && G.clues.length < V().clues.length && `In ${QUILL()}'s coat you find a waxed packet of letters from his master, written in cipher.`,
      hasAlly('vosk') && `At dawn, Captain Vosk finds you on the quay. "You saved my ship and my neck," she says. "I don't like owing people. When you go after the one who sent Quill, send word. My crew knows every back door in the kingdom."`,
      has('quill_broken') && `Captain Vosk watches you leave Saltcliff with narrowed eyes. Whatever you did to Quill, she wants no part of it.`,
      has('harbor_stole') && !hasAlly('vosk') && `You leave Saltcliff before Vosk can find out who robbed her. You doubt she'll be sending you any presents.`
    );
  },
  choices: s => [has('harbor_quill_dead') && cipherChoice('harbor_letter', 'harbor_end', 'Decipher Quill\'s letters'), { label: 'Leave Saltcliff', next: 'harbor_end' }],
};

SCENES.harbor_lost = {
  title: 'Gone to Sea',
  first: s => { loseFragment('harbor'); doom(1); },
  text: s => P(`The black cutter vanishes over the horizon, carrying ${regionFrag('harbor').name} to ${V().short}. Saltcliff goes back to its business as though nothing happened. For Saltcliff, nothing has.`),
  choices: [{ label: 'Leave Saltcliff', next: 'harbor_end' }],
};

SCENES.harbor_end = {
  title: 'The Coast Road',
  first: s => finishRegion('harbor'),
  text: P(`Gulls wheel over the chalk cliffs behind you as you take the coast road back inland.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
