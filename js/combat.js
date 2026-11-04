/* ===========================================================
   Turn-based combat. Heroes act in order, then allies, then enemies.
   =========================================================== */

const Combat = {
  st: null,

  start(opts) {
    Combat.st = {
      enemies: opts.enemies,
      allyStrikes: opts.allyStrikes || [],
      intro: opts.intro,
      fleeable: opts.fleeable,
      fleeDC: opts.fleeDC,
      onEnd: opts.onEnd,
      round: 1,
      turn: 0,               // index into the living-hero order
      buffs: {},             // charId -> {attack}
      relentlessUsed: {},
      bossBurstUsedRound: 0,
      healedOnce: {},
      log: [],
      busy: false,
      pending: null,         // action waiting for a target
      over: false,
    };
    G.party.forEach(c => { Combat.st.buffs[c.id] = { attack: 0 }; });
    if (opts.intro) Combat.log(opts.intro, 'intro');
    Combat.skipDowned();
    UI.renderCombat();
  },

  log(text, kind = '') { Combat.st.log.push({ text, kind }); },

  livingEnemies() { return Combat.st.enemies.filter(e => e.hp > 0); },
  current() { return G.party[Combat.st.turn]; },

  skipDowned() {
    const st = Combat.st;
    while (st.turn < G.party.length && G.party[st.turn].hp <= 0) st.turn++;
  },

  /* ----- Player action entry points (called by UI) ----- */
  act(action, payload) {
    const st = Combat.st;
    if (st.busy || st.over) return;
    const hero = Combat.current();
    if (!hero) return;

    if (action === 'attack' || (action === 'ability' && ['enemy'].includes(ABILITIES[payload].target)) ||
      (action === 'ability' && ABILITIES[payload].target === 'ally' && G.party.length > 1) ||
      (action === 'item' && G.party.length > 1 && !ITEMS[payload].escape && !ITEMS[payload].focus)) {
      // needs a target
      const needs = action === 'attack' ? 'enemy' : action === 'item' ? 'ally' : ABILITIES[payload].target;
      if (needs === 'enemy' && Combat.livingEnemies().length === 1) {
        Combat.perform(hero, action, payload, Combat.livingEnemies()[0]);
        return;
      }
      st.pending = { action, payload, needs };
      UI.renderCombat();
      return;
    }
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

  perform(hero, action, payload, target) {
    const st = Combat.st;
    st.busy = true;
    let shownRoll = null;
    if (action === 'attack') shownRoll = Combat.weaponAttack(hero, target, {});
    else if (action === 'ability') shownRoll = Combat.useAbility(hero, payload, target);
    else if (action === 'item') Combat.useItem(hero, payload, target || hero);
    else if (action === 'flee') shownRoll = Combat.tryFlee(hero);
    else if (action === 'defend') { st.buffs[hero.id].defend = true; Combat.log(`${hero.name} raises their guard (+2 AC until their next turn).`); }

    UI.renderCombat(shownRoll);
    const after = () => {
      if (Combat.checkEnd()) return;
      st.turn++;
      Combat.skipDowned();
      if (st.turn >= G.party.length) Combat.endOfHeroes();
      else { st.busy = false; UI.renderCombat(); }
    };
    UI.delay(shownRoll ? 750 : 300, after);
  },

  /* ----- Resolution helpers ----- */
  rollD20(hero, advantage) {
    let r = Dice.d(20);
    if (r === 1 && hero && RACES[hero.race].lucky) r = Dice.d(20);
    if (advantage) r = Math.max(r, Dice.d(20));
    return r;
  },

  damageEnemy(e, amount, hero, radiant) {
    let dmg = amount;
    if (radiant && e.hollow) dmg *= 2;
    e.hp = Math.max(0, e.hp - dmg);
    return dmg;
  },

  weaponAttack(hero, target, opts) {
    const st = Combat.st;
    const fx = Character.fx(hero);
    const w = Character.weapon(hero);
    const bonus = Character.attackBonus(hero) + (st.buffs[hero.id].attack || 0) + (opts.toHit || 0);
    const roll = opts.autoHit ? null : Combat.rollD20(hero, opts.advantage);
    const crit = roll !== null && roll >= fx.crit;
    const hit = opts.autoHit || crit || (roll !== 1 && roll + bonus >= target.ac);
    const label = opts.label || 'attacks';
    if (!hit) {
      Combat.log(`${hero.name} ${label} ${target.name}: 🎲${roll} ${signed(bonus)} = ${roll + bonus} vs AC ${target.ac} — miss.`, 'miss');
      return roll;
    }
    let dmg = Dice.roll(w.dmg).total + Character.damageBonus(hero);
    if (fx.weaponDie) dmg += Dice.roll(fx.weaponDie).total;
    if (opts.extraDie) dmg += Dice.roll(opts.extraDie).total * (opts.radiant && target.hollow ? 2 : 1);
    if (opts.extraDie) dmg += RACES[hero.race].abilityDamage || 0;
    if (crit) dmg += Dice.roll(w.dmg).total + (opts.extraDie ? Dice.roll(opts.extraDie).total : 0);
    if (w.radiant && target.hollow) dmg += Dice.roll('1d6').total;
    dmg = Math.max(1, dmg);
    const dealt = Combat.damageEnemy(target, dmg, hero, false);
    const rollTxt = roll === null ? '' : `🎲${roll} ${signed(bonus)} = ${roll + bonus} vs AC ${target.ac} — `;
    Combat.log(`${hero.name} ${label} ${target.name}: ${rollTxt}${crit ? '<b>CRITICAL!</b> ' : 'hit '}for <b>${dealt}</b>.${target.hp <= 0 ? ` ${target.name} falls!` : ''}`, crit ? 'crit' : 'hit');
    return roll;
  },

  spellAttack(hero, target, ab) {
    const fx = Character.fx(hero);
    const bonus = Character.spellAttack(hero) + (Combat.st.buffs[hero.id].attack || 0);
    const roll = ab.autoHit ? null : Combat.rollD20(hero);
    const crit = roll !== null && roll >= fx.crit;
    const hit = ab.autoHit || crit || (roll !== 1 && roll + bonus >= target.ac);
    if (!hit) {
      Combat.log(`${hero.name}'s ${ab.name} misses ${target.name}: 🎲${roll} ${signed(bonus)} = ${roll + bonus} vs AC ${target.ac}.`, 'miss');
      return roll;
    }
    let dmg = Dice.roll(ab.die).total + Math.max(0, Character.spellMod(hero)) + fx.spellDamage + (RACES[hero.race].abilityDamage || 0);
    if (fx.spellDie) dmg += Dice.roll(fx.spellDie).total;
    if (crit) dmg += Dice.roll(ab.die).total;
    if (ab.element === 'fire' && target.fire) dmg = Math.floor(dmg / 2);
    dmg = Math.max(1, dmg);
    const dealt = Combat.damageEnemy(target, dmg, hero, ab.radiant);
    if (ab.debuff) target.debuff = 2;
    const rollTxt = roll === null ? '' : `🎲${roll} ${signed(bonus)} = ${roll + bonus} — `;
    Combat.log(`${hero.name}'s ${ab.name} strikes ${target.name}: ${rollTxt}${crit ? '<b>CRITICAL!</b> ' : ''}<b>${dealt}</b> damage${ab.debuff ? ' (and rattles it)' : ''}.${target.hp <= 0 ? ` ${target.name} falls!` : ''}`, crit ? 'crit' : 'hit');
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
        if (roll === null) roll = r;
      });
    } else if (ab.kind === 'spell') {
      const targets = ab.target === 'allEnemies' ? Combat.livingEnemies() : [target];
      targets.forEach(t => { const r = Combat.spellAttack(hero, t, ab); if (roll === null) roll = r; });
    } else if (ab.kind === 'heal') {
      const targets = ab.target === 'party' ? G.party : ab.target === 'self' ? [hero] : [target || hero];
      targets.forEach(t => {
        const wasDown = t.hp <= 0;
        const n = Character.heal(t, Combat.healAmount(hero, ab));
        if (ab.buff) st.buffs[t.id].attack += ab.buff.attack;
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
      Combat.log(`${hero.name} uses a ${it.name}${target !== hero ? ' on ' + target.name : ''}: ${wasDown ? target.name + ' is revived and ' : ''}+<b>${n}</b> HP.`, 'heal');
    } else if (it.focus) {
      hero.focus = Math.min(Character.maxFocus(hero), hero.focus + it.focus);
      Combat.log(`${hero.name} drinks a ${it.name} (+${it.focus} Focus).`, 'heal');
    } else if (it.escape) {
      if (Combat.st.fleeable) { Combat.log(`${hero.name} hurls a Smoke Bomb! The party escapes in the choking cloud.`, 'intro'); Combat.st.fled = true; }
      else Combat.log(`${hero.name} hurls a Smoke Bomb — but there is nowhere to run!`, 'miss');
    }
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
    else if (G.party.every(c => c.hp <= 0)) result = 'lose';
    if (!result) return false;
    st.over = true;
    st.busy = false;
    st.result = result;
    if (result === 'win') Combat.log('Victory!', 'crit');
    if (result === 'lose') Combat.log('The last of you falls…', 'miss');
    UI.renderCombat();
    return true;
  },

  finish() {
    const st = Combat.st;
    const res = st.result;
    Combat.st = null;
    UI.hideCombat();
    st.onEnd(res, { enemies: st.enemies, rounds: st.round });
  },

  endOfHeroes() {
    const st = Combat.st;
    const steps = [];
    // Wolf companions
    G.party.forEach(c => {
      if (c.hp > 0 && Character.fx(c).companion) steps.push(() => {
        const t = Dice.pick(Combat.livingEnemies());
        if (!t) return;
        const d = Combat.damageEnemy(t, Dice.roll('1d4+1').total + Math.floor(c.level / 3));
        Combat.log(`${c.name}'s wolf savages ${t.name} for <b>${d}</b>.${t.hp <= 0 ? ` ${t.name} falls!` : ''}`, 'hit');
      });
    });
    // Allied NPC strikes
    st.allyStrikes.forEach(a => steps.push(() => {
      const t = Dice.pick(Combat.livingEnemies());
      if (!t) return;
      const d = Combat.damageEnemy(t, Dice.roll(a.dmg).total, null, a.radiant);
      Combat.log(`${a.name} ${a.verb || 'strikes'} ${t.name} for <b>${d}</b>.${t.hp <= 0 ? ` ${t.name} falls!` : ''}`, 'ally');
    }));
    // Enemies
    Combat.livingEnemies().forEach(e => steps.push(() => { if (e.hp > 0) Combat.enemyTurn(e); }));

    const run = (i) => {
      if (Combat.checkEnd()) return;
      if (i >= steps.length) {
        st.round++;
        st.turn = 0;
        G.party.forEach(c => { if (st.buffs[c.id]) st.buffs[c.id].defend = false; });
        Combat.skipDowned();
        st.busy = false;
        UI.renderCombat();
        return;
      }
      steps[i]();
      UI.renderCombat();
      UI.delay(450, () => run(i + 1));
    };
    UI.delay(250, () => run(0));
  },

  hitHero(e, h, dmgExpr, label) {
    const st = Combat.st;
    const ac = Character.ac(h) + (st.buffs[h.id].defend ? 2 : 0);
    const atk = e.atk - (e.debuff || 0);
    const roll = Dice.d(20);
    const hit = roll === 20 || (roll !== 1 && roll + atk >= ac);
    if (!hit) {
      Combat.log(`${e.name} ${label || 'attacks'} ${h.name}: 🎲${roll} ${signed(atk)} = ${roll + atk} vs AC ${ac} — miss.`, 'emiss');
      return;
    }
    let dmg = Dice.roll(dmgExpr).total + (e.dmgBonus || 0);
    if (roll === 20) dmg += Dice.roll(dmgExpr).total;
    const fireRes = RACES[h.race].fireResist || (ITEMS[h.equip.armor] || {}).fireResist;
    if (e.fire && fireRes) dmg = Math.floor(dmg / 2);
    dmg = Math.max(1, dmg);
    h.hp -= dmg;
    let extra = '';
    if (h.hp <= 0) {
      if (RACES[h.race].relentless && !st.relentlessUsed[h.id]) {
        st.relentlessUsed[h.id] = true; h.hp = 1; extra = ` ${h.name} refuses to fall! (Relentless)`;
      } else { h.hp = 0; extra = ` <b>${h.name} is down!</b>`; }
    }
    Combat.log(`${e.name} ${label || 'hits'} ${h.name}${roll === 20 ? ' — CRITICAL' : ''} for <b>${dmg}</b>.${extra}`, 'ehit');
  },

  enemyTurn(e) {
    const st = Combat.st;
    const targets = G.party.filter(c => c.hp > 0);
    if (!targets.length) return;
    // Boss heal (once, under half HP)
    if (e.heals && !st.healedOnce[e.uid] && e.hp < e.maxHp / 2) {
      st.healedOnce[e.uid] = true;
      const n = Dice.roll('3d8').total + tier() * 2;
      e.hp = Math.min(e.maxHp, e.hp + n);
      Combat.log(`${e.name} drinks from the grey and knits her wounds closed (+${n} HP).`, 'ehit');
      return;
    }
    // Boss Hollow burst every third round
    if (e.boss && st.round % 3 === 0 && st.bossBurstUsedRound !== st.round) {
      st.bossBurstUsedRound = st.round;
      Combat.log(`${e.name} unleashes the Hollow! Grey fire washes over everyone.`, 'ehit');
      targets.forEach(h => Combat.hitHero(e, h, e.burst || '2d6', 'scorches'));
      e.debuff = 0;
      return;
    }
    if (e.sweep && targets.length > 1 && Dice.chance(0.4)) {
      Combat.log(`${e.name} sweeps its tail through the party!`, 'ehit');
      targets.forEach(h => Combat.hitHero(e, h, '1d8', 'sweeps'));
      e.debuff = 0;
      return;
    }
    // Prefer wounded or exposed heroes a little
    const h = Dice.chance(0.35) ? targets.slice().sort((a, b) => a.hp - b.hp)[0] : Dice.pick(targets);
    Combat.hitHero(e, h, e.dmg);
    e.debuff = 0;
  },
};
