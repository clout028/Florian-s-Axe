/* ===========================================================
   VOICE — narration through the device's own speech voices.
   On iPhone/iPad this prefers the best installed system voice
   (Siri / Premium / Enhanced voices, then well-known Apple
   voices like Daniel, Serena or Samantha). Nothing is uploaded:
   the Web Speech API speaks on-device.
   =========================================================== */

const Voice = {
  ok: typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
  voices: [],
  queue: [],
  playing: false,
  token: 0,
  unlocked: false,

  /* Names that sound like novelty toys, never narration. */
  NOVELTY: /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|princess|hysterical|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i,
  /* Good narrators, best first (Apple's English voices). */
  PREFERRED: ['daniel', 'serena', 'arthur', 'oliver', 'martha', 'ava', 'evan', 'nathan', 'zoe', 'samantha', 'allison', 'tom', 'moira', 'karen', 'alex', 'susan', 'fiona', 'tessa'],

  init() {
    if (!Voice.ok) return;
    const load = () => { Voice.voices = speechSynthesis.getVoices() || []; };
    load();
    const after = () => { load(); if (typeof Settings !== 'undefined') Voice.firstRunDefault(); if (typeof UI !== 'undefined' && UI.syncVoiceButton) UI.syncVoiceButton(); };
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', after);
    // Some browsers only populate the list a moment later.
    setTimeout(after, 400); setTimeout(after, 1500);
  },

  english() { return Voice.voices.filter(v => /^en([-_]|$)/i.test(v.lang) && !Voice.NOVELTY.test(v.name)); },

  /* Higher is better. Prefers Apple on-device voices with the highest quality tier. */
  score(v) {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/premium/.test(n) || /premium/i.test(v.voiceURI || '')) s += 60;
    else if (/enhanced/.test(n) || /enhanced/i.test(v.voiceURI || '')) s += 45;
    if (/siri/.test(n) || /siri/i.test(v.voiceURI || '')) s += 50;
    if (/com\.apple/i.test(v.voiceURI || '')) s += 22;
    if (/compact/i.test(v.voiceURI || '')) s -= 6;
    if (v.localService) s += 8;
    const base = n.replace(/\(.*\)/, '').replace(/[^a-z ]/g, '').trim().split(' ')[0];
    const k = Voice.PREFERRED.indexOf(base);
    if (k >= 0) s += 20 - k;
    if (/en[-_]gb/i.test(v.lang)) s += 4;          // a storyteller's accent
    if (/en[-_](us|au|ie|za)/i.test(v.lang)) s += 1;
    if (/google|microsoft/.test(n) && !/com\.apple/i.test(v.voiceURI || '')) s -= 4;
    return s;
  },

  ranked() { return Voice.english().sort((a, b) => Voice.score(b) - Voice.score(a)); },
  best() { return Voice.ranked()[0] || null; },
  isApple(v) { return !!v && /com\.apple/i.test(v.voiceURI || ''); },

  current() {
    const pick = Settings.data.voiceName;
    if (pick && pick !== 'auto') { const v = Voice.voices.find(x => x.voiceURI === pick || x.name === pick); if (v) return v; }
    return Voice.best();
  },

  /* First run: switch narration on by default only when a real Apple voice is installed. */
  firstRunDefault() {
    if (Settings.data.voiceSeen) return;
    const b = Voice.best();
    if (!b) return;
    Settings.data.voiceSeen = true;
    if (Voice.isApple(b) && Settings.data.voice === undefined) Settings.data.voice = true;
    Settings.save();
  },

  enabled() { return Voice.ok && !!Settings.data.voice; },

  /* iOS only allows speech after a tap; call from a click handler. */
  unlock() {
    if (!Voice.ok || Voice.unlocked) return;
    Voice.unlocked = true;
    try { const u = new SpeechSynthesisUtterance('.'); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* ignore */ }
  },

  /* Turn story HTML into spoken chunks. Quoted speech is flagged so it can sound different. */
  clean(html) {
    return String(html || '')
      .replace(/<\/p>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/[\u{1F300}-\u{1FAFF}☀-➿⭐]/gu, '')
      .replace(/\s+/g, ' ').trim();
  },

  chunks(text) {
    const out = [];
    const parts = text.split(/(["“][^"”]*["”])/g).filter(Boolean);
    parts.forEach(p => {
      const quote = /^["“]/.test(p);
      const body = p.replace(/^["“]|["”]$/g, '').trim();
      if (!body) return;
      // break long runs at sentence ends so the browser never truncates
      const sents = body.match(/[^.!?…]+[.!?…]*["”')\]]*\s*/g) || [body];
      let buf = '';
      sents.forEach(s => {
        if ((buf + s).length > 220 && buf) { out.push({ t: buf.trim(), quote }); buf = ''; }
        buf += s;
      });
      if (buf.trim()) out.push({ t: buf.trim(), quote });
    });
    return out;
  },

  cancel() {
    Voice.token++;
    Voice.queue = [];
    Voice.playing = false;
    if (Voice.ok) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    Voice.release();
  },

  /* Let the music come back up a moment after speech ends (so it doesn't pump between paragraphs). */
  release() {
    clearTimeout(Voice._rel);
    Voice._rel = setTimeout(() => { if (typeof Music !== 'undefined') Music.duck(false); }, 700);
  },

  /* Speak one block of HTML. Calls onstart when speech begins and onend when it finishes (or is unavailable). */
  speak(html, { onstart, onend } = {}) {
    if (!Voice.enabled()) { if (onstart) onstart(); if (onend) onend(false); return; }
    const chunks = Voice.chunks(Voice.clean(html));
    if (!chunks.length) { if (onstart) onstart(); if (onend) onend(false); return; }
    const my = ++Voice.token;
    const voice = Voice.current();
    const rate = Math.max(0.6, Math.min(1.3, Settings.data.voiceRate || 0.95));
    let i = 0, started = false, guard;
    const done = ok => { clearTimeout(guard); if (Voice.token === my && onend) onend(ok); };
    const next = () => {
      if (Voice.token !== my) return;
      if (i >= chunks.length) { Voice.release(); done(true); return; }
      const c = chunks[i++];
      const u = new SpeechSynthesisUtterance(c.t);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = c.quote ? rate * 1.03 : rate;
      u.pitch = c.quote ? 1.07 : 0.97;
      u.volume = 1;
      let advanced = false, wd;
      const advance = delay => { if (advanced) return; advanced = true; clearTimeout(wd); setTimeout(next, delay); };
      u.onstart = () => { if (!started) { started = true; if (onstart) onstart(); } };
      u.onend = () => advance(c.quote ? 60 : 110);
      u.onerror = e => { if (e && (e.error === 'canceled' || e.error === 'interrupted')) return; advance(50); };
      // Safety nets for engines that never fire events (iOS can drop onend on long lines): don't stall the story.
      clearTimeout(guard);
      guard = setTimeout(() => { if (!started && Voice.token === my) { started = true; if (onstart) onstart(); } }, 1800);
      const est = Math.max(2500, (c.t.length / (13 * rate)) * 1000 + 3500);
      wd = setTimeout(() => { if (Voice.token === my && !advanced) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } advance(0); } }, est);
      try { speechSynthesis.speak(u); } catch (e) { done(false); }
    };
    clearTimeout(Voice._rel);
    if (typeof Music !== 'undefined') Music.duck(true);
    next();
  },

  /* Say a line with no sync, e.g. a battle cry or a short outcome. */
  say(html) { if (Voice.enabled()) Voice.speak(html); },

  preview() {
    Voice.cancel();
    const was = Settings.data.voice; Settings.data.voice = true;
    Voice.speak('The woodcutter set down his axe, and the whole valley held its breath.', {});
    Settings.data.voice = was;
  },
};
Voice.init();
