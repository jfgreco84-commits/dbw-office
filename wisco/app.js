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
  var TIER = { supreme: "Best · Supreme grade", premium: "Better · Premium grade", standard: "Good · Standard grade", economy: "Value · Economy grade", pro: "Pro Series" };
  var TR = { supreme: 4, pro: 4, premium: 3, standard: 2, economy: 1, "": 0 };
  var SAWDIA = { grinder: [3, 9], cutoff: [12, 16], walk: [14, 99] };

  /* The questions. Short lists on purpose: one tap each. */
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
  /* The lines Wisco leads with. ids = blade ids from the catalog. */
  var LINES = [
    { k: "dragons", n: "The Dragons", s: "Our baddest multi-purpose blades. Red for life, Purple for everything.", ids: ["dragon-supreme", "dragon"], img: ["dragon-supreme", "dragon"] },
    { k: "superblades", n: "The Superblades", s: "G3, Extreme and Arrow. Built to drop your cost per cut.", ids: ["superblade-g3", "superblade-extreme", "superblade-arrow", "super-g"], img: ["superblade-g3", "superblade-arrow"] },
    { k: "zenesis", n: "Zenesis Green Kut", s: "Early-entry blades with Zenesis diamond alignment. More footage, chip-free joints.", ids: ["zenesis-green-kut-purple", "zenesis-green-kut-orange", "zenesis-green-kut-green", "zenesis-green-kut-red", "zenesis-green-kut-yellow"], img: ["zenesis-green-kut-purple"] },
    { k: "4-core", n: "4-Core Bits", s: "Punisher, Wolv and Sabertooth. Pro Series bits for the holes nobody else wants.", ids: ["punisher", "wolv", "sabertooth"], img: ["punisher", "wolv", "sabertooth"] }
  ];
  var byK = function (arr, k) { return arr.filter(function (x) { return x.k === k; })[0]; };

  var FAM = {}, SKU = {}, MATNAME = {}, SAWNAME = {};
  C.materials.forEach(function (m) { MATNAME[m.k] = m.n; });
  C.saws.forEach(function (s) { SAWNAME[s.k] = s.n; });
  C.families.forEach(function (f, i) {
    f.i = i; FAM[f.id] = f;
    f.hay = (f.n + " " + f.hook + " " + f.vars.map(function (v) { return v[0] + " " + v[1] + " " + v[4]; }).join(" ")).toLowerCase();
    f.vars.forEach(function (v, vi) { var k = v[0].toUpperCase().replace(/[^A-Z0-9.]/g, ""); if (!SKU[k]) SKU[k] = [f, vi]; });
  });

  var cart = store.get("cart", []);
  var isPreview = !/^https?:$/.test(location.protocol) || /claude|anthropic/.test(location.hostname);
  var wiz = { mode: "finder", mat: null, saw: null, want: null, all: false };
  var shop = { cat: "all", q: "" };

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
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }
  function buyRow(v) { return '<div class="buy-row" data-row><div class="price">' + money(v[3]) + "<small>each · " + esc(v[0]) + '</small></div><div class="act">' + qtyHTML(1) + '<button class="add" data-add>Add</button></div></div>'; }

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
      '<div class="buy">' + size + buyRow(first) + '<button class="more" data-open>Why this blade, ratings and all ' + f.vars.length + " sizes</button></div></article>";
  }

  /* ---------- picking blades ---------- */
  function candidates(mat, saw) {
    return C.families.filter(function (f) { return rating(f, mat) >= 3 && fitsSaw(f, saw) && (!saw || !SAWDIA[saw.k] || f.vars.some(function (v) { return inSaw(v, saw); })); });
  }
  function priceFor(f, saw) { var v = defVar(f, varsFor(f, saw)); return v[3]; }
  function rank(list, mat, saw, want) {
    var a = list.slice();
    a.sort(function (x, y) {
      var rx = rating(x, mat), ry = rating(y, mat);
      if (want === "price") return (priceFor(x, saw) - priceFor(y, saw)) || (ry - rx);
      if (want === "life") return (TR[y.tier] - TR[x.tier]) || (ry - rx) || (x.rank - y.rank);
      return (ry - rx) || (TR[y.tier] - TR[x.tier]) || (x.rank - y.rank) || (x.i - y.i);
    });
    return a;
  }
  function bestBetterGood(list, mat, saw) {
    var a = rank(list, mat, saw), out = [], used = {};
    [["supreme", "pro"], ["premium"], ["standard", "economy"]].forEach(function (tiers) {
      var hit = a.filter(function (f) { return tiers.indexOf(f.tier) >= 0 && !used[f.id]; })[0];
      if (hit) { used[hit.id] = 1; out.push(hit); }
    });
    a.forEach(function (f) { if (out.length < 3 && !used[f.id]) { used[f.id] = 1; out.push(f); } });
    return out.sort(function (x, y) { return TR[y.tier] - TR[x.tier]; });
  }

  /* ---------- screens ---------- */
  var app = $("#app");
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function setNav(h) { $$(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === h); }); }

  function home() {
    var top = C.families.filter(function (f) { return f.rank >= 9 && f.rank < 99; }).slice(0, 8);
    var line = ["dragon", "superblade-g3", "dragon-supreme", "superblade-arrow", "zenesis-green-kut-purple"];
    var lines = LINES.map(function (L) {
      var fs = L.ids.map(function (id) { return FAM[id]; }).filter(Boolean); if (!fs.length) return "";
      var from = Math.min.apply(null, fs.map(function (f) { return f.min; }));
      return '<a class="linecard" href="#line-' + L.k + '"><span class="lc-art">' + L.img.map(function (id) { return FAM[id] && FAM[id].img ? '<img alt="" loading="lazy" src="img/' + esc(FAM[id].img) + '">' : ""; }).join("") + "</span><b>" + esc(L.n) + "</b><span>" + esc(L.s) + '</span><em>From ' + money(from) + " →</em></a>";
    }).join("");
    app.innerHTML =
      '<section class="hero"><div class="wrap"><div>' +
      '<span class="pill"><i>★</i> A division of Diamond Blade Warehouse <i>★</i></span>' +
      "<h1>The right blade. Right now.</h1>" +
      '<p class="sub">Tell us what you cut. We ship it anywhere in the USA. <b>Your blades, your price, 60 seconds.</b></p>' +
      '<div class="doors">' +
      '<a class="door d1 shine" href="#finder"><div><b>Blade Finder</b><span>Two taps. We line up the right blade.</span></div><em>→</em></a>' +
      '<a class="door d2" href="#reorder"><div><b>Fast Reorder</b><span>Know what you run? Punch it in and go.</span></div><em>→</em></a>' +
      '<a class="door d3" href="#ask-frank"><div><b>Ask ' + esc(FRANK) + "</b><span>Not sure? Get " + esc(FRANK) + "’s pick in 3 taps.</span></div><em>→</em></a>" +
      "</div>" +
      '<div class="tiny">Got an account? <a href="#" data-pricing>Get your account pricing</a> · or <a href="#shop">shop everything</a></div>' +
      '</div><div class="art"><img class="logo" src="brand/logo.webp" alt="Diamond Blade Warehouse Wisconsin" width="430" height="458">' +
      '<div class="stage"><div class="lineup">' + line.map(function (n) { return '<img alt="" src="brand/lineup/' + n + '.webp">'; }).join("") + "</div></div></div></div></section>" +
      '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>Our heavy hitters</h2><p>The blades and bits we put our name on.</p></div><div class="lines">' + lines + '</div></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sec-head"><h2>What the crews run</h2><p>The everyday blades contractors across the country reorder the most.</p></div><div class="rail">' + top.map(function (f) { return cardHTML(f); }).join("") + '</div><div class="center"><a class="btn blue" href="#shop">Shop everything</a></div></div></section>' +
      '<section class="sec dark"><div class="wrap"><div class="sec-head"><h2>How we do it</h2><p>No runaround. No shopping cart games.</p></div><div class="three">' +
      '<div class="point"><b>A real rep, every order</b><p>Nothing here charges a card. Your order hits your rep, who confirms price, freight and ship date before it moves.</p></div>' +
      '<div class="point"><b>List price is the ceiling</b><p>Account, quantity and Platinum pricing still apply. One button gets you your real numbers.</p></div>' +
      '<div class="point"><b>Best. Better. Good.</b><p>Every blade is graded and star-rated for the exact material you cut. No guessing.</p></div>' +
      "</div></div></section>";
    setNav("#home");
  }

  function dots(n, total) { var s = ""; for (var i = 1; i <= total; i++) s += '<i class="' + (i < n ? "done" : i === n ? "on" : "") + '"></i>'; return '<div class="dots" aria-label="Step ' + n + " of " + total + '">' + s + "</div>"; }
  function tiles(list, attr, cls) { return '<div class="tiles ' + (cls || "") + '">' + list.map(function (x) { return '<button class="tile" data-' + attr + '="' + x.k + '"><b>' + esc(x.n) + "</b><span>" + esc(x.s) + "</span></button>"; }).join("") + "</div>"; }
  function shell(kicker, step, total, body) {
    return '<section class="screen wiz"><div class="wrap"><div class="wiz-top"><button class="back" data-back>← Back</button>' + (total ? dots(step, total) : "") + '</div><div class="wiz-kicker">' + kicker + "</div>" + body + "</div></section>";
  }
  function chosen() { var a = []; if (wiz.mat) a.push(wiz.mat.n); if (wiz.saw) a.push(wiz.saw.n); if (wiz.want) a.push(wiz.want.n); return a.length ? '<div class="chosen">' + a.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : ""; }

  function wizard() {
    var ask = wiz.mode === "ask", total = ask ? 3 : 2, kick = ask ? "Ask " + esc(FRANK) : "Blade Finder";
    if (!wiz.mat) { app.innerHTML = shell(kick, 1, total, "<h1>What are you cutting?</h1>" + '<p class="lead">Tap one.</p>' + tiles(MATS, "mat")); return; }
    if (!wiz.saw) {
      var saws = SAWS.filter(function (s) { return candidates(wiz.mat, s).length; });
      if (saws.length === 1) { wiz.saw = saws[0]; return wizard(); }
      app.innerHTML = shell(kick, 2, total, chosen() + "<h1>What saw are you running?</h1>" + '<p class="lead">We only show sizes that fit it.</p>' + tiles(saws, "saw")); return;
    }
    if (ask && !wiz.want) { app.innerHTML = shell(kick, 3, total, chosen() + "<h1>What matters most?</h1>" + '<p class="lead">Be honest. ' + esc(FRANK) + " won’t judge.</p>" + tiles(WANTS, "want")); return; }
    var list = candidates(wiz.mat, wiz.saw), o = { mat: wiz.mat, saw: wiz.saw }, h = chosen();
    if (!list.length) { app.innerHTML = shell(kick, 0, 0, h + "<h1>That one’s a phone call.</h1>" + '<div class="empty">Nothing on the shelf matches that combo. ' + esc(FRANK) + " will spec it for you.</div>" + frankBox("")); return; }
    if (ask) {
      var r = rank(list, wiz.mat, wiz.saw, wiz.want.k), top = r[0], alts = r.slice(1, 3);
      var why = { speed: "it’s the fastest thing we’ve got for that job", life: "it’ll outlast anything else on that saw", price: "it’s the lowest cost-in that still does the job right", frank: "it’s what I’d put on my own saw" }[wiz.want.k];
      h += "<h1>" + esc(FRANK) + " says: run the " + esc(top.n) + ".</h1>" + '<p class="lead">For ' + esc(wiz.mat.n.toLowerCase()) + " on a " + esc(wiz.saw.n.toLowerCase()) + ", " + why + ".</p>" +
        '<div class="results">' + cardHTML(top, { mat: wiz.mat, saw: wiz.saw, pick: 1, ribbon: "★ " + esc(FRANK) + "’s Pick", ribbon2: esc(wiz.want.n) }) +
        alts.map(function (f, i) { return cardHTML(f, { mat: wiz.mat, saw: wiz.saw, ribbon: i ? "Also solid" : "Runner-up", rc: i ? "g" : "b" }); }).join("") + "</div>" + frankBox(top.n);
    } else {
      var bbg = bestBetterGood(list, wiz.mat, wiz.saw), lab = [["★ Best", ""], ["Better", "b"], ["Good", "g"]];
      h += "<h1>Here’s your lineup.</h1>" + '<p class="lead">' + list.length + (list.length === 1 ? " blade fits." : " blades fit. These are the ones to look at first.") + "</p>" +
        '<div class="results">' + (wiz.all ? rank(list, wiz.mat, wiz.saw) : bbg).map(function (f, i) {
          var t = wiz.all ? null : lab[Math.min(i, 2)];
          return cardHTML(f, t ? { mat: wiz.mat, saw: wiz.saw, pick: i === 0, ribbon: t[0], rc: t[1] } : o);
        }).join("") + "</div>" +
        (list.length > bbg.length && !wiz.all ? '<div class="center"><button class="btn ghost" data-all>See all ' + list.length + " blades</button></div>" : "") +
        '<div class="center"><a class="btn ghost" href="#ask-frank" data-keep>Still not sure? Ask ' + esc(FRANK) + "</a></div>";
    }
    app.innerHTML = shell(kick, 0, 0, h);
  }
  function frankMsg(pickName) {
    return "Hey " + FRANK + ", question from the Wisco site." + (wiz.mat ? " I’m cutting " + wiz.mat.n.toLowerCase() : "") + (wiz.saw ? " with a " + wiz.saw.n.toLowerCase() : "") + (wiz.want ? ". Priority: " + wiz.want.n.toLowerCase() : "") + "." + (pickName ? " The site says run the " + pickName + "." : "") + " My question: ";
  }
  function frankBox(pickName) {
    return '<div class="frank" data-frank="' + esc(pickName) + '"><b class="h">Want to talk it through with ' + esc(FRANK) + "?</b><p>Send your setup straight to him. He’ll answer you personally.</p>" +
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
        var hay = fn + " " + v[0].toLowerCase() + " " + v[0].toLowerCase().replace(/[^a-z0-9]/g, "") + " " + (v[1] + " " + v[4]).toLowerCase().replace(/"/g, "") + " " + (v[2] != null ? v[2] : "");
        var ok = t.every(function (x) { return /^\d+(\.\d+)?$/.test(x) && parseFloat(x) < 40 ? v[2] === parseFloat(x) : hay.indexOf(x) >= 0; });
        if (ok) out.push([f, v, (v[0].toLowerCase().indexOf(t[0]) === 0 ? 0 : 1) * 1000 + f.rank * 5 + f.i / 100]);
      });
    });
    return out.sort(function (a, b) { return a[2] - b[2]; }).slice(0, limit);
  }
  function reorder() {
    var last = store.get("last", null), n = last && last.items ? last.items.length : 0;
    app.innerHTML = shell("Fast Reorder", 0, 0,
      "<h1>Know what you run?</h1>" + '<p class="lead">Type the blade name, the size, or the part number off your old blade.</p>' +
      (n ? '<div class="last"><div><b>Same as last time?</b><span>' + n + (n === 1 ? " line" : " lines") + " from " + esc(last.date) + '</span></div><button class="btn red sm" data-reorder>Reorder it</button></div>' : "") +
      '<input class="search-big" id="rq" type="search" placeholder="Super G 14   or   AES14SGC1" autocomplete="off" aria-label="Search by blade, size or part number">' +
      '<div class="hintchips" id="rhints">' + ["Super G 14", "Blue Tornado 7", "Blacksmyth 14", "T-Rex 14", "Jaguar 4.5", "Turbo Cup 7"].map(function (x) { return '<button data-hint="' + esc(x) + '">' + esc(x) + "</button>"; }).join("") + "</div>" +
      '<div class="hits" id="rhits"></div>' +
      '<div class="frank"><b class="h">Your rep can build your list for you</b><p>Ask your rep to text you a reorder link. It opens with your usual blades already in the cart.</p></div>');
    $("#rq").addEventListener("input", function (e) { runSearch(e.target.value); });
    setTimeout(function () { try { $("#rq").focus({ preventScroll: true }); } catch (e) { } }, 50);
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
    app.innerHTML = '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Shop everything</h2><p>Every blade, bit and chain with a price on it.</p></div>' +
      '<div class="cats">' + cats.map(function (c) { return '<button class="cat" data-cat="' + c.k + '" aria-pressed="' + (shop.cat === c.k) + '">' + esc(c.n) + "</button>"; }).join("") + "</div>" +
      '<div class="shopbar"><input id="sq" type="search" placeholder="Search blade, size or part #" aria-label="Search" value="' + esc(shop.q) + '"><b id="shopn">' + list.length + ' products</b></div><div class="grid" id="shopgrid">' + grid + "</div></div></section>";
    $("#sq").addEventListener("input", function (e) { shop.q = e.target.value.trim(); shopScreen(); });
    setNav("#shop");
  }

  function lineScreen(k) {
    var L = byK(LINES, k); if (!L) return home();
    var fs = L.ids.map(function (id) { return FAM[id]; }).filter(Boolean);
    app.innerHTML = shell("Our heavy hitters", 0, 0, "<h1>" + esc(L.n) + ".</h1>" + '<p class="lead">' + esc(L.s) + '</p><div class="results">' + fs.map(function (f) { return cardHTML(f); }).join("") + "</div>" + frankBox(""));
  }

  function route() {
    var h = location.hash || "#home";
    if (h.indexOf("#blade-") === 0) { var f = FAM[h.slice(7)]; if (!app.innerHTML) home(); if (f) openDetail(f); return; }
    window.scrollTo(0, 0);
    if (h === "#finder" || h === "#ask-frank") {
      var mode = h === "#finder" ? "finder" : "ask";
      if (!wiz.keep) { wiz.mat = wiz.saw = null; }
      wiz.keep = false; wiz.mode = mode; wiz.want = null; wiz.all = false; wizard(); setNav(h);
    } else if (h === "#reorder") { reorder(); setNav(h); }
    else if (h === "#shop") { app.innerHTML = ""; shopScreen(); }
    else if (h.indexOf("#line-") === 0) { lineScreen(h.slice(6)); setNav(""); }
    else home();
  }

  /* ---------- cart ---------- */
  function cartLines() { return cart.map(function (c) { var f = FAM[c.f], v = f && findVar(f, c.v); return f && v ? { c: c, f: f, v: v } : null; }).filter(Boolean); }
  function totals() { var L = cartLines(), t = 0, n = 0; L.forEach(function (l) { n += l.c.q; t += l.v[3] * l.c.q; }); return { lines: L, total: t, units: n }; }
  function addToCart(fid, key, q) {
    q = Math.max(1, Math.min(9999, parseInt(q, 10) || 1));
    var hit = cart.filter(function (c) { return c.f === fid && c.v === key; })[0];
    if (hit) hit.q += q; else cart.push({ f: fid, v: key, q: q });
    saveCart();
  }
  function saveCart() { store.set("cart", cart); badge(); }
  function badge() {
    var t = totals(); $("#cartn").textContent = t.units; $("#dock").hidden = !t.units;
    if (t.units) $("#dockinfo").innerHTML = "<b>" + t.units + (t.units === 1 ? " item" : " items") + " · " + money(t.total) + "</b><span>List price, before your discounts</span>";
  }
  function renderCart() {
    var t = totals(), b = $("#cartbody");
    if (!t.lines.length) { b.innerHTML = '<div class="empty d">Your cart’s empty. Hit Blade Finder or Fast Reorder and load it up.</div>'; $("#cartfoot").hidden = true; return; }
    $("#cartfoot").hidden = false;
    b.innerHTML = t.lines.map(function (l, i) {
      return '<div class="line" data-i="' + i + '"><div><h4>' + esc(l.f.n) + '</h4><div class="meta">' + esc(vlabel(l.v)) + "<br>" + esc(l.v[0]) + " · " + money(l.v[3]) + ' each</div></div><div class="lp">' + money(l.v[3] * l.c.q) + "</div><div>" + qtyHTML(l.c.q) + '</div><button class="rm" data-rm>Remove</button></div>';
    }).join("") + '<div class="callout"><b>That’s list. Yours is probably lower.</b><span>Account, quantity and Platinum pricing get applied by your rep before anything is billed.</span><button class="btn blue sm" data-pricing>Get my account &amp; quantity pricing</button></div>';
    $("#carttot").innerHTML = "<span>List total</span><span>" + money(t.total) + "</span>";
    $("#cartnote").textContent = "Freight and tax are confirmed by your rep. Nothing is charged on this site.";
  }

  /* ---------- send ---------- */
  var mode = "order";
  function me() { return store.get("me", {}); }
  function repBySlug(s) { return (W.reps || []).filter(function (r) { return slug(r.name) === s; })[0]; }
  function openSend(m) {
    mode = m; var info = me(), f = $("#sendform");
    $("#sendtitle").textContent = m === "order" ? "Send order to my rep" : "Get my pricing";
    $("#discwrap").hidden = m === "order";
    $("#sendintro").textContent = m === "order" ? "Fill this in once. This phone remembers it, so next time it’s two taps." : "Tell us which pricing to check. Your rep comes back with your real numbers.";
    ["name", "company", "phone", "email", "po", "notes"].forEach(function (k) { f.elements[k].value = k === "po" || k === "notes" ? "" : (info[k] || ""); });
    f.elements.rep.innerHTML = '<option value="">Not sure · send to ' + esc(FRANK) + "</option>" + (W.reps || []).map(function (r) { return '<option value="' + slug(r.name) + '">' + esc(r.name) + "</option>"; }).join("");
    f.elements.rep.value = info.rep || "";
    $("#discs").innerHTML = (W.discounts || []).map(function (d, i) { return '<label><input type="checkbox" name="disc" value="' + esc(d) + '"' + (i < 2 ? " checked" : "") + "> " + esc(d) + "</label>"; }).join("");
    $("#textbtn").hidden = !W.textNumber; $("#textbtn").textContent = "Text it to " + FRANK; $("#sentmsg").hidden = true;
    preview(); if ($("#cart").open) $("#cart").close(); if ($("#detail").open) $("#detail").close(); $("#send").showModal();
  }
  function formData() { var f = $("#sendform"), o = {}; ["name", "company", "phone", "email", "po", "notes", "rep"].forEach(function (k) { o[k] = f.elements[k].value.trim(); }); o.disc = $$('input[name="disc"]:checked', f).map(function (x) { return x.value; }); return o; }
  function buildText(o) {
    var t = totals(), rep = repBySlug(o.rep), L = [];
    L.push(mode === "order" ? "DBW WISCO ORDER" : "DBW WISCO PRICING REQUEST");
    L.push("From: " + (o.name || "(name)") + (o.company ? ", " + o.company : ""));
    if (o.phone) L.push("Phone: " + o.phone);
    if (o.email) L.push("Email: " + o.email);
    L.push("Rep: " + (rep ? rep.name : (W.managerName || "Office")));
    if (o.po) L.push("PO #: " + o.po);
    if (mode !== "order" && o.disc.length) { L.push(""); L.push("Please check: " + o.disc.join("; ")); }
    L.push(""); L.push(t.lines.length ? "ITEMS" : "(no items in cart yet)");
    t.lines.forEach(function (l) { L.push(l.c.q + " x " + l.v[0] + "  " + l.f.n + " " + vlabel(l.v) + "  @ " + money(l.v[3]) + " = " + money(l.v[3] * l.c.q)); });
    if (t.lines.length) { L.push(""); L.push("List total: " + money(t.total) + "  (before account discounts)"); }
    if (o.notes) { L.push(""); L.push("Notes: " + o.notes); }
    L.push(""); L.push("Sent from the DBW Wisco site" + (C.priceList ? " · " + C.priceList + " price list" : ""));
    return L.join("\n");
  }
  function preview() { $("#preview").textContent = buildText(formData()); }
  function afterSend(how) {
    var o = formData(), t = totals();
    store.set("me", { name: o.name, company: o.company, phone: o.phone, email: o.email, rep: o.rep });
    if (mode === "order" && t.lines.length) store.set("last", { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), items: cart.slice() });
    var m = $("#sentmsg"); m.hidden = false;
    m.innerHTML = how === "posted" ? "<b>Sent.</b><span>Your rep has it. Expect a call or text back with your price and ship date.</span>"
      : how === "copied" ? "<b>Copied.</b><span>Paste it into a text or email to your rep.</span>"
        : "<b>Last step: hit send in your " + (how === "sms" ? "messages" : "email") + " app.</b><span>It’s already written for you. If nothing opened, tap Copy and paste it to " + esc(how === "sms" ? (W.textDisplay || "") : (W.orderEmail || "")) + ".</span>";
    m.scrollIntoView({ block: "nearest" });
  }
  function needName() { var f = $("#sendform"); if (!f.elements.name.value.trim()) { f.elements.name.focus(); toast("Add your name so we know who it’s from"); return true; } return false; }
  function mailto(to, cc, subj, body) { location.href = "mailto:" + encodeURIComponent(to || "") + "?subject=" + encodeURIComponent(subj) + (cc ? "&cc=" + encodeURIComponent(cc) : "") + "&body=" + encodeURIComponent(body); }
  function sms(body) { location.href = "sms:" + W.textNumber + "?&body=" + encodeURIComponent(body); }
  function sendEmail() {
    if (needName()) return;
    var o = formData(), rep = repBySlug(o.rep), body = buildText(o);
    var subj = (mode === "order" ? "Order" : "Pricing request") + " from " + (o.company || o.name) + (rep ? " (rep: " + rep.name + ")" : "") + (o.po ? " PO " + o.po : "");
    var viaMail = function () { var to = rep && rep.email ? rep.email : W.orderEmail; mailto(to, rep && rep.email && rep.email !== W.orderEmail ? W.orderEmail : "", subj, body); afterSend("email"); };
    if (W.formEndpoint && !isPreview) {
      fetch(W.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: subj, name: o.name, company: o.company, phone: o.phone, email: o.email, rep: rep ? rep.name : "", message: body }) })
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
      (f.ben.length ? '<ul class="ben">' + f.ben.map(function (b) { return "<li>" + (b[0] ? "<b>" + esc(b[0]) + "</b>" : "") + esc(b[1]) + "</li>"; }).join("") + "</ul>" : "") + "</div></div>";
    h += '<div class="blk"><h4>Pick your size</h4><div class="sizes">' + f.vars.map(function (v) {
      return '<div class="sz' + (inSaw(v, wiz.saw) ? "" : " dim") + '" data-v="' + esc(vkey(v)) + '"><div><b>' + esc(vlabel(v)) + "</b><small>" + esc(v[0]) + '</small></div><div class="r"><span class="p">' + money(v[3]) + "</span>" + qtyHTML(1) + '<button class="add" data-add>Add</button></div></div>';
    }).join("") + "</div></div>";
    h += '<div class="callout"><b>Buying in quantity? Got an account?</b><span>List is the ceiling. Your rep sends back your account, quantity or Platinum price.</span><button class="btn blue sm" data-pricing>Get my pricing</button></div>';
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
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-mat]"))) { wiz.mat = byK(MATS, el.dataset.mat); wizard(); window.scrollTo(0, 0); return; }
    if ((el = t.closest("[data-saw]"))) { wiz.saw = byK(SAWS, el.dataset.saw); wizard(); window.scrollTo(0, 0); return; }
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
    if ((el = t.closest("[data-add]"))) {
      var card = el.closest(".card"), sz = el.closest(".sz"), hit = el.closest(".hit"), fid, key, qty;
      if (sz) { fid = $("#detailbody").dataset.f; key = sz.dataset.v; qty = $("input", sz).value; }
      else if (hit) { fid = hit.dataset.f; key = hit.dataset.v; qty = $("input", hit).value; }
      else if (card) { fid = card.dataset.f; var sel = $("[data-size]", card); key = sel ? sel.value : vkey(defVar(FAM[fid], varsFor(FAM[fid], wiz.saw))); if (!findVar(FAM[fid], key)) key = vkey(FAM[fid].vars[0]); qty = $(".qty input", card).value; }
      if (fid) { addToCart(fid, key, qty); el.classList.add("ok"); var old = el.textContent; el.textContent = "Added ✓"; setTimeout(function () { el.classList.remove("ok"); el.textContent = old; }, 1100); }
      return;
    }
    if ((el = t.closest("[data-open]"))) { openDetail(FAM[el.closest(".card").dataset.f]); return; }
    if (t.closest("[data-pricing]")) { e.preventDefault(); openSend("pricing"); return; }
    if (t.closest("[data-cart]")) { if ($("#detail").open) $("#detail").close(); renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-checkout]")) { openSend("order"); return; }
    if ((el = t.closest("[data-close]"))) { el.closest("dialog").close(); return; }
    if ((el = t.closest("[data-rm]"))) { cart.splice(parseInt(el.closest(".line").dataset.i, 10), 1); saveCart(); renderCart(); return; }
    if (t.closest("[data-reorder]")) { var last = store.get("last", null); if (last) { last.items.forEach(function (c) { if (FAM[c.f] && findVar(FAM[c.f], c.v)) addToCart(c.f, c.v, c.q); }); renderCart(); $("#cart").showModal(); } return; }
    if (t.closest("[data-email]")) { sendEmail(); return; }
    if (t.closest("[data-sms]")) { if (needName()) return; sms(buildText(formData())); afterSend("sms"); return; }
    if (t.closest("[data-copy]")) { copyText(buildText(formData()), function () { afterSend("copied"); }); return; }
    if (t.closest("[data-share]")) { copyText(shareLink(), function () { toast("Reorder link copied. Text it to anyone."); }); return; }
    if ((el = t.closest("[data-fsms]"))) { sms(frankMsg(el.closest("[data-frank]").dataset.frank)); return; }
    if ((el = t.closest("[data-femail]"))) { mailto(W.orderEmail, "", "Blade question from the Wisco site", frankMsg(el.closest("[data-frank]").dataset.frank)); return; }
    if ((el = t.closest("[data-fcopy]"))) { copyText(frankMsg(el.closest("[data-frank]").dataset.frank), function () { toast("Copied. Paste it in a text to " + FRANK + "."); }); return; }
    if (t.closest("[data-emptycart]")) { cart = []; saveCart(); renderCart(); return; }
    if (t.tagName === "DIALOG") t.close();
  });
  document.addEventListener("change", function (e) {
    var t = e.target, card = t.closest(".card"), line = t.closest(".line");
    if (t.matches("[data-size]") && card) { var f = FAM[card.dataset.f], keep = $(".qty input", card).value; $("[data-row]", card).outerHTML = buyRow(findVar(f, t.value)); $(".qty input", card).value = keep; }
    if (line && t.matches(".qty input")) { cart[parseInt(line.dataset.i, 10)].q = Math.max(1, parseInt(t.value, 10) || 1); saveCart(); renderCart(); }
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
  if (P.get("rep")) { var info = me(); info.rep = P.get("rep"); store.set("me", info); }
  if (P.get("cart")) {
    cart = [];
    P.get("cart").split(",").forEach(function (x) { var a = x.split("*"), hit = SKU[(a[0] || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")]; if (hit) cart.push({ f: hit[0].id, v: vkey(hit[0].vars[hit[1]]), q: Math.max(1, parseInt(a[1], 10) || 1) }); });
    store.set("cart", cart);
  }
  route(); badge();
  if (P.get("cart") && cart.length) { renderCart(); $("#cart").showModal(); }
})();
