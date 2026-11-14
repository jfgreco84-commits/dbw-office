/* DBW WISCO store. Vanilla JS, no build step. Data: catalog.js. Settings: config.js. */
(function () {
  "use strict";
  var C = window.CATALOG, W = window.WISCO || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* Prices on the site are whole dollars. Cents only show where the math needs them (cost per foot). */
  var money = function (n) { n = Number(n); var w = Math.abs(n - Math.round(n)) < 0.005; return "$" + n.toLocaleString("en-US", { minimumFractionDigits: w ? 0 : 2, maximumFractionDigits: w ? 0 : 2 }); };
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var store = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem("wisco." + k); if (!v) return d; v = JSON.parse(v);
        if (v == null) return d;
        if (d != null && typeof d === "object" && (typeof v !== "object" || Array.isArray(v) !== Array.isArray(d))) return d;
        return v;
      } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem("wisco." + k, JSON.stringify(v)); } catch (e) { } }
  };
  var FRANK = (W.managerName || "Frank").split(" ")[0];
  var RW = W.rewards || { review: "10% off your next order", referrer: "10% off their next order" };
  var BREAKS = W.breaks || [12, 24, 36, 50, 100, 150, 200, 500];
  var TIER = { supreme: "Best · Supreme grade", premium: "Better · Premium grade", standard: "Good · Standard grade", economy: "Value · Economy grade", pro: "Pro Series" };
  var TR = { supreme: 4, pro: 4, premium: 3, standard: 2, economy: 1, "": 0 };
  var SAWDIA = { grinder: [3, 9], cutoff: [12, 16], walk: [14, 99] };

  var MATS = [
    { k: "c", n: "Concrete", s: "Slabs, driveways, sidewalks, curb and gutter, parking lots, floors, foundations, walls, barrier wall, precast, concrete pipe", keys: ["c"] },
    { k: "r", n: "Hard & Reinforced", s: "Bridges and bridge decks, highway, airport, rebar, wire mesh, post-tension, river rock, hard aggregate", keys: ["r"] },
    { k: "g", n: "Green Concrete", s: "Early-entry joints, fresh pours, control joints, warehouse floors, next-day cuts", keys: ["g"] },
    { k: "a", n: "Asphalt", s: "Roads, parking lots, patching, utility trenching, overlays, loop cuts, asphalt over concrete", keys: ["a"] },
    { k: "bp", n: "Brick, Block & Pavers", s: "Hardscape, masonry, retaining wall, cinder block, CMU, fire brick, concrete pavers, clay pavers", keys: ["b", "p"] },
    { k: "s", n: "Stone & Granite", s: "Granite, marble, quartzite, engineered stone, limestone, sandstone, bluestone, flagstone, granite curb", keys: ["s"] },
    { k: "t", n: "Tile & Porcelain", s: "Ceramic, porcelain, large-format tile, marble, glass tile", keys: ["t"] },
    { k: "x", n: "Metal & Ductile", s: "Ductile iron pipe, cast iron, rebar, rail, steel, fire and rescue, demolition", keys: ["x"] },
    { k: "m", n: "Mortar Joints", s: "Tuckpointing, grout removal, crack chasing, joint cleanout", keys: ["m"] },
    { k: "sp", n: "Grinding & Coatings", s: "Level high spots, surface prep, strip epoxy, glue, thinset and paint", keys: ["sp"] }
  ];
  var SAWS = [
    { k: "grinder", n: "Angle Grinder", s: '4" to 9"', keys: ["grinder", "circ"] },
    { k: "cutoff", n: "Cut-Off Saw", s: 'Hand-held 12" to 16"', keys: ["cutoff"] },
    { k: "walk", n: "Walk-Behind Saw", s: "Pro 65 horsepower down to low horsepower", keys: ["walk"] },
    { k: "early", n: "Early-Entry Saw", s: "Soff-Cut style or Gorilla style", keys: ["early"] },
    { k: "table", n: "Tile / Masonry Saw", s: "Table and block saws", keys: ["table"], only: ["bp", "s", "t"] },
    { k: "wall", n: "Wall, Ring & Chain Saw", s: "Hydraulic, deep cut, diamond chain", keys: ["wall", "ring", "chain"] },
    { k: "core", n: "Core Drill or Core Rig", s: "Hand-held or rig mounted, any make or model", keys: ["core"] }
  ];
  var WANTS = [
    { k: "speed", n: "Fastest Cut", s: "Get me through it" },
    { k: "life", n: "Longest Life", s: "Most footage per blade" },
    { k: "price", n: "Lowest Price", s: "Keep the cost-in down" },
    { k: "frank", n: "Just Tell Me", s: FRANK + " picks, I cut" }
  ];
  /* The ladder our reps pitch on every call: Dragon first, then Extreme, T-Rex, Viper. */
  var LADDER = [
    { id: "dragon-supreme", label: "★ Unstoppable", rc: "" },
    { id: "dragon", label: "Exceptional Value", rc: "" },
    { id: "superblade-extreme", label: "High Performance", rc: "b" },
    { id: "super-g", label: "High Performance", rc: "b" },
    { id: "superblade-g3", label: "High Performance", rc: "b" },
    { id: "superblade-arrow", label: "High Performance", rc: "b" },
    { id: "swordfish", label: "High Performance", rc: "b" },
    { id: "t-rex", label: "Better Value", rc: "b" },
    { id: "viper-premium", label: "Good · Economical", rc: "g" },
    { id: "viper-general-purpose", label: "Good · Economical", rc: "g" }
  ];
  var LINES = [
    { k: "dragons", n: "The Dragons", s: "Our top multi-purpose blades. Red for long life. Purple when the job is everything at once.", ids: ["dragon-supreme", "dragon"], img: ["dragon-supreme", "dragon"] },
    { k: "superblades", n: "The Superblades", s: "Extreme, Super G, G3 and Arrow. Built to drop your cost per cut.", ids: ["superblade-extreme", "super-g", "superblade-g3", "superblade-arrow"], img: ["superblade-g3", "superblade-arrow"] },
    { k: "zenesis", n: "Zenesis Green Kut", s: "Early-entry blades with Zenesis diamond alignment. More footage, chip-free joints.", ids: ["zenesis-green-kut-purple", "zenesis-green-kut-orange", "zenesis-green-kut-green", "zenesis-green-kut-red", "zenesis-green-kut-yellow"], img: ["zenesis-green-kut-purple"] },
    { k: "4-core", n: "4-Core Bits", s: "Punisher, Wolv and Sabertooth. Pro Series bits for heavy rebar and hard aggregate.", ids: ["punisher", "wolv", "sabertooth"], img: ["punisher", "wolv", "sabertooth"] }
  ];
  LINES.push(
    { k: "workhorses", n: "T-Rex & Viper", s: "The everyday workhorses. Fast, fair priced, on the truck every day.", ids: ["t-rex", "viper-premium", "viper-general-purpose", "viper-supreme-turbo", "viper-specialty"], img: ["t-rex", "viper-premium"] },
    { k: "wet", n: "Wet & Flat Saw Blades", s: "Bonded for your area and what you cut. Walk-behind, looping, wall saw and prestress.", cat: "wet", ids: [], img: ["3mlb-low-hp-concrete", "kmlb-low-hp-asphalt-green"] },
    { k: "asphalt", n: "Wolverine Asphalt", s: "Hard bonds and drop segments for asphalt and abrasive material.", ids: ["wolverine-supreme", "wolverine-premium-plus-drop-segment", "wolverine-premium"], img: ["wolverine-supreme", "wolverine-premium"] },
    { k: "metal", n: "Blacksmyth & Ductile", s: "Ductile pipe, rail, rebar and rescue. One blade instead of a box of abrasives.", cat: "metal", ids: [], img: ["blacksmyth-supreme", "americut-ductile-premium"] }
  );
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
    home: ["Cheaper per box isn’t cheaper per cut. Price per foot is the number that matters.", "You don’t want the cheapest blade. You want the lowest cost per foot. Those are two different blades.", "A blade that quits halfway through the job costs you more than the blade.", "If your crew is changing blades, they aren’t cutting. Blade life is labor.", "The right bond for the material beats a pricier blade with the wrong one. Every time.", "Blade spinning but not cutting? It’s glazed. Wrong bond for the material.", "Hard material needs a soft bond. Soft, abrasive material needs a hard bond. Most blade problems start right there.", "The more you buy, the better the price. Ask before you send it.", "When’s the last time your blade guy called you with a better deal?", "You should be able to reach a real person who knows your account. Here, you can.", "Renting your saws? Run the numbers on owning one.", "Buying a saw? Buy it with the blades. That’s where the deal is.", "One blade that cuts concrete, block and asphalt means one blade on the truck.", "Tell me the material and the saw and I’ll tell you the blade. That part isn’t complicated.", "If a blade doesn’t do what I said it would, I want to hear about it first.", "Your saw is only as good as what’s spinning on it.", "Fast cut or long life? Tell me which one pays you and I’ll point you at the blade.", "Rebar and river rock will tell you fast what a blade is made of.", "A dull blade doesn’t just cut slow. It’s hard on the saw and on the guy running it.", "Aggregate changes from one region to the next. Your wet blade should be bonded for yours. Ours are.", "Send me a picture of what you’re running now. I’ll tell you if there’s a better blade for it.", "I’d rather sell you the right blade once than the wrong one twice.", "25 years in this business. I’m not always right, but I’m not wrong very often either.", "Not sure what to run on that job? Ask. That’s what I’m here for."],
    mat: ["Tell me what you’re cutting. The material picks the bond."],
    saw: ["What saw? I’ll only show sizes that fit it."],
    want: ["Speed, life or price. Pick the one that matters most on this job."],
    reorder: ["The part number is printed on the blade. Type that and you’re done."],
    shop: ["Everything has a price on it. Buying a stack? Ask for the break.", "Don’t see it? That doesn’t mean we can’t get it."],
    equipment: ["Make, model, how soon. Give me that and I’ll go find the deal.", "Renting your saws? Run the numbers on owning one."],
    depth: ["Rule of thumb: a 14 cuts 5 inches. Need deeper? Go 16, or ask about a ring saw."],
    fix: ["Most blade problems are the wrong bond for the material. Tell me the symptom."],
    cost: ["Put in your own numbers. The math doesn’t care who sold you the blade."],
    send: ["Fill it in once. Next time it’s two taps."],
    line: ["These are the ones we put our name on."]
  };
  var MATQUIP = {
    c: "Cured concrete: start with the Dragon. Tight budget, the T-Rex holds up.",
    r: "Rebar and river rock glaze a hard blade fast. You want a bond that stays open.",
    g: "Green concrete is a timing job. Get the joints in clean and get out.",
    a: "Asphalt is abrasive. A soft blade dies early on it. Run a hard bond.",
    bp: "Pavers and block: clean edges, fewer wasted pieces.",
    s: "Granite glazes a blade over. You want one that keeps exposing diamond.",
    t: "Porcelain chips easy. Thin rim, light pressure, let the blade work.",
    x: "Still burning abrasive wheels on ductile? A Blacksmyth holds its depth, first cut to last.",
    m: "Tuck pointing: you want a blade that holds its width down the joint.",
    sp: "Double row for a flat floor. T-Seg for stripping coatings."
  };
  var TIERQUIP = { supreme: "More per blade, less per cut. That’s the whole point of this one.", pro: "Pro Series. Built for the hard jobs.", premium: "Good everyday blade. Crews stock these by the box.", standard: "Does the job at a fair price. Step up when the material gets hard.", economy: "Budget blade. Fine for the short job." };
  function says(text, big) { return '<div class="bfs' + (big ? " big" : "") + '"><img alt="" src="brand/frank-cool' + (big ? "" : "-sm") + '.webp"><div><b>Big ' + esc(FRANK) + " says</b><p>" + esc(text) + "</p></div></div>"; }

  /* Blade trouble guide. Causes and fixes follow the DBW troubleshooting page. */
  var FIX = [
    { k: "glazed", n: "It spins but won’t cut", s: "Blade stopped cutting. Feels like pushing, not cutting.", why: "The blade is glazed. The bond is too hard for what you’re cutting, so it isn’t wearing away fast enough to expose fresh diamond.", now: "Make a few cuts in something soft and abrasive (asphalt, a concrete block, sandstone) to open the blade back up.", fix: "Run a softer bond made for hard material.", ids: ["dragon-supreme", "superblade-arrow", "swordfish"] },
    { k: "fast", n: "Blades wear out too fast", s: "Short life. You’re burning through them.", why: "The bond is too soft for the material. Abrasive material like asphalt, block and green concrete strips diamond out of a soft blade early.", now: "Check that the blade is rated for the saw and that water flow is good if you cut wet.", fix: "Run a harder bond made for abrasive material.", ids: ["wolverine-supreme", "wolverine-premium", "superblade-extreme"] },
    { k: "under", n: "The core is wearing under the segments", s: "Undercutting. Steel wears away below the diamond.", why: "Abrasive fines are grinding the steel core faster than the segments wear.", now: "If you cut wet, turn the water up to flush the cut.", fix: "Run a blade with undercut protection: drop segments or a wear-resistant core.", ids: ["superblade-extreme", "wolverine-premium-plus-drop-segment", "wolverine-supreme"] },
    { k: "wobble", n: "It wobbles or it’s warped", s: "Blade won’t run true.", why: "Usually the mount, not the blade: wrong collar size, dirty or loose flanges, or the saw running off its rated RPM. A blade that has been dropped or twisted is done.", now: "Check the flanges are clean and tight and the collars are the right size. Check the RPM rating on the blade against the saw.", fix: "If the core is bent, take it out of service. It is not safe to run.", ids: [] },
    { k: "segs", n: "It’s losing segments", s: "Segments coming off.", why: "Either the blade is too hard for the material, or the core is worn from undercutting and can’t hold them.", now: "Stop using that blade.", fix: "Match the blade to the material, and use enough water to flush the cut.", ids: ["dragon-supreme", "superblade-extreme", "t-rex"] },
    { k: "crack", n: "Cracks in the core or segments", s: "Hairline cracks.", why: "The blade is too hard for the material, or the saw needs attention: bearings, belts, shaft or flanges.", now: "Stop using that blade. Check the saw and the direction of rotation.", fix: "Run a softer bonded blade rated for that saw.", ids: ["dragon-supreme", "hybrid"] },
    { k: "hot", n: "It’s overheating", s: "Blued core, burning smell.", why: "Not enough coolant. Wet blades need steady water. Dry blades need shallow passes and air.", now: "Check water flow. Cutting dry, take shallow passes and let the blade spin free every 10 to 15 seconds.", fix: "Make sure the blade is rated for the saw and for dry cutting if you run dry.", ids: [] },
    { k: "uneven", n: "Segments wearing uneven", s: "One side wears faster.", why: "Uneven water on the two sides of the blade, or a saw problem: bad bearings, a worn arbor or a spindle out of line.", now: "Flush the water system and check both sides are getting flow.", fix: "Have the saw checked before it eats another blade.", ids: [] }
  ];
  var FIXWHY = {
    glazed: { "dragon-supreme": "Softer bond that keeps wearing on hard, reinforced concrete, so fresh diamond stays on the edge and it keeps biting.", "superblade-arrow": "Arrow-shaped segments put less diamond on the cut at once. More pressure per diamond, so it keeps cutting hard material instead of polishing it.", "swordfish": "Open, aggressive segment built for speed on hard material. It clears the slurry that glazes a blade over." },
    fast: { "wolverine-supreme": "Hard bond built for asphalt and abrasive material. It holds its diamond instead of letting the sand strip it.", "wolverine-premium": "Same hard asphalt bond at a lower cost-in. Made for abrasive material that eats a general-purpose blade.", "superblade-extreme": "Tall segments and a tough bond. More diamond to wear through before the blade is done." },
    under: { "superblade-extreme": "Built-in undercut protection keeps abrasive slurry off the steel under the segments.", "wolverine-premium-plus-drop-segment": "Drop segments reach down the side of the core and take the wear, so the steel doesn’t.", "wolverine-supreme": "Wide undercut-protecting segments made for asphalt, the most abrasive thing you cut." },
    segs: { "dragon-supreme": "Laser-welded segments on a softer bond. It cuts freely on hard material instead of hammering the welds.", "superblade-extreme": "Undercut protection keeps the core thick under the segments, so they have steel to hold onto.", "t-rex": "W-shaped segments cut cool and fast, with less shock on the weld." },
    crack: { "dragon-supreme": "A softer bond cuts without forcing it. Less stress on the core means fewer cracks.", "hybrid": "Runs wet or dry and cuts smooth on mixed material, so the blade isn’t fighting the cut." }
  };
  /* The questions customers actually ask, answered straight. From the sales floor. */
  var ANSWERS = [
    ["I already have a blade supplier.", "Good. You should. Are you under contract, or just used to calling the same guy? When’s the last time he called you with a better deal? We’re not asking you to switch. Compare one blade and decide."],
    ["Your price looks high.", "Compared to what? Send us what you’re paying and we’ll show you where we are. If we can’t beat it or match it, we’ll be the first to tell you. And the price on the site is the top price. Quantity breaks start at 6."],
    ["I can get blades cheaper at the supply house.", "Per box, maybe. Price per foot of cut is what counts on a job. A blade that lasts longer costs less per cut. Run it yourself in the cost-per-cut calculator."],
    ["What if I don’t like them?", "You’re never stuck with a blade you’re not happy with. We’ll swap it or take it back. Whatever it takes to make it right."],
    ["I don’t like ordering this way.", "Then start small. Order a few, run them hard, and tell us what your crew thinks. Nothing on this site charges a card. A person confirms every order."],
    ["I’m not sure which blade I need.", "Tell us the material and the saw. That’s all we need. Use the Blade Finder, or ask Frank and get one answer."]
  ];

  /* Starter orders: one tap loads a sensible first order. [family id, diameter, qty]. Everything stays editable. */
  var STARTERS = [
    { k: "concrete", n: "Concrete crew", s: "Dragon and T-Rex for the cut-off saws, turbo cups for the grinders.", items: [["dragon", 14, 6], ["t-rex", 14, 6], ["turbo-cup-premium", 7, 2]] },
    { k: "asphalt", n: "Paving crew", s: "Wolverine Supreme for production, Wolverine Premium for the patch truck.", items: [["wolverine-supreme", 14, 6], ["wolverine-premium", 14, 6]] },
    { k: "hardscape", n: "Hardscape crew", s: "Superblade G3 and Hybrid for pavers and block, Blue Tornado for the grinders.", items: [["superblade-g3", 14, 6], ["hybrid", 14, 3], ["blue-tornado", 4.5, 6]] },
    { k: "utility", n: "Utility crew", s: "Dragon Supreme for concrete and pipe, Blacksmyth and Ductile for iron.", items: [["dragon-supreme", 14, 6], ["blacksmyth", 14, 3], ["americut-ductile-premium", 14, 3]] }
  ];
  function starterLines(st) { return st.items.map(function (it) { var f = FAM[it[0]], v = f && f.vars.filter(function (x) { return x[2] === it[1]; })[0]; return v ? { f: f, v: v, q: it[2] } : null; }).filter(Boolean); }
  function startersHTML() {
    return '<div class="starters swipe">' + STARTERS.map(function (st) { var L = starterLines(st); if (!L.length) return ""; var tot = L.reduce(function (n, l) { return n + l.v[3] * l.q; }, 0), cnt = L.reduce(function (n, l) { return n + l.q; }, 0);
      return '<div class="starter"><b>' + esc(st.n) + "</b><span>" + esc(st.s) + "</span><ul>" + L.map(function (l) { return "<li>" + l.q + " x " + esc(l.f.n) + " " + esc(String(l.v[2])) + '"</li>'; }).join("") + '</ul><div class="st-foot"><em>' + cnt + " pieces · " + money(tot) + ' Buy It Now</em><button class="add" data-starter="' + st.k + '">Load it</button></div></div>'; }).join("") + "</div>";
  }
  var HDEPTH = { 12: '4"', 14: '5"', 16: '6"' }, GDEPTH = { 4: '1"', 4.5: '1-1/4"', 5: '1-1/2"', 7: '2-1/4"', 9: '3-1/4"' };
  function depthFor(f, v) { if (!v[2]) return ""; if (f.saws.indexOf("cutoff") >= 0 && HDEPTH[v[2]]) return HDEPTH[v[2]]; if (f.saws.indexOf("grinder") >= 0 && GDEPTH[v[2]] && f.cats.indexOf("cup") < 0) return GDEPTH[v[2]]; return ""; }

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

  function lastOrder() { var l = store.get("last", null); return l && Array.isArray(l.items) ? l : null; }
  var cart = store.get("cart", []);
  var isPreview = !/^https?:$/.test(location.protocol) || /claude|anthropic/.test(location.hostname);
  var wiz = { mode: "finder", mat: null, saw: null, want: null, all: false, hp: null };
  var LOWHP = W.lowHpMax || 20, WETLINE = "Our wet blades are specifically bonded for your area and what you are cutting, so you get optimal performance every time.";
  var HPS = [{ k: "low", n: "Low horsepower", s: "Up to " + LOWHP + " HP. Push saws and small walk-behinds." }, { k: "high", n: "High horsepower", s: "Over " + LOWHP + " HP, up to Pro 65 class." }, { k: "any", n: "Not sure", s: "Show me what fits and I’ll ask." }];
  var SHOPPAGE = 24, ordRef = "";
  var shop = { cat: "all", q: "", sort: "pop", n: SHOPPAGE, tag: "" };
  var deal = store.get("deal2", { saw: "", lines: [] });
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
  var PROMO = (W.promos || {}).cardFreeBlade || {}, PROMO_ON = !!PROMO.on;
  function isCard(pay) { return /card/i.test(pay || ""); }
  function promoBar() { return PROMO_ON ? '<div class="promo"><b>' + esc(PROMO.title || "Free blade when you pay this order by card") + "</b><span>" + esc(PROMO.text || "") + "</span></div>" : ""; }
  var BRK = [12, 24, 36, 50, 100];
  function tiered(v) { return v && Array.isArray(v[6]); }
  function eachAt(v, q) { if (!tiered(v)) return v[3]; var i = 0; BRK.forEach(function (b, k) { if (q >= b) i = k + 1; }); return i ? v[6][i - 1] : v[3]; }
  function rangeTxt(v) { return tiered(v) ? money(v[6][4]) + " to " + money(v[3]) : money(v[3]); }
  function buyRow(v) { return '<div class="buy-row" data-row><div class="price' + (tiered(v) ? " rng" : "") + '">' + rangeTxt(v) + "<small>" + (tiered(v) ? "each, by quantity · " : "") + esc(v[0]) + '</small></div><div class="act">' + qtyHTML(1) + '<button class="add" data-add>Add to order</button></div></div>'; }
  var MIXM = W.mixMonths || [3, 5, 8, 10], ONEMIN = W.singleItemMin || 24, QUICK = W.quickQty || [12, 24, 36, 50, 100], MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function mixOn() { return MIXM.indexOf(new Date().getMonth() + 1) >= 0; }
  function breakList() { return BREAKS.slice(0, -1).join(", ") + " and " + BREAKS[BREAKS.length - 1]; }
  function mixNames() { var a = MIXM.map(function (m) { return MONTHS[m - 1]; }); return a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function mixLine() { return mixOn() ? "Mix and match is on this month: blades in the same size group count together toward your price break." : "Mix and match pricing runs in " + mixNames() + ". This month, special pricing takes " + ONEMIN + " of the same item."; }
  /* Where the order stands against the price breaks. Mix months count the whole order; other months count the biggest single line. */
  function breakState(t) {
    var mix = mixOn(), big = null, lg = 0, sm = 0;
    t.lines.forEach(function (l) { if (!big || l.c.q > big.c.q) big = l; if (l.v[2] && l.v[2] < 12) sm += l.c.q; else lg += l.c.q; });
    var n = mix ? Math.max(lg, sm) : (big ? big.c.q : 0), list = mix ? BREAKS : BREAKS.filter(function (q) { return q >= ONEMIN; });
    var nb = list.filter(function (q) { return q > n; })[0], pb = list.filter(function (q) { return q <= n; }).pop();
    return { mix: mix, n: n, nb: nb, pb: pb, of: mix ? (lg >= sm ? " large blades" : " small blades") : (big ? " of " + big.f.n : " of one item"), need: nb ? nb - n : 0 };
  }
  function breaksLine() { return 'Buying more? <button class="more" data-breaks>Ask for ' + BREAKS.join(", ") + " piece price breaks</button>"; }

  function cardHTML(f, o) {
    o = o || {};
    var vs = varsFor(f, o.saw), first = defVar(f, vs), r = rating(f, o.mat);
    var size = vs.length > 1
      ? '<select aria-label="Size" data-size>' + vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === first ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("") + "</select>"
      : '<div class="one">' + esc(vlabel(first)) + "</div>";
    return '<article class="card' + (o.pick ? " pick" : "") + '" data-f="' + f.id + '">' +
      (o.ribbon ? '<div class="ribbon ' + (o.rc || "") + '"><span>' + o.ribbon + "</span>" + (o.ribbon2 ? "<span>" + o.ribbon2 + "</span>" : "") + "</div>" : "") +
      '<button class="c-top" data-open aria-label="Details for ' + esc(f.n) + '">' + pic(f) + "<span>" +
      (f.tier ? '<span class="tier ' + f.tier + '">' + (o.ribbon ? TIER[f.tier].split(" · ").pop() : TIER[f.tier]) + "</span>" : "") + "<h3>" + esc(f.n) + "</h3>" +
      (r ? '<span class="rate">' + stars(r) + "<span><b>" + r.toFixed(1) + "</b> on " + esc(o.mat.n) + "</span></span>" : "") + "</span></button>" +
      (f.hook ? '<p class="hook">' + esc(f.hook) + "</p>" : "") +
      '<div class="buy">' + size + buyRow(first) + '<button class="more" data-open>Details, ratings and all ' + f.vars.length + (f.vars.length === 1 ? " size" : " sizes") + "</button>" + (f.cats.indexOf("equip") >= 0 ? '<button class="btn gold sm block" data-equip>Negotiate with your sales rep</button>' : "") + "</div></article>";
  }

  /* ---------- picking blades ---------- */
  function candidates(mat, saw) {
    var all = candidatesRaw(mat, saw), wolf = mat && (mat.k === "a" || mat.k === "g");
    var good = all.filter(function (f) { return f.id.indexOf("eagle") !== 0 && (wolf || f.id.indexOf("wolverine") !== 0) && f.cats.indexOf("equip") < 0 && (mat.k === "x" || f.cats.indexOf("metal") < 0); });
    return good.length ? good : all;
  }
  function candidatesRaw(mat, saw) {
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
    return LADDER.filter(function (L) { return ids[L.id]; }).map(function (L) { return { f: ids[L.id], label: L.label, rc: L.rc }; });
  }
  /* Good, better, best: the first blade on each rung. */
  function rungs(lad) { var seen = {}; return lad.filter(function (p) { if (seen[p.label]) return false; seen[p.label] = 1; return true; }); }
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

  function welcomeBack() {
    var last = lastOrder(), n = last && last.items ? last.items.filter(function (c) { return FAM[c.f] && findVar(FAM[c.f], c.v); }).length : 0, who = (me().name || "").split(/\s+/)[0];
    if (!n) return "";
    return '<div class="last wb"><div><b>Welcome back' + (who ? ", " + esc(who) : "") + '.</b><span>Same as last time? ' + n + (n === 1 ? " line" : " lines") + " from " + esc(last.date) + '</span></div><button class="btn red sm" data-reorder>Reorder it</button></div>';
  }
  function home() {
    var top = C.families.filter(function (f) { return f.rank < 99 && f.id.indexOf("eagle") !== 0 && f.cats.indexOf("core") < 0; }).slice(0, 16);
    var line = ["dragon", "superblade-g3", "dragon-supreme", "superblade-arrow", "zenesis-green-kut-purple"];
    var lines = LINES.map(function (L) {
      var fs = lineFams(L); if (!fs.length) return "";
      var from = Math.min.apply(null, fs.map(function (f) { return f.min; }));
      return '<a class="linecard" href="#line-' + L.k + '"><span class="lc-art">' + L.img.map(function (id) { return FAM[id] && FAM[id].img ? '<img alt="" loading="lazy" src="img/' + esc(FAM[id].img) + '">' : ""; }).join("") + "</span><b>" + esc(L.n) + "</b><span>" + esc(L.s) + "</span><em>From " + money(from) + " →</em></a>";
    }).join("");
    var r0 = repBySlug(me().rep);
    var T = (W.testimonials || []).filter(function (t) { return t && t.quote; });
    app.innerHTML =
      '<section class="hero"><div class="wrap"><div>' +
      (function () { var r = repBySlug(me().rep); var rf = store.get("ref", ""); return '<span class="pill"><i>★</i> ' + (r ? "Your salesman: " + esc(r.name) : rf ? "Referred by " + esc(rf) : "A division of Diamond Blade Warehouse, LLC") + " <i>★</i></span>"; })() +
      (r0 ? '<span class="kick rep">Your salesman: ' + esc(r0.name) + "</span>" : "") + '<span class="kick">Simplified reorder</span>' +
      "<h1>The right blade. Right now.</h1>" +
      '<p class="sub">Tell us what you cut. We ship it anywhere in the USA, same day or next. <b>Your blades, your price, 60 seconds.</b></p>' +
      welcomeBack() +
      '<div class="doors">' +
      '<a class="door d1 shine" href="#finder"><div><b>Blade Finder</b><span>Two taps. We line up the right blade.</span></div><em>→</em></a>' +
      '<a class="door d2" href="#reorder"><div><b>Fast Reorder</b><span>Know what you run? Punch it in and go.</span></div><em>→</em></a>' +
      '<a class="door d3 withav" href="#ask-frank"><img alt="" src="brand/frank-cool-sm.webp"><div><b>Ask ' + esc(FRANK) + "</b><span>Not sure? Get Big " + esc(FRANK) + "’s pick in 3 taps.</span></div><em>→</em></a>" +
      "</div>" +
      '</div><div class="art"><img class="logo" src="brand/logo.webp" alt="DBW WISCO, a division of Diamond Blade Warehouse" width="430" height="458">' +
      '<div class="stage"><div class="lineup">' + line.map(function (n) { return '<img alt="" src="brand/lineup/' + n + '.webp">'; }).join("") + "</div></div></div></div></section>" +

      (PROMO_ON ? '<section class="promoband"><div class="wrap">' + promoBar() + "</div></section>" : "") +
      '<section class="costco"><div class="wrap"><div><b>The more you buy, the better the price.</b><span>We price like Costco. Build your order and the price drops at 12, 24, 36, 50 and 100. Have an account? Your rep’s number beats ours.</span></div><button class="btn gold shine" data-pricing>Get my price</button></div></section>' +

      '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>Our heavy hitters</h2><p>The blades and bits we put our name on.</p></div><div class="lines">' + lines + "</div></div></section>" +

      '<section class="sec deal"><div class="wrap"><div class="sec-head"><h2>If they make it, we can get it</h2><p>Need a saw to go with your blades? Tell us what you’re after. We source it, build the package and work with you on price. The more you buy, the better the deal.</p></div>' + equipPicker("Go find me the best price", 1) + "</div></section>" +

      '<section class="sec"><div class="wrap"><div class="sec-head"><h2>What the crews run</h2><p>Dragon first. Then Extreme, Super G, T-Rex and Viper. Our most common blades, in the order our reps quote them.</p></div><div class="rail">' + top.map(function (f) { return cardHTML(f); }).join("") + '</div><div class="center"><a class="btn blue" href="#shop">Shop everything</a><button class="btn gold" data-pricing>Negotiate with ' + esc(FRANK) + '</button></div></div></section>' +

      '<section class="sec deal"><div class="wrap narrow"><div class="sec-head"><h2>Need a saw?</h2><p>Buy your blades and your saw together and we sharpen the pencil on both. Stack 15, 25 or 36 blades and your rep builds the package.</p></div><div class="center"><a class="btn chrome shine" href="#saw-deal">Build my saw package</a><a class="btn ghost" href="#cost">Renting? Run the math</a></div></div></section>' +

      '<section class="sec alt"><div class="wrap narrow"><div class="sec-head"><h2>People buy from people</h2><p>No robots. No phone mazes. Relationships matter.</p></div><ul class="ppl">' +
      "<li><b>A real person on every order.</b> Someone who knows your account picks it up. Nothing here charges a card.</li>" +
      "<li><b>One hand washes the other.</b> We sell blades to feed our families. You run them to feed yours.</li>" +
      "<li><b>We obsess so you don’t have to.</b> You sweat behind the saw. We sweat the blades, the bonds and the freight.</li>" +
      "<li><b>We remember who you are.</b> Tell your salesman your team. It has a way of showing up in the box.</li>" +
      "</ul></div></section>" +

      '<section class="sec levels"><div class="wrap"><div class="sec-head"><h2>Your account has a level</h2><p>The site price is the price with no account behind it. Your real price depends on your account level.</p></div><div class="three swipe">' +
      '<div class="lvl"><em>1</em><b>Site price</b><p>What you see here. No account needed. It drops as the quantity goes up.</p></div>' +
      '<div class="lvl"><em>2</em><b>Quantity breaks</b><p>' + breakList() + " pieces. " + esc(mixLine()) + "</p></div>" +
      '<div class="lvl top"><em>3</em><b>Account pricing</b><p>Every account has a level, and the price drops at each one. One quick text or email and we send back what your level gets you.</p><div class="lvls">' + (W.levels || ["Contractor", "Pro", "Gold", "Distributor", "Platinum"]).map(function (x, i, a) { return "<span" + (i === a.length - 1 ? ' class="top"' : "") + ">" + esc(x) + "</span>"; }).join("<i>›</i>") + "</div></div>" +
      '</div><div class="center"><button class="btn gold shine" data-account>Open a free account</button><button class="btn chrome" data-pricing>Check my account pricing</button><button class="btn ghost-d" data-terms>Apply for Net 30 terms</button></div></div></section>' +

      '<section class="sec"><div class="wrap narrow"><div class="sec-head"><h2>Straight answers</h2><p>The questions we hear every day.</p></div><div class="qa">' + ANSWERS.map(function (x) { return "<details><summary>" + esc(x[0]) + "</summary><p>" + esc(x[1]) + "</p></details>"; }).join("") + '</div><div class="promise"><b>Our word</b><span>You’re never stuck with a blade you’re not happy with. We’ll swap it or take it back.</span></div><div class="center"><a class="btn blue" href="#cost">Run the cost-per-cut math</a><a class="btn ghost-d" href="#fix">Blade giving you trouble?</a></div></div></section>' +

      (T.length ? '<section class="sec alt"><div class="wrap"><div class="sec-head"><h2>Straight from the jobsite</h2><p>Real customers. Their words.</p></div><div class="three">' + T.map(function (t) { return '<figure class="quote"><blockquote>' + esc(t.quote) + "</blockquote><figcaption>" + esc(t.who || "") + "</figcaption></figure>"; }).join("") + "</div></div></section>" : "") +

      '<section class="sec dark"><div class="wrap"><div class="sec-head"><h2>Two ways to save</h2><p>No points, no fine print. Your rep applies it to your next order.</p></div><div class="three swipe">' +
      '<div class="point"><b>Leave a review</b><p>Tell us how the blades held up, good or bad. An honest review earns you ' + esc(RW.review) + '.</p><button class="btn chrome sm" data-review style="margin-top:12px">Leave a review</button></div>' +
      '<div class="point"><b>Refer a contractor</b><p>Send someone our way. When they place a first order and name you, you get ' + esc(RW.referrer) + '.</p><button class="btn chrome sm" data-refer style="margin-top:12px">Refer a contractor</button></div>' +
      '<div class="point"><b>Just tell us</b><p>Something off with an order, a blade or a rep? ' + esc(FRANK) + ' reads every note.</p><button class="btn ghost sm" data-feedback style="margin-top:12px">Send ' + esc(FRANK) + " a note</button></div>" +
      "</div></div></section>";
    setNav("#home");
  }

  function dots(n, total) { var s = ""; for (var i = 1; i <= total; i++) s += '<i class="' + (i < n ? "done" : i === n ? "on" : "") + '"></i>'; return '<div class="dots" aria-label="Step ' + n + " of " + total + '">' + s + "</div>"; }
  function tiles(list, attr, cls) { return '<div class="tiles ' + (cls || "") + '">' + list.map(function (x) { return '<button class="tile" data-' + attr + '="' + x.k + '"><b>' + esc(x.n) + "</b><span>" + esc(x.s) + "</span></button>"; }).join("") + "</div>"; }
  function shell(kicker, step, total, body, wide) {
    return '<section class="screen wiz"><div class="wrap' + (wide ? " wide" : "") + '"><div class="wiz-top"><button class="back" data-back>← Back</button>' + (total ? dots(step, total) : "") + '</div><div class="wiz-kicker">' + kicker + "</div>" + body + "</div></section>";
  }
  function chosen() { var a = []; if (wiz.mat) a.push(wiz.mat.n); if (wiz.saw) a.push(wiz.saw.n); if (wiz.hp) a.push(byK(HPS, wiz.hp).n); if (wiz.want) a.push(wiz.want.n); return a.length ? '<div class="chosen">' + a.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : ""; }

  function aggBox() {
    return '<div class="frank aggbox"><b class="h">What’s in your concrete matters</b>' +
      "<p>Limestone, dolomite, sandstone, pit gravel, river rock, traprock, granite, basalt, quartzite, chert, flint. They don’t cut the same, and they change from one part of the country to the next. Houston river rock is some of the hardest there is, so the bond has to be very soft. That same blade is the wrong blade in Wisconsin.</p>" +
      "<p><b>We take that seriously.</b> Tell me where you cut and I’ll recommend the bond for the aggregate you actually have. The goal is the most footage for your money, not the most blades sold per year. We want to save you money and be your blade guys every year after this one.</p>" +
      '<div class="hprow"><input id="aggloc" type="text" placeholder="City, state" autocomplete="address-level2" aria-label="City and state"><button class="btn gold sm" data-aggask>Get ' + esc(FRANK) + '’s recommendation</button></div>' +
      '<div class="center" style="margin-top:10px"><a class="btn ghost-d sm" href="#early">See the aggregate map</a></div></div>';
  }
  function wizard() {
    var ask = wiz.mode === "ask", total = ask ? 3 : 2, kick = ask ? "Ask " + esc(FRANK) : "Blade Finder";
    if (!wiz.mat) { app.innerHTML = shell(kick, 1, total, "<h1>What are you cutting?</h1>" + says(QUIP.mat[0]) + tiles(MATS, "mat") + aggBox()); return; }
    if (!wiz.saw) {
      var saws = SAWS.filter(function (s) { return (!s.only || s.only.indexOf(wiz.mat.k) >= 0) && candidates(wiz.mat, s).length; });
      if (saws.length === 1) { wiz.saw = saws[0]; return wizard(); }
      app.innerHTML = shell(kick, 2, total, chosen() + "<h1>What saw are you running?</h1>" + says(QUIP.saw[0]) + tiles(saws, "saw")); return;
    }
    if (wiz.saw.k === "walk" && !wiz.hp) {
      app.innerHTML = shell(kick, 2, total, chosen() + "<h1>How much horsepower?</h1>" + says("Horsepower changes the bond. Tell me what the saw puts out and I’ll match the blade to it.") + tiles(HPS, "hp", "three-up") +
        '<div class="frank hpbox"><b class="h">Or type it in</b><div class="hprow"><input id="hpin" type="number" inputmode="numeric" min="1" max="200" placeholder="e.g. 13 or 65" aria-label="Saw horsepower"><button class="btn gold sm" data-hpgo>Show my blades</button></div></div>'); return;
    }
    if (ask && !wiz.want) { app.innerHTML = shell(kick, 3, total, chosen() + "<h1>What matters most?</h1>" + says(QUIP.want[0]) + tiles(WANTS, "want")); return; }
    var list = candidates(wiz.mat, wiz.saw), o = { mat: wiz.mat, saw: wiz.saw }, h = chosen();
    if (wiz.saw.k === "early") h += '<div class="frank wetbox"><b class="h">Which color for your aggregate?</b><p>The color is the bond. Tap your area on the map and we tell you which one to run.</p><div class="sendrow"><a class="btn gold sm" href="#early">Open the color guide</a></div></div>';
    if (wiz.saw.k === "walk") {
      var lowFam = function (f) { return /low-hp/.test(f.id); };
      if (wiz.hp === "high") list = list.filter(function (f) { return !lowFam(f); });
      if (wiz.hp === "low") list = list.filter(lowFam).concat(list.filter(function (f) { return !lowFam(f); }));
      h += '<div class="frank wetbox"><b class="h">Wet blades, bonded for you</b><p>' + esc(WETLINE) + (wiz.hp === "high" ? " High-horsepower wet blades are built to order. Tell us the saw, the horsepower and where you cut." : "") + '</p><div class="sendrow"><button class="btn gold sm" data-wetspec>Spec my wet blade</button></div></div>';
    }
    if (!list.length) { app.innerHTML = shell(kick, 0, 0, h + "<h1>That one’s a phone call.</h1>" + '<div class="empty">Nothing on the shelf matches that combo. ' + esc(FRANK) + " will spec it for you.</div>" + frankBox("")); return; }
    if (ask) {
      var r = rank(list, wiz.mat, wiz.saw, wiz.want.k), ladA = rungs(ladder(list)), picksA = ladA.length >= 3 ? ladA : bestBetterGood(list, wiz.mat, wiz.saw);
      var top = r.filter(function (f) { return picksA.some(function (p) { return p.f === f; }); })[0] || r[0];
      if (!picksA.some(function (p) { return p.f === top; })) picksA = [{ f: top, label: "Best", rc: "b" }].concat(picksA).slice(0, 4);
      var why = { speed: "it’s the fastest of the three for that job", life: "it’ll outlast the others on that saw", price: "it’s the lowest cost-in that still does the job right", frank: "it’s what I’d put on my own saw" }[wiz.want.k];
      h += says("Good, better, best. My pick is the " + top.n + ". For " + wiz.mat.n.toLowerCase() + " on a " + wiz.saw.n.toLowerCase() + ", " + why + ".", true) +
        '<div class="results">' + picksA.map(function (p) { var mine = p.f === top; return cardHTML(p.f, { mat: wiz.mat, saw: wiz.saw, pick: mine, ribbon: p.label, ribbon2: mine ? "★ " + esc(FRANK) + "’s Pick" : "", rc: p.rc }); }).join("") + "</div>" + frankBox(top.n);
    } else {
      var lad = ladder(list), picks = lad.length >= 3 ? lad : bestBetterGood(list, wiz.mat, wiz.saw), shown = {};
      var pre = wiz.saw.k === "walk" && wiz.hp === "low" ? list.filter(function (f) { return /low-hp/.test(f.id); }) : [];
      picks = pre.map(function (f) { return { f: f, label: "Built for low horsepower", rc: "" }; }).concat(picks);
      picks.forEach(function (p) { shown[p.f.id] = 1; });
      var rest = rank(list, wiz.mat, wiz.saw).filter(function (f) { return !shown[f.id]; });
      h += "<h1>Here’s your lineup.</h1>" + says((MATQUIP[wiz.mat.k] || "Start at the top and work down.") + " " + list.length + (list.length === 1 ? " blade fits." : " fit, best first.")) +
        '<div class="results">' + picks.map(function (p, i) { return cardHTML(p.f, { mat: wiz.mat, saw: wiz.saw, pick: i === 0, ribbon: p.label, rc: p.rc }); }).join("") + rest.map(function (f) { return cardHTML(f, o); }).join("") + "</div>" +
        '<div class="center"><a class="btn gold" href="#ask-frank" data-keep>Still not sure? Ask ' + esc(FRANK) + "</a></div>";
    }
    app.innerHTML = shell(kick, 0, 0, h);
  }
  function frankMsg(pickName) {
    return "Hey " + FRANK + ", question from the Wisco site." + (wiz.mat ? " I’m cutting " + wiz.mat.n.toLowerCase() : "") + (wiz.saw ? " with a " + wiz.saw.n.toLowerCase() : "") + (wiz.want ? ". Priority: " + wiz.want.n.toLowerCase() : "") + "." + (pickName ? " The site says run the " + pickName + "." : "") + " My question: ";
  }
  function frankBox(pickName) {
    return '<div class="frank" data-frank="' + esc(pickName) + '"><div class="frankme"><img alt="' + esc(W.managerName || "Frank") + '" src="brand/frank-cool.webp" width="96" height="104" loading="lazy"><div><b class="h">Talk it through with me.</b>' +
      "<p>I’ve got 25 years in this industry. I’m not always right, but I’m not wrong very often either. Send over your question and your setup, and tell me what you’re looking to accomplish. I’ll get you set up right. I can promise you that.</p>" +
      '<span class="sig">' + esc(W.managerName || "Frank") + ", " + esc(W.managerTitle || "") + "</span></div></div>" +
      '<div class="sendrow">' + (W.textNumber ? '<button class="btn gold sm" data-fsms>Text ' + esc(FRANK) + "</button>" : "") + '<button class="btn gold sm" data-femail>Email ' + esc(FRANK) + '</button><button class="btn ghost-d sm" data-fcopy>Copy my question</button></div>' +
      '<p class="note">' + (W.textDisplay ? "Text: <b style=\"user-select:all\">" + esc(W.textDisplay) + "</b> · " : "") + 'Email: <b style="user-select:all">' + esc(W.orderEmail || "") + "</b></p></div>";
  }

  function hitHTML(f, v) {
    return '<div class="hit" data-f="' + f.id + '" data-v="' + esc(vkey(v)) + '">' + pic(f) + "<div><h4>" + esc(f.n) + '</h4><div class="meta">' + esc(vlabel(v)) + "<br>" + esc(v[0]) + '</div></div><div class="r"><span class="p">' + rangeTxt(v) + '</span><span class="act">' + qtyHTML(1) + '<button class="add" data-add>Add</button></span></div></div>';
  }
  function searchVars(q, limit, fuzzy) {
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
    if (!out.length && !fuzzy) {
      var words = {}; C.families.forEach(function (f) { f.n.toLowerCase().split(/[^a-z0-9]+/).forEach(function (w) { if (w.length > 3) words[w] = 1; }); });
      var fixed = t.map(function (x) { if (x.length < 4 || /^\d/.test(x)) return x; var best = x, bd = 3; Object.keys(words).forEach(function (w) { var d = lev(x, w); if (d < bd) { bd = d; best = w; } }); return best; });
      if (fixed.join(" ") !== t.join(" ")) return searchVars(fixed.join(" "), limit, true);
    }
    return out.sort(function (a, b) { return a[2] - b[2]; }).slice(0, limit);
  }
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j; for (i = 1; i <= a.length; i++) { var q = [i]; for (j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; } return p[b.length]; }
  function quickRows() {
    var fs = C.families.filter(function (f) { return f.rank < 99 && f.id.indexOf("eagle") !== 0; }).slice(0, 12);
    return '<div class="qrows">' + fs.map(function (f) {
      var vs = f.vars, d = defVar(f, vs);
      return '<div class="qrow" data-f="' + f.id + '">' + pic(f) + '<div class="qmain"><b>' + esc(f.n) + "</b>" +
        (vs.length > 1 ? '<select aria-label="Size" data-qsize>' + vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === d ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("") + "</select>" : '<span class="one">' + esc(vlabel(d)) + "</span>") + '<small class="qrng" data-qrng>' + rangeTxt(d) + " each</small>" +
        '</div><div class="qchips" role="group" aria-label="Quantity">' + [1].concat(QUICK).map(function (q) { return '<button type="button" data-qadd="' + q + '">' + (q === 1 ? "1–11" : q) + "</button>"; }).join("") + "</div></div>";
    }).join("") + "</div>";
  }
  var CREWS = [
    { n: "Concrete crew", s: "Flatwork, walls, curb, pipe", mat: "c" }, { n: "Paving crew", s: "Asphalt and overlays", mat: "a" },
    { n: "Hardscape crew", s: "Pavers, block, retaining wall", mat: "bp" }, { n: "Utility crew", s: "Ductile, pipe, reinforced", mat: "x" },
    { n: "Masonry crew", s: "Brick, block, mortar joints", mat: "m" }, { n: "Demolition crew", s: "Rebar and hard aggregate", mat: "r" }
  ];
  function reorder() {
    var last = lastOrder(), n = last && last.items ? last.items.length : 0;
    app.innerHTML = shell("Fast Reorder", 0, 0,
      "<h1>Know what you run?</h1>" +
      '<input class="search-big" id="rq" type="search" placeholder="Search: Dragon 14 or AES14SGC1" autocomplete="off" aria-label="Search by blade, size or part number">' +
      '<div class="hintchips gold" id="rhints">' + ["Dragon 14", "Superblade Extreme 14", "Super G 14", "T-Rex 14", "Viper 14", "Blue Tornado 7"].map(function (x) { return '<button data-hint="' + esc(x) + '">' + esc(x) + "</button>"; }).join("") + "</div>" +
      '<div class="hits" id="rhits"></div>' +
      (n ? '<div class="last"><div><b>Same as last time?</b><span>' + n + (n === 1 ? " line" : " lines") + " from " + esc(last.date) + '</span></div><button class="btn red sm" data-reorder>Reorder it</button></div>' : "") +
      '<h2 class="wiz-h2">Tap a quantity</h2><p class="lead sm">Our most common blades. The price drops at every button. ' + esc(mixLine()) + "</p>" + quickRows() +
      '<div class="center"><a class="btn gold" href="#shop">Browse our full catalog</a><button class="btn gold" data-pricing>Negotiate with ' + esc(FRANK) + "</button></div>" +
      (W.textNumber ? '<div class="frank photo"><b class="h">Easiest reorder there is</b><p>Snap a picture of your old blade and send it to ' + esc(FRANK) + '. We’ll read the label and write it up.</p><a class="bignum" href="#" data-photo>' + esc(W.textDisplay || "") + '</a><div class="sendrow"><button class="btn gold" data-photo>Text ' + esc(FRANK) + ' a photo</button><button class="btn blue" data-photomail>Email a photo</button></div></div>' : "") +
      '<h2 class="wiz-h2">Not sure what to reorder?</h2><p class="lead sm">Pick your crew and we walk you to the right blade.</p><div class="tiles">' + CREWS.map(function (c) { return '<button class="tile" data-crew="' + c.mat + '"><b>' + esc(c.n) + "</b><span>" + esc(c.s) + "</span></button>"; }).join("") + "</div>" +
      '<div class="frank"><b class="h">Your rep can build your list for you</b><p>Ask your rep to text you a reorder link. It opens with your usual blades already in the cart. You can change anything before you send it.</p></div>');
    $("#rq").addEventListener("input", function (e) { runSearch(e.target.value); });
  }
  function runSearch(q) {
    var hits = searchVars(q.trim(), 40), box = $("#rhits");
    $("#rhints").hidden = !!q.trim();
    box.innerHTML = !q.trim() ? "" : hits.length ? hits.map(function (h) { return hitHTML(h[0], h[1]); }).join("") : '<div class="empty">No match for “' + esc(q) + "”. Try the blade name or fewer words." + (W.textNumber ? ' <button class="btn chrome sm" data-photo style="margin-top:10px">Text ' + esc(FRANK) + " a photo of it</button>" : "") + "</div>";
  }

  var moreIO = null;
  function watchMore() {
    var el = $("#shopmore"); if (moreIO) { moreIO.disconnect(); moreIO = null; } if (!el) return;
    if (!("IntersectionObserver" in window)) { shop.n = 9999; shopScreen(); return; }
    moreIO = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) { shop.n += SHOPPAGE; shopScreen(); } }, { rootMargin: "900px" }); moreIO.observe(el);
  }
  var SHOPCATS = [
    { k: "all", n: "Everything", s: "Every blade, bit, chain and saw we sell. The more you buy, the better the price." },
    { k: "highspeed", n: "High-Speed Blades", s: "Dry blades for cut-off saws and walk-behinds. Dragons, Superblades, T-Rex. This is where the footage gets made." },
    { k: "wet", n: "Wet Blades", s: "Bonded for your area and what you cut. Flat saw, loop, wall saw and prestress." },
    { k: "small", n: "Small Diameter", s: '4" to 10" for grinders and circular saws. Fast, clean, on every truck.' },
    { k: "core", n: "Core Bits", s: "4-Core Pro Series plus stock wet and dry bits. Built for rebar and hard aggregate." },
    { k: "cup", n: "Cup Wheels", s: "Grind, level and strip. Turbo and double-row cups that move material." },
    { k: "tuck", n: "Tuck Point & Crack", s: "Mortar out fast, brick left alone. Tuck point blades and crack chasers." },
    { k: "tile", n: "Tile & Stone", s: "Chip-free cuts on porcelain, ceramic, marble and granite." },
    { k: "green", n: "Green Concrete", s: "Early-entry blades color-matched to your aggregate. Clean joints the same day." },
    { k: "chain", n: "Diamond Chain", s: "Chains, bars and sprockets matched to your saw. Deep cuts and square corners." },
    { k: "metal", n: "Metal & Rescue", s: "Ductile, rail, rebar and rescue. One diamond blade instead of a box of abrasives." },
    { k: "abrasive", n: "Abrasive Wheels", s: "Bonded cut-off wheels, by the box, when that’s what the job calls for." },
    { k: "equip", n: "Saws & Equipment", s: "Saws, core rigs and drill stands. Buy it with blades and the price gets better." },
    { k: "dust", n: "Vacs & Dust Control", s: "Shrouds and vacs that keep you silica-compliant without water." }
  ];
  var SHOPTAGS = [
    { k: "s1216", n: '12" to 16"', t: function (f) { return f.vars.some(function (v) { return v[2] >= 12 && v[2] <= 16; }); } },
    { k: "s1820", n: '18" to 20"', t: function (f) { return f.vars.some(function (v) { return v[2] >= 18 && v[2] <= 20; }); } },
    { k: "cured", n: "Cured concrete", t: function (f) { return (f.m.c || 0) >= 4; } },
    { k: "greenc", n: "Green concrete", t: function (f) { return (f.m.g || 0) >= 4; } },
    { k: "asph", n: "Asphalt", t: function (f) { return (f.m.a || 0) >= 4; } },
    { k: "lowhp", n: "Low horsepower", t: function (f) { return /low-hp/.test(f.id); } },
    { k: "highhp", n: "High horsepower", t: function () { return false; } }
  ];
  function shopScreen() {
    var cats = SHOPCATS.filter(function (c) { return c.k === "all" || C.families.some(function (f) { return f.cats.indexOf(c.k) >= 0; }); });
    var t = shop.q.toLowerCase().split(/\s+/).filter(Boolean), tag = byK(SHOPTAGS, shop.tag), curCat = byK(SHOPCATS, shop.cat) || SHOPCATS[0];
    var list = C.families.filter(function (f) { return (shop.cat === "all" || f.cats.indexOf(shop.cat) >= 0) && (!tag || tag.t(f)) && t.every(function (x) { return f.hay.indexOf(x) >= 0; }); });
    if (shop.sort === "low") list.sort(function (a, b) { return a.min - b.min; });
    else if (shop.sort === "high") list.sort(function (a, b) { return b.min - a.min; });
    else if (shop.sort === "az") list.sort(function (a, b) { return a.n.localeCompare(b.n); });
    var left = list.length - shop.n;
    var grid = list.length ? list.slice(0, shop.n).map(function (f) { return cardHTML(f); }).join("") + (left > 0 ? '<div id="shopmore" style="grid-column:1/-1;height:1px"></div>' : "")
      : shop.tag === "highhp" ? '<div class="frank" style="grid-column:1/-1"><b class="h">High-horsepower blades are built for you</b><p>' + esc(WETLINE) + ' Tell us the saw, the horsepower and where you cut.</p><div class="sendrow"><button class="btn gold sm" data-wetspec>Spec my blade</button></div></div>'
      : '<div class="empty d" style="grid-column:1/-1">Nothing matches that. Clear a filter, try fewer words, or ask ' + esc(FRANK) + ".</div>";
    setTimeout(watchMore, 0);
    if ($("#shopgrid")) { $("#shopgrid").innerHTML = grid; $("#shopn").textContent = list.length + (list.length === 1 ? " product" : " products"); $("#shopblurb").textContent = curCat.s; $$(".cat").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === shop.cat); }); $$(".tagc").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.tag === shop.tag); }); return; }
    app.innerHTML = '<section class="sec"><div class="wrap"><div class="sec-head"><h2>Shop everything</h2><p>Pick what you’re after. Prices drop with quantity.</p></div>' +
      '<input id="sq" class="shopsearch" type="search" placeholder="Search blade, size or part #" aria-label="Search" value="' + esc(shop.q) + '">' +
      '<b class="flabel">What are you looking for?</b><div class="cats wrapc">' + cats.map(function (c) { return '<button class="cat" data-cat="' + c.k + '" aria-pressed="' + (shop.cat === c.k) + '">' + esc(c.n) + "</button>"; }).join("") + "</div>" +
      '<p class="shopblurb" id="shopblurb">' + esc(curCat.s) + "</p>" +
      '<b class="flabel">Narrow it down (optional)</b><div class="cats wrapc tags">' + SHOPTAGS.map(function (g) { return '<button class="cat tagc" data-tag="' + g.k + '" aria-pressed="' + (shop.tag === g.k) + '">' + esc(g.n) + "</button>"; }).join("") + "</div>" +
      '<div class="shopbar"><select id="ssort" aria-label="Sort"><option value="pop">Most popular</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="az">A to Z</option></select><b id="shopn">' + list.length + (list.length === 1 ? " product" : " products") + '</b></div><div class="grid" id="shopgrid">' + grid + "</div></div></section>";
    $("#sq").addEventListener("input", function (e) { shop.q = e.target.value.trim(); shop.n = SHOPPAGE; shopScreen(); });
    $("#ssort").value = shop.sort; $("#ssort").addEventListener("change", function (e) { shop.sort = e.target.value; shopScreen(); });
    setNav("#shop");
  }

  function lineFams(L) { return L.cat ? C.families.filter(function (f) { return f.cats.indexOf(L.cat) >= 0; }) : L.ids.map(function (id) { return FAM[id]; }).filter(Boolean); }
  function coreScreen() {
    var four = ["punisher", "wolv", "sabertooth"].map(function (id) { return FAM[id]; }).filter(Boolean), stock = C.families.filter(function (f) { return f.cats.indexOf("core") >= 0 && four.indexOf(f) < 0; });
    app.innerHTML = shell("Core bits", 0, 0, "<h1>Core bits.</h1>" + says("Rebar, hard aggregate, deep holes. Tell me the rig and the diameter and I’ll tell you the bit.") +
      '<h2 class="wiz-h2">4-Core Pro Series</h2><p class="lead sm">Punisher, Wolv and Sabertooth. Our bits for heavy rebar and hard aggregate.</p><div class="results">' + four.map(function (f) { return cardHTML(f); }).join("") + "</div>" +
      '<h2 class="wiz-h2">Stock core bits and adaptors</h2><p class="lead sm">Premium wet and dry concrete bits off the shelf, plus extensions and adaptors.</p><div class="results">' + stock.map(function (f) { return cardHTML(f); }).join("") + "</div>" + frankBox(""));
    setNav("");
  }
  /* Early-entry bond colors. Chart and map are Diamond Blade Warehouse's own (Green Kut page and Aggregate Map page). */
  var AGG = [
    { k: "soft", n: "Soft", rocks: "Soft limestone, sandstone, dolomite limestone, siliceous, soft shell", color: "Yellow", hex: "#0490c3", cls: "g" },
    { k: "medsoft", n: "Medium soft", rocks: "Pit gravel, limestone, dolomite", color: "Orange", hex: "#263c7a", cls: "c" },
    { k: "med", n: "Medium", rocks: "Medium hard river rock, gravel, medium traprock, decomposed granite", color: "Red", hex: "#e6a823", cls: "e" },
    { k: "medhard", n: "Medium hard", rocks: "Granite, slate, traprock, basalt, quartzite", color: "Green", hex: "#e02326", cls: "f" },
    { k: "hard", n: "Hard", rocks: "Hard chert, hard quartz, flint rock, hard river rock", color: "Purple", hex: "#3f3a23", cls: "d" }
  ], eeSel = "";
  function earlyPick(k) { eeSel = k; earlyScreen(true); var r = $("#eeres"); if (r) r.scrollIntoView({ block: "start", behavior: "smooth" }); }
  function earlyScreen(keep) {
    var a = byK(AGG, eeSel), fams = a ? C.families.filter(function (f) { return f.cats.indexOf("green") >= 0 && new RegExp("\\b" + a.color + "$", "i").test(f.n); }) : [];
    var y = keep ? window.scrollY : 0;
    app.innerHTML = shell("Early-entry saws", 0, 0, "<h1>Which color blade?</h1>" + says("Soff-Cut style or Gorilla style, the color is the bond. Match it to your aggregate and the joint comes out clean.") +
      '<div class="frank"><b class="h">1. Tap where you cut</b><p>Find your area on the map and tap it. Colors on the map show how hard the aggregate is there.</p><div class="aggmap" id="aggmap"><span class="note">Loading the map…</span></div>' +
      '<div class="agglegend">' + AGG.map(function (x) { return '<span><i style="background:' + x.hex + '"></i>' + esc(x.n) + "</span>"; }).join("") + "</div></div>" +
      '<div class="frank"><b class="h">Or 2. Pick your aggregate</b><div class="aggs">' + AGG.map(function (x) { return '<button type="button" class="agg" data-agg="' + x.k + '" aria-pressed="' + (x.k === eeSel) + '"><b>' + esc(x.n) + "</b><span>" + esc(x.rocks) + "</span></button>"; }).join("") + "</div></div>" +
      '<div id="eeres">' + (a ? '<div class="eepick"><span>' + esc(a.n) + " aggregate</span><b>Run " + esc(a.color.toUpperCase()) + "</b><small>" + esc(a.rocks) + ".</small></div>" +
        (fams.length ? '<div class="results">' + fams.map(function (f) { return cardHTML(f); }).join("") + "</div>" : "") : "") + "</div>" +
      '<div class="frank"><b class="h">The whole color chart</b><table class="cmp"><thead><tr><th>Blade color</th><th>Aggregate</th></tr></thead><tbody>' +
      [["White", "Soft and abrasive"], ["Yellow", "Soft"], ["Orange", "Medium soft"], ["Red", "Medium"], ["Green", "Medium hard"], ["Purple", "Hard"], ["Black", "Critically hard"], ["Next Day", "Cutting the next day, partially cured"]].map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + "</td></tr>"; }).join("") + '</tbody></table><p class="note">Fits Soff-Cut and Core Cut early-entry saws. Zenesis Green Kut also comes in Gorilla arbors. Aggregate changes from one pit to the next, so if you’re between two colors, ask.</p></div>' +
      '<div class="frank"><b class="h">Not sure? Tell me where you cut</b><div class="hprow"><input id="eeloc" type="text" placeholder="City, state" autocomplete="address-level2" aria-label="City and state"><button class="btn gold sm" data-eeask>Ask ' + esc(FRANK) + "</button></div><p class=\"note\">I’ll confirm the color for your area and your mix.</p></div>");
    setNav(""); if (keep) window.scrollTo(0, y);
    var put = function () { var m = $("#aggmap"); if (!m || !window.AGGMAP) return; m.innerHTML = window.AGGMAP; m.addEventListener("click", function (e) { var c = e.target.getAttribute && e.target.getAttribute("class"), hit = AGG.filter(function (x) { return x.cls === c; })[0]; if (hit) earlyPick(hit.k); }); };
    if (window.AGGMAP) put(); else { var sc = document.createElement("script"); sc.src = "aggmap.js"; sc.onload = put; sc.onerror = function () { var m = $("#aggmap"); if (m) m.innerHTML = '<span class="note">Map didn’t load. Pick your aggregate below.</span>'; }; document.head.appendChild(sc); }
  }
  function lineScreen(k) {
    var L = byK(LINES, k); if (!L) return home();
    var fs = lineFams(L);
    app.innerHTML = shell("Our heavy hitters", 0, 0, "<h1>" + esc(L.n) + ".</h1>" + says(L.s) + '<div class="results">' + fs.map(function (f) { return cardHTML(f); }).join("") + "</div>" + frankBox(""));
  }

  /* ---------- saw package calculator ---------- */
  var SD = C.sawdeal || { tiers: [], saws: [] };
  function dealBlades() { return C.families.filter(function (f) { return f.id.indexOf("eagle") !== 0 && f.vars.some(function (v) { return v[5]; }); }); }
  function dealCount() { return deal.lines.reduce(function (n, l) { return n + l.q; }, 0); }
  function dealTier(n) { var t = null; SD.tiers.forEach(function (x) { if (n >= x[0]) t = x; }); return t; }
  function dealTotal() { return null; }
  function dealReady() { return false && deal.lines.every(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); return v && v[6]; }); }
  function dealBIN() {
    var hit = SKU[(deal.saw || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")], sawP = hit ? hit[0].vars[hit[1]][3] : 0, blades = 0;
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) blades += v[3] * l.q; });
    return { saw: sawP, blades: blades };
  }
  /* Package math uses only the prices already on the site: blades at their quantity price, saw at its price.
     "Saw after blade savings" = saw price minus what the quantity pricing took off the blades. */
  function dealCalc() {
    var mix = mixOn(), grp = { lg: 0, sm: 0 }, L = [], n = 0, blades = 0, list = 0;
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) { var g = v[2] && v[2] < 12 ? "sm" : "lg"; grp[g] += l.q; L.push({ l: l, f: f, v: v, g: g }); } });
    L.forEach(function (x) { x.each = eachAt(x.v, mix ? grp[x.g] : x.l.q); n += x.l.q; blades += x.each * x.l.q; list += x.v[3] * x.l.q; });
    var hit = SKU[(deal.saw || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")], sawP = hit ? hit[0].vars[hit[1]][3] : 0;
    return { lines: L, n: n, blades: blades, save: list - blades, sawP: sawP, total: blades + sawP, net: Math.max(0, sawP - (list - blades)) };
  }
  function dealCur() { return { f: $("#dfam").value, v: $("#dvar").value }; }
  function dealLine(c) { return deal.lines.filter(function (l) { return l.f === c.f && l.v === c.v; })[0]; }
  function dealSetQty(q) {
    q = Math.max(0, Math.min(9999, parseInt(q, 10) || 0)); var c = dealCur(), ln = dealLine(c);
    if (ln && !q) deal.lines.splice(deal.lines.indexOf(ln), 1); else if (ln) ln.q = q; else if (q) deal.lines.push({ f: c.f, v: c.v, q: q });
    store.set("deal2", deal); dealRefresh();
  }
  function dealSync() { var ln = dealLine(dealCur()), q = ln ? ln.q : 0; $("#dqty").value = Math.min(50, q); $("#dqn").value = q; }
  function dealRefresh() {
    var d = dealCalc(), saw = SD.saws.filter(function (x) { return x.sku === deal.saw; })[0], cur = dealLine(dealCur()), q = cur ? cur.q : 0;
    $("#dqout").textContent = q + (q === 1 ? " blade" : " blades"); if (document.activeElement !== $("#dqn")) $("#dqn").value = q; if (document.activeElement !== $("#dqty")) $("#dqty").value = Math.min(50, q);
    $("#deallines").innerHTML = d.lines.length ? d.lines.map(function (x) { return '<div class="dl" data-i="' + deal.lines.indexOf(x.l) + '"><span><b>' + x.l.q + " x " + esc(x.f.n) + "</b><small>" + esc(vlabel(x.v)) + " · " + money(x.each) + ' each</small></span><button class="link" data-dealrm>Remove</button></div>'; }).join("") : "";
    $("#dealout").innerHTML = !saw ? '<div class="dealtotal off"><span>Pick a saw to see your package</span></div>' :
      '<div class="dealtotal"><span>Your package</span>' +
      '<div class="drow"><i>' + d.n + (d.n === 1 ? " blade" : " blades") + "</i><b>" + money(d.blades) + "</b></div>" +
      (d.save > 0.005 ? '<div class="drow good"><i>Quantity pricing took off</i><b>− ' + money(d.save) + "</b></div>" : "") +
      '<div class="drow"><i>' + esc(saw.n) + "</i><b>" + money(d.sawP) + "</b></div>" +
      '<div class="drow big"><i>Package total</i><b>' + money(d.total) + "</b></div>" +
      (d.n ? '<strong>' + (d.net <= 0 ? "Your blade savings cover the whole saw." : d.save > 0.005 ? "After your blade savings, the saw works out to " + money(d.net) + ", down from " + money(d.sawP) + "." : "Add blades and watch the saw get cheaper. The price drops at 12.") + "</strong>" : "<strong>Slide the blades up and watch the price move.</strong>") +
      "<small>Before freight and tax. Your rep can sharpen this further on a real package.</small></div>";
    var sb = $("[data-dealsend]"); if (sb) sb.disabled = !(saw && d.n);
    var rp = $("#r-price"); if (rp) { rp.value = d.sawP || ""; rentCalc(); }
  }
  function sawDeal() {
    var fams = dealBlades();
    if (!deal.saw && SD.saws.some(function (x) { return x.sku === "TS420"; })) deal.saw = "TS420";
    var h = "<h1>Build your saw package.</h1>" + says("The more you buy, the better the price. Every blade you add lowers the price of the package.") +
      '<div class="frank"><b class="h">1. Pick your saw</b><select id="dsaw" class="bigsel" aria-label="Saw"><option value="">Choose a saw…</option>' + SD.saws.map(function (x) { return '<option value="' + esc(x.sku) + '"' + (x.sku === deal.saw ? " selected" : "") + ">" + esc(x.n) + "</option>"; }).join("") + "</select></div>" +
      '<div class="frank"><b class="h">2. Stack your blades</b><div class="dealadd two"><select id="dfam" aria-label="Blade">' + fams.map(function (f) { return '<option value="' + f.id + '"' + (f.id === "superblade-extreme" ? " selected" : "") + ">" + esc(f.n) + "</option>"; }).join("") + '</select><select id="dvar" aria-label="Size"></select></div>' +
      '<div class="slide"><div class="slidetop"><b id="dqout">0 blades</b><span>Slide it, or type a number</span></div><input id="dqty" type="range" min="0" max="50" step="1" value="0" aria-label="How many blades"><div class="ticks"><i>0</i><i>12</i><i>24</i><i>36</i><i>50+</i></div>' +
      '<div class="slidenum"><button type="button" class="stp" data-dstep="-1" aria-label="One fewer">−</button><input id="dqn" type="number" inputmode="numeric" min="0" max="9999" value="0" aria-label="Number of blades"><button type="button" class="stp" data-dstep="1" aria-label="One more">+</button></div></div>' +
      '<p class="note">The price drops at 12, 24, 36, 50 and 100 blades. Most crews package 15, 25, 36, 50 or 100. ' + esc(mixLine()) + '</p><div class="deallines" id="deallines"></div></div>' +
      '<div id="dealout"></div>' +
      '<div class="center"><button class="btn gold shine" data-dealsend disabled>Send this saw package to my rep</button><button class="btn ghost" data-dealclear>Start over</button></div>' +
      rentBox() +
      '<p class="note light">Want a saw that isn’t listed, or a bigger stack? Your rep can build any package. That’s where the real deals are.</p>';
    app.innerHTML = shell("Build your own saw package", 0, 0, h);
    fillDealVars(); dealSync(); dealRefresh(); setNav("#saw-deal");
  }
  function rentBox() {
    return '<div class="frank cc"><b class="h">Renting your saws? Do the math.</b><p>Two sliders. That’s it.</p>' +
      '<div class="rs"><label for="r-day">Rental per day <b id="r-day-o">$75</b></label><input id="r-day" type="range" min="20" max="300" step="5" value="75"></div>' +
      '<div class="rs"><label for="r-days">Days you rent in a month <b id="r-days-o">8</b></label><input id="r-days" type="range" min="1" max="25" step="1" value="8"></div>' +
      '<input type="hidden" id="r-price" value=""><div id="rout" class="ccout"></div></div>';
  }
  function fillDealVars() {
    var f = FAM[$("#dfam").value]; if (!f) return;
    var vs = f.vars.filter(function (v) { return v[5]; }), d = vs.filter(function (v) { return v[2] === 14; })[0] || defVar(f, vs);
    $("#dvar").innerHTML = vs.map(function (v) { return '<option value="' + esc(vkey(v)) + '"' + (v === d ? " selected" : "") + ">" + esc(vlabel(v)) + "</option>"; }).join("");
  }
  function dealText() {
    var saw = SD.saws.filter(function (s) { return s.sku === deal.saw; })[0], n = dealCount(), t = dealTier(n), L = [];
    L.push("SAW PACKAGE REQUEST (" + (t ? t[0] + "-pack" : n + " blades") + ")");
    if (saw) L.push("Saw: " + saw.n + " (" + saw.sku + ")");
    deal.lines.forEach(function (l) { var f = FAM[l.f], v = f && findVar(f, l.v); if (v) L.push(l.q + " x " + v[0] + "  " + f.n + " " + vlabel(v)); });
    var dc = dealCalc(); if (dc.n) L.push("Site price: blades " + money(dc.blades) + " + saw " + money(dc.sawP) + " = " + money(dc.total) + "  (before freight and tax, customer wants your best package price)");
    return L.join("\n");
  }

  /* ---------- equipment + depth chart ---------- */
  var EQUIP = ["Hand-held cut-off saws", "Walk-behind saws", "Core drills & rigs", "Wall, ring & chain saws", "Diamond wire", "Grinders", "Circular saws", "Floor grinders & scarifiers", "Plate compactors & rammers", "Mortar & concrete mixers", "Trash pumps (dirty water)", "Clean water pumps", "Vacuums & dust control", "Power trowels & screeds", "Generators", "Something else"], eqSel = [];
  function equipPicker(cta, short) {
    var list = short ? ["Hand-held cut-off saws", "Walk-behind saws", "Core drills & rigs", "Plate compactors & rammers", "Mortar & concrete mixers", "Trash pumps (dirty water)", "Vacuums & dust control", "Something else"] : EQUIP;
    return '<div class="eqchips">' + list.map(function (x) { return '<button type="button" class="eqchip" data-eqpick="' + esc(x) + '" aria-pressed="' + (eqSel.indexOf(x) >= 0) + '">' + esc(x) + "</button>"; }).join("") + "</div>" + (short ? '<p class="eqbrands"><a href="#equipment">See everything we can get →</a></p>' : "") +
      '<p class="eqbrands">Pulse-Bac, Husqvarna, Diamond Products, Core Cut and every other major brand.</p>' +
      '<div class="center"><button class="btn chrome shine" data-equip>' + cta + "</button></div>";
  }
  var STONE = ["Router bits", "CNC tooling", "Polishing pads", "Diamond saw blades", "Core bits", "Grinding wheels", "In-line tooling", "Adhesives", "Sealers & cleaners", "Polishers & grinders", "Saws", "Material handling", "Abrasives"], stSel = [];
  function stoneScreen() {
    app.innerHTML = shell("Stone fabrication", 0, 0,
      "<h1>Granite, marble and stone shops.</h1>" + says("For fabrication we run Helix Professional Tools. Tell me the material and the machine and I’ll get you the right tooling and a price.") +
      '<div class="frank"><b class="h">Tap what you need</b><p>Granite, marble, quartzite, engineered stone, porcelain and glass. Pick the categories, send it, and we come back with the right Helix product and your price.</p><div class="eqchips">' + STONE.map(function (x) { return '<button type="button" class="eqchip" data-stonepick="' + esc(x) + '" aria-pressed="' + (stSel.indexOf(x) >= 0) + '">' + esc(x) + "</button>"; }).join("") + '</div><div class="center"><button class="btn gold shine" data-stone>Get my Helix price</button></div>' +
      '<p class="note">Want to look through the full Helix line first? <a href="https://helixtools.net" target="_blank" rel="noopener">helixtools.net</a> opens in a new tab. Their site has its own login. Order through us and it goes on your DBW account.</p></div>' + frankBox(""));
    setNav("");
  }
  function equipment() {
    var rows = SD.saws.map(function (s) { var hit = SKU[s.sku.toUpperCase().replace(/[^A-Z0-9.]/g, "")]; var v = hit && hit[0].vars[hit[1]]; var d = (s.n.match(/(\d+)"/) || [])[1]; var depth = { 12: '4"', 14: '5"', 16: '6"' }[d] || ""; return v ? "<tr><td>" + esc(s.n) + "</td><td>" + (d ? d + '"' : "") + "</td><td>" + depth + "</td><td class=\"num\">" + money(v[3]) + '</td><td><button class="add" data-eqadd="' + esc(s.sku) + '">Add</button><button class="add pk" data-pkg="' + esc(s.sku) + '">+ Blades</button></td></tr>' : ""; }).join("");
    var eq = C.families.filter(function (f) { return f.cats.indexOf("equip") >= 0 || f.cats.indexOf("dust") >= 0; });
    app.innerHTML = shell("Equipment deals", 0, 0,
      "<h1>If they make it, we can get it.</h1>" + says(QUIP.equipment[0]) +
      '<div class="frank"><b class="h">Tap what you need</b><p>Pick as many as you want. ' + esc(FRANK) + " goes hunting and comes back with the best price out there. It works like Costco: the more you buy, the better the price. Buying blades in bulk? We can often eat most or all of the equipment cost.</p>" + equipPicker("Go find me the best price") + '<div class="center"><a class="btn blue sm" href="#saw-deal">Build a saw package</a></div></div>' +
      '<div class="frank"><b class="h">Gas cut-off saws, side by side</b><p class="pknote"><b>With every blade you add, it lowers the cost of the saw.</b> Tap <b>+ Blades</b> on any saw, slide the blade count up and watch the price move.</p><div class="tablewrap"><table class="cmp saws"><thead><tr><th>Saw</th><th>Blade</th><th>Max depth</th><th class="num">Buy now</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="note">Depth is typical for that blade size. Buying blades with it? Your rep can do better on the saw.</p><div class="center"><button class="btn gold sm" data-equip>Negotiate with your sales rep</button></div></div>' +
      '<h2 class="wiz-h2">Equipment on the shelf</h2><div class="results two-up swipe">' + eq.map(function (f) { return cardHTML(f); }).join("") + "</div>", true);
    setNav("#equipment");
  }
  function depth() {
    app.innerHTML = shell("Cutting depth chart", 0, 0,
      "<h1>How deep will it cut?</h1>" + says(QUIP.depth[0]) + '<p class="lead">Typical maximum depth of cut by blade size. Your saw’s guard and flanges can change it by up to half an inch.</p>' +
      DEPTH.map(function (g) { return '<div class="frank"><b class="h">' + esc(g[0]) + '</b><div class="tablewrap"><table class="cmp"><thead><tr><th>Blade / tool</th><th>Max depth of cut</th></tr></thead><tbody>' + g[1].map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>"; }).join("") +
      '<div class="center"><a class="btn chrome" href="#finder">Find the blade for it</a></div>');
    setNav("");
  }

  var fixSel = "";
  function fixScreen() {
    var f = byK(FIX, fixSel), h;
    if (!f) h = "<h1>What’s the blade doing?</h1>" + says(QUIP.fix[0]) + '<div class="tiles">' + FIX.map(function (x) { return '<button class="tile" data-fix="' + x.k + '"><b>' + esc(x.n) + "</b><span>" + esc(x.s) + "</span></button>"; }).join("") + "</div>";
    else {
      var fs = f.ids.map(function (id) { return FAM[id]; }).filter(Boolean);
      h = "<h1>" + esc(f.n) + ".</h1>" +
        '<div class="frank"><b class="h">What’s going on</b><p>' + esc(f.why) + '</p><b class="h">Do this now</b><p>' + esc(f.now) + '</p><b class="h">The real fix</b><p>' + esc(f.fix) + "</p></div>" +
        (fs.length ? '<h2 class="wiz-h2">Blades that fix it</h2><div class="results">' + fs.map(function (x) { var w = (FIXWHY[f.k] || {})[x.id]; return "<div>" + (w ? '<div class="whyfix"><b>Why this one</b><span>' + esc(w) + "</span></div>" : "") + cardHTML(x) + "</div>"; }).join("") + "</div>" : "") + frankBox("");
    }
    app.innerHTML = shell("Blade trouble?", 0, 0, h); setNav("");
  }
  function costScreen() {
    var d = FAM["dragon-supreme"] || FAM["dragon"], dv = d ? defVar(d, d.vars) : null;
    app.innerHTML = shell("Cost per cut", 0, 0,
      "<h1>Price per box or price per foot?</h1>" + says(QUIP.cost[0]) +
      '<p class="lead">A blade that costs more and lasts longer is the cheaper blade. Put in what you pay and how many feet you get. Use your own numbers.</p>' +
      '<div class="frank cc"><div class="ccgrid"><div><b class="h">Blade A (what you run now)</b><div class="field"><label for="ca-p">What you pay per blade ($)</label><input id="ca-p" type="number" inputmode="decimal" min="0" placeholder="e.g. 110"></div><div class="field"><label for="ca-f">Feet you get out of one</label><input id="ca-f" type="number" inputmode="decimal" min="0" placeholder="your number"></div></div>' +
      '<div><b class="h">Blade B (the one you’re considering)</b><div class="field"><label for="cb-p">What it costs per blade ($)</label><input id="cb-p" type="number" inputmode="decimal" min="0" value="' + (dv ? dv[3] : "") + '"></div><div class="field"><label for="cb-f">Feet you’d get out of one</label><input id="cb-f" type="number" inputmode="decimal" min="0" placeholder="your number"></div></div></div>' +
      '<div class="field"><label for="c-ft">Feet you cut in a month</label><input id="c-ft" type="number" inputmode="decimal" min="0" placeholder="e.g. 5000"></div><div id="ccout" class="ccout">Fill in both blades to see the cost per foot.</div></div>' +
      '<p class="note light">Blade B starts at the ' + (d ? esc(d.n) + " 14\" single-blade price" : "price you enter") + '. Change it to any blade. We don’t fill in blade life for you, because it depends on your material, your saw and your operator.</p>' +
      '<div class="center"><a class="btn chrome" href="#finder">Find the right blade</a><button class="btn ghost" data-breaks>Get my price breaks</button></div>');
    setNav("");
    costCalc();
  }
  function costCalc() {
    var g = function (id) { return parseFloat(($("#" + id) || {}).value) || 0; }, ap = g("ca-p"), af = g("ca-f"), bp = g("cb-p"), bf = g("cb-f"), ft = g("c-ft"), o = $("#ccout");
    if (!o) return;
    if (!(ap && af && bp && bf)) { o.className = "ccout"; o.innerHTML = 'Fill in both blades to see the cost per foot. <button type="button" class="btn gold sm" data-ccex style="margin-top:8px">Show me an example</button>'; return; }
    var a = ap / af, b = bp / bf, win = a === b ? "" : a < b ? "A" : "B", diff = Math.abs(a - b);
    o.className = "ccout on";
    o.innerHTML = '<div class="ccrow"><span>Blade A</span><b>' + money(a) + ' / ft</b></div><div class="ccrow"><span>Blade B</span><b>' + money(b) + " / ft</b></div>" +
      (win ? "<strong>Blade " + win + " is cheaper per foot by " + money(diff) + (ft ? ". On " + ft.toLocaleString() + " feet a month that’s " + money(diff * ft) + " a month, " + money(diff * ft * 12) + " a year." : ".") + "</strong>" : "<strong>Dead even per foot.</strong>") +
      "<small>Blades per month: A " + (ft ? (ft / af).toFixed(1) : "?") + ", B " + (ft ? (ft / bf).toFixed(1) : "?") + ". Fewer blade changes is time back on the job.</small>";
  }
  function rentCalc() {
    var g = function (id) { return parseFloat(($("#" + id) || {}).value) || 0; }, day = g("r-day"), days = g("r-days"), price = g("r-price"), o = $("#rout");
    if (!o) return;
    if (!(day && days)) { o.className = "ccout"; o.textContent = "Enter your rental rate and days to see what renting costs you."; return; }
    var mo = day * days, yr = mo * 12;
    o.className = "ccout on";
    o.innerHTML = '<div class="ccrow"><span>Rental per month</span><b>' + money(mo) + '</b></div><div class="ccrow"><span>Rental per year</span><b>' + money(yr) + "</b></div>" +
      (price ? "<strong>You’re renting " + days + " days a month. A " + money(price) + " saw pays for itself in about " + (price / mo < 1 ? "under a month" : (price / mo).toFixed(1) + " months") + ". After that it’s yours.</strong>" : "<strong>Pick a saw above to see how fast it pays for itself.</strong>");
  }

  function repTools() {
    var cur = me().rep || "", base = location.origin + location.pathname;
    app.innerHTML = shell("For the sales team", 0, 0,
      "<h1>Your own link.</h1>" + '<p class="lead">Text customers a link with your name on it. When they order, it comes in marked as yours.</p>' +
      '<div class="frank"><b class="h">1. Pick your name</b><div class="reps" id="rtreps">' + (W.reps || []).map(function (r) { var sl = slug(r.name); return '<button type="button" class="rep' + (cur === sl ? " on" : "") + '" data-rtrep="' + sl + '"><span class="av">' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : esc(initials(r.name))) + "</span><b>" + esc(r.name) + "</b></button>"; }).join("") + "</div></div>" +
      '<div class="frank"><b class="h">2. Copy your link</b><pre class="order" id="rtlink">' + esc(cur ? base + "?rep=" + cur : "Pick your name first") + '</pre><div class="sendrow"><button class="btn chrome sm" data-rtcopy>Copy my link</button></div><p class="note">Customers who open it see “Your salesman: ' + esc(cur ? (repBySlug(cur) || {}).name || "" : "you") + '” and you’re pre-picked at checkout.</p></div>' +
      '<div class="frank"><b class="h">3. Send a customer their usual order</b><p>Fill the cart with what they normally buy, open Send my order, and tap “Copy a reorder link for this cart.” Text that link. It opens with their blades already loaded.</p><div class="sendrow"><a class="btn blue sm" href="#reorder">Build a cart</a></div></div>' +
      '<div class="frank"><b class="h">Texts that work</b><p class="tpl">Running low on blades? Reorder in 60 seconds, no phone tag: [your link]</p><p class="tpl">I loaded your usual order. Change the quantities if you need to and hit send: [reorder link]</p><p class="tpl">Not sure what to run on that job? Tap Ask Frank. Three questions and you get good, better and best: [your link]</p></div>');
    setNav("");
  }

  function route() {
    var h = location.hash || "#home"; document.body.dataset.r = h.slice(1).split("-")[0];
    if (h.indexOf("#blade-") === 0) { var f = FAM[h.slice(7)]; if (!app.innerHTML) home(); if (f) openDetail(f); return; }
    window.scrollTo(0, 0);
    if (h === "#finder" || h === "#ask-frank") {
      var mode = h === "#finder" ? "finder" : "ask";
      if (!wiz.keep) { wiz.mat = wiz.saw = null; } wiz.hp = null; wiz.hpn = null;
      wiz.keep = false; wiz.mode = mode; wiz.want = null; wiz.all = false; wizard(); setNav(h); bfShow("mat");
    } else if (h === "#reorder") { reorder(); setNav(h); bfShow("reorder"); }
    else if (h === "#shop") { app.innerHTML = ""; shopScreen(); bfShow("shop"); }
    else if (h === "#saw-deal") { sawDeal(); bfShow("equipment"); }
    else if (h === "#equipment") { equipment(); bfShow("equipment"); }
    else if (h === "#stone") { stoneScreen(); bfShow("home"); }
    else if (h === "#core") { coreScreen(); bfShow("line"); }
    else if (h === "#early") { eeSel = ""; earlyScreen(); bfShow("line"); }
    else if (h === "#depth") { depth(); bfShow("depth"); }
    else if (h === "#team") { repTools(); bfShow("home"); }
    else if (h === "#fix") { fixSel = ""; fixScreen(); bfShow("fix"); }
    else if (h === "#cost") { costScreen(); bfShow("cost"); }
    else if (h.indexOf("#line-") === 0) { lineScreen(h.slice(6)); setNav(""); bfShow("line"); }
    else { home(); bfShow("home"); }
  }

  /* ---------- floating Big Frank ---------- */
  var bfCtx = "home", bfI = 0;
  function bfLines() {
    var t = totals(), a = bfCtx === "home" || !QUIP[bfCtx] ? [] : QUIP[bfCtx].slice();
    if (bfCtx === "results" && wiz.mat && MATQUIP[wiz.mat.k]) a = [MATQUIP[wiz.mat.k]];
    if (t.units) { var bs = breakState(t); if (bs.nb) a.unshift(bs.need + " more" + bs.of + " hits the " + bs.nb + "-piece price."); }
    return a;
  }
  var HOMEQ = QUIP.home.slice().sort(function () { return Math.random() - 0.5; });
  function bfShow(ctx) { if (ctx) { bfCtx = ctx; bfI = 0; } var a = bfLines(); a = a.concat(HOMEQ.filter(function (q) { return a.indexOf(q) < 0; })); $("#bfp").textContent = a[bfI % a.length]; }
  var lastY = 0; window.addEventListener("scroll", function () { var y = window.scrollY, el = $("#bf"); if (Math.abs(y - lastY) < 12) return; el.classList.toggle("away", y > lastY && y > 160); lastY = y; }, { passive: true });
  function bfOpen(open) { $("#bf").classList.toggle("open", open); store.set("bf", open ? 1 : 0); }

  /* ---------- cart ---------- */
  function cartLines() { return cart.map(function (c) { var f = FAM[c.f], v = f && findVar(f, c.v); return f && v ? { c: c, f: f, v: v } : null; }).filter(Boolean); }
  /* Each line is priced by its quantity bracket. Small months: the line's own quantity. Big months: its size group's total. */
  function totals() {
    var L = cartLines(), t = 0, n = 0, list = 0, mix = mixOn(), grp = { lg: 0, sm: 0 };
    L.forEach(function (l) { l.g = l.v[2] && l.v[2] < 12 ? "sm" : "lg"; if (tiered(l.v)) grp[l.g] += l.c.q; });
    L.forEach(function (l) { l.bq = mix && tiered(l.v) ? grp[l.g] : l.c.q; l.each = eachAt(l.v, l.bq); n += l.c.q; t += l.each * l.c.q; list += l.v[3] * l.c.q; });
    return { lines: L, total: t, units: n, list: list, save: list - t };
  }
  function addToCart(fid, key, q) {
    q = Math.max(1, Math.min(9999, parseInt(q, 10) || 1));
    var hit = cart.filter(function (c) { return c.f === fid && c.v === key; })[0];
    if (hit) hit.q += q; else cart.push({ f: fid, v: key, q: q });
    saveCart();
  }
  function saveCart() { store.set("cart", cart); badge(); bfI = 0; bfShow(); }
  function badge() {
    var t = totals(); $("#cartn").textContent = t.units; $("#dock").hidden = !t.units;
    if (t.units) $("#dockinfo").innerHTML = "<b>" + t.units + (t.units === 1 ? " item" : " items") + " · " + money(t.total) + "</b><span>Priced by quantity. Your account may do better.</span>";
  }
  function renderCart() {
    var t = totals(), b = $("#cartbody");
    if (!t.lines.length) { b.innerHTML = '<div class="empty d">Your order’s empty. Hit Blade Finder or Fast Reorder and load it up.</div>'; $("#cartfoot").hidden = true; return; }
    $("#cartfoot").hidden = false;
    var bs = breakState(t), nb = bs.nb, pb = bs.pb;
    var hasCat = {}; t.lines.forEach(function (l) { l.f.cats.forEach(function (c) { hasCat[c] = 1; }); });
    var cq = nb && bs.need <= 6 ? "You’re " + bs.need + " away" + bs.of + " from the " + nb + "-piece price." : !hasCat.core ? "No core bits on here? It’s the same freight bill either way." : !hasCat.small && !hasCat.cup ? "Running grinders? Small blades and cup wheels ship on this same order." : "Good order. Ask for your price break before you send it.";
    var nudge = '<div class="nudge">' + says(cq) + (nb ? '<div class="nbar"><i style="width:' + Math.min(100, bs.n / nb * 100) + '%"></i></div><span>' + (pb ? "You’ve hit the " + pb + "-piece price. " : "") + bs.need + " more" + esc(bs.of) + " to the " + nb + "-piece price break.</span>" : "<span>You’ve hit our biggest listed break. Your rep takes it from here.</span>") + '<small class="mixnote">' + esc(mixLine()) + "</small></div>";
    b.innerHTML = nudge + t.lines.map(function (l, i) {
      return '<div class="line" data-i="' + i + '"><div><h4>' + esc(l.f.n) + '</h4><div class="meta">' + esc(vlabel(l.v)) + "<br>" + esc(l.v[0]) + " · <b>" + money(l.each) + " each</b>" + (l.each < l.v[3] ? " <s>" + money(l.v[3]) + "</s>" : "") + '</div></div><div class="lp">' + money(l.each * l.c.q) + "</div><div>" + qtyHTML(l.c.q) + '</div><button class="rm" data-rm>Remove</button></div>';
    }).join("") + '<div class="callout"><b>The more you buy, the better the price.</b><span>' + (t.save > 0.005 ? "Quantity pricing is already saving you " + money(t.save) + " on this order. " : "") + 'Have an account price, or want a package deal? Ask.</span><button class="btn gold sm" data-breaks>Negotiate with ' + esc(FRANK) + "</button></div>";
    $("#carttot").innerHTML = "<span>Order total</span><span>" + money(t.total) + "</span>";
    $("#cartnote").textContent = "Priced by quantity. Freight and tax are added by your rep. Nothing is charged on this site.";
  }

  /* ---------- before you send it ---------- */
  function openExtras() {
    var t = totals(), have = {};
    t.lines.forEach(function (l) { l.f.cats.forEach(function (c) { have[c] = 1; }); });
    var miss = DONTFORGET.filter(function (d) { return !have[d.cat]; });
    extras = { free: "", stock: false, breaks: [] };
    $("#extrasbody").innerHTML =
      promoBar() +
      '<div class="xcard gift"><b>With every order: 1 item at our cost.</b><span>Our way of saying thanks for the business. Pick the one you want at our cost and your rep sends back the number.</span><select id="xfree" aria-label="Item at cost"><option value="">Let my rep pick the best one</option>' + t.lines.map(function (l, i) { return '<option value="' + i + '">' + esc(l.f.n + " " + vlabel(l.v)) + "</option>"; }).join("") + "</select></div>" +
      '<div class="xcard"><b>Stock up and save.</b><span>We keep deep inventory on Dragon, Superblade Extreme, Super G, T-Rex and Viper. Want our stock-up pricing on those?</span><label class="xcheck"><input type="checkbox" id="xstock"> Yes, have my rep quote stock-up pricing</label></div>' +
      '<div class="xcard"><b>Buying in quantity?</b><span>Tap the price breaks you want quoted.</span><div class="xchips" id="xbreaks">' + BREAKS.map(function (q) { return '<button type="button" data-xbreak="' + q + '" aria-pressed="false">' + q + "</button>"; }).join("") + "</div></div>" +
      (miss.length ? '<div class="xcard"><b>Don’t forget your…</b><span>One order, one freight bill. Tap to add.</span><div class="xchips">' + miss.map(function (d) { return '<button type="button" data-xcat="' + d.cat + '">' + esc(d.n) + "</button>"; }).join("") + "</div></div>" : "");
    $("#cart").close(); $("#extras").showModal();
  }

  /* ---------- send ---------- */
  var mode = "order";
  var MODES = {
    account: { title: "Open a free account", intro: "An account makes reordering faster and gets you pricing set for your company. Tell us who you are and your rep sets it up and calls you. This is a request, not a login.", head: "DBW WISCO NEW ACCOUNT REQUEST", subj: "New account request" },
    stone: { title: "Stone shop: Helix tools", intro: "Tell us what you fabricate and what you need. We quote Helix Professional Tools and get back to you.", head: "DBW WISCO HELIX / STONE SHOP REQUEST", subj: "Helix request", msg: "What do you need?" },
    terms: { title: "Apply for Net 30 terms", intro: "Tell us who you are. Add two or three trade references and the credit limit you’re after. We’ll get it in front of the right person and call you.", head: "DBW WISCO TERMS APPLICATION", subj: "Net 30 terms application" },
    order: { title: "Send my order", intro: "Fill this in once. This phone remembers it, so next time it’s two taps.", head: "DBW WISCO ORDER", subj: "Order" },
    pricing: { title: "Get my price breaks", intro: "Tell us which pricing to check. Your rep comes back with your real numbers.", head: "DBW WISCO PRICING REQUEST", subj: "Pricing request" },
    saw: { title: "Send my saw package", intro: "Your rep confirms the package, freight and ship date, then it’s yours.", head: "DBW WISCO SAW PACKAGE", subj: "Saw package request" },
    equip: { title: "Find me equipment", intro: "Give us as much as you can: make, model, size, new or used, how soon.", head: "DBW WISCO EQUIPMENT REQUEST", subj: "Equipment request", msg: "What are you looking for? Make, model, anything you know" },
    feedback: { title: "How’d we do?", intro: "Tell us what worked and what didn’t. " + FRANK + " reads every one.", head: "DBW WISCO FEEDBACK", subj: "Feedback", msg: "Tell us how we did" },
    review: { title: "Leave a review", intro: "An honest review, good or bad, earns you " + RW.review + ". Your rep applies it.", head: "DBW WISCO REVIEW", subj: "Review" },
    refer: { title: "Refer a contractor", intro: "Send a contractor our way. When they place their first order and name you, you get " + RW.review.replace("your", "your") + ".", head: "DBW WISCO REFERRAL", subj: "Referral" }
  };
  function me() { return store.get("me", {}); }
  function repBySlug(s) { if (!s) return undefined; return (W.reps || []).filter(function (r) { return slug(r.name) === s || (r.aka || []).indexOf(s) >= 0; })[0]; }
  function initials(n) { return n.split(/\s+/).map(function (x) { return x[0]; }).join("").slice(0, 2).toUpperCase(); }
  function renderReps(cur) {
    var lockR = store.get("replock", 0) === 1 && repBySlug(cur);
    if (lockR) { $("#reps").innerHTML = '<div class="replock"><span class="av">' + (lockR.photo ? '<img alt="" src="brand/reps/' + esc(lockR.photo) + '">' : esc(initials(lockR.name))) + "</span><div><b>" + esc(lockR.name) + '</b><small>Your salesman. This goes straight to them.</small></div><button type="button" class="link" data-repchange>Not your rep?</button></div>'; $("#f-rep").value = slug(lockR.name); $("#replabel").textContent = "Your salesman"; return; }
    $("#reps").innerHTML = '<button type="button" class="rep' + (!cur ? " on" : "") + '" data-rep=""><span class="av q">?</span><b>Not sure</b></button>' + (W.reps || []).map(function (r) {
      var s = slug(r.name);
      return '<button type="button" class="rep' + (cur === s ? " on" : "") + '" data-rep="' + s + '"><span class="av">' + (r.photo ? '<img alt="" src="brand/reps/' + esc(r.photo) + '">' : esc(initials(r.name))) + "</span><b>" + esc(r.name) + "</b></button>";
    }).join("");
    $("#f-rep").value = cur || "";
  }
  function setIntent(v) {
    $("#f-intent").value = v; $$("#intentseg [data-intent]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.intent === v); });
    $("#intentnote").textContent = v === "buy" ? "You’re buying at the order total. Your rep confirms it, adds freight and tax, and it ships." : "Nothing is billed. We send back your account price, then you say go. Freight is on the invoice unless your rep agrees otherwise.";
    preview();
  }
  function setAcct(v) {
    var f = $("#sendform"), order = mode === "order" || mode === "saw";
    $("#f-acct").value = v;
    $$("#acctseg [data-acct]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.acct === v); });
    $("#newwrap").hidden = !(order && v === "new");
    $("#replabel").textContent = v === "new" ? "Know who you want to work with? (optional)" : "Pick your salesman";
    $("#creditsum").textContent = v === "new" ? "Want terms? Add trade references to set up credit" : "Need a higher credit limit? Add trade references";
    $("#creditnote").textContent = v === "new" ? "Three trade references get a Net 30 or Net 45 account moving. Skip this if you’re paying by card or check." : "Tell us the limit you need and give us current references. Your rep takes it to credit.";
    if (v === "new" && /terms/i.test(f.elements.pay.value)) $("#creditwrap").open = true;
    preview();
  }
  function openSend(m) {
    mode = m; ordRef = newRef(); var M = MODES[m], info = me(), f = $("#sendform"), order = m === "order" || m === "saw", terms = m === "terms";
    $("#sendtitle").textContent = M.title; $("#sendintro").textContent = M.intro;
    $("#discwrap").hidden = m !== "pricing";
    $("#msgwrap").hidden = !M.msg; if (M.msg) $("#msglabel").textContent = M.msg;
    $("#intentseg").hidden = $("#intentnote").hidden = m !== "order"; setIntent("quote");
    $("#acctseg").hidden = !(order || terms); $("#orderwrap").hidden = !(order || terms || m === "pricing");
    $("#paywrap").hidden = $("#paynote").hidden = !order; $("#creditwrap").hidden = !(order || terms);
    $("#reviewwrap").hidden = m !== "review"; $("#referwrap").hidden = m !== "refer";
    ["name", "company", "phone", "email", "addr", "city", "state", "zip"].forEach(function (k) { f.elements[k].value = info[k] || ""; });
    ["po", "notes", "msg", "review", "stars", "fname", "fco", "limit", "r1", "r1p", "r2", "r2p", "r3", "r3p"].forEach(function (k) { f.elements[k].value = ""; });
    f.elements.fav.value = info.fav || ""; f.elements.ref.value = store.get("ref", "") || "";
    $("#refhint").textContent = "They earn " + RW.referrer + " when you order.";
    $$("#starpick button").forEach(function (x) { x.classList.remove("on"); });
    $("#creditwrap").open = terms;
    f.elements.pay.innerHTML = (W.payments || []).map(function (p) { return "<option>" + esc(p) + "</option>"; }).join("");
    if (info.pay) f.elements.pay.value = info.pay;
    renderReps(repBySlug(info.rep) ? info.rep : "");
    $("#discs").innerHTML = (W.discounts || []).map(function (d, i) { return '<label><input type="checkbox" name="disc" value="' + esc(d) + '"' + (i < 2 ? " checked" : "") + "> " + esc(d) + "</label>"; }).join("");
    $("#textbtn").hidden = !W.textNumber; $("#textbtn").textContent = "Text it to " + route2(repBySlug(info.rep) ? info.rep : "").who; $("#sentmsg").hidden = true;
    $("#sharebtn").hidden = !(m === "order"); $("#friendbtn").hidden = m !== "refer";
    setAcct(m === "account" ? "new" : info.acct === "new" && !info.sent ? "new" : (info.sent ? "existing" : (info.acct || "existing")));
    if (m === "account") { $("#newwrap").hidden = false; $("#orderwrap").hidden = false; }
    payNote();
    ["cart", "detail", "extras"].forEach(function (id) { if ($("#" + id).open) $("#" + id).close(); }); $("#send").showModal(); $("#sendform").scrollTop = 0;
  }
  function newRef() { var d = new Date(), a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = ""; for (var i = 0; i < 4; i++) r += a[Math.floor(Math.random() * a.length)]; return "W" + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + "-" + r; }
  function remind() {
    var d = new Date(Date.now() + 30 * 864e5), p = function (n) { return ("0" + n).slice(-2); }, day = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    var last = lastOrder(), items = last && last.items ? last.items.map(function (c) { var v = FAM[c.f] && findVar(FAM[c.f], c.v); return v ? encodeURIComponent(v[0]) + "*" + c.q : ""; }).filter(Boolean) : [];
    var link = location.origin + location.pathname + (items.length ? "?cart=" + items.join(",") : "") + (me().rep ? (items.length ? "&" : "?") + "rep=" + me().rep : "");
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DBW WISCO//Reorder//EN", "BEGIN:VEVENT", "UID:" + Date.now() + "@dbwwisco", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""), "DTSTART:" + day + "T090000", "DTEND:" + day + "T091500", "SUMMARY:Reorder blades from DBW WISCO", "DESCRIPTION:Running low? Your last order is one tap away: " + link.replace(/,/g, "\\,") + "\\nOr text " + FRANK + ": " + (W.textDisplay || W.phone || ""), "URL:" + link, "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Reorder blades from DBW WISCO", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a"); a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics); a.download = "reorder-dbw-wisco.ics"; document.body.appendChild(a); a.click(); a.remove();
    toast("Reminder made for " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ". Add it to your calendar.");
  }
  function formData() { var f = $("#sendform"), o = {}; ["name", "company", "phone", "email", "po", "notes", "rep", "pay", "fav", "feedback", "msg", "acct", "addr", "city", "state", "zip", "ref", "limit", "r1", "r1p", "r2", "r2p", "r3", "r3p", "stars", "review", "fname", "fco", "intent"].forEach(function (k) { o[k] = (f.elements[k].value || "").trim(); }); o.pub = f.elements.pub.checked; o.disc = $$('input[name="disc"]:checked', f).map(function (x) { return x.value; }); return o; }
  function buildText(o) {
    var t = totals(), rep = repBySlug(o.rep), L = [], M = MODES[mode], items = mode === "order" || mode === "pricing";
    L.push((mode === "order" ? (o.intent === "buy" ? "DBW WISCO ORDER: BUY AT SITE PRICE" : "DBW WISCO QUOTE REQUEST: send my account price first") : M.head) + (ordRef ? "  ·  Ref " + ordRef : ""));
    L.push("From: " + (o.name || "(name)") + (o.company ? ", " + o.company : ""));
    if (o.phone) L.push("Phone: " + o.phone);
    if (o.email) L.push("Email: " + o.email);
    var order = mode === "order" || mode === "saw", terms = mode === "terms";
    if (mode === "account") { L.push("Wants a new account set up."); if (o.addr || o.city || o.zip) L.push("Ship to: " + [o.addr, [o.city, o.state].filter(Boolean).join(", "), o.zip].filter(Boolean).join(" · ")); L.push("Salesman: " + (rep ? rep.name : "None yet. Assign a rep.")); }
    if (order || terms) L.push("Account: " + (o.acct === "new" ? "NEW ACCOUNT" : "Existing customer"));
    if ((order || terms) && o.acct === "new" && (o.addr || o.city || o.zip)) L.push("Ship to: " + [o.addr, [o.city, o.state].filter(Boolean).join(", "), o.zip].filter(Boolean).join(" · "));
    if (order || terms || mode === "pricing") L.push("Salesman: " + (rep ? rep.name : (o.acct === "new" ? "None yet. Assign a rep." : "Not sure. Look this account up in Sage / Zoho by phone or company.")));
    if (order) { L.push("Pay by: " + o.pay); if (o.po) L.push("PO #: " + o.po); }
    if (mode === "order" && PROMO_ON && isCard(o.pay)) L.push("PROMO: FREE BLADE for paying this order by card. Rep confirms which blade.");
    if ((order || mode === "pricing") && o.ref) L.push("REFERRED BY: " + o.ref + "  (they earn " + RW.referrer + ")");
    var refs = [[o.r1, o.r1p], [o.r2, o.r2p], [o.r3, o.r3p]].filter(function (x) { return x[0] || x[1]; });
    if ((order || terms) && (refs.length || o.limit || terms)) {
      L.push(""); L.push(o.acct === "new" ? "CREDIT REQUEST: set up terms" + (o.limit ? ", limit " + o.limit : "") : "CREDIT REQUEST: raise limit" + (o.limit ? " to " + o.limit : ""));
      refs.forEach(function (x, i) { L.push("  Ref " + (i + 1) + ": " + [x[0], x[1]].filter(Boolean).join(" · ")); });
    }
    if (mode === "review") { L.push(""); L.push("RATING: " + (o.stars ? "★★★★★".slice(0, +o.stars) + "☆☆☆☆☆".slice(0, 5 - o.stars) + " (" + o.stars + " of 5)" : "(not rated)")); if (o.review) L.push(o.review); L.push("OK to post on the site: " + (o.pub ? "YES" : "NO")); L.push("Reward owed: " + RW.review); }
    if (mode === "refer") { L.push(""); L.push("REFERRING: " + [o.fname, o.fco].filter(Boolean).join(" · ")); L.push("Reward when they order: " + RW.referrer + " for the referrer"); }
    if (mode === "pricing" && o.disc.length) { L.push(""); L.push("Please check: " + o.disc.join("; ")); }
    if (M.msg && o.msg) { L.push(""); L.push(o.msg); }
    if (mode === "saw") { L.push(""); L.push(dealText()); }
    if (items) {
      L.push(""); L.push(t.lines.length ? "ITEMS" : "(no items in cart yet)");
      t.lines.forEach(function (l) { L.push(l.c.q + " x " + l.v[0] + "  " + l.f.n + " " + vlabel(l.v) + "  @ " + money(l.each) + " = " + money(l.each * l.c.q)); });
      if (t.lines.length) { L.push(""); L.push("Site total: " + money(t.total) + "  (quantity pricing, before freight and tax)" + (mode === "order" && o.intent === "buy" ? "  CUSTOMER IS BUYING AT THIS PRICE" : "  customer wants their account price or a better deal")); }
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
    L.push(""); L.push("Sent from the DBW WISCO site" + (C.priceList ? " · " + C.priceList + " pricing" : ""));
    return L.join("\n");
  }
  function preview() { $("#preview").textContent = buildText(formData()); }
  function afterSend(how) {
    var o = formData(), t = totals();
    store.set("me", { name: o.name, company: o.company, phone: o.phone, email: o.email, rep: o.rep, pay: o.pay, fav: o.fav, acct: o.acct, addr: o.addr, city: o.city, state: o.state, zip: o.zip, sent: mode === "order" || me().sent ? 1 : 0 });
    if (mode === "order" && t.lines.length) store.set("last", { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), items: cart.slice() });
    var m = $("#sentmsg"); m.hidden = false; var refLine = ordRef && (mode === "order" || mode === "saw" || mode === "pricing") ? " Your reference: <b class=\"sel\">" + ordRef + "</b>." : "";
    m.innerHTML = how === "posted" ? "<b>Sent.</b><span>A real person has it. Expect a call or text back." + refLine + "</span>"
      : how === "copied" ? "<b>Copied.</b><span>Paste it into a text or email to " + esc(FRANK) + "." + refLine + "</span>"
        : "<b>Last step: hit send in your " + (how === "sms" ? "messages" : "email") + " app.</b><span>It’s already written for you. If nothing opened, tap Copy and paste it to " + esc(how === "sms" ? (W.textDisplay || "") : (W.orderEmail || "")) + "." + refLine + "</span>";
    if (mode === "order" || mode === "saw") m.innerHTML += '<div class="aftersend"><span>Want ' + esc(RW.review) + '?</span><button type="button" class="btn blue sm" data-review>Leave a review</button><button type="button" class="btn ghost-d sm" data-refer>Refer a contractor</button></div>';
    if (mode === "order" && t.lines.length) m.innerHTML += '<div class="aftersend"><span>Don’t run out mid-job.</span><button type="button" class="btn ghost-d sm" data-remind>Remind me to reorder in 30 days</button></div>';
    m.scrollIntoView({ block: "nearest" });
  }
  function friendLink() { var o = formData(), who = (o.company || o.name || "").slice(0, 60); return location.origin + location.pathname + "?ref=" + encodeURIComponent(who); }
  function needName() {
    var f = $("#sendform"), M = MODES[mode];
    if (M.msg && !f.elements.msg.value.trim()) { f.elements.msg.focus(); toast("Tell us a little so we know what to chase"); return true; }
    if (!f.elements.name.value.trim()) { f.elements.name.focus(); toast("Add your name so we know who it’s from"); return true; }
    if (mode === "review" && !f.elements.stars.value) { toast("Tap a star rating first"); return true; }
    if (mode === "review" && !f.elements.review.value.trim()) { f.elements.review.focus(); toast("Tell us a little about how it went"); return true; }
    if (mode === "refer" && !f.elements.fname.value.trim()) { f.elements.fname.focus(); toast("Who are you referring?"); return true; }
    if ((mode === "order" || mode === "saw" || mode === "terms" || mode === "account") && !f.elements.phone.value.trim()) { f.elements.phone.focus(); toast("Add a phone number so we can confirm the order"); return true; }
    if ((mode === "order" || mode === "saw") && f.elements.acct.value === "new" && !f.elements.zip.value.trim()) { f.elements.zip.focus(); toast("Add your ship-to ZIP so we can quote freight"); return true; }
    return false;
  }
  /* Who gets it. A rep with an email in config.js gets the order; Frank and the rep's manager are copied. No rep email = it goes to Frank. */
  function route2(slugv) {
    var r = repBySlug(slugv) || {}, main = W.orderEmail || "", uniq = function (a) { var seen = {}; return a.filter(function (x) { x = (x || "").toLowerCase(); if (!x || seen[x]) return false; seen[x] = 1; return true; }); };
    var to = r.email || main, cc = uniq([main, r.manager].concat(W.alsoCopy || [])).filter(function (x) { return x.toLowerCase() !== to.toLowerCase(); });
    return { to: to, cc: cc, cell: r.cell || W.textNumber || "", who: r.email || r.cell ? r.name : FRANK };
  }
  function mailto(to, subj, body, cc) { location.href = "mailto:" + encodeURIComponent(to || "") + "?" + (cc && cc.length ? "cc=" + encodeURIComponent(cc.join(",")) + "&" : "") + "subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); }
  function sms(body, cell) { location.href = "sms:" + (cell || W.textNumber) + "?&body=" + encodeURIComponent(body); }
  function sendEmail() {
    if (needName()) return;
    var o = formData(), rep = repBySlug(o.rep), body = buildText(o);
    var subj = (mode === "order" && o.intent !== "buy" ? "Quote request" : MODES[mode].subj) + " from " + (o.company || o.name) + (rep ? " (salesman: " + rep.name + ")" : "") + (o.po ? " PO " + o.po : "") + (ordRef ? " [" + ordRef + "]" : "");
    var viaMail = function () { try { navigator.clipboard.writeText(body).catch(function () {}); } catch (e) {} var rt = route2(o.rep); mailto(rt.to, subj, body, rt.cc); afterSend("email"); };
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
    var fly = (W.flyers || {})[f.id];
    if (fly) h += '<div class="center"><a class="btn gold" href="' + esc(fly) + '" target="_blank" rel="noopener">View the product flyer (PDF)</a></div>';
    if (TIERQUIP[f.tier]) h += says(TIERQUIP[f.tier]);
    h += '<div class="blk"><h4>Pick your size</h4><div class="sizes">' + f.vars.map(function (v) {
      return '<div class="sz' + (inSaw(v, wiz.saw) ? "" : " dim") + '" data-v="' + esc(vkey(v)) + '"><div><b>' + esc(vlabel(v)) + "</b><small>" + esc(v[0]) + (depthFor(f, v) ? " · cuts about " + depthFor(f, v) + " deep" : "") + '</small></div><div class="r"><span class="p">' + rangeTxt(v) + "</span>" + qtyHTML(1) + '<button class="add" data-add>Add</button></div></div>';
    }).join("") + "</div></div>";
    var tv = defVar(f, f.vars);
    if (tiered(tv)) h += '<div class="blk"><h4>The more you buy, the better the price</h4><div class="tiers">' + ["1 to 11", "12+", "24+", "36+", "50+", "100+"].map(function (lab, i) { return "<div><span>" + lab + "</span><b>" + money(i ? tv[6][i - 1] : tv[3]) + "</b></div>"; }).join("") + '</div><p class="note">Each, for the ' + esc(vlabel(tv)) + ". " + esc(mixLine()) + " Your account may do better.</p></div>";
    h += '<div class="callout"><b>Want a better number?</b><span>Bigger order, a saw to go with it, or an account price you already have. Ask.</span><button class="btn gold sm" data-pricing>Negotiate with ' + esc(FRANK) + "</button></div>";
    if (mats.length) h += '<div class="blk"><h4>How it rates</h4><div class="rates">' + mats.map(function (k) { return '<div class="' + (cur.indexOf(k) >= 0 ? "on" : "") + '"><span>' + esc(MATNAME[k]) + "</span><span>" + stars(f.m[k]) + " " + f.m[k].toFixed(1) + "</span></div>"; }).join("") + "</div></div>";
    if (vurl) {h += '<div class="blk"><h4>Watch it cut</h4>' + (vurl
      ? '<a class="video" href="' + esc(vurl) + '" target="_blank" rel="noopener"><span class="play"></span><span><b>See the ' + esc(f.n) + " in action</b><span>Opens the video in a new tab</span></span></a>"
      : '<div class="video soon"><span class="play"></span><span><b>Video coming soon</b><span>Want to see it cut first? Ask ' + esc(FRANK) + " for a demo.</span></span></div>") + "</div>"; }
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
    if ((el = t.closest("[data-rtrep]"))) { var inf = me(); inf.rep = el.dataset.rtrep; store.set("me", inf); repTools(); return; }
    if (t.closest("[data-rtcopy]")) { var lk = $("#rtlink").textContent; if (/^http|^file/.test(lk)) copyText(lk, function () { toast("Link copied. Text it to a customer."); }); else toast("Pick your name first"); return; }
    if ((el = t.closest("[data-starter]"))) { var st = byK(STARTERS, el.dataset.starter); starterLines(st).forEach(function (l) { addToCart(l.f.id, vkey(l.v), l.q); }); renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-photo]")) { var pr = route2(me().rep); sms("Hey " + pr.who + ", here’s a picture of my blade. I need more of these. Name / company: ", pr.cell); return; }
    if ((el = t.closest("[data-mat]"))) { wiz.mat = byK(MATS, el.dataset.mat); wizard(); window.scrollTo(0, 0); bfShow(wiz.saw ? "results" : "saw"); return; }
    if ((el = t.closest("[data-hp]"))) { wiz.hp = el.dataset.hp; wizard(); window.scrollTo(0, 0); bfShow(wiz.mode === "ask" ? "want" : "results"); return; }
    if (t.closest("[data-hpgo]")) { var hv = parseFloat($("#hpin").value); if (!(hv > 0)) { $("#hpin").focus(); toast("Type the horsepower, or tap one of the choices"); return; } wiz.hp = hv <= LOWHP ? "low" : "high"; wiz.hpn = hv; wizard(); window.scrollTo(0, 0); return; }
    if (t.closest("[data-wetspec]")) { openSend("pricing"); $("#f-notes").value = "Wet blade spec. Cutting: " + (wiz.mat ? wiz.mat.n : "") + ". Saw: walk-behind" + (wiz.hpn ? ", " + wiz.hpn + " HP" : wiz.hp ? ", " + byK(HPS, wiz.hp).n.toLowerCase() : "") + ". Blade size: \nCity / state where I cut: "; preview(); return; }
    if ((el = t.closest("[data-saw]"))) { wiz.hp = null; wiz.hpn = null; wiz.saw = byK(SAWS, el.dataset.saw); wizard(); window.scrollTo(0, 0); bfShow(wiz.mode === "ask" ? "want" : "results"); return; }
    if ((el = t.closest("[data-want]"))) { wiz.want = byK(WANTS, el.dataset.want); wizard(); window.scrollTo(0, 0); return; }
    if (t.closest("[data-all]")) { wiz.all = true; wizard(); return; }
    if (t.closest("[data-keep]")) { wiz.keep = true; return; }
    if (t.closest("[data-back]")) {
      var h = location.hash;
      if (h === "#finder" || h === "#ask-frank") { if (wiz.want) wiz.want = null; else if (wiz.hp) { wiz.hp = null; wiz.hpn = null; } else if (wiz.saw) { wiz.saw = null; wiz.all = false; } else if (wiz.mat) wiz.mat = null; else return go("#home"); wizard(); return; }
      if (h === "#fix" && fixSel) { fixSel = ""; fixScreen(); return; }
      return go("#home");
    }
    if ((el = t.closest("[data-fix]"))) { fixSel = el.dataset.fix; fixScreen(); window.scrollTo(0, 0); return; }
    if ((el = t.closest("[data-cat]"))) { shop.cat = el.dataset.cat; shop.n = SHOPPAGE; shopScreen(); return; }
    if ((el = t.closest("[data-crew]"))) { wiz.mat = byK(MATS, el.dataset.crew); wiz.saw = null; wiz.keep = true; go("#finder"); return; }
    if (t.closest("[data-photomail]")) { var pm = route2(me().rep); location.href = "mailto:" + encodeURIComponent(pm.to) + "?" + (pm.cc.length ? "cc=" + encodeURIComponent(pm.cc.join(",")) + "&" : "") + "subject=" + encodeURIComponent("Blade photo for a reorder") + "&body=" + encodeURIComponent("Attach the picture of your blade label to this email.\n\nName / company: \nPhone: \nHow many do you need: "); return; }
    if (t.closest("[data-account]")) { openSend("account"); return; }
    if ((el = t.closest("[data-stonepick]"))) { var on3 = el.getAttribute("aria-pressed") !== "true"; el.setAttribute("aria-pressed", on3); var ix3 = stSel.indexOf(el.dataset.stonepick); if (on3 && ix3 < 0) stSel.push(el.dataset.stonepick); if (!on3 && ix3 >= 0) stSel.splice(ix3, 1); return; }
    if (t.closest("[data-stone]")) { openSend("stone"); if (stSel.length) { $("#f-msg").value = "Helix products I need: " + stSel.join(", ") + ".\nMaterial (granite, marble, quartzite, engineered stone, porcelain, glass): \nMachine or tool: "; preview(); } return; }
    if ((el = t.closest("[data-qadd]"))) { var qr = el.closest(".qrow"), qf = FAM[qr.dataset.f], qs = $("[data-qsize]", qr), qk = qs ? qs.value : vkey(defVar(qf, qf.vars)), qn = parseInt(el.dataset.qadd, 10), qv = findVar(qf, qk); addToCart(qf.id, qk, qn); flash(el, "✓"); toast(qn + " x " + qf.n + " added at " + money(eachAt(qv, qn)) + " each"); return; }
    if ((el = t.closest("[data-eqpick]"))) { var on = el.getAttribute("aria-pressed") !== "true"; el.setAttribute("aria-pressed", on); var ix2 = eqSel.indexOf(el.dataset.eqpick); if (on && ix2 < 0) eqSel.push(el.dataset.eqpick); if (!on && ix2 >= 0) eqSel.splice(ix2, 1); $$("[data-eqpick]").forEach(function (b) { b.setAttribute("aria-pressed", eqSel.indexOf(b.dataset.eqpick) >= 0); }); return; }
    if ((el = t.closest("[data-intent]"))) { setIntent(el.dataset.intent); return; }
    if (t.closest("[data-repchange]")) { store.set("replock", 0); renderReps($("#f-rep").value); return; }
    if ((el = t.closest("[data-tag]"))) { shop.tag = shop.tag === el.dataset.tag ? "" : el.dataset.tag; shop.n = SHOPPAGE; shopScreen(); return; }
    if ((el = t.closest("[data-agg]"))) { earlyPick(el.dataset.agg); return; }
    if (t.closest("[data-aggask]")) { var al = ($("#aggloc") ? $("#aggloc").value : "").trim(); if (!al) { $("#aggloc").focus(); toast("Type your city and state first"); return; } openSend("pricing"); $("#f-notes").value = "Blade recommendation for my aggregate. I cut in: " + al + "\nWhat I cut (concrete, asphalt, green): \nSaw and blade size: "; preview(); return; }
    if (t.closest("[data-eeask]")) { openSend("pricing"); $("#f-notes").value = "Early-entry blade color check. I cut in (city, state): " + ($("#eeloc") ? $("#eeloc").value : "") + "\nSaw (Soff-Cut or Gorilla, model): \nBlade size: "; preview(); return; }
    if (t.closest("[data-shopmore]")) { shop.n += SHOPPAGE; shopScreen(); return; }
    if (t.closest("[data-remind]")) { remind(); return; }
    if ((el = t.closest("[data-hint]"))) { $("#rq").value = el.dataset.hint; runSearch(el.dataset.hint); return; }
    if ((el = t.closest("[data-q]"))) { var inp = $("input", el.parentNode); inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) + parseInt(el.dataset.q, 10)); inp.dispatchEvent(new Event("change", { bubbles: true })); return; }
    if ((el = t.closest("[data-dealadd]"))) {
      var q = Math.max(1, parseInt($(".dealadd .qty input").value, 10) || 1), fid2 = $("#dfam").value, key2 = $("#dvar").value;
      var ex = deal.lines.filter(function (l) { return l.f === fid2 && l.v === key2; })[0];
      if (ex) ex.q += q; else deal.lines.push({ f: fid2, v: key2, q: q });
      store.set("deal2", deal); sawDeal(); return;
    }
    if ((el = t.closest("[data-dstep]"))) { var cl = dealLine(dealCur()); dealSetQty((cl ? cl.q : 0) + parseInt(el.dataset.dstep, 10)); return; }
    if ((el = t.closest("[data-pkg]"))) { deal.saw = el.dataset.pkg; store.set("deal2", deal); go("#saw-deal"); return; }
    if (t.closest("[data-ccex]")) { [["ca-p", 110], ["ca-f", 1500], ["cb-f", 5000], ["c-ft", 10000]].forEach(function (x) { $("#" + x[0]).value = x[1]; }); costCalc(); toast("Example numbers. Put in your own."); return; }
    if ((el = t.closest("[data-dealrm]"))) { deal.lines.splice(parseInt(el.closest(".dl").dataset.i, 10), 1); store.set("deal2", deal); sawDeal(); return; }
    if (t.closest("[data-dealclear]")) { deal = { saw: "TS420", lines: [] }; store.set("deal2", deal); sawDeal(); return; }
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
    if (t.closest("[data-equip]")) { openSend("equip"); if (eqSel.length) { $("#f-msg").value = "Looking for: " + eqSel.join(", ") + ".\nMake / model / size / how soon: "; preview(); } return; }
    if (t.closest("[data-terms]")) { e.preventDefault(); openSend("terms"); return; }
    if (t.closest("[data-review]")) { openSend("review"); return; }
    if (t.closest("[data-refer]")) { openSend("refer"); return; }
    if ((el = t.closest("[data-acct]"))) { setAcct(el.dataset.acct); return; }
    if ((el = t.closest("[data-star]"))) { var sv = +el.dataset.star; $("#f-stars").value = sv; $$("#starpick button").forEach(function (x) { x.classList.toggle("on", +x.dataset.star <= sv); }); preview(); return; }
    if (t.closest("[data-friend]")) { if (!$("#f-name").value.trim()) { $("#f-name").focus(); toast("Add your name so they know who sent them"); return; } location.href = "sms:?&body=" + encodeURIComponent("I get my diamond blades from DBW WISCO. Prices are on the site and a real person handles the order. Tell them I sent you: " + friendLink()); return; }
    if (t.closest("[data-feedback]")) { openSend("feedback"); return; }
    if (t.closest("[data-cart]")) { ["detail", "extras", "send"].forEach(function (id) { if ($("#" + id).open) $("#" + id).close(); }); renderCart(); $("#cart").showModal(); return; }
    if (t.closest("[data-checkout]")) { openExtras(); return; }
    if (t.closest("[data-tosend]")) { extras.free = $("#xfree").value; extras.stock = $("#xstock").checked; openSend("order"); return; }
    if (t.closest("[data-backcart]")) { $("#extras").close(); renderCart(); $("#cart").showModal(); return; }
    if ((el = t.closest("[data-xbreak]"))) { var qn = parseInt(el.dataset.xbreak, 10), ix = extras.breaks.indexOf(qn); if (ix >= 0) extras.breaks.splice(ix, 1); else extras.breaks.push(qn); extras.breaks.sort(function (a, b) { return a - b; }); el.setAttribute("aria-pressed", ix < 0); return; }
    if ((el = t.closest("[data-xcat]"))) { $("#extras").close(); shop.cat = el.dataset.xcat; shop.q = ""; shop.n = SHOPPAGE; app.innerHTML = ""; go("#shop"); return; }
    if ((el = t.closest("[data-rep]"))) { renderReps(el.dataset.rep); $("#textbtn").textContent = "Text it to " + route2(el.dataset.rep).who; preview(); return; }
    if ((el = t.closest("[data-close]"))) { el.closest("dialog").close(); return; }
    if ((el = t.closest("[data-rm]"))) { cart.splice(parseInt(el.closest(".line").dataset.i, 10), 1); saveCart(); renderCart(); return; }
    if (t.closest("[data-reorder]")) { var last = lastOrder(); if (last) { last.items.forEach(function (c) { if (FAM[c.f] && findVar(FAM[c.f], c.v)) addToCart(c.f, c.v, c.q); }); renderCart(); $("#cart").showModal(); } return; }
    if (t.closest("[data-email]")) { sendEmail(); return; }
    if (t.closest("[data-sms]")) { if (needName()) return; var fo = formData(); sms(buildText(fo), route2(fo.rep).cell); afterSend("sms"); return; }
    if (t.closest("[data-copy]")) { if (needName()) return; copyText(buildText(formData()), function () { afterSend("copied"); }); return; }
    if (t.closest("[data-share]")) { copyText(shareLink(), function () { toast("Reorder link copied. Text it to anyone."); }); return; }
    if ((el = t.closest("[data-fsms]"))) { sms(frankMsg(el.closest("[data-frank]").dataset.frank)); return; }
    if ((el = t.closest("[data-femail]"))) { mailto(W.orderEmail, "Blade question from the Wisco site", frankMsg(el.closest("[data-frank]").dataset.frank)); return; }
    if ((el = t.closest("[data-fcopy]"))) { copyText(frankMsg(el.closest("[data-frank]").dataset.frank), function () { toast("Copied. Paste it in a text to " + FRANK + "."); }); return; }
    if (t.closest("[data-emptycart]")) { cart = []; saveCart(); renderCart(); return; }
    if (t.tagName === "DIALOG") t.close();
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches("[data-qsize]")) { var qr2 = e.target.closest(".qrow"), qv2 = findVar(FAM[qr2.dataset.f], e.target.value); if (qv2) $("[data-qrng]", qr2).textContent = rangeTxt(qv2) + " each"; }
    var t = e.target, card = t.closest(".card"), line = t.closest(".line");
    if (t.matches("[data-size]") && card) { var f = FAM[card.dataset.f], keep = $(".qty input", card).value; $("[data-row]", card).outerHTML = buyRow(findVar(f, t.value)); $(".qty input", card).value = keep; }
    if (line && t.matches(".qty input")) { cart[parseInt(line.dataset.i, 10)].q = Math.max(1, parseInt(t.value, 10) || 1); saveCart(); renderCart(); }
    if (t.id === "dsaw") { deal.saw = t.value; store.set("deal2", deal); dealRefresh(); }
    if (t.id === "dvar") dealSync(), dealRefresh();
    if (t.id === "dfam") { fillDealVars(); dealSync(); dealRefresh(); }
  });
  document.addEventListener("input", function (e) { var id = e.target.id || "";
    if (id === "dqty" || id === "dqn") dealSetQty(e.target.value);
    if (id === "r-day" && $("#r-day-o")) $("#r-day-o").textContent = "$" + e.target.value; if (id === "r-days" && $("#r-days-o")) $("#r-days-o").textContent = e.target.value; if (/^c[ab]-|^c-ft/.test(id)) costCalc(); if (/^r-/.test(id)) rentCalc(); });
  $("#sendform").addEventListener("input", function () {
    preview();
    var f = $("#sendform"), info = me();   // keep what they typed, even if they close the sheet
    ["name", "company", "phone", "email", "addr", "city", "state", "zip", "fav"].forEach(function (k) { info[k] = f.elements[k].value.trim(); });
    info.acct = f.elements.acct.value; store.set("me", info);
  });
  function payNote() { var el = $("#promonote"); if (!el) return; var on = PROMO_ON && mode === "order", card = isCard($("#f-pay").value); el.hidden = !on; el.className = "promonote" + (card ? " won" : ""); el.textContent = card ? "You’re paying by card, so this order gets a free blade. Your rep confirms which one." : (PROMO.title || "Free blade when you pay this order by card") + ". Pick a card option above to get it."; }
  $("#sendform").addEventListener("change", function (e) { payNote(); if (e.target.id === "f-pay" && /terms/i.test(e.target.value) && $("#f-acct").value === "new") $("#creditwrap").open = true; preview(); });
  $("#sendform").addEventListener("submit", function (e) { e.preventDefault(); });
  /* Quick-access strip: arrows show there is more to the side, and move it. */
  (function () {
    var w = $("#toolswrap"), L = $(".tsc.l"), R = $(".tsc.r"); if (!w) return;
    var upd = function () { var max = w.scrollWidth - w.clientWidth; L.hidden = w.scrollLeft < 8; R.hidden = max < 8 || w.scrollLeft > max - 8; };
    w.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); setTimeout(upd, 60); setTimeout(upd, 800);
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-tsc]"); if (b) w.scrollBy({ left: parseInt(b.dataset.tsc, 10) * Math.max(180, w.clientWidth * 0.7), behavior: "smooth" }); });
  })();
  window.addEventListener("hashchange", route);

  /* ---------- boot ---------- */
  $$("[data-text-btn]").forEach(function (a) { a.href = "sms:" + (W.textNumber || ""); });
  $$("[data-call-btn]").forEach(function (a) { a.href = "tel:" + (W.textNumber || ""); });
  $$("[data-mail-btn]").forEach(function (a) { a.href = "mailto:" + (W.orderEmail || ""); });
  $$("[data-oemail-link]").forEach(function (a) { a.textContent = W.orderEmail || ""; a.href = "mailto:" + (W.orderEmail || ""); });
  $$("[data-mgr]").forEach(function (a) { a.textContent = (W.managerName || "Frank") + ", " + (W.managerTitle || ""); });
  $$("[data-text]").forEach(function (a) { a.textContent = W.textDisplay || ""; a.href = "sms:" + (W.textNumber || ""); });
  $$("[data-oemail]").forEach(function (a) { a.textContent = W.orderEmail || ""; });
  $$("[data-pl]").forEach(function (a) { a.textContent = C.priceList || "current"; });
  var P = new URLSearchParams(location.search);
  if (P.get("rep")) { var info = me(), rr = repBySlug(slug(P.get("rep"))); if (rr) { info.rep = slug(rr.name); store.set("me", info); store.set("replock", 1); } }
  if (P.get("ref")) store.set("ref", P.get("ref").replace(/[<>]/g, "").slice(0, 60));
  if (P.get("cart")) {
    cart = [];
    P.get("cart").split(",").forEach(function (x) { var a = x.split("*"), hit = SKU[(a[0] || "").toUpperCase().replace(/[^A-Z0-9.]/g, "")]; if (hit) cart.push({ f: hit[0].id, v: vkey(hit[0].vars[hit[1]]), q: Math.max(1, parseInt(a[1], 10) || 1) }); });
    store.set("cart", cart);
  }
  deal.lines = (Array.isArray(deal.lines) ? deal.lines : []).filter(function (l) { return FAM[l.f] && findVar(FAM[l.f], l.v); });
  route(); badge();
  bfOpen(store.get("bf", 0) === 1);
  if (P.get("cart") && cart.length) { renderCart(); $("#cart").showModal(); }
})();
