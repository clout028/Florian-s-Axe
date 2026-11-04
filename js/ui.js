/* ===========================================================
   UI — all DOM rendering. The engine calls into UI; UI calls
   back into Engine/Combat on player input.
   =========================================================== */

const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, html = '') => {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  if (html) e.innerHTML = html;
  return e;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const UI = {
  fast: false,
  delay(ms, fn) { if (UI.fast) fn(); else setTimeout(fn, ms); },

  /* ---------------- Screens ---------------- */
  show(id) {
    ['#title-screen', '#create-screen', '#game-screen'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    window.scrollTo(0, 0);
  },

  title() {
    UI.show('#title-screen');
    $('#continue-btn').classList.toggle('hidden', !Engine.hasSave());
  },

  error(msg) { $('#story-choices').innerHTML = `<div class="notice bad">${esc(msg)}</div>`; },

  /* ---------------- Header & party ---------------- */
  renderHeader() {
    if (!G) return;
    $('#gold').textContent = G.gold;
    const pct = (G.doom / 10) * 100;
    $('#doom-fill').style.width = pct + '%';
    $('#doom-val').textContent = G.doom;
    const fr = $('#frags');
    fr.innerHTML = '';
    ['head', 'haft', 'rune'].forEach(k => {
      const st = G.fragments[k];
      const cls = st === 'party' ? 'have' : st === 'villain' ? 'lost' : 'unknown';
      const tip = st === 'party' ? `${FRAGMENTS[k].name}: recovered` : st === 'villain' ? `${FRAGMENTS[k].name}: held by ${V().short}` : `${FRAGMENTS[k].name}: not yet found`;
      fr.appendChild(el('span', { class: 'frag ' + cls, title: tip }, { head: '🪓', haft: '🪵', rune: '💠' }[k]));
    });
    if (has('axe_reforged')) fr.innerHTML = '<span class="frag have" title="Florian\'s Axe, reforged">⚒️ Axe whole</span>';
  },

  renderParty() {
    if (!G) return;
    UI.renderHeader();
    const box = $('#party');
    box.innerHTML = '';
    G.party.forEach((c, i) => {
      const max = Character.maxHp(c), fmax = Character.maxFocus(c);
      const hpPct = Math.max(0, Math.min(100, (c.hp / max) * 100));
      const next = XP_TABLE[c.level] || XP_TABLE[XP_TABLE.length - 1];
      const prev = XP_TABLE[c.level - 1] || 0;
      const xpPct = c.level >= MAX_LEVEL ? 100 : Math.min(100, ((c.xp - prev) / (next - prev)) * 100);
      const card = el('div', { class: 'pcard' + (c.hp <= 0 ? ' down' : '') + (Combat.st && Combat.current() === c && !Combat.st.over ? ' active' : '') });
      card.innerHTML = `
        <div class="pc-top">
          <div class="pc-icon">${RACES[c.race].icon}${CLASSES[c.cls].icon}</div>
          <div class="pc-name"><b>${esc(c.name)}</b><small>Lv ${c.level} ${Character.describe(c)}</small></div>
          ${c.skillPoints > 0 ? `<span class="badge-level" title="Unspent skill points">+${c.skillPoints}</span>` : ''}
        </div>
        <div class="bar hp"><div style="width:${hpPct}%"></div><span>HP ${Math.max(0, c.hp)} / ${max}</span></div>
        <div class="pips">${Array.from({ length: fmax }, (_, k) => `<i class="${k < c.focus ? 'on' : ''}"></i>`).join('')}<small>Focus</small></div>
        <div class="bar xp"><div style="width:${xpPct}%"></div></div>
        ${c.corruption ? `<div class="corr" title="Corruption: the Hollow's hold on ${esc(c.name)}">${Array.from({ length: 10 }, (_, k) => `<i class="${k < c.corruption ? 'on' : ''}"></i>`).join('')}<small>Corruption</small></div>` : ''}
        ${(c.injuries || []).length ? `<div class="inj">${c.injuries.map(k => `<span title="${INJURIES[k].desc}">🩹 ${INJURIES[k].name}</span>`).join('')}</div>` : ''}
        <div class="pc-stats"><span>AC ${Character.ac(c)}</span><span>ATK ${signed(Character.attackBonus(c))}</span><span>${Character.weapon(c).name}</span></div>`;
      const btn = el('button', { class: 'btn small', onclick: () => UI.openSheet(i) }, c.skillPoints > 0 ? 'Sheet ★' : 'Sheet');
      card.appendChild(btn);
      box.appendChild(card);
    });
    const packItems = Object.keys(G.pack).filter(k => G.pack[k] > 0);
    const pack = el('div', { class: 'pack' }, `<h4>Pack</h4>${packItems.length ? packItems.map(k => `<div>${ITEMS[k].name} ×${G.pack[k]}</div>`).join('') : '<div class="muted">Empty</div>'}${G.stash.length ? `<h4>Unequipped gear</h4>${G.stash.map(k => `<div>${ITEMS[k].name}</div>`).join('')}` : ''}`);
    box.appendChild(pack);
  },

  /* ---------------- Story ---------------- */
  renderScene({ id, title, text, choices, notes, ending, vote }) {
    UI.show('#game-screen');
    UI.renderParty();
    $('#combat').classList.add('hidden');
    $('#story').classList.remove('hidden');
    const t = $('#story-title');
    t.textContent = title || '';
    const body = $('#story-text');
    body.innerHTML = text || '';
    body.classList.remove('fade-in'); void body.offsetWidth; body.classList.add('fade-in');
    if (typeof Art !== 'undefined') $('#story-art').innerHTML = Art.scene(id);
    if (typeof Sound !== 'undefined') { Sound.ambient(Art.keyFor(id)); if (ending) Sound.play(ending === 'victory' ? 'victory' : 'defeat'); }
    $('#story-notes').innerHTML = UI.notesHtml(notes);
    const box = $('#story-choices');
    box.innerHTML = '';
    $('#story').classList.toggle('ending', !!ending);
    $('#story').dataset.ending = ending || '';
    UI._scene = { id, title, text, choices };
    if (typeof AI !== 'undefined' && AI.ready() && !ending && choices.some(c => !c.locked) && (G.flags['ai_count_' + id] || 0) < 2 && !vote) {
      choices = choices.concat([{ label: 'Do something else…', hint: 'Describe your own action — the AI game master will judge it', ui: 'ai' }]);
    }
    UI._vote = vote ? { picks: [] } : null;
    if (vote) box.appendChild(el('div', { class: 'vote-banner' }, `🗳️ <b>${esc(G.party[0].name)}</b>, choose what you think you should do. Then <b>${esc(G.party[1].name)}</b> chooses. If you disagree, you'll argue it out.`));
    choices.forEach(ch => {
      const b = el('button', { class: 'choice' + (ch.locked ? ' locked' : '') + (ch.check ? ' has-check' : '') + (ch.combat ? ' has-combat' : '') + (ch.hollow ? ' hollow-choice' : ''), disabled: ch.locked ? 'disabled' : undefined });
      const icon = ch.hollow ? '🌫️' : ch.combat ? '⚔️' : ch.check ? '🎲' : ch.ui === 'ai' ? '✍️' : ch.ui === 'shop' ? '' : '➤';
      b.innerHTML = `<span class="c-label">${icon ? `<span class="c-icon">${icon}</span>` : ''}${ch.label}</span>${ch.hint || ch.lockReason ? `<span class="c-hint">${ch.locked ? '🔒 ' : ''}${ch.lockReason || ch.hint}</span>` : ''}`;
      b.addEventListener('click', () => {
        if (UI._vote && !ch.ui) {
          const v = UI._vote;
          v.picks.push(ch);
          if (v.picks.length === 1) {
            b.classList.add('voted');
            b.querySelector('.c-label').insertAdjacentHTML('beforeend', ` <span class="vote-tag">${esc(G.party[0].name)}</span>`);
            box.querySelector('.vote-banner').innerHTML = `🗳️ Now <b>${esc(G.party[1].name)}</b>, what do you think?`;
            return;
          }
          box.querySelectorAll('button').forEach(x => { x.disabled = true; });
          Engine.vote(v.picks[0], v.picks[1]);
          return;
        }
        UI.onChoice(ch);
      });
      box.appendChild(b);
    });
    UI.scrollStoryTop();
    UI.pace(body, box);
  },

  /* Storyteller pacing: paragraphs arrive one by one; click to skip. */
  pace(body, box) {
    clearTimeout(UI._paceT);
    const ps = [...body.querySelectorAll(':scope > p, :scope > div')];
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (UI.fast || reduce || typeof Settings === 'undefined' || !Settings.data.pacing || ps.length < 2) return;
    ps.forEach(p => p.classList.add('unread'));
    box.classList.add('waiting');
    let i = 0;
    const done = () => { ps.forEach(p => p.classList.remove('unread')); box.classList.remove('waiting'); body.onclick = null; clearTimeout(UI._paceT); };
    const step = () => {
      if (i >= ps.length) { done(); return; }
      ps[i].classList.remove('unread');
      const len = ps[i].textContent.length;
      i++;
      UI._paceT = setTimeout(step, Math.min(1600, 350 + len * 9));
    };
    body.onclick = done;
    step();
  },

  /* Free-text action, judged by the AI game master */
  showAiInput() {
    const sc = UI._scene;
    const box = $('#story-choices');
    box.innerHTML = '';
    const panel = el('div', { class: 'check-panel ai-panel' });
    panel.innerHTML = `<div class="check-head"><b>✍️ What do you do?</b><span>Describe an action in a sentence. The game master will decide what it takes.</span></div>`;
    let actor = alive()[0] || G.party[0];
    if (G.party.length > 1) {
      const who = el('div', { class: 'who' });
      const draw = () => { who.innerHTML = ''; alive().forEach(c => who.appendChild(el('button', { class: 'who-btn' + (c === actor ? ' sel' : ''), onclick: () => { actor = c; draw(); } }, `<b>${esc(c.name)}</b>`))); };
      draw(); panel.appendChild(who);
    }
    const ta = el('textarea', { class: 'ai-input', rows: 3, maxlength: 240, placeholder: 'e.g. "I cut the rope bridge so they can\'t follow us"' });
    panel.appendChild(ta);
    const status = el('div', { class: 'muted small' });
    const row = el('div', { class: 'action-row' });
    const go = el('button', { class: 'btn primary' }, 'Attempt it');
    const back = el('button', { class: 'btn ghost', onclick: () => Engine.go(sc.id, true) }, 'Back');
    row.appendChild(go); row.appendChild(back);
    panel.appendChild(row); panel.appendChild(status);
    box.appendChild(panel);
    ta.focus();
    go.addEventListener('click', async () => {
      const action = ta.value.trim().replace(/\s+/g, ' ');
      if (action.length < 3) { status.textContent = 'Write a little more.'; return; }
      go.disabled = true; back.disabled = true; ta.disabled = true;
      status.innerHTML = '<span class="ai-thinking">The game master considers your plan…</span>';
      const mappable = AI.mappable(sc.choices);
      try {
        const ruling = await AI.judge({ title: sc.title, text: sc.text, action }, mappable, actor);
        if (!ruling.feasible) {
          panel.innerHTML = `<div class="outcome-text">${P(esc(ruling.attempt))}</div>`;
          panel.appendChild(el('button', { class: 'btn primary', onclick: () => Engine.go(sc.id, true) }, 'Back to your options'));
          return;
        }
        G.flags['ai_count_' + sc.id] = (G.flags['ai_count_' + sc.id] || 0) + 1;
        chronicle(`${actor.name} tried their own plan: "${action}".`);
        ruling.success_text = esc(ruling.success_text); ruling.failure_text = esc(ruling.failure_text);
        const ch = AI.buildChoice(esc(action), ruling, mappable);
        $('#story-notes').innerHTML = `<div class="ai-attempt">${P(esc(ruling.attempt))}${ruling.counts_as >= 0 ? `<small class="muted">(This is another way of: ${mappable[ruling.counts_as].label.replace(/<[^>]+>/g, '')})</small>` : ''}</div>`;
        Engine.choose(ch);
      } catch (e) {
        status.innerHTML = `<span class="bad-text">${esc(e && e.message ? e.message : String(e))}</span>`;
        go.disabled = false; back.disabled = false; ta.disabled = false;
      }
    });
  },

  openMap() {
    if (!G) return;
    UI.modal(`<div class="journal"><h2>🗺️ The Valley</h2>${Art.map()}<p class="muted small">The Keeper's Map marks three places. The grey haze spreads from ${V().stronghold} as Doom rises.</p></div>`);
  },

  openSettings() {
    const wrap = el('div', { class: 'journal' });
    const render = () => {
      wrap.innerHTML = '<h2>⚙️ Settings</h2>';
      [['sfx', 'Sound effects', 'Dice, blows, chimes — all synthesized in your browser.'], ['music', 'Ambient music', 'A quiet drone that changes with the place you\'re in.'], ['pacing', 'Storyteller pacing', 'Story paragraphs arrive one at a time. Click the text to skip ahead.']].forEach(([k, label, desc]) => {
        const row = el('label', { class: 'setting' }, `<input type="checkbox" ${Settings.data[k] ? 'checked' : ''}> <span><b>${label}</b><small>${desc}</small></span>`);
        row.querySelector('input').addEventListener('change', e => {
          Settings.data[k] = e.target.checked; Settings.save();
          if (k === 'music') { if (e.target.checked && G) Sound.ambient(Art.keyFor(G.scene)); else Sound.stopAmbient(); }
          if (k === 'sfx' && e.target.checked) Sound.play('success');
        });
        wrap.appendChild(row);
      });
      const ai = el('div', { class: 'ai-settings' });
      ai.innerHTML = `<h3>✍️ AI Game Master <small class="muted">(optional)</small></h3>
        <p class="muted small">Adds a "Do something else…" option to scenes: type any action and Claude (${AI_MODEL}) decides which skill it needs and how hard it is, and narrates the result. It needs your own Anthropic API key, which is stored only in this browser and sent only to api.anthropic.com. Each attempt is a small paid API call on your account. Anyone using this browser can use the key — don't enable it on a shared computer.</p>`;
      const en = el('label', { class: 'setting' }, `<input type="checkbox" ${AI.cfg.enabled ? 'checked' : ''}> <span><b>Enable the AI game master</b></span>`);
      en.querySelector('input').addEventListener('change', e => { AI.cfg.enabled = e.target.checked; AI.save(); });
      const key = el('input', { type: 'password', class: 'ai-key', placeholder: 'sk-ant-…', value: AI.cfg.apiKey, autocomplete: 'off' });
      key.addEventListener('change', () => { AI.cfg.apiKey = key.value.trim(); AI.save(); });
      const clear = el('button', { class: 'btn small ghost', onclick: () => { AI.cfg.apiKey = ''; AI.cfg.enabled = false; AI.save(); render(); } }, 'Forget key');
      ai.appendChild(en); ai.appendChild(el('label', { class: 'small' }, 'API key')); ai.appendChild(key); ai.appendChild(clear);
      wrap.appendChild(ai);
    };
    render();
    UI.modal(wrap);
  },

  scrollStoryTop() {
    const s = $('#story');
    if (s && window.innerWidth < 900) s.scrollIntoView({ behavior: UI.fast ? 'auto' : 'smooth', block: 'start' });
  },

  onChoice(ch) {
    if (typeof Sound !== 'undefined') Sound.play(ch.hollow ? 'hollow' : 'click');
    if (ch.ui === 'shop') { if (ch.once) flag('once_' + ch.once); UI.openShop(); return; }
    if (ch.ui === 'newgame') { Engine.clearSave(); UI.startCreation(); return; }
    if (ch.ui === 'ai') { UI.showAiInput(); return; }
    Engine.choose(ch);
  },

  notesHtml(notes) {
    if (!notes || !notes.length) return '';
    return `<div class="notes">${notes.map(n => `<span class="note ${n.kind}">${esc(n.text)}</span>`).join('')}</div>`;
  },

  /* ---------------- Skill checks ---------------- */
  showCheck(ch, info) {
    const box = $('#story-choices');
    box.innerHTML = '';
    const panel = el('div', { class: 'check-panel' });
    panel.innerHTML = `<div class="check-head"><b>${ch.label}</b><span>${info.skillName} check · DC ${info.dc}</span></div>`;
    let chosen = info.options.slice().sort((a, b) => b.total - a.total)[0];
    const who = el('div', { class: 'who' });
    const focusWrap = el('label', { class: 'focus-opt' });
    const helpWrap = el('div', { class: 'help-opt' });
    let helper = null;
    const renderWho = () => {
      who.innerHTML = info.options.length > 1 ? '<div class="muted">Who attempts it?</div>' : '';
      info.options.forEach(o => {
        const b = el('button', { class: 'who-btn' + (o === chosen ? ' sel' : ''), onclick: () => { chosen = o; renderWho(); } },
          `<b>${esc(o.char.name)}</b> <span class="bonus">${signed(o.total)}</span><small>${o.parts.map(p => `${p.label} ${signed(p.value)}`).join(' · ')}</small>`);
        who.appendChild(b);
      });
      const die = chosen.char.cls === 'bard' ? '1d6' : '1d4';
      focusWrap.innerHTML = chosen.char.focus > 0 ? `<input type="checkbox" id="use-focus"> Spend 1 Focus for +${die} <small>(${chosen.char.focus} left)</small>` : `<span class="muted">${esc(chosen.char.name)} has no Focus to spend.</span>`;
      const others = info.options.filter(o => o !== chosen);
      if (helper && helper === chosen.char) helper = null;
      helpWrap.innerHTML = '';
      if (others.length && !(G.bond !== undefined && G.bond <= 2)) {
        const h = others[0].char;
        const hb = el('label', {}, `<input type="checkbox" ${helper ? 'checked' : ''}> ${esc(h.name)} helps (+2) <small class="muted">— shares the risk: takes 1d4 damage on a failure</small>`);
        hb.querySelector('input').addEventListener('change', e => { helper = e.target.checked ? h : null; renderWho(); });
        helpWrap.appendChild(hb);
      }
      const need = info.dc - chosen.total - (helper ? 2 : 0);
      odds.textContent = need <= 2 ? 'Odds: excellent' : need <= 8 ? 'Odds: good' : need <= 12 ? 'Odds: risky' : 'Odds: long shot';
    };
    const odds = el('div', { class: 'odds muted' });
    const dieBox = el('div', { class: 'die-box' }, `<div class="d20" id="d20"><span>?</span></div>`);
    const rollBtn = el('button', { class: 'btn primary roll-btn' }, '🎲 Roll the d20');
    rollBtn.addEventListener('click', () => {
      rollBtn.disabled = true;
      who.querySelectorAll('button').forEach(b => { b.disabled = true; });
      const useFocus = !!(document.getElementById('use-focus') || {}).checked;
      const ctx = Engine.rollCheck(ch, chosen, useFocus, info.dc, helper);
      UI.renderParty();
      UI.animateDie($('#d20'), ctx.roll, () => Engine.finishCheck(ch, ctx));
    });
    renderWho();
    panel.appendChild(who);
    panel.appendChild(focusWrap);
    panel.appendChild(helpWrap);
    panel.appendChild(odds);
    panel.appendChild(dieBox);
    panel.appendChild(rollBtn);
    box.appendChild(panel);
  },

  animateDie(node, value, done) {
    if (UI.fast || !node) { done(); return; }
    if (typeof Sound !== 'undefined') Sound.play('dice');
    let n = 0;
    node.classList.add('rolling');
    const span = node.querySelector('span');
    const iv = setInterval(() => {
      span.textContent = 1 + Math.floor(Math.random() * 20);
      if (++n >= 14) {
        clearInterval(iv);
        span.textContent = value;
        node.classList.remove('rolling');
        node.classList.add(value === 20 ? 'nat20' : value === 1 ? 'nat1' : 'landed');
        setTimeout(done, 650);
      }
    }, 55);
  },

  showOutcome({ text, notes, ctx, onContinue }) {
    UI.renderParty();
    const box = $('#story-choices');
    box.innerHTML = '';
    const panel = el('div', { class: 'outcome' });
    if (ctx && ctx.roll !== undefined && ctx.dc !== undefined && typeof Sound !== 'undefined') Sound.play(ctx.crit ? 'crit' : ctx.bought === 'Hollow' ? 'hollow' : ctx.success ? 'success' : 'fail');
    if (notes && notes.some(n => n.kind === 'level') && typeof Sound !== 'undefined') setTimeout(() => Sound.play('level'), 400);
    if (ctx && ctx.roll !== undefined && ctx.dc !== undefined) {
      const res = ctx.crit ? 'Critical success!' : ctx.fumble ? 'Critical failure!' : ctx.bought === 'Hollow' ? 'Success — the Hollow\'s gift' : ctx.bought ? `Success at a cost: ${ctx.bought}` : ctx.success ? 'Success!' : 'Failure';
      panel.appendChild(el('div', { class: 'roll-result ' + (ctx.bought === 'Hollow' ? 'hollow' : ctx.success ? 'good' : 'bad') },
        `<div class="d20 small ${ctx.roll === 20 ? 'nat20' : ctx.roll === 1 ? 'nat1' : 'landed'}"><span>${ctx.roll}</span></div>
         <div><b>${res}</b><br><small>${esc(ctx.char.name)} rolled ${ctx.roll}${ctx.rerolled ? ' (Lucky reroll)' : ''} ${signed(ctx.total - ctx.roll - ctx.focusRoll - (ctx.helpBonus || 0))}${ctx.focusRoll ? ` +${ctx.focusRoll} Focus` : ''}${ctx.helpBonus ? ` +${ctx.helpBonus} help` : ''} = <b>${ctx.total}</b> vs DC ${ctx.dc}</small></div>`));
    }
    if (text) panel.appendChild(el('div', { class: 'outcome-text fade-in' }, text));
    if (notes && notes.length) panel.appendChild(el('div', {}, UI.notesHtml(notes)));
    const btn = el('button', { class: 'btn primary' }, 'Continue ➤');
    btn.addEventListener('click', () => { btn.disabled = true; onContinue(); });
    panel.appendChild(btn);
    box.appendChild(panel);
  },

  /* A branching moment: success-at-a-cost, the Hollow's offer, mercy… */
  showFork({ ctx, heading, text, options, hollow, notes }) {
    UI.renderParty();
    const box = $('#story-choices');
    box.innerHTML = '';
    const panel = el('div', { class: 'outcome fork' + (hollow ? ' hollow' : '') });
    if (ctx && ctx.roll !== undefined && ctx.dc !== undefined) {
      panel.appendChild(el('div', { class: 'roll-result bad' }, `<div class="d20 small landed"><span>${ctx.roll}</span></div><div><b>${ctx.partial ? 'Narrow miss' : 'Failure'}</b><br><small>${esc(ctx.char.name)} rolled ${ctx.roll} ${signed(ctx.total - ctx.roll - ctx.focusRoll - (ctx.helpBonus || 0))}${ctx.focusRoll ? ` +${ctx.focusRoll} Focus` : ''}${ctx.helpBonus ? ` +${ctx.helpBonus} help` : ''} = <b>${ctx.total}</b> vs DC ${ctx.dc}</small></div>`));
    }
    if (notes && notes.length) panel.appendChild(el('div', {}, UI.notesHtml(notes)));
    panel.appendChild(el('div', { class: 'fork-head' }, `<b>${heading}</b>`));
    if (text) panel.appendChild(el('div', { class: 'outcome-text' }, P(text)));
    options.forEach(o => {
      const b = el('button', { class: 'choice' + (o.hollow ? ' hollow-choice' : '') }, `<span class="c-label">${o.hollow ? '<span class="c-icon">🌫️</span>' : '<span class="c-icon">➤</span>'}${o.label}</span>${o.desc ? `<span class="c-hint">${o.desc}</span>` : ''}`);
      b.addEventListener('click', () => { box.querySelectorAll('button').forEach(x => { x.disabled = true; }); if (typeof Sound !== 'undefined') Sound.play(o.hollow ? 'hollow' : 'click'); o.run(); });
      panel.appendChild(b);
    });
    box.appendChild(panel);
  },

  /* ---------------- Combat ---------------- */
  renderCombat(lastRoll) {
    const st = Combat.st;
    if (!st) return;
    UI.renderParty();
    $('#story').classList.add('hidden');
    const c = $('#combat');
    const wasHidden = c.classList.contains('hidden');
    c.classList.remove('hidden');
    if (wasHidden && window.innerWidth < 900 && !UI.fast) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const heroName = id => { const h = G.party.find(p => p.id === id); return h ? esc(h.name) : 'someone'; };
    // enemies
    const en = $('#enemies');
    en.innerHTML = '';
    const p = st.pending;
    const targetable = e => e.hp > 0 && p && (p.needs === 'enemy' || (p.needs === 'interruptible' && Combat.interruptible().includes(e)));
    st.enemies.forEach(e => {
      const pct = Math.max(0, (e.hp / e.maxHp) * 100);
      const card = el('div', { class: 'ecard' + (e.hp <= 0 ? ' dead' : '') + (targetable(e) ? ' targetable' : '') + (e.boss ? ' boss' : '') });
      const it = e.intent;
      let intent = '';
      if (e.hp > 0 && it && !st.over) {
        const map = {
          attack: ['⚔️', `Attacks ${heroName(it.target)}`, ''],
          heavy: ['💥', `Winding up a crushing blow on ${heroName(it.target)} (double damage)`, 'danger'],
          burst: ['🌫️', 'Gathering the Hollow — will strike everyone', 'danger'],
          sweep: ['🌀', 'Coiling to sweep the whole party', 'danger'],
          heal: ['✚', 'Preparing to heal', 'danger'],
          stunned: ['💫', 'Staggered — will lose its turn', 'calm'],
        };
        const m = map[it.type] || map.attack;
        intent = `<div class="intent ${m[2]}">${m[0]} ${m[1]}</div>`;
      }
      const statuses = Object.keys(e.status || {}).filter(k => e.status[k] && STATUS_INFO[k]).map(k => `<span title="${STATUS_INFO[k].desc}">${STATUS_INFO[k].icon}</span>`).join('');
      card.innerHTML = `<div class="e-name">${e.boss ? '💀 ' : ''}${esc(e.name)} ${statuses}</div>
        <div class="bar ehp"><div style="width:${pct}%"></div><span>${e.yielded ? 'yielded' : Math.max(0, e.hp) + ' / ' + e.maxHp}</span></div>
        <div class="e-stats">AC ${Combat.enemyAC(e)} · ATK ${signed(e.atk)}${e.hollow ? ' · <span title="Takes double radiant damage">Hollow</span>' : ''}${e.fire ? ' · Fire' : ''}</div>${intent}`;
      if (targetable(e)) card.addEventListener('click', () => Combat.pickTarget(e));
      en.appendChild(card);
    });
    // log
    const log = $('#combat-log');
    log.innerHTML = st.log.slice(-40).map(l => `<div class="log ${l.kind}">${l.text}</div>`).join('');
    log.scrollTop = log.scrollHeight;
    // actions
    const act = $('#combat-actions');
    act.innerHTML = '';
    if (st.over) {
      const msg = st.result === 'win' ? (st.surrendered ? 'They yield!' : 'Victory!') : st.result === 'flee' ? 'You escaped.' : 'Defeat…';
      act.appendChild(el('div', { class: 'turn-label ' + (st.result === 'win' ? 'good' : 'bad') }, msg));
      const b = el('button', { class: 'btn primary' }, 'Continue ➤');
      b.addEventListener('click', () => { b.disabled = true; Combat.finish(); });
      act.appendChild(b);
      return;
    }
    if (st.temptFor) {
      const h = st.temptFor;
      const box = el('div', { class: 'tempt' }, `<div class="turn-label">🌫️ ${esc(h.name)} is dying…</div><p>The noise of the battle fades. Everything goes grey and soft and quiet. Then a voice, like ash falling on snow: <i>"Get up. I can make you stand. I can make it stop hurting. All you have to do is let me in."</i></p>`);
      const row = el('div', { class: 'action-row' });
      const n = st.enemies.some(e => e.boss) ? 3 : 2;
      row.appendChild(el('button', { class: 'btn act hollow-choice', onclick: () => Combat.answerTemptation(true) }, `🌫️ Let the Hollow in<small>Rise with half HP. +${n} Corruption.</small>`));
      row.appendChild(el('button', { class: 'btn act', onclick: () => Combat.answerTemptation(false) }, `✋ Refuse<small>Stay down and trust your friends${solo() ? ' — or fall' : ''}.</small>`));
      box.appendChild(row);
      act.appendChild(box);
      return;
    }
    const hero = Combat.current();
    if (st.busy || !hero) {
      act.appendChild(el('div', { class: 'turn-label' }, lastRoll ? `🎲 ${lastRoll}` : 'The enemy moves…'));
      return;
    }
    act.appendChild(el('div', { class: 'turn-label' }, `Round ${st.round} — <b>${esc(hero.name)}</b>'s turn`));
    if (p) {
      act.appendChild(el('div', { class: 'muted' }, p.needs === 'ally' ? 'Choose an ally:' : p.needs === 'interruptible' ? 'Choose the enemy to interrupt (highlighted above).' : 'Choose a target above.'));
      if (p.needs === 'ally') G.party.forEach(x => act.appendChild(el('button', { class: 'btn', onclick: () => Combat.pickTarget(x) }, `${esc(x.name)} (${Math.max(0, x.hp)} HP)`)));
      act.appendChild(el('button', { class: 'btn ghost', onclick: () => Combat.cancelTarget() }, 'Cancel'));
      return;
    }
    const row = el('div', { class: 'action-row' });
    const w = Character.weapon(hero);
    row.appendChild(el('button', { class: 'btn act', onclick: () => Combat.act('attack') }, `⚔️ Attack<small>${w.name} ${w.dmg}${signed(Character.damageBonus(hero))}</small>`));
    if (Combat.interruptible().length) row.appendChild(el('button', { class: 'btn act interrupt', onclick: () => Combat.act('interrupt') }, `✋ Interrupt<small>Attack at −2 for half damage. A hit breaks a wind-up.</small>`));
    Character.fx(hero).abilities.forEach(id => {
      const ab = ABILITIES[id];
      const ok = hero.focus >= ab.cost;
      row.appendChild(el('button', { class: 'btn act ability' + (ab.corrupting ? ' hollow-choice' : ''), disabled: ok ? undefined : 'disabled', title: ab.desc, onclick: () => Combat.act('ability', id) },
        `${ab.corrupting ? '🌫️' : '✨'} ${ab.name}<small>${ab.cost ? ab.cost + ' Focus' : 'Free'} · ${ab.desc}</small>`));
    });
    st.actions.filter(a => !a.used && (!a.req || a.req(hero))).forEach(a => {
      row.appendChild(el('button', { class: 'btn act scene', onclick: () => Combat.act('scene', a.key) }, `🌟 ${a.label}<small>${a.skill ? `${SKILLS[a.skill] ? SKILLS[a.skill].name : STAT_NAMES[a.skill]} ${signed(Character.checkBonus(hero, a.skill).total)} vs DC ${a.dc} · ` : ''}${a.desc}</small>`));
    });
    Object.keys(G.pack).filter(k => G.pack[k] > 0).forEach(k => {
      row.appendChild(el('button', { class: 'btn act item', onclick: () => Combat.act('item', k) }, `🧪 ${ITEMS[k].name} ×${G.pack[k]}<small>${ITEMS[k].desc || ''}</small>`));
    });
    row.appendChild(el('button', { class: 'btn act', onclick: () => Combat.act('defend') }, `🛡️ Defend<small>+3 AC until your next turn</small>`));
    if (st.fleeable) row.appendChild(el('button', { class: 'btn act flee', onclick: () => Combat.act('flee') }, `🏃 Flee<small>Acrobatics vs DC ${st.fleeDC}</small>`));
    act.appendChild(row);
    if (lastRoll && !UI.fast) act.prepend(el('div', { class: 'd20 small landed float' }, `<span>${lastRoll}</span>`));
  },
  hideCombat() { $('#combat').classList.add('hidden'); $('#story').classList.remove('hidden'); },

  /* ---------------- Modals ---------------- */
  modal(html, onClose) {
    const m = $('#modal');
    $('#modal-body').innerHTML = '';
    if (typeof html === 'string') $('#modal-body').innerHTML = html; else $('#modal-body').appendChild(html);
    m.classList.remove('hidden');
    UI._onClose = onClose;
  },
  closeModal() {
    $('#modal').classList.add('hidden');
    const cb = UI._onClose; UI._onClose = null;
    UI.renderParty();
    if (Combat.st) UI.renderCombat();
    if (cb) cb();
  },

  openSheet(i) {
    const c = G.party[i];
    const wrap = el('div', { class: 'sheet' });
    const render = () => {
      const fx = Character.fx(c);
      const cls = CLASSES[c.cls], race = RACES[c.race];
      const skills = Object.keys(SKILLS).map(k => {
        const b = Character.checkBonus(c, k).total;
        const prof = cls.skills.includes(k);
        return `<div class="sk ${prof ? 'prof' : ''}"><span>${SKILLS[k].name}</span><b>${signed(b)}</b></div>`;
      }).join('');
      wrap.innerHTML = `
        <h2>${race.icon}${cls.icon} ${esc(c.name)}</h2>
        <div class="muted">Level ${c.level} ${race.name} ${cls.name} · XP ${c.xp}${c.level < MAX_LEVEL ? ' / ' + XP_TABLE[c.level] : ''}</div>
        <p class="trait"><b>${race.name}:</b> ${race.trait}</p>
        ${c.background ? `<p class="trait"><b>${BACKGROUNDS[c.background].icon} ${BACKGROUNDS[c.background].name}:</b> ${BACKGROUNDS[c.background].desc}</p>` : ''}
        ${!solo() && G.bond !== undefined ? `<p class="trait"><b>Bond — ${bondName()}:</b> ${G.bond}/10${G.bond >= 8 ? ' · Fight as One unlocked' : G.bond <= 2 ? ' · Fraying: no helping each other' : ''}</p>` : ''}
        ${c.corruption ? `<p class="trait hollow-text"><b>Corruption ${c.corruption}/10.</b> ${c.corruption >= 7 ? 'The Hollow calls them heir. Their reflection is grey.' : c.corruption >= 5 ? 'Their eyes have begun to grey (−1 Wisdom & Charisma checks).' : c.corruption >= 3 ? 'Grey veins under the skin. Grey Fire answers their call.' : 'A chill that never quite leaves.'}</p>` : ''}
        ${(c.injuries || []).length ? `<p class="trait"><b>Injuries:</b> ${c.injuries.map(k => `${INJURIES[k].name} (${INJURIES[k].desc})`).join('; ')}. <span class="muted">Treat them at the Hearthmoor healer.</span></p>` : ''}
        <div class="stat-row">${STATS.map(s => `<div class="stat"><small>${s.toUpperCase()}</small><b>${c.stats[s]}</b><span>${signed(mod(c.stats[s]))}</span></div>`).join('')}</div>
        <div class="derived">
          <span>❤️ HP ${c.hp}/${Character.maxHp(c)}</span><span>🛡️ AC ${Character.ac(c)}</span>
          <span>⚔️ Attack ${signed(Character.attackBonus(c))}</span><span>💥 Damage ${Character.weapon(c).dmg}${signed(Character.damageBonus(c))}${fx.weaponDie ? '+' + fx.weaponDie : ''}</span>
          <span>🔮 Focus ${c.focus}/${Character.maxFocus(c)}</span>${cls.spellStat ? `<span>✨ Spell attack ${signed(Character.spellAttack(c))}</span>` : ''}
        </div>
        <h3>Equipment</h3><div id="equip"></div>
        <h3>Skill Tree <span class="sp">${c.skillPoints} point${c.skillPoints === 1 ? '' : 's'} to spend</span></h3>
        <div class="tree" id="tree"></div>
        <h3>Abilities</h3>
        <div class="abilities">${fx.abilities.map(a => `<div><b>${ABILITIES[a].name}</b> <small>(${ABILITIES[a].cost ? ABILITIES[a].cost + ' Focus' : 'free'})</small> — ${ABILITIES[a].desc}</div>`).join('')}${fx.companion ? '<div><b>Wolf Companion</b> — bites a foe every round.</div>' : ''}</div>
        <h3>Skills</h3><div class="skills">${skills}</div>
        <div id="pack-use"></div>`;
      // equipment
      const eq = wrap.querySelector('#equip');
      ['weapon', 'armor', 'trinket'].forEach(slot => {
        const cur = ITEMS[c.equip[slot]];
        const row = el('div', { class: 'eq-row' }, `<span class="slot">${slot}</span><b>${cur ? cur.name : '—'}</b>${cur ? `<small>${UI.itemDesc(cur)}</small>` : ''}`);
        const options = G.stash.filter(id => ITEMS[id].slot === slot);
        options.forEach(id => {
          row.appendChild(el('button', { class: 'btn small', onclick: () => {
            const oldMax = Character.maxHp(c);
            G.stash.splice(G.stash.indexOf(id), 1);
            if (c.equip[slot]) G.stash.push(c.equip[slot]);
            c.equip[slot] = id;
            c.hp = Math.max(1, Math.min(Character.maxHp(c), c.hp + Character.maxHp(c) - oldMax));
            c.focus = Math.min(c.focus, Character.maxFocus(c));
            Engine.save(); render();
          } }, `Equip ${ITEMS[id].name}`));
        });
        if (slot === 'trinket' && cur) row.appendChild(el('button', { class: 'btn small ghost', onclick: () => { G.stash.push(c.equip.trinket); c.equip.trinket = null; c.focus = Math.min(c.focus, Character.maxFocus(c)); Engine.save(); render(); } }, 'Unequip'));
        eq.appendChild(row);
      });
      // tree
      const tree = wrap.querySelector('#tree');
      cls.tree.forEach(br => {
        const col = el('div', { class: 'branch' }, `<h4>${br.name}</h4>`);
        br.nodes.forEach((n, idx) => {
          const owned = c.tree.includes(n.id);
          const can = Character.canLearn(c, n.id);
          const node = el('div', { class: 'node' + (owned ? ' owned' : can ? ' can' : ' locked') }, `<b>${n.name}</b><small>${n.desc}</small>`);
          if (can && !Combat.st) node.appendChild(el('button', { class: 'btn small primary', onclick: () => { Character.learn(c, n.id); Engine.save(); render(); UI.renderParty(); } }, 'Learn'));
          col.appendChild(node);
          if (idx < br.nodes.length - 1) col.appendChild(el('div', { class: 'tree-link' }, '│'));
        });
        tree.appendChild(col);
      });
      if (Combat.st && c.skillPoints) tree.appendChild(el('div', { class: 'muted' }, 'Skill points can be spent outside of battle.'));
      // potions outside combat
      const pu = wrap.querySelector('#pack-use');
      if (!Combat.st) {
        Object.keys(G.pack).filter(k => G.pack[k] > 0 && (ITEMS[k].heal || ITEMS[k].focus)).forEach(k => {
          pu.appendChild(el('button', { class: 'btn small', onclick: () => {
            G.pack[k]--; if (!G.pack[k]) delete G.pack[k];
            if (ITEMS[k].heal) Character.heal(c, Dice.roll(ITEMS[k].heal).total);
            if (ITEMS[k].cleanse && c.corruption) c.corruption = Math.max(0, c.corruption - ITEMS[k].cleanse);
            if (ITEMS[k].focus) c.focus = Math.min(Character.maxFocus(c), c.focus + ITEMS[k].focus);
            Engine.save(); render(); UI.renderParty();
          } }, `Use ${ITEMS[k].name} (${G.pack[k]})`));
        });
      }
    };
    render();
    UI.modal(wrap);
  },

  itemDesc(it) {
    const p = [];
    if (it.dmg) p.push(`${it.dmg} ${it.finesse ? 'STR/DEX' : it.stat.toUpperCase()}`);
    if (it.attack) p.push(`${signed(it.attack)} hit`);
    if (it.damage) p.push(`${signed(it.damage)} dmg`);
    if (it.radiant) p.push('radiant');
    if (it.spellAttack) p.push(`${signed(it.spellAttack)} spell hit`);
    if (it.spellDamage) p.push(`${signed(it.spellDamage)} spell dmg`);
    if (it.slot === 'armor') p.push(`AC ${it.ac}${it.maxDex === 0 ? '' : it.maxDex < 9 ? ` + DEX (max ${it.maxDex})` : ' + DEX'}`);
    if (it.fireResist) p.push('fire resist');
    if (it.desc) p.push(it.desc);
    return p.join(' · ');
  },

  price(it) { return Math.round(it.price * (has('market_burned') ? 1.5 : 1) * (has('hearth_defended') ? 0.8 : 1)); },

  openShop() {
    const wrap = el('div', { class: 'shop' });
    const render = () => {
      wrap.innerHTML = `<h2>🛒 Market</h2><div class="muted">You have <b>${G.gold}</b> gold. Gear goes to your unequipped pile — equip it from a character sheet.</div>`;
      const list = el('div', { class: 'shop-list' });
      SHOP_STOCK.forEach(id => {
        const it = ITEMS[id];
        const owned = !it.consumable && (hasItem(id));
        const row = el('div', { class: 'shop-row' }, `<div><b>${it.name}</b><small>${it.consumable ? it.desc : UI.itemDesc(it)}${it.slot ? ' · ' + it.slot : ''}</small></div>`);
        const price = UI.price(it);
        const b = el('button', { class: 'btn small', disabled: (G.gold < price || owned) ? 'disabled' : undefined, onclick: () => {
          if (G.gold < price) return;
          G.gold -= price;
          if (it.consumable) G.pack[id] = (G.pack[id] || 0) + 1; else G.stash.push(id);
          Engine.save(); UI.renderParty(); render();
        } }, owned ? 'Owned' : `${price} g`);
        row.appendChild(b);
        list.appendChild(row);
      });
      wrap.appendChild(list);
      const sellable = G.stash.filter(id => ITEMS[id].price);
      if (sellable.length) {
        wrap.appendChild(el('h3', {}, 'Sell unequipped gear'));
        sellable.forEach(id => {
          const it = ITEMS[id];
          const row = el('div', { class: 'shop-row' }, `<div><b>${it.name}</b></div>`);
          row.appendChild(el('button', { class: 'btn small', onclick: () => { G.stash.splice(G.stash.indexOf(id), 1); G.gold += Math.floor(it.price / 2); Engine.save(); UI.renderParty(); render(); } }, `Sell ${Math.floor(it.price / 2)} g`));
          wrap.appendChild(row);
        });
      }
    };
    render();
    UI.modal(wrap);
  },

  openJournal() {
    if (!G) return;
    const v = V();
    const fr = ['head', 'haft', 'rune'].map(k => `<li>${FRAGMENTS[k].name}: <b>${G.fragments[k] === 'party' ? 'in your hands' : G.fragments[k] === 'villain' ? 'held by ' + v.short : 'not yet found'}</b>${G.regions.find(r => G.fragLoc[r] === k) && G.fragments[k] === null ? ` <small>(somewhere in ${REGIONS[G.regions.find(r => G.fragLoc[r] === k)].name})</small>` : ''}</li>`).join('');
    const html = `<div class="journal">
      <h2>📖 Journal</h2>
      ${Art.map()}
      <h3>The Enemy</h3><p><b>${v.name}</b> — ${v.look}. ${v.motive}</p>
      <p class="muted">${v.short}'s lieutenant: ${v.lieutenant.name} ${v.lieutenant.title}${G.rival.slain ? ' (slain)' : G.rival.spared ? ' (spared)' : ''}.</p>
      <h3>Florian's Axe</h3><ul>${fr}</ul>
      <h3>Secrets of ${v.short} (${G.clues.length}/3)</h3>${G.clues.length ? `<ul>${G.clues.map(c => `<li>${c}</li>`).join('')}</ul>` : '<p class="muted">Nothing yet. Learn enough, and you may be able to reach the person behind the enemy.</p>'}
      <h3>Allies</h3>${G.allies.length ? `<ul>${G.allies.map(a => `<li>${G.allyNames[a]}</li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}
      <h3>The Hollow's Reach: ${G.doom}/10</h3><p class="muted">Doom rises with time and failures. It makes the final battle harder and darkens the ending.</p>
      <h3>Chronicle</h3>${G.chronicle.length ? `<ul>${G.chronicle.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
    </div>`;
    UI.modal(html);
  },

  openArchive() {
    const a = Meta.load();
    const ach = Object.keys(ACHIEVEMENTS).map(k => `<div class="ach ${a.achievements[k] ? 'got' : ''}"><b>${a.achievements[k] ? '🏆' : '🔒'} ${ACHIEVEMENTS[k].name}</b><small>${ACHIEVEMENTS[k].desc}${a.achievements[k] ? ' · ' + a.achievements[k] : ''}</small></div>`).join('');
    const runs = a.runs.length ? a.runs.map(r => `<div class="run ${r.won ? 'won' : 'lost'}"><b>${r.won ? '⚒️' : '🌫️'} ${(SCENES[r.ending] && typeof SCENES[r.ending].title === 'string') ? SCENES[r.ending].title : r.ending}</b> <small>${r.date} · vs ${VILLAINS[r.villain] ? VILLAINS[r.villain].name : r.villain} · ${DIFFICULTIES[r.difficulty] ? DIFFICULTIES[r.difficulty].name : ''} · Doom ${r.doom}</small><div class="muted small">${r.heroes.map(h => `${esc(h.name)} the ${h.desc}${h.died ? ' (fell)' : ''}`).join(', ')}</div></div>`).join('') : '<p class="muted">No tales recorded yet. Every tale you finish will be written here.</p>';
    const fallen = a.fallen.length ? `<h3>The Fallen</h3><p class="muted">${a.fallen.map(f => `${esc(f.name)} the ${f.desc}`).join(' · ')}</p>` : '';
    const heir = a.greyHeir ? `<p class="hollow-text"><b>${esc(a.greyHeir.name)}</b> took the Grey Crown in your last tale. They are out there, waiting.</p>` : '';
    UI.modal(`<div class="journal"><h2>📜 The Keeper's Archive</h2>${heir}<h3>Achievements (${Object.keys(a.achievements).length}/${Object.keys(ACHIEVEMENTS).length})</h3><div class="ach-grid">${ach}</div><h3>Tales</h3>${runs}${fallen}</div>`);
  },

  openHelp() {
    UI.modal(`<div class="journal"><h2>How to Play</h2>
      <p>Florian's Axe is a choose-your-own-adventure for 1 or 2 players. Each tale is different: the villain, the opening, which three lands hide the axe's fragments, and the encounters on the road are all chosen at random — and your choices decide the rest.</p>
      <h3>Choices & checks</h3><p>Choices marked 🎲 need a <b>skill check</b>: roll a d20 and add the character's stat modifier, proficiency, talents and gear. Meet or beat the DC to succeed. A natural 20 always succeeds; a natural 1 always fails. In a 2-player game, pick who attempts each check. You can spend 1 Focus to add +1d4 (Bards +1d6).</p>
      <h3>Puzzles</h3><p>Choices marked 🧩 test <b>you</b>, not your hero: riddles, coded letters, rune locks, bell chants, a masquerade whodunit and dice games. They change every tale. Each has a 💡 hint you can earn with a skill roll, and you can always give up — the story carries on either way, but solving it yourself is better.</p>
      <h3>Narrow misses</h3><p>Miss a check by 3 or less and you can <b>succeed at a cost</b> — take a wound, lose time (Doom), gold or Focus — or accept the failure. In 2-player games, the other hero can <b>help</b> for +2, but shares the risk.</p>
      <h3>Battles</h3><p>Choices marked ⚔️ start a battle. Every enemy shows its <b>intent</b> for the round — watch for 💥 crushing blows and 🌫️ Hollow bursts. <b>Defend</b> (+3 AC) against them, or <b>Interrupt</b> to break the wind-up. Each battlefield offers 🌟 <b>scene actions</b> — drop the chandelier, ring the bell. Critical hits stun, bleed or expose foes. Beaten enemies may surrender: spare, question or execute them. Losing usually doesn't end the game — it changes the story, and may leave lasting <b>injuries</b> (treat them at the healer). Only the final battle is to the death.</p>
      <h3>The living world</h3><p>The villain acts while you travel — raiding places you haven't reached, attacking Hearthmoor, taking your friends. Each hero's <b>background</b> brings a personal quest that pays off at the end. In two-player games, some decisions are put to a <b>vote</b>; disagreements are argued out and strain your <b>bond</b>. Open the 🗺️ Map to see the valley and the Hollow's spreading haze. Finished tales are recorded in the <b>Keeper's Archive</b>, and their heroes may return.</p>
      <h3>The Hollow</h3><p>When you fail or fall, the Hollow may offer help. Accepting works — and adds <b>Corruption</b>. At 3 you can call Grey Fire and take dark shortcuts in the story; at 5 your eyes grey; at 7 the Hollow calls you its heir. Corruption changes how people see you, how the axe treats you, and how the tale can end. Pray at the chapel to cleanse it.</p>
      <h3>Growing stronger</h3><p>Earn XP from checks and battles. Each level grants more HP and a skill point to spend in your class's <b>skill tree</b> (open the character Sheet). Buy gear in Hearthmoor and equip it from the Sheet.</p>
      <h3>What matters</h3><p>Recover all three fragments to reforge the axe before the end. Allies you help will come to your aid. Learn the villain's secrets — with enough of them, you may end the war with words instead of steel. Watch the <b>Doom</b> meter: the Hollow spreads with time and failure.</p>
      <p class="muted">The game autosaves after every scene.</p></div>`);
  },

  /* ---------------- Character creation ---------------- */
  startCreation() {
    UI.show('#create-screen');
    UI.cr = { count: null, idx: 0, chars: [], draft: null };
    UI.renderCreation();
  },

  renderCreation() {
    const cr = UI.cr;
    const root = $('#create-body');
    root.innerHTML = '';
    if (!cr.count) {
      root.appendChild(el('h2', {}, 'How many heroes?'));
      const row = el('div', { class: 'count-row' });
      [1, 2].forEach(n => row.appendChild(el('button', { class: 'big-card', onclick: () => { cr.count = n; UI.newDraft(); UI.renderCreation(); } },
        `<div class="big-icon">${n === 1 ? '🧍' : '🧍🧍'}</div><b>${n === 1 ? 'Solo' : 'Two Players'}</b><small>${n === 1 ? 'One hero, one tale.' : 'Hot-seat: share one screen and take turns.'}</small>`)));
      root.appendChild(row);
      root.appendChild(el('h3', {}, 'Difficulty'));
      const drow = el('div', { class: 'count-row' });
      cr.difficulty = cr.difficulty || 'normal';
      const unl = Meta.unlocked();
      Object.keys(DIFFICULTIES).filter(k => unl.difficulties.includes(k)).forEach(k => drow.appendChild(el('button', { class: 'pick' + (cr.difficulty === k ? ' sel' : ''), onclick: () => { cr.difficulty = k; UI.renderCreation(); } },
        `<b>${k === 'hardcore' ? '☠️ ' : k === 'story' ? '📖 ' : '⚔️ '}${DIFFICULTIES[k].name}</b><small>${DIFFICULTIES[k].desc}</small>`)));
      root.appendChild(drow);
      root.appendChild(el('h3', {}, 'Legacy Gift'));
      root.appendChild(el('p', { class: 'muted' }, 'Gifts from the Keeper\'s Archive. Finish tales to unlock more.'));
      const grow = el('div', { class: 'grid' });
      cr.gift = cr.gift || 'none';
      Object.keys(LEGACY_GIFTS).forEach(k => {
        const gft = LEGACY_GIFTS[k], ok = unl.gifts.includes(k);
        grow.appendChild(el('button', { class: 'pick' + (cr.gift === k ? ' sel' : ''), disabled: ok ? undefined : 'disabled', onclick: () => { cr.gift = k; UI.renderCreation(); } },
          `<b>${ok ? '' : '🔒 '}${gft.name}</b><small>${gft.desc}</small>${ok ? '' : `<small class="muted">Unlock: ${gft.hint}</small>`}`));
      });
      root.appendChild(grow);
      return;
    }
    if (cr.bondStep) {
      const [a, b] = cr.chars;
      root.appendChild(el('h2', {}, `How do ${esc(a.name)} and ${esc(b.name)} know each other?`));
      root.appendChild(el('p', { class: 'muted' }, 'Your bond grows or frays with what you choose together. A strong bond unlocks "Fight as One"; a broken one means you can no longer help each other.'));
      const g = el('div', { class: 'grid' });
      Object.keys(BONDS).forEach(k => g.appendChild(el('button', { class: 'pick' + (cr.bondType === k ? ' sel' : ''), onclick: () => { cr.bondType = k; UI.renderCreation(); } },
        `<b>${BONDS[k].name}</b><small class="bon">Starting bond ${BONDS[k].start}/10</small><small>${BONDS[k].desc}</small>`)));
      root.appendChild(g);
      const nav = el('div', { class: 'nav-row' });
      nav.appendChild(el('button', { class: 'btn ghost', onclick: () => { cr.bondStep = false; cr.chars.pop(); cr.draft = cr.drafts[cr.idx]; UI.renderCreation(); } }, '← Back'));
      nav.appendChild(el('button', { class: 'btn primary', disabled: cr.bondType ? undefined : 'disabled', onclick: () => Engine.newGame(cr.chars, { difficulty: cr.difficulty || 'normal', bondType: cr.bondType, gift: cr.gift }) }, 'Begin the tale ⚔️'));
      root.appendChild(nav);
      return;
    }
    const d = cr.draft;
    root.appendChild(el('h2', {}, cr.count === 2 ? `Player ${cr.idx + 1}: create your hero` : 'Create your hero'));
    const nameRow = el('div', { class: 'name-row' });
    const input = el('input', { type: 'text', maxlength: 20, placeholder: 'Hero name', value: d.name });
    input.addEventListener('input', () => { d.name = input.value; });
    nameRow.appendChild(el('label', {}, 'Name'));
    nameRow.appendChild(input);
    nameRow.appendChild(el('button', { class: 'btn small ghost', onclick: () => { d.name = UI.randomName(); UI.renderCreation(); } }, '🎲 Random'));
    root.appendChild(nameRow);

    root.appendChild(el('h3', {}, 'Race'));
    const rg = el('div', { class: 'grid' });
    Object.keys(RACES).forEach(id => {
      const r = RACES[id];
      const bonus = Object.keys(r.bonus).map(s => `${s.toUpperCase()} +${r.bonus[s]}`).join(', ');
      rg.appendChild(el('button', { class: 'pick' + (d.race === id ? ' sel' : ''), onclick: () => { d.race = id; UI.renderCreation(); } },
        `<div class="pick-icon">${r.icon}</div><b>${r.name}</b><small class="bon">${bonus}</small><small>${r.trait}</small>`));
    });
    root.appendChild(rg);

    root.appendChild(el('h3', {}, 'Class'));
    const cg = el('div', { class: 'grid' });
    Object.keys(CLASSES).forEach(id => {
      const c = CLASSES[id];
      cg.appendChild(el('button', { class: 'pick' + (d.cls === id ? ' sel' : ''), onclick: () => { d.cls = id; UI.renderCreation(); } },
        `<div class="pick-icon">${c.icon}</div><b>${c.name}</b><small class="bon">d${c.hd} HP · ${c.priority[0].toUpperCase()}</small><small>${c.desc}</small><small class="muted">Skills: ${c.skills.map(s => SKILLS[s].name).join(', ')}</small><small class="muted">Trees: ${c.tree.map(t => t.name).join(' / ')}</small>`));
    });
    root.appendChild(cg);

    root.appendChild(el('h3', {}, 'Background'));
    const bg = el('div', { class: 'grid' });
    const taken = cr.chars.map(c => c.background);
    Object.keys(BACKGROUNDS).forEach(id => {
      const b = BACKGROUNDS[id];
      const t = taken.includes(id);
      bg.appendChild(el('button', { class: 'pick' + (d.bg === id ? ' sel' : ''), disabled: t ? 'disabled' : undefined, onclick: () => { d.bg = id; UI.renderCreation(); } },
        `<div class="pick-icon">${b.icon}</div><b>${b.name}</b><small class="bon">${b.perk}</small><small>${b.desc}</small>${t ? '<small class="muted">Taken by the other hero</small>' : ''}`));
    });
    root.appendChild(bg);

    root.appendChild(el('h3', {}, 'Ability Scores'));
    const sr = el('div', { class: 'stat-mode' });
    sr.appendChild(el('button', { class: 'btn small' + (d.mode === 'standard' ? ' primary' : ''), onclick: () => { d.mode = 'standard'; d.array = Character.STANDARD_ARRAY.slice(); UI.renderCreation(); } }, 'Standard array'));
    sr.appendChild(el('button', { class: 'btn small' + (d.mode === 'rolled' ? ' primary' : ''), onclick: () => { d.mode = 'rolled'; d.array = Character.rollStatArray(); UI.renderCreation(); } }, d.mode === 'rolled' ? '🎲 Reroll 4d6' : '🎲 Roll 4d6 (drop lowest)'));
    sr.appendChild(el('span', { class: 'muted' }, ` Scores: ${d.array.join(', ')} — assigned to suit your class.`));
    root.appendChild(sr);

    if (d.race && d.cls) {
      const preview = Character.create(d.name || 'Hero', d.race, d.cls, d.array);
      const pv = el('div', { class: 'preview' });
      pv.innerHTML = `<div class="stat-row">${STATS.map(s => `<div class="stat"><small>${s.toUpperCase()}</small><b>${preview.stats[s]}</b><span>${signed(mod(preview.stats[s]))}</span></div>`).join('')}</div>
        <div class="derived"><span>❤️ HP ${Character.maxHp(preview)}</span><span>🛡️ AC ${Character.ac(preview)}</span><span>⚔️ ${Character.weapon(preview).name} ${signed(Character.attackBonus(preview))}</span><span>🔮 Focus ${Character.maxFocus(preview)}</span><span>✨ ${ABILITIES[CLASSES[d.cls].ability].name}</span></div>`;
      root.appendChild(pv);
    }
    const nav = el('div', { class: 'nav-row' });
    nav.appendChild(el('button', { class: 'btn ghost', onclick: () => { if (cr.idx > 0) { cr.idx--; cr.draft = cr.drafts[cr.idx]; cr.chars.pop(); } else { cr.count = null; } UI.renderCreation(); } }, '← Back'));
    const ready = d.race && d.cls && d.bg;
    nav.appendChild(el('button', { class: 'btn primary', disabled: ready ? undefined : 'disabled', onclick: () => {
      if (!d.name.trim()) d.name = UI.randomName();
      const ch = Character.create(d.name.trim(), d.race, d.cls, d.array);
      ch.background = d.bg;
      ch.corruption = BACKGROUNDS[d.bg].corruption || 0;
      ch.hp = Character.maxHp(ch);
      cr.chars.push(ch);
      if (cr.chars.length < cr.count) { cr.idx++; UI.newDraft(); UI.renderCreation(); }
      else if (cr.count === 2) { cr.bondStep = true; UI.renderCreation(); }
      else { Engine.newGame(cr.chars, { difficulty: cr.difficulty || 'normal', gift: cr.gift }); }
    } }, cr.chars.length + 1 < cr.count ? 'Next hero →' : cr.count === 2 ? 'Choose your bond →' : 'Begin the tale ⚔️'));
    root.appendChild(nav);
  },

  newDraft() {
    const cr = UI.cr;
    cr.drafts = cr.drafts || [];
    cr.draft = { name: UI.randomName(), race: null, cls: null, bg: null, mode: 'standard', array: Character.STANDARD_ARRAY.slice() };
    cr.drafts[cr.idx] = cr.draft;
  },

  randomName() {
    const a = ['Aric', 'Brenna', 'Corin', 'Dessa', 'Eamon', 'Fen', 'Garrick', 'Hale', 'Isolde', 'Jory', 'Kael', 'Lira', 'Maren', 'Nym', 'Orrin', 'Perrin', 'Rowan', 'Sabine', 'Ulric', 'Vesna', 'Wren', 'Yara', 'Zev', 'Thorne', 'Bryn', 'Kestrel', 'Ash', 'Morrow'];
    return Dice.pick(a);
  },
};
