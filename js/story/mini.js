/* ===========================================================
   MINI-SCENES — a compact way to author side content.
   Used by exploration spots and quest-board jobs.

   An option is:
     { label, hint?, req?, cost?, once?, tag?,
       check: { skill, dc }          // then ok / bad are used
       fight: ['enemy_key', …]       // then ok / bad / flee are used
       ok:  outcome, bad: outcome }  // or a plain `ok` for no roll
   An outcome is:
     { text, gold, xp, rep:{faction:n}, mats:{iron:n}, pack:{potion:n},
       gear:'item_id' | 'uncommon'|'rare'|'epic', heal:'1d8'|'full',
       hurt:'1d6', focus:true, doom:n, clue:true, corrupt:n, cleanse:n,
       injure:true, flag:'x', chron:'…', tag:'kind', scout:true, next:'scene' }
   =========================================================== */

const Mini = {
  apply(o, ctx) {
    if (!o) return;
    if (o.gold) addGold(o.gold);
    if (o.xp) giveXp(o.xp);
    if (o.rep) Object.keys(o.rep).forEach(f => Rep.add(f, o.rep[f]));
    if (o.mats) Object.keys(o.mats).forEach(m => { G.mats[m] = (G.mats[m] || 0) + o.mats[m]; note(`+${o.mats[m]} ${MATERIALS[m].name}`, 'good'); });
    if (o.pack) Object.keys(o.pack).forEach(k => addPack(k, o.pack[k]));
    if (o.gear) { const id = ITEMS[o.gear] ? o.gear : Loot.pick(o.gear) || Loot.pick('uncommon'); if (id) { addGear(id); chronicle(`Found ${ITEMS[id].name}.`); } }
    if (o.take) Object.keys(o.take).forEach(k => { G.pack[k] = Math.max(0, (G.pack[k] || 0) - o.take[k]); if (!G.pack[k]) delete G.pack[k]; note(`−${o.take[k]} ${ITEMS[k].name}`, 'bad'); });
    if (o.heal) healAll(o.heal);
    if (o.hurt) hurtAll(o.hurt);
    if (o.focus) restoreFocus();
    if (o.doom) doom(o.doom);
    if (o.clue) G._miniClue = addClue();
    if (o.corrupt) corrupt(mostCorrupt() || G.party[0], o.corrupt);
    if (o.cleanse) cleanseAll(o.cleanse);
    if (o.injure) injure(Dice.pick(G.party));
    if (o.flag) flag(o.flag);
    if (o.chron) chronicle(o.chron);
    if (o.scout && ctx && ctx.region) flag('scout_' + ctx.region, (G.flags['scout_' + ctx.region] || 0) + (typeof o.scout === 'number' ? o.scout : 1));
    if (o.tag && typeof Companion !== 'undefined') Companion.tag(o.tag);
    if (ctx && ctx.mark) G.explored[ctx.mark] = true;
    if (ctx && ctx.onDone) ctx.onDone(o);
  },
  text(o, fallback) {
    if (!o) return fallback || '';
    const t = o.text;
    return (s, c) => {
      let body = '';
      if (typeof t === 'function') { const r = t(s, c); body = /^\s*<p/.test(r) ? r : (r ? P(r) : ''); } else body = Array.isArray(t) ? P(...t) : t ? P(t) : '';
      const clue = G._miniClue; G._miniClue = null;
      return body + (clue ? P(`<b>${clue}</b>`) : '');
    };
  },
  outcome(o, ctx, back) {
    o = o || {};
    return { effects: () => Mini.apply(o, ctx), text: Mini.text(o), next: o.next || back };
  },
  choice(opt, ctx, back) {
    const ch = { hollow: opt.hollow, label: opt.label, hint: opt.hint, req: opt.req, cost: opt.cost, once: opt.once, tag: opt.tag, icon: opt.icon, showLocked: opt.showLocked, noBypass: opt.noBypass };
    if (opt.check) {
      ch.check = { skill: opt.check.skill, dc: opt.check.dc, mods: opt.check.mods };
      ch.success = Mini.outcome(opt.ok, ctx, back);
      ch.failure = Mini.outcome(opt.bad, ctx, back);
    } else if (opt.fight) {
      ch.combat = {
        enemies: s => (typeof opt.fight === 'function' ? opt.fight(s) : opt.fight).map(k => (typeof k === 'string' ? foe(k) : k)),
        fleeDC: opt.fleeDC || 12,
        win: Mini.outcome(opt.ok, ctx, back),
        flee: Mini.outcome(opt.flee || { text: 'You break away, battered and empty-handed.', hurt: '1d4' }, ctx, back),
        lose: Mini.outcome(opt.bad || { text: 'You wake some time later, bruised and a little poorer.', gold: -Math.min(G.gold, 10) }, ctx, back),
      };
    } else {
      const o = opt.ok || {};
      ch.effects = () => Mini.apply(o, ctx);
      ch.text = Mini.text(o);
      ch.next = o.next || back;
    }
    return ch;
  },
  /* Register a scene made of options. */
  scene(id, def) {
    SCENES[id] = {
      title: def.title, art: def.art,
      first: def.first,
      text: def.text,
      choices: s => (typeof def.options === 'function' ? def.options(s) : def.options).filter(Boolean).map(o => Mini.choice(o, def.ctx || {}, def.back)),
    };
  },
};
