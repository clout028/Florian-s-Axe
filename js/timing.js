/* ===========================================================
   TIMING CHALLENGE — the player's own skill decides outcomes.
   A marker sweeps across a bar; stop it inside the target zone.
     gold centre  = perfect (critical)
     green zone   = success
     amber edges  = so close (succeed at a cost / partial block)
     elsewhere    = miss
   The hero's stats set how wide the zone is and how fast the
   marker moves, so a strong character is easier to play well.
   "Classic dice" in Settings switches back to d20 rolls.
   =========================================================== */

UI.skillMode = function () { return !UI.fast && !(typeof Settings !== 'undefined' && Settings.data.dice); };

/* p: the chance a die roll would have had (0..1). opts: label, sub, near (show amber band), verb */
UI.timing = function (container, opts, done) {
  const p = Math.max(0.08, Math.min(0.95, opts.p));
  const w = 0.10 + 0.36 * p;                    // success zone width
  const critW = Math.max(0.03, w * 0.2);
  const nearW = opts.near === false ? 0 : 0.05;
  const c = 0.5 * w + nearW + Math.random() * (1 - w - 2 * nearW); // zone centre, anywhere on the bar
  const period = 950 + 1100 * p;                // ms for one sweep; harder = faster
  const pct = x => (x * 100).toFixed(2) + '%';
  const wrap = el('div', { class: 'timing' });
  wrap.innerHTML = `${opts.label ? `<div class="timing-label">${opts.label}</div>` : ''}${opts.sub ? `<div class="timing-sub">${opts.sub}</div>` : ''}
    <div class="tbar" role="button" tabindex="0" aria-label="Stop the marker inside the zone">
      ${nearW ? `<div class="tz near" style="left:${pct(c - w / 2 - nearW)};width:${pct(w + 2 * nearW)}"></div>` : ''}
      <div class="tz hit" style="left:${pct(c - w / 2)};width:${pct(w)}"></div>
      <div class="tz crit" style="left:${pct(c - critW / 2)};width:${pct(critW)}"></div>
      <div class="tmark"></div>
    </div>
    <button class="btn primary big tstop">${opts.verb || 'Now!'}</button>
    <div class="timing-hint">Stop the marker in the green zone — gold is perfect. Tap the button, the bar, or press Space.</div>`;
  container.innerHTML = '';
  container.appendChild(wrap);
  const mark = wrap.querySelector('.tmark'), bar = wrap.querySelector('.tbar'), btn = wrap.querySelector('.tstop');
  let pos = 0, raf = 0, stopped = false;
  const t0 = performance.now() - Math.random() * period;
  const frame = now => {
    const t = ((now - t0) % (2 * period)) / period;       // 0..2
    const lin = t < 1 ? t : 2 - t;                         // triangle wave
    pos = 0.5 - 0.5 * Math.cos(lin * Math.PI);             // ease at the ends
    mark.style.left = pct(pos);
    if (!stopped) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const stop = ev => {
    if (stopped) return;
    if (ev) ev.preventDefault();
    stopped = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', key);
    const d = Math.abs(pos - c);
    const q = d <= critW / 2 ? 'crit' : d <= w / 2 ? 'hit' : d <= w / 2 + nearW ? 'near' : 'miss';
    wrap.classList.add('done', 'q-' + q);
    btn.disabled = true;
    btn.textContent = { crit: 'Perfect!', hit: 'Success!', near: 'So close…', miss: 'Missed' }[q];
    if (typeof Sound !== 'undefined') Sound.play(q === 'crit' ? 'crit' : q === 'hit' ? 'success' : q === 'near' ? 'miss' : 'fail');
    setTimeout(() => done(q), 650);
  };
  const key = e => { if (e.code === 'Space' || e.key === 'Enter') stop(e); };
  btn.addEventListener('pointerdown', stop);
  bar.addEventListener('pointerdown', stop);
  btn.addEventListener('click', stop);
  document.addEventListener('keydown', key);
};
