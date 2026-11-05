/* ===========================================================
   EXPLORABLE REGIONS
   From the start (and a mid-point) of every region you can
   choose to explore its surroundings instead of marching
   straight for the fragment. Each region has four spots to
   visit in any order: some are safe, some are dangerous, and
   one is hidden until you search. They pay out supplies,
   materials, gear, faction standing — and "local knowledge"
   that makes the main story's checks easier.

   The cost is time: every second detour lets the Hollow
   creep closer (+1 Doom).
   =========================================================== */

const EXPLORE = {
  mire: {
    blurb: `Beyond the jetty the fen opens into a maze of black water and drowned oaks. Here and there a hummock of dry ground carries a thread of smoke, a cairn, or a darker shape.`,
    pois: [
      { id: 'mire_hut', name: 'Heron-Mere fisher\'s hut', hint: 'A frightened fisherman',
        text: [`A stooped fisherman, Orrin, sits on the tilted porch of a stilt-hut with his head in his hands. His punt is half-sunk against the reeds. "Hollow-things took the nets," he says. "Then they took the oars. I've nothing left to give you but gratitude."`],
        options: [
          { label: 'Help him raise and patch the punt', check: { skill: 'athletics', dc: 11 }, ok: { text: `Between you, you wrestle the boat upright and caulk the split. Orrin weeps openly. He presses his last smoked eel and a flask into your hands, and tells you where the dry paths run.`, pack: { potion: 1 }, rep: { order: 1 }, scout: true, xp: 20, tag: 'kind' }, bad: { text: `The punt slips, and the cold water takes your breath. You get it up in the end, but not before it takes a bite out of you.`, hurt: '1d4', xp: 8, tag: 'kind' } },
          { label: 'Buy a hot meal (6 gold)', cost: { gold: 6 }, ok: { text: `It is mostly eel and entirely excellent. You leave warmer and better informed.`, heal: '1d8', scout: true } },
        ] },
      { id: 'mire_cairn', name: 'The drowned cairn', hint: 'A sunken Keeper marker',
        text: [`A Keeper's cairn stands half-drowned, the sigil on its cap eaten by moss. The water around it is clear and green and impossibly still. Something glints below the surface.`],
        options: [
          { label: 'Dive for what glints', check: { skill: 'athletics', dc: 12 }, ok: { text: `You surface gasping, a corroded strongbox clutched in your arms. Inside: coins, a Keeper's token, and a pouch of dried herbs still smelling of summer.`, gold: 22, mats: { silverleaf: 1 }, rep: { keepers: 1 }, xp: 25 }, bad: { text: `Something coils around your ankle and pulls. You kick free, lungs burning, with nothing to show for it.`, hurt: '1d6', xp: 8 } },
          { label: 'Say a word for the drowned Keeper', tag: 'faith', ok: { text: `You stand in the stillness and speak the old words. The water shivers, as though someone, far below, has heard. A weight you had not noticed lifts from your chest.`, cleanse: 1, rep: { keepers: 1 }, xp: 15, tag: 'faith' } },
        ] },
      { id: 'mire_nest', name: 'The leech-king\'s hollow', hint: 'Dangerous — good spoils', danger: true,
        text: [`The water in this hollow is warm and red-brown. Long pale shapes slide along the surface. A grey, oozing crown of bone and reed rests on a hummock in the middle: the nest of something that has grown fat on the Hollow.`],
        options: [
          { label: 'Burn out the nest', fight: ['bog_leech', 'bog_leech', 'hollowed'], ok: { text: `The nest burns with a sickly green flame. When the smoke clears, you find a nest of glittering grey crystal among the ashes.`, mats: { shard: 2, silverleaf: 1 }, gold: 18, xp: 30 }, bad: { text: `They drag you under. You wake on a hummock, lighter by a purse and a good deal of dignity.`, gold: -8 } },
          { label: 'Slip past unseen', check: { skill: 'stealth', dc: 13 }, ok: { text: `You pick your way along the roots, step by silent step. On the far side you find a dry path that few have ever used — it will save you hours.`, scout: true, xp: 15 }, bad: { text: `A leech drops on your shoulder. You tear it off, flee, and come away bleeding and wiser.`, hurt: '1d4' } },
        ] },
      { id: 'mire_lights', name: 'Witch-light glade', hint: 'Hidden', hidden: true,
        text: [`The reeds part on a glade lit from within. Soft green lights drift between the trees like slow fireflies, and where they pass, the grey moss pulls back. You have the odd feeling you've been expected.`],
        options: [
          { label: 'Follow the lights', check: { skill: 'survival', dc: 12 }, ok: { text: `The lights lead you along a path so easy it feels like a gift: dry, firm, and quiet. They leave you at the edge of the shrine's causeway, and wink out.`, scout: 2, xp: 30, mats: { silverleaf: 2 } }, bad: { text: `The lights bob away from you, mocking, and you lose an hour wading in circles.`, doom: 1 } },
          { label: 'Pick a lantern-flower', check: { skill: 'sleight', dc: 13 }, ok: { text: `The petals fold into your palm, glowing. Whatever made this glade will be annoyed, later. For now, it is a very good flower.`, gear: 'rare', xp: 20, corrupt: 0 }, bad: { text: `The flower bites. The lights dim, then all swing round to look at you.`, hurt: '1d6', injure: false } },
        ] },
    ] },

  mines: {
    blurb: `The Emberdeep slopes are a maze of old spoil heaps, shuttered adits and carved stairs. The dwarves still keep watch from the high galleries. Smoke curls from at least three places you didn't expect.`,
    pois: [
      { id: 'mines_camp', name: 'Miners\' refuge camp', hint: 'Dwarves in need',
        text: [`A dozen dwarves have dug in behind a barricade of ore-carts. A bandaged foreman, Hilda Copperpot, looks you up and down. "We've plenty of rock and not enough bread," she says. "And the Hollow's cut the lift."`],
        options: [
          { label: 'Share your supplies (a potion)', req: () => (G.pack.potion || 0) > 0, hint: 'Costs 1 Healing Potion', tag: 'kind', ok: { text: `Hilda tears the potion into six portions with a ruthless precision and hands them to the wounded. A dwarf child offers you a chunk of rock-salt, solemnly. It is the highest honour in the house.`, rep: { dwarves: 2 }, xp: 25, tag: 'kind', mats: { iron: 1 }, take: { potion: 1 } } },
          { label: 'Help them clear the lift-cable', check: { skill: 'athletics', dc: 12 }, ok: { text: `It takes four hours and a great deal of swearing in two languages. When the cable runs again, every dwarf in the camp stops to cheer.`, rep: { dwarves: 1 }, gold: 15, mats: { iron: 2 }, xp: 25 }, bad: { text: `The chain bites your palm and the cable drops back into the dark. Hilda sighs. "Aye, well. It was worth trying."`, hurt: '1d4' } },
        ] },
      { id: 'mines_forge', name: 'The cold forge-chapel', hint: 'An abandoned shrine',
        text: [`A small dwarven chapel to the Forgemother stands unburned in a cavern. Her statue holds a hammer in one hand and, in the other, a cold coal. An offering bowl is half full of old coins.`],
        options: [
          { label: 'Light the coal', check: { skill: 'arcana', dc: 12 }, ok: { text: `The coal catches with a soft whump. The whole chapel glows, and in the heat you feel the Hollow's chill fall away from you. On the altar, something the forge left behind: a lump of living ember.`, mats: { ember: 2 }, focus: true, xp: 25, rep: { dwarves: 1 } }, bad: { text: `The coal flares and singes your eyebrows. The Forgemother's face stays carved and unimpressed.`, hurt: '1d4', xp: 8 } },
          { label: 'Take the coins from the bowl', tag: 'greed', ok: { text: `They are old, heavy, and unquestionably holy. You pocket a fistful. Somewhere a long way off a dwarf sneezes, and has no idea why.`, gold: 25, rep: { dwarves: -2 }, tag: 'greed' } },
        ] },
      { id: 'mines_den', name: 'The Cinder-hound den', hint: 'Dangerous — good spoils', danger: true,
        text: [`Scorched bones litter the mouth of a side-tunnel, and the stone is warm to the touch. Something has been using this adit as a kennel — something with fire in its jaws and no taste at all for strangers.`],
        options: [
          { label: 'Clear the den', fight: () => [foe('hollow_wolf'), foe('hollow_wolf'), foe('hollowed')], ok: { text: `The last beast collapses in a heap of cinders. Behind it, a stash of dwarven tools, long forgotten, and a few lumps of unspent ember.`, mats: { ember: 2, iron: 1 }, gear: 'uncommon', xp: 35, rep: { dwarves: 1 } }, bad: { text: `Fire and teeth. You tumble out of the tunnel, scorched, and abandon your purse in the smoke.`, gold: -10 } },
          { label: 'Seal the tunnel with a rockfall', check: { skill: 'athletics', dc: 13 }, ok: { text: `The adit collapses in a long gravelly roar. Whatever lived there will find another way out eventually, but not today. The dwarves above will thank you.`, rep: { dwarves: 1 }, xp: 20, scout: true }, bad: { text: `The beam doesn't fall where you want it to. The beasts come looking for the noise.`, hurt: '1d6' } },
        ] },
      { id: 'mines_vein', name: 'The old royal vein', hint: 'Hidden', hidden: true,
        text: [`A side-passage, blocked by a boulder that looks too neatly placed, opens onto a vein of metal so bright it seems lit from inside. Dwarven runes run along the wall in a language you only half understand: "THE KING'S FORGE-GOLD. TAKE ONLY WHAT YOU WILL FORGE."`],
        options: [
          { label: 'Take what you can use', check: { skill: 'lore', dc: 13 }, ok: { text: `You read the runes properly and take exactly what you need — no more. The vein hums, pleased. A smith in Hearthmoor will turn this into something beautiful.`, mats: { iron: 3, ember: 1 }, gear: 'rare', rep: { dwarves: 2 }, xp: 40 }, bad: { text: `You take more than the runes allow. The vein dims, sullenly. A long way off, a dwarf's ears burn.`, gold: 20, rep: { dwarves: -1 }, xp: 10 } },
        ] },
    ] },

  harbor: {
    blurb: `Saltcliff clings to the rock in tiers: ropewalks, net-lofts, tavern-stairs, and a hundred crooked alleys. Everyone here is for sale. A few things are not.`,
    pois: [
      { id: 'harbor_stall', name: 'The tide-market stall', hint: 'A crooked bargain',
        text: [`A one-eyed woman named Marl sells things off an upturned boat: charms, bundles, a single left boot. "Everything's a bargain," she says cheerfully. "Specially if you've no idea what it is."`],
        options: [
          { label: 'Haggle', check: { skill: 'persuasion', dc: 12 }, ok: { text: `Marl throws up her hands, laughing. You leave with a good-luck charm, a bottle of the strong stuff, and her grudging respect.`, pack: { potion: 1 }, gold: 8, rep: { smugglers: 1 }, xp: 20 }, bad: { text: `She's far better at this than you are. You end up buying a left boot.`, gold: -6, xp: 8 } },
          { label: 'Pick a pocket while she\'s busy', check: { skill: 'sleight', dc: 13 }, tag: 'cunning', ok: { text: `Her purse is in your sleeve before she finishes the sentence. Marl blinks, looks at you, and — against all odds — smiles. "Oh, you're one of us."`, gold: 30, rep: { smugglers: 1 }, xp: 25, tag: 'cunning' }, bad: { text: `She catches your wrist so quickly it makes a sound. "Try that again," says Marl, pleasantly, "and I'll feed it to the gulls."`, rep: { smugglers: -1 }, hurt: '1d4' } },
        ] },
      { id: 'harbor_net', name: 'The net-loft meeting', hint: 'A conspiracy in the rafters',
        text: [`Above the loft, between hanging nets, a dozen smugglers argue in whispers. They fall silent as you climb up. A big woman in oilskins recognises you. "You're asking about the Collector," she says. "Everybody knows it. Nobody says it."`],
        options: [
          { label: 'Ask about the Collector openly', check: { skill: 'persuasion', dc: 13 }, ok: { text: () => `She tells you the lot: which docks, which ships, which captain takes ${V().short}'s coin. It is a very good map of a very bad business.`, clue: true, rep: { smugglers: 1 }, xp: 30, scout: true }, bad: { text: `They clam up, and one of them quietly leaves by the window.`, rep: { smugglers: -1 }, xp: 8 } },
          { label: 'Slip out before they notice', tag: 'cunning', ok: { text: `Better to be a rumour than a witness. You step back down the ladder, unseen.`, xp: 5 } },
        ] },
      { id: 'harbor_wreck', name: 'The ghost-ship Mary-Beth', hint: 'Dangerous — good spoils', danger: true,
        text: [`A hulk lies on the rocks below the cliff, its masts snapped, its sails stitched with grey. Lanterns burn on its deck. Nobody has lit them in years. The harbour children dare each other to touch her hull.`],
        options: [
          { label: 'Board her and clear the deck', fight: () => [foe('shade_guard'), foe('shade_guard'), foe('hollowed')], ok: { text: `The last shade unravels into spray. In the captain's cabin: a sea-chest, a locket, and a very good cutlass.`, gold: 30, gear: 'rare', rep: { smugglers: 1 }, xp: 40 }, bad: { text: `The crew ripple out of the walls. You flee over the side and drop three rungs short of the rope.`, hurt: '1d6', gold: -8 } },
          { label: 'Search the hull from the water', check: { skill: 'perception', dc: 13 }, ok: { text: `Cut loose from the keel and swinging in the surf: a small chest of dead sailors' coin. You haul it up, and say a quiet word for them.`, gold: 22, xp: 20, mats: { iron: 1 } }, bad: { text: `A wave takes your footing and the chest sinks. You surface spitting sea-water and invective.`, hurt: '1d4' } },
        ] },
      { id: 'harbor_cove', name: 'The smugglers\' cove', hint: 'Hidden', hidden: true,
        text: [`A cleft in the cliff, hidden at low tide, opens onto a cave full of lamplit crates. A sleepy teenager with a cutlass jerks awake. "Don't tell!" she squeaks. "Cap'll feed me to the crabs!"`],
        options: [
          { label: 'Agree to buy something quietly', cost: { gold: 20 }, hint: '20 gold', tag: 'greed', ok: { text: `The teenager shows you a shelf of things that are not officially on sale: a smoke bomb, a warm cloak, a vial of Grey-Cure. "Best I got," she says, in awe of her own bravery.`, pack: { smoke_bomb: 2, grey_cure: 1 }, rep: { smugglers: 2 }, xp: 25 } },
          { label: 'Tell her you\'re with the Order, and confiscate it', tag: 'cruelty', ok: { text: `She hands over a crate with shaking hands. It's mostly rum, but there's a decent knife at the bottom. You feel faintly unclean about the whole thing.`, gold: 25, rep: { smugglers: -2, order: 1 }, xp: 15, tag: 'cruelty' } },
        ] },
    ] },

  barrow: {
    blurb: `The Whispering Barrow stands in a field of leaning stones, each carved with a name no one can read. The wind seems to be saying something. If you listen closely, it is.`,
    pois: [
      { id: 'barrow_rings', name: 'The ring of names', hint: 'A circle of whispering stones',
        text: [`Twelve stones stand in a ring, and each has a name worn almost to nothing. When you step between them the whispering stops. All at once. As though somebody had asked for quiet.`],
        options: [
          { label: 'Listen to them', check: { skill: 'insight', dc: 12 }, ok: { text: `One whisper at a time, the stones tell you what they remember: not names, but small kindnesses. A shared meal. A mended roof. By the end you understand what the Keepers were fighting for.`, rep: { keepers: 1 }, xp: 25, scout: true, cleanse: 1 }, bad: { text: `The whispers close over your thoughts like water. You come to a little later, with a headache and a faint sense of having been rude.`, hurt: '1d4' } },
          { label: 'Read the inscriptions', tag: 'lore', check: { skill: 'lore', dc: 12 }, ok: { text: `The oldest stone is a ward-rune, still faintly warm. You copy it carefully. It will prove useful.`, clue: true, rep: { keepers: 1 }, xp: 25, tag: 'lore' }, bad: { text: `The script is too old and too strange. You copy the shapes without understanding them.`, xp: 8 } },
        ] },
      { id: 'barrow_graves', name: 'The pilgrims\' graves', hint: 'Fresh graves, fresh flowers',
        text: [`A row of newly dug graves runs along the barrow's flank, each with a handful of wildflowers on top. A grey-robed Order monk is tending them in silence. She looks up at you with eyes like old glass.`],
        options: [
          { label: 'Help her dig the last grave', tag: 'kind', ok: { text: `You dig in silence. When it's done she hands you a small wooden bell. It makes no sound at all, but you feel oddly calmer holding it.`, rep: { order: 2 }, heal: '1d6', xp: 20, tag: 'kind', pack: { focus_tonic: 1 } } },
          { label: 'Search the pilgrims\' packs for supplies', tag: 'greed', ok: { text: `Dead men need no bread. You take food, a flask, and a coil of rope. It is practical, and it feels like stealing from a church.`, gold: 12, pack: { potion: 1 }, rep: { order: -1 }, xp: 10, tag: 'greed' } },
        ] },
      { id: 'barrow_wights', name: 'The tomb-guard\'s hollow', hint: 'Dangerous — good spoils', danger: true,
        text: [`A small barrow-mound has been broken open from within. Cold light leaks up from the dark. Rusted grave-goods lie scattered on the grass, and on the lintel, scratched deep: "STAY OUT."`],
        options: [
          { label: 'Descend and put them down', fight: () => [foe('wight'), foe('shade_guard'), foe('shade_guard')], ok: { text: `The wight collapses into fine dry dust. Among the ruined grave-goods, a good blade, a purse, and a very old Keeper's brooch.`, gold: 25, gear: 'rare', rep: { keepers: 1 }, xp: 40, mats: { shard: 1 } }, bad: { text: `Their touch is cold and absolute. You stagger back into the sun and find your purse light and your hands blue.`, hurt: '1d6', gold: -10 } },
          { label: 'Reseal the mound', check: { skill: 'lore', dc: 13 }, ok: { text: `You speak the seal-words and lean on the stone. It rolls into place with a sound like a long exhale. The cold stops leaking.`, rep: { keepers: 1 }, xp: 25, scout: true }, bad: { text: `The words come out wrong. The stone resists. You leave it half-shut and hope.`, doom: 1 } },
        ] },
      { id: 'barrow_hush', name: 'The Hush', hint: 'Hidden', hidden: true,
        text: [`Behind the barrow, a gap between two stones opens into a hollow where there is absolutely no sound. Not even your own breath. At the centre, a small mound of flowers grows around something bright and silver.`],
        options: [
          { label: 'Take the silver thing', check: { skill: 'sleight', dc: 13 }, ok: { text: `It comes away warm and quiet in your palm: a Keeper's token, polished by a hundred years of nothing at all. When you step out, the whispers are loud, and glad.`, gear: 'rare', rep: { keepers: 1 }, xp: 35, scout: 2 }, bad: { text: `The silence rushes in on you like a wave. You stagger out with ringing ears, empty-handed.`, hurt: '1d4' } },
          { label: 'Leave it undisturbed', tag: 'faith', ok: { text: `You nod to whoever lies here, and step back. The silence follows you out and settles on your shoulders like a blessing.`, focus: true, rep: { keepers: 1 }, xp: 20, tag: 'faith' } },
        ] },
    ] },

  peak: {
    blurb: `Frosthollow is a mountain of wind and bare rock, laced with rope-bridges, prayer-flags and old switchback stairs. The Silent Order's monks have kept these paths for four hundred years.`,
    pois: [
      { id: 'peak_shrine', name: 'The wind-shrine', hint: 'A quiet place to rest',
        text: [`A tiny stone shrine stands on a shelf of rock above the cloud, hung with a thousand prayer-flags. A single lamp burns inside. Whoever kept it has gone, but the oil is still warm.`],
        options: [
          { label: 'Rest here a while', tag: 'faith', ok: { text: `The wind sings through the flags and for an hour there is nothing at all to do but breathe. You leave rested and more yourself.`, heal: '1d10', focus: true, xp: 10, tag: 'faith' } },
          { label: 'Add a flag of your own', tag: 'faith', ok: { text: `You tie a scrap of cloth to the line. It snaps in the wind like a small bright wing. You feel, absurdly, that you've been noticed.`, rep: { order: 1 }, xp: 15, tag: 'faith', cleanse: 1 } },
        ] },
      { id: 'peak_ledge', name: 'The frozen ledge', hint: 'A stranded climber',
        text: [`On a narrow ledge, half-buried in drift, a young climber is waving a rope. Her left leg is bent wrong. "Don't fall," she calls. "It's not worth it."`],
        options: [
          { label: 'Climb down and carry her up', check: { skill: 'athletics', dc: 13 }, tag: 'kind', ok: { text: `It is the hardest thing you have done all week. She is light and silent and clings to you like a child. At the top, she kisses your hand. "I'm Dessa," she says. "I owe you the sun."`, rep: { order: 1 }, gold: 18, xp: 35, tag: 'kind' }, bad: { text: `The rope slips and the ledge crumbles. You tumble down the slope, bruised and bleeding, and pull her out by a different path.`, hurt: '1d8', rep: { order: 1 }, xp: 15 } },
          { label: 'Tie a line and call for the monks', tag: 'kind', ok: { text: `It takes longer, but it works. A bell clangs somewhere above and two grey-robed monks come down like spiders. They nod at you, wordlessly. It is more than thanks.`, rep: { order: 1 }, xp: 15, tag: 'kind' } },
        ] },
      { id: 'peak_cave', name: 'The wyrmling cave', hint: 'Dangerous — good spoils', danger: true,
        text: [`Frost-rimed tracks lead into a cave, and the cave breathes out cold. Something small and scaled and furious is nesting in there, and its mother has gone hunting.`],
        options: [
          { label: 'Take the nest', fight: () => [foe('hollow_wolf'), foe('hollow_wolf'), foe('hollowed')], ok: { text: `The wyrmlings are not so very small. When the last has fallen silent, you find frost-silver and a cold, bright scale.`, mats: { iron: 2, shard: 1 }, gear: 'uncommon', gold: 20, xp: 35 }, bad: { text: `They are quicker than they look. You retreat down the scree, frostbitten and humiliated.`, hurt: '1d6' } },
          { label: 'Steal an egg and flee', check: { skill: 'sleight', dc: 14 }, tag: 'greed', ok: { text: `Cold as an iceberg and heavy as a stone: a frost-wyrm egg. A collector in Hearthmoor will pay handsomely, and ask no questions.`, gold: 45, xp: 25, tag: 'greed' }, bad: { text: `Roar, frost, scramble, fall. You drop the egg and keep your life.`, hurt: '1d6' } },
        ] },
      { id: 'peak_scriptorium', name: 'The buried scriptorium', hint: 'Hidden', hidden: true,
        text: [`A crack in the mountain reveals a long, dry library, preserved in ice. Hundreds of scrolls lie in racks. The monks' lamps still burn on every table, blue and steady. There is a desk, and a chair, and a half-finished letter.`],
        options: [
          { label: 'Read the half-finished letter', check: { skill: 'investigation', dc: 12 }, ok: { text: () => `It is a letter from one of the old Keepers to her successor: a plain, warm, hurried account of what she knew about ${V().short}. You read it slowly. By the end, you're holding your breath.`, clue: true, rep: { keepers: 1, order: 1 }, xp: 35 }, bad: { text: `The ink has run. You manage a few lines about snow and nothing else.`, xp: 10 } },
          { label: 'Take a handful of the scrolls', tag: 'lore', ok: { text: `Most of them are poetry. One is a map. You feel, on balance, that this is a net win.`, gold: 10, scout: 2, rep: { order: -1 }, xp: 20, tag: 'lore' } },
        ] },
    ] },

  orchard: {
    blurb: `Silverbough is a forest planted in rows: ancient silver trunks, bridges, hanging lanterns, and everywhere a faint chiming as the wind combs through the leaves. Elves watch you from the branches and say nothing.`,
    pois: [
      { id: 'orchard_glade', name: 'The apple-glade', hint: 'A quiet clearing',
        text: [`A glade of young trees, newly planted, each with a ribbon on its trunk. An elven child is watering them from a clay jug. She looks up at you with total solemnity. "These are the replacements," she says. "In case."`],
        options: [
          { label: 'Help her water the saplings', tag: 'kind', ok: { text: `You work till sunset. The child inspects every sapling afterward and declares them "fine." It is the highest compliment in the language.`, rep: { elves: 1 }, heal: '1d6', xp: 20, tag: 'kind', mats: { silverleaf: 1 } } },
          { label: 'Ask about the Hollow in the roots', check: { skill: 'persuasion', dc: 12 }, ok: { text: `She puts down the jug. "It started under the oldest tree," she whispers. "The grown-ups pretend not to see. But there's a door, and it's on the north side."`, scout: true, clue: true, rep: { elves: 1 }, xp: 25 }, bad: { text: `She stares at you, then runs, and returns with an adult who looks at you with a good deal less patience.`, rep: { elves: -1 } } },
        ] },
      { id: 'orchard_hall', name: 'The Leaf-singers\' hall', hint: 'A hall of living wood',
        text: [`A hall grown rather than built: arching boughs, a floor of moss, a chorus of elves in the middle of a slow, interlocking song. A grey patch has appeared on the north wall, and the singers keep their eyes away from it.`],
        options: [
          { label: 'Join the song', check: { skill: 'performance', dc: 12 }, ok: { text: `You find the line of the melody, and add a third voice. The grey patch stops spreading. When the song ends, no one speaks, and then everyone does. They give you a leaf-wrapped gift.`, rep: { elves: 2 }, pack: { focus_tonic: 1 }, gear: 'uncommon', xp: 35 }, bad: { text: `You come in half a beat late. The chorus falters. They forgive you, but not for a while.`, rep: { elves: -1 }, xp: 8 } },
          { label: 'Scrape the grey patch with a Keeper\'s blade', tag: 'brave', check: { skill: 'arcana', dc: 13 }, ok: { text: `The grey peels away like wet paper. The elves watch in awed silence as the wood beneath turns gold again.`, rep: { elves: 1, keepers: 1 }, xp: 30 }, bad: { text: `It comes away in a cold, greasy sheet and smears on your hands.`, corrupt: 1, xp: 8 } },
        ] },
      { id: 'orchard_grove', name: 'The rot-grove', hint: 'Dangerous — good spoils', danger: true,
        text: [`A grove of trees gone grey and soft, their roots twisting out of the earth like fingers. Something is moving in the rot, and the elves have marked the path around it with red cord.`],
        options: [
          { label: 'Cut the rot out', fight: () => [foe('hollowed'), foe('hollowed'), foe('hollow_wolf')], ok: { text: `When the last rot-thing falls, the grove sighs. New green shoots push up through the grey. You find a cache of crystallised sap, and silver leaves like coins.`, mats: { silverleaf: 2, shard: 1 }, gear: 'uncommon', rep: { elves: 1 }, xp: 40 }, bad: { text: `They overwhelm you, and the sap burns where it touches. You retreat with nothing and a smell that doesn't leave.`, hurt: '1d6' } },
          { label: 'Burn it out with lantern oil', tag: 'cruelty', ok: { text: `It burns beautifully, and horribly. The elves watching from the canopy go quiet. Nothing will grow there for a long time.`, gold: 10, mats: { shard: 2 }, rep: { elves: -2 }, xp: 20, tag: 'cruelty' } },
        ] },
      { id: 'orchard_spring', name: 'The moon-spring', hint: 'Hidden', hidden: true,
        text: [`In a hollow beneath the roots of the oldest tree, a spring wells up silver-white and perfectly cold. A single elven runestone is set at its edge. Drops from the roots fall into it with a sound like a bell.`],
        options: [
          { label: 'Drink deeply', check: { skill: 'wis', dc: 12 }, ok: { text: `It is like drinking starlight. When you straighten, every ache has gone and the grey in your veins has loosened its grip.`, heal: 'full', focus: true, cleanse: 2, rep: { elves: 1 }, xp: 35 }, bad: { text: `It is simply too cold. You cough and shiver, but the feeling of being watched stays with you. A little healing, at least.`, heal: '1d6', xp: 10 } },
          { label: 'Fill a flask for later', ok: { text: `The water stays bright in the flask. A drop will cure a lot.`, pack: { grey_cure: 1 }, rep: { elves: 1 }, xp: 15 } },
        ] },
    ] },

  court: {
    blurb: `Castle Varric glitters on its lake: terraces, gardens, a hundred lit windows, and a night's worth of music already underway. Servants glide between everything. Not one makes eye contact.`,
    pois: [
      { id: 'court_garden', name: 'The rose terrace', hint: 'A moonlit conversation',
        text: [`On a quiet terrace, a young noblewoman in a borrowed mask is crying silently into her gloves. When she sees you, she straightens, as though caught committing a crime.`],
        options: [
          { label: 'Offer her a handkerchief and a quiet ear', tag: 'kind', ok: { text: `She tells you everything, in a rush: her father has gambled away the estate, and tonight is a plan to fix it, and she hates the plan. You listen. When she goes back inside, she looks a bit more like herself.`, clue: true, rep: { keepers: 1 }, xp: 25, tag: 'kind' } },
          { label: 'Press her for what she knows', check: { skill: 'intimidation', dc: 12 }, tag: 'cruelty', ok: { text: `She whispers a name, a room, a time. Her hands shake the whole while. You leave with the information, and she doesn't look at you again.`, gold: 15, clue: true, xp: 15, tag: 'cruelty' }, bad: { text: `She calls for a guard, and you leave the terrace faster than you arrived.`, rep: { keepers: -1 } } },
        ] },
      { id: 'court_kitchen', name: 'The servants\' kitchen', hint: 'Backstairs gossip',
        text: [`Behind the ballroom, a cavernous kitchen roars with copper and steam. A cook the size of a barn door is carving a swan. He regards you with infinite suspicion, and then, abruptly, offers you a plate.`],
        options: [
          { label: 'Eat, and talk', ok: { text: `The cook is called Bellamy and knows everything. You learn which door is guarded, which isn't, and which footman can be bribed with a pastry. It's the best meal of your week.`, heal: '1d8', scout: 2, xp: 20, pack: { potion: 1 } } },
          { label: 'Ask the cook to smuggle you through the cellars', check: { skill: 'persuasion', dc: 13 }, ok: { text: `He grumbles, wipes his hands, and shows you a door that isn't on any plan. "Never saw you," he says. "Never even liked you."`, scout: true, rep: { smugglers: 1 }, xp: 25 }, bad: { text: `"No," says Bellamy, and goes back to the swan.`, xp: 5 } },
        ] },
      { id: 'court_guard', name: 'The grey-guard barracks', hint: 'Dangerous — good spoils', danger: true,
        text: [`Behind a service door, a barracks full of grey-liveried guards sits suspiciously still. Their eyes are open. Their breathing is perfectly synchronised. The room is cold, and smells of ash.`],
        options: [
          { label: 'Strike before they wake', fight: () => [minion(), minion(), foe('court_blade')], ok: { text: `When the last Hollow-touched guard falls, the room exhales. Among the wreckage, a strongbox with the Collector's seal and a very fine blade.`, gold: 40, gear: 'rare', xp: 45, mats: { shard: 2 } }, bad: { text: `They wake all at once, with a sound like a hundred doors closing. You flee through the kitchens and leave a purse behind.`, hurt: '1d6', gold: -12 } },
          { label: 'Lock them in', check: { skill: 'sleight', dc: 13 }, ok: { text: `The bolt slides home with a very quiet, very satisfying click. They won't be a problem tonight.`, xp: 25, scout: true }, bad: { text: `The latch squeaks. A hundred heads turn together.`, hurt: '1d4' } },
        ] },
      { id: 'court_vault', name: 'The cartographer\'s vault', hint: 'Hidden', hidden: true,
        text: [`Behind a tapestry of a stag hunt, a hidden stair leads to a long, dry room lined with maps. A single lamp is lit. A dead cartographer sits at his desk, face-down on his last chart, a pen still in his hand.`],
        options: [
          { label: 'Study the chart under his hand', check: { skill: 'investigation', dc: 13 }, ok: { text: () => `It's a map of ${V().stronghold}, with the guard rotations in the margin. He died drawing it. You carry it out with something like reverence.`, scout: 2, clue: true, xp: 40, rep: { keepers: 1 } }, bad: { text: `It's mostly coffee stains and a curse. You find one useful corner.`, scout: true, xp: 15 } },
          { label: 'Loot the room', tag: 'greed', ok: { text: `You take a purse, a signet, a brass compass of lovely make. It feels a little like robbing a colleague.`, gold: 35, gear: 'uncommon', xp: 15, tag: 'greed' } },
        ] },
    ] },

  wych: {
    blurb: `Wych Hollow is silent and grey in a way that has nothing to do with the light. Doors stand open on empty rooms. The wind stops when you enter the square, and starts again when you leave.`,
    pois: [
      { id: 'wych_well', name: 'The village well', hint: 'A bucket still on its rope',
        text: [`The village well is dry, and the rope still holds a bucket. From the depths, very faintly, comes the sound of someone humming a lullaby. It stops when you look in.`],
        options: [
          { label: 'Lower a lantern down', check: { skill: 'perception', dc: 12 }, ok: { text: `At the bottom there's a small stone with a name scratched on it, and a pile of children's toys. You say the name aloud. The humming resumes, content.`, rep: { order: 1 }, cleanse: 1, xp: 25, tag: 'kind' }, bad: { text: `The lantern goes out before it reaches the bottom. The humming stops, and you'd rather not know why.`, corrupt: 1, xp: 8 } },
          { label: 'Hum the lullaby back', tag: 'faith', check: { skill: 'performance', dc: 12 }, ok: { text: `You find the tune and sing it softly. The sound from below changes, becomes lighter. Something thanks you, with no words.`, heal: 'full', cleanse: 1, xp: 30, tag: 'faith' }, bad: { text: `Your voice cracks and the echo does not match what you sang.`, hurt: '1d4', xp: 8 } },
        ] },
      { id: 'wych_chapel', name: 'The weeping chapel', hint: 'Candles lit by no one',
        text: [`The village chapel is whole, and lit. Every candle on the altar burns steadily, though there is no one to light them. A set of children's footprints leads in from the door, and does not lead out.`],
        options: [
          { label: 'Light a candle for them', tag: 'faith', ok: { text: `The flame takes. The footprints fade from the floor, as if rubbed out by a gentle hand. Something that has been waiting for a very long time lets go.`, rep: { order: 1 }, cleanse: 2, xp: 30, tag: 'faith' } },
          { label: 'Search the vestry', check: { skill: 'investigation', dc: 12 }, ok: { text: `Behind the vestry cupboard: a priest's lockbox, still sealed, and inside it a warding charm and a few last coins.`, gold: 20, pack: { focus_tonic: 1 }, xp: 25 }, bad: { text: `Nothing but dust and the faint smell of old incense.`, xp: 8 } },
        ] },
      { id: 'wych_stalker', name: 'The grey pasture', hint: 'Dangerous — good spoils', danger: true,
        text: [`A pasture where the grass is the colour of old pewter and not a single blade moves. In the middle stands a figure the shape of a shepherd, perfectly still. It turns its head all the way round when you look away.`],
        options: [
          { label: 'Lay it to rest', fight: () => [foe('grey_stalker')], ok: { text: `It crumples like a collapsing tent, folding in on itself till there is nothing in the grass but a pale crystal the size of a fist and a battered crook.`, mats: { shard: 3 }, gear: 'rare', xp: 55 }, bad: { text: `The pasture closes round you. You wake on the road, a day's walk away, with ice in your veins and no purse.`, hurt: '1d6', gold: -12, corrupt: 1 } },
          { label: 'Walk through it, eyes closed', check: { skill: 'wis', dc: 14 }, ok: { text: `You count your breaths. You listen. When you open your eyes, you are on the far side, and a path of living green lies behind you.`, scout: 2, xp: 30 }, bad: { text: `The pasture takes a toll in warmth, and gives it back in dread.`, hurt: '1d6', corrupt: 1 } },
        ] },
      { id: 'wych_graves', name: 'The children\'s graves', hint: 'Hidden', hidden: true,
        text: [`Behind the chapel, in a square of uncut grass untouched by the grey, stand six little stones. Each has a name, and a small carved bird. A seventh grave has been dug but not filled.`],
        options: [
          { label: 'Fill the seventh grave', tag: 'kind', ok: { text: `It takes an hour. When it's done, the carved birds on the stones all seem to turn their heads. A soft light comes up through the grass, and a small hand's worth of warmth settles in yours.`, gear: 'epic', cleanse: 2, rep: { order: 1 }, xp: 45, tag: 'kind' } },
          { label: 'Leave the stones in peace', tag: 'faith', ok: { text: `You stand a moment. The grass is warm. When you walk away, there is more green on the path than there was before.`, heal: '1d8', cleanse: 1, xp: 20, tag: 'faith' } },
        ] },
    ] },
};

const EXPLORE_ENTRY = {
  mire_start: 'mire', mire_crossroads: 'mire', mines_start: 'mines', mines_junction: 'mines', harbor_start: 'harbor', harbor_docks: 'harbor',
  barrow_start: 'barrow', barrow_hall: 'barrow', peak_start: 'peak', peak_gate: 'peak', orchard_start: 'orchard', orchard_council: 'orchard',
  court_start: 'court', court_walls: 'court', wych_start: 'wych', wych_square: 'wych',
};

/* local knowledge: each scouted spot gives +1 to checks in that region (max +2) */
const scoutBonus = rid => Math.min(2, (G.flags['scout_' + rid] || 0));
function exploredCount(rid) { return EXPLORE[rid].pois.filter(p => G.explored[p.id]).length; }

function exploreTick(rid) {
  G.flags['xcount_' + rid] = (G.flags['xcount_' + rid] || 0) + 1;
  const every = hasPerk('trailblazer') ? 3 : 2;
  if (G.flags['xcount_' + rid] % every === 0) { doom(1); }
}

Object.keys(EXPLORE).forEach(rid => {
  const E = EXPLORE[rid], hub = 'xp_' + rid;
  SCENES[hub] = {
    title: () => `Around ${REGIONS[rid].short}`,
    text: s => {
      const left = E.pois.filter(p => !G.explored[p.id] && (!p.hidden || G.flags['found_' + p.id])).length;
      const hiddenLeft = E.pois.some(p => p.hidden && !G.flags['found_' + p.id] && !G.explored[p.id]);
      const every = hasPerk('trailblazer') ? 3 : 2;
      const next = every - ((G.flags['xcount_' + rid] || 0) % every);
      return P(E.blurb,
        left ? `${left} place${left === 1 ? '' : 's'} to visit${hiddenLeft ? ', and rumour of more' : ''}.` : (hiddenLeft ? `Nothing else stands out — but locals hint that there are places off the paths.` : `You've seen everything this region will show you.`),
        scoutBonus(rid) ? `<i>Local knowledge: +${scoutBonus(rid)} to your checks here.</i>` : '',
        `<i>${next === 1 ? 'Another detour will cost you time: the grey will creep closer (+1 Doom).' : 'You can afford a detour — for now.'}</i>`);
    },
    choices: s => {
      const list = E.pois.filter(p => !G.explored[p.id] && (!p.hidden || G.flags['found_' + p.id])).map(p => ({ label: p.name, icon: p.danger ? 'battle' : p.hidden ? 'eye' : 'compass', hint: p.hint + (p.danger ? ' · danger' : ''), next: 'xpp_' + p.id }));
      const hidden = E.pois.filter(p => p.hidden && !G.flags['found_' + p.id] && !G.explored[p.id]);
      if (hidden.length) list.push({
        label: 'Search for hidden places', icon: 'eye', hint: 'Each search takes time',
        check: { skill: 'perception', dc: 11 + Math.min(tier(), 3) },
        success: { effects: () => { flag('found_' + hidden[0].id); exploreTick(rid); }, text: P(`Following a half-seen track, a trampled reed-bed, a thread of smoke, you find your way to somewhere most travellers never would.`), next: hub },
        failure: { effects: () => exploreTick(rid), text: P(`An afternoon of beating through undergrowth turns up nothing but insects and a bad temper.`), next: hub },
      });
      list.push({ label: 'Return to the main road', icon: 'next', next: () => G.flags.xp_back || (rid + '_start') });
      return list;
    },
  };
  E.pois.forEach(p => {
    Mini.scene('xpp_' + p.id, {
      title: p.name, ctx: { region: rid, mark: p.id }, back: hub,
      first: () => exploreTick(rid),
      text: P(...p.text),
      options: p.options.concat([{ label: 'Leave it for now', icon: 'back', ok: { text: '', next: hub } }]),
    });
  });
});

/* Add "Explore the surroundings" to the entry scenes of each region. */
Object.keys(EXPLORE_ENTRY).forEach(id => {
  const sc = SCENES[id], rid = EXPLORE_ENTRY[id];
  if (!sc) return;
  const base = sc.choices;
  sc.choices = s => {
    const list = (typeof base === 'function' ? base(s) : base.slice()).filter(Boolean);
    if (!G.regionsDone.includes(rid) && G.flags.currentRegion === rid && EXPLORE[rid].pois.some(p => !G.explored[p.id])) {
      list.push({ label: 'Explore the surroundings', icon: 'compass', hint: 'Optional spots, hidden places, risks — and the clock keeps ticking', effects: () => { G.flags.xp_back = id; }, next: 'xp_' + rid });
    }
    return list;
  };
});

/* Local knowledge helps with every check in the region. */
(function () {
  const co = Engine.checkOptions;
  Engine.checkOptions = function (ch) {
    const info = co.call(this, ch);
    const cur = G.flags.currentRegion;
    if (cur && EXPLORE[cur] && !G.regionsDone.includes(cur) && scoutBonus(cur)) {
      const m = { label: 'Local knowledge', value: scoutBonus(cur) };
      info.options.forEach(o => { o.parts = o.parts.concat([m]); o.total += m.value; });
    }
    return info;
  };
})();
