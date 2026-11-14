/* ===========================================================
   NARRATION — reads the story aloud with the device's built-in
   voices (free, works offline). Spoken lines in quotes are read
   in a second, lower voice so characters stand apart from the
   narrator. Toggle with the speaker button; voice and speed are
   in Settings.
   =========================================================== */

const Narrate = {
  supported: typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
  voices: [],
  _token: 0,

  init() {
    if (!Narrate.supported) return;
    if (Settings.data.narrate === undefined) Settings.data.narrate = true;
    if (Settings.data.narrateRate === undefined) Settings.data.narrateRate = 1;
    const load = () => { Narrate.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
  },

  on() { return Narrate.supported && Settings.data.narrate && !UI.fast; },

  /* Prefer the most natural-sounding voice the device offers. */
  best() {
    const vs = Narrate.voices;
    if (!vs.length) return null;
    const saved = vs.find(v => v.name === Settings.data.narrateVoice);
    if (saved) return saved;
    const score = v => {
      const n = v.name;
      let s = 0;
      if (/natural|neural|premium|enhanced|siri/i.test(n)) s += 50;
      if (/Google UK English Male|Daniel|Ryan|Guy|Arthur|Oliver|George|Thomas|Sonia|Libby|Serena|Samantha|Aria|Jenny/i.test(n)) s += 20;
      if (/en-GB/i.test(v.lang)) s += 8;
      if (/Google/i.test(n)) s += 6;
      if (/compact|eSpeak|Albert|Bad News|Bells|Boing|Bubbles|Cellos|Jester|Organ|Trinoids|Whisper|Zarvox|Fred|Junior|Ralph|Kathy|Princess|Superstar|Wobble|Good News|Deranged|Hysterical/i.test(n)) s -= 100;
      if (v.localService) s += 2;
      return s;
    };
    return vs.slice().sort((a, b) => score(b) - score(a))[0];
  },

  /* HTML → list of { text, quote } pieces, split into sentences. */
  pieces(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html || '').replace(/<\/(p|div|li|h\d)>/gi, '. </$1>').replace(/<br\s*\/?>/gi, '. ');
    tmp.querySelectorAll('.chronicle, small, .notes').forEach(e => e.remove());
    const text = tmp.textContent.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').replace(/—/g, ', ').replace(/…/g, '. ').trim();
    const out = [];
    text.split(/(“[^”]*”|"[^"]*")/).forEach(part => {
      if (!part.trim()) return;
      const quote = /^[“"]/.test(part);
      const clean = part.replace(/[“”"]/g, '').trim();
      (clean.match(/[^.!?]+[.!?]*\s*/g) || [clean]).forEach(sen => { const t = sen.trim(); if (t && /[a-z0-9]/i.test(t)) out.push({ text: t, quote }); });
    });
    return out;
  },

  speak(html, opts = {}) {
    if (!Narrate.on()) return;
    const mine = ++Narrate._token;
    speechSynthesis.cancel();
    const list = Narrate.pieces(html);
    if (!list.length) return;
    const voice = Narrate.best();
    const rate = Settings.data.narrateRate || 1;
    if (typeof Sound !== 'undefined' && Sound.amb && Sound.ctx) Sound.amb.g.gain.setTargetAtTime(0.02, Sound.ctx.currentTime, 0.3);
    list.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.text);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = rate * (p.quote ? 0.96 : 1);
      u.pitch = p.quote ? 0.72 : 1;
      if (i === list.length - 1) u.onend = () => { if (mine === Narrate._token && typeof Sound !== 'undefined' && Sound.amb && Sound.ctx) Sound.amb.g.gain.setTargetAtTime(0.06, Sound.ctx.currentTime, 0.6); };
      speechSynthesis.speak(u);
    });
  },

  stop() { if (Narrate.supported) { Narrate._token++; speechSynthesis.cancel(); } },

  toggle() {
    Settings.data.narrate = !Settings.data.narrate;
    Settings.save();
    if (!Settings.data.narrate) Narrate.stop();
    else if (UI._scene && G) Narrate.speak(`${UI._scene.title}. ${UI._scene.text}`);
    Narrate.button();
  },

  button() {
    const b = document.getElementById('narrate-btn');
    if (!b) return;
    if (!Narrate.supported) { b.classList.add('hidden'); return; }
    b.innerHTML = Icon(Settings.data.narrate ? 'speaker' : 'mute');
    b.title = Settings.data.narrate ? 'Narration on — tap to silence' : 'Narration off — tap to hear the story';
    b.classList.toggle('on', !!Settings.data.narrate);
  },
};
