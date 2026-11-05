/* ===========================================================
   THE HEARTHMOOR QUEST BOARD
   Between journeys, up to three jobs are pinned to the board
   outside the Copper Kettle. They are drawn from a pool and
   chosen to fit what has already happened: an ally's request,
   a refugee crisis after a raid, a Keeper's missing courier, a
   merchant who senses your corruption… Each takes one scene
   and pays in gold, materials, gear and standing.
   =========================================================== */

const QUESTS = [
  { id: 'courier', title: 'The overdue courier', giver: 'Keeper\'s clerk', faction: 'keepers',
    avail: () => true,
    blurb: 'A Keeper courier never reached Hearthmoor. Last seen on the north road.',
    intro: () => [`A harried Keeper's clerk catches your sleeve outside the Copper Kettle. "Courier Aldric left the north road three days ago with a packet for the archive. He hasn't arrived. The wolves have been bad. Please — find him."`],
    options: [
      { label: 'Track him on the north road', check: { skill: 'survival', dc: 12 }, ok: { text: `You find him wedged in a tree, half-frozen and furious. The packet is intact. "Thanks," Aldric rasps. "I'll write that down. Eventually."`, gold: 25, xp: 30, rep: { keepers: 1 }, tag: 'kind' }, bad: { text: `The trail goes cold in a stream. You find the packet, sodden, and a boot. Aldric is not found.`, gold: 8, xp: 12 } },
      { label: 'Fight through the wolf pack to reach him', fight: ['hollow_wolf', 'hollow_wolf'], ok: { text: `The wolves scatter. Aldric tumbles out of a tree like a ripe fruit. "I had it under control," he says. He did not.`, gold: 30, mats: { shard: 1 }, xp: 35, rep: { keepers: 1 } }, bad: { text: `The wolves are too many. You pull back, bleeding, and Aldric will have to be someone else's problem.`, hurt: '1d4' } },
    ] },
  { id: 'ore', title: 'Ore for the smith', giver: 'Hilda Copperpot', faction: 'dwarves',
    avail: () => true,
    blurb: 'A dwarven ore-wagon is stuck on the Greywater road, under threat from bandits.',
    intro: () => [`A dwarven smith leans on the hearth with her arms folded. "Ore cart's three miles up the Greywater road," she says. "Axle's cracked. Bandits have noticed. I'd go myself, but..." She waves a wrench at her gut. "Gout."`],
    options: [
      { label: 'Drive off the bandits', fight: ['thug', 'thug'], ok: { text: `The bandits scatter. You help the carter splint the axle and haul three sacks of good ore into Hearthmoor. Hilda counts every one, twice.`, mats: { iron: 3 }, gold: 18, xp: 30, rep: { dwarves: 1 } }, bad: { text: `They are tougher than they look. You limp home. Hilda is not pleased, and not surprised.`, hurt: '1d6', rep: { dwarves: -1 } } },
      { label: 'Haggle them off the road', check: { skill: 'persuasion', dc: 12 }, ok: { text: `You offer the bandits a better deal: carry the cart in for a cut. They do. It's the strangest escort you have ever been part of.`, mats: { iron: 2 }, gold: 12, xp: 25, rep: { dwarves: 1 }, tag: 'cunning' }, bad: { text: `They laugh, and hit you, and you go home without the ore.`, hurt: '1d4' } },
    ] },
  { id: 'package', title: 'A package for Saltcliff', giver: 'a hooded stranger', faction: 'smugglers',
    avail: () => true,
    blurb: 'A sealed crate to carry past the Order\'s checkpoint. No questions asked.',
    intro: () => [`A hooded stranger presses a small, heavy crate into your hands. "Nothing illegal," they say, in the voice of someone who has never said that before. "Take it to the Saltcliff road. The Order will stop you. Be nice."`],
    options: [
      { label: 'Bluff the checkpoint', check: { skill: 'deception', dc: 13 }, tag: 'cunning', ok: { text: `The knight waves you through, bored. The crate delivers itself the rest of the way. At the other end a very large woman gives you a purse and a very small smile.`, gold: 35, xp: 30, rep: { smugglers: 1, order: -1 }, tag: 'cunning' }, bad: { text: `The knight opens the crate. It is full of lamp oil and unlicensed tobacco. You spend a long afternoon in the guardhouse.`, gold: -10, rep: { smugglers: -1, order: -1 } } },
      { label: 'Hand the crate to the Order', tag: 'kind', ok: { text: `The knight cracks the lid and winces. "Contraband," she says. "And — oh. This is quite a lot of contraband." She thanks you formally, and someone in Saltcliff will never trust you again.`, rep: { order: 2, smugglers: -2 }, gold: 20, xp: 20 } },
    ] },
  { id: 'patrol', title: 'The wounded patrol', giver: 'Knight-Sergeant Maren', faction: 'order',
    avail: () => G.regionsDone.length >= 1 || G.doom >= 3,
    blurb: 'A Hearth patrol returned half its number. They need hands and healing.',
    intro: () => [`The Order's infirmary is full. Knight-Sergeant Maren, her arm in a sling, meets you at the door. "A patrol of mine was ambushed by hollowed on the ridge road," she says. "We got our wounded back. We didn't get our supplies. And there are more of them out there."`],
    options: [
      { label: 'Tend the wounded', check: { skill: 'medicine', dc: 12 }, tag: 'kind', ok: { text: `You work through the night. By dawn, no one else has died. Maren shakes your hand like a hammer.`, rep: { order: 2 }, pack: { potion: 1 }, xp: 35, tag: 'kind' }, bad: { text: `You do what you can. Two will recover. One will not. Maren thanks you anyway.`, rep: { order: 1 }, xp: 15 } },
      { label: 'Hunt the hollowed on the ridge', fight: ['hollowed', 'hollowed', 'hollow_wolf'], ok: { text: `You come back with the patrol's supplies, a few bent shields, and a lot of grey dust in your hair. Maren salutes.`, gold: 25, mats: { shard: 2 }, rep: { order: 1 }, xp: 40 }, bad: { text: `The ridge is held. You retreat, battered. Maren is quiet.`, hurt: '1d6' } },
    ] },
  { id: 'seedlings', title: 'Seedlings for the Heartwood', giver: 'an elven herald', faction: 'elves',
    avail: () => !has('heartwood_burned'),
    blurb: 'Silverbough sends seedlings to Hearthmoor\'s gardens — if someone will carry them back through the fog.',
    intro: () => [`An elven herald in a silver cloak stands patiently in the square. In a wicker basket, wrapped in moss, are a dozen young saplings. "Replacement stock for the Heartwood's grafts," she says. "The fog is thick on the western road. Mortals cope better than elves, I am told."`],
    options: [
      { label: 'Carry them through the fog', check: { skill: 'survival', dc: 13 }, ok: { text: `The fog is cold and wet and does everything it can to confuse you. You deliver the saplings with the moss still damp. The herald accepts them with a bow so low it is almost embarrassing.`, rep: { elves: 2 }, mats: { silverleaf: 2 }, xp: 35 }, bad: { text: `You lose the road, and half the saplings. The herald bows, a little less low.`, rep: { elves: 1 }, xp: 12 } },
      { label: 'Sell the saplings to a collector (it would pay well)', tag: 'greed', ok: { text: `The collector pays handsomely and asks no questions. You do not mention it to anyone, and you are very careful never to walk past an elf.`, gold: 45, rep: { elves: -2 }, xp: 5, tag: 'greed' } },
    ] },
  { id: 'archive', title: 'Dusty records', giver: 'Keeper\'s archivist', faction: 'keepers',
    avail: () => G.regionsDone.length >= 1,
    blurb: 'Pages from Florian\'s time have turned up in a merchant\'s attic.',
    intro: () => [`An archivist with ink on her sleeves hurries up with a bundle under her arm. "A merchant's clearing his attic. There are Florian-era pages in it, and he doesn't know what he's got. Can you get them? He's... difficult."`],
    options: [
      { label: 'Persuade the merchant to part with them', check: { skill: 'persuasion', dc: 12 }, ok: { text: () => `The merchant, as it turns out, is lonely. Two hours and one story later, you leave with the pages. On the first sheet, in a spidery hand: <b>${V().short}</b> ...`, clue: true, rep: { keepers: 2 }, xp: 35 }, bad: { text: `He won't budge. You come away with one page, on his terms, and a long lecture.`, rep: { keepers: 1 }, xp: 12 } },
      { label: 'Decipher the faded copy yourself', check: { skill: 'lore', dc: 13 }, tag: 'lore', ok: { text: `It takes an evening. You find, between a laundry list and a grocery bill, a page about the Hollow's first rising. The archivist weeps.`, clue: true, rep: { keepers: 1 }, xp: 35, tag: 'lore' }, bad: { text: `Too faded. You return it with an apology.`, xp: 8 } },
    ] },
  { id: 'refugees', title: 'Hearth for the homeless', giver: 'Mother Brisk', faction: 'order',
    avail: () => G.doom >= 3 || (G.flags.raid_state && G.flags.raid_state !== 'none'),
    blurb: 'Refugees from the grey crowd the square. Someone has to feed them.',
    intro: () => [`The square is full of families in blankets. Mother Brisk ladles stew with a face like thunder. "More arrive every day," she says. "The grey's pushing them down off the hills. I need hands, or coin, or a miracle, and I'll take them in that order."`],
    options: [
      { label: 'Pay for a week of food (25 gold)', cost: { gold: 25 }, tag: 'kind', ok: { text: `Mother Brisk counts the coins as though they were small, unlikely animals. "Right," she says. "Right. That's the week."`, rep: { order: 1 }, doom: -1, xp: 30, tag: 'kind' } },
      { label: 'Organise a shelter in the guild-hall', check: { skill: 'persuasion', dc: 12 }, ok: { text: `The guildmasters grumble, and relent. By nightfall every family has a roof. Mother Brisk gives you a tired, fierce hug.`, rep: { order: 1, keepers: 1 }, doom: -1, xp: 35, tag: 'kind' }, bad: { text: `The guilds argue for hours and no one gets anything. It is still more than there was.`, rep: { order: 1 }, xp: 12 } },
      { label: 'Turn them away: you have a quest', tag: 'cruelty', ok: { text: `You step past the families without looking back. Nobody says a word, which is its own kind of answer.`, rep: { order: -2 }, doom: 1, xp: 0, tag: 'cruelty' } },
    ] },
  { id: 'wolves', title: 'The wolf-hunt', giver: 'the town reeve', faction: 'order',
    avail: () => true,
    blurb: 'Hollow wolves have taken three goats and a shepherd\'s dog. There is a bounty.',
    intro: () => [`A reeve with a bad cough nails a notice to the board, then sees you reading it. "Forty gold," he says. "Hollow wolves, near the Millbrook. Bring me what's left of them."`],
    options: [
      { label: 'Take the bounty', fight: ['hollow_wolf', 'hollow_wolf', 'hollow_wolf'], ok: { text: `It is brutal, and short. The reeve counts the heads, pays, and quietly adds a bottle of cider.`, gold: 45, mats: { shard: 1 }, xp: 40, rep: { order: 1 } }, bad: { text: `The wolves get the better of you. The reeve is sympathetic, and keeps the bounty.`, hurt: '1d6' } },
      { label: 'Set a trap instead', check: { skill: 'survival', dc: 13 }, ok: { text: `Three long evenings with a snare-line and a goat's skull. The wolves come to it like moths. When the reeve counts the heads he whistles.`, gold: 40, xp: 30, rep: { order: 1 } }, bad: { text: `The wolves ate the bait and left you a long, rude print in the mud.`, xp: 8 } },
    ] },
  { id: 'well', title: 'The haunted well', giver: 'a nervous carter', faction: 'order',
    avail: () => G.regionsDone.some(r => r === 'barrow' || r === 'wych' || r === 'mire'),
    blurb: 'Whispers in a well. The carter swears it is speaking his dead wife\'s name.',
    intro: () => [`A carter stops you in the road. "It's the old well," he says. "Since you came back from the grey places. It whispers. It says Mari — that was my wife. She's been dead eleven years." He is very pale. "Would you take a look?"`],
    options: [
      { label: 'Pray at the well', tag: 'faith', check: { skill: 'insight', dc: 12 }, ok: { text: `You speak to the water as if to a person. The whisper stops. After a while it says just one thing: "Thank you." The carter weeps.`, cleanse: 1, rep: { order: 1 }, xp: 30, tag: 'faith' }, bad: { text: `It whispers back, louder. You flee, with a name rattling in your ears that isn't yours.`, corrupt: 1, xp: 8 } },
      { label: 'Fill the well with stones', ok: { text: `It takes the afternoon. The whispering stops. The carter shakes your hand and doesn't meet your eye.`, gold: 10, xp: 10, rep: { order: -1 } } },
    ] },
  { id: 'rival', title: 'Whispers of the rival', giver: 'an informant', faction: 'smugglers',
    avail: () => G.rival && G.rival.met > 0 && !G.rival.slain,
    blurb: () => `Someone knows where ${V().lieutenant.name} drinks. For a price.`,
    intro: () => [`A man with a moth-eaten cloak slides onto a bench next to you. "You've been asking after ${V().lieutenant.name}," he murmurs. "I know a place. A back room in the Salt Gull. It'll cost you." He rubs his thumb and forefinger together.`],
    options: [
      { label: 'Pay him (20 gold) and watch the room', cost: { gold: 20 }, check: { skill: 'insight', dc: 13 }, ok: { text: () => `${V().lieutenant.name} never shows, but two of ${V().short}'s agents do. You overhear enough to learn something that will matter.`, clue: true, xp: 35, rep: { smugglers: 1 } }, bad: { text: `It's a trap. The back room is empty. The man is gone. The gold is gone.`, xp: 8 } },
      { label: 'Threaten him instead', check: { skill: 'intimidation', dc: 12 }, tag: 'cruelty', ok: { text: `He gives you the location, white-faced. "I'm not a brave man," he says. "I'm just very good at being in the right room."`, gold: 15, xp: 25, rep: { smugglers: -1 }, tag: 'cruelty' }, bad: { text: `He flees, and the whole market sees it. Word gets round.`, rep: { smugglers: -1 } } },
    ] },
  { id: 'miners', title: 'The north lift', giver: 'Hilda Copperpot', faction: 'dwarves',
    avail: () => hasAlly('miners'),
    blurb: 'Your dwarven friends are rebuilding. They could use a pair of strong arms.',
    intro: () => [`Hilda Copperpot, who once called you "tall and useless", appears at the board with a bundle of timber on her shoulder. "The lads and I are rebuilding the north lift. We could use a pair of hands that aren't dwarven. It needs someone who can reach the high bolts."`],
    options: [
      { label: 'Climb the scaffold and set the bolts', check: { skill: 'athletics', dc: 12 }, ok: { text: `The scaffolding sways, and you hold your breath, and the last bolt goes in with a solid, very dwarven clunk. Hilda presents you with a bundle wrapped in oilcloth. "A thank-you from the forge."`, gear: 'rare', rep: { dwarves: 2 }, xp: 40 }, bad: { text: `You fall, nobody's hurt who matters, and Hilda finishes it herself, muttering. She still gives you a purse.`, gold: 15, hurt: '1d4', rep: { dwarves: 1 } } },
    ] },
  { id: 'elves', title: 'The seed-gift', giver: 'an elven messenger', faction: 'elves',
    avail: () => hasAlly('elves'),
    blurb: 'Silverbough sends word: they wish to repay a debt.',
    intro: () => [`An elven messenger finds you at the well. "Silverbough does not forget," she says. "The Wardens have a thing to give you. They ask only that you meet them at the edge of the western woods, alone, and without talking too much."`],
    options: [
      { label: 'Meet them quietly', check: { skill: 'stealth', dc: 12 }, ok: { text: `You walk without a sound, which impresses them more than any speech. They give you a silver-wrapped bundle and vanish like mist.`, gear: 'rare', rep: { elves: 2 }, xp: 40 }, bad: { text: `You step on every twig in the forest. The Wardens give you a long look and a small gift all the same.`, gear: 'uncommon', rep: { elves: 1 }, xp: 15 } },
    ] },
  { id: 'vosk', title: 'The captain\'s favour', giver: 'a Saltcliff sailor', faction: 'smugglers',
    avail: () => hasAlly('vosk'),
    blurb: 'Captain Vosk sends a favour request, with a promise.',
    intro: () => [`A sailor in a salt-stained coat taps your shoulder. "Captain says: she's got something for you, but she needs a favour first. There's a crate in Hearthmoor's customs house that shouldn't be. Shift it. Quietly."`],
    options: [
      { label: 'Slip it out of the customs house', check: { skill: 'stealth', dc: 13 }, tag: 'cunning', ok: { text: `The customs sergeant's snore covers every footstep. A day later, a very nice cutlass shows up at the inn with a note: "Thanks. V."`, gear: 'rare', rep: { smugglers: 2, order: -1 }, xp: 40, tag: 'cunning' }, bad: { text: `The sergeant wakes. You get out, mostly. The crate stays.`, rep: { order: -1 }, hurt: '1d4' } },
    ] },
  { id: 'tempter', title: 'The grey merchant', giver: 'a velvet-gloved stranger', faction: 'order',
    avail: () => maxCorruption() >= 3,
    blurb: 'A stranger offers something the Hollow would approve of.',
    intro: () => [`A man in grey velvet sits at your table without being asked. His gloves are perfectly clean. "I deal in things that fall off the edge of the world," he says. "Something about you says you'd appreciate a bargain. A dagger. A taste of something stronger than prayer."`],
    options: [
      { label: 'Accept his bargain', hollow: true, ok: { text: `The dagger is cold and eager. It is also exactly what you needed. The man leaves, smiling, with the faint sound of falling ash.`, gear: 'grey_fang', corrupt: 2, gold: 20, xp: 10 } },
      { label: 'Send him away', tag: 'faith', ok: { text: `"Suit yourself," he says lightly, and is gone. You feel lighter than you have in days.`, cleanse: 1, rep: { order: 1 }, xp: 25, tag: 'faith' } },
      { label: 'Expose him to the Order', check: { skill: 'persuasion', dc: 13 }, ok: { text: `The knights are on him in the time it takes to say it. A sergeant puts a hand on your shoulder: "Thank you. Hollow-sellers are the worst of them."`, rep: { order: 2 }, cleanse: 1, xp: 35 }, bad: { text: `He is gone before they get there, and a little of the grey stays on you.`, corrupt: 1 } },
    ] },
  { id: 'child', title: 'The lost child', giver: 'a frantic mother', faction: 'order',
    avail: () => true,
    blurb: 'A little girl went to the orchard wall and did not come back.',
    intro: () => [`A woman grips your arm. "My daughter," she gasps. "She went to the orchard wall to pick plums. That was this morning. It's nearly dark."`],
    options: [
      { label: 'Search the orchard', check: { skill: 'perception', dc: 12 }, tag: 'kind', ok: { text: `She's asleep in the crook of a plum tree, plum juice to the elbows. When you carry her home, her mother can't speak at all.`, gold: 20, pack: { potion: 1 }, rep: { order: 1 }, xp: 30, tag: 'kind' }, bad: { text: `You search till moonrise. Someone else finds her at dawn. Her mother thanks you, brokenly, for trying.`, rep: { order: 1 }, xp: 15 } },
    ] },
  { id: 'spies', title: 'Spies in the market', giver: 'the market warden', faction: 'order',
    avail: () => true,
    blurb: () => `${V().short}'s agents are watching the town. Someone should flush them out.`,
    intro: () => [`The market warden leans close. "Every third customer asks too many questions. I think they're ${V().short}'s. I can't prove it. You can?"`],
    options: [
      { label: 'Watch the market for tells', check: { skill: 'insight', dc: 13 }, ok: { text: () => `You pick them out in an hour: the man who never looks at the goods, the woman who counts guards. A quiet word to the warden, and they're gone before dark. A scrap of ${V().sigil} falls from a sleeve as they run.`, clue: true, rep: { order: 1 }, xp: 35 }, bad: { text: `Everyone looks suspicious. You detain a cheese-seller by mistake.`, rep: { order: -1 }, xp: 5 } },
      { label: 'Catch them in the act', fight: () => [minion(), minion()], ok: { text: () => `You walk straight at them. They draw. It's brief. The warden gives you the last purse of silver left in her drawer.`, gold: 30, xp: 35, rep: { order: 1 } }, bad: { text: `They slip away in the confusion, leaving you with a headache.`, hurt: '1d4' } },
    ] },
  { id: 'companion', title: 'A friend\'s errand', giver: 'your companion', faction: null,
    avail: () => compHere() && compAppr() >= 2,
    blurb: () => `${compData().short} has something on their mind.`,
    intro: () => {
      const c = compData();
      return [{
        bran: `Bran is standing at the board, not reading it. "There's a letter come from Emberdeep," he says gruffly. "Torvald's sick. He's asked for me. I don't — I don't know whether to go."`,
        lirael: `Lirael has pinned a page to the board and is staring at it. "A messenger from Silverbough. My sister has asked me to return. Only for a night. I do not know if I can face it."`,
        pip: `Pip is wearing his best (second-best) hat. "My gran's in town," he says, in a voice an octave lower than usual. "She wants to meet my friends. Please. Be nice. She's very strict."`,
        aldous: `Brother Aldous is clutching a rosary. "An old friend of mine is dying in the chapel's infirmary," he says. "He asked for me by name. I was a coward when we parted. I should like to see him."`,
      }[G.companion.id]];
    },
    options: [
      { label: 'Go with them', tag: 'kind', ok: { text: () => ({ bran: `The reunion is short, awkward and deeply, painfully Dwarven. Torvald and Bran embrace like men trying to crush each other. When you leave, Bran is quiet for a long time. Then: "Thanks."`, lirael: `The reunion is stiff, until it isn't. The sisters talk through the night. In the morning Lirael is lighter. She presses a silver-leaf charm into your hand. "For luck. For friendship. For both."`, pip: `Pip's gran is the size of a teapot and twice as formidable. She interrogates you for an hour, then feeds you for three. "Good lads," she announces. "Keep an eye on him."`, aldous: `The old friend is frail, and radiant. They forgive each other in a single breath, and then spend the afternoon arguing about hymns. Aldous cries, and laughs, and cries.` })[G.companion.id], xp: 40, gold: 15, tag: 'kind', onDone: () => { G.companion.appr = Math.min(10, G.companion.appr + 3); note(`${compData().short} is deeply moved`, 'ally'); } } },
      { label: 'Tell them to go alone, quickly', ok: { text: `They nod, hurriedly. It's a short, dutiful goodbye; you do not see the conversation. They come back quiet, and say nothing about it.`, xp: 10, onDone: () => { G.companion.appr = Math.min(10, G.companion.appr + 1); } } },
    ] },
];

const Board = {
  refresh() {
    if (!G.board) G.board = { posted: [], done: [], round: -1 };
    if (G.board.round === G.regionsDone.length) return;
    G.board.round = G.regionsDone.length;
    const pool = QUESTS.filter(q => !G.board.done.includes(q.id) && q.avail());
    // favour jobs that match something that has happened (allies, raids, companion…)
    const hot = pool.filter(q => ['miners', 'elves', 'vosk', 'tempter', 'companion', 'refugees', 'rival', 'well'].includes(q.id));
    const picks = [];
    if (hot.length) picks.push(Dice.pick(hot));
    Dice.shuffle(pool).forEach(q => { if (picks.length < 3 && !picks.includes(q)) picks.push(q); });
    G.board.posted = picks.map(q => q.id);
  },
  open() { return G.board.posted.filter(id => !G.board.done.includes(id)).map(id => QUESTS.find(q => q.id === id)).filter(q => q && q.avail()); },
};

SCENES.board_main = {
  title: 'The Quest Board',
  text: s => P(`A battered board outside the Copper Kettle, nailed with notices and thumbtacked with grievances. Beneath it a sleepy cat keeps watch over the jobs nobody has taken yet.`,
    Board.open().length ? `Three or fewer notices catch your eye:` : `The board is bare. Whatever needed doing has been done — for now. New notices go up after every journey.`),
  choices: s => Board.open().map(q => ({ label: q.title, icon: q.faction ? FACTIONS[q.faction].icon : 'scroll', hint: `${q.giver}${q.faction ? ' · ' + FACTIONS[q.faction].name : ''} — ${typeof q.blurb === 'function' ? q.blurb() : q.blurb}`, next: 'q_' + q.id }))
    .concat([{ label: 'Back to the square', icon: 'back', next: 'hub_main' }]),
};

QUESTS.forEach(q => {
  Mini.scene('q_' + q.id, {
    title: q.title, ctx: { mark: 'quest_' + q.id, onDone: () => { G.board.done.push(q.id); chronicle(`Took the job: "${q.title}".`); } }, back: 'hub_main',
    text: s => P(...q.intro()),
    options: q.options.concat([{ label: 'Not now', icon: 'back', ok: { text: '', next: 'board_main', noDone: true } }]),
  });
  // Ctx.onDone should not fire for "Not now": handle by patching the last option after scene creation
  const sc = SCENES['q_' + q.id], baseChoices = sc.choices;
  sc.choices = s => baseChoices(s).map((c, i, arr) => (i === arr.length - 1 ? { label: c.label, icon: 'back', next: 'board_main' } : c));
});

/* Show the board in the hub, refreshing the notices after every journey. */
(function () {
  const hb = SCENES.hub_main, base = hb.choices;
  hb.choices = s => {
    Board.refresh();
    const l = base(s);
    const n = Board.open().length;
    if (n) { const i = l.findIndex(c => c.ui === 'shop'); l.splice(i < 0 ? l.length : i + 1, 0, { label: `Check the quest board (${n} job${n === 1 ? '' : 's'})`, icon: 'scroll', hint: 'Side jobs for gold, gear and standing', next: 'board_main' }); }
    return l;
  };
})();
