/* ===========================================================
   HEARTHMOOR — the hub town between journeys.
   Also defines the region list and the road router.
   =========================================================== */

const REGIONS = {
  mire: { name: 'the Mirewood Fen', short: 'Mirewood Fen', icon: '🌫️', blurb: 'A drowned shrine deep in a fen where a bog-witch is said to live.', start: 'mire_start' },
  mines: { name: 'the Emberdeep Mines', short: 'Emberdeep', icon: '⛏️', blurb: 'A dwarven mining town whose Deep Forge has fallen silent.', start: 'mines_start' },
  harbor: { name: 'Saltcliff Harbor', short: 'Saltcliff', icon: '⚓', blurb: 'A smugglers\' port where anything can be bought — for a price.', start: 'harbor_start' },
  barrow: { name: 'the Whispering Barrow', short: 'the Barrow', icon: '⚰️', blurb: 'The great cairn where Florian himself was laid to rest.', start: 'barrow_start' },
  orchard: { name: 'Silverbough', short: 'Silverbough', icon: '🌳', blurb: 'An elven orchard whose great Heartwood is rotting from the roots.', start: 'orchard_start' },
  court: { name: 'Castle Varric', short: 'Castle Varric', icon: '🎭', blurb: 'A gilded lake-castle hosting a masquerade — and a secret sale.', start: 'court_start' },
  wych: { name: 'Wych Hollow', short: 'Wych Hollow', icon: '🕯️', blurb: 'The dead village where the Hollow first rose. The grey is still thick there.', start: 'wych_start' },
  peak: { name: 'Frosthollow Peak', short: 'Frosthollow', icon: '🏔️', blurb: 'A mountaintop monastery whose great bell has stopped ringing.', start: 'peak_start' },
};

function doomText() {
  const d = G.doom;
  if (d <= 1) return 'The sky over Hearthmoor is still blue, though travellers speak of grey fog on the horizon.';
  if (d <= 3) return 'A thin grey haze hangs over the hills now. Farmers bring in grain that crumbles like ash.';
  if (d <= 5) return 'The Hollow is visible from the town walls: a grey stain on the northern hills, spreading. Refugees crowd the market.';
  if (d <= 7) return 'Grey dust settles on Hearthmoor every morning. Half the shops are boarded up. People whisper that it is already too late.';
  return 'The sun is a pale coin behind the grey. Husks have been seen at the edge of town. Hearthmoor is holding its breath.';
}

function hubRumors() {
  const r = [];
  if (has('thornbury_saved')) r.push('Families from Thornbury, who escaped the longhall fire, press bread into your hands as you pass.');
  if (has('tavern_burned')) r.push('A sour-faced man in the market blames you for the burning of the Split Log. "Trouble follows heroes," he says.');
  if (hasAlly('miners')) r.push('Dwarves from Emberdeep drink to your names in the Copper Kettle.');
  if (has('miners_died')) r.push('A dwarf widow from Emberdeep spits as you pass. Word of the miners you left behind has travelled.');
  if (hasAlly('monks')) r.push('Grey-robed monks of the Silent Order have come down from the mountain. They bow to you without a word.');
  if (has('greywater_saved')) r.push('Traders from Greywater say their village is healing. They tell everyone who will listen who saved it.');
  if (has('greywater_lost')) r.push('Greywater has gone silent, they say. No one goes that way any more.');
  if (has('hearth_defended')) r.push('Since the night of the assault, nobody in Hearthmoor will let you pay for a drink. The market gives you a fifth off everything.');
  if (has('market_burned')) r.push('The market is a ruin of charred stalls. What traders remain charge half again for everything.');
  if (G.flags.raid_state === 'succeeded') r.push(`Refugees from ${REGIONS[G.flags.raid_target].name} sleep in the square, telling of the raid.`);
  if (G.flags.raid_state === 'repelled') r.push(`Folk from ${REGIONS[G.flags.raid_target].name} have come to market. They know your faces.`);
  if (hasAlly('elves')) r.push('Elven foresters from Silverbough walk the walls in silver cloaks.');
  if (hasAlly('imra')) r.push('Banners of House Varric fly over the inn. Lady Imra has sent a company of guards.');
  if (has('heartwood_burned')) r.push('Elven traders do not come to Hearthmoor any more. Silverbough mourns its tree.');
  if (hasAlly('knights')) r.push('The Knights of the Hearth drill in the square. Ser Aldane salutes you as you pass.');
  if (pq('smuggler', 'enemy')) r.push('A street urchin presses a black feather into your hand and runs: the Gutter King\'s mark.');
  if (pq('healer', 'cure')) r.push('Tobin, awake and thin as a rake, follows you around the market asking a hundred questions.');
  if (hasAlly('vosk')) r.push('A Saltcliff sailor slips you a note: "The Captain remembers her friends."');
  if (hasAlly('sela')) r.push('Sela the ranger is waiting at the inn, sharpening arrows. "Whenever you\'re ready," she says.');
  if (G.rival.slain) r.push(`Word has spread that ${V().lieutenant.name} is dead. ${V().short}'s followers are said to be shaken.`);
  if (fragCount('villain') > 0) r.push(`Rumour says ${V().short} now carries ${fragCount('villain') === 1 ? 'a piece' : 'pieces'} of Florian's Axe, and that ${V().possessive} power has grown terribly.`);
  return r;
}

/* Returning to Hearthmoor: personal stories, camp and the villain's moves play first. */
SCENES.hub = {
  route: s => (typeof villainMovePending === 'function' && villainMovePending()) || pendingPersonal() || 'hub_main',
};

SCENES.hub_main = {
  title: 'Hearthmoor',
  first: s => { if (!has('keeper_alive')) flag('smith_only'); },
  text: s => {
    const remaining = G.regions.filter(r => !G.regionsDone.includes(r));
    const firstVisit = G.visited.hub_main === 1;
    const fr = fragCount('party');
    const lines = [];
    if (firstVisit) lines.push(`Hearthmoor is a walled market town at the meeting of three roads — the last place in the valley where all the roads still feel safe. The old smithy by the square still has the great anvil where, legend says, Florian's Axe was first assembled.`);
    else lines.push(`You return to Hearthmoor, road-worn. The town gates creak open for you.`);
    lines.push(doomText());
    if (hasAlly('keeper') && !firstVisit) lines.push(`Keeper ${G.flags.keeper} is waiting at the smithy, as promised, poring over old records.`);
    hubRumors().slice(-3).forEach(x => lines.push(x));
    if (G.regionsDone.length) {
      const held = Object.keys(G.fragments).filter(k => G.fragments[k] === 'party').map(k => FRAGMENTS[k].name);
      lines.push(fr ? `You carry ${held.join(' and ')}. ${fr === 3 ? 'All three pieces. The axe can be made whole.' : ''}` : `You carry no pieces of the axe — not yet.`);
    }
    if (remaining.length) lines.push(`The Keeper's Map still marks ${remaining.map(r => REGIONS[r].name).join(remaining.length === 2 ? ' and ' : ', ')}.`);
    else lines.push(`Every mark on the Map has been visited. There is only one road left: to ${V().stronghold}.`);
    return P(...lines);
  },
  choices: s => {
    const remaining = G.regions.filter(r => !G.regionsDone.includes(r));
    const list = remaining.map(r => ({
      label: `${REGIONS[r].icon} Travel to ${REGIONS[r].name}`,
      hint: REGIONS[r].blurb,
      effects: () => { doom(1); G.flags.currentRegion = r; },
      text: s => P(`You set out for ${REGIONS[r].name}. The road takes days, and every day, the grey creeps a little further.`),
      next: () => travelTo(r),
    }));
    list.push({ label: '🛒 Visit the market', hint: 'Buy weapons, armor and supplies', ui: 'shop' });
    if (injuryCount()) list.push({
      label: `🩹 See Mother Brisk, the healer (${injuryCount() * 10} gold)`, hint: 'Treat every lasting injury', cost: { gold: injuryCount() * 10 },
      effects: () => { G.party.forEach(c => { while ((c.injuries || []).length) healInjury(c); }); },
      text: P(`Mother Brisk sets bones, stitches wounds and pours something foul down your throats. "Try not to come back," she says. You will.`),
      next: 'hub',
    });
    if (maxCorruption() > 0) list.push({
      label: '🕯️ Pray at the Keepers\' chapel (15 gold)', hint: 'Cleanse 2 Corruption from every hero', cost: { gold: 15 },
      effects: () => cleanseAll(2),
      text: s => P(`The old chapel is cold and smells of beeswax. You kneel before the carving of the woodcutter and his axe. For a while the grey in you quiets.`, maxCorruption() >= 5 && `It does not leave entirely. Some stains go deeper than prayer.`),
      next: 'hub',
    });
    list.push({
      label: '🛏️ Rest at the Copper Kettle inn (8 gold)', hint: 'Fully restore HP and Focus', cost: { gold: 8 },
      effects: () => { healAll('full'); },
      text: P(`A hot meal, a real bed, and a night without watches. You wake feeling whole.`),
      next: 'hub',
    });
    if (hasAlly('keeper')) list.push({
      label: `📜 Speak with Keeper ${G.flags.keeper}`, once: 'keeper_talk_' + G.regionsDone.length,
      effects: () => { if (G.regionsDone.length >= 1 && G.clues.length < 3 && !has('keeper_clue')) { flag('keeper_clue'); G._kclue = addClue(); } },
      text: () => {
        const c = G._kclue; G._kclue = null;
        if (c) return P(`${G.flags.keeper} has been digging through the Keepers' archive. "I found something about ${V().short}," ${G.flags.keeper_he} says, tapping a brittle page.`, `<b>${c}</b>`);
        return P(`"Florian never fought alone," ${G.flags.keeper} reminds you. "Friends, allies — they mattered as much as the axe. Whoever you help on the road may yet help you at the end."`);
      },
      next: 'hub',
    });
    if (!remaining.length) list.push({ label: `⚔️ March on ${V().stronghold}`, hint: 'The final confrontation. Make sure you are ready.', next: 'fin_reforge' });
    return list;
  },
};

/* After each region, the road home brings an encounter. */
SCENES.road = {
  route: s => {
    const n = G.regionsDone.length;
    if (n <= 2 && !has('vision_' + n)) return 'vision';
    if (n === 1) return G.interludes[0];
    if (n === 2) return 'int_rival';
    if (n === 3) return G.interludes[1];
    return 'hub';
  },
};

/* Called from each region's end scene. */
function finishRegion(rid) {
  if (!G.regionsDone.includes(rid)) G.regionsDone.push(rid);
}
