/* ===========================================================
   THE LIVING VILLAIN — the enemy acts while you travel.
   - After journey 1: a raid on one of the places you haven't reached.
     Go there next and you can stop it; go elsewhere and it succeeds.
   - After journey 2: a night assault on Hearthmoor itself.
   - After journey 3 (if Doom is high): an ally is taken captive.
   - Between journeys: taunting visions that react to what you did.
   =========================================================== */

const VOICES = {
  morvane: {
    open: 'The ash in the fire rises and makes a face. Morvane\'s voice crackles out of the flames.',
    wonFrag: f => `"You took ${f}. Do you know what it cost me to find? No matter. Every piece you gather, you carry to me."`,
    lostFrag: f => `"${cap(f)} sits on my table now. It hums when I touch it. It knows its true heir."`,
    mercy: '"You let my servants live. How very like a Keeper — soft-hearted, and certain of it."',
    cruelty: '"You killed them on their knees. Oh, I like you. We are more alike than you think."',
    corrupt: n => `"${n}. I can see the grey in you from here. It suits you. Why fight what you are becoming?"`,
    rivalSpared: '"Sable came back to me with your mercy on her face like a brand. I may have to burn it off."',
    rivalSlain: '"Sable is dead. She was the closest thing I had to a friend. I will remember that, when I find you."',
    close: '"Come to the Spire. I will be waiting. I have been waiting thirty years."',
  },
  abbess: {
    open: 'The fire goes pale and still. A woman\'s voice, gentle as a lullaby, speaks out of it.',
    wonFrag: f => `"You carry ${f} now. Such a heavy thing. Wouldn't you like to put it down? Wouldn't you like to rest?"`,
    lostFrag: f => `"${cap(f)} is mine. When I break it, the grieving will stop. Yours too."`,
    mercy: '"You spared my children. Thank you. I mean it. I do not want anyone to suffer — not even you."',
    cruelty: '"You killed them kneeling. I will pray for them. I will pray for you, too. You need it more."',
    corrupt: n => `"${n}, little one. You feel it, don't you? The quiet. The peace. You're so close."`,
    rivalSpared: '"Brother Hollis came back to me weeping. You did that. Such cruelty, to show a man mercy he cannot bear."',
    rivalSlain: '"Brother Hollis is at peace now. You gave him what I promised him. Strange, isn\'t it?"',
    close: '"Come to the cathedral. Lissa wants to meet you."',
  },
  kharsk: {
    open: 'The fire roars up, red as iron in a forge, and a deep voice growls out of it.',
    wonFrag: f => `"You stole ${f} from under my scouts. Good. I respect a thief who doesn't hide. It will make killing you an honour."`,
    lostFrag: f => `"${cap(f)} is mine. My people will eat this winter because of it. Can you say the same of yours?"`,
    mercy: '"You let my raiders walk. They told me. Some of them are asking questions now. I hate you for that."',
    cruelty: '"You butchered men on their knees. My clan has a word for people like you. It is not a kind word."',
    corrupt: n => `"${n}. The grey is in you. I know the look — I see it every night, in my son's eyes."`,
    rivalSpared: '"Grutha came home. She will not say what you said to her. She will not meet my eyes."',
    rivalSlain: '"Grutha is dead. She carried me off the field at Tarn when I was nineteen. I will carry your head off mine."',
    close: '"Come to Blackscar. Come and see what I am fighting for."',
  },
};

/* ---------------- Visions on the road ---------------- */
SCENES.vision = {
  title: 'A Voice in the Fire',
  enter: s => { flag('vision_' + G.regionsDone.length); },
  text: s => {
    const v = VOICES[G.villain];
    const last = G.regions.find(r => r === G.regionsDone[G.regionsDone.length - 1]);
    const f = last && G.fragLoc[last];
    const lines = [`That night, camped on the road, the fire suddenly gutters. ${v.open}`];
    if (f) lines.push(G.fragments[f] === 'party' ? v.wonFrag(FRAGMENTS[f].name) : v.lostFrag(FRAGMENTS[f].name));
    if (G.rival.slain && !has('voice_rival')) { flag('voice_rival'); lines.push(v.rivalSlain); }
    else if (G.rival.spared && !has('voice_rival')) { flag('voice_rival'); lines.push(v.rivalSpared); }
    else if ((G.flags.cruelty || 0) > (G.flags.mercy || 0) && G.flags.cruelty) lines.push(v.cruelty);
    else if (G.flags.mercy) lines.push(v.mercy);
    if (maxCorruption() >= 3) lines.push(v.corrupt(mostCorrupt().name));
    lines.push(v.close);
    return P(...lines);
  },
  choices: s => [
    { label: 'Answer defiantly', effects: () => { G.party.forEach(c => { c.focus = Math.min(Character.maxFocus(c), c.focus + 1); }); note('Defiance steels you: +1 Focus', 'good'); }, text: s => P(`"We're coming for you," ${G.party[0].name} tells the flames. The face in the fire laughs — but it is the first to look away. The fire goes back to being a fire.`), next: 'road' },
    {
      label: 'Stay quiet and listen for what it doesn\'t mean to say',
      check: { skill: 'insight', dc: 13 }, noTempt: true,
      success: {
        effects: () => { flag('foresight'); },
        text: (s, c) => P(`${c.char.name} watches the face in the flames — the flicker of its eyes, what it lingers on. Beneath the taunts, there is a plan. ${G.regionsDone.length === 1 ? `${V().short} is about to strike somewhere you haven't been yet.` : `${V().short} is going to strike at Hearthmoor itself.`} You'll be ready.`, `(You will have an advantage when the enemy makes their move.)`),
        next: 'road',
      },
      failure: { text: P(`The voice talks and talks. It is impossible to tell what is true. Eventually the fire is just a fire again.`), next: 'road' },
    },
    hollowOption('Let the voice in, just a little', s => P(`${mostCorrupt().name} doesn't fight it. The voice slides in like warm water, and for a moment there is no pain, no fear, no fatigue — just a deep, grey calm. When it leaves, they feel rested. Too rested.`), 'road', 1, c => { Character.rest(c); }),
  ],
};

/* ---------------- Move 1: the raid ---------------- */
function villainMovePending() {
  const n = G.regionsDone.length;
  const remaining = G.regions.filter(r => !G.regionsDone.includes(r));
  if (n >= 1 && !has('move_raid') && remaining.length >= 2) return 'villain_raid';
  if (n >= 2 && !has('move_siege')) return 'villain_siege';
  if (n >= 3 && G.doom >= 6 && !has('move_capture') && G.allies.some(a => !['keeper', 'florian'].includes(a))) return 'villain_capture';
  return null;
}

const raidTarget = () => G.flags.raid_target;
const raidedHere = rid => G.flags.raid_target === rid && G.flags.raid_state === 'succeeded';

SCENES.villain_raid = {
  title: 'Word from the Road',
  first: s => {
    flag('move_raid');
    const remaining = G.regions.filter(r => !G.regionsDone.includes(r));
    flag('raid_target', Dice.pick(remaining));
    flag('raid_state', 'pending');
  },
  text: s => {
    const r = REGIONS[raidTarget()];
    return P(`You're barely through Hearthmoor's gate when a rider staggers in, horse lathered. "${V().minionPlural} — hundreds of them — marching on ${r.name}!"`,
      `${V().short} knows where the next fragment is, and has decided not to wait for you. If you go there next, you might arrive in time to break the raid. If you go anywhere else, ${r.name} will face them alone.`,
      has('foresight') && `<i>You saw this coming in the fire. You know the raiders' route — you can be there first.</i>`);
  },
  choices: s => [
    { label: `Swear to ride for ${REGIONS[raidTarget()].name} next`, effects: () => flag('raid_committed'), text: P(`The rider weeps with relief. "Hurry," is all she says.`), next: 'hub' },
    { label: 'You can\'t be everywhere. Stick to your own plan', text: P(`The rider stares at you, then turns her horse and rides on, looking for someone else to beg.`), next: 'hub' },
  ],
};

/* Called by the hub when travelling. Returns the scene to go to. */
function travelTo(r) {
  if (G.flags.raid_state === 'pending') {
    if (r === raidTarget()) return 'raid_battle';
    flag('raid_state', 'succeeded');
    chronicle(`${V().short}'s raiders struck ${REGIONS[raidTarget()].name} while you were elsewhere.`);
  }
  if (twistOf(r) === 'hunters') return 'bounty_ambush';
  return REGIONS[r].start;
}

SCENES.raid_battle = {
  title: 'Racing the Raiders',
  text: s => P(`You ride hard. On the last ridge before ${REGIONS[raidTarget()].name}, you see them: a column of ${V().minionPlural} with torches, almost at the edge of the place you came to save.`,
    has('foresight') ? `Thanks to what you saw in the fire, you know exactly where they'll pass. You're waiting for them at a narrow ford.` : `There's no time for cleverness.`),
  choices: s => [{
    label: 'Break the raid',
    combat: {
      intro: s => has('foresight') ? 'You hit them at the ford from both banks.' : 'You charge straight into the column.',
      enemies: s => { const l = [minion(), minion()]; if (!solo()) l.push(minion()); if (!has('foresight')) l.push(minion()); return l; },
      actions: s => battleActions('runaway_wagon'),
      win: {
        effects: () => { flag('raid_state', 'repelled'); addGold(20); addPack('potion'); chronicle(`Broke ${V().short}'s raid on ${REGIONS[raidTarget()].name}.`); },
        text: s => P(`The raiders break and flee into the hills. By the time you ride in, the locals already know what you did. They press food and coin on you, and point you toward the thing you came for.`),
        next: s => twistOf(raidTarget()) === 'hunters' ? 'bounty_ambush' : REGIONS[raidTarget()].start,
      },
      flee: { effects: () => flag('raid_state', 'succeeded'), text: P(`You fall back. The column marches on. By nightfall, the torches are inside.`), next: s => REGIONS[raidTarget()].start },
      lose: { effects: () => flag('raid_state', 'succeeded'), text: P(`You're scattered. When you regroup, the raiders are already inside.`), next: s => REGIONS[raidTarget()].start },
    },
  }],
};

/* A paragraph for the region's opening scene. */
function raidLine(rid) {
  if (G.flags.raid_target !== rid) return '';
  if (G.flags.raid_state === 'repelled') return `<i>The locals cheer you in. Because you broke the raid, ${V().short}'s people here are few and frightened.</i>`;
  if (G.flags.raid_state === 'succeeded') return `<i>${V().short}'s raiders have been here. Smoke still hangs over the place, and the enemy holds it in strength — expect more of them than there would have been.</i>`;
  return '';
}

/* ---------------- Move 2: the siege of Hearthmoor ---------------- */
SCENES.villain_siege = {
  title: 'Hearthmoor Burns',
  first: s => flag('move_siege'),
  text: s => P(
    `The bells wake you at midnight. Hearthmoor is under attack: ${V().minionPlural} and grey husks are pouring over the east wall, and fire is spreading through the market.`,
    has('foresight') ? `You knew this was coming. You've already warned the watch, and the militia is at the walls. It gives you a few precious minutes.` : `Nobody was ready.`,
    hasAlly('keeper') && `Through the smoke, you see figures dragging someone out of the smithy — Keeper ${G.flags.keeper}.`
  ),
  choices: s => [
    {
      label: 'Hold the east wall',
      combat: {
        enemies: s => { const l = [minion(), foe('hollowed')]; if (!solo()) l.push(minion()); if (G.doom >= 5 && !has('foresight')) l.push(foe('hollowed')); return l; },
        actions: s => battleActions('lantern_oil', 'ballista'),
        allyStrikes: s => has('foresight') ? [{ name: 'The town militia', verb: 'stab at', dmg: '1d6+1' }] : [],
        win: { effects: () => { flag('hearth_defended'); chronicle('Held the walls of Hearthmoor against the night assault.'); }, text: P(`The attackers break against the wall and flee into the dark. Hearthmoor will remember this night — and who held the wall.`), next: s => hasAlly('keeper') ? 'siege_keeper' : 'hub' },
        flee: { effects: () => { flag('market_burned'); }, text: P(`You fall back from the wall. The fire takes the market before dawn.`), next: s => hasAlly('keeper') ? 'siege_keeper' : 'hub' },
        lose: { effects: () => { flag('market_burned'); doom(1); }, text: P(`The wall falls. By dawn the market is ash and the attackers have melted away with their plunder.`), next: s => hasAlly('keeper') ? 'siege_keeper' : 'hub' },
      },
    },
    {
      label: 'Save the market — fight the fire, not the raiders',
      check: { skill: 'athletics', dc: 13, mods: () => [has('foresight') && { label: 'Forewarned', value: 2 }] },
      success: { effects: () => { flag('market_saved'); doom(1); }, text: (s, c) => P(`${c.char.name} organises a bucket chain and tears down a burning awning before the fire can jump the square. The market is saved. But the raiders, unopposed at the wall, take what they came for and leave laughing.`), next: s => hasAlly('keeper') ? 'siege_keeper' : 'hub' },
      failure: { effects: (s, c) => { flag('market_burned'); hurt(c.char, '1d8'); }, text: P(`The fire is too fast. You pull people out of burning stalls until dawn, but the market is lost.`), next: s => hasAlly('keeper') ? 'siege_keeper' : 'hub' },
    },
  ],
};

SCENES.siege_keeper = {
  title: 'The Keeper Taken',
  text: s => P(`In the grey dawn you find the smithy door smashed in. Keeper ${G.flags.keeper} is gone — dragged away by the raiders, toward ${V().stronghold}.`, `On the great anvil, carved with a knife: ${V().sigil}.`),
  choices: s => [
    {
      label: 'Track them before the trail goes cold',
      check: { skill: 'survival', dc: 14, mods: () => [hasAlly('sela') && { label: 'Sela', value: 3 }] },
      success: { effects: () => { chronicle(`Rescued Keeper ${G.flags.keeper} from ${V().short}'s raiders.`); giveXp(60); }, text: (s, c) => P(`${c.char.name} finds the trail — broken branches, a dropped glove — and you catch the raiders at a river crossing. They flee, and Keeper ${G.flags.keeper} limps home between you. "I'm getting too old to be kidnapped," ${G.flags.keeper_he} mutters.`), next: 'hub' },
      failure: { effects: () => { loseAlly('keeper'); G.flags.captives = (G.flags.captives || []).concat(['keeper']); chronicle(`Keeper ${G.flags.keeper} was carried off to ${V().stronghold}.`); }, text: P(`The trail vanishes into rocky ground. The Keeper is gone. If ${G.flags.keeper_he} is still alive, ${G.flags.keeper_he} is in ${V().stronghold} now.`), next: 'hub' },
    },
  ],
};

/* ---------------- Move 3: a captive ---------------- */
SCENES.villain_capture = {
  title: 'A Message Nailed to the Gate',
  first: s => {
    flag('move_capture');
    const pool = G.allies.filter(a => !['keeper', 'florian'].includes(a));
    const a = Dice.pick(pool);
    flag('captive_ally', a);
    loseAlly(a);
    G.flags.captives = (G.flags.captives || []).concat([a]);
    chronicle(`${V().short} took ${G.allyNames[a]} captive.`);
  },
  text: s => {
    const a = G.flags.captive_ally;
    return P(`Nailed to Hearthmoor's gate is a scrap of cloth bearing ${V().sigil} — and with it, a token you recognise: something that belongs to <b>${G.allyNames[a]}</b>.`,
      `The message underneath is short: <i>"Your friends are mine now. Come and fetch them."</i> The Doom is high; ${V().short} is strong enough now to reach out and take what ${V().pronoun} wants.`,
      `${G.allyNames[a]} will not be at your side at the end — unless you free them from ${V().stronghold} first.`);
  },
  choices: [{ label: 'You will get them back', next: 'hub' }],
};

/* Rescue at the final gate (added to fin_gate's choices) */
function captiveChoices() {
  const caps = (G.flags.captives || []).filter(a => !has('freed_' + a));
  return caps.map(a => ({
    label: `Free ${a === 'keeper' ? 'Keeper ' + G.flags.keeper : G.allyNames[a]} from the cages`,
    check: { skill: 'stealth', dc: 13, mods: () => [hasAlly('vosk') && { label: 'Vosk\'s lockpicks', value: 2 }] },
    success: { effects: () => { flag('freed_' + a); addAlly(a, G.allyNames[a] || `Keeper ${G.flags.keeper}`); chronicle(`Freed ${G.allyNames[a] || 'the Keeper'} from the cages of ${V().stronghold}.`); }, text: s => P(`The cages are in a pit behind the barracks, guarded by one bored sentry. Not for long. ${G.allyNames[a] || 'Keeper ' + G.flags.keeper} grips your arm through the bars as you work the lock. "I knew you'd come."`), next: 'fin_gate' },
    failure: { effects: () => flag('freed_' + a), text: P(`A guard spots you at the cages and blows a horn. You have to run — and there's no time to go back.`), next: 'fin_gate_fight' },
  }));
}

SCENES.bounty_ambush = {
  title: 'Bounty Hunters',
  text: s => P(`A day out from ${REGIONS[G.flags.currentRegion].name}, a crossbow bolt thunks into the tree beside your head. Three figures step out onto the road: bounty hunters, with your faces on a poster. ${V().short} is paying well.`),
  choices: s => [
    {
      label: 'Fight them',
      combat: {
        enemies: s => [foe('thug', { name: 'Bounty Hunter' }), foe('thug', { name: 'Bounty Hunter' })].concat(solo() ? [] : [foe('thug', { name: 'Hunter Captain', hp: 18, atk: 5 })]),
        actions: s => battleActions('rockslide'),
        win: { effects: () => addGold(25), text: P(`The hunters are down. Their purses are heavy with ${VILLAINS[G.villain].short}'s advance payment — which is now yours.`), next: s => REGIONS[G.flags.currentRegion].start },
        flee: { text: P(`You lose them in the hills, but it costs you a day.`), effects: () => doom(1), next: s => REGIONS[G.flags.currentRegion].start },
        lose: { effects: () => addGold(-Math.min(G.gold, 20)), text: P(`They beat you, rob you — and then, astonishingly, decide you're not worth the trouble of carrying. They leave you in a ditch.`), next: s => REGIONS[G.flags.currentRegion].start },
      },
    },
    {
      label: 'Offer to double their fee if they walk away',
      check: { skill: 'deception', dc: 14 },
      success: { text: (s, c) => P(`${c.char.name} spins a tale of a hidden treasury that the hunters will never find, and the promise of a share. They lower their bows. By the time they realise there's no treasury, you're long gone.`), next: s => REGIONS[G.flags.currentRegion].start },
      failure: { text: P(`"Nice try." The crossbows come up.`), next: 'bounty_fight' },
    },
  ],
};
SCENES.bounty_fight = {
  title: 'Bounty Hunters',
  text: P(`They close in.`),
  choices: s => [{ label: 'Fight!', combat: {
    enemies: s => [foe('thug', { name: 'Bounty Hunter' }), foe('thug', { name: 'Bounty Hunter' })],
    win: { effects: () => addGold(25), text: P(`The hunters are down, and their advance payment is yours.`), next: s => REGIONS[G.flags.currentRegion].start },
    flee: { effects: () => doom(1), text: P(`You lose them in the hills.`), next: s => REGIONS[G.flags.currentRegion].start },
    lose: { effects: () => addGold(-Math.min(G.gold, 20)), text: P(`They rob you and leave you in a ditch.`), next: s => REGIONS[G.flags.currentRegion].start },
  } }],
};
