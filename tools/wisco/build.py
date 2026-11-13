#!/usr/bin/env python3
"""Build wisco/catalog.js for the DBW Wisco store.

    python3 tools/wisco/build.py "/path/to/FINAL <MONTH> PRICE LIST.xlsx" [--images CACHE_DIR]

Inputs
  * the monthly DBW price list (.xlsx). NEVER commit it: it holds cost.
  * tools/wisco/dbw_site_catalog.json  (crawl of diamondbladewarehouse.com, see crawl_dbw_site.py)
  * tools/wisco/families.py            (copy, grades, material ratings)
Output
  * wisco/catalog.js   customer prices only. Cost is never written.
  * wisco/img/*.webp   (only with --images)
"""
import json, os, re, sys, datetime, hashlib, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import pricelist as PL
import families as FA

norm = PL.norm
ACR = {"ICS", "RGC", "GPM", "HP", "FX4", "MZ3", "THD", "PVC", "RCP", "HEPA", "XP", "II", "CC", "DD", "BU", "FS",
       "HD77", "MAG", "KV7", "PRO", "N", "XL", "LT", "BLK", "U/A", "NO", "PKG", "USA", "CMU", "DBW", "PC", "2PC"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def nice(s):
    """SHOUTING PRICE LIST TEXT -> Readable Text."""
    s = re.sub(r"\s+", " ", s.replace("*", " ")).strip(" -")
    out = []
    for w in s.split(" "):
        core = w.strip('()"/,')
        if core.upper() in ACR or re.search(r"\d", w) or len(core) <= 1:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:].lower())
    s = " ".join(out)
    s = re.sub(r"\bThrd\b|\bThd\b|\bTh\b", "thread", s)
    s = re.sub(r"\s+-\s*|\s*-\s+", " - ", s)
    return re.sub(r"\s+", " ", s).replace("W/ ", "w/ ").replace(" X ", " x ")


def fix_width(tok):
    # price list writes .125 as 125
    return "." + tok if re.fullmatch(r"\d{3}", tok) else tok


SIZE_RE = re.compile(r'^\s*(\d[\d\s./\-]*(?:"|\'\')?(?:\s*[xX]\s*\.?\d[\d./\-]*\s*(?:mm|")?)*)\s*(.*)$')


def split_desc(desc):
    desc = desc.replace("mmmm", "mm").replace('-"', '"').replace("--", "-")
    m = SIZE_RE.match(desc)
    if not m or not m.group(1).strip():
        return "", nice(desc)
    size, rest = m.group(1).strip(), m.group(2)
    parts = [fix_width(p.strip()) for p in re.split(r"\s*[xX]\s*", size) if p.strip()]
    if parts and not parts[0].endswith('"') and re.fullmatch(r"[\d\s./\-]+", parts[0]):
        parts[0] = parts[0].strip(" -") + '"'
    return " x ".join(parts), nice(rest)


def dia_of(s):
    m = re.match(r'\s*(\d+(?:\.\d+)?)(?:[\s\-]+(\d+)/(\d+))?', s or "")
    if not m:
        return None
    d = float(m.group(1))
    if m.group(2):
        d += int(m.group(2)) / int(m.group(3))
    return round(d, 3)


APPMAP = [
    (r"reinforced|hard rock|rebar|river rock", "r"), (r"green concrete", "g"), (r"asphalt", "a"),
    (r"block|brick(?! pavers)|fire brick|masonry", "b"), (r"pavers|hardscape", "p"),
    (r"stone|granite", "s"), (r"porcelain|tile", "t"), (r"mortar|tuck", "m"),
    (r"ductile|iron|metal|steel|guardrail", "x"), (r"concrete pipe|rcp", "pi"), (r"pre-?stress|precast", "pc"),
    (r"(?<!green )(?<!reinforced )concrete|general purpose", "c"),
]
TIERBASE = {"supreme": 4.5, "pro": 4.5, "premium": 4.0, "standard": 3.5, "economy": 3.0}


def auto_mats(apps, tier):
    out = {}
    base = TIERBASE.get(tier, 4.0)
    for a in [x.strip().lower() for x in apps.split(",") if x.strip()]:
        for rx, k in APPMAP:
            if re.search(rx, a):
                out[k] = base
    return out


def site_cats(p, dias):
    url = p["url"].split("/catalog/")[1].split("/")[0]
    sub = (p["info"].get("Blade Subtype") or p["info"].get("Product Subtype") or "").lower()
    name = p["name"].lower()
    if url == "core-bits": return ["core"]
    if url == "diamond-chain": return ["chain"]
    if "vacuum" in sub or "dustless systems" in sub and "blade" not in name: return ["dust"]
    if url in ("equipment", "core-drills", "pumps") or "equipment" in sub: return ["equip"]
    if "cup" in sub: return ["cup"]
    if "tuckpoint" in sub or "crack chaser" in sub: return ["tuck"]
    if "early entry" in sub and "saw" not in sub: return ["green"]
    if "abrasive" in sub: return ["abrasive"]
    if url in ("wet-blades", "hydraulic-hand-saw-wall-saw-blades") or sub.startswith("wet") or "bevel" in sub: return ["wet"]
    cats = []
    if any(d and d <= 10.5 for d in dias): cats.append("small")
    if any(d and d >= 12 for d in dias) or not cats: cats.append("highspeed")
    return cats


def auto_saws(cats, dias, name):
    n = name.lower()
    s = set()
    if "ring" in n: return ["ring"]
    if "wall saw" in n or "hand saw" in n or "prestress" in n: return ["wall"]
    if "core" in cats: return ["core"]
    if "chain" in cats: return ["chain"]
    if "equip" in cats or "dust" in cats: return []
    if "cup" in cats or "tuck" in cats: return ["grinder"]
    if "green" in cats: s.add("early")
    if "wet" in cats: s.add("walk")
    for d in dias:
        if not d: continue
        if "green" in cats or "wet" in cats: break
        if d <= 9: s.add("grinder")
        if 7 <= d <= 7.25: s.add("circ")
        if d == 10 or (d in (14, 20) and ("masonry" in n or "tile" in n)): s.add("table")
        if 12 <= d <= 16: s.add("cutoff")
        if d >= 14 and "highspeed" in cats: s.add("walk")
    return [k for k, _, _ in FA.SAWS if k in s]


# price-list rows the site doesn't carry -> family name (first match wins)
RULES = [
    (r"^ACB\d+HY", "Dry Tile Supreme"), (r"^AFR\d", "Razor Porcelain Blade"), (r"^AC\d+(B7|RT)", "Dry Tile Blade"),
    (r"^(APO|AFP|AFS)\d", "Wet Tile Blade"), (r"^AFJ", "J-Slot Granite Blade"), (r"^APT\d", "Turbo Superblade"),
    (r"^AEP10\.?5HQ|^ARB10\.?5HQ", 'Husqvarna 10.5" Battery Saw Blades'),
    (r"^AEP\d", "Eagle Supreme - Small Diameter"), (r"^AJT\d+B5", "T-Seg Turbo Black"), (r"^AJG", "Granite Turbo"),
    (r"^AJT1[24]S1", "Turbo Economy"), (r"^AJT\d", "Tornado"), (r"^ACKR", "Crack Chaser"), (r"^AT375B7", "Premium Tuck Point"),
    (r"^AT\d{1,2}B7$", "Economy Tuck Point"), (r"^AT\d+S1$", "Sandwich Tuck Point"), (r"^ARC\d", "Blacksmyth Railcut"),
    (r"^ARSC", "Blacksmyth Supreme"), (r"^AGT\d", "Blue Tornado"), (r"^AJ\d", "Jaguar"), (r"^W714", "Wood Blades"),
    (r"EL35CNB", "Cut-n-Break Blade Set"), (r"^(ACC|AGC|TLC|TLA)\d", "Americut Looping"), (r"^A14HYBRID", "Hybrid"),
    (r"^ASKR", "Viper Specialty"), (r"^AES20S2Q5", "Eagle Supreme Masonry"), (r"^AV\d+DY", "Viper General Purpose"),
    (r"^CB[SP]\d", "V-Shape Wet Corebit"), (r"^(EXT|AD)\d", "Core Bit Extensions & Adaptors"),
    (r"^PS\d", "Prestress Blade"), (r"^WS\d", "Split Segment Wall Saw Blade"), (r"^3MLB", "3MLB Low-HP Concrete"),
    (r"^KMLB", "KMLB Low-HP Asphalt & Green"), (r"^GK.*NDAY", "Green Kut Next Day"), (r"^TCGK", "Green Concrete 2-Bond"),
    (r"^SKID", "Skid Plates"), (r"^AW\d+S1", "Wolverine Premium Plus Drop Segment"), (r"^AWP\d", "Wolverine Premium"),
    (r"^AES\d+MPS1", "Superblade Extreme"), (r"^AECC\d", "Eagle Premium"), (r"^AESQZ", "Dragon Supreme"),
    (r"^AESQ\d", "Dragon"), (r"^A\d+TREX", "T-Rex"), (r"^ASBS", "Superblade G3"), (r"^AES\d+SGC", "Super G"),
    (r"^AE\d+S1", "Eagle Heavy Duty"),
]
GK = {"P": "Purple", "R": "Red", "O": "Orange", "Y": "Yellow", "B": "Black", "G": "Green", "W": "White"}
CHAINSEC = [
    ("613 & 680", "ICS 613 / 680 Gas Chain System"), ("633 & 695", "ICS 633 / 695GC Gas Chain System"),
    ("695XL FORCE", "ICS 695F4 Force 4 Gas System"), ("K970", "Husqvarna K970 Chain Saw System"),
    ("STIHL", "Stihl GS 461 Rock Boss System"), ("890F4", "ICS 890F4 Force 4 Hydraulic System"),
    ("814", "ICS 814 PRO Hydraulic Chain"), ("823", "ICS 823 / 853 Hydraulic Chain & Bars"),
    ("MINI", "RGC Mini C50 Hydraulic System"), ("C150", "RGC C150 Hydraulic System"),
    ("C120", "RGC C120 Force 4 Hydraulic System"), ("K6500", "Husqvarna K6500 Prime Chain System"),
    ("HIGH FREQ", "Husqvarna K6500 Prime Chain System"),
]
SAWSEC = [
    ("MAKITA", 'Makita 9" Battery Saw'), ("ELECTRIC", "Husqvarna K4000 Electric Saws"), ("HUSQVARNA", "Husqvarna Power Cutters & Batteries"),
    ("STIHL", "Stihl Cutquik Saws"), ("HILTI", "Hilti Gas Saws"), ("DEWALT", 'DeWalt 9" Battery Saw'),
    ("BR/CC", "Walk-Behind & Early-Entry Saws"), ("SOFF", "Walk-Behind & Early-Entry Saws"),
]
POPULAR = ["Dragon Supreme", "Dragon", "Superblade Extreme", "Super G", "T-Rex", "Viper General Purpose",
           "Superblade G3", "Superblade Arrow", "Zenesis Green Kut Purple", "Punisher", "Wolv", "Sabertooth", "Viper Premium",
           "Blue Tornado", "Blacksmyth", "Swordfish", "Jaguar",
           "Wolverine Premium", "Turbo Cup - Premium", "Blue Cheetah", "V-Shape Wet Corebit", "Green Kut Purple",
           "Hybrid", "Tornado", "Double Row", "Segmented Dry Corebit"]


TOTALS = False
HOOKS = {
    "Dr. Schulze Core Drill Motors, Stands & Packages": "German-built core drill motors, stands and ready-to-run packages.",
    "Grinders & Circular Saws": "Makita and Milwaukee grinders plus the Skil mag saw. The tools your small blades run on.",
    "Hilti Gas Saws": "Hilti gas hand-held saws, 14 and 16 inch.",
    "Husqvarna K4000 Electric Saws": "The K4000 electric wet saw, the vac reducer and the Cut-n-Break.",
    "Husqvarna Power Cutters & Batteries": "K970 power cutters, ring saws, battery saws, chargers and batteries.",
    'Makita 9" Battery Saw': "Makita 9 inch battery saw: full package, bare tool, batteries and charger.",
    "Stihl Cutquik Saws": "The Stihl Cutquik lineup, carts, the battery saw and its batteries.",
    "Walk-Behind & Early-Entry Saws": "Walk-behind flat saws and early-entry saws.",
    "Dustless Technologies Shrouds & Vacs": "Shrouds, vacs and hoses that keep you silica-compliant without water.",
}
# families with no photo of their own borrow one from a related DBW product
BORROW = {
    "Dr. Schulze Core Drill Motors, Stands & Packages": "Dr. Schulze DK 32", "Husqvarna Power Cutters & Batteries": "Husqvarna K 970",
    "Husqvarna K4000 Electric Saws": "Husqvarna K 770", "Walk-Behind & Early-Entry Saws": "Husqvarna FS400",
    "3MLB Low-HP Concrete": "Americut Pro Series", "KMLB Low-HP Asphalt & Green": "Americut Pro Series",
    "Cut-n-Break Blade Set": "Husqvarna K 760 Cut-n-Break", 'Husqvarna 10.5" Battery Saw Blades': "Eagle Supreme Masonry",
    "Dry Tile Blade": "Alpha PT Cutter", "Dry Tile Supreme": "Alpha PT Cutter", "Razor Porcelain Blade": "Alpha PT Cutter",
    "Turbo Superblade": "Alpha PT Cutter", "Wet Tile Blade": "Alpha PT Cutter", "J-Slot Granite Blade": "Alpha PT Cutter",
    "Dustless Technologies Shrouds & Vacs": "PRO-176 PULSEBAC",
}


def main():
    xlsx = sys.argv[1]
    imgdir = sys.argv[sys.argv.index("--images") + 1] if "--images" in sys.argv else None
    global TOTALS
    TOTALS = "--sawdeal-totals" in sys.argv   # off by default: keeps cost-based figures out of the public repo
    rows = PL.load(xlsx)
    if "--master" in sys.argv: rows += PL.load_master_extra(sys.argv[sys.argv.index("--master") + 1])
    site = json.load(open(os.path.join(HERE, "dbw_site_catalog.json")))
    report = []

    # ---- customer price for every price-list row (cost is dropped right here) ----
    # The multipliers are passed in when you run the build. They are deliberately NOT written in
    # this file, because this repo is public.  See README.md for the command.
    def arg(name, cast=float):
        return cast(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else None
    MARKUP = arg("--markup")
    if not MARKUP: sys.exit("Pass the Buy It Now multiplier:  --markup N   (see tools/wisco/README.md)")
    DEAL_MULT, DEAL_PACK, DEAL_SAW = arg("--deal-mult"), arg("--deal-pack", int) or 15, arg("--deal-saw", str)
    COST = {}
    for r in rows:
        c = r["cost"] if isinstance(r["cost"], (int, float)) and r["cost"] > 0 else None
        if c: COST[r["sku"]] = c
        r["p"] = round(c * MARKUP, 2) if c else None
        r["sd"] = round(c * 1.7, 2) if c else None      # saw-deal base (the 36-pack level)
        r["chain"] = "CHAIN" in r["sheet"]
        if r["sheet"] == "WET BLADES" and "MLB" in r["section"]:
            pre = "3MLB" if "3MLB" in r["section"] else "KMLB"
            w = re.sub(r"[^0-9]", "", r["sku"])
            r["desc"] = r["sku"] + " " + r["desc"]
            r["sku"] = f"{pre}-{w}"
        del r["cost"], r["price"]

    def keys(sku):
        k = [norm(sku)]
        if sku.endswith("/20"): k.append(norm(sku[:-3]))
        m = re.match(r"^(ACC|AGC)(\d{3})(\d{2})C1$", sku)
        if m: k.append(m.group(1) + m.group(3) + m.group(2) + "C1")
        return k

    plmap, chainskus = {}, set()
    for r in rows:
        for k in keys(r["sku"]):
            if r["sku"] in COST: COST.setdefault(k, COST[r["sku"]])
            if r["chain"]: chainskus.add(k)
            elif k not in plmap or (r["p"] and not plmap[k]["p"]): plmap[k] = r

    fams, byname, used = [], {}, set()

    def mkfam(name, cats, src=None):
        f = dict(id=slug(name), n=name, cats=cats, vars=[], src=src, _seen=set())
        fams.append(f); byname[name] = f
        return f

    def addvar(f, sku, size, price, note="", sd=None):
        if (sku, size) in f["_seen"]: return
        f["_seen"].add((sku, size))
        f["vars"].append([sku, size, dia_of(size), price, note, sd])

    # ---- 1. families straight off the DBW site ----
    for p in site:
        offers = [o for o in p["offers"] if o["sku"] or o["size"]]
        dias = [dia_of(o["size"]) for o in offers]
        cur = FA.F.get(p["name"], {})
        cats = [cur["cat"]] if cur.get("cat") else site_cats(p, dias)
        f = mkfam(p["name"], cats, p)
        for o in offers:
            k = norm(o["sku"])
            if "chain" in cats and k in chainskus: continue
            row = plmap.get(k)
            if row: used.add(id(row))
            size = o["size"].replace("◊", "DM").replace(" - 7/8", ", 7/8")
            if row and row["sheet"] == "MASTER": size = row["extra"]["size"]
            addvar(f, o["sku"] or "ASK", size, row["p"] if row else None, "", row["sd"] if row else None)

    # ---- 2. price-list rows the site doesn't show ----
    for r in rows:
        if r["sheet"] == "SPECIAL" or id(r) in used: continue
        sku = r["sku"]
        size, note = split_desc(r["desc"])
        target, cats = None, None
        if r["chain"]:
            sec = r["section"].upper()
            target = next((n for k, n in CHAINSEC if k in sec), None) or next((n for k, n in CHAINSEC if k in r["sheet"]), nice(r["sheet"]))
            cats = ["chain"]
            if r["extra"].get("saw") and "POWERHEAD" not in r["desc"]: note = note
        elif r["sheet"] == "MASTER":
            target, size, note = r["section"], r["extra"]["size"], ""
            cats = ["core"] if not target.startswith("Zenesis") else ["green"]
        elif r["sheet"] == "SAWS":
            sec = r["section"].upper()
            target = next((n for rx, n in RULES if re.search(rx, sku)), None) or next((n for k, n in SAWSEC if k in sec), "Grinders & Circular Saws")
            cats = ["equip"]
        elif r["sheet"] == "CORE RIGS":
            target, cats = "Dr. Schulze Core Drill Motors, Stands & Packages", ["equip"]
            if sku == "PKG": sku, size, note = "PKG-" + re.sub(r"[^A-Z0-9]+", "", r["desc"].split(" - ")[0])[:14], "", nice(r["desc"])
            v = r["extra"].get("voltage", "")
            if re.match(r"\d+V", v) and v not in note: note = f"{v} {note}"
        elif r["sheet"] == "DUSTLESS":
            target, cats = "Dustless Technologies Shrouds & Vacs", ["dust"]
            size, note = "", nice(r["desc"]) + (" · " + nice(r["extra"]["saw"]) if r["extra"].get("saw") else "")
        elif r["sheet"] == "ABRASIVES":
            target = "Tyrolit Premium" if "PREMIUM" in r["section"] else "Tyrolit Basic"
            note = nice(r["section"])
        elif r["section"] == "SOFF CUT SAWS":
            target, cats, size = "Walk-Behind & Early-Entry Saws", ["equip"], ""
            note = nice(r["desc"])
        elif re.match(r"^GK\d+DD-([A-Z])\s*$", sku.strip()):
            target = "Green Kut " + GK[sku.strip()[-1]]
        else:
            target = next((n for rx, n in RULES if re.search(rx, sku)), None)
        if not target:
            report.append(f"UNPLACED {sku} | {r['desc']} ({r['sheet']})"); continue
        f = byname.get(target)
        if not f:
            nd = FA.NEW.get(target, {})
            f = mkfam(target, cats or [nd.get("cat") or FA.F.get(target, {}).get("cat") or "highspeed"])
        if not size and f["src"] is None and not note: note = nice(r["desc"])
        addvar(f, sku.strip(), size, r["p"], note, r["sd"])

    # ---- 3. dress every family ----
    out = []
    for f in fams:
        f["vars"] = [v for v in f["vars"] if v[3]]      # store only shows what a customer can price and order
        if not f["vars"]: continue
        name, p = f["n"], f["src"]
        cur = FA.F.get(name) or FA.NEW.get(name) or {}
        tier = cur.get("t", "")
        cats = f["cats"]
        blade = not (set(cats) & {"equip", "dust", "chain"})
        if not tier and blade: tier = "premium"
        apps = p["info"].get("Cutting Application", "") if p else ""
        mats = dict(cur.get("m") or {}) or (auto_mats(apps, tier) if blade else {})
        if "chain" in cats and not mats:
            mats = dict(c=4.5, r=4.5, b=4, pi=4) if "ductile" not in name.lower() else dict(x=4.5)
        dias = [v[2] for v in f["vars"]]
        saws = cur.get("saws") or auto_saws(cats, dias, name)
        paras = [x for x in (p.get("paras") or []) if x] if p else []
        hook = cur.get("h") or (paras[0] if paras else "") or HOOKS.get(name, "")
        if not hook and "chain" in cats: hook = "Chains, bars, sprockets and powerheads matched to your saw. Reorder by the exact part number."
        if len(hook) > 190 and not cur.get("h"): hook = re.split(r"(?<=[.!?])\s", hook)[0][:190]
        ben = [list(x) for x in cur.get("b", [])]
        if not ben and p and not blade:
            ben = [["", b] for b in (p.get("bullets") or [])[:4] if 20 < len(b) < 170]
        desc = ""
        if p and paras:
            keep = [x for x in paras if not re.match(r"(?i)(unleash|choosing|order |contact|upgrade|equip your|invest|browse|shop |whether)", x)]
            desc = " ".join(keep[:2])[:520]
            if desc == hook: desc = ""
        for v in f["vars"]:
            # Saw-deal-ready pricing: a 14" to 20" high-speed blade is priced at what it costs per blade
            # inside a DEAL_PACK-blade package with the reference saw.  price = mult x (blade + saw / pack)
            if DEAL_MULT and DEAL_SAW in COST and "highspeed" in cats and v[2] in (14, 16, 18, 20) and v[0] in COST:
                v[3] = round(DEAL_MULT * (COST[v[0]] + COST[DEAL_SAW] / DEAL_PACK), 2); v.append(1)
            ok = "highspeed" in cats and v[2] and 12 <= v[2] <= 16 and v[5]
            # v[5] marks a blade as saw-deal eligible. It only carries a cost-based figure with --sawdeal-totals.
            v[5] = (v[5] if TOTALS else 1) if ok else None
        f["vars"].sort(key=lambda v: (v[2] is None, v[2] or 0, v[1], v[0]))
        prices = [v[3] for v in f["vars"] if v[3]]
        d = dict(id=f["id"], n=name, cats=cats, tier=tier, hook=hook, ben=ben, desc=desc,
                 apps=[a.strip() for a in apps.split(",") if a.strip()][:12], m=mats, saws=saws,
                 img="", imgsrc=(p["imgs"][0] if p and p["imgs"] else ""), borrow=cur.get("img"),
                 rank=(POPULAR.index(name) if name in POPULAR else 99), min=min(prices) if prices else None,
                 vars=f["vars"])
        out.append(d)

    # ---- 4. images ----
    by = {d["n"]: d for d in out}
    siteimg = {p["name"]: p["imgs"][0] for p in site if p["imgs"]}
    extra = {}
    for d in out:
        want = BORROW.get(d["n"]) or ("Gas Diamond Chain" if "chain" in d["cats"] else None)
        if not d["imgsrc"] and want and want not in by and want in siteimg:
            extra[slug(want)] = siteimg[want]; d["img"] = slug(want) + ".webp"
        elif not d["imgsrc"] and want and want in by: d["borrow"] = want
    chainimg = next((d for d in out if d["imgsrc"] and "chain" in d["cats"] and "Chain" in d["n"]), None)
    for d in out:
        if d["imgsrc"]: d["img"] = d["id"] + ".webp"
    for d in out:
        if not d["img"]:
            b = by.get(d["borrow"] or "")
            if not b and "chain" in d["cats"]: b = chainimg
            if not b and d["n"].startswith("Zenesis"): b = by.get("Zenesis Green Kut Purple")
            if not b and d["n"].startswith("Green Kut"): b = by.get("Green Kut Green")
            if b and b["img"]: d["img"] = b["img"]
    if imgdir:
        from PIL import Image
        os.makedirs(imgdir, exist_ok=True); os.makedirs(os.path.join(ROOT, "wisco", "img"), exist_ok=True)
        jobs = [(d["id"], d["imgsrc"], d) for d in out if d["imgsrc"]] + [(k, v, None) for k, v in extra.items()]
        for iid, isrc, d in jobs:
            src = isrc.replace("_1000_1000_", "_800_800_")
            raw = os.path.join(imgdir, hashlib.md5(src.encode()).hexdigest())
            if not os.path.exists(raw) or os.path.getsize(raw) < 500:
                subprocess.run(["curl", "-sS", "-L", "-m", "40", "-A", "Mozilla/5.0", "-o", raw, src])
            try:
                im = Image.open(raw).convert("RGBA")
                bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
                im = bg.convert("RGB"); im.thumbnail((440, 440))
                im.save(os.path.join(ROOT, "wisco", "img", iid + ".webp"), "WEBP", quality=74)
            except Exception as e:
                report.append(f"IMAGE FAILED {iid}: {e}")
                if d: d["img"] = ""
    for d in out:
        del d["imgsrc"], d["borrow"]

    catorder = {k: i for i, (k, _, _) in enumerate(FA.CATS)}
    out.sort(key=lambda d: (d["rank"], catorder.get(d["cats"][0], 50), d["min"] is None, d["n"]))
    m = re.search(r"(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{4})", os.path.basename(xlsx).upper())
    SAWS = ["K770-12", "K770-14", "K970A-14", "K970A-16", "TS410", "TS420", "TS500-14", "TS710I", "TS910I", "DSH700", "900X14", "900X16"]
    sawrows = {r["sku"]: r for r in rows if r["sheet"] == "SAWS" and r["sd"]}
    def unbrand(t):
        """The saw maker does not allow its name in our saw deals: model numbers only."""
        if not isinstance(t, str): return t
        t = re.sub(r"(?i)\bTS[- ]?(\d{3})(?:[- ]?(i)\b)?", lambda m: m.group(1) + ("i" if m.group(2) else ""), t)
        t = re.sub(r"(?i)\bstihl\b", "", t).replace("Cutquik", "Gas Cut-Off")
        return re.sub(r"\s{2,}", " ", t).replace(" /", "/").strip(" -")
    for d in out:
        for k in ("n", "hook", "desc"): d[k] = unbrand(d.get(k))
        d["ben"] = [[unbrand(a), unbrand(b)] for a, b in d.get("ben") or []]
        for v in d["vars"]: v[1], v[4] = unbrand(v[1]), unbrand(v[4])
        if "hay" in d: d["hay"] = re.sub(r"\s{2,}", " ", d["hay"].replace("stihl", ""))
    sawdeal = dict(totals=TOTALS, tiers=[[15, 2.0], [25, 1.8], [36, 1.7]] if TOTALS else [[15, 0], [25, 0], [36, 0]],
                   saws=[dict(sku=k, n=unbrand(nice(sawrows[k]["desc"])) + ("" if "saw" in nice(sawrows[k]["desc"]).lower() else " Saw"), b=sawrows[k]["sd"] if TOTALS else 0) for k in SAWS if k in sawrows],
                   ref=DEAL_SAW if DEAL_MULT else "", pack=DEAL_PACK)
    data = dict(sawdeal=sawdeal,
        priceList=(m.group(1).title() + " " + m.group(2)) if m else "", built=datetime.date.today().isoformat(),
        materials=[dict(k=k, n=n) for k, n in FA.MATERIALS], saws=[dict(k=k, n=n, s=s) for k, n, s in FA.SAWS],
        cats=[dict(k=k, n=n, s=s) for k, n, s in FA.CATS], families=out)
    js = "window.CATALOG=" + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n"
    open(os.path.join(ROOT, "wisco", "catalog.js"), "w", encoding="utf8").write(js)
    nv = sum(len(d["vars"]) for d in out); npz = sum(1 for d in out for v in d["vars"] if v[3])
    print(f"families {len(out)}  items {nv}  priced {npz}  call-for-price {nv - npz}  catalog.js {len(js) // 1024} KB")
    print("\n".join(report))


if __name__ == "__main__":
    main()
