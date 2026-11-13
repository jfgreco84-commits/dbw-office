/* DBW Wisco store. Vanilla JS, no build step. Data: catalog.js. Settings: config.js. */
(function () {
  "use strict";
  var C = window.CATALOG, W = window.WISCO || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (n) { return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("wisco." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("wisco." + k, JSON.stringify(v)); } catch (e) { } }
  };
  var FRANK = (W.managerName || "Frank").split(" ")[0];
  var BREAKS = W.breaks || [6, 12, 25, 36, 50, 100, 200, 500];
  var TIER = { supreme: "Best · Supreme grade", premium: "Better · Premium grade", standard: "Good · Standard grade", economy: "Value · Economy grade", pro: "Pro Series" };
  var TR = { supreme: 4, pro: 4, premium: 3, standard: 2, economy: 1, "": 0 };
  var SAWDIA = { grinder: [3, 9], cutoff: [12, 16], walk: [14, 99] };

  var MATS = [
    { k: "c", n: "Concrete", s: "Slabs, sidewalk, curb", keys: ["c"] },
    { k: "r", n: "Hard & Reinforced", s: "Rebar, river rock, hard aggregate", keys: ["r"] },
    { k: "g", n: "Green Concrete", s: "Early-entry joints", keys: ["g"] },
    { k: "a", n: "Asphalt", s: "Patching, trenching, overlays", keys: ["a"] },
    { k: "bp", n: "Brick, Block & Pavers", s: "Hardscape and masonry", keys: ["b", "p"] },
    { k: "s", n: "Stone & Granite", s: "Natural stone, curb, countertops", keys: ["s"] },
    { k: "t", n: "Tile & Porcelain", s: "Ceramic, porcelain, marble", keys: ["t"] },
    { k: "x", n: "Metal & Ductile", s: "Pipe, rebar, rail, steel", keys: ["x"] },
    { k: "m", n: "Mortar Joints", s: "Tuckpointing and grout", keys: ["m"] },
    { k: "sp", n: "Grinding & Coatings", s: "Level, prep, strip", keys: ["sp"] }
  ];
  var SAWS = [
    { k: "grinder", n: "Angle Grinder", s: '4" to 9"', keys: ["grinder", "circ"] },
    { k: "cutoff", n: "Cut-Off Saw", s: 'Hand-held 12" to 16"', keys: ["cutoff"] },
    { k: "walk", n: "Walk-Behind Saw", s: '14" and bigger', keys: ["walk"] },
    { k: "early", n: "Early-Entry Saw", s: "Soff-Cut style", keys: ["early"] },
    { k: "table", n: "Tile / Masonry Saw", s: "Table and block saws", keys: ["table"] },
    { k: "core", n: "Core Drill", s: "Hand-held or rig", keys: ["core"] }
  ];
  var WANTS = [
    { k: "speed", n: "Fastest Cut", s: "Get me through it" },
    { k: "life", n: "Longest Life", s: "Most footage per blade" },
    { k: "price", n: "Lowest Price", s: "Keep the cost-in down" },
    { k: "frank", n: "Just Tell Me", s: FRANK + " picks, I cut" }
  ];
  /* The ladder our reps pitch on every call: Dragon first, then Extreme, T-Rex, Viper. */
  var LADDER = [
    { label: "★ Unstoppable", rc: "", ids: ["dragon-supreme", "dragon"] },
    { label: "Best", rc: "b", ids: ["superblade-extreme", "super-g"] },
    { label: "Better", rc: "b", ids: ["t-rex", "eagle-premium"] },
    { label: "Good", rc: "g", ids: ["viper-general-purpose", "eagle-heavy-duty", "eagle-standard"] }
  ];
  var LINES = [
    { k: "dragons", n: "The Dragons", s: "Our baddest multi-purpose blades. Red for life, Purple for everything.", ids: ["dragon-supreme", "dragon"], img: ["dragon-supreme", "dragon"] },
    { k: "superblades", n: "The Superblades", s: "Extreme, Super G, G3 and Arrow. Built to drop your cost per cut.", ids: ["superblade-extreme", "super-g", "superblade-g3", "superblade-arrow"], img: ["superblade-g3", "superblade-arrow"] },
    { k: "zenesis", n: "Zenesis Green Kut", s: "Early-entry blades with Zenesis diamond alignment. More footage, chip-free joints.", ids: ["zenesis-green-kut-purple", "zenesis-green-kut-orange", "zenesis-green-kut-green", "zenesis-green-kut-red", "zenesis-green-kut-yellow"], img: ["zenesis-green-kut-purple"] },
    { k: "4-core", n: "4-Core Bits", s: "Punisher, Wolv and Sabertooth. Pro Series bits for the holes nobody else wants.", ids: ["punisher", "wolv", "sabertooth"], img: ["punisher", "wolv", "sabertooth"] }
  ];
  var DONTFORGET = [
    { cat: "core", n: "Core bits" }, { cat: "chain", n: "Diamond chain" }, { cat: "abrasive", n: "Abrasive wheels" },
    { cat: "small", n: "Small diameter blades" }, { cat: "cup", n: "Cup wheels" }, { cat: "wet", n: "Large wet blades" },
    { cat: "tuck", n: "Tuck point blades" }, { cat: "green", n: "Green concrete blades" }
  ];
  /* Typical max depth of cut. A saw's guard and flanges can move it by up to half an inch. */
  var DEPTH = [
    ["Angle grinder", [['4"', '1"'], ['4-1/2"', '1-1/4"'], ['5"', '1-1/2"'], ['7"', '2-1/4"'], ['9"', '3-1/4"']]],
    ["Hand-held cut-off saw", [['12"', '4"'], ['14"', '5"'], ['16"', '6"']]],
    ["Walk-behind / flat saw", [['14"', '4-5/8"'], ['16"', '5-5/8"'], ['18"', '6-5/8"'], ['20"', '7-5/8"'], ['24"', '9-5/8"'], ['26"', '10-5/8"'], ['30"', '11-3/4"'], ['36"', '14-3/4"']]],
    ["Early-entry saw", [['6"', '1-3/16"'], ['8"', '2"'], ['10"', '3"'], ['12"', '4"'], ['13-1/2"', '4-1/2"'], ['14"', '5"']]],
    ["Deep-cut tools", [["Ring saw, 14\"", '10"'], ["Cut-n-Break, 9\"", '16" in passes'], ["Diamond chain saw", "bar length: 10\" to 25\""], ["Core bit", "barrel length: 9\" to 24\""]]]
  ];
  /* Big Frank: the comment machine. Short, in his voice, never a made-up claim. */
  var QUIP = {
    home: ["Dragon first. Always. If it can’t cut it, call me.", "Buying 6 or more? Don’t pay Buy It Now. Ask for the price break.", "Tell your salesman your favorite team. Trust me on this one.", "Need a saw? Stack blades with it and watch what happens to the price.", "If they make it, we can get it. Try me.", "Not sure what to run? Three taps and I’ll tell you."],
    mat: ["Tell me what you’re cutting. I’ll line ’em up."],
    saw: ["What saw? I only show sizes that fit it."],
    want: ["Be straight with me. Speed, life or price?"],
    reorder: ["Got the old blade in your hand? The part number’s printed on it. Type that.", "Easier yet: text me a picture of the old blade."],
    shop: ["Everything’s got a price on it. Buying a stack? Ask for the break.", "Can’t find it? Doesn’t mean we can’t get it."],
    equipment: ["Make, model, how soon. Give me that and watch what I come back with.", "Buying blades in bulk? That’s how the saw gets cheap."],
    depth: ["Rule of thumb: a 14 cuts 5 inches. Need deeper? Go 16, or ask me about a ring saw."],
    send: ["Fill it in once. Next time it’s two taps.", "No card numbers on here. Ever. We do that by phone like grown-ups."],
    line: ["These are the ones we put our name on."]
  };
  var MATQUIP = {
    c: "Cured concrete all day? Dragon. Tight budget? T-Rex won’t let you down.",
    r: "Rebar and river rock? That’s Dragon Supreme country.",
    g: "Green concrete is a timing game. Get the joints in clean and get out.",
    a: "Asphalt eats cheap blades. Run the right bond and quit burning segments.",
    bp: "Pavers and block: you want clean edges and fewer wasted pieces.",
    s: "Granite glazes a blade over fast. You want one that stays open.",
    t: "Porcelain chips if you look at it wrong. Thin rim, and let the blade do the work.",
    x: "Still burning abrasive wheels on ductile? Blacksmyth. Same depth, first cut to last.",
    m: "Tuck pointing all day? Get a blade that holds its width.",
    sp: "Double row if you want it flat. T-Seg if you’re stripping coatings."
  };
  var TIERQUIP = { supreme: "This is the good stuff. More per blade, less per cut.", pro: "Pro Series. For the jobs nobody else wants.", premium: "Solid everyday blade. Crews stock these by the box.", standard: "Honest blade that does the job. Step up when the job gets ugly.", economy: "Budget blade. Fine for the short job. Step up when it gets hard." };
  function says(text, big) { return '<div class="bfs' + (big ? " big" : "") + '"><img alt="" src="brand/frank' + (big ? "" : "-sm") + '.webp"><div><b>Big ' + esc(FRANK) + " says</b><p>" + esc(text) + "</p></div></div>"; }

  var byK = function (arr, k) { return arr.filter(function (x) { return x.k === k; })[0]; };

  var FAM = {}, SKU = {}, MATNAME = {}, SAWNAME = {}, CATNAME = {};
  C.materials.forEach(function (m) { MATNAME[m.k] = m.n; });
  C.saws.forEach(function (s) { SAWNAME[s.k] = s.n; });
  C.cats.forEach(function (c) { CATNAME[c.k] = c.n; });
  C.families.forEach(function (f, i) {
    f.i = i; FAM[f.id] = f;
    f.hay = (f.n + " " + f.hook + " " + f.vars.map(function (v) { return v[0] + " " + v[1] + " " + v[4]; }).join(" ")).toLowerCase();
    f.vars.forEach(function (v, vi) { var k = v[0].toUpperCase().replace(/[^A-Z0-9.]/g, ""); if (!SKU[k]) SKU[k] = [f, vi]; });
  });

  var cart = store.get("cart", []);
  var isPreview = !/^https?:$/.test(location.protocol) || /claude|anthropic/.test(location.hostname);
  var wiz = { mode: "finder", mat: null, saw: null, want: null, all: false };
  var shop = { cat: "all", q: "" };
  var deal = store.get("deal", { saw: "", lines: [] });
  var extras = { free: "", stock: false, breaks: [] };

  /* ---------- small pieces ---------- */
  function vkey(v) { return v[0] + "|" + v[1]; }
  function findVar(f, key) { for (var i = 0; i < f.vars.length; i++) if (vkey(f.vars[i]) === key) return f.vars[i]; return null; }
  function vlabel(v) { return [v[1], v[4]].filter(Boolean).join(" · ") || v[0]; }
  function rating(f, mat) { if (!mat) return 0; var r = 0; mat.keys.forEach(function (k) { r = Math.max(r, f.m[k] || 0); }); return r; }
  function fitsSaw(f, saw) { return !saw || saw.keys.some(function (k) { return f.saws.indexOf(k) >= 0; }); }
  function inSaw(v, saw) { if (!saw || !SAWDIA[saw.k]) return true; return v[2] != null && v[2] >= SAWDIA[saw.k][0] && v[2] <= SAWDIA[saw.k][1]; }
  function varsFor(f, saw) { var a = f.vars.filter(function (v) { return inSaw(v, saw); }); return a.length ? a : f.vars; }
  function defVar(f, vs) { var pref = f.cats.indexOf("highspeed") >= 0 ? 14 : (f.cats.indexOf("small") >= 0 ? 4.5 : null); for (var i = 0; i < vs.length; i++) if (pref && vs[i][2] === pref) return vs[i]; return vs[0]; }
  function stars(r) { return '<span class="stars" style="--p:' + (r / 5 * 100) + '%" role="img" aria-label="' + r + ' out of 5"></span>'; }
  function pic(f) { return '<span class="pic ' + (f.img ? "" : "none") + '">' + (f.img ? '<img loading="lazy" alt="" src="img/' + esc(f.img) + '">' : "") + "</span>"; }
  function qtyHTML(n) { return '<span class="qty"><button type="button" data-q="-1" aria-label="Fewer">−</button><input type="number" inputmode="numeric" min="1" max="9999" value="' + n + '" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></span>'; }
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400); }
  function buyRow(v) { return '<div class="buy-row" data-row><div class="price">' + money(v[3]) + "<small>Buy It Now · " + esc(v[0]) + '</small></div><div class="act">' + qtyHTML(1) + '<button class="add" data-add>Add to order</button></div></div>'; }
  function breaksLine() { return 'Buying more? <button class="more" data-breaks>Ask for ' + BREAKS.join(", ") + " piece price breaks</button>"; }

  function cardHTML(f, o) {
    o = o || {};
    var vs = varsFor(f, o.saw), first = defVar(f, vs), r = rating(f, o.mat);
    var size = vs.length > 1
      ? '<select aria-label="Size" data-size>' + vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === first ? " selected" : "") + ">" + esc(vlabel(v)) + "  ·  " + money(v[3]) + "</option>"; }).join("") + "</select>"
      : '<div class="one">' + esc(vlabel(first)) + "</div>";
    return '<article class="card' + (o.pick ? " pick" : "") + '" data-f="' + f.id + '">' +
      (o.ribbon ? '<div class="ribbon ' + (o.rc || "") + '"><span>' + o.ribbon + "</span>" + (o.ribbon2 ? "<span>" + o.ribbon2 + "</span>" : "") + "</div>" : "") +
      '<button class="c-top" data-open aria-label="Details for ' + esc(f.n) + '">' + pic(f) + "<span>" +
      (f.tier ? '<span class="tier ' + f.tier + '">' + TIER[f.tier] + "</span>" : "") + "<h3>" + esc(f.n) + "</h3>" +
      (r ? '<span class="rate">' + stars(r) + "<span><b>" + r.toFixed(1) + "</b> on " + esc(o.mat.n) + "</span></span>" : "") + "</span></button>" +
      (f.hook ? '<p class="hook">' + esc(f.hook) + "</p>" : "") +
      '<div class="buy">' + size + buyRow(first) + '<button class="more" data-open>Details, ratings and all ' + f.vars.length + (f.vars.length === 1 ? " size" : " sizes") + "</button></div></article>";
  }

  /* ---------- picking blades ---------- */
  function candidates(mat, saw) {
    return C.families.filter(function (f) { return rating(f, mat) >= 3 && fitsSaw(f, saw) && (!saw || !SAWDIA[saw.k] || f.vars.some(function (v) { return inSaw(v, saw); })); });
  }
  function priceFor(f, saw) { return defVar(f, varsFor(f, saw))[3]; }
  function rank(list, mat, saw, want) {
    var a = list.slice();
    a.sort(function (x, y) {
      var rx = rating(x, mat), ry = rating(y, mat);
      if (want === "price") return (priceFor(x, saw) - priceFor(y, saw)) || (ry - rx);
      if (want === "life") return (TR[y.tier] - TR[x.tier]) || (ry - rx) || (x.rank - y.rank);
      if (want === "frank") return (x.rank - y.rank) || (ry - rx);
      return (ry - rx) || (x.rank - y.rank) || (TR[y.tier] - TR[x.tier]) || (x.i - y.i);
    });
    return a;
  }
  function ladder(list) {
    var ids = {}; list.forEach(function (f) { ids[f.id] = f; });
    var out = [];
    LADDER.forEach(function (L) { for (var i = 0; i < L.ids.length; i++) if (ids[L.ids[i]]) { out.push({ f: ids[L.ids[i]], label: L.label, rc: L.rc }); break; } });
    return out;
  }
  function bestBetterGood(list, mat, saw) {
    var a = rank(list, mat, saw), out = [], used = {};
    [["supreme", "pro"], ["premium"], ["standard", "economy"]].forEach(function (tiers) {
      var hit = a.filter(function (f) { return tiers.indexOf(f.tier) >= 0 && !used[f.id]; })[0];
      if (hit) { used[hit.id] = 1; out.push(hit); }
    });
    a.forEach(function (f) { if (out.length < 3 && !used[f.id]) { used[f.id] = 1; out.push(f); } });
    out.sort(function (x, y) { return TR[y.tier] - TR[x.tier]; });
    var lab = [["★ Best", ""], ["Better", "b"], ["Good", "g"]];
    return out.map(function (f, i) { return { f: f, label: lab[Math.min(i, 2)][0], rc: lab[Math.min(i, 2)][1] }; });
  }

  /* ---------- screens ---------- */
  var app = $("#app");
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function setNav(h) { $$(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === h); }); }

  function home() {
    var top = C.families.filter(function (f) { return f.rank < 99; }).slice(0, 8);
    var line = ["dragon", "superblade-g3", "dragon-supreme", "superblade-arrow", "zenesis-green-kut-purple"];
    var lines = LINES.map(function (L) {
      var fs = L.ids.map(function (id) { return FAM[id]; }).filter(Boolean); if (!fs.length) return "";
      var from = Math.min.apply(null, fs.map(function (f) { return f.min; }));
      return '<a class="linecard" href="#line-' + L.k + '"><span class="lc-art">' + L.img.map(function (id) { return FAM[id] && FAM[id].img ? '<img alt="" loading="lazy" src="img/' + esc(FAM[id].img) + '">' : ""; }).join("") + "</span><b>" + esc(L.n) + "</b><span>" + esc(L.s) + "</span><em>From " + money(from) + " →</em></a>";
    }).join("");
    var T = (W.testimonials || []).filter(function (t) { return t && t.quote; });
    app.innerHTML =
      '<section class="hero"><div class="wrap"><div>' +
      (function () { var r = repBySlug(me().rep); return '<span class="pill"><i>★</i> ' + (r ? "Your salesman: " + esc(r.name) : "A division of Diamond Blade Warehouse, LLC") + " <i>★</i></span>"; })() +
      "<h1>The right blade. Right now.</h1>" +
      '<p class="sub">Tell us what you cut. We ship it anywhere in the USA. <b>Your blades, your price, 60 seconds.</b></p>' +
      '<div class="doors">' +
      '<a class="door d1 shine" href="#finder"><div><b>Blade Finder</b><span>Two taps. We line up the right blade.</span></div><em>→</em></a>' +
      '<a class="door d2" href="#reorder"><div><b>Fast Reorder</b><span>Know what you run? Punch it in and go.</span></div><em>→</em></a>' +
      '<a class="door d3 withav" href="#ask-frank"><img alt="" src="brand/frank-sm.webp"><div><b>Ask ' + esc(FRANK) + "</b><span>Not sure? Get Big " + esc(FRANK) + "’s pick in 3 taps.</span></div><em>→</em></a>" +
      "</div>" +
      '<div class="minis"><a href="#saw-deal">Build a saw deal</a><a href="#equipment">Equipment deals</a><a href="#depth">Cutting depth chart</a><a href="#shop">Shop everything</a></div>' +
      '</div><div class="art"><img class="logo" src="brand/logo.webp" alt="DBW Wisco, a division of Diamond Blade Warehouse" width="430" height="458">' +
      '<div class="stage"><div class="lineup">' + line.map(function (n) { return '<img alt="" src="brand/lineup/' + n + '.webp">'; }).join("") + "</div></div></div></div></section>" +

      '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>Our heavy hitters</h2><p>The blades and bits we put our name on.</p></div><div class="lines">' + lines + "</div></div></section>" +

      '<section class="sec"><div class="wrap"><div class="sec-head"><h2>What the crews run</h2><p>Dragon first. Then Extreme, Super G, T-Rex and Viper. The blades our reps quote all day.</p></div><div class="rail">' + top.map(function (f) { return cardHTML(f); }).join("") + '</div><div class="center"><a class="btn blue" href="#shop">Shop everything</a></div></div></section>' +

      '<section class="sec deal"><div class="wrap two-col"><div><div class="sec-head left"><h2>Stack blades, score a saw</h2><p>Bundle 15, 25 or 36 blades with a gas saw and the saw price drops hard. Stack enough and it’s free. Pick your saw, stack your blades, see your package.</p></div><a class="btn chrome shine" href="#saw-deal">Build my saw deal</a></div>' +
      '<div><div class="sec-head left"><h2>If they make it, we can get it</h2><p>Don’t sleep on the equipment deals. Tell your rep the make and model and they’ll hunt down the best deal out there. Buy blades in bulk and we can often eat most of the cost. It works like Costco: the more you buy, the better the deal.</p></div><a class="btn red" href="#equipment">Find me equipment</a></div></div></section>' +

      '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>People buy from people</h2><p>No robots. No phone mazes. Relationships matter.</p></div><div class="three people">' +
      "<div class=\"point l\"><b>A real person, every order</b><p>You should never have to fight an automated maze just to reorder. Every order on this site lands with a human who knows your account. Nothing here charges a card.</p></div>" +
      "<div class=\"point l\"><b>One hand washes the other</b><p>We sell blades and equipment to put food on our families’ tables. You and your crews use them to put food on yours. One good American company doing good business with another.</p></div>" +
      "<div class=\"point l\"><b>We obsess so you don’t have to</b><p>You’re the one sweating behind the saw. We sweat the blades, the bonds and the freight, and we’re here for you every day of the week.</p></div>" +
      '</div><div class="bribe"><b>Professional bribery, the good old-fashioned way.</b><span>Tell your salesman your favorite team, athlete, school or color. We make it a point to remember, and it has a way of showing up in the box.</span></div></div></section>' +

      (T.length ? '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Straight from the jobsite</h2><p>Real customers. Their words.</p></div><div class="three">' + T.map(function (t) { return '<figure class="quote"><blockquote>' + esc(t.quote) + "</blockquote><figcaption>" + esc(t.who || "") + "</figcaption></figure>"; }).join("") + "</div></div></section>" : "") +

      '<section class="sec dark"><div class="wrap"><div class="sec-head"><h2>How’d we do?</h2><p>Good, bad or ugly. ' + esc(FRANK) + ' reads every one, and we ask on every order.</p></div><div class="center"><button class="btn chrome" data-feedback>Tell ' + esc(FRANK) + " how we did</button></div></div></section>";
    setNav("#home");
  }

  function dots(n, total) { var s = ""; for (var i = 1; i <= total; i++) s += '<i class="' + (i < n ? "done" : i === n ? "on" : "") + '"></i>'; return '<div class="dots" aria-label="Step ' + n + " of " + total + '">' + s + "</div>"; }
  function tiles(list, attr, cls) { return '<div class="tiles ' + (cls || "") + '">' + list.map(function (x) { return '<button class="tile" data-' + attr + '="' + x.k + '"><b>' + esc(x.n) + "</b><span>" + esc(x.s) + "</span></button>"; }).join("") + "</div>"; }
  function shell(kicker, step, total, body, wide) {
    return '<section class="screen wiz"><div class="wrap' + (wide ? " wide" : "") + '"><div class="wiz-top"><button class="back" data-back>← Back</button>' + (total ? dots(step, total) : "") + '</div><div class="wiz-kicker">' + kicker + "</div>" + body + "</div></section>";
  }
  function chosen() { var a = []; if (wiz.mat) a.push(wiz.mat.n); if (wiz.saw) a.push(wiz.saw.n); if (wiz.want) a.push(wiz.want.n); return a.length ? '<div class="chosen">' + a.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : ""; }

  function wizard() {
    var ask = wiz.mode === "ask", total = ask ? 3 : 2, kick = ask ? "Ask " + esc(FRANK) : "Blade Finder";
    if (!wiz.mat) { app.innerHTML = shell(kick, 1, total, "<h1>What are you cutting?</h1>" + says(QUIP.mat[0]) + tiles(MATS, "mat")); return; }
    if (!wiz.saw) {
      var saws = SAWS.filter(function (s) { return candidates(wiz.mat, s).length; });
      if (saws.length === 1) { wiz.saw = saws[0]; return wizard(); }
      app.innerHTML = shell(kick, 2, total, chosen() + "<h1>What saw are you running?</h1>" + says(QUIP.saw[0]) + tiles(saws, "saw")); return;
    }
    if (ask && !wiz.want) { app.innerHTML = shell(kick, 3, total, chosen() + "<h1>What matters most?</h1>" + says(QUIP.want[0]) + tiles(WANTS, "want")); return; }
    var list = candidates(wiz.mat, wiz.saw), o = { mat: wiz.mat, saw: wiz.saw }, h = chosen();
    if (!list.length) { app.innerHTML = shell(kick, 0, 0, h + "<h1>That one’s a phone call.</h1>" + '<div class="empty">Nothing on the shelf matches that combo. ' + esc(FRANK) + " will spec it for you.</div>" + frankBox("")); return; }
    if (ask) {
      var r = rank(list, wiz.mat, wiz.saw, wiz.want.k), top = r[0], alts = r.slice(1, 3);
      var why = { speed: "it’s the fastest thing we’ve got for that job", life: "it’ll outlast anything else on that saw", price: "it’s the lowest cost-in that still does the job right", frank: "it’s what I’d put on my own saw" }[wiz.want.k];
      h += says("Run the " + top.n + ". For " + wiz.mat.n.toLowerCase() + " on a " + wiz.saw.n.toLowerCase() + ", " + why + ".", true) +
        '<div class="results">' + cardHTML(top, { mat: wiz.mat, saw: wiz.saw, pick: 1, ribbon: "★ " + esc(FRANK) + "’s Pick", ribbon2: esc(wiz.want.n) }) +
        alts.map(function (f, i) { return cardHTML(f, { mat: wiz.mat, saw: wiz.saw, ribbon: i ? "Also solid" : "Runner-up", rc: i ? "g" : "b" }); }).join("") + "</div>" + frankBox(top.n);
    } else {
      var lad = ladder(list), picks = lad.length >= 3 ? lad : bestBetterGood(list, wiz.mat, wiz.saw);
      h += "<h1>Here’s your lineup.</h1>" + says((MATQUIP[wiz.mat.k] || "Start at the top and work down.") + " " + list.length + (list.length === 1 ? " blade fits." : " fit. Start with these.")) +
        '<div class="results">' + (wiz.all
          ? rank(list, wiz.mat, wiz.saw).map(function (f) { return cardHTML(f, o); })
          : picks.map(function (p, i) { return cardHTML(p.f, { mat: wiz.mat, saw: wiz.saw, pick: i === 0, ribbon: p.label, rc: p.rc }); })).join("") + "</div>" +
        (list.length > picks.length && !wiz.all ? '<div class="center"><button class="btn ghost" data-all>See all ' + list.length + " blades</button></div>" : "") +
        '<div class="center"><a class="btn ghost" href="#ask-frank" data-keep>Still not sure? Ask ' + esc(FRANK) + "</a></div>";
    }
    app.innerHTML = shell(kick, 0, 0, h);
  }
  function frankMsg(pickName) {
    return "Hey " + FRANK + ", question from the Wisco site." + (wiz.mat ? " I’m cutting " + wiz.mat.n.toLowerCase() : "") + (wiz.saw ? " with a " + wiz.saw.n.toLowerCase() : "") + (wiz.want ? ". Priority: " + wiz.want.n.toLowerCase() : "") + "." + (pickName ? " The site says run the " + pickName + "." : "") + " My question: ";
  }
  function frankBox(pickName) {
    return '<div class="frank" data-frank="' + esc(pickName) + '"><b class="h">Want to talk it through with ' + esc(FRANK) + "?</b><p>Send your setup straight to him. A real person answers.</p>" +
      '<div class="sendrow">' + (W.textNumber ? '<button class="btn chrome sm" data-fsms>Text ' + esc(FRANK) + "</button>" : "") + '<button class="btn blue sm" data-femail>Email ' + esc(FRANK) + '</button><button class="btn ghost-d sm" data-fcopy>Copy my question</button></div>' +
      '<p class="note">' + (W.textDisplay ? "Text: <b style=\"user-select:all\">" + esc(W.textDisplay) + "</b> · " : "") + 'Email: <b style="user-select:all">' + esc(W.orderEmail || "") + "</b></p></div>";
  }

  function hitHTML(f, v) {
    return '<div class="hit" data-f="' + f.id + '" data-v="' + esc(vkey(v)) + '">' + pic(f) + "<div><h4>" + esc(f.n) + '</h4><div class="meta">' + esc(vlabel(v)) + "<br>" + esc(v[0]) + '</div></div><div class="r"><span class="p">' + money(v[3]) + '</span><span class="act">' + qtyHTML(1) + '<button class="add" data-add>Add</button></span></div></div>';
  }
  function searchVars(q, limit) {
    var t = q.toLowerCase().replace(/["”]/g, "").split(/\s+/).filter(Boolean), out = [];
    if (!t.length) return out;
    C.families.forEach(function (f) {
      var fn = f.n.toLowerCase();
      f.vars.forEach(function (v) {
        var hay = fn + " " + v[0].toLowerCase() + " " + v[0].toLowerCase().replace(/[^a-z0-9]/g, "") + " " + (v[1] + " " + v[4]).toLowerCase().replace(/"/g, "");
        var ok = t.every(function (x) { return /^\d+(\.\d+)?$/.test(x) && parseFloat(x) < 40 ? v[2] === parseFloat(x) : hay.indexOf(x) >= 0; });
        if (ok) out.push([f, v, (v[0].toLowerCase().indexOf(t[0]) === 0 ? 0 : 1) * 1000 + f.rank * 5 + f.i / 100]);
      });
    });
    return out.sort(function (a, b) { return a[2] - b[2]; }).slice(0, limit);
  }
  function reorder() {
    var last = store.get("last", null), n = last && last.items ? last.items.length : 0;
    app.innerHTML = shell("Fast Reorder", 0, 0,
      "<h1>Know what you run?</h1>" + says(QUIP.reorder[0]) +
      (n ? '<div class="last"><div><b>Same as last time?</b><span>' + n + (n === 1 ? " line" : " lines") + " from " + esc(last.date) + '</span></div><button class="btn red sm" data-reorder>Reorder it</button></div>' : "") +
      '<input class="search-big" id="rq" type="search" placeholder="Dragon 14   or   AES14SGC1" autocomplete="off" aria-label="Search by blade, size or part number">' +
      '<div class="hintchips" id="rhints">' + ["Dragon 14", "Superblade Extreme 14", "Super G 14", "T-Rex 14", "Viper 14", "Blue Tornado 7"].map(function (x) { return '<button data-hint="' + esc(x) + '">' + esc(x) + "</button>"; }).join("") + "</div>" +
      '<div class="hits" id="rhits"></div>' +
      (W.textNumber ? '<div class="frank"><b class="h">Easiest reorder there is</b><p>Snap a picture of your old blade and text it to ' + esc(FRANK) + '. We’ll read the label and write it up.</p><div class="sendrow"><button class="btn chrome sm" data-photo>Text ' + esc(FRANK) + " a photo</button></div><p class=\"note\">Text: <b style=\"user-select:all\">" + esc(W.textDisplay || "") + "</b></p></div>" : "") +
      '<div class="frank"><b class="h">Your rep can build your list for you</b><p>Ask your rep to text you a reorder link. It opens with your usual blades already in the cart.</p></div>');
    $("#rq").addEventListener("input", function (e) { runSearch(e.target.value); });
  }
  function runSearch(q) {
    var hits = searchVars(q.trim(), 40), box = $("#rhits");
    $("#rhints").hidden = !!q.trim();
    box.innerHTML = !q.trim() ? "" : hits.length ? hits.map(function (h) { return hitHTML(h[0], h[1]); }).join("") : '<div class="empty">No match for “' + esc(q) + "”. Try the blade name or fewer words, or ask " + esc(FRANK) + ".</div>";
  }

  function shopScreen() {
    var cats = [{ k: "all", n: "Everything" }].concat(C.cats.filter(function (c) { return C.families.some(function (f) { return f.cats.indexOf(c.k) >= 0; }); }));
    var t = shop.q.toLowerCase().split(/\s+/).filter(Boolean);
    var list = C.families.filter(function (f) { return (shop.cat === "all" || f.cats.indexOf(shop.cat) >= 0) && t.every(function (x) { return f.hay.indexOf(x) >= 0; }); });
    var grid = list.length ? list.map(function (f) { return cardHTML(f); }).join("") : '<div class="empty d" style="grid-column:1/-1">Nothing matches. Try fewer words, or ask ' + esc(FRANK) + ".</div>";
    if ($("#shopgrid")) { $("#shopgrid").innerHTML = grid; $("#shopn").textContent = list.length + " products"; $$(".cat").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === shop.cat); }); return; }
    app.innerHTML = '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Shop everything</h2><p>Every blade, bit, chain and saw, with a Buy It Now price on it.</p></div>' +
      '<div class="cats">' + cats.map(function (c) { return '<button class="cat" data-cat="' + c.k + '" aria-pressed="' + (shop.cat === c.k) + '">' + esc(c.n) + "</button>"; }).join("") + "</div>" +
      '<div class="shopbar"><input id="sq" type="search" placeholder="Search blade, size or part #" aria-label="Search" value="' + esc(shop.q) + '"><b id="shopn">' + list.length + ' products</b></div><div class="grid" id="shopgrid">' + grid + "</div></div></section>";
    $("#sq").addEventListener("input", function (e) { shop.q = e.target.value.trim(); shopScreen(); });
    setNav("#shop");
  }

  function lineScreen(k) {
    var L = byK(LINES, k); if (!L) return home();
    var fs = L.ids.map(function (id) { return FAM[id]; }).filter(Boolean);
    app.innerHTML = shell("Our heavy hitters", 0, 0, "<h1>" + esc(L.n) + ".</h1>" + says(L.s) + '<div class="results">' + fs.map(function (f) { return cardHTML(f); }).join("") + "</div>" + frankBox(""));
  }

  /* ---------- saw deal calculator ---------- */
  var SD = C.sawdeal || { tiers: [], saws: [] };
  function dealBlades() { return C.families.filter(function (f) { return f.vars.some(function (v) { return v[5]; }); }); }
  function dealCount() { return deal.lines.reduce(function (n, l) { return n + l.q; }, 0); }
  function dealTier(n) { var t = null; SD.tiers.forEach(function (x) { if (n >= x[0]) t = x; }); return t; }
  function dealTotal() {
    var saw = SD.saws.filter(function (s) { return s.sku === deal.saw; })[0], n = dealCount(), t = dealTier(n);
    if (!saw || !t || !SD.totals) return null;
    var base = saw.b; deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v && v[5]) base += v[5] * l.q; });
    return Math.round(base * t[1] / 1.7);
  }
  function dealBIN() {
    var hit = SKU[(deal.saw || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")], sawP = hit ? hit[0].vars[hit[1]][3] : 0, blades = 0;
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) blades += v[3] * l.q; });
    return { saw: sawP, blades: blades };
  }
  function sawDeal() {
    var fams = dealBlades(), n = dealCount(), t = dealTier(n), tot = dealTotal();
    var next = SD.tiers.filter(function (x) { return x[0] > n; })[0];
    var max = SD.tiers.length ? SD.tiers[SD.tiers.length - 1][0] : 36;
    var saw = SD.saws.filter(function (s) { return s.sku === deal.saw; })[0];
    var bin = dealBIN(), sawNet = tot ? tot - bin.blades : 0, save = tot ? bin.saw + bin.blades - tot : 0;
    var dq = !saw ? "Pick the saw you want. Then we stack blades till the price behaves." : !t ? (SD.tiers[0][0] - n) + " more blades and you’ve got yourself a saw deal." : next ? "You’re in. " + (next[0] - n) + " more gets you the " + next[0] + "-pack and a better number." : "That’s the top tier. Send it over and I’ll sharpen the pencil.";
    var h = "<h1>Build your saw deal.</h1>" + says(dq) + '<p class="lead">Pick a gas saw. Stack 15, 25 or 36 blades, any 12" to 16" blade, mix and match. Every tier knocks the saw price down. Stack enough and the saw is free.</p>' +
      '<div class="frank"><b class="h">1. Pick your saw</b><select id="dsaw" class="bigsel" aria-label="Saw"><option value="">Choose a saw…</option>' + SD.saws.map(function (s) { return '<option value="' + esc(s.sku) + '"' + (s.sku === deal.saw ? " selected" : "") + ">" + esc(s.n) + "</option>"; }).join("") + "</select></div>" +
      '<div class="frank"><b class="h">2. Stack your blades</b><div class="dealadd"><select id="dfam" aria-label="Blade">' + fams.map(function (f) { return '<option value="' + f.id + '">' + esc(f.n) + "</option>"; }).join("") + '</select><select id="dvar" aria-label="Size"></select>' + qtyHTML(5) + '<button class="add" data-dealadd>Add</button></div>' +
      (deal.lines.length ? '<div class="deallines">' + deal.lines.map(function (l, i) { var f = FAM[l.f], v = f && findVar(f, l.v); return v ? '<div class="dl" data-i="' + i + '"><span><b>' + l.q + " x " + esc(f.n) + "</b><small>" + esc(vlabel(v)) + '</small></span><button class="link" data-dealrm>Remove</button></div>' : ""; }).join("") + "</div>" : '<p class="note">No blades yet. Add at least 15 to unlock a saw deal.</p>') + "</div>" +
      '<div class="meter"><div class="bar"><i style="width:' + Math.min(100, n / max * 100) + '%"></i>' + SD.tiers.map(function (x) { return '<em style="left:' + (x[0] / max * 100) + '%" class="' + (n >= x[0] ? "hit" : "") + '">' + x[0] + "</em>"; }).join("") + "</div>" +
      '<div class="meterline"><b>' + n + (n === 1 ? " blade" : " blades") + "</b>" + (next ? "<span>Add " + (next[0] - n) + " more to hit the " + next[0] + "-pack" + (t ? " and a better deal" : " and unlock a saw deal") + "</span>" : "<span>Top tier. That’s the best deal we publish.</span>") + "</div></div>" +
      (tot ? '<div class="dealtotal"><span>' + (sawNet <= 0 ? "FREE SAW UNLOCKED" : "SAW DEAL UNLOCKED") + " · " + t[0] + '-pack</span><b>' + money(tot) + "</b><small>Complete package: " + n + " blades plus the " + esc(saw.n) + ".</small>" +
          (save > 0 ? "<strong>You save " + money(save) + " vs Buy It Now." + (sawNet <= 0 ? " The saw is free." : " The saw works out to " + money(sawNet) + ", down from " + money(bin.saw) + ".") + "</strong>" : "") + "<small>Freight and tax confirmed by your rep.</small></div>"
        : (saw && t) ? '<div class="dealtotal"><span>SAW DEAL UNLOCKED · ' + t[0] + '-pack</span><b class="sm">Your rep sends the package price</b><small>' + n + " blades plus the " + esc(saw.n) + ". Send it over and you’ll have a number back fast. Bigger stack, better deal.</small></div>"
        : '<div class="dealtotal off"><span>' + (!saw ? "Pick a saw to see your package" : "Add " + (SD.tiers[0][0] - n) + " more blades to unlock a saw deal") + "</span></div>") +
      '<div class="center"><button class="btn chrome shine" data-dealsend' + (saw && t ? "" : " disabled") + ">Send this saw deal to my rep</button>" + (deal.lines.length ? '<button class="btn ghost" data-dealclear>Start over</button>' : "") + "</div>" +
      '<p class="note light">Want a saw that isn’t listed, or a bigger stack than 36? Your rep can build any package. That’s where the real deals are.</p>';
    app.innerHTML = shell("Build your own saw deal", 0, 0, h);
    fillDealVars(); setNav("#saw-deal");
  }
  function fillDealVars() {
    var f = FAM[$("#dfam").value]; if (!f) return;
    var vs = f.vars.filter(function (v) { return v[5]; }), d = defVar(f, vs);
    $("#dvar").innerHTML = vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === d ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("");
  }
  function dealText() {
    var saw = SD.saws.filter(function (s) { return s.sku === deal.saw; })[0], n = dealCount(), t = dealTier(n), L = [];
    L.push("SAW DEAL REQUEST (" + (t ? t[0] + "-pack" : n + " blades") + ")");
    if (saw) L.push("Saw: " + saw.n + " (" + saw.sku + ")");
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) L.push(l.q + " x " + v[0] + "  " + f.n + " " + vlabel(v)); });
    var tot = dealTotal(); if (tot) L.push("Package total shown on site: " + money(tot));
    return L.join("\n");
  }

  /* ---------- equipment + depth chart ---------- */
  function equipment() {
    var rows = SD.saws.map(function (s) { var hit = SKU[s.sku.toUpperCase().replace(/[^A-Z0-9.]/g, "")]; var v = hit && hit[0].vars[hit[1]]; var d = (s.n.match(/(\d+)"/) || [])[1]; var depth = { 12: '4"', 14: '5"', 16: '6"' }[d] || ""; return v ? "<tr><td>" + esc(s.n) + "</td><td>" + (d ? d + '"' : "") + "</td><td>" + depth + "</td><td class=\"num\">" + money(v[3]) + '</td><td><button class="add" data-eqadd="' + esc(s.sku) + '">Add</button></td></tr>' : ""; }).join("");
    var eq = C.families.filter(function (f) { return f.cats.indexOf("equip") >= 0 || f.cats.indexOf("dust") >= 0; });
    app.innerHTML = shell("Equipment deals", 0, 0,
      "<h1>If they make it, we can get it.</h1>" + says(QUIP.equipment[0]) +
      '<div class="frank"><b class="h">Tell us what you’re looking for</b><p>Make, model, size, new or used, how soon. The more you give us, the better the deal we can chase. Buying blades in bulk? We can often eat most or all of the equipment cost.</p><div class="sendrow"><button class="btn chrome sm shine" data-equip>Have my rep hunt it down</button><a class="btn blue sm" href="#saw-deal">Build a free-saw deal</a></div></div>' +
      '<div class="frank"><b class="h">Gas cut-off saws, side by side</b><div class="tablewrap"><table class="cmp"><thead><tr><th>Saw</th><th>Blade</th><th>Max depth</th><th class="num">Buy It Now</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="note">Depth is typical for that blade size. Buy It Now is the one-saw price. Bundle it with blades and the number drops fast.</p></div>' +
      '<h2 class="wiz-h2">Equipment on the shelf</h2><div class="results two-up">' + eq.map(function (f) { return cardHTML(f); }).join("") + "</div>", true);
    setNav("#equipment");
  }
  function depth() {
    app.innerHTML = shell("Cutting depth chart", 0, 0,
      "<h1>How deep will it cut?</h1>" + says(QUIP.depth[0]) + '<p class="lead">Typical maximum depth of cut by blade size. Your saw’s guard and flanges can change it by up to half an inch.</p>' +
      DEPTH.map(function (g) { return '<div class="frank"><b class="h">' + esc(g[0]) + '</b><div class="tablewrap"><table class="cmp"><thead><tr><th>Blade / tool</th><th>Max depth of cut</th></tr></thead><tbody>' + g[1].map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>"; }).join("") +
      '<div class="center"><a class="btn chrome" href="#finder">Find the blade for it</a></div>');
    setNav("");
  }

  function route() {
    var h = location.hash || "#home";
    if (h.indexOf("#blade-") === 0) { var f = FAM[h.slice(7)]; if (!app.innerHTML) home(); if (f) openDetail(f); return; }
    window.scrollTo(0, 0);
    if (h === "#finder" || h === "#ask-frank") {
      var mode = h === "#finder" ? "finder" : "ask";
      if (!wiz.keep) { wiz.mat = wiz.saw = null; }
      wiz.keep = false; wiz.mode = mode; wiz.want = null; wiz.all = false; wizard(); setNav(h); bfShow("mat");
    } else if (h === "#reorder") { reorder(); setNav(h); bfShow("reorder"); }
    else if (h === "#shop") { app.innerHTML = ""; shopScreen(); bfShow("shop"); }
    else if (h === "#saw-deal") { sawDeal(); bfShow("equipment"); }
    else if (h === "#equipment") { equipment(); bfShow("equipment"); }
    else if (h === "#depth") { depth(); bfShow("depth"); }
    else if (h.indexOf("#line-") === 0) { lineScreen(h.slice(6)); setNav(""); bfShow("line"); }
    else { home(); bfShow("home"); }
  }

  /* ---------- floating Big Frank ---------- */
  var bfCtx = "home", bfI = 0;
  function bfLines() {
    var t = totals(), a = (QUIP[bfCtx] || QUIP.home).slice();
    if (bfCtx === "results" && wiz.mat && MATQUIP[wiz.mat.k]) a = [MATQUIP[wiz.mat.k]];
    if (t.units) { var nb = BREAKS.filter(function (q) { return q > t.units; })[0]; if (nb) a.unshift("You’ve got " + t.units + " on the order. " + (nb - t.units) + " more hits the " + nb + "-piece break."); }
    return a;
  }
  function bfShow(ctx) { if (ctx) { bfCtx = ctx; bfI = 0; } var a = bfLines(); $("#bfp").textContent = a[bfI % a.length]; }
  function bfOpen(open) { $("#bf").classList.toggle("open", open); store.set("bf", open ? 1 : 0); }

  /* ---------- cart ---------- */
  function cartLines() { return cart.map(function (c) { var f = FAM[c.f], v = f && findVar(f, c.v); return f && v ? { c: c, f: f, v: v } : null; }).filter(Boolean); }
  function totals() { var L = cartLines(), t = 0, n = 0; L.forEach(function (l) { n += l.c.q; t += l.v[3] * l.c.q; }); return { lines: L, total: t, units: n }; }
  function addToCart(fid, key, q) {
    q = Math.max(1, Math.min(9999, parseInt(q, 10) || 1));
    var hit = cart.filter(function (c) { return c.f === fid && c.v === key; })[0];
    if (hit) hit.q += q; else cart.push({ f: fid, v: key, q: q });
    saveCart();
  }
  function saveCart() { store.set("cart", cart); badge(); bfI = 0; bfShow(); }
  function badge() {
    var t = totals(); $("#cartn").textContent = t.units; $("#dock").hidden = !t.units; $("#fab").hidden = !!t.units;
    if (t.units) $("#dockinfo").innerHTML = "<b>" + t.units + (t.units === 1 ? " item" : " items") + " · " + money(t.total) + "</b><span>Buy It Now total, before your price breaks</span>";
  }
  function renderCart() {
    var t = totals(), b = $("#cartbody");
    if (!t.lines.length) { b.innerHTML = '<div class="empty d">Your order’s empty. Hit Blade Finder or Fast Reorder and load it up.</div>'; $("#cartfoot").hidden = true; return; }
    $("#cartfoot").hidden = false;
    var nb = BREAKS.filter(function (q) { return q > t.units; })[0], pb = BREAKS.filter(function (q) { return q <= t.units; }).pop();
    var hasCat = {}; t.lines.forEach(function (l) { l.f.cats.forEach(function (c) { hasCat[c] = 1; }); });
    var cq = nb && nb - t.units <= 6 ? "You’re " + (nb - t.units) + " away from the " + nb + "-piece break. Just saying." : !hasCat.core ? "No core bits on here? Same freight bill either way." : !hasCat.small && !hasCat.cup ? "Got grinders on the truck? Small blades and cup wheels ride free on this freight." : "Looks like a good order. Ask for your price break before you send it.";
    var nudge = '<div class="nudge">' + says(cq) + (nb ? '<div class="nbar"><i style="width:' + Math.min(100, t.units / nb * 100) + '%"></i></div><span>' + (pb ? "You’ve hit the " + pb + "-piece break. " : "") + (nb - t.units) + " more to the " + nb + "-piece price break.</span>" : "<span>You’ve hit our biggest listed break. Your rep takes it from here.</span>") + "</div>";
    b.innerHTML = nudge + t.lines.map(function (l, i) {
      return '<div class="line" data-i="' + i + '"><div><h4>' + esc(l.f.n) + '</h4><div class="meta">' + esc(vlabel(l.v)) + "<br>" + esc(l.v[0]) + " · " + money(l.v[3]) + ' each</div></div><div class="lp">' + money(l.v[3] * l.c.q) + "</div><div>" + qtyHTML(l.c.q) + '</div><button class="rm" data-rm>Remove</button></div>';
    }).join("") + '<div class="callout"><b>That’s Buy It Now. Buy more, pay less.</b><span>Ask your rep for ' + BREAKS.join(", ") + ' piece price breaks, or your account pricing.</span><button class="btn blue sm" data-breaks>Get my price breaks</button></div>';
    $("#carttot").innerHTML = "<span>Buy It Now total</span><span>" + money(t.total) + "</span>";
    $("#cartnote").textContent = "Freight and tax are confirmed by your rep. Nothing is charged on this site.";
  }

  /* ---------- before you send it ---------- */
  function openExtras() {
    var t = totals(), have = {};
    t.lines.forEach(function (l) { l.f.cats.forEach(function (c) { have[c] = 1; }); });
    var miss = DONTFORGET.filter(function (d) { return !have[d.cat]; });
    extras = { free: "", stock: false, breaks: [] };
    $("#extrasbody").innerHTML =
      '<div class="xcard gift"><b>With every order: 1 item at our cost.</b><span>Our way of saying thanks for the business. Pick the one you want at our cost and your rep sends back the number.</span><select id="xfree" aria-label="Item at cost"><option value="">Let my rep pick the best one</option>' + t.lines.map(function (l, i) { return '<option value="' + i + '">' + esc(l.f.n + " " + vlabel(l.v)) + "</option>"; }).join("") + "</select></div>" +
      '<div class="xcard"><b>Stock up and save.</b><span>We keep deep inventory on Dragon, Superblade Extreme, Super G, T-Rex, Viper and Eagle. Want our stock-up pricing on those?</span><label class="xcheck"><input type="checkbox" id="xstock"> Yes, have my rep quote stock-up pricing</label></div>' +
      '<div class="xcard"><b>Buying in quantity?</b><span>Tap the price breaks you want quoted.</span><div class="xchips" id="xbreaks">' + BREAKS.map(function (q) { return '<button type="button" data-xbreak="' + q + '" aria-pressed="false">' + q + "</button>"; }).join("") + "</div></div>" +
      (miss.length ? '<div class="xcard"><b>Don’t forget your…</b><span>One order, one freight bill. Tap to add.</span><div class="xchips">' + miss.map(function (d) { return '<button type="button" data-xcat="' + d.cat + '">' + esc(d.n) + "</button>"; }).join("") + "</div></div>" : "");
    $("#cart").close(); $("#extras").showModal();
  }

  /* ---------- send ---------- */
  var mode = "order";
  var MODES = {
    order: { title: "Send my order", intro: "Fill this in once. This phone remembers it, so next time it’s two taps.", head: "DBW WISCO ORDER", subj: "Order" },
    pricing: { title: "Get my price breaks", intro: "Tell us which pricing to check. Your rep comes back with your real numbers.", head: "DBW WISCO PRICING REQUEST", subj: "Pricing request" },
    saw: { title: "Send my saw deal", intro: "Your rep confirms the package, freight and ship date, then it’s yours.", head: "DBW WISCO SAW DEAL", subj: "Saw deal request" },
    equip: { title: "Find me equipment", intro: "Give us as much as you can: make, model, size, new or used, how soon.", head: "DBW WISCO EQUIPMENT REQUEST", subj: "Equipment request", msg: "What are you looking for? Make, model, anything you know" },
    feedback: { title: "How’d we do?", intro: "Good, bad or ugly. " + FRANK + " reads every one.", head: "DBW WISCO FEEDBACK", subj: "Feedback", msg: "Tell us how we did" }
  };
  function me() { return store.get("me", {}); }
  function repBySlug(s) { return (W.reps || []).filter(function (r) { return slug(r.name) === s; })[0]; }
  function initials(n) { return n.split(/\s+/).map(function (x) { return x[0]; }).join("").slice(0, 2).toUpperCase(); }
  function renderReps(cur) {
    $("#reps").innerHTML = '<button type="button" class="rep' + (!cur ? " on" : "") + '" data-rep=""><span class="av q">?</span><b>Not sure</b></button>' + (W.reps || []).map(function (r) {
      var s = slug(r.name);
      return '<button type="button" class="rep' + (cur === s ? " on" : "") + '" data-rep="' + s + '"><span class="av">' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : esc(initials(r.name))) + "</span><b>" + esc(r.name) + "</b></button>";
    }).join("");
    $("#f-rep").value = cur || "";
  }
  function openSend(m) {
    mode = m; var M = MODES[m], info = me(), f = $("#sendform");
    $("#sendtitle").textContent = M.title; $("#sendintro").textContent = M.intro;
    $("#discwrap").hidden = m !== "pricing";
    $("#msgwrap").hidden = !M.msg; if (M.msg) $("#msglabel").textContent = M.msg;
    $("#paywrap").hidden = $("#paynote").hidden = !(m === "order" || m === "saw");
    $("#fbwrap").hidden = m === "feedback";
    ["name", "company", "phone", "email"].forEach(function (k) { f.elements[k].value = info[k] || ""; });
    ["po", "notes", "msg", "feedback"].forEach(function (k) { f.elements[k].value = ""; });
    f.elements.fav.value = info.fav || "";
    f.elements.pay.innerHTML = (W.payments || []).map(function (p) { return "<option>" + esc(p) + "</option>"; }).join("");
    if (info.pay) f.elements.pay.value = info.pay;
    renderReps(repBySlug(info.rep) ? info.rep : "");
    $("#discs").innerHTML = (W.discounts || []).map(function (d, i) { return '<label><input type="checkbox" name="disc" value="' + esc(d) + '"' + (i < 2 ? " checked" : "") + "> " + esc(d) + "</label>"; }).join("");
    $("#textbtn").hidden = !W.textNumber; $("#textbtn").textContent = "Text it to " + FRANK; $("#sentmsg").hidden = true;
    preview(); ["cart", "detail", "extras"].forEach(function (id) { if ($("#" + id).open) $("#" + id).close(); }); $("#send").showModal(); $("#sendform").scrollTop = 0;
  }
  function formData() { var f = $("#sendform"), o = {}; ["name", "company", "phone", "email", "po", "notes", "rep", "pay", "fav", "feedback", "msg"].forEach(function (k) { o[k] = (f.elements[k].value || "").trim(); }); o.disc = $$('input[name="disc"]:checked', f).map(function (x) { return x.value; }); return o; }
  function buildText(o) {
    var t = totals(), rep = repBySlug(o.rep), L = [], M = MODES[mode], items = mode === "order" || mode === "pricing";
    L.push(M.head);
    L.push("From: " + (o.name || "(name)") + (o.company ? ", " + o.company : ""));
    if (o.phone) L.push("Phone: " + o.phone);
    if (o.email) L.push("Email: " + o.email);
    L.push("Salesman: " + (rep ? rep.name : "Not sure"));
    if (mode === "order" || mode === "saw") { L.push("Pay by: " + o.pay); if (o.po) L.push("PO #: " + o.po); }
    if (mode === "pricing" && o.disc.length) { L.push(""); L.push("Please check: " + o.disc.join("; ")); }
    if (M.msg && o.msg) { L.push(""); L.push(o.msg); }
    if (mode === "saw") { L.push(""); L.push(dealText()); }
    if (items) {
      L.push(""); L.push(t.lines.length ? "ITEMS" : "(no items in cart yet)");
      t.lines.forEach(function (l) { L.push(l.c.q + " x " + l.v[0] + "  " + l.f.n + " " + vlabel(l.v) + "  @ " + money(l.v[3]) + " = " + money(l.v[3] * l.c.q)); });
      if (t.lines.length) { L.push(""); L.push("Buy It Now total: " + money(t.total) + "  (before price breaks)"); }
    }
    if (mode === "order") {
      var x = [];
      if (t.lines.length) x.push("1 ITEM AT COST: " + (extras.free !== "" && t.lines[extras.free] ? t.lines[extras.free].v[0] + " " + t.lines[extras.free].f.n : "rep's pick"));
      if (extras.stock) x.push("Wants stock-up pricing on the most common blades");
      if (extras.breaks.length) x.push("Quote price breaks at: " + extras.breaks.join(", ") + " pieces");
      if (x.length) { L.push(""); x.forEach(function (s) { L.push(s); }); }
    }
    if (o.notes) { L.push(""); L.push("Notes: " + o.notes); }
    if (o.fav) L.push("Favorite team / athlete: " + o.fav);
    if (o.feedback) { L.push(""); L.push("FEEDBACK: " + o.feedback); }
    L.push(""); L.push("Sent from the DBW Wisco site" + (C.priceList ? " · " + C.priceList + " pricing" : ""));
    return L.join("\n");
  }
  function preview() { $("#preview").textContent = buildText(formData()); }
  function afterSend(how) {
    var o = formData(), t = totals();
    store.set("me", { name: o.name, company: o.company, phone: o.phone, email: o.email, rep: o.rep, pay: o.pay, fav: o.fav });
    if (mode === "order" && t.lines.length) store.set("last", { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), items: cart.slice() });
    var m = $("#sentmsg"); m.hidden = false;
    m.innerHTML = how === "posted" ? "<b>Sent.</b><span>A real person has it. Expect a call or text back.</span>"
      : how === "copied" ? "<b>Copied.</b><span>Paste it into a text or email to " + esc(FRANK) + ".</span>"
        : "<b>Last step: hit send in your " + (how === "sms" ? "messages" : "email") + " app.</b><span>It’s already written for you. If nothing opened, tap Copy and paste it to " + esc(how === "sms" ? (W.textDisplay || "") : (W.orderEmail || "")) + ".</span>";
    m.scrollIntoView({ block: "nearest" });
  }
  function needName() {
    var f = $("#sendform"), M = MODES[mode];
    if (M.msg && !f.elements.msg.value.trim()) { f.elements.msg.focus(); toast("Tell us a little so we know what to chase"); return true; }
    if (!f.elements.name.value.trim()) { f.elements.name.focus(); toast("Add your name so we know who it’s from"); return true; }
    return false;
  }
  function mailto(to, subj, body) { location.href = "mailto:" + encodeURIComponent(to || "") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); }
  function sms(body) { location.href = "sms:" + W.textNumber + "?&body=" + encodeURIComponent(body); }
  function sendEmail() {
    if (needName()) return;
    var o = formData(), rep = repBySlug(o.rep), body = buildText(o);
    var subj = MODES[mode].subj + " from " + (o.company || o.name) + (rep ? " (salesman: " + rep.name + ")" : "") + (o.po ? " PO " + o.po : "");
    var viaMail = function () { mailto(W.orderEmail, subj, body); afterSend("email"); };
    if (W.formEndpoint && !isPreview) {
      fetch(W.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: subj, name: o.name, company: o.company, phone: o.phone, email: o.email, salesman: rep ? rep.name : "", message: body }) })
        .then(function (r) { if (!r.ok) throw 0; afterSend("posted"); }).catch(viaMail);
    } else viaMail();
  }
  function copyText(txt, done) {
    var fb = function () { toast("Couldn’t copy automatically. Press and hold the text to copy."); };
    try { navigator.clipboard.writeText(txt).then(function () { done && done(); }, fb); } catch (e) { fb(); }
  }
  function shareLink() { var o = formData(); return location.origin + location.pathname + "?cart=" + cartLines().map(function (l) { return encodeURIComponent(l.v[0]) + "*" + l.c.q; }).join(",") + (o.rep ? "&rep=" + o.rep : ""); }

  /* ---------- product detail ---------- */
  function openDetail(f) {
    var vurl = (W.videos || {})[f.id], mats = Object.keys(f.m).sort(function (a, b) { return f.m[b] - f.m[a]; }), cur = wiz.mat ? wiz.mat.keys : [];
    var h = '<div class="pd"><div>' + pic(f) + "</div><div>" + (f.tier ? '<span class="tier ' + f.tier + '">' + TIER[f.tier] + "</span>" : "") + "<h3>" + esc(f.n) + "</h3>" +
      (f.hook ? '<p class="lede">' + esc(f.hook) + "</p>" : "") +
      (f.ben.length ? '<ul class="ben">' + f.ben.map(function (b) { return "<li>" + (b[0] ? "<b>" + esc(b[0]) + "</b>" : "") + esc(b[1]) + "</li>"; }).join("") + "</ul>" : (f.desc ? '<p class="note" style="font-size:15px;color:var(--ink)">' + esc(f.desc) + "</p>" : "")) + "</div></div>";
    if (TIERQUIP[f.tier]) h += says(TIERQUIP[f.tier]);
    h += '<div class="blk"><h4>Pick your size</h4><div class="sizes">' + f.vars.map(function (v) {
      return '<div class="sz' + (inSaw(v, wiz.saw) ? "" : " dim") + '" data-v="' + esc(vkey(v)) + '"><div><b>' + esc(vlabel(v)) + "</b><small>" + esc(v[0]) + '</small></div><div class="r"><span class="p">' + money(v[3]) + "</span>" + qtyHTML(1) + '<button class="add" data-add>Add</button></div></div>';
    }).join("") + "</div></div>";
    h += '<div class="callout"><b>Buy It Now, or buy more and pay less.</b><span>Ask your rep for ' + BREAKS.join(", ") + ' piece price breaks.</span><button class="btn blue sm" data-breaks>Get my price breaks</button></div>';
    if (mats.length) h += '<div class="blk"><h4>How it rates</h4><div class="rates">' + mats.map(function (k) { return '<div class="' + (cur.indexOf(k) >= 0 ? "on" : "") + '"><span>' + esc(MATNAME[k]) + "</span><span>" + stars(f.m[k]) + " " + f.m[k].toFixed(1) + "</span></div>"; }).join("") + "</div></div>";
    h += '<div class="blk"><h4>Watch it cut</h4>' + (vurl
      ? '<a class="video" href="' + esc(vurl) + '" target="_blank" rel="noopener"><span class="play"></span><span><b>See the ' + esc(f.n) + " in action</b><span>Opens the video in a new tab</span></span></a>"
      : '<div class="video soon"><span class="play"></span><span><b>Video coming soon</b><span>Want to see it cut first? Ask ' + esc(FRANK) + " for a demo.</span></span></div>") + "</div>";
    if (f.saws.length) h += '<div class="blk"><h4>Runs on</h4><div class="tags">' + f.saws.map(function (k) { return "<span>" + esc(SAWNAME[k]) + "</span>"; }).join("") + "</div></div>";
    $("#detailtitle").textContent = f.n;
    var b = $("#detailbody"); b.innerHTML = h; b.dataset.f = f.id; b.scrollTop = 0;
    if (!$("#detail").open) $("#detail").showModal();
  }

  /* ---------- events ---------- */
  function flash(el, txt) { el.classList.add("ok"); var old = el.textContent; el.textContent = txt || "Added ✓"; setTimeout(function () { el.classList.remove("ok"); el.textContent = old; }, 1100); }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if (t.closest("[data-bftoggle]")) { bfOpen(!$("#bf").classList.contains("open")); return; }
    if (t.closest("[data-bfhide]")) { bfOpen(false); return; }
    if (t.closest("[data-bfnext]")) { bfI++; bfShow(); return; }
    if (t.closest("[data-photo]")) { sms("Hey " + FRANK + ", here’s a picture of my blade. I need more of these. Name / company: "); return; }
    if ((el = t.closest("[data-mat]"))) { wiz.mat = byK(MATS, el.dataset.mat); wizard(); window.scrollTo(0, 0); bfShow(wiz.saw ? "results" : "saw"); return; }
    if ((el = t.closest("[data-saw]"))) { wiz.saw = byK(SAWS, el.dataset.saw); wizard(); window.scrollTo(0, 0); bfShow(wiz.mode === "ask" ? "want" : "results"); return; }
    if ((el = t.closest("[data-want]"))) { wiz.want = byK(WANTS, el.dataset.want); wizard(); window.scrollTo(0, 0); return; }
    if (t.closest("[data-all]")) { wiz.all = true; wizard(); return; }
    if (t.closest("[data-keep]")) { wiz.keep = true; return; }
    if (t.closest("[data-back]")) {
      var h = location.hash;
      if (h === "#finder" || h === "#ask-frank") { if (wiz.want) wiz.want = null; else if (wiz.saw) { wiz.saw = null; wiz.all = false; } else if (wiz.mat) wiz.mat = null; else return go("#home"); wizard(); return; }
      return go("#home");
    }
    if ((el = t.closest("[data-cat]"))) { shop.cat = el.dataset.cat; shopScreen(); return; }
    if ((el = t.closest("[data-hint]"))) { $("#rq").value = el.dataset.hint; runSearch(el.dataset.hint); return; }
    if ((el = t.closest("[data-q]"))) { var inp = $("input", el.parentNode); inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) + parseInt(el.dataset.q, 10)); inp.dispatchEvent(new Event("change", { bubbles: true })); return; }
    if ((el = t.closest("[data-dealadd]"))) {
      var q = Math.max(1, parseInt($(".dealadd .qty input").value, 10) || 1), fid2 = $("#dfam").value, key2 = $("#dvar").value;
      var ex = deal.lines.filter(function (l) { return l.f === fid2 && l.v === key2; })[0];
      if (ex) ex.q += q; else deal.lines.push({ f: fid2, v: key2, q: q });
      store.set("deal", deal); sawDeal(); return;
    }
    if ((el = t.closest("[data-dealrm]"))) { deal.lines.splice(parseInt(el.closest(".dl").dataset.i, 10), 1); store.set("deal", deal); sawDeal(); return; }
    if (t.closest("[data-dealclear]")) { deal = { saw: "", lines: [] }; store.set("deal", deal); sawDeal(); return; }
    if (t.closest("[data-dealsend]")) { openSend("saw"); return; }
    if ((el = t.closest("[data-eqadd]"))) { var hitE = SKU[el.dataset.eqadd.toUpperCase().replace(/[^A-Z0-9.]/g, "")]; if (hitE) { addToCart(hitE[0].id, vkey(hitE[0].vars[hitE[1]]), 1); flash(el); } return; }
    if ((el = t.closest("[data-add]"))) {
      var card = el.closest(".card"), sz = el.closest(".sz"), hit = el.closest(".hit"), fid, key, qty;
      if (sz) { fid = $("#detailbody").dataset.f; key = sz.dataset.v; qty = $("input", sz).value; }
      else if (hit) { fid = hit.dataset.f; key = hit.dataset.v; qty = $("input", hit).value; }
      else if (card) { fid = card.dataset.f; var sel = $("[data-size]", card); key = sel ? sel.value : vkey(defVar(FAM[fid], varsFor(FAM[fid], wiz.saw))); if (!findVar(FAM[fid], key)) key = vkey(FAM[fid].vars[0]); qty = $(".qty input", card).value; }
      if (fid) { addToCart(fid, key, qty); flash(el); }
      return;
    }
    if ((el = t.closest("[data-open]"))) { openDetail(FAM[el.closest(".card").dataset.f]); return; }
    if (t.closest("[data-pricing]") || t.closest("[data-breaks]")) { e.preventDefault(); openSend("pricing"); return; }
    if (t.closest("[data-equip]")) { openSend("equip"); return; }
    if (t.closest("[data-feedback]")) { openSend("feedback"); return; }
    if (t.closest("[data-cart]")) { ["detail", "extras", "send"].forEach(function (id) { if ($("#" + id).open) $("#" + id).close(); }); renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-checkout]")) { openExtras(); return; }
    if (t.closest("[data-tosend]")) { extras.free = $("#xfree").value; extras.stock = $("#xstock").checked; openSend("order"); return; }
    if (t.closest("[data-backcart]")) { $("#extras").close(); renderCart(); $("#cart").showModal(); return; }
    if ((el = t.closest("[data-xbreak]"))) { var qn = parseInt(el.dataset.xbreak, 10), ix = extras.breaks.indexOf(qn); if (ix >= 0) extras.breaks.splice(ix, 1); else extras.breaks.push(qn); extras.breaks.sort(function (a, b) { return a - b; }); el.setAttribute("aria-pressed", ix < 0); return; }
    if ((el = t.closest("[data-xcat]"))) { $("#extras").close(); shop.cat = el.dataset.xcat; shop.q = ""; app.innerHTML = ""; go("#shop"); return; }
    if ((el = t.closest("[data-rep]"))) { renderReps(el.dataset.rep); preview(); return; }
    if ((el = t.closest("[data-close]"))) { el.closest("dialog").close(); return; }
    if ((el = t.closest("[data-rm]"))) { cart.splice(parseInt(el.closest(".line").dataset.i, 10), 1); saveCart(); renderCart(); return; }
    if (t.closest("[data-reorder]")) { var last = store.get("last", null); if (last) { last.items.forEach(function (c) { if (FAM[c.f] && findVar(FAM[c.f], c.v)) addToCart(c.f, c.v, c.q); }); renderCart(); $("#cart").showModal(); } return; }
    if (t.closest("[data-email]")) { sendEmail(); return; }
    if (t.closest("[data-sms]")) { if (needName()) return; sms(buildText(formData())); afterSend("sms"); return; }
    if (t.closest("[data-copy]")) { if (needName()) return; copyText(buildText(formData()), function () { afterSend("copied"); }); return; }
    if (t.closest("[data-share]")) { copyText(shareLink(), function () { toast("Reorder link copied. Text it to anyone."); }); return; }
    if ((el = t.closest("[data-fsms]"))) { sms(frankMsg(el.closest("[data-frank]").dataset.frank)); return; }
    if ((el = t.closest("[data-femail]"))) { mailto(W.orderEmail, "Blade question from the Wisco site", frankMsg(el.closest("[data-frank]").dataset.frank)); return; }
    if ((el = t.closest("[data-fcopy]"))) { copyText(frankMsg(el.closest("[data-frank]").dataset.frank), function () { toast("Copied. Paste it in a text to " + FRANK + "."); }); return; }
    if (t.closest("[data-emptycart]")) { cart = []; saveCart(); renderCart(); return; }
    if (t.tagName === "DIALOG") t.close();
  });
  document.addEventListener("change", function (e) {
    var t = e.target, card = t.closest(".card"), line = t.closest(".line");
    if (t.matches("[data-size]") && card) { var f = FAM[card.dataset.f], keep = $(".qty input", card).value; $("[data-row]", card).outerHTML = buyRow(findVar(f, t.value)); $(".qty input", card).value = keep; }
    if (line && t.matches(".qty input")) { cart[parseInt(line.dataset.i, 10)].q = Math.max(1, parseInt(t.value, 10) || 1); saveCart(); renderCart(); }
    if (t.id === "dsaw") { deal.saw = t.value; store.set("deal", deal); sawDeal(); }
    if (t.id === "dfam") fillDealVars();
  });
  $("#sendform").addEventListener("input", preview);
  $("#sendform").addEventListener("submit", function (e) { e.preventDefault(); });
  window.addEventListener("hashchange", route);

  /* ---------- boot ---------- */
  $$("[data-phone]").forEach(function (a) { a.textContent = W.phone || ""; a.href = "tel:" + (W.phone || "").replace(/[^0-9+]/g, ""); });
  $$("[data-text]").forEach(function (a) { a.textContent = W.textDisplay || ""; a.href = "sms:" + (W.textNumber || ""); });
  $$("[data-oemail]").forEach(function (a) { a.textContent = W.orderEmail || ""; });
  $$("[data-pl]").forEach(function (a) { a.textContent = C.priceList || "current"; });
  var P = new URLSearchParams(location.search);
  if (P.get("rep")) { var info = me(); info.rep = slug(P.get("rep")); store.set("me", info); }
  if (P.get("cart")) {
    cart = [];
    P.get("cart").split(",").forEach(function (x) { var a = x.split("*"), hit = SKU[(a[0] || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")]; if (hit) cart.push({ f: hit[0].id, v: vkey(hit[0].vars[hit[1]]), q: Math.max(1, parseInt(a[1], 10) || 1) }); });
    store.set("cart", cart);
  }
  deal.lines = (deal.lines || []).filter(function (l) { return FAM[l.f] && findVar(FAM[l.f], l.v); });
  route(); badge();
  bfOpen(store.get("bf", 0) === 1);
  if (P.get("cart") && cart.length) { renderCart(); $("#cart").showModal(); }
})();
