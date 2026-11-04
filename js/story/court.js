/* ===========================================================
   REGION: CASTLE VARRIC — the Gilded Court
   Lord Varric owns a fragment as a family heirloom — and is quietly
   selling it to the villain at tonight's masquerade.
   Key flags: court_invited, court_proof, imra ally, court_duel_won
   =========================================================== */

SCENES.court_start = {
  title: 'Castle Varric',
  text: s => P(
    raidLine('court'),
    twistLine('court'),
    `Castle Varric sits on a lake like a jewel in a dish: white towers, gilded roofs, and not a speck of grey on any of it. Lord Aurel Varric has kept the Hollow from his lands, they say, by "excellent diplomacy".`,
    `Generations ago the Varrics were Keepers. Now they are merely rich — and among their heirlooms is <b>${regionFrag('court').name}</b>, displayed in the great hall like a trophy.`,
    `Tonight is Lord Varric's midsummer masquerade. Half the nobility of the valley will be there. And according to a stable-hand who sold you the gossip for a copper, so will a guest in a grey mask who arrived three days ago with a chest of gold and a ring bearing ${V().sigil}.`
  ),
  choices: s => [
    {
      label: 'Talk your way into the masquerade',
      check: { skill: 'persuasion', dc: 13 },
      success: { effects: () => flag('court_invited'), text: (s, c) => P(`${c.char.name} charms the steward with a story about a distant barony and a lost invitation. He produces masks — a fox and an owl — and bows you through.`), next: 'court_ball' },
      failure: { text: P(`The steward looks at your boots and says no. Politely. Then less politely.`), next: 'court_walls' },
    },
    { label: 'Buy masks and fine clothes from a tailor in town (25 gold)', cost: { gold: 25 }, effects: () => flag('court_invited'), text: P(`Nobody looks twice at nobles in silk. You walk in through the front door with the rest of them.`), next: 'court_ball' },
    { label: 'Find another way in', next: 'court_walls' },
  ],
};

SCENES.court_walls = {
  title: 'The Servants\' Way',
  text: P(`There is always another way into a castle: kitchens, laundries, the boats that bring fish across the lake at dusk.`),
  choices: s => [
    {
      label: 'Slip in with the fish-boats',
      check: { skill: 'stealth', dc: 13 },
      success: { text: (s, c) => P(`You come in smelling of trout, through the kitchen, past a cook who is too busy screaming at a sauce to notice you. A laundry hamper provides masks and something to wear.`), next: 'court_ball' },
      failure: { effects: () => flag('court_alert'), text: P(`A guard sees you climb out of the boat. You talk your way past him as servants — but he'll remember your faces, and he will be watching.`), next: 'court_ball' },
    },
    {
      label: 'Find the girl in the tower window who has been watching you',
      effects: () => flag('court_imra_met'),
      text: P(`A young woman leans out of a tower window, watching you circle the walls. She drops a rope ladder without a word. Inside, she introduces herself: "Lady Imra Varric. My father is about to do something unforgivable, and I'd like someone to stop him. You look like you might." She hands you masks.`),
      next: 'court_ball',
    },
  ],
};

SCENES.court_ball = {
  title: 'The Masquerade',
  text: s => P(
    `The great hall glitters: candles in their thousands, a lake-breeze through tall windows, dancers in gold and green. On a pedestal under glass, lit like a holy relic, lies ${regionFrag('court').name}.`,
    `Lord Varric holds court by the pedestal — a handsome, tired man in a lion mask. Beside him stands a figure in a plain grey mask who does not dance, does not drink, and does not take their eyes off the glass.`,
    has('court_imra_met') ? `Lady Imra catches your eye across the room and nods toward a door: <i>his study</i>.` : `A young woman in a swan mask is watching her father with an expression of pure misery.`,
    has('court_alert') && `The guard from the boats is here, scanning masks.`
  ),
  choices: s => [
    {
      label: 'Search Varric\'s study for proof of the deal',
      check: { skill: 'investigation', dc: s => has('court_imra_met') ? 11 : 14, mods: () => [has('court_alert') && { label: 'Watched by the guard', value: -2 }] },
      success: { effects: () => { flag('court_proof'); G._clue = addClue(); }, text: (s, c) => { const cl = G._clue; G._clue = null; return P(`${c.char.name} finds it in a locked drawer: a contract, signed by Varric and sealed with ${V().sigil}. The fragment, in exchange for the Hollow sparing Varric's lands. And folded inside it, a letter from ${V().short}'s own hand:`, cl && `<b>${cl}</b>`); }, next: 'court_ball2' },
      failure: { effects: () => flag('court_alert'), text: P(`A footman finds you elbow-deep in the Lord's desk. You get away with a story about looking for the privy, but now the whole household is watching you.`), next: 'court_ball2' },
    },
    {
      label: 'Dance with the swan-masked woman and listen', once: 'court_dance', req: () => !has('court_imra_trust'),
      check: { skill: 'insight', dc: 12 },
      success: { effects: () => { flag('court_imra_met'); flag('court_imra_trust'); }, text: (s, c) => P(`She dances stiffly, and after a while she whispers: "You aren't nobles. Good. My name is Imra — my father is selling the relic tonight, to the grey mask. He thinks it will save us. It won't. Help me stop him." She presses a key into ${c.char.name}'s palm. "His study."`), next: 'court_ball' },
      failure: { text: P(`She is polite and distant, and the dance ends. Whatever she's thinking, she keeps it to herself.`), next: 'court_ball2' },
    },
    { label: 'Watch and wait for the exchange', next: 'court_ball2' },
  ],
};

SCENES.court_ball2 = {
  title: 'The Midnight Toast',
  text: s => P(
    `At midnight, Lord Varric calls for silence and raises his glass. "To peace," he says, "and to new friends." The grey mask steps up to the pedestal. A servant lifts the glass case.`,
    `The stable-hand's gossip was right about one more thing: the grey mask has an accomplice among the guests, ready to carry the fragment out while every eye is on the toast.`,
    `It's now or never.`
  ),
  choices: s => [
    {
      label: 'Expose the deal before the whole court',
      req: () => has('court_proof'), showLocked: true, hint: has('court_proof') ? undefined : 'You need proof of the deal',
      check: { skill: 'persuasion', dc: s => has('court_imra_trust') ? 10 : 13 },
      success: {
        effects: () => { flag('court_exposed'); addAlly('imra', 'Lady Imra and the guard of Castle Varric'); chronicle('Exposed Lord Varric\'s bargain with the enemy before his whole court.'); },
        text: (s, c) => P(`${c.char.name} climbs on a chair and reads the contract aloud. The music stops. Every masked face turns to Lord Varric. ${has('court_imra_trust') || has('court_imra_met') ? 'Lady Imra steps forward: "It\'s true. I saw him sign it."' : ''}`,
          `Varric goes white. The grey mask hisses and draws a blade. And the court guard — sworn to House Varric, not to its lord's secret friends — draws theirs too.`),
        next: 'court_fight',
      },
      failure: { effects: () => flag('court_alert'), text: P(`The nobles laugh. "Forgeries," Varric says smoothly. "Guards." The grey mask is already reaching for the fragment.`), next: 'court_duel_call' },
    },
    {
      label: 'Find the grey mask\'s accomplice among the guests', hint: '🧩 Deduction — accuse the right masked guest',
      puzzle: { type: 'whodunit', key: 'court_who', clueBonus: () => (has('court_proof') ? 1 : 0) + (has('court_imra_trust') ? 1 : 0) },
      solved: {
        effects: () => { flag('court_exposed'); addAlly('imra', 'Lady Imra and the guard of Castle Varric'); chronicle('Unmasked the enemy\'s accomplice at Lord Varric\'s masquerade.'); },
        text: (s, ctx) => P(`"The ${ctx.accused}," you say, loud enough for the hall. The ${ctx.accused} bolts — and the house guard tackles them in a crash of silver plates. Out of their sleeve falls a velvet bag, cut to the exact size of ${regionFrag('court').name}.`, `The grey mask hisses and draws a blade. But now the whole court is watching — and the guard is on your side.`),
        next: 'court_fight',
      },
      failed: { effects: () => flag('court_alert'), text: (s, ctx) => P(`"The ${ctx.accused}!" you cry. The ${ctx.accused} — a very old, very deaf duke — looks around in bewilderment. The court roars with laughter. In the commotion, the ${ctx.agentMask} slips quietly toward the pedestal.`), next: 'court_duel_call' },
    },
    {
      label: 'Challenge the grey mask to a duel of honour',
      effects: () => flag('court_challenge'),
      text: s => P(`"Sir!" ${G.party[0].name} calls out. "You insult this house by your presence. I demand satisfaction." The court gasps with delight. A duel at a masquerade! The grey mask cannot refuse without disgracing Varric — and Varric, sweating, cannot let them.`),
      next: 'court_duel',
    },
    {
      label: 'Snatch the fragment in the confusion of the toast',
      check: { skill: 'sleight', dc: 15, mods: () => [has('court_alert') && { label: 'Watched', value: -2 }] },
      success: { effects: () => flag('court_stole'), text: (s, c) => P(`As a hundred glasses rise, ${c.char.name} brushes past the pedestal. When the grey mask reaches into the case, it is empty. By then you are halfway down the servants' stair.`), next: 'court_escape' },
      failure: { text: (s, c) => P(`${c.char.name}'s fingers close on the fragment — and a gloved hand closes on their wrist. The grey mask. "Thief," it says pleasantly.`), next: 'court_fight' },
    },
  ],
};

SCENES.court_duel_call = {
  title: 'No Way Out But Through',
  text: P(`The guards are closing. The grey mask has the case open. There's only one thing left to try.`),
  choices: s => [
    { label: 'Challenge the grey mask to a duel', next: 'court_duel' },
    { label: 'Fight your way to the fragment', next: 'court_fight' },
  ],
};

SCENES.court_duel = {
  title: 'A Duel at Midnight',
  text: s => P(`The dancers clear a circle. The grey mask draws a slim, ugly blade. "First blood?" ${G.party[0].name} asks. "To the death," says the mask.`, solo() ? '' : `By the old rules, only one of you may fight.`),
  choices: s => [{
    label: 'Duel!',
    combat: {
      intro: 'The court holds its breath.',
      enemies: s => [foe('court_blade', { name: 'The Grey Mask' })],
      actions: s => battleActions('chandelier', 'wine_toss'),
      fleeable: false, noSurrender: true,
      win: {
        effects: () => { flag('court_duel_won'); addAlly('imra', 'Lady Imra and the guard of Castle Varric'); chronicle('Won a duel to the death at Lord Varric\'s masquerade.'); },
        text: s => P(`The grey mask falls. The court erupts — applause, screams, a fainting countess. When the mask is lifted, the face beneath is grey and dead-eyed: one of ${V().short}'s creatures.`,
          `Lord Varric sags into a chair. Lady Imra lifts ${regionFrag('court').name} from the case herself and puts it into your hands. "My family were Keepers once," she says. "I'd like us to be again."`),
        next: 'court_win',
      },
      lose: { text: s => P(`You fall on the polished floor. The grey mask takes the fragment from the case, bows mockingly to the court, and walks out through the open window into the night.`), next: 'court_lost' },
    },
  }],
};

SCENES.court_fight = {
  title: 'Steel in the Ballroom',
  text: s => P(has('court_exposed') ? `The court guard surrounds the grey mask's bodyguards. Nobles flee screaming in every direction.` : `Varric's guards — paid to look the other way — come at you alongside the grey mask's bodyguards.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      enemies: s => [foe('court_blade', { name: 'The Grey Mask' }), foe('thug', { name: 'Masked Bodyguard' })].concat(has('court_exposed') || solo() ? [] : [foe('thug', { name: 'Hired Guard' })]),
      actions: s => battleActions('chandelier', 'wine_toss'),
      allyStrikes: s => has('court_exposed') ? [{ name: 'The court guard', verb: 'cut at', dmg: '1d8+1' }] : [],
      win: { text: s => P(`The grey mask falls among the toppled candles. You take ${regionFrag('court').name} from its case as the last nobles flee.`), next: 'court_win' },
      flee: { text: P(`You crash out through a window into the lake. By the time you swim ashore, the grey mask and the fragment are gone.`), next: 'court_lost' },
      lose: { text: P(`You go down under the candles. When you wake in a cell, the fragment is long gone.`), next: 'court_lost' },
    },
  }],
};

SCENES.court_escape = {
  title: 'Across the Lake',
  text: P(`Shouts behind you. Bells. The servants' stair ends at the water, and the fish-boats are tied up below.`),
  choices: s => [{
    label: 'Row for the far shore',
    check: { skill: 'athletics', dc: 12 },
    success: { text: P(`You row until your arms burn. Behind you, torches move on the castle walls, but no boat follows fast enough.`), next: 'court_win' },
    failure: { text: P(`A boat full of guards cuts you off in the middle of the lake. The grey mask stands in its prow.`), next: 'court_fight' },
  }],
};

SCENES.court_win = {
  title: 'Recovered',
  first: s => { gainFragment('court'); },
  text: s => P(
    `<b>${regionFrag('court').name}</b> — ${regionFrag('court').desc} — is yours.`,
    hasAlly('imra') && `Lady Imra walks you to the lake's edge at dawn. Behind her, her father is under guard in his own tower. "When you march," she says, "Castle Varric marches with you. We owe the world that much."`,
    has('court_stole') && `Lord Varric's lands will not be spared after all. Neither, you suspect, will Lord Varric.`
  ),
  choices: [{ label: 'Leave Castle Varric', next: 'court_end' }],
};

SCENES.court_lost = {
  title: 'Gone into the Night',
  first: s => { loseFragment('court'); doom(1); },
  text: s => P(`${regionFrag('court').name} is gone, carried off to ${V().short}. Lord Varric wrings his hands and assures you the arrangement was "strictly diplomatic". Behind him, Lady Imra is crying with rage.`),
  choices: [{ label: 'Leave Castle Varric', next: 'court_end' }],
};

SCENES.court_end = {
  title: 'The Lake Road',
  first: s => finishRegion('court'),
  text: P(`The white towers shrink behind you, reflected in the still water.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
