/* ===========================================================
   REGION: THE WHISPERING BARROW — Florian's tomb
   Key flags: barrow_secret, barrow_riddle, shade_calm, florian ally
   =========================================================== */

SCENES.barrow_start = {
  title: 'The Whispering Barrow',
  text: s => P(
    raidLine('barrow'),
    `The Barrow Downs are a sea of grass and standing stones, and in their centre rises the greatest cairn of all: the tomb of Florian Thane. They say that on still nights the stones whisper his name.`,
    `They are not whispering tonight. The great bronze door at the cairn's mouth has been smashed in with a ram, and the grass around it is trampled flat. ${V().minionPlural} are inside — robbing Florian's grave of <b>${regionFrag('barrow').name}</b>, which the Keepers laid in his arms when they buried him.`,
    `Faint lights move among the stones. The dead of the barrow are restless.`
  ),
  choices: s => [
    { label: 'Go in through the broken door', next: 'barrow_hall' },
    {
      label: 'Search for the Keepers\' hidden passage',
      check: { skill: 'investigation', dc: 13, mods: () => [hasItem('keeper_amulet') && { label: 'Keeper\'s Amulet', value: 1 }] },
      success: { effects: () => flag('barrow_secret'), text: (s, c) => P(`${c.char.name} notices a standing stone whose lichen grows in the shape of the Keeper's sigil — the same as on your amulet. Pressing the amulet to it, you hear a click. A narrow stair opens in the turf, leading down past the outer halls.`), next: 'barrow_hall' },
      failure: { effects: () => doom(1), text: P(`You circle the cairn for hours, prodding at stones. Nothing. By the time you give up and use the main door, the moon is setting.`), next: 'barrow_hall' },
    },
  ],
};

SCENES.barrow_hall = {
  title: 'The Hall of Whispers',
  text: s => P(
    has('barrow_secret') ? `The secret stair brings you out at the far end of a long hall, past the outer chambers the robbers have already looted.` : `Beyond the broken door, the outer chambers have been looted bare. A long hall stretches ahead.`,
    `The hall is lined with alcoves, and in each alcove a figure of pale mist is standing: Florian's companions, buried with him, a hundred years dead. They turn toward you as one. Their voices are wind through dry grass.`,
    `<i>"The thieves passed us by in the dark. You come with light. Then answer, and pass: What did the woodcutter carry that was heavier than his axe, and yet he never once set it down?"</i>`,
    hasRace('elf') && `An inscription in old elvish runs above the alcoves. ${raceChar('elf').name} can read it.`
  ),
  choices: s => [
    {
      label: '[Elf] Read the elvish inscription',
      req: () => hasRace('elf'),
      effects: () => flag('barrow_hint'),
      text: s => P(`${raceChar('elf').name} reads aloud: <i>"Here lie those who swore with him. What he swore, he kept; what he kept, he carried to the grave."</i> The answer is plain now.`),
      next: 'barrow_riddle',
    },
    {
      label: 'Think back on the old ballads of Florian',
      req: () => !has('barrow_hint'),
      check: { skill: 'lore', dc: 13 },
      success: { effects: () => flag('barrow_hint'), text: (s, c) => P(`${c.char.name} remembers a verse sung in every tavern in the valley: <i>"He swore by root, he swore by stone, that he'd not swing for himself alone…"</i> An oath. He carried an oath.`), next: 'barrow_riddle' },
      failure: { text: (s, c) => P(`${c.char.name} knows a dozen songs about Florian, and every one of them is about the axe. You'll have to guess.`), next: 'barrow_riddle' },
    },
    { label: 'Answer the riddle', req: () => !has('barrow_hint'), next: 'barrow_riddle' },
  ],
};

SCENES.barrow_riddle = {
  title: 'The Riddle',
  text: s => P(`<i>"What did the woodcutter carry that was heavier than his axe, and yet he never once set it down?"</i>`, has('barrow_hint') && `You know the answer.`),
  choices: s => [riddleChoice('Answer the spirits', 'barrow',
    { effects: () => flag('barrow_riddle'), text: P(`The mist-figures bow their heads. <i>"His promise. Pass, oath-keeper."</i> They fade back into their alcoves, and the way to the tomb lies open.`), next: 'barrow_tomb' },
    { text: P(`A long, cold silence. <i>"No."</i> The mist-figures draw blades of shadow and drift toward you.`), next: 'barrow_shades' },
    { fixed: { q: 'What did the woodcutter carry that was heavier than his axe, and yet he never once set it down?', a: ['promise', 'his promise', 'oath', 'his oath', 'vow', 'his vow', 'word', 'his word'], wrong: ['His grief', 'His people', 'The Hollow\'s curse'] }, xp: 50 })],
};

SCENES.barrow_shades = {
  title: 'The Restless Dead',
  text: P(`The shades of Florian's companions come at you, silent, cold as winter.`),
  choices: s => [{
    label: 'Fight your way through',
    combat: {
      actions: s => battleActions('keeper_sigil', 'grave_salt'),
      enemies: s => solo() ? [foe('shade_guard'), foe('shade_guard')] : [foe('shade_guard'), foe('shade_guard'), foe('shade_guard')],
      win: { text: P(`The last shade breaks apart like fog in the wind. You hurry on toward the tomb — but you've lost time, and you can hear the robbers ahead.`), next: 'barrow_tomb' },
      flee: { effects: () => hurtAll('1d6'), text: P(`You run the gauntlet, cold blades raking you, and burst out of the far end of the hall.`), next: 'barrow_tomb' },
      lose: { text: P(`The cold takes you. When you wake on the grass outside the cairn, it is dawn, and the robbers are long gone.`), next: 'barrow_lost' },
    },
  }],
};

SCENES.barrow_tomb = {
  title: 'Florian\'s Tomb',
  text: s => P(
    `The tomb chamber is round and domed, painted with scenes of the first war against the Hollow. In the centre stands a stone sarcophagus, carved with the likeness of a broad-shouldered, plain-faced man holding an axe across his chest.`,
    `${cap(numWord(solo() ? 2 : 3))} ${V().minionPlural} are levering the lid off with crowbars. It grinds aside — and a figure of cold blue light sits up inside the coffin.`,
    `It is Florian. Or what the Hollow's whispers have left of him: his face twisted with confusion and rage, his ghostly hands still locked around <b>${regionFrag('barrow').name}</b>. <i>"Thieves,"</i> it roars, in a voice like a landslide. <i>"Thieves in my grave!"</i> It does not seem to see the difference between the robbers and you.`
  ),
  choices: s => [
    {
      label: 'Call out to Florian — tell him who you are and why you\'ve come',
      check: { skill: 'persuasion', dc: 14, mods: () => [hasItem('keeper_amulet') && { label: 'Keeper\'s Amulet', value: 1 }, has('barrow_riddle') && { label: 'Answered his companions', value: 2 }] },
      success: {
        effects: () => { flag('shade_calm'); giveXp(60); },
        text: (s, c) => P(`"Florian! We're not thieves — we've come to finish what you started!" ${c.char.name} holds up the Keeper's sigil. The shade's burning eyes fix on it. Something like recognition crosses its face.`,
          `It turns on the cultists. What follows is brief and terrible. When it's over, the robbers are gone, and the shade of Florian Thane stands over his own coffin, breathing hard, looking at you.`),
        next: 'barrow_shade',
      },
      failure: { text: (s, c) => P(`The shade howls. ${c.char.name}'s words are lost in the roar. The cultists, seeing their chance, turn on you while the ghost rages.`), next: 'barrow_tomb_fight' },
    },
    {
      label: 'Sing the old ballad of Florian',
      check: { skill: 'performance', dc: 13 },
      success: {
        effects: () => { flag('shade_calm'); giveXp(60); },
        text: (s, c) => P(`${c.char.name} begins to sing — the plain old song every child in the valley knows. <i>"He swore by root, he swore by stone…"</i> The shade falters. Its lips move with the words.`,
          `Then it turns on the cultists. When it is over, the robbers are gone, and the shade of Florian Thane stands over his coffin, looking at you with clear eyes.`),
        next: 'barrow_shade',
      },
      failure: { text: (s, c) => P(`${c.char.name}'s voice cracks on the first note. The shade screams over it. The cultists seize their chance and turn on you.`), next: 'barrow_tomb_fight' },
    },
    hollowOption('Silence the shade with the Hollow\'s whisper',
      s => P(`${mostCorrupt().name} speaks a word that the Hollow has been teaching them in their dreams. Florian's shade stops screaming. It stops moving at all. Then it comes apart like smoke, and its hands open, and ${regionFrag('barrow').name} falls into the coffin with a dull clink.`, `The grave-robbers flee in terror of you. The tomb is very, very quiet.`),
      'barrow_win', 2, () => flag('florian_destroyed')),
    { label: 'Attack the grave-robbers', next: 'barrow_tomb_fight' },
  ],
};

SCENES.barrow_tomb_fight = {
  title: 'Battle in the Tomb',
  text: P(`The grave-robbers come at you, crowbars and blades swinging, while the raging shade looms over the coffin.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      actions: s => battleActions('grave_salt'),
      enemies: s => { const l = []; for (let i = 0; i < (solo() ? 2 : 3); i++) l.push(minion(V().minion + ' robber')); return l; },
      win: { text: P(`The last robber falls across the sarcophagus. The shade looks down at the bodies — then up at you. Its rage is cooling, a little.`), next: 'barrow_shade' },
      flee: { text: P(`You flee the tomb. Behind you, the cultists finish their work and escape by another way.`), next: 'barrow_lost' },
      lose: { text: P(`You fall beneath the painted dome. The robbers tear the fragment from the shade's grip with Hollow-charms and flee into the night.`), next: 'barrow_lost' },
    },
  }],
};

SCENES.barrow_shade = {
  title: 'The Shade of Florian',
  text: s => P(
    has('shade_calm')
      ? `The shade of Florian Thane looks at you with tired, kind eyes. <i>"A hundred years,"</i> he says. <i>"It's been whispering to me all that time, the Hollow. Telling me I failed. That it was all for nothing."</i>`
      : `The shade flickers, half-mad, muttering to itself. It clutches ${regionFrag('barrow').name} to its chest like a frightened child. <i>"Mine. My oath. Mine to keep."</i>`,
    `Ghostly as he is, you can still see the woodcutter in him: thick wrists, a broken nose, a face made for laughing.`
  ),
  choices: s => [
    {
      label: 'Tell him the truth: the seal is failing, and you need his help',
      check: { skill: 'insight', dc: s => has('shade_calm') ? 10 : 14 },
      success: {
        effects: () => { addAlly('florian', 'the shade of Florian Thane'); addGear('barrow_blade'); flag('shade_calm'); },
        text: (s, c) => P(`${c.char.name} understands what the old hero needs to hear — not that he failed, but that his people are still alive, still fighting. You tell him about Thornbury, about the Keepers, about everyone who has helped you on the road.`,
          `Florian weeps, a little. Then he laughs — a big, rough, farmer's laugh. <i>"Then it wasn't for nothing."</i> He places ${regionFrag('barrow').name} in your hands, and with it, the sword that lay beside him in the coffin. <i>"When you face the Hollow at the end, call my name. I'll come. I never swung alone, and neither should you."</i>`),
        next: 'barrow_win',
      },
      failure: {
        text: (s, c) => P(`${c.char.name} tries, but the words come out wrong — too much about the danger, not enough about hope. Florian's shade sags. <i>"Then I did fail,"</i> he whispers. He lets the fragment slip from his hands into yours, and fades back into his coffin, and does not rise again.`),
        next: 'barrow_win',
      },
    },
    {
      label: `Ask what the Hollow told him about ${VILLAINS[G.villain].short}`, once: 'florian_clue',
      effects: () => { G._clue = addClue(); },
      text: s => { const c = G._clue; G._clue = null; return P(`The shade's face darkens. <i>"The Hollow boasts. It can't help itself. It told me about its new servant."</i>`, c ? `<b>${c}</b>` : `<i>"But you know all that already."</i>`); },
      next: 'barrow_shade',
    },
  ],
};

SCENES.barrow_win = {
  title: 'Recovered',
  first: s => { gainFragment('barrow'); if (has('florian_destroyed')) chronicle('Unmade the shade of Florian Thane with the Hollow\'s voice.'); if (hasAlly('florian')) chronicle('Laid the shade of Florian Thane to rest — and won his promise to return.'); },
  text: s => P(
    `<b>${regionFrag('barrow').name}</b> — ${regionFrag('barrow').desc} — rests in your hands. It was carried into this tomb by the Keepers a hundred years ago, and now it's leaving again.`,
    has('florian_destroyed') ? `You do not bother with the lid. Outside, the standing stones are silent, and you have the feeling they will stay that way.` : `You lower the lid back onto the sarcophagus, gently. Outside, the standing stones have begun to whisper again.`
  ),
  choices: [{ label: 'Leave the barrow', next: 'barrow_end' }],
};

SCENES.barrow_lost = {
  title: 'A Robbed Grave',
  first: s => { loseFragment('barrow'); doom(1); },
  text: s => P(`Florian's coffin lies open and empty but for dust. ${regionFrag('barrow').name} is on its way to ${V().short}. The standing stones are silent.`),
  choices: [{ label: 'Leave the barrow', next: 'barrow_end' }],
};

SCENES.barrow_end = {
  title: 'The Downs',
  first: s => finishRegion('barrow'),
  text: P(`The wind moves through the long grass as you leave the downs behind.`),
  choices: [{ label: 'Take the road', next: 'road' }],
};
