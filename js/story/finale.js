/* ===========================================================
   FINALE — reforging, the march, the gate, the confrontation,
   the final battle, the sealing and the endings.
   =========================================================== */

const ALLY_HELP = {
  keeper: s => `Keeper ${G.flags.keeper} rides with you, the Keepers' oath-book in ${G.flags.keeper_he === 'he' ? 'his' : 'her'} saddlebag. If the axe must be reforged in the field, ${G.flags.keeper_he} knows the words.`,
  nan: () => `A flock of green marsh-lights follows your column at a distance. Old Nan has come, in her own way.`,
  miners: () => `Two hundred dwarves of Emberdeep march with you, picks and hammers on their shoulders, Brannoc at their head.`,
  vosk: () => `Captain Vosk's smugglers have come up the river in flat black boats. "Every fortress has a back door," she says. "I've already found this one's."`,
  monks: () => `The monks of the Silent Order walk in silence at the rear, staves in hand. Where they pass, the grey dust settles and stays still.`,
  florian: () => `You carry the Barrow-King's sword, and you feel Florian's promise like a hand on your shoulder.`,
  sela: () => `Sela ranges ahead, scouting. She knows every gully and ridge around ${V().stronghold}.`,
};

function bossFight() {
  const b = V().boss;
  const vf = fragCount('villain');
  const boss = foe({ noScale: true, name: b.name, hp: b.hp + G.doom * 4 + vf * 10, ac: b.ac + (vf >= 2 ? 1 : 0), atk: b.atk + vf, dmg: b.dmg, fire: b.fire, heals: b.heals, xp: b.xp, boss: true, burst: '2d6' });
  if (hasAlly('nan')) { boss.ac -= 1; }
  return boss;
}

function finaleAllyStrikes() {
  const a = [];
  if (hasAlly('florian')) a.push({ name: 'The shade of Florian', verb: 'cleaves at', dmg: '2d6+2', radiant: true });
  if (hasAlly('monks')) a.push({ name: 'The Silent Order', verb: 'strikes with blessed staves at', dmg: '1d6+2' });
  if (hasAlly('sela')) a.push({ name: 'Sela', verb: 'puts an arrow into', dmg: '1d8+2' });
  return a;
}

SCENES.fin_reforge = {
  route: s => (fragCount('party') === 3 && !has('axe_reforged')) ? 'fin_forge' : 'fin_march',
};

SCENES.fin_forge = {
  title: 'The Great Anvil',
  first: s => { flag('axe_reforged'); addGear('florians_axe'); chronicle('Reforged Florian\'s Axe on the great anvil of Hearthmoor.'); },
  text: s => P(
    `All three pieces, together for the first time in a hundred years. You lay them on the great anvil in the Hearthmoor smithy: ${FRAGMENTS.head.desc}; ${FRAGMENTS.haft.desc}; ${FRAGMENTS.rune.desc}.`,
    hasAlly('keeper') ? `Keeper ${G.flags.keeper} reads the binding words from the Keepers' oath-book while the town smith works the bellows.` : `The town smith works the bellows while you read the binding words from the dead Keeper's journal.`,
    `When the hammer falls, there is no ringing of metal — only a sound like a great tree drawing breath. The rune flares. The haft drinks in the head. And there, on the anvil, lies <b>Florian's Axe</b>, whole.`,
    `Outside, every bell in Hearthmoor begins to ring on its own.`,
    `<i>(Equip Florian's Axe from a character's sheet. Whoever wields it fights with their best of Strength or Dexterity.)</i>`
  ),
  choices: [{ label: 'March on the enemy', next: 'fin_march' }],
};

SCENES.fin_march = {
  title: s => `The Road to ${V().stronghold.replace(/^the /, '').replace(/^./, c => c.toUpperCase())}`,
  first: s => { healAll('full'); },
  text: s => {
    const lines = [
      `You leave Hearthmoor at dawn. ${G.doom >= 6 ? 'The grey is everywhere now — on the fields, the hedges, the faces of the people who watch you go.' : 'The grey thickens with every mile north.'}`,
      `Two days later you see it: ${V().strongholdDesc}. <b>${cap(V().stronghold)}</b>. Above it, the sky is a slow, turning wheel of ash.`,
    ];
    const vf = fragCount('villain');
    if (vf) lines.push(`Somewhere inside, ${V().short} holds ${vf === 1 ? 'one piece' : vf + ' pieces'} of Florian's Axe. You can feel ${vf === 1 ? 'it' : 'them'}, like a toothache, pulling at the fragments you carry.`);
    else if (has('axe_reforged')) lines.push(`Florian's Axe hums against the Hollow. ${V().short} has nothing to match it.`);
    if (G.allies.length) {
      lines.push(`<b>You do not come alone.</b>`);
      G.allies.forEach(a => { if (ALLY_HELP[a]) lines.push(ALLY_HELP[a](s)); });
    } else lines.push(`You come alone. Whatever help you might have found on the road, none of it followed you here.`);
    if (has('sela_abandoned') || has('sela_lost')) lines.push(`Among the grey husks shambling around the walls, you think you see a ranger's green cloak.`);
    return P(...lines);
  },
  choices: [{ label: 'Approach the gates', next: 'fin_gate' }],
};

SCENES.fin_gate = {
  title: 'The Gates',
  text: s => {
    const l = V().lieutenant;
    const lines = [`The main gate is guarded by a dozen ${V().minionPlural} and hollowed husks.`];
    if (G.rival.spared) lines.push(`But as you watch from cover, the guard changes — and the figure who takes command at the gate is ${l.name}. ${cap(l.he)} looks straight at your hiding place, then turns and, with a few curt orders, sends half the guards away. A postern door beside the gate swings open a crack, and stays open.`);
    else if (G.rival.slain) lines.push(`With ${l.name} dead, the guards are leaderless and nervous, jumping at shadows.`);
    else lines.push(`At their head stands ${l.name} ${l.title}, scanning the road. Waiting for you.`);
    if (hasAlly('miners')) lines.push(`Brannoc's dwarves have already begun to tunnel under the wall.`);
    if (hasAlly('vosk')) lines.push(`Vosk's people have found a culvert by the river that leads straight into the cellars.`);
    return P(...lines);
  },
  choices: s => [
    {
      label: `Slip through the postern door ${V().lieutenant.name} left open`, req: () => G.rival.spared,
      effects: () => { chronicle(`${V().lieutenant.name}, once spared, opened the gate for you.`); },
      text: s => P(`You slip inside. As you pass, ${V().lieutenant.name} speaks without looking at you. "A life for a life. We're even." Then, quieter: "${V().short} is in the inner hall. Whatever you're going to do, do it fast."`),
      next: 'fin_throne',
    },
    {
      label: 'Follow the dwarves through their tunnel', req: () => hasAlly('miners'),
      text: P(`The tunnel comes up under the flagstones of a storeroom. The dwarves stay to hold the way open behind you, and to draw the garrison's attention with a great deal of noise.`),
      next: 'fin_throne',
    },
    {
      label: 'Take Vosk\'s smugglers\' culvert', req: () => hasAlly('vosk'),
      text: P(`You wade through the culvert in the dark, smugglers leading the way. It opens into a cellar full of grey-sealed barrels. Vosk grins. "Told you. Back doors."`),
      next: 'fin_throne',
    },
    {
      label: 'Sneak in over the wall',
      check: { skill: 'stealth', dc: s => 15 - (hasAlly('sela') ? 3 : 0) - (G.rival.slain ? 2 : 0), mods: () => [hasAlly('sela') && { label: 'Sela\'s scouting', value: 0 }] },
      success: { text: (s, c) => P(`${c.char.name} finds a blind spot between the watchtowers${hasAlly('sela') ? ' that Sela pointed out' : ''}. You go over the wall in the dark and drop into the inner courtyard unseen.`), next: 'fin_throne' },
      failure: { text: (s, c) => P(`A loose stone, a shout, a horn. ${c.char.name} drops into the courtyard right in front of the guards.`), next: 'fin_gate_fight' },
    },
    { label: 'Assault the gate head-on', next: 'fin_gate_fight' },
  ],
};

SCENES.fin_gate_fight = {
  title: 'Battle at the Gate',
  text: s => P(!G.rival.slain && !G.rival.spared ? `${V().lieutenant.name} draws ${V().lieutenant.his} weapon with a smile. "Third time," ${V().lieutenant.he} says. "Last time."` : `The guards rush to meet you.`),
  choices: s => [{
    label: 'Fight your way through!',
    combat: {
      enemies: s => {
        const l = [];
        if (!G.rival.slain && !G.rival.spared) l.push(lieutenant());
        l.push(minion(), minion());
        if (!solo()) l.push(foe('hollowed'));
        if (G.doom >= 6) l.push(foe('hollowed'));
        return l;
      },
      allyStrikes: s => finaleAllyStrikes(),
      fleeable: false,
      win: {
        effects: () => { if (!G.rival.slain && !G.rival.spared) { G.rival.slain = true; chronicle(`Defeated ${V().lieutenant.name} at the gates of ${V().stronghold}.`); } },
        text: s => P(`The gate is yours. You push through into the inner keep, battered but unbowed.`),
        next: 'fin_throne',
      },
      lose: {
        effects: () => { flag('captured'); doom(1); },
        text: s => P(`You are overwhelmed and dragged in chains through the keep — straight to the one who has been waiting for you all along.`),
        next: 'fin_throne',
      },
    },
  }],
};

SCENES.fin_throne = {
  title: s => V().name,
  first: s => { if (hasAlly('monks')) healAll('full'); },
  text: s => {
    const v = V(), vf = fragCount('villain');
    const lines = [
      has('captured') ? `You are thrown onto the cold floor of the inner hall. Your bonds are cut — contemptuously. "Stand up," says a voice. "I want to see you properly."` : `The inner hall is vast and dim, lit by braziers of grey fire. At the far end, beside a crack in the floor that breathes out ash like a living thing, stands ${v.name}: ${v.look}.`,
    ];
    if (vf) lines.push(`${cap(v.pronoun)} holds ${vf === 1 ? 'a fragment' : vf + ' fragments'} of Florian's Axe, fused into ${v.possessive} weapon with veins of grey fire. ${cap(v.possessive)} power has grown with ${vf === 1 ? 'it' : 'each one'}.`);
    if (has('axe_reforged')) lines.push(`${v.short}'s eyes go to Florian's Axe in your hands, and for the first time, you see fear in them.`);
    lines.push(`"So," ${v.short} says. "${G.party.map(c => c.name).join(' and ')}. You've cost me a great deal." ${v.motive}`);
    if (hasAlly('monks')) lines.push(`<i>The monks of the Silent Order hum a single note behind you, and your wounds close.</i>`);
    if (G.clues.length >= 2) lines.push(`You know things about ${v.short} that ${v.pronoun} doesn't know you know. ${G.clues.length >= 3 ? 'All of it.' : 'Enough, maybe.'}`);
    return P(...lines);
  },
  choices: s => [
    {
      label: V().truthLabel,
      req: () => G.clues.length >= 2, showLocked: true,
      hint: G.clues.length >= 2 ? undefined : `You need to know more of ${V().short}'s secrets (${G.clues.length}/2 learned)`,
      check: { skill: V().truthSkill, dc: s => 16 - (G.clues.length >= 3 ? 3 : 0) - (has('captured') ? 0 : 1) },
      success: {
        effects: () => { flag('villain_redeemed'); chronicle(`Reached the person inside ${V().name}, and turned ${V().object} against the Hollow.`); giveXp(150); },
        text: s => P(V().truthWin, `The crack in the floor splits wide. Out of it climbs something that was never a person: a shape of ash and hunger, wearing the Hollow's grey like skin. <b>The Hollow Made Flesh.</b>`),
        next: 'fin_avatar',
      },
      failure: {
        effects: () => flag('villain_enraged'),
        text: s => P(V().truthLose),
        next: 'fin_battle',
      },
    },
    {
      label: 'Attack!',
      text: s => P(`No more words. ${V().short} raises ${V().possessive} weapon, and the Hollow rises behind ${V().object} like a wave.`),
      next: 'fin_battle',
    },
  ],
};

SCENES.fin_battle = {
  title: 'The Last Battle',
  text: s => P(
    `${V().name} comes at you with the whole weight of the Hollow behind ${V().object}.`,
    finaleAllyStrikes().length && `${finaleAllyStrikes().map(a => a.name).join(', ')} ${finaleAllyStrikes().length === 1 ? 'fights' : 'fight'} at your side.`,
    hasAlly('florian') && `You call Florian's name — and the shade of the woodcutter steps out of the air beside you, ghostly axe in hand. <i>"Together, then."</i>`,
    hasAlly('nan') && `A green marsh-light spins around ${V().short}'s head, and ${V().pronoun} flinches. Old Nan's curse. (${V().short}'s defenses are weakened.)`
  ),
  choices: s => [{
    label: 'For Florian!',
    combat: {
      deadly: true,
      enemies: s => {
        const l = [bossFight()];
        if (!hasAlly('miners')) l.push(minion());
        if (G.doom >= 7) l.push(foe('hollowed'));
        if (has('villain_enraged')) l[0].atk += 1;
        return l;
      },
      allyStrikes: s => finaleAllyStrikes(),
      loseScene: 'end_defeat',
      win: {
        effects: () => {
          ['head', 'haft', 'rune'].forEach(k => { if (G.fragments[k] === 'villain') { G.fragments[k] = 'party'; note(`Reclaimed ${FRAGMENTS[k].name}!`, 'frag'); } });
          flag('villain_slain');
          chronicle(`Defeated ${V().name} in ${V().stronghold}.`);
        },
        text: s => P(`${V().name} falls. ${has('axe_reforged') ? '' : `The stolen fragments tear loose from ${V().possessive} weapon and clatter across the floor toward you, as though they want to come home.`}`,
          `But the crack in the floor is still breathing ash — wider now, a wound in the world, and you can hear something vast moving down there. The Hollow, waking. The seal must be renewed. <i>Now.</i>`),
        next: 'fin_seal',
      },
    },
  }],
};

SCENES.fin_avatar = {
  title: 'The Hollow Made Flesh',
  text: s => P(
    `${V().short} stands beside you now, ${V().possessive} face wet, ${V().possessive} weapon raised against the thing that used ${V().object}.`,
    hasAlly('florian') && `You call Florian's name, and the shade of the woodcutter steps out of the air with a grin. <i>"Now that's more like it."</i>`,
    `The Hollow Made Flesh opens a mouth that is nothing but a hole into grey, and screams.`
  ),
  choices: s => [{
    label: 'Fight together!',
    combat: {
      deadly: true,
      enemies: s => {
        const vf = fragCount('villain');
        const e = foe({ noScale: true, name: 'The Hollow Made Flesh', hp: 70 + G.doom * 4 + vf * 8, ac: 14, atk: 6, dmg: '2d6+2', hollow: true, boss: true, burst: '2d6', xp: 400 });
        return [e];
      },
      allyStrikes: s => [{ name: V().short, verb: 'strikes at', dmg: '2d6+2' }].concat(finaleAllyStrikes()),
      loseScene: 'end_defeat',
      win: {
        effects: () => { ['head', 'haft', 'rune'].forEach(k => { if (G.fragments[k] === 'villain') { G.fragments[k] = 'party'; note(`${V().short} gives you ${FRAGMENTS[k].name}`, 'frag'); } }); chronicle('Destroyed the Hollow Made Flesh.'); },
        text: s => P(`The Hollow Made Flesh comes apart like a sandcastle in a wave. ${has('axe_reforged') ? '' : `${V().short} tears the stolen fragments from ${V().possessive} weapon and presses them into your hands.`}`,
          `But the crack in the floor still yawns, wider now, and from deep below comes the sound of something vast turning over in its sleep. The seal must be renewed. <i>Now.</i>`),
        next: 'fin_seal',
      },
    },
  }],
};

SCENES.fin_seal = {
  title: 'The Sealing',
  text: s => {
    if (has('axe_reforged')) return P(`You stand over the wound in the world with Florian's Axe in your hands. It's heavier than it looks. It always was.`, `You understand now what Florian understood. The axe doesn't cut the Hollow. It cuts the <i>ground</i> — closes it, like a seam. And it has to be swung by someone who isn't swinging it for themselves.`);
    return P(
      `All three pieces of Florian's Axe lie before you at last — but in pieces still, and there is no anvil here, no smith, no time.`,
      `The crack in the floor heaves. To seal it, the axe must be made whole <i>here</i>, in the Hollow's breath, with nothing but your hands and the old words.`
    );
  },
  choices: s => {
    if (has('axe_reforged')) return [{
      label: both('Raise the axe and bring it down', 'Grip the haft together, and bring it down'),
      text: s => P(both(`You raise the axe. You think of everyone who helped you get here. You bring it down.`, `You both take hold of the haft. Neither of you says anything. You don't need to. You bring it down together.`)),
      next: 'end_victory',
    }];
    return [
      {
        label: 'Reforge the axe in the field with the binding words',
        check: {
          skill: 'lore', dc: 16,
          mods: () => [hasAlly('keeper') && { label: `Keeper ${G.flags.keeper}'s oath-book`, value: 3 }, hasAlly('florian') && { label: 'Florian guides your hands', value: 3 }, hasItem('rune_key') && { label: 'Dwarven runes', value: 1 }, has('villain_redeemed') && { label: `${V().short} lends ${V().possessive} power`, value: 2 }],
        },
        success: { effects: () => flag('field_forged'), text: (s, c) => P(`${c.char.name} holds the pieces together with bare hands and speaks the words. The rune flares white. Head, haft and rune fuse with a sound like a tree drawing breath — and Florian's Axe is whole. There is no time to marvel. You raise it and bring it down on the wound in the world.`), next: 'end_victory' },
        failure: { text: (s, c) => P(`${c.char.name} speaks the words, but the pieces won't hold. They fuse — barely, crookedly — and the rune is cracked. The axe will close the wound. But it will not close it for free. Someone must hold it in the seam while it heals, and whoever does will not come back.`), next: 'fin_price' },
      },
    ];
  },
};

SCENES.fin_price = {
  title: 'The Price',
  text: P(`The crack is closing around the cracked axe, slowly, like a wound knitting. Someone must go down with it and hold it there. There isn't much time to choose.`),
  choices: s => {
    const l = [];
    if (has('villain_redeemed')) l.push({ label: `${V().short} steps forward`, text: s => P(`"This is mine to do," ${V().short} says. "I opened the door. Let me be the one who closes it." Before anyone can argue, ${V().pronoun} takes the axe from your hands and steps down into the dark.`), next: 'end_redemption' });
    if (hasAlly('florian')) l.push({ label: 'Florian\'s shade takes the axe', text: P(`<i>"I've been dead a hundred years,"</i> the woodcutter says gently, taking the axe. <i>"I'm not afraid of a little more."</i> He winks, and steps down into the dark.`), next: 'end_florian' });
    G.party.forEach((c, i) => l.push({ label: `${c.name} takes the axe`, effects: () => { flag('sacrifice', i); }, text: s => P(`"Someone has to," ${c.name} says, and takes the axe. ${solo() ? '' : `${G.party[1 - i].name} reaches out — too late.`} ${c.name} steps down into the dark.`), next: 'end_sacrifice' }));
    return l;
  },
};

/* ---------- Endings ---------- */
function epilogue() {
  const e = [];
  if (G.doom >= 7) e.push(`The Hollow had spread far before the end. It will be a generation before the grey fades from the northern hills.`);
  else if (G.doom >= 4) e.push(`The grey recedes slowly from the land. Some fields will lie fallow for years. But they will grow again.`);
  else e.push(`You moved fast enough. Within a season, the grey has vanished from the land as though it was never there.`);
  if (has('thornbury_saved')) e.push(`The children of Thornbury grow up telling the story of the strangers who pulled them from the fire.`);
  if (hasAlly('keeper')) e.push(`Keeper ${G.flags.keeper} writes down everything you did, so that the next time, someone will know.`);
  else e.push(`You see to it that Keeper ${G.flags.keeper} is buried with honour beside Florian's cairn.`);
  if (hasAlly('miners')) e.push(`The forges of Emberdeep burn again, and the dwarves name a new tunnel after you.`);
  if (has('miners_died')) e.push(`In Emberdeep, they still don't speak your names.`);
  if (hasAlly('nan')) e.push(`Old Nan's goat lives to a ripe and ill-tempered old age.`);
  if (has('nan_threatened')) e.push(`Travellers in the Mirewood say the bog-witch curses your names to her frogs.`);
  if (hasAlly('vosk')) e.push(`Captain Vosk sends you a crate of very fine, very illegal wine every midwinter.`);
  if (hasAlly('monks')) e.push(`The dawn bell rings again on Frosthollow Peak, every morning.`);
  else if (has('monks_lost')) e.push(`The monks of Frosthollow never wake. The mountain is silent now.`);
  if (hasAlly('florian') && !has('ending_florian')) e.push(`On still nights, the stones of the Barrow Downs whisper again — and sometimes, they laugh.`);
  if (hasAlly('sela')) e.push(`Sela becomes captain of the Hearthmoor watch. She keeps your old campfire stones on her mantel.`);
  if (has('greywater_saved')) e.push(`Greywater changes its name to Clearwater.`);
  if (has('greywater_lost')) e.push(`Greywater stands empty. Someday someone will live there again.`);
  if (G.rival.spared) e.push(`Years later, you hear of a wandering sellsword with a familiar face, protecting villages on the northern border for no pay at all.`);
  if (has('villain_redeemed') && !has('ending_redemption')) e.push(`${V().short} lives out ${V().possessive} days in quiet exile, trying to repair a little of what ${V().pronoun} broke.`);
  return e;
}

function endingText(main) {
  return P(...main) + `<div class="epilogue"><h3>Epilogue</h3>${P(...epilogue())}</div><div class="chronicle"><h3>Your Chronicle</h3><ul>${G.chronicle.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
}

SCENES.end_victory = {
  title: 'The Seal Restored', ending: 'victory',
  text: s => endingText([
    `The axe bites into the stone, and the world rings like a bell.`,
    `Grey light pours up out of the wound — and then the wound is closing, stitching itself shut along the line of the blade, stone flowing like water. The ash in the air falls still. The braziers gutter and go out. Somewhere far below, something vast sinks back into sleep.`,
    `When you step outside, the wheel of ash in the sky is breaking apart. Behind it, for the first time in weeks, is the sun.`,
    has('field_forged') ? `You reforged Florian's Axe with your bare hands in the Hollow's breath. The ballads will get the details wrong. They always do.` : `Florian's Axe goes back to the Keepers — whole this time. "No more hiding it in pieces," ${hasAlly('keeper') ? 'Keeper ' + G.flags.keeper : 'the new Keepers'} decide. "Next time, it will be ready."`,
    `<b>You have won.</b>`,
  ]),
  choices: [{ label: 'Play again — a new tale', ui: 'newgame' }],
};

SCENES.end_redemption = {
  title: 'The Last Keeper', ending: 'victory',
  first: () => flag('ending_redemption'),
  text: s => endingText([
    `${V().short} goes down into the dark with the axe, and the seam of the world closes over ${V().object} like water.`,
    `The ash stops falling. The braziers go out. Outside, the wheel of grey in the sky breaks apart, and behind it is the sun.`,
    `${V().short} began this war to rule the Hollow, or to give in to it. ${cap(V().pronoun)} ended it as its jailer. The Keepers carve ${V().possessive} true name beside Florian's on the cairn: the last Keeper, and maybe the bravest.`,
    `<b>You have won — and saved more than the world.</b>`,
  ]),
  choices: [{ label: 'Play again — a new tale', ui: 'newgame' }],
};

SCENES.end_florian = {
  title: 'The Woodcutter\'s Rest', ending: 'victory',
  first: () => flag('ending_florian'),
  text: s => endingText([
    `Florian goes down into the dark with his axe, whistling. The seam of the world closes over him.`,
    `The Hollow sleeps. The sun comes out. Florian Thane, who held back the grey twice, finally gets to rest — and this time, you're fairly sure, he isn't sorry about anything at all.`,
    `<b>You have won.</b>`,
  ]),
  choices: [{ label: 'Play again — a new tale', ui: 'newgame' }],
};

SCENES.end_sacrifice = {
  title: 'The Price Paid', ending: 'victory',
  text: s => {
    const hero = G.party[G.flags.sacrifice || 0];
    return endingText([
      `${hero.name} goes down into the dark with the axe, and the seam of the world closes over them.`,
      `The Hollow sleeps. Outside, the sun comes out over a land that will heal.`,
      solo() ? `There is no one left in the hall to mourn. But in Hearthmoor, they build a statue: a ${Character.describe(hero).toLowerCase()} with a cracked axe, standing beside the woodcutter.` : `${G.party[1 - (G.flags.sacrifice || 0)].name} walks out of ${V().stronghold} alone. In Hearthmoor, they build a statue: a ${Character.describe(hero).toLowerCase()} with a cracked axe, standing beside the woodcutter.`,
      `<b>You have won — at a terrible price.</b>`,
    ]);
  },
  choices: [{ label: 'Play again — a new tale', ui: 'newgame' }],
};

SCENES.end_defeat = {
  title: 'The Grey', ending: 'defeat',
  text: s => endingText([
    `You fall. The last thing you see is ${V().short} standing over you, and behind ${V().object}, the wound in the world splitting wide.`,
    `The Hollow comes up out of the earth like a tide. It rolls over ${V().stronghold}, over the hills, over Hearthmoor and Thornbury and all the roads between. The colour drains out of everything. The world goes quiet.`,
    `Somewhere, a hundred years from now, perhaps someone will pick up the pieces of an old axe and try again.`,
    `<b>You have been defeated.</b>`,
  ]),
  choices: [{ label: 'Try again — a new tale', ui: 'newgame' }],
};
