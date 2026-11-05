# Smart Shopper — Project Plan

Goal: a web app where a shopper describes what they want; it searches multiple vendors (Amazon and Walmart at minimum),
ranks by **total cost (price + shipping [+ tax]) × quality × trustworthy reviews**, and explains why.
AI runs through the user's own Claude Code login (`claude -p`), never an API key.

## Status snapshot (prototype, uncommitted)
| Area | State |
|---|---|
| Node server, SSE progress, UI, scoring, mock mode | Built; 4 unit tests pass |
| Claude CLI integration (login auth, structured JSON, WebSearch/WebFetch) | Verified live |
| Walmart search | Works live (~50 s for 2 vendors) |
| **Amazon search** | **FAILING: offers returned without prices, so they are filtered out** |
| Fake-review analysis | Runs, but evidence quality is unmeasured |
| Repo | Currently a subfolder of `Florian-s-Axe`; standalone repo not yet created |

## Key risks (drive the gates)
1. **Amazon data access.** Amazon blocks scrapers/fetchers and forbids scraping in its terms. Needs a legitimate source (see WP2).
2. **Hallucinated data.** LLM-extracted prices/ratings can be wrong. Every number needs a source URL and a verifiability check.
3. **Fake-review detection tools.** ReviewMeta and Fakespot are defunct; FakeFind/Null Fake etc. may block fetching or change. Need fallbacks and honest "unknown" output.
4. **Cost/latency.** Each search spawns several Claude sessions with web tools. Needs caching and a budget cap.
5. **Terms of service / legality.** Scraping retailers and re-displaying data; affiliate disclosure if added later.
6. **Security.** The app shells out to `claude` with web tools. Prompt injection from web pages is possible; the backend must stay local-only and tool-restricted.

## Work packages and gates

Each gate is pass/fail. We do not start the next WP until the gate passes (WP1 and WP2 can overlap).

### WP0 — Repo & foundations
- Create standalone repo (user creates empty GitHub repo; we move `smart-shopper/` with history), `.gitignore`, MIT/LICENSE decision, CI running `npm test`.
- Decide: keep zero-dependency Node, or adopt TypeScript.
- **Gate G0:** repo exists, CI green on a clean clone, `npm start` works from README steps alone.

### WP1 — Reliable vendor data (Walmart + generic)
- Harden stage-1 prompt and schema; require a source URL and a "how verified" field per number.
- Server-side validation: drop offers with missing/implausible price, dedupe, normalize product names.
- Add optional vendors (Best Buy, Target, eBay) behind the same interface.
- **Gate G1:** on a 10-query benchmark set, ≥80% of returned Walmart offers have a price that matches the live page when spot-checked manually (sample of 20); zero invented URLs.

### WP2 — Amazon access (blocking, highest risk)
Options to evaluate, in order of preference:
1. Official/commercial data API (e.g., Amazon Product Advertising API needs an affiliate account; or a paid product-data API such as Rainforest/Keepa/SerpApi).
2. Search-engine / Google Shopping snippets that expose Amazon price & rating without fetching Amazon pages.
3. User-driven browser extension / Claude in Chrome using the user's own session (no server scraping).
- Deliverable: short decision memo (cost, ToS, reliability) + implementation of the chosen option.
- **Gate G2 (user decision + proof):** user approves the approach; ≥80% of Amazon offers on the benchmark set carry a verified price, rating and review count. **If this fails, we stop and re-scope** rather than ship Amazon results that are blank or invented.

### WP3 — Total-cost accuracy
- Shipping model: non-member cost, free-shipping thresholds, membership note (Prime / Walmart+), marketplace third-party sellers.
- Optional ZIP-based tax estimate; return/restocking fee notes; condition (new/refurbished) filter.
- **Gate G3:** for 15 sampled products, computed total within ±$1 of the checkout page's pre-tax total.

### WP4 — Review trust engine
- Evidence ladder with explicit weights: (a) fake-review analyzers, (b) independent expert sites, (c) community (Reddit), (d) listing red flags (review spikes, incentivized reviews, unfamiliar brand, merged variants).
- Output must separate "found evidence" from "no evidence found" (trust=unknown, never silently 0.5).
- Store source URLs; show them in the UI.
- Build a small labeled set of known-good and known-suspicious listings.
- **Gate G4:** on the labeled set (≥20 listings), correctly flags ≥70% of suspicious ones with ≤15% false alarms on good ones; every verdict cites ≥1 reachable source or says "unknown".

### WP5 — Ranking quality
- Tune weights for price/quality/expert score; expose "why this pick" explanation.
- Evaluate ranking against human choices on the benchmark queries.
- **Gate G5:** on 10 queries, the top-3 contains the human-chosen best buy ≥70% of the time.

### WP6 — Performance, cost, caching
- Per-search token/cost log, `--max-budget-usd` per search, result cache (e.g., 6 h), concurrency limits, cancel on client disconnect.
- **Gate G6:** median search ≤ 90 s and ≤ a budget the user sets (target ≤ $0.50/search); repeat search served from cache in <2 s.

### WP7 — Security & robustness
- Bind to localhost by default; rate-limit; input length limits; no secrets in logs.
- Treat web content as untrusted: restrict CLI tools to search/fetch only, add prompt-injection guardrails, validate all JSON, escape all output (already done in UI).
- Graceful errors when `claude` is missing/not logged in.
- **Gate G7:** security checklist reviewed; injection test pages (hidden "ignore instructions") do not alter ranking; missing-CLI path shows a clear message.

### WP8 — UX & release
- Result comparison table, filters, saved searches, mobile layout check, accessibility pass.
- README, disclosure text ("estimates, confirm before buying"), screenshots.
- **Gate G8 (release):** user acceptance on 5 real shopping searches; all earlier gates green; docs complete.

## Suggested order & rough effort
WP0 → (WP1 ∥ WP2) → WP3 → WP4 → WP5 → WP6 → WP7 → WP8.
Biggest unknown is WP2; rough sizing is S for WP0, M for WP1/3/5/6/7, L for WP2/4/8 (depends on the Amazon route).

## Decisions needed from you
1. **Repo:** create an empty GitHub repo for this? (If yes, tell me its name; I'd need it added to this session's access.)
2. **Amazon route (WP2):** are you OK paying for a product-data API or setting up an Amazon affiliate account, or should we try the free routes first?
3. **Budget:** acceptable cost per search, given each search uses your Claude subscription.
4. **Extra vendors** beyond Amazon/Walmart (Best Buy, Target, eBay)?
5. **Scope:** US-only for now?
