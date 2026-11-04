/* ===========================================================
   PUZZLE UI — interactive panels for each puzzle type.
   Rendered into the story's choice area.
   =========================================================== */

UI.showPuzzle = function (ch, st) {
  const box = $('#story-choices');
  box.innerHTML = '';
  box.classList.remove('waiting');
  const panel = el('div', { class: 'check-panel puzzle-panel' });
  box.appendChild(panel);
  const p = ch.puzzle;
  const done = (result, extra) => { if (typeof Sound !== 'undefined') Sound.play(result === 'solved' ? 'crit' : 'fail'); Puzzles.finish(ch, result, extra); };
  const head = (title, sub) => `<div class="check-head"><b>${Icon('puzzle')} ${title}</b><span>${sub}</span></div>`;
  const msg = el('div', { class: 'puzzle-msg' });
  const hintBtn = (label, skill, dc, onOk, onFail) => {
    const b = el('button', { class: 'btn small ghost' }, `${Icon('star')} ${label} <small>(${SKILLS[skill] ? SKILLS[skill].name : STAT_NAMES[skill]} DC ${dc})</small>`);
    b.addEventListener('click', () => {
      b.disabled = true;
      const r = Puzzles.hintRoll(skill, dc);
      if (typeof Sound !== 'undefined') Sound.play('dice');
      msg.innerHTML = `${esc(r.c.name)} thinks it over (rolled ${r.roll}, total ${r.total} vs ${dc}): ${r.ok ? '<b>an idea!</b>' : 'nothing comes.'}`;
      if (r.ok) onOk(r); else if (onFail) onFail(r);
      Engine.save();
    });
    return b;
  };
  const giveUp = (label = 'Give up') => el('button', { class: 'btn small ghost', onclick: () => done('failed') }, label);

  /* ---------- Riddle ---------- */
  if (p.type === 'riddle') {
    const render = () => {
      panel.innerHTML = head(ch.label.replace(/<[^>]+>/g, ''), `${st.tries} ${st.tries === 1 ? 'try' : 'tries'} left`) + `<p class="riddle">“${st.q}”</p>`;
      const row = el('div', { class: 'riddle-row' });
      const input = el('input', { type: 'text', class: 'ai-input', placeholder: 'Your answer…', maxlength: 40 });
      const answer = el('button', { class: 'btn primary' }, 'Answer');
      const check = val => {
        const norm = String(val).toLowerCase().replace(/[^a-z ]/g, '').replace(/^(a|an|the|his|her|their|your|my)\s+/, '').trim();
        return st.a.some(x => x.replace(/^(a|an|the|his|her|their|your|my)\s+/, '') === norm);
      };
      const tryIt = val => {
        if (!String(val).trim()) return;
        if (check(val)) { done('solved'); return; }
        st.tries--; Engine.save();
        if (typeof Sound !== 'undefined') Sound.play('fail');
        if (st.tries <= 0) { done('failed'); return; }
        render(); msg.textContent = `“${val}”… No. Think again.`;
      };
      answer.addEventListener('click', () => tryIt(input.value));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') tryIt(input.value); });
      row.appendChild(input); row.appendChild(answer);
      panel.appendChild(row);
      if (st.showOptions) {
        const opts = el('div', { class: 'action-row' });
        st.options.filter(o => !st.removed.includes(o)).forEach(o => opts.appendChild(el('button', { class: 'btn', onclick: () => tryIt(o) }, esc(o))));
        panel.appendChild(opts);
      }
      const tools = el('div', { class: 'puzzle-tools' });
      if (!st.showOptions) tools.appendChild(el('button', { class: 'btn small ghost', onclick: () => { st.showOptions = true; Engine.save(); render(); } }, 'Show four possible answers'));
      if (!st.hinted) tools.appendChild(hintBtn('Recall an old saying', 'lore', 12, () => { st.hinted = true; st.showOptions = true; st.removed = st.options.filter(o => !check(o)).slice(0, 2); render(); msg.innerHTML += ' Two of the answers can\'t be right.'; }, () => { st.hinted = true; }));
      tools.appendChild(giveUp());
      panel.appendChild(tools); panel.appendChild(msg);
      input.focus();
    };
    render();
    return;
  }

  /* ---------- Cipher wheel ---------- */
  if (p.type === 'cipher') {
    let shift = 0;
    const coded = Puzzles.caesar(st.plain, st.shift);
    const render = () => {
      const shown = Puzzles.caesar(coded, -shift);
      panel.innerHTML = head('A coded letter', 'Turn the Keeper\'s cipher wheel until the letter makes sense.');
      const text = el('div', { class: 'cipher-text' }, esc(shown));
      panel.appendChild(text);
      const wheel = el('div', { class: 'cipher-wheel' });
      wheel.appendChild(el('button', { class: 'btn', onclick: () => { shift = (shift + 25) % 26; if (typeof Sound !== 'undefined') Sound.play('click'); render(); } }, Icon('back')));
      wheel.appendChild(el('div', { class: 'wheel-val' }, `${shift}<small>wheel setting</small>`));
      wheel.appendChild(el('button', { class: 'btn', onclick: () => { shift = (shift + 1) % 26; if (typeof Sound !== 'undefined') Sound.play('click'); render(); } }, Icon('chevron')));
      wheel.appendChild(el('button', { class: 'btn primary', onclick: () => {
        if (((shift - st.shift) % 26 + 26) % 26 === 0) { done('solved'); return; }
        st.tries--; Engine.save();
        if (st.tries <= 0) { done('failed'); return; }
        render(); msg.textContent = `That isn't it — the words are still nonsense. (${st.tries} left)`;
      } }, 'It reads true'));
      panel.appendChild(wheel);
      const tools = el('div', { class: 'puzzle-tools' });
      if (!st.hinted) tools.appendChild(hintBtn('Spot a familiar word', 'investigation', 12, () => { st.hinted = true; shift = st.shift % 26; render(); msg.innerHTML += ' The first words leap out at you — the wheel is set.'; }, () => { st.hinted = true; }));
      tools.appendChild(giveUp('Burn it unread'));
      panel.appendChild(tools); panel.appendChild(msg);
    };
    render();
    return;
  }

  /* ---------- Rune code lock ---------- */
  if (p.type === 'code') {
    let cur = [];
    const score = g => { let exact = 0, near = 0; g.forEach((r, i) => { if (st.code[i] === r) exact++; else if (st.code.includes(r)) near++; }); return { exact, near }; };
    const render = () => {
      const left = st.tries - st.guesses.length;
      panel.innerHTML = head(p.title || 'The rune lock', `Set four different runes. ● right rune, right place · ○ right rune, wrong place · ${left} ${left === 1 ? 'try' : 'tries'} left`);
      if (p.flavor) panel.appendChild(el('p', { class: 'muted' }, p.flavor));
      const hist = el('div', { class: 'code-hist' });
      st.guesses.forEach(g => { const s = score(g); hist.appendChild(el('div', { class: 'code-row' }, `${g.map(i => `<span class="rune">${RUNES[i].s}</span>`).join('')}<span class="pegs">${'●'.repeat(s.exact)}${'○'.repeat(s.near)}${s.exact + s.near === 0 ? '—' : ''}</span>`)); });
      panel.appendChild(hist);
      const slots = el('div', { class: 'code-row current' }, [0, 1, 2, 3].map(i => `<span class="rune slot ${st.known[i] !== undefined ? 'known' : ''}">${cur[i] !== undefined ? RUNES[cur[i]].s : st.known[i] !== undefined ? `<small>${RUNES[st.known[i]].s}?</small>` : '·'}</span>`).join(''));
      panel.appendChild(slots);
      const pad = el('div', { class: 'rune-pad' });
      RUNES.forEach((r, i) => pad.appendChild(el('button', { class: 'btn rune-btn', disabled: cur.includes(i) || cur.length >= 4 ? 'disabled' : undefined, title: r.n, onclick: () => { cur.push(i); if (typeof Sound !== 'undefined') Sound.play('click'); render(); } }, `${r.s}<small>${r.n}</small>`)));
      panel.appendChild(pad);
      const act = el('div', { class: 'puzzle-tools' });
      act.appendChild(el('button', { class: 'btn small', disabled: cur.length ? undefined : 'disabled', onclick: () => { cur.pop(); render(); } }, 'Undo'));
      act.appendChild(el('button', { class: 'btn primary', disabled: cur.length === 4 ? undefined : 'disabled', onclick: () => {
        st.guesses.push(cur.slice()); Engine.save();
        const s = score(cur); cur = [];
        if (s.exact === 4) { done('solved', { guesses: st.guesses.length }); return; }
        if (typeof Sound !== 'undefined') Sound.play(s.exact ? 'hit' : 'miss');
        if (st.guesses.length >= st.tries) { done('failed'); return; }
        render();
      } }, 'Turn the lock'));
      if (!st.hinted) act.appendChild(hintBtn(p.hintLabel || 'Study the wear on the runes', p.hintSkill || 'investigation', 12, () => { st.hinted = true; const i = Dice.pick([0, 1, 2, 3].filter(j => st.known[j] === undefined)); st.known[i] = st.code[i]; render(); msg.innerHTML += ` One rune is worn smooth by use: position ${i + 1} is ${RUNES[st.code[i]].s}.`; }, () => { st.hinted = true; }));
      act.appendChild(giveUp(p.giveUpLabel || 'Give up'));
      panel.appendChild(act); panel.appendChild(msg);
    };
    render();
    return;
  }

  /* ---------- Bell sequence ---------- */
  if (p.type === 'bells') {
    let input = [], playing = false;
    const ring = (i, when = 0) => setTimeout(() => {
      const b = panel.querySelector(`.bell[data-i="${i}"]`);
      if (b) { b.classList.add('ringing'); setTimeout(() => b.classList.remove('ringing'), 380); }
      if (typeof Sound !== 'undefined' && Settings.data.sfx && Sound.ensure()) { Sound.tone(BELLS[i].f, 0.9, 'sine', 0.22); Sound.tone(BELLS[i].f * 2.01, 0.6, 'sine', 0.05); }
    }, when);
    const play = () => {
      playing = true; render();
      st.seq.forEach((b, k) => ring(b, 500 + k * 750));
      setTimeout(() => { playing = false; render(); }, 500 + st.seq.length * 750);
    };
    const render = () => {
      panel.innerHTML = head('The monks\' chant', `Listen to the pattern, then ring the bells in the same order (${st.seq.length} notes). ${st.tries} ${st.tries === 1 ? 'attempt' : 'attempts'} left.`);
      const row = el('div', { class: 'bells' });
      BELLS.forEach((b, i) => {
        const btn = el('button', { class: 'bell', 'data-i': i, style: `--bell:${b.c}`, disabled: playing ? 'disabled' : undefined }, `${Icon('bell')}<small>${b.n}</small>`);
        btn.addEventListener('click', () => {
          if (playing) return;
          ring(i);
          input.push(i);
          const k = input.length - 1;
          if (st.seq[k] !== i) {
            st.tries--; input = []; Engine.save();
            if (st.tries <= 0) { setTimeout(() => done('failed'), 500); return; }
            msg.textContent = 'A sour note. The wyrm stirs. Start again.';
            setTimeout(render, 400);
            return;
          }
          if (input.length === st.seq.length) { setTimeout(() => done('solved'), 700); return; }
          msg.textContent = `${'♪ '.repeat(input.length)}`;
        });
        row.appendChild(btn);
      });
      panel.appendChild(row);
      const tools = el('div', { class: 'puzzle-tools' });
      tools.appendChild(el('button', { class: 'btn small', disabled: playing || st.listens <= 0 ? 'disabled' : undefined, onclick: () => { st.listens--; input = []; Engine.save(); play(); } }, `${Icon('bell')} Listen to the chant (${st.listens} left)`));
      if (!st.hinted) tools.appendChild(hintBtn('Ask for it once more, slower', 'persuasion', 11, () => { st.hinted = true; st.listens++; render(); }, () => { st.hinted = true; }));
      tools.appendChild(giveUp('Back away'));
      panel.appendChild(tools); panel.appendChild(msg);
      if (playing) msg.textContent = 'Listen…';
    };
    render();
    if (st.listens > 0 && !st.heard) { st.heard = true; st.listens--; Engine.save(); play(); }
    return;
  }

  /* ---------- Whodunit ---------- */
  if (p.type === 'whodunit') {
    if (!st) { done('failed'); return; }
    let pick = null;
    const render = () => {
      panel.innerHTML = head('Find the accomplice', 'One of these masked guests will carry the fragment out for the grey mask. Use what you have learned.');
      const clues = el('div', { class: 'clue-list' }, `<b>What you know:</b><ul>${st.clues.slice(0, st.known).map(c => `<li>${Puzzles.clueText(c)}</li>`).join('')}</ul>${st.known < st.clues.length ? '<small class="muted">You may not know enough to be certain.</small>' : ''}`);
      panel.appendChild(clues);
      const grid = el('div', { class: 'guest-grid' });
      st.guests.forEach((g, i) => {
        const card = el('button', { class: 'guest' + (pick === i ? ' sel' : ''), onclick: () => { pick = i; render(); } },
          `<b>${Icon('mask')} ${g.mask}</b>${Object.keys(GUEST_ATTRS).map(k => `<small>${GUEST_ATTRS[k].label}: ${GUEST_ATTRS[k].vals[g[k]]}</small>`).join('')}`);
        grid.appendChild(card);
      });
      panel.appendChild(grid);
      const tools = el('div', { class: 'puzzle-tools' });
      tools.appendChild(el('button', { class: 'btn primary', disabled: pick === null ? 'disabled' : undefined, onclick: () => done(pick === st.agent ? 'solved' : 'failed', { accused: st.guests[pick].mask, agentMask: st.guests[st.agent].mask }) }, pick === null ? 'Choose a guest' : `Accuse the ${st.guests[pick].mask}`));
      if (!st.hinted && st.known < st.clues.length) tools.appendChild(hintBtn('Watch the room a while longer', 'insight', 13, () => { st.hinted = true; st.known++; render(); msg.innerHTML += ' You notice something new.'; }, () => { st.hinted = true; }));
      tools.appendChild(el('button', { class: 'btn small ghost', onclick: () => Engine.go(G.scene, true) }, 'Not yet'));
      panel.appendChild(tools); panel.appendChild(msg);
    };
    render();
    return;
  }

  /* ---------- Pip's dice: push your luck ---------- */
  if (p.type === 'dice') {
    const render = () => {
      panel.innerHTML = head(p.title || 'Pip\'s Bones', `Beat ${p.opponent || 'Pip'}'s score of <b>${st.pip}</b>. Roll as often as you like — but a 1 busts you. Stake: ${st.bet} gold.`);
      panel.appendChild(el('div', { class: 'dice-tray' }, st.rolls.map(r => `<span class="die ${r === 1 ? 'bust' : ''}">${r}</span>`).join('') || '<span class="muted">No rolls yet.</span>'));
      panel.appendChild(el('div', { class: 'dice-score' }, `Your total: <b>${st.pot}</b> &nbsp; vs &nbsp; ${p.opponent || 'Pip'}: <b>${st.pip}</b>`));
      const tools = el('div', { class: 'puzzle-tools' });
      const bust = st.rolls.length && st.rolls[st.rolls.length - 1] === 1;
      if (!bust) {
        tools.appendChild(el('button', { class: 'btn primary', onclick: () => {
          const r = Dice.d(6); st.rolls.push(r);
          if (typeof Sound !== 'undefined') Sound.play('dice');
          if (r !== 1) st.pot += r;
          Engine.save(); render();
        } }, `${Icon('dice')} Roll`));
        tools.appendChild(el('button', { class: 'btn', disabled: st.rolls.length ? undefined : 'disabled', onclick: () => {
          if (st.pot > st.pip) done('solved', { won: true }); else if (st.pot === st.pip) done('failed', { tie: true }); else done('failed', { lost: true });
        } }, `${Icon('interrupt')} Stop at ${st.pot}`));
      } else {
        msg.innerHTML = '<b>A one. Bust!</b>';
        if (!st.loaded) tools.appendChild(hintBtn('Palm the die and reroll', 'sleight', 13, () => { st.loaded = true; st.rolls.pop(); render(); msg.innerHTML = 'Nobody saw a thing.'; }, () => { st.loaded = true; st.caught = true; setTimeout(() => done('failed', { lost: true, caught: true }), 900); }));
        tools.appendChild(el('button', { class: 'btn', onclick: () => done('failed', { lost: true }) }, 'Pay up'));
      }
      panel.appendChild(tools); panel.appendChild(msg);
    };
    render();
  }
};
