// Two-stage research pipeline driven by Claude + web tools.
import { askClaudeJson } from './claude.js';
import { rankOffers } from './scoring.js';
import { mockSearch, mockTrust } from './mock.js';

export const VENDORS = {
  amazon: { name: 'Amazon', domain: 'amazon.com' },
  walmart: { name: 'Walmart', domain: 'walmart.com' },
  bestbuy: { name: 'Best Buy', domain: 'bestbuy.com' },
  target: { name: 'Target', domain: 'target.com' },
  ebay: { name: 'eBay', domain: 'ebay.com' },
};
const REQUIRED = ['amazon', 'walmart'];

const offerSchema = {
  type: 'object',
  properties: {
    offers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          product: { type: 'string' },
          brand: { type: 'string' },
          url: { type: 'string' },
          price: { type: ['number', 'null'], description: 'USD item price' },
          shipping: { type: ['number', 'null'], description: 'USD shipping for a non-member; 0 if free; null if unknown' },
          shippingNote: { type: 'string' },
          rating: { type: ['number', 'null'] },
          reviewCount: { type: ['integer', 'null'] },
          seller: { type: 'string', description: 'Seller / fulfiller, e.g. "Sold by X, shipped by Amazon"' },
          condition: { type: 'string', description: 'new / refurbished / used' },
          notes: { type: 'string' },
        },
        required: ['product', 'url', 'price', 'shipping', 'rating', 'reviewCount'],
      },
    },
  },
  required: ['offers'],
};

const trustSchema = {
  type: 'object',
  properties: {
    analyses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          trust: { type: 'number', description: '0..1 — how much the star rating can be trusted' },
          fakeRisk: { type: 'string', enum: ['low', 'medium', 'high', 'unknown'] },
          independentScore: { type: ['number', 'null'], description: '0..1 consensus of independent expert/community sources' },
          signals: { type: 'array', items: { type: 'string' } },
          pros: { type: 'array', items: { type: 'string' } },
          cons: { type: 'array', items: { type: 'string' } },
          sources: { type: 'array', items: { type: 'string' }, description: 'URLs actually consulted' },
        },
        required: ['id', 'trust', 'fakeRisk', 'signals', 'sources'],
      },
    },
  },
  required: ['analyses'],
};

const HONESTY = `Rules: only report numbers you actually saw on a page or search result. If a value is unknown use null — never guess or invent prices, ratings, review counts or URLs. Prefer current listings.`;

function searchPrompt(query, vendorKey) {
  const v = VENDORS[vendorKey];
  return `You are a shopping researcher. The shopper wants: "${query}".
Find the 4 most relevant, distinct, currently-sold NEW products on ${v.name} (${v.domain}) that fit this request. Use WebSearch (restrict to ${v.domain}) and WebFetch on product pages as needed.
For each, capture: item price, shipping cost for a regular non-member buyer (0 if free, mention any free-shipping threshold or membership in shippingNote), star rating, review count, seller/fulfiller, and the product URL.
${HONESTY}
Return JSON only.`;
}

function trustPrompt(query, items) {
  return `You are a review-integrity analyst helping a shopper who wants: "${query}".
For EACH product below, judge how trustworthy its star rating is and how good the product really is, using sources OTHER than the retailer's own review section:
 1. Fake-review analyzers (search for the product on FakeFind, Null Fake, or similar; note ReviewMeta and Fakespot are defunct). Use WebFetch on their pages when reachable.
 2. Independent expert reviews (Wirecutter, RTINGS, Consumer Reports, PCMag, Tom's Guide, etc.).
 3. Community feedback (Reddit, forums), including complaints about reliability, review manipulation, or brand switching/"review hijacking".
 4. Red flags visible in the listing: sudden review spikes, "Vine"/incentivised reviews, near-perfect ratings from few reviews, unfamiliar brand names, merged variants.
Output per product: trust (0..1; 1 = ratings are credible), fakeRisk, independentScore (0..1 from independent sources, null if none found), concise signals, pros, cons, and the URLs you actually consulted.
${HONESTY} If you cannot find independent evidence, say so in signals and use fakeRisk "unknown" with trust around 0.5.

Products:
${JSON.stringify(items, null, 2)}

Return JSON only, with one analysis per product using the same id.`;
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export async function runResearch({ query, vendors = REQUIRED, priority = 'balanced', taxRate = 0, emit = () => {} }) {
  const chosen = [...new Set([...REQUIRED, ...vendors.filter(v => VENDORS[v])])];
  const mock = process.env.MOCK === '1';
  const warnings = [];

  // Stage 1 — search each vendor in parallel.
  emit('status', { stage: 'search', message: `Searching ${chosen.map(v => VENDORS[v].name).join(', ')}…` });
  const results = await Promise.allSettled(chosen.map(async key => {
    const data = mock ? await mockSearch(query, key)
      : await askClaudeJson({ prompt: searchPrompt(query, key), schema: offerSchema });
    emit('vendor', { vendor: VENDORS[key].name, count: data.offers.length });
    return data.offers.map((o, i) => ({ ...o, id: `${key}-${i}`, vendor: VENDORS[key].name }));
  }));
  let offers = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') offers.push(...r.value);
    else warnings.push(`${VENDORS[chosen[i]].name}: ${r.reason.message}`);
  });
  offers = offers.filter(o => typeof o.price === 'number' && o.price > 0);
  if (!offers.length) throw new Error(`No priced results found. ${warnings.join(' | ')}`);

  // Pre-rank on price/rating alone so we only spend research effort on plausible winners.
  const shortlist = rankOffers(offers, { priority, taxRate }).slice(0, 10);

  // Stage 2 — review-integrity research in parallel chunks.
  emit('status', { stage: 'trust', message: `Checking review authenticity for ${shortlist.length} candidates…` });
  const slim = shortlist.map(({ id, vendor, product, brand, url, rating, reviewCount, seller }) =>
    ({ id, vendor, product, brand, url, rating, reviewCount, seller }));
  const analyses = new Map();
  await Promise.all(chunk(slim, 3).map(async part => {
    try {
      const data = mock ? await mockTrust(part) : await askClaudeJson({ prompt: trustPrompt(query, part), schema: trustSchema });
      data.analyses.forEach(a => analyses.set(a.id, a));
    } catch (e) { warnings.push(`Review check failed for a batch: ${e.message}`); }
    emit('status', { stage: 'trust', message: `Reviewed ${analyses.size}/${slim.length} candidates…` });
  }));

  const merged = shortlist.map(o => {
    const a = analyses.get(o.id);
    return a ? { ...o, trust: a.trust, fakeRisk: a.fakeRisk, independentScore: a.independentScore ?? undefined,
      signals: a.signals, pros: a.pros || [], cons: a.cons || [], sources: a.sources }
      : { ...o, trust: 0.5, fakeRisk: 'unknown', signals: ['Review authenticity could not be verified.'], pros: [], cons: [], sources: [] };
  });
  const ranked = rankOffers(merged, { priority, taxRate });
  return { query, priority, taxRate, vendors: chosen.map(v => VENDORS[v].name), results: ranked, warnings, generatedAt: new Date().toISOString() };
}
