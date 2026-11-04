/* ===========================================================
   Turn-based combat.
   Each round: enemies declare intents (shown on their cards) →
   heroes act (attack, abilities, items, interrupt, scene actions,
   defend, flee) → companions & allies strike → enemies carry out
   their intents → statuses tick.
   Downed heroes may be tempted by the Hollow. Beaten humanoid
   enemies may surrender. Bosses change phase as they weaken.
   =========================================================== */

const STATUS_INFO = {
  stunned: { icon: '💫', name: 'Stunned', desc: 'Loses its next action' },
  bleeding: { icon: '🩸', name: 'Bleeding', desc: 'Takes 1d4 each round' },
  rattled: { icon: '😖', name: 'Rattled', desc: '−2 to its next attack' },
  exposed: { icon: '🎯', name: 'Exposed', desc: 'Attacks against it get +2' },
  burning: { icon: '🔥', name: 'Burning', desc: 'Takes 1d6 each round' },
  chilled: { icon: '❄️', name: 'Chilled', desc: '−1 AC' },
};

const Combat = {
  st: null,

  start(opts) {
    Combat.st = {
      enemies: opts.enemies,
      allyStrikes: opts.allyStrikes || [],
      actions: (opts.actions || []).map((a, i) => Object.assign({ key: 'a' + i, used: false }, a)),
      intro: opts.intro,
      fleeable: opts.fleeable,
      fleeDC: opts.fleeDC,
      noSurrender: opts.noSurrender,
      noTempt: opts.noTempt,
      onEnd: opts.onEnd,
      round: 1,
      turn: 0,
      buffs: {},             // charId -> {attack, defend, status:{}}
      relentlessUsed: {},
      tempted: {},           // charId -> offered already this battle
      temptFor: null,        // hero currently being tempted
      log: [],
      busy: false,
      pending: null,
      over: false,
      surrendered: null,
    };
    G.party.forEach(c => { Combat.st.buffs[c.id] = { attack: (opts.heroBuffs || {})[c.id] || 0, status: {} }; });
    opts.enemies.forEach(e => { e.status = e.status || {}; e.phase = e.phase || 1; });
    if (opts.intro) Combat.log(opts.intro, 'intro');
    Combat.planIntents();
    Combat.advanceTo(0);
    UI.renderCombat();
  },

  log(text, kind = '') { Combat.st.log.push({ text, kind }); },
  livingEnemies() { return Combat.st.enemies.filter(e => e.hp > 0); },
  livingHeroes() { return G.party.filter(c => c.hp > 0); },
  current() { return G.party[Combat.st.turn]; },

  canTempt(h) {
    const st = Combat.st;
    return !st.noTempt && !st.tempted[h.id] && (h.corruption || 0) < 10;
  },

  /* Move to hero index i, skipping the downed — unless the Hollow wants a word with them. */
  advanceTo(i) {
    const st = Combat.st;
    st.turn = i;
    st.temptFor = null;
    while (st.turn < G.party.length) {
      const h = G.party[st.turn];
      if (h.hp > 0) break;
      if (Combat.canTempt(h)) { st.temptFor = h; break; }
      st.turn++;
    }
  },

  nextHero() {
    const st = Combat.st;
    if (Combat.checkEnd()) return;
    Combat.advanceTo(st.turn + 1);
    if (st.turn >= G.party.length) Combat.endOfHeroes();
    else { st.busy = false; UI.renderCombat(); }
  },

  /* ----- The Hollow's offer to a fallen hero ----- */
  answerTemptation(accept) {
    const st = Combat.st;
    const h = st.temptFor;
    if (!h) return;
    st.tempted[h.id] = true;
    st.temptFor = null;
    if (accept) {
      const max = Character.maxHp(h);
      h.hp = Math.ceil(max / 2);
      const n = st.enemies.some(e => e.boss) ? 3 : 2;
      G._notes = [];
      corrupt(h, n);
      G._notes = [];
      chronicle(`${h.name} rose from death's door on the Hollow's breath.`);
      Combat.log(`${h.name} opens grey eyes and stands. Ash drifts from their wounds as they close. (+${n} Corruption)`, 'hollow');
      UI.renderCombat();
      return; // they now take their turn
    }
    flag('refusals', (G.flags.refusals || 0) + 1);
    Combat.log(`${h.name} refuses the grey voice, and lies still.`, 'miss');
    Combat.nextHero();
  },

  /* ----- Player actions ----- */
  act(action, payload) {
    const st = Combat.st;
    if (st.busy || st.over || st.temptFor) return;
    const hero = Combat.current();
    if (!hero) return;
    let needs = null;
    if (action === 'attack') needs = 'enemy';
    else if (action === 'interrupt') needs = 'interruptible';
    else if (action === 'ability') {
      const t = ABILITIES[payload].target;
      if (t === 'enemy') needs = 'enemy';
      else if (t === 'ally' && G.party.length > 1) needs = 'ally';
    } else if (action === 'item' && G.party.length > 1 && ITEMS[payload].heal) needs = 'ally';
    else if (action === 'scene') {
      const a = st.actions.find(x => x.key === payload);
      if (a && a.target === 'enemy') needs = 'enemy';
    }
    if (needs === 'enemy' && Combat.livingEnemies().length === 1) { Combat.perform(hero, action, payload, Combat.livingEnemies()[0]); return; }
    if (needs === 'interruptible') {
      const list = Combat.interruptible();
      if (list.length === 1) { Combat.perform(hero, action, payload, list[0]); return; }
    }
    if (needs) { st.pending = { action, payload, needs }; UI.renderCombat(); return; }
    Combat.perform(hero, action, payload, null);
  },

  pickTarget(target) {
    const st = Combat.st;
    if (!st.pending || st.busy) return;
    const p = st.pending;
    st.pending = null;
    Combat.perform(Combat.current(), p.action, p.payload, target);
  },

  cancelTarget() { Combat.st.pending = null; UI.renderCombat(); },

  interruptible() { return Combat.livingEnemies().filter(e => e.intent && ['heavy', 'burst', 'heal', 'summon'].includes(e.intent.type)); },

  perform(hero, action, payload, target) {
    const st = Combat.st;
    st.busy = true;
    let shownRoll = null;
    if (action === 'attack') shownRoll = Combat.weaponAttack(hero, target, {}).roll;
    else if (action === 'ability') shownRoll = Combat.useAbility(hero, payload, target);
    else if (action === 'item') Combat.useItem(hero, payload, target || hero);
    else if (action === 'flee') shownRoll = Combat.tryFlee(hero);
    else if (action === 'interrupt') shownRoll = Combat.interrupt(hero, target);
    else if (action === 'scene') shownRoll = Combat.sceneAction(hero, payload, target);
    else if (action === 'defend') { st.buffs[hero.id].defend = true; Combat.log(`${hero.name} raises their guard (+3 AC until their next turn).`); }
    Combat.afterHeroAction();
    UI.renderCombat(shownRoll);
    UI.delay(shownRoll ? 750 : 300, () => Combat.nextHero());
  },

  /* Boss phases and surrender are checked after every hero action. */
  afterHeroAction() {
    const st = Combat.st;
    st.enemies.forEach(e => Combat.checkPhase(e));
    if (!st.noSurrender && !st.surrenderChecked) {
      const live = Combat.livingEnemies();
      const dead = st.enemies.length - live.length;
      if (live.length && dead > 0 && live.every(e => e.canSurrender && !e.boss)) {
        const hpFrac = live.reduce((a, e) => a + e.hp, 0) / live.reduce((a, e) => a + e.maxHp, 0);
        if (hpFrac <= 0.4) {
          st.surrenderChecked = true;
          if (Dice.chance(0.6)) {
            st.surrendered = live.map(e => e.name);
            live.forEach(e => { e.hp = 0; e.yielded = true; });
            Combat.log(`${live.length === 1 ? 'The last of them throws down their weapon' : 'The survivors throw down their weapons'} and falls to their knees. "Mercy! We yield!"`, 'intro');
          }
        }
      }
    }
  },

  /* ----- Resolution helpers ----- */
  rollD20(hero, advantage) {
    let r = Dice.d(20);
    if (r === 1 && hero && RACES[hero.race].lucky) r = Dice.d(20);
    if (advantage) r = Math.max(r, Dice.d(20));
    return r;
  },

  enemyAC(e) { return e.ac - (e.status.chilled ? 1 : 0); },
  exposedBonus(e) { return e.status && e.status.exposed ? 2 : 0; },

  damageEnemy(e, amount, hero, radiant) {
    let dmg = amount;
    if (radiant && e.hollow) dmg *= 2;
    e.hp = Math.max(0, e.hp - dmg);
    return dmg;
  },

  fell(t) { return t.hp <= 0 ? ` ${t.name} falls!` : ''; },

  weaponAttack(hero, target, opts) {
    const st = Combat.st;
    const fx = Character.fx(hero);
    const w = Character.weapon(hero);
    const bonus = Character.attackBonus(hero) + (st.buffs[hero.id].attack || 0) + (opts.toHit || 0) + Combat.exposedBonus(target);
    const roll = opts.autoHit ? null : Combat.rollD20(hero, opts.advantage);
    const crit = roll !== null && roll >= fx.crit;
    const ac = Combat.enemyAC(target);
    const hit = opts.autoHit || crit || (roll !== 1 && roll + bonus >= ac);
    const label = opts.label || 'attacks';
    if (!hit) {
      Combat.log(`${hero.name} ${label} ${target.name}: 🎲${roll} ${signed(bonus)} = ${roll + bonus} vs AC ${ac} — miss.`, 'miss');
      return { roll, hit: false };
    }
    let dmg = Dice.roll(w.dmg).total + Character.damageBonus(hero);
    if (fx.weaponDie) dmg += Dice.roll(fx.weaponDie).total;
    if (opts.extraDie) dmg += Dice.roll(opts.extraDie).total * (opts.radiant && target.hollow ? 2 : 1);
    if (opts.extraDie) dmg += RACES[hero.race].abilityDamage || 0;
    if (crit) dmg += Dice.roll(w.dmg).total + (opts.extraDie ? Dice.roll(opts.extraDie).total : 0);
    if (w.radiant && target.hollow) dmg += Dice.roll('1d6').total;
    if (opts.half) dmg = Math.ceil(dmg / 2);
    dmg = Math.max(1, dmg);
    const dealt = Combat.damageEnemy(target, dmg, hero, false);
    let extra = '';
    if (crit && target.hp > 0) {
      // Critical hits leave a mark
      if (hero.cls === 'rogue' || hero.cls === 'ranger') { target.status.bleeding = 3; extra = ' It bleeds.'; }
      else if (hero.cls === 'warrior' || hero.cls === 'cleric') { target.status.stunned = 1; extra = ' It reels, stunned!'; }
      else { target.status.exposed = 2; extra = ' Its guard is broken.'; }
    }
    const rollTxt = roll === null ? '' : `🎲${roll} ${signed(bonus)} = ${roll + bonus} vs AC ${ac} — `;
    Combat.log(`${hero.name} ${label} ${target.name}: ${rollTxt}${crit ? '<b>CRITICAL!</b> ' : 'hit '}for <b>${dealt}</b>.${Combat.fell(target)}${extra}`, crit ? 'crit' : 'hit');
    return { roll, hit: true, crit };
  },

  spellAttack(hero, target, ab) {
    const fx = Character.fx(hero);
    const bonus = Character.spellAttack(hero) + (Combat.st.buffs[hero.id].attack || 0) + Combat.exposedBonus(target);
    const roll = ab.autoHit ? null : Combat.rollD20(hero);
    const crit = roll !== null && roll >= fx.crit;
    const ac = Combat.enemyAC(target);
    const hit = ab.autoHit || crit || (roll !== 1 && roll + bonus >= ac);
    if (!hit) {
      Combat.log(`${hero.name}'s ${ab.name} misses ${target.name}: 🎲${roll} ${signed(bonus)} = ${roll + bonus} vs AC ${ac}.`, 'miss');
      return roll;
    }
    let dmg = Dice.roll(ab.die).total + Math.max(0, Character.spellMod(hero)) + fx.spellDamage + (RACES[hero.race].abilityDamage || 0);
    if (ab.corrupting) dmg = Dice.roll(ab.die).total + (hero.corruption || 0) + (hero.background === 'touched' && pq('touched', 'embraced') ? 4 : 0);
    if (fx.spellDie && !ab.corrupting) dmg += Dice.roll(fx.spellDie).total;
    if (crit) dmg += Dice.roll(ab.die).total;
    if (ab.element === 'fire' && target.fire) dmg = Math.floor(dmg / 2);
    dmg = Math.max(1, dmg);
    const dealt = Combat.damageEnemy(target, dmg, hero, ab.radiant);
    if (ab.debuff) target.status.rattled = 1;
    if (ab.element === 'fire' && !target.fire && target.hp > 0 && Dice.chance(0.3)) target.status.burning = 2;
    const rollTxt = roll === null ? '' : `🎲${roll} ${signed(bonus)} = ${roll + bonus} — `;
    Combat.log(`${hero.name}'s ${ab.name} strikes ${target.name}: ${rollTxt}${crit ? '<b>CRITICAL!</b> ' : ''}<b>${dealt}</b> damage${ab.debuff ? ' (and rattles it)' : ''}${target.status.burning === 2 ? ' — it catches fire' : ''}.${Combat.fell(target)}`, crit ? 'crit' : ab.corrupting ? 'hollow' : 'hit');
    return roll;
  },

  healAmount(hero, ab) {
    const fx = Character.fx(hero);
    let n = Dice.roll(ab.heal).total;
    if (ab.addStat) n += Math.max(0, Character.spellMod(hero));
    if (ab.addLevel) n += hero.level;
    if (fx.healBonus) n += hero.level;
    return Math.max(1, n);
  },

  useAbility(hero, id, target) {
    const st = Combat.st;
    const ab = ABILITIES[id];
    if (hero.focus < ab.cost) return null;
    hero.focus -= ab.cost;
    let roll = null;
    if (ab.kind === 'weapon') {
      const targets = ab.target === 'allEnemies' ? Combat.livingEnemies() : [target];
      targets.forEach(t => {
        const r = Combat.weaponAttack(hero, t, { extraDie: ab.extraDie, toHit: ab.toHit, advantage: ab.advantage, autoHit: ab.autoHit, radiant: ab.radiant, label: `uses ${ab.name} on` });
        if (roll === null) roll = r.roll;
      });
    } else if (ab.kind === 'spell') {
      const targets = ab.target === 'allEnemies' ? Combat.livingEnemies() : [target];
      targets.forEach(t => { const r = Combat.spellAttack(hero, t, ab); if (roll === null) roll = r; });
      if (ab.corrupting) {
        G._notes = []; corrupt(hero, 1); G._notes = [];
        Combat.log(`The grey fire leaves something behind in ${hero.name}. (+1 Corruption, now ${hero.corruption})`, 'hollow');
      }
    } else if (ab.kind === 'heal') {
      const targets = ab.target === 'party' ? G.party : ab.target === 'self' ? [hero] : [target || hero];
      targets.forEach(t => {
        const wasDown = t.hp <= 0;
        const n = Character.heal(t, Combat.healAmount(hero, ab));
        if (ab.buff) st.buffs[t.id].attack += ab.buff.attack;
        if (st.buffs[t.id].status.bleeding) st.buffs[t.id].status.bleeding = 0;
        Combat.log(`${hero.name} uses ${ab.name}: ${t.name} ${wasDown ? 'is pulled back to their feet and ' : ''}recovers <b>${n}</b> HP${ab.buff ? ' and fights with new fire (+2 attack)' : ''}.`, 'heal');
      });
    } else if (ab.kind === 'buff') {
      G.party.forEach(t => { st.buffs[t.id].attack += ab.buff.attack; });
      Combat.log(`${hero.name} calls on the old light: the party is Blessed (+${ab.buff.attack} to attacks).`, 'heal');
    }
    return roll;
  },

  useItem(hero, id, target) {
    const it = ITEMS[id];
    if (!G.pack[id]) return;
    G.pack[id]--;
    if (G.pack[id] <= 0) delete G.pack[id];
    if (it.heal) {
      const wasDown = target.hp <= 0;
      const n = Character.heal(target, Dice.roll(it.heal).total);
      Combat.st.buffs[target.id].status.bleeding = 0;
      Combat.log(`${hero.name} uses a ${it.name}${target !== hero ? ' on ' + target.name : ''}: ${wasDown ? target.name + ' is revived and ' : ''}+<b>${n}</b> HP.`, 'heal');
      if (it.cleanse && target.corruption) { G._notes = []; corrupt(target, -it.cleanse); G._notes = []; Combat.log(`The grey drains out of ${target.name}'s veins.`, 'heal'); }
    } else if (it.focus) {
      hero.focus = Math.min(Character.maxFocus(hero), hero.focus + it.focus);
      Combat.log(`${hero.name} drinks a ${it.name} (+${it.focus} Focus).`, 'heal');
    } else if (it.escape) {
      if (Combat.st.fleeable) { Combat.log(`${hero.name} hurls a Smoke Bomb! The party escapes in the choking cloud.`, 'intro'); Combat.st.fled = true; }
      else Combat.log(`${hero.name} hurls a Smoke Bomb — but there is nowhere to run!`, 'miss');
    }
  },

  /* Break an enemy's wind-up: attack at −2 for half damage; any hit cancels the intent and stuns. */
  interrupt(hero, target) {
    const r = Combat.weaponAttack(hero, target, { toHit: -2, half: true, label: 'lunges to interrupt' });
    if (r.hit && target.hp > 0) {
      Combat.log(`${target.name}'s ${Combat.intentName(target.intent)} is broken! It staggers.`, 'crit');
      target.intent = { type: 'stunned' };
      target.status.stunned = 0;
    }
    return r.roll;
  },

  /* Scene-specific actions defined by the battle (drop the chandelier, flood the forge…) */
  sceneAction(hero, key, target) {
    const st = Combat.st;
    const a = st.actions.find(x => x.key === key);
    if (!a || a.used) return null;
    if (a.once !== false) a.used = true;
    let roll = null, ok = true;
    if (a.skill) {
      const b = Character.checkBonus(hero, a.skill).total;
      roll = Combat.rollD20(hero);
      ok = roll === 20 || (roll !== 1 && roll + b >= a.dc);
      Combat.log(`${hero.name}: ${a.label} — 🎲${roll} ${signed(b)} = ${roll + b} vs DC ${a.dc}: ${ok ? 'success!' : 'failure.'}`, ok ? 'crit' : 'miss');
    }
    const fn = ok ? a.success : a.failure;
    if (fn) fn(hero, target);
    return roll;
  },

  /* Helpers for scene actions */
  hitAll(expr, why, radiant) {
    Combat.livingEnemies().forEach(e => {
      const d = Combat.damageEnemy(e, Dice.roll(expr).total, null, radiant);
      Combat.log(`${why || 'The blow'} hits ${e.name} for <b>${d}</b>.${Combat.fell(e)}`, 'hit');
    });
  },
  hitOne(e, expr, why) {
    if (!e || e.hp <= 0) return;
    const d = Combat.damageEnemy(e, Dice.roll(expr).total);
    Combat.log(`${why || 'It'} hits ${e.name} for <b>${d}</b>.${Combat.fell(e)}`, 'hit');
  },
  statusAll(s, n) { Combat.livingEnemies().forEach(e => { e.status[s] = n; }); },
  hurtHero(h, expr, why) {
    const d = Dice.roll(expr).total;
    h.hp = Math.max(0, h.hp - d);
    Combat.log(`${why || 'It'} hurts ${h.name} for <b>${d}</b>.${h.hp <= 0 ? ` <b>${h.name} is down!</b>` : ''}`, 'ehit');
  },

  tryFlee(hero) {
    const st = Combat.st;
    const b = Character.checkBonus(hero, 'acrobatics').total;
    const roll = Combat.rollD20(hero);
    const ok = roll === 20 || (roll !== 1 && roll + b >= st.fleeDC);
    Combat.log(`${hero.name} tries to break away: 🎲${roll} ${signed(b)} = ${roll + b} vs DC ${st.fleeDC} — ${ok ? 'the party escapes!' : 'cut off!'}`, ok ? 'intro' : 'miss');
    if (ok) st.fled = true;
    return roll;
  },

  checkEnd() {
    const st = Combat.st;
    if (st.over) return true;
    let result = null;
    if (st.fled) result = 'flee';
    else if (Combat.livingEnemies().length === 0) result = 'win';
    else if (G.party.every(c => c.hp <= 0) && !G.party.some(c => Combat.canTempt(c))) result = 'lose';
    if (!result) return false;
    st.over = true;
    st.busy = false;
    st.temptFor = null;
    st.result = result;
    if (result === 'win') Combat.log(st.surrendered ? 'The fight is over.' : 'Victory!', 'crit');
    if (result === 'lose') Combat.log('The last of you falls…', 'miss');
    UI.renderCombat();
    return true;
  },

  finish() {
    const st = Combat.st;
    const res = st.result;
    Combat.st = null;
    UI.hideCombat();
    st.onEnd(res, { enemies: st.enemies, rounds: st.round, surrendered: st.surrendered });
  },

  /* ----- Boss phases ----- */
  checkPhase(e) {
    if (!e.phases || e.hp <= 0) return;
    const frac = e.hp / e.maxHp;
    const st = Combat.st;
    if (e.phase === 1 && frac <= 0.66) {
      e.phase = 2;
      const p = e.phases[0];
      Combat.log(p.line, 'boss');
      if (p.summon) {
        const n = p.summon;
        for (let i = 0; i < n; i++) {
          const m = minion();
          m.status = {}; m.phase = 1; m.intent = { type: 'attack', target: Dice.pick(Combat.livingHeroes() || G.party).id };
          st.enemies.push(m);
        }
        Combat.log(`${n === 1 ? 'A' : n} ${V().minion}${n === 1 ? '' : 's'} answer${n === 1 ? 's' : ''} the call!`, 'ehit');
      }
      if (p.atk) e.atk += p.atk;
    } else if (e.phase === 2 && frac <= 0.33 && e.phases[1]) {
      e.phase = 3;
      const p = e.phases[1];
      Combat.log(p.line, 'boss');
      if (p.atk) e.atk += p.atk;
      if (p.desperate) e.desperate = true;
    }
  },

  /* ----- Enemy intents ----- */
  intentName(it) {
    if (!it) return '';
    return { attack: 'attack', heavy: 'heavy blow', burst: 'Hollow burst', sweep: 'sweeping strike', heal: 'healing', stunned: 'stunned', summon: 'call for aid', guard: 'guard' }[it.type] || it.type;
  },

  planIntents() {
    const st = Combat.st;
    const heroes = Combat.livingHeroes();
    const pickTarget = () => {
      if (!heroes.length) return null;
      return (Dice.chance(0.35) ? heroes.slice().sort((a, b) => a.hp - b.hp)[0] : Dice.pick(heroes)).id;
    };
    Combat.livingEnemies().forEach(e => {
      if (e.status.stunned) { e.intent = { type: 'stunned' }; return; }
      let type = 'attack';
      if (e.boss) {
        if ((e.desperate && st.round % 2 === 0) || st.round % 3 === 0) type = 'burst';
        else if (e.heals && !e.healed && e.hp < e.maxHp / 2) type = 'heal';
        else if (Dice.chance(0.3)) type = 'heavy';
      } else if (e.sweep && heroes.length > 1 && Dice.chance(0.35)) type = 'sweep';
      else if (e.big && Dice.chance(0.35)) type = 'heavy';
      else if (!e.big && Dice.chance(0.12)) type = 'heavy';
      e.intent = { type, target: ['attack', 'heavy'].includes(type) ? pickTarget() : null };
    });
  },

  endOfHeroes() {
    const st = Combat.st;
    const steps = [];
    // Statuses on enemies
    steps.push(() => {
      Combat.livingEnemies().forEach(e => {
        if (e.status.bleeding) { const d = Combat.damageEnemy(e, Dice.roll('1d4').total + tier()); e.status.bleeding--; Combat.log(`${e.name} bleeds for ${d}.${Combat.fell(e)}`, 'hit'); }
        if (e.status.burning) { const d = Combat.damageEnemy(e, Dice.roll('1d6').total); e.status.burning--; Combat.log(`${e.name} burns for ${d}.${Combat.fell(e)}`, 'hit'); }
      });
    });
    G.party.forEach(c => {
      if (c.hp > 0 && Character.fx(c).companion) steps.push(() => {
        const t = Dice.pick(Combat.livingEnemies());
        if (!t) return;
        const d = Combat.damageEnemy(t, Dice.roll('1d4+1').total + Math.floor(c.level / 3));
        Combat.log(`${c.name}'s wolf savages ${t.name} for <b>${d}</b>.${Combat.fell(t)}`, 'hit');
      });
    });
    st.allyStrikes.forEach(a => steps.push(() => {
      const t = Dice.pick(Combat.livingEnemies());
      if (!t) return;
      const d = Combat.damageEnemy(t, Dice.roll(a.dmg).total, null, a.radiant);
      Combat.log(`${a.name} ${a.verb || 'strikes'} ${t.name} for <b>${d}</b>.${Combat.fell(t)}`, 'ally');
    }));
    steps.push(() => st.enemies.forEach(e => Combat.checkPhase(e)));
    Combat.livingEnemies().forEach(e => steps.push(() => { if (e.hp > 0) Combat.enemyTurn(e); }));
    // Statuses on heroes
    steps.push(() => {
      G.party.forEach(h => {
        const s = st.buffs[h.id].status;
        if (h.hp > 0 && s.bleeding) { const d = Dice.roll('1d4').total; h.hp = Math.max(0, h.hp - d); s.bleeding--; Combat.log(`${h.name} bleeds for ${d}.${h.hp <= 0 ? ` <b>${h.name} is down!</b>` : ''}`, 'ehit'); }
        if (s.chilled) s.chilled--;
      });
    });

    const run = (i) => {
      if (Combat.checkEnd()) return;
      if (i >= steps.length) {
        st.round++;
        G.party.forEach(c => { if (st.buffs[c.id]) st.buffs[c.id].defend = false; });
        Combat.livingEnemies().forEach(e => { if (e.status.exposed) e.status.exposed--; if (e.status.chilled) e.status.chilled--; });
        Combat.planIntents();
        Combat.advanceTo(0);
        if (st.turn >= G.party.length) { if (!Combat.checkEnd()) Combat.endOfHeroes(); return; }
        st.busy = false;
        UI.renderCombat();
        return;
      }
      steps[i]();
      UI.renderCombat();
      UI.delay(420, () => run(i + 1));
    };
    UI.delay(250, () => run(0));
  },

  hitHero(e, h, dmgExpr, label, mult = 1) {
    const st = Combat.st;
    const hs = st.buffs[h.id];
    const ac = Character.ac(h) + (hs.defend ? 3 : 0) - (hs.status.chilled ? 1 : 0);
    const atk = e.atk - (e.status.rattled ? 2 : 0);
    const roll = Dice.d(20);
    const hit = roll === 20 || (roll !== 1 && roll + atk >= ac);
    if (!hit) {
      Combat.log(`${e.name} ${label || 'attacks'} ${h.name}: 🎲${roll} ${signed(atk)} = ${roll + atk} vs AC ${ac} — miss.`, 'emiss');
      return;
    }
    let dmg = (Dice.roll(dmgExpr).total + (e.dmgBonus || 0)) * mult;
    if (roll === 20) dmg += Dice.roll(dmgExpr).total;
    const fireRes = RACES[h.race].fireResist || (ITEMS[h.equip.armor] || {}).fireResist;
    if (e.fire && fireRes) dmg = Math.floor(dmg / 2);
    dmg = Math.max(1, dmg);
    h.hp -= dmg;
    let extra = '';
    if (e.bleeds && Dice.chance(0.35)) { hs.status.bleeding = 2; extra += ` ${h.name} is bleeding.`; }
    if (e.chills && Dice.chance(0.5)) { hs.status.chilled = 2; extra += ` Frost bites into ${h.name}'s armour.`; }
    if (h.hp <= 0) {
      if (RACES[h.race].relentless && !st.relentlessUsed[h.id]) {
        st.relentlessUsed[h.id] = true; h.hp = 1; extra += ` ${h.name} refuses to fall! (Relentless)`;
      } else { h.hp = 0; extra += ` <b>${h.name} is down!</b>`; }
    }
    Combat.log(`${e.name} ${label || 'hits'} ${h.name}${roll === 20 ? ' — CRITICAL' : ''} for <b>${dmg}</b>.${extra}`, 'ehit');
  },

  enemyTurn(e) {
    const st = Combat.st;
    const targets = Combat.livingHeroes();
    const it = e.intent || { type: 'attack' };
    if (it.type === 'stunned') {
      e.status.stunned = 0;
      Combat.log(`${e.name} is staggered and loses its turn.`, 'miss');
      return;
    }
    if (!targets.length) return;
    const tgt = () => targets.find(h => h.id === it.target) || Dice.pick(targets);
    if (it.type === 'heal') {
      e.healed = true;
      const n = Dice.roll('3d8').total + tier() * 2;
      e.hp = Math.min(e.maxHp, e.hp + n);
      Combat.log(`${e.name} drinks from the grey and knits their wounds closed (+${n} HP).`, 'ehit');
    } else if (it.type === 'burst') {
      Combat.log(`${e.name} unleashes the Hollow! Grey fire washes over everyone.`, 'ehit');
      targets.forEach(h => Combat.hitHero(e, h, e.burst || '2d6', 'scorches'));
    } else if (it.type === 'sweep') {
      Combat.log(`${e.name} sweeps through the whole party!`, 'ehit');
      targets.forEach(h => Combat.hitHero(e, h, '1d8', 'sweeps'));
    } else if (it.type === 'heavy') {
      Combat.hitHero(e, tgt(), e.dmg, 'brings a crushing blow down on', 2);
    } else {
      Combat.hitHero(e, tgt(), e.dmg);
    }
    if (e.status.rattled) e.status.rattled = 0;
  },
};
