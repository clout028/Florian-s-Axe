/* ===========================================================
   PROLOGUE — one of three opening hooks is chosen each run.
   Every hook ends with the party holding the Keeper's Map, having
   met the villain's lieutenant, and learning the shape of the quest.
   =========================================================== */

const LORE = () => P(
  `<i>A hundred years ago the Hollow rose from beneath the world — a grey blight that drained colour, warmth and will from everything it touched. Fields went to ash. Whole towns stood silent, their people walking husks.</i>`,
  `<i>Florian Thane, a woodcutter from Thornbury, ended it. With an axe of dwarven steel, elven heartwood and a binding rune of the old gods, he cut out the Hollow's heart and sealed it under the earth. Then the Keepers broke the axe in three and hid the pieces, so that no one could ever turn it to other uses.</i>`,
  `<i>The seal has held for a century. It is failing now.</i>`
);

/* ---------------- Hook 1: Thornbury burns ---------------- */
SCENES.pro_thornbury = {
  title: 'The Centennial Feast',
  first: s => { flag('keeper', 'Edda'); flag('keeper_he', 'she'); flag('hook', 'thornbury'); },
  text: s => LORE() + P(
    `Thornbury, Florian's home village, is celebrating a hundred years since the sealing. Lanterns hang from every eave, and old Keeper Edda — Florian's great-granddaughter — has just finished telling the story by the bonfire, as she does every year.`,
    `Then the screaming starts. Figures bearing ${V().sigil} pour out of the treeline with torches. The longhall's thatch catches first, and it's full of children who were sent in to sleep. Across the green you see shadows forcing their way into Edda's cottage.`,
    `You have a heartbeat to decide.`
  ),
  choices: s => [
    {
      label: 'Run for the burning longhall and get the children out',
      check: { skill: 'athletics', dc: 12 },
      success: {
        effects: (s, c) => { flag('thornbury_saved'); hurt(c.char, '1d4'); },
        text: (s, c) => P(`${c.char.name} shoulders through the smoking doors and passes children out one after another until the roof groans. Every one of them gets out. The village will remember this.`,
          `But by the time you reach Edda's cottage, the door hangs from one hinge.`),
        next: 'pro_thornbury_edda',
      },
      failure: {
        effects: (s, c) => { flag('thornbury_partial'); hurt(c.char, '2d4'); },
        text: (s, c) => P(`The smoke is blinding. ${c.char.name} drags out who they can before a beam crashes down, scorching them. Most of the children live. Not all.`,
          `Coughing, you stagger toward Edda's cottage. The door hangs from one hinge.`),
        next: 'pro_thornbury_edda',
      },
    },
    {
      label: 'Charge the attackers at Edda\'s cottage',
      combat: {
        intro: s => `Two ${V().minionPlural} turn from the cottage door, blades drawn.`,
        enemies: s => [minion(), minion()],
        fleeable: false,
        win: {
          effects: () => { flag('keeper_alive'); flag('thornbury_burned'); },
          text: s => P(`The last cultist falls. Inside, Edda is alive, clutching a leather tube to her chest. "They came for the Map," she gasps. Behind you, the longhall roof collapses in a gout of sparks. The villagers got some of the children out. You will hear the names of the ones they didn't for a long time.`),
          next: 'pro_rival',
        },
        lose: {
          effects: () => { flag('thornbury_burned'); },
          text: s => P(`You are beaten down in the mud. When your vision clears, the attackers have moved inside. You crawl to the doorway and find Edda on the floor, still breathing, still clutching a leather tube they somehow missed.`),
          next: 'pro_thornbury_edda',
        },
      },
    },
  ],
};

SCENES.pro_thornbury_edda = {
  title: 'Edda\'s Cottage',
  text: s => P(
    `Edda lies by the hearth, a dagger wound in her side. The cultists have torn the cottage apart, but she still holds the leather tube under her body.`,
    `"The Keeper's Map," she whispers, pressing it into your hands. "They didn't find it. Don't let them." Her breath rattles.`
  ),
  choices: s => [
    {
      label: 'Try to stop the bleeding',
      check: { skill: 'medicine', dc: 13 },
      success: { effects: () => flag('keeper_alive'), text: (s, c) => P(`${c.char.name} packs the wound and binds it tight. Edda's colour returns. "Stubborn," she mutters. "Like Florian." She'll live.`), next: 'pro_rival' },
      failure: { effects: () => flag('keeper_dead'), text: P(`You try. The blood keeps coming. Edda squeezes your hand, smiles, and is gone. The Map is yours now — and so is her promise.`), next: 'pro_rival' },
    },
  ],
};

/* ---------------- Hook 2: The Split Log tavern ---------------- */
SCENES.pro_tavern = {
  title: 'The Split Log',
  first: s => { flag('keeper', 'Aldric'); flag('keeper_he', 'he'); flag('hook', 'tavern'); },
  text: s => LORE() + P(
    `Rain hammers the shutters of the Split Log, a roadside tavern at the edge of the Thornwood. You're drying off by the fire when the door bangs open and an old man stumbles in, an arrow in his shoulder, a leather tube clutched in his fist.`,
    `"Keeper Aldric," he gasps, catching your eye — the only armed ${both('stranger', 'strangers')} in the room. "They're right behind me. ${V().minions}. The Map — they mustn't — "`,
    `Hoofbeats outside. Torches through the rain.`
  ),
  choices: s => [
    {
      label: 'Stand between Aldric and the door, weapons ready',
      combat: {
        intro: s => `${cap(numWord(solo() ? 2 : 3))} ${V().minionPlural} kick through the door, shaking rain from their hoods.`,
        enemies: s => solo() ? [minion(), minion()] : [minion(), minion(), minion()],
        fleeable: false,
        win: { effects: () => flag('keeper_alive'), text: P(`The last of them crashes through a table and doesn't rise. The tavern-keeper peeks out from behind the bar. Aldric, pale but alive, presses the leather tube into your hands. "You'll do," he says.`), next: 'pro_rival' },
        lose: { effects: () => flag('keeper_dead'), text: P(`You go down under a flurry of blows. The cultists drag Aldric outside — but when you come to, the leather tube is lying under your own body, where he must have pushed it as you fell. They took him. They didn't get the Map.`), next: 'pro_rival' },
      },
    },
    {
      label: 'Hide Aldric in the cellar and bluff the hunters',
      check: { skill: 'deception', dc: 13 },
      success: { effects: () => flag('keeper_alive'), text: (s, c) => P(`When the cultists burst in, ${c.char.name} is leaning on the bar, pointing helpfully up the north road: "Old man with an arrow in him? Went that way, cursing." They leave at a run. Aldric climbs out of the cellar, wide-eyed. "Quick thinking," he says, and gives you the tube.`), next: 'pro_rival' },
      failure: {
        effects: (s, c) => hurt(c.char, '1d6'),
        text: (s, c) => P(`The leader notices the trail of blood running to the cellar hatch. "Liar," she says, and slashes ${c.char.name} across the arm. The fight is on.`),
        next: 'pro_tavern_fight',
      },
    },
    {
      label: 'Hustle Aldric out the back into the storm',
      check: { skill: 'stealth', dc: 13 },
      success: { effects: () => { flag('keeper_alive'); flag('tavern_burned'); }, text: P(`You slip into the rain with Aldric between you. Behind you, the cultists find the tavern empty and, in their fury, set it ablaze. No one was inside — but the Split Log is gone. Aldric presses the leather tube into your hands. "I'm sorry," he says, watching it burn.`), next: 'pro_rival' },
      failure: { text: P(`A lantern swings around the corner of the stable — you're spotted. The cultists close in.`), next: 'pro_tavern_fight' },
    },
  ],
};

SCENES.pro_tavern_fight = {
  title: 'Blood on the Floorboards',
  text: P(`There's no talking your way out now. Aldric slumps against the wall behind you.`),
  choices: s => [{
    label: 'Fight!',
    combat: {
      enemies: s => [minion(), minion()],
      fleeable: false,
      win: { effects: () => flag('keeper_alive'), text: P(`The cultists lie still. Aldric, grey-faced, gives you the leather tube with trembling hands. "Take it. I'm too old to run any more."`), next: 'pro_rival' },
      lose: { effects: () => flag('keeper_dead'), text: P(`When you wake, Aldric is dead beside you — but his hand is still locked around the leather tube. The cultists never thought to pry it loose.`), next: 'pro_rival' },
    },
  }],
};

/* ---------------- Hook 3: The caravan ---------------- */
SCENES.pro_caravan = {
  title: 'Gallows Ford',
  first: s => { flag('keeper', 'Ilsa'); flag('keeper_he', 'she'); flag('hook', 'caravan'); },
  text: s => LORE() + P(
    `You took the job for the coin: guarding a merchant caravan bound for the market town of Hearthmoor. The caravan-master, a sharp-eyed woman named Ilsa, pays well and asks few questions — and keeps one iron-bound chest under her own seat.`,
    `On the third day the road dips toward Gallows Ford, where the old hanging-tree leans over the water. The birds have gone quiet. Ilsa catches your eye and touches the chest. "If anything happens," she murmurs, "this matters more than the wagons."`
  ),
  choices: s => [
    {
      label: 'Scout ahead before the wagons reach the ford',
      check: { skill: 'perception', dc: 13 },
      success: {
        effects: () => { flag('keeper_alive'); flag('caravan_saved'); },
        text: (s, c) => P(`${c.char.name} spots the glint of a blade in the reeds and the fresh-cut rope strung across the ford. You lead the wagons upstream to the shallows instead. The ambushers burst from cover too late and too far away — you meet them on open ground and drive them off.`,
          `That night, Ilsa opens the chest. "I'm a Keeper," she admits, unrolling a leather map. "And you've just earned the right to know why."`),
        next: 'pro_rival',
      },
      failure: {
        effects: (s, c) => hurt(c.char, '1d6'),
        text: (s, c) => P(`An arrow takes ${c.char.name} in the shoulder before you see anything at all. ${V().minionPlural} rise from the reeds, howling.`),
        next: 'pro_caravan_fight',
      },
    },
    {
      label: 'Stay close to Ilsa and her chest',
      text: s => P(`You fall in beside Ilsa's seat. When the ambush comes — arrows from the reeds, ${V().minionPlural} splashing out of the shallows — you're exactly where you need to be.`),
      next: 'pro_caravan_fight',
    },
  ],
};

SCENES.pro_caravan_fight = {
  title: 'Ambush at the Ford',
  text: s => P(`Wagons slew sideways. Drivers dive for cover. The attackers go straight for Ilsa's wagon.`),
  choices: s => [{
    label: 'Defend the wagon',
    combat: {
      enemies: s => solo() ? [minion(), minion()] : [minion(), minion(), minion()],
      fleeable: false,
      win: { effects: () => flag('keeper_alive'), text: P(`The ambushers break and flee. Ilsa climbs down from the wagon, a bloody knife in her own hand, and opens the chest. "I'm a Keeper," she says, unrolling a leather map. "You've earned the truth."`), next: 'pro_rival' },
      lose: { effects: () => { flag('keeper_dead'); flag('caravan_lost'); }, text: P(`You come to in the shallows. The wagons are burning. Ilsa lies dead across her chest, but she must have fought like a demon: they never got it open. Inside, wrapped in oilcloth, is a leather map.`), next: 'pro_rival' },
    },
  }],
};

/* ---------------- Shared: the lieutenant appears ---------------- */
SCENES.pro_rival = {
  title: s => `${V().lieutenant.name} ${V().lieutenant.title}`,
  text: s => {
    const l = V().lieutenant;
    return P(
      `You have barely caught your breath when a figure steps out of the smoke and rain: ${l.desc}.`,
      `"${l.name}," ${l.he} says, almost politely. "I serve ${V().name}. You have something that belongs to my master." A gloved hand extends. "Give me the Map, and you walk away."`
    );
  },
  choices: s => [
    {
      label: 'Refuse — and meet their blade',
      check: { skill: 'athletics', dc: 14 },
      success: {
        effects: () => { G.rival.met = 1; G.rival.beaten = 1; G.rival.scarred = true; },
        text: (s, c) => P(`Steel rings on steel. ${c.char.name} slips inside ${V().lieutenant.name}'s guard and lays open ${V().lieutenant.his} cheek. The lieutenant staggers back, touches the blood, and laughs — a little too high. "You'll regret marking me." Then ${V().lieutenant.he} is gone into the night.`),
        next: 'pro_lore',
      },
      failure: {
        effects: (s, c) => { G.rival.met = 1; G.rival.lost = 1; hurt(c.char, '2d4'); },
        text: (s, c) => P(`${V().lieutenant.name} is terrifyingly fast. ${c.char.name} is knocked flat in a single exchange, a boot on their chest. But shouts rise — locals with pitchforks and lanterns. The lieutenant steps back. "Keep it, then. I'll take it from your corpse later." And ${V().lieutenant.he} is gone.`),
        next: 'pro_lore',
      },
    },
    {
      label: 'Stare them down and call their bluff',
      check: { skill: 'intimidation', dc: 14 },
      success: {
        effects: () => { G.rival.met = 1; G.rival.beaten = 1; },
        text: (s, c) => P(`${c.char.name} steps forward instead of back. "Take it, then." For a long moment ${V().lieutenant.name} measures you — then looks at the bodies of ${V().lieutenant.his} followers and decides the odds are wrong tonight. "Another time." ${cap(V().lieutenant.he)} goes.`),
        next: 'pro_lore',
      },
      failure: {
        effects: (s, c) => { G.rival.met = 1; G.rival.lost = 1; hurt(c.char, '1d6'); },
        text: (s, c) => P(`${V().lieutenant.name} smiles and hits ${c.char.name} so hard their ears ring. "Brave words." Only the arrival of a crowd of angry locals makes ${V().lieutenant.him} withdraw. "Another time," ${V().lieutenant.he} promises.`),
        next: 'pro_lore',
      },
    },
  ],
};

/* ---------------- Shared: the quest is explained ---------------- */
SCENES.pro_lore = {
  title: 'The Keeper\'s Map',
  first: s => {
    addGear('keeper_amulet');
    chronicle(`The quest began: ${s.flags.keeper} the Keeper ${has('keeper_alive') ? 'survived and' : 'died, but'} entrusted you with the Keeper's Map.`);
    if (has('keeper_alive')) addAlly('keeper', `Keeper ${s.flags.keeper}`);
  },
  text: s => {
    const k = s.flags.keeper, v = V();
    const regionNames = G.regions.map(r => `<b>${REGIONS[r].name}</b>`);
    const intro = has('keeper_alive')
      ? `By lamplight, Keeper ${k} unrolls the Map with shaking hands. "I'll tell you what I know, and then I'll pray you're quicker than they are."`
      : `There is no one left to explain it, but ${k}'s journal is tucked into the map-case. You read it by firelight, and the shape of the thing becomes clear.`;
    return P(
      intro,
      `The enemy is <b>${v.name}</b>: ${v.look}. ${v.motive}`,
      `The Map shows three marks where the Keepers hid the pieces of Florian's Axe: ${regionNames.slice(0, 2).join(', ')} and ${regionNames[2]}. ${v.short} has the same rumours, and more followers. Every fragment ${v.pronoun} takes makes ${v.object} stronger. Every day you delay, the Hollow spreads.`,
      has('keeper_alive')
        ? `"Go to Hearthmoor first," ${k} says, pressing an amulet into your palm — the Keeper's sigil, warm from ${G.flags.keeper_he === 'he' ? 'his' : 'her'} skin. "I'll follow and meet you there. Whatever you recover, bring it back. If all three pieces are ever together again, the axe can be reforged."`
        : `In the case you also find ${k}'s amulet, the Keeper's sigil. The last journal entry reads: <i>"Hearthmoor. The smithy there still has the old anvil. If all three pieces come together again, the axe can be reforged."</i>`
    );
  },
  choices: [{ label: 'Set out for Hearthmoor', next: 'hub' }],
};
