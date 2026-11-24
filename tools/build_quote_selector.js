#!/usr/bin/env node
// Builds quote-selector.json (the Blade Selector data for quote.html) from the
// dbwwisco.com blade shop catalog, so the quote tool's selector matches the website's
// Blade Finder: saw type -> material -> size -> blade families ranked by fit.
//
//   node tools/build_quote_selector.js            (downloads https://dbwwisco.com/catalog.js)
//   node tools/build_quote_selector.js catalog.js (uses a saved copy)
//
// Keeps only what the selector needs: names, tiers, categories, saw types, material
// ratings and the size variants (item #, size label, size). No prices: costs come from
// quote-prices.json (the monthly price list).
// Also copies each family's photo into quote-img/ so the quote tool can show which blade is which.
'use strict';
const fs = require('fs');
const https = require('https');

function get(url, binary) {
  return new Promise((res, rej) => https.get(url, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return res(get(new URL(r.headers.location, url).href, binary));
    if (r.statusCode !== 200) { r.resume(); return rej(new Error(url + ' -> ' + r.statusCode)); }
    const d = []; r.on('data', c => d.push(c)); r.on('end', () => { const b = Buffer.concat(d); res(binary ? b : b.toString('utf8')); });
  }).on('error', rej));
}

(async () => {
  const src = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : await get('https://dbwwisco.com/catalog.js');
  // catalog.js is `window.CATALOG={...JSON...};`: parse it as data, never run it
  const m0 = src.indexOf('{'), m1 = src.lastIndexOf('}');
  const C = JSON.parse(src.slice(m0, m1 + 1));
  if (!C || !Array.isArray(C.families)) throw new Error('catalog.js did not define window.CATALOG.families');
  const out = {
    source: 'dbwwisco.com', priceList: C.priceList || '', built: new Date().toISOString().slice(0, 10),
    materials: C.materials.map(m => [m.k, m.n]),
    saws: C.saws.map(s => [s.k, s.n, s.s || '']),
    cats: (C.cats || []).map(c => [c.k, c.n]),
    families: C.families.map(f => ({
      n: f.n, t: f.tier || '', c: f.cats || [], s: f.saws || [], m: f.m || {},
      h: (f.hook || '').slice(0, 140),
      i: /^[\w.-]+\.(webp|jpg|jpeg|png)$/i.test(f.img || '') ? f.img : '',
      v: (f.vars || []).map(v => [String(v[0]), String(v[1] || ''), +v[2] || 0]),
    })).filter(f => f.v.length),
  };
  // Blade photos: copy each family's picture from dbwwisco.com/img/ into quote-img/ (same origin, works if the site is down)
  fs.mkdirSync('quote-img', { recursive: true });
  let got = 0;
  for (const f of out.families) {
    if (!f.i) continue;
    const dst = 'quote-img/' + f.i;
    if (!fs.existsSync(dst)) {
      try { const b = await get('https://dbwwisco.com/img/' + f.i, true); if (b.length > 500) fs.writeFileSync(dst, b); else throw new Error('tiny'); }
      catch (e) { console.warn('no photo:', f.i, e.message); f.i = ''; continue; }
    }
    got++;
  }
  console.log('photos:', got);
  fs.writeFileSync('quote-selector.json', JSON.stringify(out));
  console.log('quote-selector.json:', out.families.length, 'families,', out.families.reduce((t, f) => t + f.v.length, 0), 'sizes');
})().catch(e => { console.error(e.message); process.exit(1); });
