/* ===========================================================
   A TRAVELLING COMPANION
   Someone walks with you from the first time you reach
   Hearthmoor. They fight beside you, comment on places, react
   to what you choose (approval rises and falls), talk at the
   fire — and at the end they may give everything for you, or
   turn on you.

   Choices are read for TAGS: kind, cruelty, greed, cunning,
   brave, faith, lore, hollow. Each companion likes some and
   dislikes others. Story files can set `tag: 'kind'` on any
   choice to be explicit; otherwise the label is read for
   keywords.
   =========================================================== */

const COMPANIONS = {
  bran: {
    name: 'Bran Ironwick', short: 'Bran', icon: 'dwarf', pro: 'he', cls: 'sellsword',
    blurb: 'A dwarf sellsword with a notched axe and a dry tongue. Fights for coin, stays for loyalty.',
    likes: ['brave', 'greed', 'kind'], dislikes: ['cunning', 'hollow'],
    special: { name: 'Battle Roar', every: 3, text: n => `Bran bellows a dwarven war-cry. Every enemy is rattled.` },
    hit: { dmg: '1d6+1', verb: 'cleaves into' },
    bark: {
      mire: `"Bogs. Always bogs." Bran squelches ahead. "Mark me: if anything here has teeth, I'm charging double."`,
      mines: `Bran goes quiet at the mouth of the mines. "My uncle dug here," he says at last. "Come on. Let's see what's left of it."`,
      harbor: `"Smugglers," Bran says, with a certain fondness. "Keep your hand on your purse, and your other hand on your axe."`,
      barrow: `"Florian's grave." Bran takes off his helm. "Even a hired axe knows when to show respect."`,
      orchard: `"Elves." Bran eyes the silver trees. "Beautiful. Won't last a week in a proper shield wall, but beautiful."`,
      court: `Bran tugs at his borrowed finery with a face like thunder. "If anyone laughs, I'm putting them through the window."`,
      wych: `"Don't like this place," Bran mutters, and for once he isn't joking. His hand doesn't leave his axe.`,
      peak: `"Cold enough to freeze a dwarf's beard," Bran grumbles. "And I've a lot of beard."`,
    },
    talks: [
      { need: 0, text: `Bran is sharpening his axe by the fire. "You want to know why I hired out?" he says. "Clan Ironwick lost the Deep Forge's contract. My brother took it badly. I took it worse." He looks at the blade. "Coin is just a way of saying someone needed me."`,
        a: { label: 'Tell him that need is worth more than coin', tag: 'kind', reply: `He grunts, but he's trying not to smile. "Don't tell the lads."` }, b: { label: 'Tell him the pay is good, then', tag: 'greed', reply: `"Aye. That I can drink to." He clinks his flask against your cup.` } },
      { need: 3, text: `"I owe you the rest of it," Bran says, not looking up. "My brother Torvald. He's in Emberdeep. We haven't spoken in nine years. If we pass through there — would you stand with me when I knock?"`,
        a: { label: 'Promise you will', tag: 'kind', reply: `"Right." He clears his throat. "Right. Good."` }, b: { label: 'Say it is his fight to make alone', tag: 'brave', reply: `Bran nods slowly. "Aye. You're not wrong. Doesn't make it easier."` } },
      { need: 6, text: `"I'll tell you what I'd want," Bran says, quietly. "If it comes to it — if one of us is going to the end of this road — I'd rather it were me. Fewer people to miss a mercenary." He grins, but his eyes don't.`,
        a: { label: '"Nobody is expendable."', tag: 'kind', reply: `"Stubborn," he says warmly. "Good. Stay that way."` }, b: { label: '"We\'ll see when the time comes."', tag: 'brave', reply: `"Aye. That's the right answer."` } },
    ],
    sacrifice: `Bran steps in front of you, planting his boots at the lip of the seam. "Fewer people to miss a mercenary," he says, and hefts the axe in both hands. "Tell Torvald he was right about the Forge." He goes down into the dark with a roar, and the seam closes over it.`,
    betray: `Bran blocks the gate, axe low. "The Hollow's offering clan-gold for the pair of you," he says heavily. "More than I've ever seen. I'm sorry. Truly."`,
    ending: `Torvald Ironwick hangs a notched axe above the hearth in Emberdeep, and tells every child who asks how his little brother kept the world from ending.`,
  },
  lirael: {
    name: 'Lirael Dawnwhisper', short: 'Lirael', icon: 'elf', pro: 'she', cls: 'archer',
    blurb: 'An elven archer and scribe who left Silverbough to see what the Hollow has done to the world.',
    likes: ['kind', 'lore', 'faith'], dislikes: ['cruelty', 'hollow', 'greed'],
    special: { name: 'Volley', every: 3, text: n => `Lirael looses a storm of arrows. Every enemy is struck.` },
    hit: { dmg: '1d6+1', verb: 'looses an arrow at' },
    bark: {
      mire: `Lirael wrinkles her nose. "It is dying, but it is still a living thing. Walk softly. The water remembers."`,
      mines: `"So much stone," Lirael says, touching the tunnel wall. "It does not sing, does it? Everything else does."`,
      harbor: `Lirael watches the gulls with real delight, and the sailors with real suspicion. "Everyone here is smiling and nobody means it."`,
      barrow: `"They are not at rest," Lirael whispers. "I can hear them. Please — do not shout."`,
      orchard: `Lirael stops at the edge of Silverbough and doesn't move for a long moment. "Home," she says. "It has been eleven years. Please, let us not be late."`,
      court: `"I have read of this," Lirael murmurs, eyeing the gilded hall. "Mortals call it a party. We would call it a fire drill."`,
      wych: `Lirael presses her palm to the dead earth. Her face crumples. "Nothing. There is nothing here at all."`,
      peak: `"The air is thin and everything is quiet," Lirael says. "I think I understand why they chose silence."`,
    },
    talks: [
      { need: 0, text: `Lirael is writing in a small book by the firelight. "I record what the Hollow takes," she says. "A song, a word, the name of a stream. Someone should remember what was lost." She looks up. "What would you have me write about you?"`,
        a: { label: '"That we tried to stop it."', tag: 'brave', reply: `"Then I will write it truly, and not kindly." She smiles, and bends back to the page.` }, b: { label: '"That we cared about the small things too."', tag: 'kind', reply: `Her pen stills. "That is the best answer I have heard in a hundred years."` } },
      { need: 3, text: `"I left Silverbough because of a quarrel," Lirael says. "My sister wished to burn the roots. I wished to read them. She called me a coward." She turns a leaf in her fingers. "I think she may have been right, and I think I may have been right, and I think that is what is so awful."`,
        a: { label: 'Tell her cowardice and caution are not the same', tag: 'lore', reply: `"A scholar's answer," she says. "Thank you for it."` }, b: { label: 'Tell her sometimes fire is the answer', tag: 'cruelty', reply: `Lirael is quiet. "Perhaps. I hope never to learn it."` } },
      { need: 6, text: `Lirael hands you a folded page. "If I do not come back from the end of this, give this to my sister. It is only an apology. I have been trying to write it for eleven years, and tonight I finally did."`,
        a: { label: 'Promise to deliver it', tag: 'kind', reply: `"Thank you." She exhales a long breath, as though setting something down.` }, b: { label: 'Tell her to deliver it herself', tag: 'brave', reply: `Lirael laughs, startled, and tucks the page away. "Very well. Then I shall have to live."` } },
    ],
    sacrifice: `Lirael takes the axe from your hands. "I have written down what was lost," she says. "Let me, for once, be what is saved." She presses a folded page into your palm and goes down into the dark, singing something very old, and the seam closes over the song.`,
    betray: `Lirael stands in the gateway, bow drawn, her hands shaking. "It showed me Silverbough," she says. "Whole. All of it. It only asks that I stand aside." The arrow does not waver. "Forgive me."`,
    ending: `A page in an elf's looping hand reaches Silverbough, and a woman who burned too many roots reads it three times, and weeps, and finally forgives.`,
  },
  pip: {
    name: 'Pip Thistlewick', short: 'Pip', icon: 'halfling', pro: 'he', cls: 'rogue cook',
    blurb: 'A halfling thief who cooks like an angel and runs like a rabbit. Nobody is more surprised than Pip that he is here.',
    likes: ['cunning', 'kind', 'greed'], dislikes: ['cruelty', 'hollow'],
    special: { name: 'Dirty Trick', every: 3, text: n => `Pip hurls a fistful of pepper. The foe reels, stunned.` },
    hit: { dmg: '1d4+1', verb: 'stabs' },
    bark: {
      mire: `"Is it supposed to smell like that?" Pip holds up a boot. "I've lost this twice already. Is this the swamp or the swamp's idea of a joke?"`,
      mines: `"Tunnels," Pip says brightly. "I love a tunnel. Lovely echo. Nobody can sneak up on you when the whole mountain says 'oi.'"`,
      harbor: `Pip's eyes go wide. "Oh, I know this place. Well. I know a place like this. Well. I know a man who knew a place." He pulls his hood down.`,
      barrow: `"If I faint," Pip whispers, "please don't tell anyone. I have a reputation."`,
      orchard: `Pip is already eating something he found on the ground. "It's an apple," he says through a mouthful. "I think. Tell the elves I said sorry."`,
      court: `Pip appears in a stolen waistcoat, grinning. "Right. I've counted the silver. I've counted the exits. I've counted the guards. We have eleven minutes."`,
      wych: `Pip is very quiet. He stays very close. "Do you know," he says at last, "I had a gran who lived near here once."`,
      peak: `Pip is wearing four cloaks. "I'm fine," he says, through chattering teeth. "I'm completely fine. Lovely scenery."`,
    },
    talks: [
      { need: 0, text: `Pip is stirring a pot with enormous concentration. "You're wondering why a thief's in a quest," he says. "Honestly? I pinched your purse, back in Hearthmoor. Heavy purse. Good purse. And then I felt guilty, which I'd never done before, and I thought — perhaps I could be a person who gives things back."`,
        a: { label: '"We forgave you the moment you fed us."', tag: 'kind', reply: `Pip beams, then pretends it was the steam making his eyes wet.` }, b: { label: '"You owe us interest."', tag: 'greed', reply: `"Fair!" Pip says, delighted. "Pepper sausage, then. Extra pepper."` } },
      { need: 3, text: `"Can I tell you something embarrassing?" Pip says. "I don't think I'm brave. I think I'm just very bad at running away from things I should run from." He pokes the fire. "Is that the same?"`,
        a: { label: 'Tell him it is exactly the same', tag: 'kind', reply: `"Oh," Pip says. "Well, then. I'm very brave. Please carry on."` }, b: { label: 'Tell him to run next time', tag: 'cunning', reply: `"Sound advice!" He nods grimly. "I'll think about it. I probably won't."` } },
      { need: 6, text: `"The thing about being a thief," Pip says, "is that you notice what people leave unguarded. And I've noticed you. You leave a lot unguarded. Hope, mostly." He wraps a roll in a cloth and presses it into your hand. "Don't lose it. Either of them."`,
        a: { label: 'Thank him honestly', tag: 'kind', reply: `"Oh, shush," says Pip, and eats the second roll himself.` }, b: { label: 'Check that he didn\'t take anything', tag: 'cunning', reply: `"Hah!" He pats his coat. "Not one thing. Today."` } },
    ],
    sacrifice: `Pip plucks the axe out of your hands before you can stop him. "Let the little one carry it," he says, grinning so hard it breaks your heart. "Nobody's ever noticed me yet." He goes down into the dark, humming something that smells faintly of rosemary, and the seam closes over him.`,
    betray: `Pip is sitting on the gate-wall with his boots dangling, not meeting your eyes. "They've got my gran," he says in a very small voice. "I didn't know who else to ask. I'm sorry. I'm so sorry."`,
    ending: `Every inn in Hearthmoor serves a bowl of Pip's Thistle Stew on the anniversary, and every year some thief leaves a purse on the counter to pay for it.`,
  },
  aldous: {
    name: 'Brother Aldous', short: 'Aldous', icon: 'candle', pro: 'he', cls: 'Keeper priest',
    blurb: 'An elderly Keeper-priest whose faith is cracked and whose mace is not. He remembers the last time the seal weakened.',
    likes: ['faith', 'kind', 'lore'], dislikes: ['cruelty', 'hollow', 'greed', 'cunning'],
    special: { name: 'Sunlit Prayer', every: 2, text: n => `Aldous raises his mace. A warm, golden light closes the party's wounds.` },
    hit: { dmg: '1d6', verb: 'strikes' },
    bark: {
      mire: `"There is a shrine somewhere in all this wet," Brother Aldous says, coughing into his sleeve. "I would like to find it before the fen finds me."`,
      mines: `Aldous touches the old Keeper's rune carved above the tunnel door. "The dwarves kept faith longer than we did. Remember that."`,
      harbor: `"A port at midday," Aldous sighs. "Every sin in the world, and every one of them selling something."`,
      barrow: `Aldous removes his cap. "I have walked here before. Long before you were born. Some of these stones are my friends."`,
      orchard: `"The Heartwood," Aldous breathes. "Before the Hollow, I sat beneath it for a whole summer. I think it was the happiest I have been."`,
      court: `"They have chosen to dance on the edge of a grave," Aldous says, shaking his head. "I cannot quite blame them."`,
      wych: `Aldous goes down on one knee in the dead grass and begins to pray, softly, in a voice that hasn't shaken in sixty years. It is shaking now.`,
      peak: `"The Silent Order," Aldous says reverently. "They take no vow but one. I find that I envy them."`,
    },
    talks: [
      { need: 0, text: `Aldous mends a sandal by the fire. "You must think I am a foolish old man to come," he says. "Perhaps I am. But I saw the Hollow once, when I was a boy, and I have never forgotten what it did to my village. I swore that if it came again, I would not be a bystander."`,
        a: { label: '"You are welcome here."', tag: 'kind', reply: `He smiles with his whole face. "Thank you. It has been a long time since anyone said that."` }, b: { label: '"Pray for us, then."', tag: 'faith', reply: `"I do," he says simply. "Every night. You are in most of them."` } },
      { need: 3, text: `"I will confess something," Aldous says. "I have lost my faith twice. Once in the grey. Once in my own heart. The third time I found it, it was not a thing to be believed but a thing to be done." He studies you. "Does that sound like heresy?"`,
        a: { label: '"It sounds like wisdom."', tag: 'faith', reply: `"Then I am in better company than I deserve."` }, b: { label: '"It sounds like a good reason to keep fighting."', tag: 'brave', reply: `"Ha! The young are so useful."` } },
      { need: 6, text: `Aldous presses the Keeper's sigil into your hands. "If the worst happens — if I do not come back — take this to Hearthmoor. Tell them the old man did what the old man could." His voice thickens. "I think, in the end, I would be glad to be remembered as useful."`,
        a: { label: 'Promise to remember him as more than that', tag: 'kind', reply: `Aldous closes his hand over yours. "That will do. That will do very well."` }, b: { label: 'Tell him he is not allowed to go', tag: 'brave', reply: `"Very well," says Aldous, with a spark of mischief. "I shall try to obey."` } },
    ],
    sacrifice: `Brother Aldous takes the axe, gently, as though lifting a child. "I have been waiting a long time to be useful," he says. He lays a hand on your head, murmurs a blessing you do not understand and will never forget, and walks down into the dark. The seam closes over a prayer.`,
    betray: `Aldous stands between you and the gate, his mace lowered. "I have seen the grey," he whispers. "It does not end. It never ends. If we stop this, we only delay it. Let me spare you the despair." His voice cracks. "Please. Do not make me."`,
    ending: `Every dawn, a bell rings in the Keepers' chapel for an old priest who never quite lost his faith — and always insisted on being useful.`,
  },
};

/* ---- state ---- */
const COMPANION_IDS = Object.keys(COMPANIONS);
const compData = () => (G.companion ? COMPANIONS[G.companion.id] : null);
const compHere = () => !!(G.companion && !G.companion.gone);
const compAppr = () => (G.companion ? G.companion.appr : 0);
function compTitle(a) { return a >= 8 ? 'Devoted' : a >= 5 ? 'Close friend' : a >= 2 ? 'Friend' : a >= -1 ? 'Comrade' : a >= -4 ? 'Strained' : 'Estranged'; }

const Companion = {
  KEYWORDS: [
    ['cruelty', /\b(kill|execute|torture|abandon|burn|threaten|slay|leave (them|him|her)|sacrifice|drown|crush|terroris)/i],
    ['hollow', /\[hollow\]|\bgrey (fire|power)\b|\bembrace\b/i],
    ['greed', /\b(steal|rob|loot|pocket|sell|bribe|haggle|keep the|take the gold|plunder|ransack|swindle)/i],
    ['cunning', /\b(deceive|lie|trick|sneak|forge|disguise|bluff|con |fake|pose as|slip|distract|flatter)/i],
    ['kind', /\b(help|aid|heal|rescue|save|free|spare|warn|share|comfort|tend|protect|shelter|forgive|mercy|offer|treat|feed|stay)/i],
    ['faith', /\b(pray|bless|shrine|chapel|light a|candle|sanctuary|hymn)/i],
    ['lore', /\b(study|read|decipher|examine|inscription|rune|research|translate|archive|consult)/i],
    ['brave', /\b(fight|charge|confront|face |stand|defend|duel|challenge|attack|storm|assault|ambush|break through)/i],
  ],

  /* Work out what a choice says about the party, then react. */
  react(ch) {
    if (!compHere() || ch.ui) return;
    const tags = [];
    if (ch.tag) tags.push(...[].concat(ch.tag));
    else {
      const label = String(ch.label || '').replace(/<[^>]+>/g, ' ');
      if (ch.hollow) tags.push('hollow');
      else for (const [t, re] of Companion.KEYWORDS) { if (re.test(label)) { tags.push(t); break; } }
      if (!tags.length && ch.combat) tags.push('brave');
    }
    tags.slice(0, 1).forEach(t => Companion.tag(t));
  },

  /* A tag applied by something the party did. Likes → approval up, dislikes → down. */
  tag(t, quiet) {
    if (!compHere()) return 0;
    const c = compData();
    let d = 0;
    if (c.likes.includes(t)) d = 1; else if (c.dislikes.includes(t)) d = -1;
    if (!d) return 0;
    G.companion.appr = Math.max(-10, Math.min(10, G.companion.appr + d));
    if (!quiet && G._notes) {
      const key = c.short + (d > 0 ? '+' : '-');
      if (!G._notes.some(n => n.key === key)) G._notes.push({ text: `${c.short} ${d > 0 ? 'approves' : 'disapproves'}`, kind: d > 0 ? 'ally' : 'bad', key });
    }
    return d;
  },

  /* One-line comment shown on arriving somewhere new. */
  bark(sceneId) {
    if (!compHere()) return '';
    const m = /^(\w+)_start$/.exec(sceneId);
    if (!m || !COMPANIONS[G.companion.id].bark[m[1]] || has('cbark_' + m[1])) return '';
    flag('cbark_' + m[1]);
    const c = compData();
    return `<p class="bark"><b>${c.short}:</b> ${c.bark[m[1]]}</p>`;
  },

  /* Combat: the companion strikes every round and has a special move. */
  strike(st, round) {
    if (!compHere()) return [];
    const c = compData(), a = G.companion.appr;
    if (a <= -8) return [() => Combat.log(`${c.short} stands to one side, arms folded, and does nothing.`, 'ally')];
    const steps = [];
    const bonus = Math.floor(tier() / 2) + Math.floor(G.party.reduce((s, p) => s + p.level, 0) / G.party.length / 4) + (a >= 3 ? 1 : 0) + (a >= 8 ? 1 : 0);
    const special = c.special && (round % (a >= 5 ? Math.max(2, c.special.every - 1) : c.special.every) === 0);
    steps.push(() => {
      const live = Combat.livingEnemies(); if (!live.length) return;
      if (G.companion.id === 'aldous' && round % 2 === 1) {
        // Aldous mends the most wounded hero every other round
        const w = G.party.filter(h => h.hp > 0).sort((x, y) => x.hp / Character.maxHp(x) - y.hp / Character.maxHp(y))[0];
        if (w && w.hp < Character.maxHp(w)) { const n = Character.heal(w, Dice.roll('1d4').total + 1 + bonus); Combat.log(`Aldous murmurs a prayer over ${w.name}: <b>+${n}</b> HP.`, 'heal'); }
      }
      if (special) {
        Combat.log(c.special.text(round), 'ally');
        if (c.short === 'Bran') Combat.statusAll('rattled', 1);
        else if (c.short === 'Lirael') live.forEach(e => { Combat.damageEnemy(e, Dice.roll('1d4').total + bonus); });
        else if (c.short === 'Pip') { const t = Dice.pick(live); t.status.stunned = 1; t.status.exposed = 2; }
        else if (c.short === 'Aldous') G.party.forEach(h => { if (h.hp > 0) Character.heal(h, Dice.roll('1d4').total + bonus); });
        return;
      }
      const t = Dice.pick(live);
      const d = Combat.damageEnemy(t, Dice.roll(c.hit.dmg).total + bonus, null, G.companion.id === 'aldous');
      Combat.log(`${c.short} ${c.hit.verb} ${t.name} for <b>${d}</b>.${Combat.fell(t)}`, 'ally');
    });
    return steps;
  },

  /* A rich epilogue line */
  epilogue() {
    if (!G.companion) return '';
    const c = compData();
    if (G.companion.gone) return G.companion.gone === 'left' ? `${c.short} went their own way long before the end. You hear, now and then, that they are well.` : '';
    if (G.companion.fate === 'died') return c.ending;
    return `${c.name} ${compAppr() >= 5 ? 'stays at your side for the rest of your days, and never once stops teasing you about it' : compAppr() >= 0 ? 'drinks to your health in Hearthmoor, and then goes back to the road' : 'nods once at the gates of Hearthmoor, and is gone'}.`;
  },
};

/* ---- engine hooks ---- */
(function () {
  const baseChoose = Engine.choose;
  Engine.choose = function (ch) { if (G && !ch.locked) Companion.react(ch); return baseChoose.call(this, ch); };

  const baseCorrupt = corrupt;
  // wrap the global corrupt() so every corruption gain is noticed
  corrupt = function (c, n = 1) { const before = c.corruption || 0; baseCorrupt(c, n); if (n > 0 && (c.corruption || 0) > before) Companion.tag('hollow'); };
})();

/* ---- the offer, at first arrival in Hearthmoor ---- */
const baseHubRoute = SCENES.hub.route;
SCENES.hub.route = s => {
  if (!G.companion && !has('comp_offered')) return 'comp_choose';
  if (G.companion && G.companion.appr <= -8 && !G.companion.gone && !has('comp_left')) return 'comp_leaves';
  return baseHubRoute(s);
};

SCENES.comp_choose = {
  title: 'A Stranger at the Gate',
  first: () => { flag('comp_offered'); flag('comp_offer', Dice.shuffle(COMPANION_IDS).slice(0, 3)); },
  text: s => P(
    `You've barely set down your packs at the Copper Kettle when three people turn up, one after another, each with the same hopeful look. Old Hob, the innkeeper, rolls his eyes and slides a tankard down the bar. "Keepers' Map's got half the valley talking," he says. "Three of 'em want to walk with you."`,
    ...G.flags.comp_offer.map(id => `<b>${COMPANIONS[id].name}</b> — ${COMPANIONS[id].blurb}`)
  ),
  choices: s => G.flags.comp_offer.map(id => ({
    label: `Take ${COMPANIONS[id].name} along`, icon: COMPANIONS[id].icon,
    effects: () => { G.companion = { id, appr: 1 }; chronicle(`${COMPANIONS[id].name} joined the quest.`); note(`${COMPANIONS[id].short} joins you`, 'ally'); },
    text: P(`${COMPANIONS[id].short} shoulders a pack and falls in beside you. "Right," ${COMPANIONS[id].short} says. "Where to?"`),
    next: 'hub_main',
  })).concat([{ label: 'Travel on your own', icon: 'next', text: P(`Hob shrugs. "Your funeral." Nobody follows you out.`), next: 'hub_main' }]),
};

SCENES.comp_leaves = {
  title: 'A Parting of Ways',
  first: () => { flag('comp_left'); G.companion.gone = 'left'; chronicle(`${compData().name} left the party.`); },
  text: s => P(`${compData().short} is waiting by the gate with ${compData().pro === 'she' ? 'her' : 'his'} pack already on, not quite meeting your eye.`,
    `"I've been trying to find the right way to say this," ${compData().short} says. "I can't. I can't keep going the way we're going. I wish you luck." A pause. "I mean that."`),
  choices: [{ label: 'Let them go', next: 'hub_main' }],
};

/* ---- talking at the fire (Hearthmoor) ---- */
SCENES.comp_talk = {
  title: s => `A Quiet Word with ${compData().short}`,
  text: s => {
    const c = compData(), idx = G.companion.talkIdx || 0, t = c.talks[idx];
    return P(`The Copper Kettle has emptied out. ${c.short} sits by the dying hearth.`, t ? t.text : `You sit together in comfortable silence. There is nothing left that needs saying. That is its own kind of closeness.`);
  },
  choices: s => {
    const c = compData(), idx = G.companion.talkIdx || 0, t = c.talks[idx];
    if (!t) return [{ label: 'Return to the common room', next: 'hub_main' }];
    return [t.a, t.b].map(o => ({ label: o.label, tag: o.tag, effects: () => { G.companion.talkIdx = idx + 1; Companion.tag(o.tag); G.companion.appr = Math.min(10, G.companion.appr + 1); note(`${c.short} grows closer`, 'ally'); },
      text: P(o.reply), next: 'hub_main' }));
  },
};

/* ---- finale: the price, and the betrayal ---- */
const companionPending = () => compHere() && compAppr() <= -6 && !has('comp_betrayed') && Dice.chance(0.7);
SCENES.comp_gate = {
  route: s => (companionPending() ? 'comp_betray' : 'fin_gate'),
};
SCENES.comp_betray = {
  title: s => `${compData().short} at the Gate`,
  first: () => flag('comp_betrayed'),
  text: s => P(compData().betray, `You have been through too much to pretend you don't know why.`),
  choices: s => [
    { label: `Talk ${compData().short} down`, check: { skill: 'persuasion', dc: 14, mods: () => [compAppr() < -8 && { label: 'Estranged', value: -2 }] },
      success: { effects: () => { G.companion.appr = 2; G.companion.betrayalHealed = true; chronicle(`${compData().name} turned on the party at the gates — and was talked back.`); }, text: (s, c) => P(`${c.char.name} doesn't raise a weapon. ${c.char.name} just talks, plainly, about everything the two of you have seen. By the end ${compData().short} is crying quietly, and has lowered ${compData().pro === 'she' ? 'her' : 'his'} weapon. "I'm sorry," ${compData().short} says. "I'm with you. Let's finish it."`), next: 'fin_gate' },
      failure: { text: P(`Words fail. ${compData().short} charges.`), next: 'comp_fight' } },
    { label: 'Fight', combat: { enemies: () => [foe({ name: compData().name, hp: 24, ac: 14, atk: 5, dmg: '1d8+3', xp: 60, canSurrender: true, big: true })], fleeable: false,
      win: { effects: () => { G.companion.gone = 'fell'; chronicle(`${compData().name} turned on the party at the gates and was struck down.`); }, text: s => P(`${compData().short} falls to ${compData().pro === 'she' ? 'her' : 'his'} knees. "Thank you," ${compData().pro === 'she' ? 'she' : 'he'} whispers. It is almost a relief.`), next: 'fin_gate' },
      lose: { effects: () => { G.companion.gone = 'fell'; }, text: P(`You are beaten bloody, and ${compData().short} stands over you with a face like a wound. Then ${compData().pro === 'she' ? 'she' : 'he'} turns and walks away into the dark. You do not see ${compData().pro === 'she' ? 'her' : 'him'} again.`), next: 'fin_gate' } } },
  ],
};
SCENES.comp_fight = {
  title: s => `${compData().short} Attacks`,
  text: P(`There is no more time for talk.`),
  choices: s => [{ label: 'Defend yourselves', combat: { enemies: () => [foe({ name: compData().name, hp: 24, ac: 14, atk: 5, dmg: '1d8+3', xp: 60, big: true })], fleeable: false,
    win: { effects: () => { G.companion.gone = 'fell'; chronicle(`${compData().name} turned on the party at the gates and was struck down.`); }, text: P(`It is over quickly, and none of you say anything for a long while.`), next: 'fin_gate' },
    lose: { effects: () => { G.companion.gone = 'fell'; }, text: P(`You are beaten bloody, and ${compData().short} walks away into the dark. You do not see them again.`), next: 'fin_gate' } } }],
};

/* The sacrifice option on the last page, if the bond is strong enough. */
SCENES.end_companion = {
  title: 'The Friend Who Went Down',
  ending: 'victory',
  text: s => endingText([
    compData().sacrifice,
    `The Hollow sleeps. Outside, the sun comes out over a land that will heal.`,
    `${names()} walk${solo() ? 's' : ''} out of ${V().stronghold} into the light, and nobody speaks. In Hearthmoor, they carve ${compData().name}'s name beside Florian's, and underneath it, in smaller letters: <i>"stayed."</i>`,
    `<b>You have won — and someone paid for it.</b>`,
  ]),
  first: () => { G.companion.fate = 'died'; flag('ending_companion'); },
  choices: [{ label: 'Play again — a new tale', ui: 'newgame' }],
};

/* Wire the sacrifice into the final choice, and the betrayal into the march. */
(function () {
  const price = SCENES.fin_price;
  const baseChoices = price.choices;
  price.choices = s => {
    const list = typeof baseChoices === 'function' ? baseChoices(s) : baseChoices.slice();
    if (compHere() && compAppr() >= 6) list.unshift({ label: `${compData().short} takes the axe`, icon: compData().icon, text: s => P(`${compData().short} looks at you. At the axe. At the dark. "No," ${compData().short} says softly. "Not you."`), next: 'end_companion' });
    return list;
  };
  const march = SCENES.fin_march;
  const mc = march.choices;
  march.choices = s => (typeof mc === 'function' ? mc(s) : mc).map(c => (c.next === 'fin_gate' ? Object.assign({}, c, { next: 'comp_gate' }) : c));
})();

/* ---- Hearthmoor hub: talk, and an afterword line on return ---- */
Companion.hubChoices = function () {
  if (!compHere()) return [];
  const c = compData(), idx = G.companion.talkIdx || 0, t = c.talks[idx];
  const open = t && compAppr() >= t.need && !has('ctalk_' + G.regionsDone.length);
  if (!open) return [];
  return [{ label: `Sit and talk with ${c.short}`, icon: c.icon, hint: `${compTitle(compAppr())} · something to say`, effects: () => flag('ctalk_' + G.regionsDone.length), next: 'comp_talk' }];
};
