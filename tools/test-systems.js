/* Focused tests for the newer systems: perks, companion, factions, loot, exploration, quest board.
   Usage: node tools/test-systems.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const files = ['data.js', 'character.js', 'engine.js', 'combat.js', 'perks.js', 'loot.js', 'meta.js', 'puzzles.js', 'story/hub.js', 'story/prologue.js', 'story/mire.js', 'story/mines.js',
  'story/harbor.js', 'story/barrow.js', 'story/peak.js', 'story/orchard.js', 'story/court.js', 'story/wych.js', 'story/interludes.js', 'story/villain.js', 'story/personal.js', 'story/finale.js',
  'story/factions.js', 'story/companion.js', 'story/mini.js', 'story/explore.js', 'story/board.js'];
const mem = {};
const ctx = { console, Math, JSON, Date, setTimeout, localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } } };
vm.createContext(ctx);
const stub = `
let LAST = null, OUT = null;
const UI = { fast: true, delay(ms, fn) { fn(); }, error(m) { throw new Error(m); }, renderScene(sc) { LAST = sc; }, showOutcome(o) { OUT = o; }, showCheck(ch, info) { LAST = { check: ch, info }; }, showFork() {}, renderCombat() {}, hideCombat() {}, showPuzzle() {} };
let T_PASS = 0, T_FAIL = 0;
function ok(cond, msg) { if (cond) T_PASS++; else { T_FAIL++; console.log('  FAIL: ' + msg); } }
function fresh(cls = 'rogue', race = 'human') {
  const c = Character.create('Tester', race, cls); c.background = Object.keys(BACKGROUNDS)[0]; c.hp = Character.maxHp(c);
  Engine.newGame([c], { difficulty: 'normal' });
  G.regions = ['mire', 'mines', 'harbor']; G.fragLoc = { mire: 'head', mines: 'haft', harbor: 'rune' }; G.twists = { mire: 'calm', mines: 'calm', harbor: 'calm' };
  return c;
}
`;
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n;\n') + stub, ctx);

const tests = `
// ---------- skill tree ----------
(function () {
  const c = fresh('warrior');
  ok(CLASSES.warrior.tree.every(b => b.nodes.length === 5), 'class branches have 5 nodes');
  const nodes = Character.branches(c).reduce((a, b) => a + b.nodes.length, 0);
  ok(nodes >= 22, 'many more nodes than points (' + nodes + ')');
  ok(Character.canLearn(c, 'w_a1'), 'can learn tier 1 at level 1');
  ok(!Character.canLearn(c, 'w_a2'), 'tier 2 gated by level');
  ok(!Character.canLearn(c, 'x_dip1'), 'wayfarer gated by level');
  c.level = 6; c.skillPoints = 10;
  ok(Character.learn(c, 'w_a1') && Character.learn(c, 'w_a2'), 'can chain learn');
  ok(!Character.canLearn(c, 'w_a4'), 'cannot skip a step');
  ['w_a3', 'w_a4', 'w_a5'].forEach(id => Character.learn(c, id));
  ok(Character.fx(c).abilities.includes('reaping_blow'), 'new ability granted');
  ok(Character.fx(c).perks.includes('warlord'), 'perk granted by capstone');
  const pts = c.skillPoints; Character.respec(c);
  ok(c.tree.length === 0 && c.skillPoints === pts + 5, 'respec refunds');
})();

// ---------- masteries ----------
(function () {
  const c = fresh('rogue'); c.level = 6; c.skillPoints = 10;
  ['x_sco1', 'x_sco2'].forEach(id => Character.learn(c, id));
  G.flags.currentRegion = 'mire';
  Engine.go('mire_start');
  const labels = LAST.choices.map(x => x.label);
  const bypass = LAST.choices.find(x => x.perkBypass);
  ok(!!bypass, 'bypass option offered for survival DC 13 with Trailblazer');
  const f0 = c.focus;
  Engine.choose(bypass);
  ok(c.focus === f0 - 1, 'bypass costs 1 focus');
  ok(OUT && OUT.ctx && OUT.ctx.success && OUT.ctx.perk, 'bypass resolves as success');
  OUT.onContinue();
  ok(G.scene === 'mire_crossroads', 'bypass leads to the success scene (' + G.scene + ')');
  // no focus -> no bypass
  const c2 = fresh('rogue'); c2.level = 6; c2.skillPoints = 10; ['x_sco1', 'x_sco2'].forEach(id => Character.learn(c2, id)); c2.focus = 0;
  Engine.go('mire_start');
  ok(!LAST.choices.some(x => x.perkBypass), 'no bypass without focus');
})();

// ---------- companion ----------
(function () {
  const c = fresh('cleric');
  Engine.go('hub');
  ok(G.scene === 'comp_choose', 'companion offered on first hub visit (' + G.scene + ')');
  const pick = LAST.choices[0]; Engine.choose(pick); OUT && OUT.onContinue();
  ok(G.companion && G.companion.appr === 1, 'companion joined');
  const id = G.companion.id, comp = COMPANIONS[id];
  const t = comp.likes[0], before = G.companion.appr;
  Companion.tag(t, true); ok(G.companion.appr === before + 1, 'liked tag raises approval');
  Companion.tag(comp.dislikes[0], true); ok(G.companion.appr === before, 'disliked tag lowers approval');
  Companion.react({ label: 'Spare the prisoner and let them go' });
  Companion.react({ label: '[Hollow] Take the grey fire', hollow: true });
  G.companion.appr = -9; Engine.go('hub'); ok(G.scene === 'comp_leaves', 'estranged companion leaves');
})();

// ---------- factions ----------
(function () {
  fresh('mage');
  ok(Rep.get('dwarves') === 0, 'neutral start');
  addAlly('miners', 'Miners'); ok(Rep.get('dwarves') === 3, 'ally raises standing');
  flag('miners_died'); ok(Rep.get('dwarves') === 0, 'deaths lower standing');
  Rep.add('keepers', 9); ok(Rep.get('keepers') === 5, 'standing is capped');
  ok(Rep.mods('lore').length === 1 && Rep.mods('lore')[0].value === 2, 'revered gives +2 lore checks');
  ok(Rep.price({ slot: 'weapon' }) === 1, 'neutral dwarves, normal price');
  G.rep.dwarves = 5; ok(Rep.price({ slot: 'weapon' }) < 1, 'honoured dwarves discount weapons');
})();

// ---------- loot ----------
(function () {
  const c = fresh('warrior');
  ok(ITEMS.longsword.rarity === 'common' && ITEMS.florians_axe.rarity === 'relic', 'rarities assigned');
  const base = Character.attackBonus(c);
  c.equip.weapon = 'ember_axe'; c.equip.armor = 'ember_plate'; c.equip.trinket = 'ember_signet';
  ok(Loot.activeSets(c).length === 1 && Loot.activeSets(c)[0].n === 3, 'full set detected');
  const hp0 = Character.maxHp(c);
  c.equip.trinket = null; ok(Character.maxHp(c) < hp0, 'losing a piece removes the 3-piece bonus');
  c.temper = { weapon: 2 }; ok(Character.attackBonus(c) >= base + 2, 'tempering raises attack');
  G.mats = { iron: 5 }; G.gold = 100;
  const r = Loot.RECIPES.find(x => x.id === 'temper_a'); const cost = Loot.cost(r);
  ok(Loot.canPay(cost), 'can afford armour'); Loot.pay(cost); r.apply(c);
  ok(G.mats.iron === 3 && c.temper.armor === 1, 'recipe applied and paid');
  let found = 0; for (let i = 0; i < 40; i++) { const before = G.stash.length + G.party[0].equip.trinket; Loot.drop([foe({ name: 'Boss', hp: 10, ac: 10, atk: 3, dmg: '1d4', boss: true })]); }
  ok(G.stash.length + (G.party[0].equip.trinket ? 1 : 0) > 0, 'bosses drop gear');
})();

// ---------- exploration ----------
(function () {
  fresh('ranger');
  G.flags.currentRegion = 'mire';
  const entry = Engine.choicesFor(SCENES.mire_start).find(x => /Explore/.test(x.label));
  ok(!!entry, 'explore option on region start');
  Engine.go('xp_mire');
  const poiChoices = LAST.choices.filter(x => /^xpp_/.test(String(x.next)));
  ok(poiChoices.length === 3, 'three visible spots + one hidden (' + poiChoices.length + ')');
  ok(LAST.choices.some(x => /Search for hidden/.test(x.label)), 'search option available');
  const d0 = G.doom; Engine.go('xpp_mire_hut'); Engine.go('xp_mire'); Engine.go('xpp_mire_cairn');
  ok(G.doom === d0 + 1, 'every second detour costs doom (' + (G.doom - d0) + ')');
  // resolve a plain option and make sure it is marked explored
  Engine.go('xpp_mire_hut');
  const opt = LAST.choices.find(x => /Buy a hot meal/.test(x.label)); G.gold = 20; Engine.choose(opt);
  ok(G.explored.mire_hut === true, 'spot marked explored'); OUT && OUT.onContinue();
  ok(!LAST.choices.some(x => x.next === 'xpp_mire_hut'), 'explored spot no longer offered');
  ok(scoutBonus('mire') >= 1, 'local knowledge gained');
  const info = Engine.checkOptions({ check: { skill: 'survival', dc: 12 } });
  ok(info.options[0].parts.some(p => p.label === 'Local knowledge'), 'local knowledge shows in check');
  // every poi scene exists and every option resolves without throwing
  Object.keys(EXPLORE).forEach(rid => EXPLORE[rid].pois.forEach(p => { ok(!!SCENES['xpp_' + p.id], 'scene for ' + p.id); Engine.go('xpp_' + p.id); LAST.choices.forEach(ch => { ok(typeof ch.label === 'string', 'label ' + p.id); }); }));
})();

// ---------- quest board ----------
(function () {
  fresh('bard');
  Engine.go('hub_main');
  ok(G.board.posted.length >= 1, 'quests posted (' + G.board.posted.length + ')');
  ok(LAST.choices.some(x => /quest board/.test(x.label)), 'board listed in hub');
  Engine.go('board_main'); ok(LAST.choices.length >= 2, 'board lists jobs');
  G.companion = { id: 'bran', appr: 4 };
  QUESTS.forEach(q => { Engine.go('q_' + q.id); ok(LAST.choices.length === q.options.length + 1, 'quest ' + q.id + ' has options'); });
  const q = QUESTS.find(x => x.id === 'child'); G.board.done = [];
  Engine.go('q_child'); const o = LAST.choices[0]; Engine.choose(o);
  ok(!!LAST.check, 'child quest asks for a roll');
  const best = LAST.info.options[0]; const ctxr = Engine.rollCheck(LAST.check, best, false, LAST.info.dc); ctxr.success = true; Engine.completeCheck(LAST.check, ctxr);
  ok(G.board.done.includes('child'), 'quest marked done');
})();

// ---------- save upgrade ----------
(function () {
  fresh('rogue'); const keep = JSON.parse(JSON.stringify(G)); delete keep.rep; delete keep.mats; delete keep.board; delete keep.explored;
  localStorage.setItem(SAVE_KEY, JSON.stringify(keep));
  ok(Engine.load(), 'old save loads'); ok(G.rep && G.mats && G.board && G.explored, 'defaults restored');
})();

console.log(T_FAIL ? 'FAILED ' + T_FAIL + ' (passed ' + T_PASS + ')' : 'all ' + T_PASS + ' checks passed');
`;
try { vm.runInContext(tests, ctx); } catch (e) { console.log('EXCEPTION', e.stack); process.exitCode = 1; }
