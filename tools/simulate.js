/* Headless playtest bot: plays many random games to find crashes,
   dead ends and balance problems.  Usage: node tools/simulate.js [games] [players 0|1|2] [story|normal|hardcore] */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const files = ['data.js', 'character.js', 'engine.js', 'combat.js', 'meta.js', 'story/hub.js', 'story/prologue.js', 'story/mire.js', 'story/mines.js',
  'story/harbor.js', 'story/barrow.js', 'story/peak.js', 'story/orchard.js', 'story/court.js', 'story/wych.js', 'story/interludes.js', 'story/villain.js', 'story/personal.js', 'story/finale.js'];

const N = parseInt(process.argv[2] || '300', 10);
const PLAYERS = parseInt(process.argv[3] || '0', 10); // 0 = mixed
const DIFF = process.argv[4] || 'normal';

const ctx = { console, Math, JSON, Date, setTimeout, localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; })() };
vm.createContext(ctx);
const stub = `
const Q = []; const ENC = {}; const STATS_F = { forks: 0 }; let BOT_HOLLOW = 0.3;
let SIM = { ending: null, scenes: 0, errors: [], combats: 0, combatLoss: 0, path: [], seen: {} };
const UI = {
  fast: true,
  delay(ms, fn) { Q.push(fn); },
  error(m) { SIM.errors.push(m); SIM.ending = 'error'; },
  renderScene(sc) {
    SIM.scenes++; SIM.seen[sc.id] = 1; SIM.path.push(sc.id);
    if (SIM.scenes > 600) { SIM.errors.push('too many scenes: ' + SIM.path.slice(-15).join(' > ')); SIM.ending = 'error'; return; }
    if (/undefined|NaN|\\[object/.test(sc.text + sc.title)) SIM.errors.push('bad text in ' + sc.id + ': ' + (sc.text + sc.title).match(/.{0,40}(undefined|NaN|\\[object).{0,20}/)[0]);
    if (sc.ending) { SIM.ending = sc.ending + ':' + sc.id; return; }
    botManage();
    const open = sc.choices.filter(c => !c.locked);
    if (!open.length) { SIM.errors.push('dead end at ' + sc.id); SIM.ending = 'error'; return; }
    let pick;
    const travel = open.filter(c => /Travel|March/.test(c.label));
    if (sc.id === 'hub') {
      const rest = open.find(c => /Rest/.test(c.label));
      const hurtParty = G.party.some(c => c.hp < Character.maxHp(c) * 0.6);
      if (rest && hurtParty && Math.random() < 0.8) pick = rest;
      else if (G.gold >= 30 && Math.random() < 0.5) { botShop(); pick = travel[0] || open[0]; }
      else pick = travel.length && Math.random() < 0.85 ? travel[Math.floor(Math.random() * travel.length)] : open[Math.floor(Math.random() * open.length)];
    } else pick = open[Math.floor(Math.random() * open.length)];
    if (sc.vote && Math.random() < 0.7) { const b2 = open[Math.floor(Math.random() * open.length)]; Q.push(() => Engine.vote(pick, b2)); return; }
    Q.push(() => {
      if (pick.ui === 'shop') { botShop(); Engine.go(G.scene); return; }
      if (pick.ui === 'newgame') { SIM.ending = 'newgame?'; return; }
      Engine.choose(pick);
    });
  },
  showCheck(ch, info) {
    const best = info.options.slice().sort((a, b) => b.total - a.total)[0];
    Q.push(() => { const c = Engine.rollCheck(ch, best, Math.random() < 0.3, info.dc); Engine.finishCheck(ch, c); });
  },
  showFork(f) {
    STATS_F.forks++;
    const opts = f.options; let pick;
    const hollow = opts.filter(o => o.hollow), clean = opts.filter(o => !o.hollow);
    pick = (hollow.length && Math.random() < BOT_HOLLOW) ? hollow[0] : clean[Math.floor(Math.random() * clean.length)];
    Q.push(() => pick.run());
  },
  showOutcome(o) {
    if (o.text && /undefined|NaN|\\[object/.test(o.text)) SIM.errors.push('bad outcome text at ' + G.scene + ': ' + o.text.match(/.{0,40}(undefined|NaN|\\[object).{0,20}/)[0]);
    Q.push(o.onContinue);
  },
  renderCombat() {
    const st = Combat.st; if (!st) return;
    if (st.over) { if (!st._queued) { st._queued = 1; SIM.combats++; if (st.result === 'lose') SIM.combatLoss++; ENC[G.scene] = ENC[G.scene] || [0,0]; ENC[G.scene][1]++; if (st.result === 'win') ENC[G.scene][0]++; Q.push(() => Combat.finish()); } return; }
    if (st.busy || st._thinking) return;
    st._thinking = 1;
    Q.push(() => { st._thinking = 0; botCombat(); });
  },
  hideCombat() {},
};
function botManage() {
  G.party.forEach(c => {
    let guard = 0;
    while (c.skillPoints > 0 && guard++ < 10) {
      const opts = CLASSES[c.cls].tree.flatMap(b => b.nodes).filter(n => Character.canLearn(c, n.id));
      if (!opts.length) break;
      Character.learn(c, opts[Math.floor(Math.random() * opts.length)].id);
    }
  });
  G.stash.slice().forEach(id => {
    const it = ITEMS[id];
    const c = G.party[Math.floor(Math.random() * G.party.length)];
    if (it.slot === 'weapon' && (id === 'florians_axe' || (it.stat === Character.weapon(c).stat))) { G.stash.splice(G.stash.indexOf(id), 1); G.stash.push(c.equip.weapon); c.equip.weapon = id; }
    else if (it.slot === 'trinket' && !c.equip.trinket) { G.stash.splice(G.stash.indexOf(id), 1); c.equip.trinket = id; }
    else if (it.slot === 'armor' && it.ac + Math.min(mod(c.stats.dex), it.maxDex) > Character.ac(c) - Character.fx(c).ac) { G.stash.splice(G.stash.indexOf(id), 1); G.stash.push(c.equip.armor); c.equip.armor = id; }
  });
  G.party.forEach(c => { c.hp = Math.min(c.hp, Character.maxHp(c)); });
}
function UI_price() { return Math.round(12 * (has('market_burned') ? 1.5 : 1) * (has('hearth_defended') ? 0.8 : 1)); }
function botShop() {
  while (G.gold >= UI_price() && (G.pack.potion || 0) < 4) { G.gold -= UI_price(); G.pack.potion = (G.pack.potion || 0) + 1; }
}
function botCombat() {
  const st = Combat.st; if (!st || st.over || st.busy) return;
  if (st.temptFor) { Combat.answerTemptation(Math.random() < BOT_HOLLOW + 0.2); return; }
  const h = Combat.current(); if (!h) return;
  if (st.pending && st.pending.needs === 'interruptible') { Combat.pickTarget(Combat.interruptible()[0]); return; }
  if (st.pending) { const p = st.pending; if (p.needs === 'enemy') Combat.pickTarget(Combat.livingEnemies().sort((a,b)=>a.hp-b.hp)[0]); else Combat.pickTarget(G.party.slice().sort((a,b)=>a.hp/Character.maxHp(a)-b.hp/Character.maxHp(b))[0]); return; }
  const low = G.party.find(c => c.hp > 0 ? c.hp < Character.maxHp(c) * 0.35 : true);
  if (low && G.pack.potion) { Combat.act('item', 'potion'); return; }
  const scene = st.actions.filter(a => !a.used);
  if (scene.length && Math.random() < 0.3) { Combat.act('scene', scene[0].key); return; }
  if (Combat.interruptible().length && Math.random() < 0.4) { Combat.act('interrupt'); return; }
  const abs = Character.fx(h).abilities.filter(a => h.focus >= ABILITIES[a].cost && !(ABILITIES[a].kind === 'heal' && !low));
  if (abs.length && Math.random() < 0.6) { Combat.act('ability', abs[Math.floor(Math.random() * abs.length)]); return; }
  Combat.act('attack');
}
function runOne(nPlayers) {
  SIM = { ending: null, scenes: 0, errors: [], combats: 0, combatLoss: 0, path: [], seen: {} };
  Q.length = 0;
  const races = Object.keys(RACES), classes = Object.keys(CLASSES);
  const chars = [];
  const bgs = Dice.shuffle(Object.keys(BACKGROUNDS));
  for (let i = 0; i < nPlayers; i++) { const c = Character.create('Bot' + i, Dice.pick(races), Dice.pick(classes)); c.background = bgs[i]; c.corruption = BACKGROUNDS[bgs[i]].corruption || 0; c.hp = Character.maxHp(c); chars.push(c); }
  try {
    Engine.newGame(chars, { difficulty: DIFF, bondType: Dice.pick(Object.keys(BONDS)), gift: Dice.pick(Meta.unlocked().gifts) });
    let guard = 0;
    while (Q.length && !SIM.ending && guard++ < 200000) Q.shift()();
    if (!SIM.ending) SIM.errors.push('stalled at ' + G.scene + ' combat=' + !!Combat.st);
  } catch (e) { SIM.errors.push('EXC at ' + (G && G.scene) + ': ' + e.stack.split('\\n').slice(0, 3).join(' | ')); }
  return { ending: SIM.ending, errors: SIM.errors, villain: G && G.villain, doom: G && G.doom, frags: G && fragCount('party'), lvl: G && G.party[0].level,
    clues: G && G.clues.length, corr: G && maxCorruption(), inj: G && injuryCount(), allies: G && G.allies.length, combats: SIM.combats, losses: SIM.combatLoss, seen: SIM.seen, cls: chars.map(c=>c.cls).join('+'), np: nPlayers };
}
`;
ctx.DIFF = DIFF;
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n;\n') + stub, ctx);

const results = [];
for (let i = 0; i < N; i++) results.push(vm.runInContext(`runOne(${PLAYERS || (i % 2) + 1})`, ctx));
const errs = {};
results.forEach(r => r.errors.forEach(e => { errs[e] = (errs[e] || 0) + 1; }));
const endings = {};
results.forEach(r => { endings[r.ending] = (endings[r.ending] || 0) + 1; });
const avg = k => (results.reduce((a, r) => a + (r[k] || 0), 0) / results.length).toFixed(2);
console.log('games', N, 'endings', endings);
console.log('avg corruption', avg('corr'), 'injuries', avg('inj'));
console.log('avg doom', avg('doom'), 'frags(pre-boss)', avg('frags'), 'level', avg('lvl'), 'clues', avg('clues'), 'allies', avg('allies'), 'combats', avg('combats'), 'losses', avg('losses'));
['1', '2'].forEach(np => { const rs = results.filter(r => String(r.np) === np); if (!rs.length) return; const w = rs.filter(r => /victory/.test(r.ending)).length; console.log(np + 'p win rate', (w / rs.length * 100).toFixed(1) + '%', 'n=' + rs.length); });
const byCls = {}; results.filter(r => r.np === 1).forEach(r => { byCls[r.cls] = byCls[r.cls] || [0, 0]; byCls[r.cls][1]++; if (/victory/.test(r.ending)) byCls[r.cls][0]++; });
console.log('solo by class', Object.entries(byCls).map(([k, v]) => `${k} ${(v[0] / v[1] * 100).toFixed(0)}%`).join(', '));
const allScenes = Object.keys(vm.runInContext('SCENES', ctx));
const seen = {}; results.forEach(r => Object.assign(seen, r.seen));
const unseen = allScenes.filter(s => !seen[s] && !vm.runInContext(`!!SCENES['${s}'].route`, ctx));
console.log('unvisited scenes', unseen.join(', ') || 'none');
const enc = vm.runInContext('ENC', ctx); console.log('encounter win%', Object.entries(enc).map(([k,v]) => `${k} ${(v[0]/v[1]*100).toFixed(0)}% (${v[1]})`).join(', '));
console.log('achievements', Object.keys(vm.runInContext('Meta.load().achievements', ctx)).length + '/' + Object.keys(vm.runInContext('ACHIEVEMENTS', ctx)).length);
console.log('errors', Object.keys(errs).length ? errs : 'none');
