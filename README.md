# 🪓 Florian's Axe

A choose-your-own-adventure fantasy RPG for **1–2 players**, playable in any browser. No install, no build step.

> A hundred years ago, the woodcutter Florian Thane sealed away the Hollow — a grey blight that drains colour, warmth and will from the world — then the Keepers broke his axe into three pieces and hid them. The seal is failing. Recover the fragments, reforge the axe, and stop the one who wants to use the Hollow for their own ends.

## Play

Open `index.html` in a browser — or serve the folder (`python3 -m http.server`) / enable GitHub Pages on the repo. The game autosaves after every scene.

## Features

- **6 races** (Human, Elf, Dwarf, Halfling, Half-Orc, Tiefling) with stat bonuses and traits — some unlock race-only story choices (a dwarf can swear on the clan-stone, an elf can read the barrow's inscriptions…).
- **6 classes** (Warrior, Rogue, Mage, Cleric, Ranger, Bard), each with its own proficient skills, starting gear, combat abilities and a **two-branch skill tree**. Level up to 8.
- **d20 skill checks**: d20 + stat modifier + proficiency + talents + gear (+ situational bonuses from earlier choices) vs a DC. Natural 20s and 1s. Spend Focus for an extra die.
- **Turn-based battles** with attacks, abilities, potions, defending and fleeing. Losing usually doesn't end the game — it changes the story.
- **Hot-seat 2-player** mode: choose who attempts each check, fight side by side, revive each other.
- **Gear & shop**: weapons, armor and trinkets that feed into every roll.

## A different tale every time — but always the same story

Each run randomizes:

- **The villain** — Morvane the Ashen, the Pale Abbess Seraphine, or Warlord Kharsk Ironjaw — each with their own motive, minions, lieutenant, stronghold and secrets.
- **The opening** (a burning village, an ambushed tavern, or a caravan job gone wrong).
- **Which 3 of 8 regions** hide the axe's fragments, which fragment is where, and a random twist for each (storm, a local guide, bounty hunters, grey fog).
- **The road encounters** between journeys.

Consequences carry forward: fragments you fail to recover make the villain stronger in the final battle (and can be won back); allies you help (or abandon) appear at the end; the lieutenant you spare or kill changes how the final gate goes; secrets you uncover let you try to end the war with words instead of steel; and the **Doom** meter — time and failure — darkens the world and the ending. The epilogue and chronicle recap what *your* choices did.

## More depth

- **Puzzles for the player**: riddles (typed answers), coded letters that reveal the villain's secrets, rune-dial code locks, a bell-chant memory test, a masquerade whodunit, and a push-your-luck dice game. Randomized each tale, always with a skill-roll hint and a way out.
- **Succeed at a cost** on narrow misses; in 2-player games, **help** each other or **vote** on contested decisions (and argue it out).
- **The Hollow tempts you** when you fail or fall. Corruption unlocks dark shortcuts and Grey Fire, changes how people treat you and how the axe responds, and opens a dark ending.
- **Tactical battles**: enemies telegraph their moves, you can interrupt, every battlefield has its own scene actions, enemies may surrender, bosses change phase.
- **Backgrounds with personal quests**, two-player **bonds**, and **camp conversations**.
- **A living villain** who raids, besieges Hearthmoor and takes captives while you travel — and taunts you in the campfire.
- **Lasting injuries**, and **Story / Adventurer / Hardcore / Mythic** difficulty.
- **The Keeper's Archive**: run history, achievements, legacy gifts — and heroes of past tales who return.
- **Presentation**: full-screen painted landscapes for every place (layered depth, fog, glowing light, animated embers, snow, fireflies and rain) that lose their colour as the Hollow spreads; frosted-glass story pages; a custom icon set; hero crests with ring gauges; enemy portraits with HP rings and damage numbers; a night-sky journey map; synthesized sound and ambient drones; paced narration.
- **Optional AI game master**: type your own action; Claude picks the skill and difficulty, narrates the result, and maps it onto the story so it stays coherent. Bring your own Anthropic API key (Settings ⚙️); it is stored only in your browser.

## New in this version

- **Narration with iOS voices**: the story can be read aloud using your device's own speech voices. On iPhone and iPad it prefers the best installed voice (Siri, Premium, then Enhanced, then well-known Apple voices such as Daniel, Serena and Ava). Paragraphs appear as they are spoken, quoted speech is voiced slightly differently, and the music dips under the voice. Turn it on with the speaker button in the top bar, or in Settings (where you can pick a voice, speed, and hear a sample). On iOS, download an Enhanced or Premium voice in *Settings → Accessibility → Spoken Content → Voices*.
- **A real soundtrack**: an original score, synthesized live in the browser (no audio files). Every place has its own theme: key, mode, tempo, chord progression and a written melody played by harp, lute, flute, horn, strings, choir, bells and drums through a hall reverb. Themes build over a four-pass cycle so a long scene never loops flatly. Battles switch to a tense battle cue, boss and lieutenant fights get a boss theme, and a battle ends with a victory swell (or a slow defeat toll) before the scene theme returns. Volume is adjustable in Settings.
- **A skill tree that changes what you can do**: every class has two five-step branches (new abilities and tougher stats), and every hero can also walk the **Wayfarer disciplines** (Diplomat, Scout, Scholar, Burglar, Brawn, Healer). There are far more nodes than skill points, so every hero ends up different. Starred nodes grant **Masteries**: when a check falls within a perk's reach, an extra option appears to win it outright for 1 Focus. Others are knacks: market discounts, healing after battles, free secrets when you set out, always being able to slip away. You can unlearn and choose again for gold.
- **A travelling companion** (Bran, Lirael, Pip or Brother Aldous): fights beside you, comments on places, and *approves or disapproves* of your choices (each has things they love and hate). Approval unlocks fireside conversations and stronger help in battle, and decides whether they give everything for you at the end — or turn on you at the gates.
- **Explorable regions**: from the start of each region you can explore four spots in any order, including a hidden one and a dangerous one, for supplies, materials, gear, standing and local knowledge that makes later checks easier. Every second detour costs a point of Doom.
- **Factions and reputation**: the Keepers, the Emberdeep dwarves, the Saltcliff smugglers, the Silverbough elves and the Order of the Hearth. Standing changes check bonuses, prices, who offers help in Hearthmoor, and the epilogue.
- **Better loot**: five rarities (common to relic), named gear with backstories, three item sets with two- and three-piece bonuses, crafting materials dropped by foes, and a smithy that tempers weapons and armour. Rarity and sets show on your hero's crest.
- **The Hearthmoor quest board**: up to three jobs after each journey, chosen to fit what has happened so far — an ally's request, refugees after a raid, your companion's errand, a merchant who senses your corruption.

## Code layout

```
index.html         page shell
css/style.css      styling
js/data.js         races, classes, skill trees, abilities, items, enemies, villains
js/character.js    dice and character rules
js/engine.js       game state, scene engine, checks, effects, save/load
js/combat.js       turn-based combat
js/ui.js           all rendering
js/meta.js         Keeper's Archive: run history, achievements, unlocks, legacy encounters
js/art.js          procedural full-screen SVG landscapes and the journey map
js/icons.js        line-icon set, hero crests and enemy portraits
js/sound.js        synthesized sound effects, settings
js/music.js        the generative soundtrack: themes, instruments, battle cues, stingers
js/voice.js        narration through on-device speech voices (prefers iOS system voices)
js/perks.js        class tree extensions, Wayfarer disciplines and Masteries
js/loot.js         rarities, relics, sets, materials and crafting
js/puzzles.js      puzzle generation and logic; js/puzzle-ui.js renders them
js/ai.js           optional AI game master (Anthropic SDK, loaded from a CDN)
js/story/*.js      prologue, hub, eight regions, interludes, villain moves, personal quests, finale
js/story/companion.js  companions, approval, barks and fireside talks, sacrifice and betrayal
js/story/factions.js   reputation and what it unlocks
js/story/explore.js   explorable region spots
js/story/board.js     the quest board
js/story/mini.js      a compact format for authoring side scenes
tools/test-systems.js  focused checks for perks, companion, factions, loot, exploration and the board
tools/simulate.js  headless playtest bot: `node tools/simulate.js 500` plays 500 random games,
                   reporting crashes, dead ends, unvisited scenes and win rates per encounter
```
