/* ===========================================================
   AI GAME MASTER (optional, off by default)
   Lets players type their own action ("Do something else…").
   Claude judges it against the current scene and returns JSON:
   which skill and DC to roll, short narration, and — so the story
   stays coherent — either which existing option it counts as, or a
   small, bounded effect. The engine applies everything; the model
   never writes game state directly.

   Uses the official Anthropic TypeScript/JS SDK, loaded from a CDN
   as an ES module (this game has no build step). The API key is
   supplied by the player and kept only in this browser.
   =========================================================== */

const AI_SETTINGS_KEY = 'florians-axe-ai-v1';
const AI_SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.0.0/+esm';
const AI_MODEL = 'claude-opus-5-5';

const AI = {
  cfg: { enabled: false, apiKey: '' },
  _client: null,

  load() { try { Object.assign(AI.cfg, JSON.parse(localStorage.getItem(AI_SETTINGS_KEY) || '{}')); } catch (e) { /* ignore */ } },
  save() { try { localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(AI.cfg)); } catch (e) { /* ignore */ } AI._client = null; },
  ready() { return AI.cfg.enabled && !!AI.cfg.apiKey; },

  async client() {
    if (AI._client) return AI._client;
    const mod = await import(AI_SDK_URL);
    const Anthropic = mod.default || mod.Anthropic;
    // The key belongs to the player and stays on their device; requests go straight to the API.
    AI._client = new Anthropic({ apiKey: AI.cfg.apiKey, dangerouslyAllowBrowser: true });
    return AI._client;
  },

  SCHEMA: {
    type: 'object',
    additionalProperties: false,
    required: ['feasible', 'attempt', 'skill', 'dc', 'counts_as', 'success_text', 'failure_text', 'success_effect', 'failure_effect'],
    properties: {
      feasible: { type: 'boolean', description: 'false if the action is impossible here, nonsensical, or would break the story' },
      attempt: { type: 'string', description: '1-2 sentences, second person, describing the hero beginning the attempt (or, if infeasible, why it cannot work)' },
      skill: { type: 'string', enum: Object.keys(SKILLS).concat(['str', 'dex', 'con', 'int', 'wis', 'cha']) },
      dc: { type: 'integer', description: 'Difficulty 8 (easy) to 20 (nearly impossible)' },
      counts_as: { type: 'integer', description: 'Index of the listed option this action is essentially an alternative way of doing, or -1 if none' },
      success_text: { type: 'string', description: '1-3 sentences on success. If counts_as >= 0, end in a way that leads naturally into that option\'s outcome.' },
      failure_text: { type: 'string', description: '1-3 sentences on failure.' },
      success_effect: { type: 'string', enum: ['none', 'small_xp', 'minor_heal', 'gold_small', 'focus', 'doom_minus'] },
      failure_effect: { type: 'string', enum: ['none', 'minor_hurt', 'gold_loss', 'doom_plus', 'corruption'] },
    },
  },

  /* Everything Claude needs to judge the action fairly and keep the story consistent. */
  context(sceneInfo, mappable, actor) {
    const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const heroes = G.party.map(c => `${c.name}: level ${c.level} ${Character.describe(c)}${c.background ? ', ' + BACKGROUNDS[c.background].name : ''}; HP ${c.hp}/${Character.maxHp(c)}; best skills ${Object.keys(SKILLS).map(k => [k, Character.checkBonus(c, k).total]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${signed(v)}`).join(', ')}${c.corruption ? `; Corruption ${c.corruption}/10` : ''}`).join('\n');
    return [
      `SETTING: Florian's Axe — a fantasy tale. The Hollow, a grey blight, is returning. The heroes seek the three fragments of Florian's Axe to reseal it. The enemy is ${V().name}: ${V().motive}`,
      `DOOM (how far the Hollow has spread): ${G.doom}/10. Fragments held by the heroes: ${fragCount('party')}, by the enemy: ${fragCount('villain')}.`,
      `RECENT EVENTS:\n${G.chronicle.slice(-5).map(c => '- ' + c).join('\n') || '- The tale has just begun.'}`,
      `HEROES:\n${heroes}`,
      `CURRENT SCENE — ${strip(sceneInfo.title)}:\n${strip(sceneInfo.text)}`,
      `OPTIONS ALREADY ON OFFER (index: label):\n${mappable.map((m, i) => `${i}: ${strip(m.label)}`).join('\n') || '(none suitable)'}`,
      `THE PLAYER, as ${actor.name}, wants to: "${sceneInfo.action}"`,
    ].join('\n\n');
  },

  SYSTEM: [
    'You are the game master for a choose-your-own-adventure fantasy game. A player has typed an action of their own instead of picking a listed option.',
    'Judge it the way a fair tabletop GM would: choose the single most fitting skill or ability and a DC (8 easy, 12 moderate, 15 hard, 18+ very hard). Clever, well-grounded ideas deserve lower DCs; wild ones, higher.',
    'Keep the story coherent. You cannot add new places, characters, items or plot turns, and you cannot end the scene somewhere new. If the action is essentially another way of achieving one of the listed options, set counts_as to that option\'s index so the story continues from there. Otherwise set counts_as to -1: the attempt is a small moment in the current scene with at most a minor effect.',
    'Set feasible to false for actions that are impossible here, contradict the scene, or try to skip the story (for example "I find the villain and kill them"). Explain briefly in attempt, in character.',
    'Write in second person, present tense, in the same plain, vivid tone as the scene. Each text 1-3 sentences. Refer to heroes by name. Do not mention dice, DCs or game mechanics in the prose.',
  ].join('\n'),

  async judge(sceneInfo, mappable, actor) {
    const client = await AI.client();
    const res = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: AI.SYSTEM,
      messages: [{ role: 'user', content: AI.context(sceneInfo, mappable, actor) }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: AI.SCHEMA } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    if (res.stop_reason === 'refusal') throw new Error('The game master declined to judge that action. Try something else.');
    const block = (res.content || []).find(b => b.type === 'text');
    if (!block) throw new Error('No answer came back from the game master.');
    const out = JSON.parse(block.text);
    out.dc = Math.max(8, Math.min(20, parseInt(out.dc, 10) || 12));
    if (!(out.skill in SKILLS) && !STATS.includes(out.skill)) out.skill = 'wis';
    if (!(out.counts_as >= 0 && out.counts_as < mappable.length)) out.counts_as = -1;
    return out;
  },

  /* Bounded effects the model may choose from. */
  applyEffect(kind, c) {
    switch (kind) {
      case 'small_xp': giveXp(20, c); break;
      case 'minor_heal': Character.heal(c, Dice.roll('1d6').total); note(`${c.name} recovers a little`, 'good'); break;
      case 'gold_small': addGold(5 + Dice.d(10)); break;
      case 'focus': c.focus = Math.min(Character.maxFocus(c), c.focus + 1); note(`${c.name} +1 Focus`, 'good'); break;
      case 'doom_minus': if (!has('ai_doom_minus')) { flag('ai_doom_minus'); doom(-1); } break;
      case 'minor_hurt': hurt(c, '1d6'); break;
      case 'gold_loss': addGold(-Math.min(G.gold, 5 + Dice.d(5))); break;
      case 'doom_plus': doom(1); break;
      case 'corruption': corrupt(c, 1); break;
    }
  },

  /* Options a free-text action may stand in for: plain choices and skill checks (not battles, shops or paid choices). */
  mappable(choices) { return choices.filter(c => !c.locked && !c.combat && !c.ui && !c.cost && !c.hollow && !c.perkBypass); },

  /* Turn the model's ruling into a normal check choice the engine already knows how to run. */
  buildChoice(action, ruling, mappable) {
    const orig = ruling.counts_as >= 0 ? mappable[ruling.counts_as] : null;
    const prefixText = (txt, inner) => (s, ctx) => {
      const rest = !inner ? '' : typeof inner.text === 'function' ? inner.text(s, ctx) : (inner.text || '');
      return P(txt) + rest;
    };
    const successBase = orig ? (orig.check ? orig.success : orig) : null;
    const failureBase = orig && orig.check ? orig.failure : null;
    return {
      label: `“${action}”`,
      check: { skill: ruling.skill, dc: ruling.dc },
      success: {
        effects: (s, ctx) => { AI.applyEffect(ruling.success_effect, ctx.char); if (successBase && successBase.effects) successBase.effects(s, ctx); },
        text: prefixText(ruling.success_text, successBase),
        next: successBase ? successBase.next : G.scene,
      },
      failure: {
        effects: (s, ctx) => { AI.applyEffect(ruling.failure_effect, ctx.char); if (failureBase && failureBase.effects) failureBase.effects(s, ctx); },
        text: prefixText(ruling.failure_text, failureBase),
        next: failureBase ? failureBase.next : G.scene,
      },
    };
  },
};
AI.load();
