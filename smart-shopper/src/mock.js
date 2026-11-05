// Offline demo data (MOCK=1) so the UI can be tried without the Claude CLI.
const wait = ms => new Promise(r => setTimeout(r, ms));
export async function mockSearch(query, vendor) {
  await wait(400);
  const base = vendor === 'amazon' ? 0 : 3;
  return { offers: [
    { product: `${query} — Pro Series`, brand: 'Acme', url: `https://example.com/${vendor}/1`, price: 79.99 + base, shipping: vendor === 'amazon' ? 0 : 5.99, shippingNote: 'Free with membership', rating: 4.8, reviewCount: 312, seller: 'Third party' },
    { product: `${query} — Value Edition`, brand: 'Contoso', url: `https://example.com/${vendor}/2`, price: 54.5 + base, shipping: 0, rating: 4.4, reviewCount: 9120, seller: vendor },
    { product: `${query} — Budget`, brand: 'NoNameCo', url: `https://example.com/${vendor}/3`, price: 29.99, shipping: 4.99, rating: 4.9, reviewCount: 88, seller: 'Third party' },
  ] };
}
export async function mockTrust(items) {
  await wait(400);
  return { analyses: items.map(i => {
    const sus = i.reviewCount < 400 && i.rating >= 4.8;
    return { id: i.id, trust: sus ? 0.25 : 0.85, fakeRisk: sus ? 'high' : 'low', independentScore: sus ? null : 0.8,
      signals: sus ? ['Near-perfect rating from few reviews', 'Unfamiliar brand, review burst in a single week'] : ['Review distribution looks organic', 'Praised by independent testers'],
      pros: ['Demo data'], cons: ['Demo data'], sources: ['https://example.com/demo-source'] };
  }) };
}
