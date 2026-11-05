// Pure ranking logic: landed cost + trust-adjusted ratings. No I/O, easy to test.

export const PRIORITIES = {
  balanced: { price: 0.4, quality: 0.45, expert: 0.15 },
  price: { price: 0.6, quality: 0.3, expert: 0.1 },
  quality: { price: 0.2, quality: 0.55, expert: 0.25 },
};

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

/** Total cost to the buyer: item + shipping (non-member) + optional estimated sales tax. */
export function landedCost(offer, taxRate = 0) {
  if (typeof offer.price !== 'number') return null;
  const shipping = typeof offer.shipping === 'number' ? offer.shipping : 0;
  const base = offer.price + shipping;
  return round2(base + offer.price * clamp(taxRate, 0, 0.2));
}

/**
 * Trust-adjusted rating. Suspected fake/incentivised reviews inflate stars, so we
 * shrink the rating toward a neutral 3.0 by the trust factor, then apply a Bayesian
 * average so a 5.0 from 4 reviews doesn't beat a 4.6 from 8,000.
 */
export function adjustedRating({ rating, reviewCount, trust }) {
  if (typeof rating !== 'number') return null;
  const t = clamp(typeof trust === 'number' ? trust : 0.5);
  const shrunk = 3 + (rating - 3) * t;
  const effectiveCount = Math.max(0, (reviewCount || 0) * t);
  const prior = 3.5, strength = 25;
  return (effectiveCount * shrunk + strength * prior) / (effectiveCount + strength);
}

export function rankOffers(offers, { priority = 'balanced', taxRate = 0 } = {}) {
  const w = PRIORITIES[priority] || PRIORITIES.balanced;
  const priced = offers
    .map(o => ({ ...o, landed: landedCost(o, taxRate) }))
    .filter(o => o.landed !== null && o.landed > 0);
  if (!priced.length) return [];
  const cheapest = Math.min(...priced.map(o => o.landed));

  return priced
    .map(o => {
      const adj = adjustedRating(o);
      const quality = adj === null ? 0.5 : clamp((adj - 1) / 4);
      const priceScore = cheapest / o.landed;
      const expert = typeof o.independentScore === 'number' ? clamp(o.independentScore) : quality;
      let score = w.price * priceScore + w.quality * quality + w.expert * expert;
      if (o.fakeRisk === 'high') score *= 0.7;       // heavy penalty for untrustworthy reviews
      else if (o.fakeRisk === 'medium') score *= 0.9;
      return { ...o, adjustedRating: adj === null ? null : round2(adj), score: round3(score) };
    })
    .sort((a, b) => b.score - a.score);
}

const round2 = n => Math.round(n * 100) / 100;
const round3 = n => Math.round(n * 1000) / 1000;
