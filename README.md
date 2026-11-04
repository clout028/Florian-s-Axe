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
- **Which 3 of 5 regions** hide the axe's fragments, and which fragment is where.
- **The road encounters** between journeys.

Consequences carry forward: fragments you fail to recover make the villain stronger in the final battle (and can be won back); allies you help (or abandon) appear at the end; the lieutenant you spare or kill changes how the final gate goes; secrets you uncover let you try to end the war with words instead of steel; and the **Doom** meter — time and failure — darkens the world and the ending. The epilogue and chronicle recap what *your* choices did.

## Code layout

```
index.html         page shell
css/style.css      styling
js/data.js         races, classes, skill trees, abilities, items, enemies, villains
js/character.js    dice and character rules
js/engine.js       game state, scene engine, checks, effects, save/load
js/combat.js       turn-based combat
js/ui.js           all rendering
js/story/*.js      prologue, hub, five regions, interludes, finale
tools/simulate.js  headless playtest bot: `node tools/simulate.js 500` plays 500 random games,
                   reporting crashes, dead ends, unvisited scenes and win rates per encounter
```
