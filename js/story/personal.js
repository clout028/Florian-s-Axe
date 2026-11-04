/* ===========================================================
   PERSONAL STORIES — backgrounds, bonds, camp conversations.
   Each background has a three-beat personal quest:
     beat 1 in Hearthmoor after the first journey,
     beat 2 in Hearthmoor after the second,
     beat 3 paid off in the finale (see finale.js hooks).
   =========================================================== */

const BACKGROUNDS = {
  knight: {
    name: 'Disgraced Knight', icon: '🛡️',
    desc: 'You fled a battle once, and the Order of the Hearth cast you out. You have been running from that day ever since.',
    fx: { skills: { athletics: 2, intimidation: 1 } }, perk: '+2 Athletics, +1 Intimidation',
  },
  smuggler: {
    name: 'Ex-Smuggler', icon: '🎲',
    desc: 'You ran contraband for Silas Crane, the Gutter King of Hearthmoor — and you still owe him. Crane never forgets a debt.',
    fx: { skills: { sleight: 2, deception: 1 } }, perk: '+2 Sleight of Hand, +1 Deception',
  },
  touched: {
    name: 'Hollow-Touched', icon: '🌫️',
    desc: 'As a child you wandered into a pocket of the Hollow and walked out again. No one knows how. Sometimes you still hear it.',
    fx: { skills: { arcana: 2, insight: 1 } }, perk: '+2 Arcana, +1 Insight — but you begin with 2 Corruption',
    corruption: 2,
  },
  descendant: {
    name: 'Florian\'s Blood', icon: '🪓',
    desc: 'Your grandmother swore your family descends from Florian Thane himself. You have never known whether to believe her.',
    fx: { skills: { lore: 2, persuasion: 1 } }, perk: '+2 Lore, +1 Persuasion',
  },
  deserter: {
    name: 'Deserter', icon: '🗝️',
    desc: 'You once served the enemy — before you understood what they really wanted. You ran. They have not forgotten you.',
    fx: { skills: { stealth: 2, insight: 1 } }, perk: '+2 Stealth, +1 Insight',
  },
  healer: {
    name: 'Grieving Healer', icon: '🌿',
    desc: 'Your brother Tobin walked into the grey fog last winter and came back a husk. You swore you would find a cure.',
    fx: { skills: { medicine: 2, survival: 1 } }, perk: '+2 Medicine, +1 Survival',
  },
};

const BONDS = {
  siblings: { name: 'Sworn Siblings', start: 6, desc: 'Not by blood, but by oath. You would die for each other — and have nearly done so.' },
  friends: { name: 'Childhood Friends', start: 7, desc: 'You grew up in the same village. You know each other\'s worst jokes and best secrets.' },
  mentor: { name: 'Mentor & Student', start: 5, desc: 'One of you taught the other everything they know. Lately, the student has been asking hard questions.' },
  rivals: { name: 'Old Rivals', start: 3, desc: 'You have competed at everything since you met. Neither of you will admit how much you respect the other.' },
  strangers: { name: 'Strangers on the Road', start: 4, desc: 'You met the night this began. You know almost nothing about each other. Yet.' },
};

const bgHero = bg => G.party.find(c => c.background === bg);
const hasBg = bg => !!bgHero(bg);
const pq = (bg, k) => G.flags[`pq_${bg}_${k}`];
const setPq = (bg, k, v = true) => { G.flags[`pq_${bg}_${k}`] = v; };

function bond(n) {
  if (solo() || G.bond === undefined) return;
  const before = G.bond;
  G.bond = Math.max(0, Math.min(10, G.bond + n));
  if (n > 0) note(`Bond +${n} (${G.bond}/10)`, 'ally');
  if (n < 0) note(`Bond ${n} (${G.bond}/10)`, 'bad');
  if (before < 8 && G.bond >= 8) note('Your bond is unbreakable: "Fight as One" unlocked in battle', 'level');
  if (before > 2 && G.bond <= 2) note('Your bond is fraying. You can no longer help each other with checks.', 'bad');
}
const bondName = () => (G.bondType ? BONDS[G.bondType].name : '');

/* Which personal scene (if any) should play when the party returns to Hearthmoor? */
function pendingPersonal() {
  const n = G.regionsDone.length;
  for (const c of G.party) {
    const bg = c.background;
    if (!bg) continue;
    if (n >= 1 && !pq(bg, 'b1')) return `bg_${bg}_1`;
    if (n >= 2 && !pq(bg, 'b2')) return `bg_${bg}_2`;
  }
  if (n >= 2 && !has('camp_done')) return 'camp';
  return null;
}

/* ======================= DISGRACED KNIGHT ======================= */
SCENES.bg_knight_1 = {
  title: 'The Order of the Hearth',
  first: () => setPq('knight', 'b1'),
  text: s => {
    const k = bgHero('knight');
    return P(`A column of knights in red-and-gold surcoats rides through Hearthmoor's gate: the Order of the Hearth, come to defend the town. At their head rides a grey-bearded woman with a ruined eye — <b>Ser Aldane</b>, who once commanded ${k.name}.`,
      `She reins in when she sees ${k.name}. The whole column stops. "Well," she says, loud enough for the market to hear. "The one who ran from Redford Bridge. Come to run from this war too?"`);
  },
  choices: s => {
    const k = bgHero('knight');
    return [
      { label: `${k.name} kneels and asks forgiveness`, effects: () => { flag('knight_humble'); }, text: P(`${k.name} kneels in the mud of the market square. "I was afraid," they say. "I'm still afraid. But I'm not running this time." Aldane studies them for a long moment, then rides on without a word. But she does not laugh.`), next: 'hub' },
      {
        label: `${k.name} meets her eye and refuses to be shamed`,
        check: { skill: 'intimidation', dc: 13 }, noTempt: true,
        success: { effects: () => flag('knight_proud'), text: (s, c) => P(`"I ran once," ${k.name} says. "I've been fighting ever since. Ask the ${V().minions} I've buried." A few of the younger knights shift in their saddles. Aldane's mouth twitches — not quite a smile. "We'll see," she says.`), next: 'hub' },
        failure: { effects: () => flag('knight_shamed'), text: P(`The words come out wrong. The knights laugh. Aldane rides on, and the laughter follows her column through the gate.`), next: 'hub' },
      },
      { label: 'Walk away', effects: () => flag('knight_shamed'), text: P(`${k.name} turns and walks away. Behind them, someone in the column spits.`), next: 'hub' },
    ];
  },
};

SCENES.bg_knight_2 = {
  title: 'Redford Bridge, Again',
  first: () => setPq('knight', 'b2'),
  text: s => {
    const k = bgHero('knight');
    return P(`A rider gallops into Hearthmoor, bloodied. "The Order — at the old ford — husks, hundreds of them!" Ser Aldane's company has been cut off by a tide of the hollowed, at a ford that looks almost exactly like Redford Bridge.`,
      `${k.name} feels the old fear crawl up their spine. The same river-smell. The same screaming.`, !has('knight_shamed') && `Aldane didn't laugh at them, last time. That has to count for something.`);
  },
  choices: s => {
    const k = bgHero('knight');
    return [
      {
        label: `${k.name} rides to the ford — and holds the line this time`,
        check: { skill: 'wis', dc: s => has('knight_shamed') ? 15 : 13, mods: () => [has('knight_humble') && { label: 'Owned their failure', value: 2 }] }, noTempt: true,
        success: {
          effects: () => { setPq('knight', 'redeemed'); addAlly('knights', 'the Knights of the Hearth'); giveXp(80); chronicle(`${k.name} held the ford that they once fled, and saved Ser Aldane's knights.`); },
          text: (s, c) => P(`${k.name} plants their feet on the ford stones while the husks come on, and does not move. Not when the first wave hits. Not when the second does. The knights rally behind them.`,
            `When it is over, Ser Aldane rides up, her sword notched to the hilt. She takes off her gauntlet and offers her bare hand. "Ser ${k.name}," she says — the title they lost. "The Order rides with you."`),
          next: 'hub',
        },
        failure: {
          effects: () => { setPq('knight', 'broken'); hurt(k, '2d6'); injure(k); chronicle(`${k.name} could not hold the ford. Ser Aldane fell there.`); },
          text: (s, c) => P(`${k.name} goes. They fight. But when the husks break through the shield wall, the old terror closes over them like water, and they find themselves on the far bank without knowing how they got there.`,
            `Ser Aldane does not come back from the ford. Her notched sword is brought to Hearthmoor on a cart, and ${k.name} cannot look at it.`),
          next: 'hub',
        },
      },
      {
        label: 'Send word to the town militia instead — the quest comes first',
        effects: () => { setPq('knight', 'broken'); doom(-1); chronicle(`${k.name} did not go to the ford. Ser Aldane fell there.`); },
        text: P(`The militia marches, too late. Ser Aldane dies at the ford with half her knights. You used the time well — the Map is better studied, the road better scouted — but ${k.name} sits awake all night, staring at nothing.`),
        next: 'hub',
      },
    ];
  },
};

/* ======================= EX-SMUGGLER ======================= */
SCENES.bg_smuggler_1 = {
  title: 'The Gutter King\'s Collector',
  first: () => setPq('smuggler', 'b1'),
  text: s => {
    const k = bgHero('smuggler');
    return P(`A thin man in a too-nice coat falls into step beside ${k.name} in the market. "Mister Crane sends his regards," he says pleasantly. "And a reminder. Forty gold, plus three years of interest. Call it fifty."`,
      `Silas Crane, the Gutter King. ${k.name} remembers how he dealt with people who didn't pay: a quiet visit, a long walk off a short pier.`);
  },
  choices: s => {
    const k = bgHero('smuggler');
    return [
      { label: 'Pay the debt in full (50 gold)', cost: { gold: 50 }, effects: () => setPq('smuggler', 'paid'), text: P(`The collector counts every coin twice. "Mister Crane will be delighted," he says. "He always did like you." It doesn't sound like a compliment.`), next: 'hub' },
      { label: 'Promise Crane a favour instead', effects: () => setPq('smuggler', 'favour'), text: P(`"A favour," the collector repeats, as though tasting the word. "Mister Crane does love favours. He'll be in touch." He tips his hat and melts into the crowd.`), next: 'hub' },
      {
        label: 'Tell Crane\'s man exactly where he can put his interest',
        check: { skill: 'intimidation', dc: 14 }, noTempt: true,
        success: { effects: () => setPq('smuggler', 'defied'), text: (s, c) => P(`${c.char.name} leans in close and says something quiet. The collector goes pale and leaves without another word. Crane will hear of this. Crane will not be pleased.`), next: 'hub' },
        failure: { effects: () => { setPq('smuggler', 'defied'); hurt(k, '1d8'); }, text: (s, c) => P(`The collector smiles, and two large men step out of an alley. They are very professional about it. When they leave, ${k.name} is spitting blood, and the debt is still owed.`), next: 'hub' },
      },
    ];
  },
};

SCENES.bg_smuggler_2 = {
  title: 'The Favour',
  first: () => setPq('smuggler', 'b2'),
  text: s => {
    const k = bgHero('smuggler');
    if (pq('smuggler', 'paid')) return P(`A note is pushed under the door of your room at the inn. <i>"Paid in full. I like a client who pays. If you ever need a door opened in a place you shouldn't be — ask. — S.C."</i>`, `It seems the Gutter King has decided ${k.name} is worth keeping friendly.`);
    if (pq('smuggler', 'favour')) return P(`Crane himself is waiting in ${k.name}'s room at the inn, sitting in the only chair, eating your apples. He is a soft, round man with a voice like warm butter.`,
      `"The favour," he says. "${V().short}'s people are paying very well for news of your movements. I'd like to sell it to them. All I need is your route." He smiles. "I'll make up the details, of course. Mostly."`);
    return P(`${k.name} notices the men following them at dusk — two of Crane's best. They are not here to talk.`);
  },
  choices: s => {
    const k = bgHero('smuggler');
    if (pq('smuggler', 'paid')) return [{ label: 'Keep the note', effects: () => setPq('smuggler', 'ally'), next: 'hub' }];
    if (pq('smuggler', 'favour')) return [
      { label: 'Give him a route — the real one', effects: () => { setPq('smuggler', 'ally'); doom(1); chronicle(`${k.name} sold the party's route to Silas Crane to settle an old debt.`); }, text: P(`Crane writes it down with a happy little hum. "Pleasure doing business." You will travel slower now, watching your backs. But the Gutter King owes you, and he is a man who pays his debts too.`), next: 'hub' },
      {
        label: 'Feed him a false route — and let him sell it',
        check: { skill: 'deception', dc: 14 },
        success: { effects: () => { setPq('smuggler', 'ally'); flag('villain_misled'); giveXp(60); }, text: (s, c) => P(`${c.char.name} spins a beautiful lie: a secret approach from the east, a hidden ally, a feint. Crane buys it, and sells it on at a handsome profit. Somewhere, ${V().short}'s forces are marching the wrong way.`, `(The enemy will be weaker when you arrive.)`), next: 'hub' },
        failure: { effects: () => setPq('smuggler', 'enemy'), text: P(`Crane listens, smiling, then sighs. "You always were a terrible liar." He leaves. The next morning there is a dead rat on your pillow. The Gutter King is now your enemy.`), next: 'hub' },
      },
      { label: 'Turn Crane over to the town watch', effects: () => { setPq('smuggler', 'enemy'); addGold(20); }, text: P(`The watch drags Crane away in irons, still smiling. There is a reward. There will also, you suspect, be a reckoning — the Gutter King has friends in every gutter.`), next: 'hub' },
    ];
    return [{
      label: 'Fight Crane\'s men in the alley',
      combat: {
        enemies: s => [foe('thug', { name: 'Crane\'s Knife' }), foe('thug', { name: 'Crane\'s Cudgel' })],
        actions: s => battleActions('barrels'),
        win: { effects: () => setPq('smuggler', 'enemy'), text: P(`The thugs lie groaning in the alley. Crane will send more. But not tonight.`), next: 'hub' },
        flee: { effects: () => setPq('smuggler', 'enemy'), text: P(`You run, and the alley swallows the sound of their curses.`), next: 'hub' },
        lose: { effects: () => { setPq('smuggler', 'enemy'); addGold(-Math.min(G.gold, 30)); }, text: P(`They take what you're carrying and leave you in the gutter, as a message.`), next: 'hub' },
      },
    }];
  },
};

/* ======================= HOLLOW-TOUCHED ======================= */
SCENES.bg_touched_1 = {
  title: 'The Voice in the Grey',
  first: () => { setPq('touched', 'b1'); G._clue = addClue(); },
  text: s => {
    const k = bgHero('touched');
    const c = G._clue; G._clue = null;
    return P(`That night, ${k.name} dreams of the grey place they wandered into as a child: a field of ash under a white sky, perfectly silent. It has been years since they dreamed of it. But this time, someone is standing in the field. ${V().name}.`,
      `${V().short} doesn't see them. ${cap(V().pronoun)} is talking to the Hollow, and the Hollow is answering — and ${k.name} hears it all.`,
      c ? `<b>${c}</b>` : `But it is nothing ${k.name} doesn't already know.`,
      `${k.name} wakes shaking, the taste of ash in their mouth. The Hollow knows they were listening.`);
  },
  choices: s => [{ label: 'Tell the others what you saw', next: 'hub' }],
};

SCENES.bg_touched_2 = {
  title: 'The Door Inside',
  first: () => setPq('touched', 'b2'),
  text: s => {
    const k = bgHero('touched');
    return P(`The whispers are louder now. ${k.name} hears them in crowds, in rain, in the crackle of the hearth. Mother Brisk, the healer, looks into ${k.name}'s eyes and goes very quiet.`,
      `"There's a door in you," she says at last. "Left open when you were small. The Hollow comes and goes through it as it pleases. I can close it. It'll hurt like nothing you've ever felt, and it might not work. Or…" She hesitates. "Or you could walk through it. Some do. They come back stronger. They don't always come back <i>themselves</i>."`);
  },
  choices: s => {
    const k = bgHero('touched');
    return [
      {
        label: `Close the door — whatever it costs`,
        check: { skill: 'con', dc: 13 }, noTempt: true, noPartial: true,
        success: { effects: () => { setPq('touched', 'closed'); k.corruption = 0; note(`${k.name}'s Corruption is gone`, 'good'); chronicle(`${k.name} closed the door the Hollow had left in them.`); }, text: (s, c) => P(`It hurts like nothing ${k.name} has ever felt. Then, for the first time since they were six years old, it is completely quiet inside their head. They weep for an hour, and don't know if it is grief or relief.`), next: 'hub' },
        failure: { effects: () => { setPq('touched', 'scarred'); injure(k, 'hollow_bite'); corrupt(k, -1); }, text: (s, c) => P(`Brisk's ritual tears at ${k.name} for a long hour — and fails. The door stays open a crack, and the place where she worked is a weeping grey wound. The voice is quieter. It is also angry.`), next: 'hub' },
      },
      {
        label: 'Walk through the door', hollow: true,
        effects: () => { setPq('touched', 'embraced'); corrupt(k, 2); flag('touched_power'); chronicle(`${k.name} walked through the door into the Hollow — and came back.`); },
        text: P(`${bgHero('touched').name} closes their eyes and steps through. The grey field. The white sky. And the Hollow, vast and patient, which looks at them and — for a moment — is <i>afraid</i>. When they open their eyes, Brisk has backed against the wall. They feel strong. They feel cold. They know things about the Hollow now that nobody else knows.`, `(Grey Fire hits harder for them. In the finale, the Hollow's secrets may be turned against it.)`),
        next: 'hub',
      },
    ];
  },
};

/* ======================= FLORIAN'S BLOOD ======================= */
SCENES.bg_descendant_1 = {
  title: 'The Family Tree',
  first: () => { setPq('descendant', 'b1'); flag('descendant_true', Dice.chance(0.5)); },
  text: s => {
    const k = bgHero('descendant');
    return P(`${hasAlly('keeper') ? `Keeper ${G.flags.keeper}` : 'An old archivist at the Hearthmoor chapel'} hears ${k.name}'s family story and frowns. "Florian's line? The Keepers kept records of everyone who claimed his blood. There's a whole box of liars." A pause. "And one or two who weren't."`,
      `The records are in the chapel undercroft, under a century of dust and mouse-droppings. Finding ${k.name}'s family among them will take care — or luck.`,
      G.villain === 'morvane' && `You remember that ${V().short} claims Florian's blood too.`);
  },
  choices: s => [
    {
      label: 'Search the records',
      check: { skill: 'investigation', dc: 13 },
      success: { effects: () => setPq('descendant', 'found'), text: (s, c) => P(`${c.char.name} finds it after three hours: a brittle page with ${bgHero('descendant').name}'s grandmother's name on it, and a line of ink leading back… and back… to a smudge where someone has spilled wine. The last link is unreadable. But there's a note in the margin: <i>"See the haft."</i>`), next: 'hub' },
      failure: { effects: () => setPq('descendant', 'lost'), text: P(`Hours of dust and nothing. If the answer is down here, it doesn't want to be found.`), next: 'hub' },
    },
    { label: 'Leave it. Blood doesn\'t matter — deeds do', effects: () => { setPq('descendant', 'deeds'); giveXp(40, bgHero('descendant')); }, text: P(`${bgHero('descendant').name} closes the box. "If I'm his blood, I'll act like it. If I'm not, I'll act like it anyway." The archivist smiles for the first time.`), next: 'hub' },
  ],
};

SCENES.bg_descendant_2 = {
  title: 'The Oath on the Haft',
  first: () => setPq('descendant', 'b2'),
  text: s => {
    const k = bgHero('descendant');
    const haft = G.fragments.haft;
    if (haft === 'party') return P(`Late at night, ${k.name} turns the Heartwood Haft over in their hands and reads Florian's oath carved along it. At the very end, almost worn away, is something nobody has noticed: a list of names. Florian's children.`,
      has('descendant_true') ? `The third name is ${k.name}'s grandmother's grandmother. It is true. It was always true.` : `None of them are ${k.name}'s family. Not one. Grandmother was wrong — or lying.`);
    return P(`${k.name} cannot stop thinking about the margin note: <i>"See the haft."</i> But the Heartwood Haft ${haft === 'villain' ? `is in ${V().short}'s hands` : 'has not been found'}. Whatever it would have said, ${k.name} may never know.`);
  },
  choices: s => {
    const k = bgHero('descendant');
    const knows = G.fragments.haft === 'party';
    if (knows && has('descendant_true')) return [{ label: `${k.name} is Florian's blood`, effects: () => { setPq('descendant', 'blood'); chronicle(`${k.name} learned they truly descend from Florian Thane.`); }, text: P(`${k.name} sits with it a long time. It doesn't feel like a crown. It feels like a debt.`, `(The reforged axe will answer to them as to no one else.)`), next: 'hub' }];
    if (knows) return [
      { label: 'Laugh it off', effects: () => { setPq('descendant', 'deeds'); bond(1); }, text: P(`${k.name} laughs until they cry. "All my life," they say. "All my life I thought I had to live up to him." It is the lightest anyone has seen them.`), next: 'hub' },
      { label: 'Keep the lie — let people believe it', effects: () => { setPq('descendant', 'liar'); }, text: P(`${k.name} tells no one. If people fight harder for Florian's heir, then Florian's heir they'll have.`), next: 'hub' },
    ];
    return [{ label: 'Let it lie', effects: () => setPq('descendant', 'unknown'), next: 'hub' }];
  },
};

/* ======================= DESERTER ======================= */
SCENES.bg_deserter_1 = {
  title: 'A Face from Before',
  first: () => setPq('deserter', 'b1'),
  text: s => {
    const k = bgHero('deserter');
    return P(`In the crowd at the Copper Kettle, ${k.name} sees a face they had hoped never to see again: <b>Marrow</b>, who once stood beside them in ${V().short}'s service, wearing ${V().sigil}. Marrow sees them too. His drink stops halfway to his mouth.`,
      `Marrow is not wearing the sigil now. He looks thin, frightened and very tired.`);
  },
  choices: s => {
    const k = bgHero('deserter');
    return [
      { label: 'Sit down across from him', effects: () => setPq('deserter', 'talked'), text: P(`"I ran too," Marrow says, before ${k.name} can speak. "After you. After I saw what ${V().short} really wants." He wipes his eyes. "There are others like us still inside. Too scared to run. If they thought there was a chance…" He trails off.`), next: 'hub' },
      { label: 'Follow him out and make sure he never talks', hollow: true, effects: () => { setPq('deserter', 'silenced'); corrupt(k, 1); chronicle(`${k.name} silenced an old comrade from ${V().short}'s service.`); }, text: P(`Marrow never makes it to the end of the alley. ${k.name} tells themselves it was necessary. Their secret is safe. They do not sleep well.`), next: 'hub' },
      { label: 'Leave before he can follow', effects: () => setPq('deserter', 'avoided'), text: P(`${k.name} slips out the back door. When they look back, Marrow is gone.`), next: 'hub' },
    ];
  },
};

SCENES.bg_deserter_2 = {
  title: 'The Ones Who Stayed',
  first: () => setPq('deserter', 'b2'),
  text: s => {
    const k = bgHero('deserter');
    if (pq('deserter', 'talked')) return P(`Marrow finds ${k.name} again, breathless. "I got word inside. Six of them. They'll open a door for you when you come — but only if you swear they won't be hanged afterwards."`);
    if (pq('deserter', 'silenced')) return P(`Marrow's body was found. Word has reached ${V().short}'s followers that the deserter ${k.name} is killing old comrades. Whatever sympathy there was inside for ${k.name}, it is gone.`);
    return P(`A note, slipped under ${k.name}'s door, unsigned: <i>"We know you. Some of us are still inside, and still afraid. Show us it can be done."</i>`);
  },
  choices: s => {
    const k = bgHero('deserter');
    if (pq('deserter', 'talked')) return [
      { label: 'Swear it', effects: () => { setPq('deserter', 'inside'); G.flags.mercy = (G.flags.mercy || 0) + 1; chronicle(`${k.name} swore mercy to the deserters still inside ${V().stronghold}.`); }, text: P(`${k.name} swears on the Keeper's sigil. Marrow grips their hand. "Then we'll be waiting."`), next: 'hub' },
      { label: 'Refuse — they chose their side', effects: () => setPq('deserter', 'refused'), text: P(`Marrow's face closes like a door. "Then they'll die in there," he says. "And so might you."`), next: 'hub' },
    ];
    if (pq('deserter', 'silenced')) return [{ label: 'So be it', effects: () => setPq('deserter', 'hunted'), next: 'hub' }];
    return [{
      label: 'Leave a reply where they will find it',
      check: { skill: 'persuasion', dc: 13 },
      success: { effects: () => setPq('deserter', 'inside'), text: P(`You write it carefully, and leave it at the shrine on the north road. Three days later, the note is gone, and in its place is a scrap of black cloth stitched with a tiny door. They're with you.`), next: 'hub' },
      failure: { effects: () => setPq('deserter', 'refused'), text: P(`You leave a reply. No answer comes.`), next: 'hub' },
    }];
  },
};

/* ======================= GRIEVING HEALER ======================= */
SCENES.bg_healer_1 = {
  title: 'Tobin',
  first: () => setPq('healer', 'b1'),
  text: s => {
    const k = bgHero('healer');
    return P(`A cart of husks has been brought into Hearthmoor — hollowed villagers, gathered from the roads, kept in the old tithe barn so they won't wander. ${k.name} goes to see them, as they do in every town, looking at every grey face.`,
      `And there, in the corner, rocking slowly: Tobin. Their brother. Grey-eyed, silent, alive.`);
  },
  choices: s => {
    const k = bgHero('healer');
    return [
      {
        label: 'Study his sickness — there must be a way',
        check: { skill: 'medicine', dc: 13, mods: () => [hasAlly('nan') && { label: 'Old Nan\'s remedies', value: 2 }, hasAlly('monks') && { label: 'The monks\' teachings', value: 2 }] },
        success: { effects: () => setPq('healer', 'lead'), text: (s, c) => P(`${c.char.name} works through the night. Toward dawn, Tobin's finger twitches when they hold a fragment of the old Keeper sigil to his skin. The grey <i>flinches</i> from it. There is something in the old binding magic — the magic of the axe — that the Hollow can't stand.`), next: 'hub' },
        failure: { effects: () => setPq('healer', 'stuck'), text: P(`Nothing works. Tobin rocks and stares. ${bgHero('healer').name} stays with him until the guards make them leave.`), next: 'hub' },
      },
      { label: 'Sit with him a while', effects: () => { setPq('healer', 'stuck'); healAll('1d6'); }, text: P(`${k.name} sits beside Tobin and talks to him about home — the orchard, the dog, their mother's terrible soup. He doesn't answer. But he stops rocking.`), next: 'hub' },
    ];
  },
};

SCENES.bg_healer_2 = {
  title: 'The Grey-Cure',
  first: () => setPq('healer', 'b2'),
  text: s => {
    const k = bgHero('healer');
    const lead = pq('healer', 'lead');
    const frag = fragCount('party') > 0;
    return P(lead ? `${k.name} has been working on it every night: a tincture, steeped in light from the Keeper's sigil${frag ? ' and the fragment you carry' : ''}.` : `${k.name} has been working on it every night, without much hope.`,
      frag ? `With a fragment of Florian's Axe to draw from, it might actually work. It will take days to brew enough to matter — days the Hollow will use.` : `Without a fragment of Florian's Axe, there is no light strong enough to work with.`);
  },
  choices: s => {
    const k = bgHero('healer');
    const frag = fragCount('party') > 0;
    if (!frag) return [{ label: 'Keep searching', effects: () => setPq('healer', 'nocure'), text: P(`${k.name} keeps notes. Maybe someday.`), next: 'hub' }];
    return [
      {
        label: 'Take the time to brew the Grey-Cure (+1 Doom)',
        check: { skill: 'medicine', dc: s => pq('healer', 'lead') ? 11 : 14 },
        success: {
          effects: () => { doom(1); setPq('healer', 'cure'); addPack('grey_cure', 2); chronicle(`${k.name} brewed a cure for the hollowed — and woke their brother Tobin.`); },
          text: (s, c) => P(`Three days and nights. On the fourth morning, ${k.name} tips a spoonful of the shimmering tincture between Tobin's lips. He coughs. He blinks. His eyes are brown. "…${k.name}?" he croaks — and ${k.name} is already holding him.`,
            `There is enough left for a few doses. And if it can wake one husk, it can wake others.`),
          next: 'hub',
        },
        failure: { effects: () => { doom(1); setPq('healer', 'nocure'); }, text: P(`Three days, and the tincture turns grey in the bottle. Tobin doesn't stir. ${bgHero('healer').name} pours it out with shaking hands.`), next: 'hub' },
      },
      { label: 'No time. The quest comes first', effects: () => setPq('healer', 'nocure'), text: P(`${k.name} packs the notes away. "When this is over," they promise Tobin. "When this is over."`), next: 'hub' },
    ];
  },
};

/* ======================= CAMP CONVERSATIONS ======================= */
SCENES.camp = {
  title: 'Around the Fire',
  first: () => { flag('camp_done'); healAll('1d8'); },
  text: s => {
    if (solo()) {
      const c = G.party[0];
      return P(`You make camp in the hills above Hearthmoor, too restless for an inn. ${hasAlly('keeper') ? `Keeper ${G.flags.keeper} joins you by the fire, wrapped in a blanket, and for a while neither of you speaks.` : `You sit alone with the dead Keeper's journal, reading it by firelight.`}`,
        (c.corruption || 0) >= 3 ? `${hasAlly('keeper') ? `"Your hands," ${G.flags.keeper} says quietly. "The veins in them are grey."` : `In the firelight, you notice the veins in your hands have gone grey.`}` : `Two journeys done. One to go. Then ${V().short}.`);
    }
    const [a, b] = G.party;
    const corrupt = G.party.find(c => (c.corruption || 0) >= 3);
    const lines = [`You make camp in the hills above Hearthmoor, too restless for the inn. The fire pops. ${a.name} and ${b.name} — ${bondName().toLowerCase()} — sit on opposite sides of it, and for a long time neither of them says anything.`];
    if (G.fallen && G.fallen.length) lines.push(`There is an empty place by the fire. You both look at it.`);
    else if (corrupt) lines.push(`Finally ${G.party.find(c => c !== corrupt).name} speaks. "Your eyes went grey, back there. I saw it."`);
    else if (G.bondType === 'rivals') lines.push(`Finally ${a.name} breaks the silence. "You were good today. Better than me." It visibly costs them to say it.`);
    else if (G.bondType === 'mentor') lines.push(`Finally ${b.name} asks the question they have been holding in for days: "Why did you really take me on? Was it for this?"`);
    else if (G.bondType === 'strangers') lines.push(`Finally ${a.name} says, "I don't even know where you're from." ${b.name} laughs, surprised.`);
    else lines.push(`Finally ${a.name} says, "What will you do? After?" — and the word hangs there, hopeful.`);
    return P(...lines);
  },
  choices: s => {
    if (solo()) {
      const c = G.party[0];
      return [
        { label: hasAlly('keeper') ? 'Tell the Keeper what frightens you' : 'Write your own entry in the journal', effects: () => { restoreFocus(); giveXp(40); if (c.corruption) corrupt(c, -1); }, text: P(hasAlly('keeper') ? `${G.flags.keeper} listens, and doesn't try to fix anything, and that helps more than you expected.` : `You write until the fire burns low. It helps, a little, to put it down where someone might read it one day.`), next: 'hub' },
        { label: 'Sharpen your weapons and say nothing', effects: () => { G.party.forEach(p => { p.focus = Character.maxFocus(p); }); }, text: P(`The whetstone's rhythm is its own kind of prayer.`), next: 'hub' },
      ];
    }
    const [a, b] = G.party;
    return [
      { label: 'Open up — tell the truth about why you came', effects: () => { bond(2); restoreFocus(); }, text: s => P(`It comes out haltingly at first, then all at once. ${a.background ? BACKGROUNDS[a.background].desc.replace(/^You /, `${a.name} `) : ''} ${b.background ? BACKGROUNDS[b.background].desc.replace(/^You /, `${b.name} `) : ''}`, `By the time the fire burns down, you know each other a little better than you did. It feels like armour.`), next: 'hub' },
      { label: 'Laugh it off and tell old stories', effects: () => { bond(1); healAll('1d6'); }, text: P(`You tell the worst jokes you know, and the story about the goat, and the one about the bishop. You laugh until your ribs hurt. It's enough, for tonight.`), next: 'hub' },
      { label: 'Argue about what comes next', effects: () => { bond(-1); giveXp(40); }, text: P(`It starts small and gets loud. Who should lead. Whether you should have spared the lieutenant. Whether you can even win. Neither of you backs down. You both lie awake afterwards, angry — and thinking harder than you have in weeks.`), next: 'hub' },
    ];
  },
};

/* Grey-Cure consumable */
ITEMS.grey_cure = { name: 'Grey-Cure Tincture', consumable: true, heal: '2d8+4', cleanse: 3, desc: 'Heals 2d8+4 and removes 3 Corruption' };

/* "Fight as One" — for bonds of 8+ */
BATTLE_ACTIONS.as_one = {
  label: 'Fight as One', desc: 'Your bond is a weapon: both heroes +3 attack and healed 1d8 this battle', once: true,
  success: () => { G.party.forEach(c => { if (Combat.st.buffs[c.id]) Combat.st.buffs[c.id].attack += 3; if (c.hp > 0) Character.heal(c, Dice.roll('1d8').total); }); Combat.log('You move together like one person with four hands.', 'crit'); },
};
