const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');
const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : '#'; } catch { return '#'; } };
const host = u => { try { return new URL(u).hostname; } catch { return 'source'; } };

fetch('/api/vendors').then(r => r.json()).then(list => {
  $('#vendors').insertAdjacentHTML('beforeend', list.map(v =>
    `<label><input type="checkbox" value="${esc(v.key)}" ${v.required ? 'checked disabled' : ''}> ${esc(v.name)}</label>`).join(''));
});

let es;
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  es?.close();
  const vendors = [...document.querySelectorAll('#vendors input:checked, #vendors input:disabled')].map(i => i.value);
  const params = new URLSearchParams({ q: $('#q').value, vendors: vendors.join(','), priority: $('#priority').value, tax: $('#tax').value || 0 });
  $('#results').innerHTML = ''; $('#warnings').innerHTML = '';
  $('#go').disabled = true;
  status('Starting…');

  es = new EventSource(`/api/search?${params}`);
  es.addEventListener('status', ev => status(JSON.parse(ev.data).message));
  es.addEventListener('result', ev => { render(JSON.parse(ev.data)); done(); });
  es.addEventListener('error', ev => {
    if (ev.data) status(`Error: ${JSON.parse(ev.data).message}`);
    else if (es.readyState === EventSource.CLOSED || $('#go').disabled) status($('#results').innerHTML ? '' : 'Connection lost.');
    done();
  });
});

function status(msg) { const s = $('#status'); s.hidden = !msg; s.textContent = msg || ''; }
function done() { es?.close(); $('#go').disabled = false; }
const list = (t, a) => a?.length ? `<div><h4>${t}</h4><ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';

function render({ results, warnings }) {
  status(results.length ? '' : 'No results.');
  $('#warnings').innerHTML = (warnings || []).map(w => `<div class="warn">${esc(w)}</div>`).join('');
  $('#results').innerHTML = results.slice(0, 6).map((r, i) => `
    <article class="card ${i === 0 ? 'top' : ''}">
      <div class="head">
        <div>
          <div class="badge">${i === 0 ? '★ Top pick' : `#${i + 1}`}</div>
          <h3>${esc(r.product)}</h3>
          <div class="vendor">${esc(r.vendor)}${r.seller ? ` · ${esc(r.seller)}` : ''}</div>
        </div>
        <div class="price">
          <div class="total">${money(r.landed)}</div>
          <div class="break">${money(r.price)} + ${r.shipping == null ? 'shipping unknown' : r.shipping === 0 ? 'free shipping' : money(r.shipping) + ' shipping'}</div>
          ${r.shippingNote ? `<div class="break">${esc(r.shippingNote)}</div>` : ''}
        </div>
      </div>
      <div class="meta">
        <span>Store rating: ${esc(r.rating ?? '—')} (${(r.reviewCount ?? 0).toLocaleString()} reviews)</span>
        <span><b>Trust-adjusted: ${esc(r.adjustedRating ?? '—')}</b></span>
        <span class="pill ${esc(r.fakeRisk)}">Fake-review risk: ${esc(r.fakeRisk)}</span>
        <span>Match score ${Math.round(r.score * 100)}</span>
      </div>
      <div class="cols">
        ${list('Review integrity', r.signals)}${list('Pros', r.pros)}${list('Cons', r.cons)}
      </div>
      <p class="src"><a href="${safeUrl(r.url)}" target="_blank" rel="noopener noreferrer">View on ${esc(r.vendor)} →</a>
        ${(r.sources || []).map(s => ` · <a href="${safeUrl(s)}" target="_blank" rel="noopener noreferrer">${esc(host(s))}</a>`).join('')}</p>
    </article>`).join('');
}
