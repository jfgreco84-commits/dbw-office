/* DBW Wisco store. Vanilla JS, no build step. Data comes from catalog.js, settings from config.js. */
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
  var TIER = { supreme: ["Best", "Supreme grade"], premium: ["Better", "Premium grade"], standard: ["Good", "Standard grade"], economy: ["Value", "Economy grade"], pro: ["Pro Series", "Bonded to your aggregate"] };
  var TIERRANK = { supreme: 4, pro: 4, premium: 3, standard: 2, economy: 1, "": 0 };
  var SAWDIA = { grinder: [3, 9], circ: [7, 7.25], cutoff: [12, 16], walk: [14, 99] };
  var DIAS = [4, 4.5, 5, 6, 7, 9, 10, 12, 14, 16, 18, 20];
  var MAT = {}, SAW = {}, FAM = {}, SKU = {};
  C.materials.forEach(function (m) { MAT[m.k] = m.n; });
  C.saws.forEach(function (s) { SAW[s.k] = s; });
  C.families.forEach(function (f, i) {
    f.i = i; FAM[f.id] = f;
    f.hay = (f.n + " " + f.hook + " " + f.apps.join(" ") + " " + f.vars.map(function (v) { return v[0] + " " + v[1] + " " + v[4]; }).join(" ")).toLowerCase();
    f.vars.forEach(function (v, vi) { var k = v[0].toUpperCase().replace(/[^A-Z0-9.]/g, ""); if (!SKU[k]) SKU[k] = [f, vi]; });
  });

  var S = { mat: null, saw: null, dia: null, cat: "all", q: "", sort: "best", limit: 24 };
  var cart = store.get("cart", []);          // [{f, v, q}]  f = family id, v = sku|size key
  var isArtifact = !/^https?:$/.test(location.protocol) || /claude|anthropic/.test(location.hostname);

  /* ---------- helpers ---------- */
  function vkey(v) { return v[0] + "|" + v[1]; }
  function findVar(f, key) { for (var i = 0; i < f.vars.length; i++) if (vkey(f.vars[i]) === key) return f.vars[i]; return null; }
  function vlabel(v) { return [v[1], v[4]].filter(Boolean).join(" · ") || v[0]; }
  function inRange(v) {
    if (S.dia != null) { if (v[2] == null) return false; return S.dia === 20 ? v[2] >= 20 : v[2] === S.dia; }
    if (S.saw && SAWDIA[S.saw]) { if (v[2] == null) return false; return v[2] >= SAWDIA[S.saw][0] && v[2] <= SAWDIA[S.saw][1]; }
    return true;
  }
  function visibleVars(f) { var a = f.vars.filter(inRange); return a.length ? a : f.vars; }
  function matches(f, skipCat) {
    if (!skipCat && S.cat !== "all" && f.cats.indexOf(S.cat) < 0) return false;
    if (S.mat && !(f.m[S.mat] >= 3)) return false;
    if (S.saw && f.saws.indexOf(S.saw) < 0) return false;
    if ((S.dia != null || (S.saw && SAWDIA[S.saw])) && !f.vars.some(inRange)) return false;
    if (S.q) { var t = S.q.toLowerCase().split(/\s+/); for (var i = 0; i < t.length; i++) if (t[i] && f.hay.indexOf(t[i]) < 0) return false; }
    return true;
  }
  function stars(r) { return '<span class="stars" style="--p:' + (r / 5 * 100) + '%" role="img" aria-label="' + r + ' out of 5"></span>'; }
  function tierHTML(f) { return f.tier && TIER[f.tier] ? '<span class="tier ' + f.tier + '">' + TIER[f.tier][0] + " · " + TIER[f.tier][1] + "</span>" : ""; }
  function pic(f, cls) { return '<span class="pic ' + (f.img ? "" : "none ") + (cls || "") + '">' + (f.img ? '<img loading="lazy" alt="" src="img/' + esc(f.img) + '">' : "") + "</span>"; }
  function topMats(f, n) { return Object.keys(f.m).sort(function (a, b) { return f.m[b] - f.m[a]; }).slice(0, n); }
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }

  /* ---------- finder chips ---------- */
  function renderFinder() {
    $("#mats").innerHTML = C.materials.map(function (m) { return '<button class="chip" data-mat="' + m.k + '" aria-pressed="' + (S.mat === m.k) + '">' + esc(m.n) + "</button>"; }).join("");
    $("#saws").innerHTML = C.saws.map(function (s) { return '<button class="chip" data-saw="' + s.k + '" aria-pressed="' + (S.saw === s.k) + '">' + esc(s.n) + (s.s ? "<small>" + esc(s.s) + "</small>" : "") + "</button>"; }).join("");
    $("#dias").innerHTML = DIAS.map(function (d) { return '<button class="chip dia" data-dia="' + d + '" aria-pressed="' + (S.dia === d) + '">' + d + (d === 20 ? '"+' : '"') + "</button>"; }).join("");
  }

  /* ---------- grid ---------- */
  function sorted(list) {
    var a = list.slice();
    if (S.sort === "price") a.sort(function (x, y) { return (x.min == null) - (y.min == null) || (x.min || 0) - (y.min || 0); });
    else if (S.sort === "grade") a.sort(function (x, y) { return TIERRANK[y.tier] - TIERRANK[x.tier] || x.i - y.i; });
    else if (S.sort === "az") a.sort(function (x, y) { return x.n.localeCompare(y.n); });
    else if (S.mat) a.sort(function (x, y) { return (y.m[S.mat] || 0) - (x.m[S.mat] || 0) || (x.min == null) - (y.min == null) || x.i - y.i; });
    else a.sort(function (x, y) { return (x.rank - y.rank) || (x.min == null) - (y.min == null) || x.i - y.i; });
    return a;
  }
  function cardHTML(f) {
    var vs = visibleVars(f), opts = "", first = pickDefault(f, vs);
    if (vs.length > 1) {
      opts = '<select aria-label="Size for ' + esc(f.n) + '" data-size>' + vs.map(function (v) {
        return '<option value="' + esc(vkey(v)) + '"' + (v === first ? " selected" : "") + ">" + esc(vlabel(v)) + (v[3] ? "  —  " + money(v[3]) : "") + "</option>";
      }).join("") + "</select>";
    } else opts = '<div class="one">' + esc(vlabel(first)) + "</div>";
    var rate = "";
    if (S.mat && f.m[S.mat]) rate = '<div class="rate">' + stars(f.m[S.mat]) + "<span><b>" + f.m[S.mat].toFixed(1) + "</b> on " + esc(MAT[S.mat]) + "</span></div>";
    var best = topMats(f, 3).map(function (k) { return esc(MAT[k]); });
    return '<article class="card" data-f="' + f.id + '">' +
      '<button class="card-top" data-open aria-label="Details for ' + esc(f.n) + '">' + pic(f) + "<span>" + tierHTML(f) + "<h3>" + esc(f.n) + "</h3>" + rate + "</span></button>" +
      (f.hook ? '<p class="hook">' + esc(f.hook) + "</p>" : "") +
      (best.length && !S.mat ? '<div class="best">Best on: <b>' + best.join(", ") + "</b></div>" : "") +
      '<div class="buy">' + opts + buyRow(f, first) + '<button class="more" data-open>Details, ratings and all ' + f.vars.length + (f.vars.length === 1 ? " size" : " sizes") + "</button></div></article>";
  }
  function pickDefault(f, vs) {
    var pref = f.cats.indexOf("highspeed") >= 0 ? 14 : null, best = null;
    for (var i = 0; i < vs.length; i++) { if (vs[i][3] && pref && vs[i][2] === pref) return vs[i]; if (vs[i][3] && !best) best = vs[i]; }
    return best || vs[0];
  }
  function buyRow(f, v) {
    var p = v[3] ? '<div class="price">' + money(v[3]) + "<small>each · " + esc(v[0]) + "</small></div>" : '<div class="price ask">Price from your rep<small>' + esc(v[0]) + "</small></div>";
    return '<div class="buy-row" data-row>' + p + '<div style="display:flex;gap:8px;justify-content:flex-end">' + qtyHTML(1) + '<button class="add" data-add>' + (v[3] ? "Add" : "Add to quote") + "</button></div></div>";
  }
  function qtyHTML(n) { return '<span class="qty"><button type="button" data-q="-1" aria-label="Fewer">−</button><input type="number" inputmode="numeric" min="1" max="9999" value="' + n + '" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></span>'; }

  function renderTabs() {
    var counts = { all: 0 };
    C.families.forEach(function (f) { if (matches(f, true)) { counts.all++; f.cats.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; }); } });
    var tabs = [{ k: "all", n: "Everything" }].concat(C.cats);
    $("#tabs").innerHTML = tabs.map(function (t) {
      return '<button class="tab" role="tab" data-cat="' + t.k + '" aria-selected="' + (S.cat === t.k) + '">' + esc(t.n) + '<span class="c">' + (counts[t.k] || 0) + "</span></button>";
    }).join("");
  }
  function renderGrid() {
    var list = sorted(C.families.filter(function (f) { return matches(f); }));
    var bits = [];
    if (S.mat) bits.push(MAT[S.mat]); if (S.saw) bits.push(SAW[S.saw].n); if (S.dia != null) bits.push(S.dia + '"' + (S.dia === 20 ? "+" : ""));
    if (S.q) bits.push("“" + S.q + "”");
    $("#count").innerHTML = list.length + (list.length === 1 ? " product" : " products") + (bits.length ? "<small>for " + esc(bits.join(" · ")) + "</small>" : "<small>top sellers first</small>");
    $("#clear").hidden = !(S.mat || S.saw || S.dia != null || S.q || S.cat !== "all");
    if (!list.length) {
      $("#grid").innerHTML = '<div class="empty"><h3>Nothing matches that combo</h3><p>Loosen a filter, or just tell your rep what you are cutting and we will spec the blade.</p><p><button class="btn brand" data-pricing>Ask my rep</button></p></div>';
      $("#more").hidden = true; return;
    }
    $("#grid").innerHTML = list.slice(0, S.limit).map(cardHTML).join("");
    $("#more").hidden = list.length <= S.limit;
    $("#more button").textContent = "Show " + Math.min(24, list.length - S.limit) + " more of " + (list.length - S.limit);
  }
  function refresh(keepLimit) { if (!keepLimit) S.limit = 24; renderFinder(); renderTabs(); renderGrid(); }

  /* ---------- cart ---------- */
  function cartLines() {
    return cart.map(function (c) { var f = FAM[c.f], v = f && findVar(f, c.v); return f && v ? { c: c, f: f, v: v } : null; }).filter(Boolean);
  }
  function cartTotals() {
    var L = cartLines(), t = 0, n = 0, ask = 0;
    L.forEach(function (l) { n += l.c.q; if (l.v[3]) t += l.v[3] * l.c.q; else ask++; });
    return { lines: L, total: t, units: n, ask: ask };
  }
  function addToCart(fid, key, q) {
    q = Math.max(1, Math.min(9999, parseInt(q, 10) || 1));
    var hit = cart.filter(function (c) { return c.f === fid && c.v === key; })[0];
    if (hit) hit.q += q; else cart.push({ f: fid, v: key, q: q });
    saveCart();
  }
  function saveCart() { store.set("cart", cart); renderCartBadge(); }
  function renderCartBadge() {
    var t = cartTotals();
    $("#cartn").textContent = t.units;
    var dock = $("#dock");
    dock.hidden = !t.units;
    if (t.units) $("#dockinfo").innerHTML = "<b>" + t.units + (t.units === 1 ? " item" : " items") + " · " + money(t.total) + "</b><span>" + (t.ask ? t.ask + " quote line" + (t.ask > 1 ? "s" : "") + " · " : "") + "list price, before your discounts</span>";
    var last = store.get("last", null), box = $("#reorder");
    box.hidden = !(last && last.items && last.items.length);
    if (!box.hidden) $("#reorderinfo").textContent = last.items.length + (last.items.length === 1 ? " line" : " lines") + " from " + last.date + ". One tap puts it all back in your cart.";
  }
  function renderCart() {
    var t = cartTotals(), b = $("#cartbody");
    if (!t.lines.length) {
      b.innerHTML = '<div class="empty"><h3>Your cart is empty</h3><p>Pick a material and a saw up top and the right blades line up for you.</p></div>';
      $("#cartfoot").hidden = true; return;
    }
    $("#cartfoot").hidden = false;
    b.innerHTML = t.lines.map(function (l, i) {
      return '<div class="line" data-i="' + i + '"><div><h4>' + esc(l.f.n) + '</h4><div class="meta">' + esc(vlabel(l.v)) + "<br>" + esc(l.v[0]) + (l.v[3] ? " · " + money(l.v[3]) + " each" : "") + '</div></div><div class="lp">' + (l.v[3] ? money(l.v[3] * l.c.q) : "Quote<small>rep prices it</small>") + "</div><div>" + qtyHTML(l.c.q) + '</div><button class="rm" data-rm>Remove</button></div>';
    }).join("") +
      '<div class="callout"><b>These are list prices. Yours are probably lower.</b><span>Account-level, quantity and Platinum pricing get applied by your rep before anything is billed.</span><button class="btn brand sm" data-pricing>Get my account &amp; quantity pricing</button></div>';
    $("#carttot").innerHTML = "<span>List total</span><span>" + money(t.total) + "</span>";
    $("#cartnote").textContent = (t.ask ? t.ask + " line" + (t.ask > 1 ? "s" : "") + " will be priced by your rep. " : "") + "Freight and tax are confirmed by your rep. Nothing is charged on this site.";
  }

  /* ---------- order / pricing request ---------- */
  var mode = "order";
  function me() { return store.get("me", {}); }
  function repBySlug(s) { return (W.reps || []).filter(function (r) { return slug(r.name) === s; })[0]; }
  function openSend(m) {
    mode = m;
    var info = me(), f = $("#sendform");
    $("#sendtitle").textContent = m === "order" ? "Send order to my rep" : "Get my pricing";
    $("#discwrap").hidden = m === "order";
    $("#sendintro").textContent = m === "order"
      ? "Fill this in once. We remember it on this phone so the next reorder takes seconds."
      : "Tell us which pricing you want checked. Your rep answers with your real numbers.";
    ["name", "company", "phone", "email", "po", "notes"].forEach(function (k) { f.elements[k].value = k === "po" || k === "notes" ? "" : (info[k] || ""); });
    var sel = f.elements.rep;
    sel.innerHTML = '<option value="">Not sure / send to ' + esc(W.managerName || "the office") + "</option>" + (W.reps || []).map(function (r) { return '<option value="' + slug(r.name) + '">' + esc(r.name) + "</option>"; }).join("");
    sel.value = info.rep || "";
    $("#discs").innerHTML = (W.discounts || []).map(function (d, i) { return '<label><input type="checkbox" name="disc" value="' + esc(d) + '"' + (i < 2 ? " checked" : "") + "> " + esc(d) + "</label>"; }).join("");
    $("#textbtn").hidden = !W.textNumber;
    $("#sentmsg").hidden = true;
    updatePreview();
    $("#cart").close(); $("#send").showModal();
  }
  function formData() {
    var f = $("#sendform"), o = {};
    ["name", "company", "phone", "email", "po", "notes", "rep"].forEach(function (k) { o[k] = f.elements[k].value.trim(); });
    o.disc = $$('input[name="disc"]:checked', f).map(function (x) { return x.value; });
    return o;
  }
  function buildText(o) {
    var t = cartTotals(), rep = repBySlug(o.rep), L = [];
    L.push(mode === "order" ? "DBW WISCO ORDER" : "DBW WISCO PRICING REQUEST");
    L.push("From: " + (o.name || "(name)") + (o.company ? ", " + o.company : ""));
    if (o.phone) L.push("Phone: " + o.phone);
    if (o.email) L.push("Email: " + o.email);
    L.push("Rep: " + (rep ? rep.name : (W.managerName || "Office")));
    if (o.po) L.push("PO #: " + o.po);
    if (mode !== "order" && o.disc.length) { L.push(""); L.push("Please check: " + o.disc.join("; ")); }
    L.push(""); L.push(t.lines.length ? "ITEMS" : "(no items in cart yet)");
    t.lines.forEach(function (l) {
      L.push(l.c.q + " x " + l.v[0] + "  " + l.f.n + (vlabel(l.v) ? " " + vlabel(l.v) : "") + (l.v[3] ? "  @ " + money(l.v[3]) + " = " + money(l.v[3] * l.c.q) : "  (quote)"));
    });
    if (t.lines.length) { L.push(""); L.push("List total: " + money(t.total) + (t.ask ? " + " + t.ask + " quote line(s)" : "") + "  (before account discounts)"); }
    if (o.notes) { L.push(""); L.push("Notes: " + o.notes); }
    L.push(""); L.push("Sent from the DBW Wisco reorder site" + (C.priceList ? " · " + C.priceList + " price list" : ""));
    return L.join("\n");
  }
  function updatePreview() { $("#preview").textContent = buildText(formData()); }
  function afterSend(how) {
    var o = formData(), t = cartTotals();
    store.set("me", { name: o.name, company: o.company, phone: o.phone, email: o.email, rep: o.rep });
    if (mode === "order" && t.lines.length) store.set("last", { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), items: cart.slice() });
    var m = $("#sentmsg"); m.hidden = false;
    m.innerHTML = how === "posted"
      ? "<b>Sent.</b><span>Your rep has it. Expect a call or email back with your pricing and ship date.</span>"
      : how === "copied"
        ? "<b>Copied.</b><span>Paste it into a text or email to your rep" + (W.orderEmail ? " at <span style=\"user-select:all\">" + esc(W.orderEmail) + "</span>" : "") + ".</span>"
        : "<b>Almost done: hit send in your " + (how === "sms" ? "messages" : "email") + " app.</b><span>The order is written for you. If nothing opened, use Copy and paste it to " + esc(W.orderEmail || "your rep") + ".</span>";
    renderCartBadge();
  }
  function needName() { var f = $("#sendform"); if (!f.elements.name.value.trim()) { f.elements.name.focus(); toast("Add your name so your rep knows who it's from"); return true; } return false; }
  function sendEmail() {
    if (needName()) return;
    var o = formData(), rep = repBySlug(o.rep), body = buildText(o);
    var subj = (mode === "order" ? "Order" : "Pricing request") + " from " + (o.company || o.name) + (rep ? " (rep: " + rep.name + ")" : "") + (o.po ? " PO " + o.po : "");
    if (W.formEndpoint && !isArtifact) {
      fetch(W.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: subj, name: o.name, company: o.company, phone: o.phone, email: o.email, rep: rep ? rep.name : "", message: body }) })
        .then(function (r) { if (!r.ok) throw 0; afterSend("posted"); })
        .catch(function () { mailto(); });
      return;
    }
    mailto();
    function mailto() {
      var to = rep && rep.email ? rep.email : W.orderEmail, cc = rep && rep.email && W.orderEmail && rep.email !== W.orderEmail ? "&cc=" + encodeURIComponent(W.orderEmail) : "";
      location.href = "mailto:" + encodeURIComponent(to || "") + "?subject=" + encodeURIComponent(subj) + cc + "&body=" + encodeURIComponent(body);
      afterSend("email");
    }
  }
  function sendText() { if (needName()) return; location.href = "sms:" + W.textNumber + "?&body=" + encodeURIComponent(buildText(formData())); afterSend("sms"); }
  function copyText(txt, done) {
    var ok = function () { done && done(); };
    try { navigator.clipboard.writeText(txt).then(ok, fallback); } catch (e) { fallback(); }
    function fallback() { var r = document.createRange(); r.selectNodeContents($("#preview")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selected. Press copy."); }
  }
  function shareLink() {
    var q = cartLines().map(function (l) { return encodeURIComponent(l.v[0]) + "*" + l.c.q; }).join(",");
    var o = formData();
    return location.origin + location.pathname + "?cart=" + q + (o.rep ? "&rep=" + o.rep : "");
  }

  /* ---------- product detail ---------- */
  function openDetail(f) {
    var vurl = (W.videos || {})[f.id];
    var mats = Object.keys(f.m).sort(function (a, b) { return f.m[b] - f.m[a]; });
    var h = '<div class="pd"><div>' + pic(f) + "</div><div>" + tierHTML(f) + '<h3 class="big">' + esc(f.n) + "</h3>" +
      (f.hook ? '<p class="lede">' + esc(f.hook) + "</p>" : "") +
      (f.ben.length ? '<ul class="ben">' + f.ben.map(function (b) { return "<li>" + (b[0] ? "<b>" + esc(b[0]) + "</b>" : "") + esc(b[1]) + "</li>"; }).join("") + "</ul>" : "") + "</div></div>";
    if (mats.length) h += '<div class="sec"><h4>How it rates by material</h4><div class="rates">' + mats.map(function (k) { return '<div class="' + (k === S.mat ? "on" : "") + '"><span>' + esc(MAT[k]) + "</span><span>" + stars(f.m[k]) + " " + f.m[k].toFixed(1) + "</span></div>"; }).join("") + "</div></div>";
    if (f.saws.length) h += '<div class="sec"><h4>Runs on</h4><div class="tags">' + f.saws.map(function (k) { return "<span>" + esc(SAW[k].n) + "</span>"; }).join("") + "</div></div>";
    h += '<div class="sec"><h4>Watch it cut</h4>' + (vurl
      ? '<a class="video" href="' + esc(vurl) + '" target="_blank" rel="noopener"><span class="play"></span><span><b>See the ' + esc(f.n) + ' in action</b><span>Opens the video in a new tab</span></span></a>'
      : '<div class="video soon"><span class="play"></span><span><b>Video coming soon</b><span>Want to see the ' + esc(f.n) + " cut before you buy? Ask your rep for a demo.</span></span></div>") + "</div>";
    h += '<div class="sec"><h4>Every size (' + f.vars.length + ')</h4><div class="sizes"><table><thead><tr><th>Size</th><th>Part #</th><th>List price</th><th></th></tr></thead><tbody>' +
      f.vars.map(function (v) {
        return '<tr class="' + (inRange(v) ? "" : "dim") + '" data-v="' + esc(vkey(v)) + '"><td>' + esc(vlabel(v)) + '</td><td class="sku">' + esc(v[0]) + '</td><td class="p">' + (v[3] ? money(v[3]) : '<span style="font:600 14px var(--body);color:var(--brand)">Ask rep</span>') + '</td><td class="act">' + qtyHTML(1) + '<button class="add" data-add>' + (v[3] ? "Add" : "Quote") + "</button></td></tr>";
      }).join("") + "</tbody></table></div></div>";
    h += '<div class="callout"><b>Buying in quantity or have an account?</b><span>List price is the ceiling. Press the button and your rep sends back your account-level, quantity or Platinum pricing.</span><button class="btn brand sm" data-pricing>Email my rep for my pricing</button></div>';
    if (f.desc || f.apps.length) h += '<div class="sec"><h4>From the DBW catalog</h4>' + (f.desc ? '<p class="note" style="font-size:15px;color:var(--ink)">' + esc(f.desc) + "</p>" : "") + (f.apps.length ? '<div class="tags" style="margin-top:8px">' + f.apps.map(function (a) { return "<span>" + esc(a) + "</span>"; }).join("") + "</div>" : "") + "</div>";
    $("#detailtitle").textContent = f.n;
    var b = $("#detailbody"); b.innerHTML = h; b.dataset.f = f.id; b.scrollTop = 0;
    $("#detail").showModal();
    try { history.replaceState(null, "", "#blade-" + f.id); } catch (e) { }
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-mat]"))) { S.mat = S.mat === el.dataset.mat ? null : el.dataset.mat; refresh(); return; }
    if ((el = t.closest("[data-saw]"))) { S.saw = S.saw === el.dataset.saw ? null : el.dataset.saw; refresh(); return; }
    if ((el = t.closest("[data-dia]"))) { var d = parseFloat(el.dataset.dia); S.dia = S.dia === d ? null : d; refresh(); return; }
    if ((el = t.closest("[data-cat]"))) { S.cat = el.dataset.cat; refresh(); return; }
    if ((el = t.closest("[data-q]"))) { var inp = $("input", el.parentNode); inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) + parseInt(el.dataset.q, 10)); inp.dispatchEvent(new Event("change", { bubbles: true })); return; }
    if ((el = t.closest("[data-add]"))) {
      var card = el.closest(".card"), row = el.closest("tr[data-v]"), fid, key, qty;
      if (row) { fid = $("#detailbody").dataset.f; key = row.dataset.v; qty = $("input", row).value; }
      else if (card) { fid = card.dataset.f; var sel = $("[data-size]", card); key = sel ? sel.value : vkey(visibleVars(FAM[fid])[0]); qty = $(".qty input", card).value; }
      if (fid) { addToCart(fid, key, qty); el.classList.add("ok"); var old = el.textContent; el.textContent = "Added ✓"; setTimeout(function () { el.classList.remove("ok"); el.textContent = old; }, 1100); }
      return;
    }
    if ((el = t.closest("[data-open]"))) { openDetail(FAM[el.closest(".card").dataset.f]); return; }
    if (t.closest("[data-pricing]")) { $("#detail").open && $("#detail").close(); openSend("pricing"); return; }
    if (t.closest("[data-cart]")) { renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-checkout]")) { openSend("order"); return; }
    if ((el = t.closest("[data-close]"))) { el.closest("dialog").close(); return; }
    if ((el = t.closest("[data-rm]"))) { cart.splice(parseInt(el.closest(".line").dataset.i, 10), 1); saveCart(); renderCart(); return; }
    if (t.closest("#clear")) { S.mat = S.saw = S.dia = null; S.q = ""; S.cat = "all"; $("#q").value = ""; refresh(); return; }
    if (t.closest("#more")) { S.limit += 24; renderGrid(); return; }
    if (t.closest("[data-find]")) { $("#finder").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.closest("[data-reorder]")) { var last = store.get("last", null); if (last) { last.items.forEach(function (c) { if (FAM[c.f] && findVar(FAM[c.f], c.v)) addToCart(c.f, c.v, c.q); }); renderCart(); $("#cart").showModal(); } return; }
    if (t.closest("[data-email]")) { sendEmail(); return; }
    if (t.closest("[data-sms]")) { sendText(); return; }
    if (t.closest("[data-copy]")) { copyText(buildText(formData()), function () { afterSend("copied"); }); return; }
    if (t.closest("[data-share]")) { copyText(shareLink(), function () { toast("Reorder link copied. Text it to anyone."); }); return; }
    if (t.closest("[data-emptycart]")) { cart = []; saveCart(); renderCart(); return; }
    if (t.tagName === "DIALOG") t.close();
  });
  document.addEventListener("change", function (e) {
    var t = e.target, card = t.closest(".card"), line = t.closest(".line");
    if (t.matches("[data-size]") && card) { var f = FAM[card.dataset.f]; var keep = $(".qty input", card).value; $("[data-row]", card).outerHTML = buyRow(f, findVar(f, t.value)); $(".qty input", card).value = keep; }
    if (line && t.matches(".qty input")) { var i = parseInt(line.dataset.i, 10); cart[i].q = Math.max(1, parseInt(t.value, 10) || 1); saveCart(); renderCart(); }
    if (t.id === "sort") { S.sort = t.value; refresh(); }
  });
  $("#sendform").addEventListener("input", updatePreview);
  $("#sendform").addEventListener("submit", function (e) { e.preventDefault(); sendEmail(); });
  var qt; $("#q").addEventListener("input", function (e) { clearTimeout(qt); qt = setTimeout(function () { S.q = e.target.value.trim(); refresh(); }, 140); });
  $("#detail").addEventListener("close", function () { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { } });

  /* ---------- boot ---------- */
  function boot() {
    $$("[data-phone]").forEach(function (a) { a.textContent = W.phone || ""; if (a.tagName === "A") a.href = "tel:" + (W.phone || "").replace(/[^0-9+]/g, ""); a.hidden = !W.phone; });
    $$("[data-oemail]").forEach(function (a) { a.textContent = W.orderEmail || ""; });
    $$("[data-pl]").forEach(function (a) { a.textContent = C.priceList || "current"; });
    $$("[data-total]").forEach(function (a) { a.textContent = C.families.reduce(function (n, f) { return n + f.vars.length; }, 0).toLocaleString(); });
    var P = new URLSearchParams(location.search);
    if (P.get("rep")) { var info = me(); info.rep = P.get("rep"); store.set("me", info); }
    if (P.get("m") && MAT[P.get("m")]) S.mat = P.get("m");
    if (P.get("saw") && SAW[P.get("saw")]) S.saw = P.get("saw");
    if (P.get("cat")) S.cat = P.get("cat");
    if (P.get("cart")) {
      cart = [];
      P.get("cart").split(",").forEach(function (x) { var a = x.split("*"), hit = SKU[(a[0] || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")]; if (hit) cart.push({ f: hit[0].id, v: vkey(hit[0].vars[hit[1]]), q: Math.max(1, parseInt(a[1], 10) || 1) }); });
      store.set("cart", cart);
    }
    refresh(); renderCartBadge();
    if (P.get("cart") && cart.length) { renderCart(); $("#cart").showModal(); }
    var h = location.hash.replace(/^#blade-/, ""); if (location.hash.indexOf("#blade-") === 0 && FAM[h]) openDetail(FAM[h]);
  }
  boot();
})();
