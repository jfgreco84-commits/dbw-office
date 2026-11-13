# Curated blade-family data for the DBW Wisco site.
# NO COSTS LIVE IN THIS FILE. It only holds marketing copy, grades and ratings.
#
# Material keys (rating 1-5, half steps OK):
#   c concrete   r reinforced/hard concrete   g green concrete   a asphalt
#   b brick & block   p pavers & hardscape    s stone & granite  t tile & porcelain
#   m mortar/tuckpoint   x ductile iron & metal   pi concrete pipe/RCP
#   pc precast & prestress   sp grinding & surface prep
# Tier: supreme (BEST) / premium (BETTER) / standard (GOOD) / economy (VALUE) / pro (PRO SERIES)

MATERIALS = [
    ("c", "Cured Concrete"), ("r", "Reinforced & Hard Concrete"), ("g", "Green Concrete"),
    ("a", "Asphalt"), ("b", "Brick & Block"), ("p", "Pavers & Hardscape"),
    ("s", "Stone & Granite"), ("t", "Tile & Porcelain"), ("m", "Mortar & Tuckpointing"),
    ("x", "Ductile Iron & Metal"), ("pi", "Concrete Pipe / RCP"), ("pc", "Precast & Prestress"),
    ("sp", "Grinding & Surface Prep"),
]
SAWS = [
    ("grinder", "Angle Grinder", '4" to 9"'), ("circ", "Circular / Worm Drive", '7" to 7-1/4"'),
    ("cutoff", "Hand-Held Cut-Off Saw", '12" to 16" gas, electric, battery'),
    ("walk", "Walk-Behind Saw", '14" and up'), ("early", "Early-Entry Saw", "Soff-Cut style"),
    ("table", "Masonry / Tile Saw", "table and block saws"), ("chain", "Diamond Chain Saw", "gas and hydraulic"),
    ("ring", "Ring Saw", "deep cut"), ("wall", "Wall / Hydraulic Hand Saw", ""), ("core", "Core Drill", "hand-held and rig"),
]
CATS = [
    ("highspeed", "High-Speed Blades", '12" to 20" dry blades for cut-off and walk-behind saws'),
    ("small", "Small Diameter", '4" to 10" blades for grinders and circular saws'),
    ("tile", "Tile & Stone", "Porcelain, ceramic, marble and granite"),
    ("tuck", "Tuck Point & Crack Chasers", "Mortar removal and crack repair"),
    ("cup", "Cup Wheels", "Grinding, leveling and coating removal"),
    ("green", "Green Concrete", "Early-entry blades and skid plates"),
    ("wet", "Wet & Flat Saw Blades", "Walk-behind, loop, bevel, wall saw and prestress"),
    ("metal", "Metal & Rescue", "Ductile iron, rail, rebar and demo"),
    ("abrasive", "Abrasive Wheels", "Bonded cut-off wheels"),
    ("core", "Core Bits", "Wet, dry and dustless bits plus adaptors"),
    ("chain", "Diamond Chain", "Chains, bars, sprockets and powerheads"),
    ("equip", "Saws & Equipment", "Cut-off saws, walk-behinds, core rigs, pumps"),
    ("dust", "Dust Control", "Shrouds, vacuums and accessories"),
]

# name -> curated dict.  cat optional (auto otherwise).  b = [(feature, what it does for you)]
F = {}
def fam(name, t, m, h, b=None, cat=None, d=None):
    F[name] = dict(t=t, m=m, h=h, b=b or [], cat=cat, d=d)

# ---------------- High-speed multi-purpose ----------------
fam("Super G", "supreme", dict(c=5, r=4, a=4, b=4.5, p=4.5, s=4, pi=4.5, x=3),
    "Our best-selling blade. One blade for concrete, block, pavers, asphalt and pipe.",
    [("True multi-purpose bond", "Concrete, block, pavers, asphalt, pipe. One blade on the truck instead of four."),
     ("Double laser-welded segments", "Fights undercutting so you wear the diamond out, not the core."),
     ("Runs dry", "No hose, no slurry. Pull the cord and cut, indoors or out.")])
fam("Superblade G3", "supreme", dict(c=4.5, b=4.5, p=5, s=4.5, r=4),
    "Our signature blade. Built for one job: drop your cost per cut.",
    [("Aggressive segment, long-life bond", "Cuts fast on day one and is still cutting weeks later."),
     ("Tuned for hardscape", "Block, pavers, granite and natural stone without swapping blades."),
     ("Supreme-grade diamond", "More footage per blade means fewer reorders and fewer trips to the truck.")])
fam("Superblade Extreme", "supreme", dict(c=4.5, a=4.5, b=4.5, s=4, pi=4.5, p=4.5, x=3),
    "Cuts everything exceptionally well, and it does it smoother than anything in its class.",
    [("Alternating segment design", "Less vibration in your hands, quicker cut, cleaner edge."),
     ("Drop segments", "Undercut protection built in, so soft abrasive material can't eat the core."),
     ("One blade for mixed sites", "Asphalt in the morning, concrete pipe after lunch. Same blade.")])
fam("Superblade Arrow", "supreme", dict(r=5, c=4.5, s=5, b=4.5, p=4.5, pi=4.5, a=3.5),
    "Our hard-material blade. Built for rebar, river rock, fire brick and granite curb.",
    [("Arrow-shaped slant segments", "Throws dust out of the cut and guards against undercut wear."),
     ("15mm segment height", "A tall segment is more diamond to burn. More cuts before you call us."),
     ("Hard-material bond", "Stays open on rebar, river rock, fire brick and granite curb instead of glazing over.")])
fam("Swordfish", "supreme", dict(r=5, s=5, pi=4.5, b=4, c=4.5, p=4),
    "Made for hard, dense material where an ordinary blade glazes over.",
    [("Side-slit segments", "Pulls itself through the cut so the saw doesn't bog."),
     ("Extra-deep gullets", "Clears dust fast, runs cooler, no binding on deep plunge cuts."),
     ("Rigid high-tensile core", "Tracks dead straight. Your cut line stays your cut line.")])
fam("Dragon", "supreme", dict(c=4.5, a=4.5, b=4.5, p=4.5, s=4, pi=4.5, r=4),
    "The Red Dragon. A supreme combo blade built for maximum life on whatever shows up.",
    [("Combination segment", "Concrete to asphalt to block without a blade change."),
     ("Supreme combo bond", "Built for life first. This is the blade crews stretch the longest."),
     ("Fast, dry cutting", "Pipe crews and hardscapers cut without dragging a hose around.")])
fam("Dragon Supreme", "supreme", dict(r=5, c=5, a=4.5, s=5, b=4.5, p=4.5, pi=5),
    "The Purple Dragon. Big brother to the Red, and the best multi-purpose blade we sell.",
    [("Zenesis diamond alignment", "Every diamond sits where it should, so the blade cuts fast from first inch to last."),
     ("Double laser-welded segment", "Stays put through heavy rebar and hard highway concrete."),
     ("Speed and life together", "You stop choosing between a fast blade and a long blade.")])
fam("25th Anniversary Blade", "supreme", dict(c=4.5, a=4.5, b=4.5, s=4, pi=4, p=4.5, r=4),
    "A supreme combo blade we built to mark 25 years. Maximum life and speed on every application.",
    [("Supreme combo segment layout", "Cured concrete, asphalt and stone, all smooth."),
     ("15mm segments", "Extra diamond height means extra days on the saw."),
     ("Low-vibration core", "Easier on the operator at the end of a long shift.")])
fam("20th Anniversary Blade", "supreme", dict(c=4.5, r=4),
    "Arix diamond alignment puts every diamond to work for speed and life on cured concrete.")
fam("Hybrid", "supreme", dict(b=5, p=5, s=4.5, c=4, pi=4),
    "Fast, clean cuts on almost any masonry without giving up blade life.",
    [("Medium-soft bond", "Stays sharp on hard brick and stone where a hard bond glazes over."),
     ("Multi-segment design", "Clean edges on pavers and block. Less rework, fewer wasted pieces."),
     ("Supreme-grade diamond", "Speed of a soft blade with the life of a premium one.")])
# ---------------- Eagle line (concrete) ----------------
fam("Eagle Supreme", "supreme", dict(c=5, r=4.5, b=4),
    "Top of the Eagle line. Phenomenal life on cured concrete.",
    [("Highest-grade diamond", "Cuts fast through extra-hard aggregate without bogging the saw."),
     ("Patterned segments", "Even pressure across the cut. No binding, no chatter."),
     ("Hard-aggregate bond", "Matched to hard concrete and rebar so segments wear evenly.")])
fam("Eagle Premium", "premium", dict(c=4.5, r=3.5, b=4),
    "The everyday concrete blade. A real balance of life and speed at a number that makes sense.",
    [("Premium concrete bond", "Good speed and good life. Nothing to babysit."),
     ("Laser-welded segments", "Safe dry cutting on high-speed saws."),
     ("Priced for volume", "The blade most crews stock by the 10-pack.")])
fam("T-Rex", "premium", dict(c=4, r=4, b=4, p=4, pi=4, s=3.5),
    "A W-shaped segment that cuts fast and aggressive at a fair price.",
    [("W-shaped segments", "Fast, aggressive cut on concrete, reinforced concrete, pipe, brick and block."),
     ("Cobalt steel core", "Won't warp or wobble when it gets hot."),
     ("Contractor pricing", "Premium performance without the supreme price tag.")])
fam("Eagle Heavy Duty", "standard", dict(c=3.5, b=3.5),
    "A solid, honest concrete blade with a tall 14mm segment for extended life.",
    [("14mm sintered segment", "More segment height stretches every blade further."),
     ("Tensioned steel core", "Resists flex so it tracks straight."),
     ("Value pricing", "Good quality at a price you can hand out to the whole crew.")])
fam("Eagle Standard", "economy", dict(c=3, b=3.5),
    "The budget workhorse for concrete, brick and block.",
    [("Economy pricing", "The lowest cost-in on a 14-inch blade we carry."),
     ("General segment bond", "Brick, block and concrete, reliably."),
     ("Great saw-package blade", "Ask your rep about the price when it ships with a saw.")])
fam("Eagle Supreme Masonry", "supreme", dict(b=5, p=4.5, c=4),
    "Maximum performance on retaining wall block, CMU and concrete pavers.")
fam("Eagle Premium Masonry", "premium", dict(b=4.5, p=4, c=4),
    'A 20" premium masonry blade for block saws and walk-behinds.')
fam("Eagle - Small Diameter", "premium", dict(c=4, b=4, p=3.5),
    "Our most popular premium segmented blade for grinders. Cured concrete and masonry all day.",
    [("Premium segmented rim", "Fast, cool dry cutting on a grinder."),
     ("10mm segments", "Plenty of life for the money."),
     ('4" through 10"', "One blade line across every small saw on the truck.")])
fam("Eagle Green Concrete", "premium", dict(g=4, a=3.5),
    "Built for cutting expansion joints in fresh concrete, with a universal arbor that fits what you run.")
# ---------------- Viper / turbo ----------------
fam("Viper General Purpose", "standard", dict(b=4, p=4, c=3.5, a=3, s=3.5),
    "Our best-selling general purpose blade. The segmented turbo rim pulls itself through the cut.",
    [("Segmented turbo design", "Feeds itself, so you push less and cut faster."),
     ("True general purpose", "Pavers, block, curb, patch work. One blade covers the day."),
     ("Easy price", "Low enough to keep a spare on every truck.")])
fam("Viper Premium", "premium", dict(s=4.5, b=4.5, p=4.5, c=4),
    "Made for the harder masonry. Tall 15mm segments and a soft bond that keeps cutting clean and fast.",
    [("15mm segment height", "Great life on abrasive block and pavers."),
     ("Soft bond", "Stays sharp on hard brick and stone instead of polishing over."),
     ("Turbo-segmented rim", "Fast cut with a clean edge.")])
fam("Viper Supreme Turbo", "supreme", dict(s=5, b=4.5, p=4.5, t=4),
    "48 split segments and oversized cooling holes. The fastest cut we have on the hardest masonry.",
    [("48 split segments", "Maximum speed and a smooth edge on hard brick and stone."),
     ("Oversized cooling holes", "Runs cooler, so the core stays flat and true."),
     ("Low vibration", "Easier on hands and arms through a full day of cuts.")])
fam("Viper Specialty", "premium", dict(b=5, s=4.5, p=4),
    "Specially bonded for the hardest brick and stone. Slanted segments, high diamond count.",
    [("Slanted segments", "Fast cutting with less chipping on the edge."),
     ("High diamond concentration", "Long life in material that kills ordinary blades."),
     ("Narrow kerf", "Less drag, less dust, cleaner piece.")])
fam("Viper", "premium", dict(c=4, b=4, p=4, s=3.5),
    'The 9" Viper segmented turbo. 15mm segments built for speed without giving up life.')
fam("Blue Tornado", "supreme", dict(s=5, b=4.5, p=4.5, c=4, t=3.5),
    "Titanium-coated turbo segments that cut extremely fast and leave a smooth finish.",
    [("Titanium-encapsulated diamond", "Diamonds stay in the segment longer. Faster cut, longer life."),
     ("Blue heat-sink core", "Sheds heat fast so the blade stays flat on long cuts."),
     ("Curved gullets", "Clears dust and runs quieter."),
     ('4" through 14"', "Same blade from the grinder to the cut-off saw.")])
fam("Tornado", "supreme", dict(s=4.5, b=4.5, c=4, p=4, t=3.5),
    "A T-segment turbo that cuts extremely fast with long life on concrete, stone and roof tile.",
    [("Spiral T-segments", "Moves air through the cut. Less friction, faster feed."),
     ("Reinforced core", "No chatter and no deflection on deep passes."),
     ("Cobalt bond", "Holds the diamond through abrasive aggregate.")])
fam("Jaguar", "premium", dict(c=4, b=4, s=3.5, p=3.5),
    "Our most popular premium turbo for grinders. Concrete, masonry and stone.",
    [("Continuous turbo rim", "Faster than segmented with a cleaner edge."),
     ("10mm rim", "Solid life at a low price per blade."),
     ("Stock-up pricing", "The blade crews buy by the box.")])
# ---------------- Asphalt / green ----------------
fam("Wolverine Supreme", "supreme", dict(a=5, g=4.5),
    "Best blade in the Wolverine line. Maximum performance on asphalt and green concrete.",
    [("High-density diamond matrix", "Speed through abrasive asphalt aggregate."),
     ("Undercut protection", "Abrasive slurry can't chew the core out from under the segments."),
     ("Tensioned core", "Tracks straight under load on long cuts.")])
fam("Wolverine Premium", "premium", dict(a=4.5, g=4),
    "A premium high-speed blade for asphalt and expansion joints at a stock-up price.",
    [("Asphalt bond", "Hard bond matched to soft, abrasive material so it lasts."),
     ("Universal arbor sizes", 'Fits 1" and 20mm saws.'),
     ("Priced to stock", "Keep two on the truck during paving season.")])
fam("Wolverine Premium Plus Drop Segment", "premium", dict(a=4, g=4.5),
    "The best high-speed blade for green concrete. Tight segment spacing cuts faster with less chipping.",
    [("Drop segments", "Built-in undercut protection on abrasive green slabs and asphalt."),
     ("Tight gullets", "Cleaner joint edges and less raveling."),
     ("Fast feed", "Get the joints in before the slab gets away from you.")])
for _c in ["Green", "Orange", "Purple", "Red", "Yellow", "White", "Black"]:
    fam("Green Kut " + _c, "premium", dict(g=5),
        "Green Kut: our premium alternative to Soff-Cut blades. Color-matched to your aggregate.",
        [("Early-entry bond", "Cut joints the same day without raveling the edge."),
         ("Runs dry", "No water, no slurry to manage on a fresh slab."),
         ("Color-coded by aggregate", "Not sure which color fits your mix? Hit the rep button and we will match it.")],
        cat="green")
fam("Green Kut Next Day", "premium", dict(g=4.5, c=3.5),
    "For the slab that sat overnight. A harder bond that still cuts clean, stable joints.",
    [("Next-day bond", "Stands up to the extra hardness of an overnight pour."),
     ("Laser-fused segments", "Crisp joint channels without spalling."),
     ("Deep cooling gullets", "Clears dust and controls heat on long dry runs.")], cat="green")
for _c in ["Green", "Orange", "Purple", "Red", "Yellow"]:
    fam("Zenesis Green Kut " + _c, "supreme", dict(g=5),
        "Zenesis diamond alignment for more footage per blade and chip-free joints.",
        [("Zenesis diamond alignment", "Evenly placed diamond gives you speed and life together."),
         ("Soff-Cut and Gorilla arbor patterns", "Fits the early-entry saw you already own."),
         ("Chip-free cut", "Joints the GC won't make you redo.")], cat="green")
# ---------------- Metal / rescue ----------------
fam("Blacksmyth", "supreme", dict(x=5, pi=3.5),
    "The diamond blade that cuts metal twice as fast as an abrasive wheel and lasts up to 70 times longer.",
    [("Vacuum-brazed diamond", "Stays the same diameter. Full depth of cut on the last cut like the first."),
     ("No shattering wheels", "Safer than abrasives, with far fewer sparks and no wheel dust."),
     ("One blade replaces a stack", "Stop hauling boxes of abrasive wheels to every job.")], cat="metal")
fam("Blacksmyth Railcut", "supreme", dict(x=5),
    "Second in the Blacksmyth series. Finer diamond for faster cuts on guardrail and steel.",
    [("Finer diamond grit", "Faster, smoother cuts on guardrail, angle iron and rebar."),
     ("Full Blacksmyth life", "Speed without giving up blade life."),
     ('4.5" through 16"', "Grinder to cut-off saw, same blade.")], cat="metal")
fam("Blacksmyth Supreme", "supreme", dict(x=5, pi=4.5, c=3.5),
    "One-piece vacuum-brazed blade with side protection. Ductile, cast iron, rebar and concrete.",
    [("Uni-body design", "No segments to lose. That's why underground crews trust it in the trench."),
     ("Side protection", "Diamond on the sides keeps it from pinching in pipe."),
     ("Cuts metal and concrete", "Ductile, RCP, PVC, rebar. One blade for utility work.")], cat="metal")
fam("Blacksmyth Ring Saw", "supreme", dict(x=5),
    "Blacksmyth performance for your ring saw. Ductile iron, pipe and metal.", cat="metal")
fam("Americut Ductile Premium", "premium", dict(x=5, pi=3.5),
    "Built for ductile pipe. The abrasive side coating gives the cleanest cut possible.",
    [("Ductile-specific bond", "Great performance on ductile and cast iron pipe."),
     ("Abrasive side coating", "Clean, square cut ends that are ready to couple."),
     ("Full depth every cut", "Unlike abrasive wheels, it doesn't shrink as you go.")], cat="metal")
fam("Rescue", "supreme", dict(x=4.5),
    "Carbide-tipped demolition blade that will not bind. Built for fire and rescue.",
    [('.250" carbide chunks', "Extremely fast cutting through metal, roofing and building materials."),
     ("Won't bind", "Critical when seconds count."),
     ("Multi-material", "Metal, roofing, wood, tree roots, mixed demo debris.")], cat="metal")
# ---------------- Cup wheels ----------------
fam("Single Row", "premium", dict(sp=4, c=4),
    "Very aggressive stock removal. When you need material gone now.",
    [("Single row of segments", "Maximum removal rate. Expect a rough finish."),
     ("Cooling holes", "Keeps the wheel from overheating."),
     ("Threaded or non-threaded", "Fits the grinder you already run.")])
fam("Double Row", "premium", dict(sp=4.5, c=4.5),
    "More forgiving than a single row, no horseshoe marks, and it lasts much longer.",
    [("Two rows of diamond", "Smoother finish and much longer life."),
     ("Forgiving cut", "Easier for a newer operator to keep flat."),
     ("Cooling holes", "Runs cool on long grinds.")])
fam("Turbo Cup - Premium", "premium", dict(sp=4.5, c=4.5, b=4),
    "More segments, smoother finish. Exceptional value in a turbo cup.",
    [("Fan-blade segments", "Fast removal with a finer scratch pattern."),
     ("Double the cooling holes", "Wheel stays cool and lasts longer."),
     ("Threaded or non-threaded", "Order it the way your grinder needs it.")])
fam("Turbo Cup - Premium (Tall Hub)", "premium", dict(sp=4.5, c=4.5),
    "The premium turbo cup with a tall threaded hub for shrouded grinders.")
fam("Turbo Cup - Supreme", "supreme", dict(sp=5, c=5, b=4),
    "Our supreme turbo cup. Smoothest finish and longest life in the line.",
    [("Supreme diamond", "Longer life on hard concrete."),
     ("Fan-blade segments", "Smooth finish, fewer passes."),
     ("Double cooling holes", "Runs cool under a dust shroud.")])
fam("T-Seg", "supreme", dict(sp=5, c=4.5),
    "T-shaped segments with an aggressive profile for coating removal and leveling.",
    [("T-segment profile", "Tears through coatings, thinset and high spots."),
     ("Open pattern", "Resists loading up on glue and epoxy."),
     ("Threaded or non-threaded", "Your call.")])
fam("Arrow Cup", "supreme", dict(sp=5, c=4.5),
    "Arrow segments with 48% diamond concentration. Our most aggressive profile.")
fam("V Groove", "premium", dict(sp=4, c=4, r=4),
    "Precision grinding, shaping and profiling on hard concrete.")
fam("Zec Wheel", "economy", dict(sp=3.5),
    "Silicon carbide disc for grinding concrete and stripping mastic, epoxy and adhesive.")
# ---------------- Tuck point ----------------
fam("Blue Cheetah", "supreme", dict(m=5, b=4),
    "Quick, efficient mortar removal. Wide U-gullets and a high segment count keep it cutting cool.",
    [("High segment count", "Smooth, fast mortar removal with less chatter."),
     ("Wide U-gullets and cooling holes", "Clears dust and runs cool in deep joints."),
     ("Multi-segment rim", "Stays sharp joint after joint.")])
fam("Sandwich Tuck Point", "premium", dict(m=4.5, b=4),
    "Sintered with a higher diamond count for longer life and extremely fast mortar removal.",
    [("Sandwich segment", "Holds joint width from the first foot to the last."),
     ("Higher diamond count", "Longer life per blade."),
     ("Fast cut", "More wall done by lunch.")])
fam("Tiger Tuck Point", "standard", dict(m=4, b=3.5),
    "The standard tuck pointer. Fast mortar removal at a price you can stock.")
fam("Premium Tuck Point", "premium", dict(m=4.5, b=4),
    "A premium tuck point built for efficient mortar removal.")
fam("Crack Chaser", "premium", dict(c=4.5, a=3.5),
    "V-shaped diamond segments that clean out cracks fast and leave them ready for filler.",
    [("V-shaped segment", "Opens the crack to a clean, uniform channel."),
     ("Brazed diamond wedges", "Fast cutting with long life."),
     ('7/8"-5/8" or 5/8"-11 threaded', "Fits your grinder or crack-chasing saw.")])
# ---------------- Core bits ----------------
fam("V-Shape Wet Corebit", "premium", dict(c=4.5, r=4, b=4),
    "Premium Plus wet core bits. Higher diamond count for faster holes and longer life.",
    [("V-shape laser-welded segments", "Start clean, cut fast, stay on."),
     ("Higher diamond count", "More holes per bit."),
     ('1" through 16"', "Every common size on one price sheet.")])
fam("Segmented Dry Corebit", "premium", dict(b=4.5, c=3.5, p=4),
    "Dry coring in brick, block, pavers and concrete with a hand-held drill.",
    [("Laser-welded segments", "Safe to run dry."),
     ('9" barrel, 5/8"-11 thread', "Threads right onto your hand-held core drill or grinder."),
     ("Premium diamond", "Fast holes in block and brick.")])
fam("Dustless Dry Core Bit", "premium", dict(b=4.5, c=3.5, p=4),
    "No holes in the barrel, so your vacuum actually pulls the dust. Made to run dry.",
    [("Solid barrel", "Seals to a dust shroud. Stay compliant on silica without water."),
     ('9" barrel, 5/8"-11 thread', "Standard fit for hand-held drills."),
     ("Runs dry", "Clean holes indoors with no slurry mess.")])
fam("Punisher", "supreme", dict(r=5, pc=5, c=4.5),
    "One of the best bits in the business for very heavily reinforced concrete.")
fam("Sabertooth", "supreme", dict(r=5, c=5, pc=4.5, b=4),
    "The highest quality core bit we offer. Performs in every aggregate and job condition.")
fam("Wolv", "supreme", dict(r=5, c=5, pc=4.5),
    "The original super core bit. Top-grade patterned diamond with cobalt and tungsten.")
fam("Valkyrie", "supreme", dict(c=5, r=4.5),
    "Turbo-slotted segments clear slurry fast for very fast coring in concrete and rebar.")
fam("Venom", "premium", dict(c=4, b=4.5, p=4),
    "A versatile, reasonably priced bit with add-on 12-inch barrel sections.")
fam("Smash", "premium", dict(c=4, a=4, b=4),
    "For the crew that wants one versatile core bit for any job.")
fam("Blackcat", "pro", dict(a=5),
    "The best-of-the-best core bit for straight asphalt.")
fam("Precast Core Bit", "premium", dict(pc=5, c=4),
    "Crown wet core bits built for maximum life on precast and prestress.")
fam("U-Shape Wet Corebit", "premium", dict(pc=4.5, r=4.5),
    "U-shape segments with a higher diamond count for heavily reinforced and prestress concrete.")
# ---------------- Wet / specialty ----------------
fam("Americut Pro Series", "pro", dict(c=4.5, a=4.5, g=4),
    "Patterned-diamond wet blades for flat saws. Bonded to your aggregate.")
fam("Americut SuperPro Series", "pro", dict(c=5, a=5, r=4.5),
    "Our top wet blade. Five bonds so the blade matches your aggregate, not the other way around.")
fam("Supreme Overlay", "supreme", dict(a=5, c=4.5),
    "For asphalt over concrete on 35 to 75 hp saws. Recessed segments and tungsten kickers stop undercutting.")
fam("Americut Looping", "premium", dict(c=4.5, a=4.5, g=4),
    "Wide blades for traffic loop detectors and expansion joints in concrete and asphalt.")
fam("Americut Bevel", "premium", dict(c=4, a=4),
    "Bevel blades sold in pairs, 45 degrees each side, for clean chamfered joints.")
fam("Ring Saw", "premium", dict(c=4.5, pi=4.5, b=4),
    "Ring saw blades compatible with all ring saws. Tell us which saw you run.")
fam("Split Segment Wall Saw Blade", "pro", dict(r=4.5, c=4.5),
    "Split segments for high-speed wall sawing and a lower cost per cut.")
fam("Hydraulic Hand Saw", "pro", dict(c=4.5, b=4),
    "Arix diamond alignment for a fast, efficient cut on hydraulic hand saws.")
fam("Tyrolit Basic", "standard", dict(x=3), "Triple-reinforced abrasive wheels with a strong cut rate and good life.", cat="abrasive")
fam("Tyrolit Premium", "premium", dict(x=3.5), "Premium abrasive wheels for when productivity matters. Good on rail.", cat="abrasive")
fam("Alpha PT Cutter", "supreme", dict(t=5, p=4.5, s=4),
    "Cuts porcelain pavers on a gas saw with minimal chipping.", cat="tile")
fam("iQ Masonry Blade", "premium", dict(b=4.5, p=4.5, s=4), 'The 16.5" Q-Drive blade for iQ dustless masonry saws.')
fam("Superblade Xtreme - Small Diameter", "supreme", dict(c=4.5, a=4.5, b=4.5, s=4),
    "The multi-purpose Superblade in a small diameter, with drop segments for undercut protection.")

# ------------- New families built from price-list rows the site doesn't show -------------
# (id/name, cat, tier, mats, hook, benefits, image borrowed from, saws override)
NEW = {}
def new(name, cat, t, m, h, b=None, img=None, saws=None):
    NEW[name] = dict(cat=cat, t=t, m=m, h=h, b=b or [], img=img, saws=saws)

new("Razor Porcelain Blade", "tile", "supreme", dict(t=5, s=4),
    "Supreme razor-thin rim for chip-free cuts in porcelain.",
    [("Razor-thin rim", "Clean edge on porcelain. Fewer wasted tiles."),
     ("Supreme diamond", "Stays sharp in the hardest tile."),
     ('4" through 10"', "Grinder to tile saw.")])
new("Dry Tile Supreme", "tile", "supreme", dict(t=4.5, s=4),
    "Supreme continuous-rim dry tile blade made for porcelain.", img="Razor Porcelain Blade")
new("Dry Tile Blade", "tile", "premium", dict(t=4, s=4),
    "Continuous rim for dry cuts in ceramic, marble and granite.",
    [("Continuous rim", "Smooth, chip-free edge."), ("Runs dry on a grinder", "Make the cut where the tile sits."),
     ("Premium and standard grades", "Pick the grade that fits the job.")])
new("Wet Tile Blade", "tile", "premium", dict(t=4.5, s=4),
    "Wet tile saw blades for porcelain, ceramic, marble and granite.", saws=["table"])
new("J-Slot Granite Blade", "tile", "premium", dict(s=4.5, t=4),
    "J-slot rim for fast, cool cutting in granite.", saws=["table"])
new("Turbo Superblade", "tile", "supreme", dict(s=5, t=4.5),
    "The Superblade turbo for granite and porcelain. Fast with a clean edge.")
new("Granite Turbo", "small", "premium", dict(s=4.5, b=4), "Turbo rim bonded for granite and hard stone.", img="Jaguar")
new("Eagle Supreme - Small Diameter", "small", "supreme", dict(c=4.5, b=4.5, p=4, r=4),
    "The supreme segmented blade for grinders. Brick, masonry and cured concrete.",
    [("Supreme diamond", "Noticeably longer life than the premium Eagle."),
     ("Segmented rim", "Fast and cool, dry."), ('4" through 10"', "Every grinder size covered.")], img="Eagle - Small Diameter")
new("T-Seg Turbo Black", "small", "premium", dict(b=4, c=4, s=3.5),
    "Black T-segment turbo for masonry. Fast cut, easy price.", img="Tornado")
new("Turbo Economy", "highspeed", "economy", dict(c=3, b=3.5),
    "Economy turbo for concrete and masonry on a cut-off saw.", img="Viper General Purpose")
new("Economy Tuck Point", "tuck", "economy", dict(m=3, b=3),
    "The lowest-cost tuck pointer we carry. Good for the short job.", img="Tiger Tuck Point")
new("Cut-n-Break Blade Set", "wet", "premium", dict(c=4.5, r=4),
    'Two-piece 9" blade set for Husqvarna Cut-n-Break saws.', saws=["cutoff"])
new("Wood Blades", "small", "standard", {}, '7-1/4" 24-tooth wood blades, sold in boxes of 50.', saws=["circ"])
new("3MLB Low-HP Concrete", "wet", "premium", dict(c=4.5, r=4),
    "Wet blades for cured concrete on low-horsepower walk-behind saws.",
    [("Low-HP bond", "Matched to small walk-behinds so the saw can actually keep the blade open."),
     ('14" to 36"', "Every diameter and width on one sheet."),
     ("Wet cutting", "Longest life and the cleanest joint.")], img="Americut Pro Series", saws=["walk"])
new("KMLB Low-HP Asphalt & Green", "wet", "premium", dict(a=4.5, g=4.5),
    "Wet blades for asphalt and green concrete on low-horsepower walk-behind saws.",
    [("Abrasive-material bond", "Hard bond that survives asphalt and green slabs."),
     ('14" to 36"', "Every diameter and width on one sheet."),
     ("Undercut protection", "Keeps the core alive in abrasive slurry.")], img="Americut Pro Series", saws=["walk"])
new("Prestress Blade", "wet", "pro", dict(pc=5, r=4.5),
    "Prestress plant blades for Elematic, Spancrete and Ultraspan saws.", img="Split Segment Wall Saw Blade", saws=["wall"])
new("Green Concrete 2-Bond", "green", "premium", dict(g=4), "Two-bond early-entry blade for green concrete.", img="Green Kut Green")
new("Skid Plates", "green", "standard", {}, "Replacement skid plates for early-entry saws. Change the plate with the blade.", img="Green Kut Green", saws=["early"])
new("Core Bit Extensions & Adaptors", "core", "standard", {},
    "Extensions, thread adaptors and Hilti adaptors so your bit fits your drill.", img="V-Shape Wet Corebit", saws=["core"])
new("Husqvarna 10.5\" Battery Saw Blades", "highspeed", "premium", dict(b=4, x=4),
    'Masonry and rescue blades for the Husqvarna 10.5" battery saw.', saws=["cutoff"])

# ---------------- 4-Core Pro Series core bits ----------------
fam("Punisher", "pro", dict(r=5, pc=5, c=4.5),
    "Shotcrete, bridge deck, lift stations. When the job is the hardest thing on the schedule, send the Punisher.",
    [("Pro Series segment", "Built for very heavily reinforced concrete. It keeps cutting where other bits glaze and quit."),
     ("Heavy rebar bond", "Chews through steel without stripping segments."),
     ('15", 18" and 24" barrels', "Pick the depth the hole needs.")], cat="core")
fam("Wolv", "pro", dict(r=5, c=5, pc=4.5, s=4.5),
    "The original super core bit. Top-shelf patterned diamond with cobalt and tungsten.",
    [("35/45 mesh patterned diamond", "Every diamond is placed to work. Fast holes from the first inch to the last."),
     ("Cobalt and tungsten bond", "Holds up in reinforced concrete, granite and hard aggregate."),
     ('2" to 9", three barrel lengths', "One bit line for the whole coring truck.")], cat="core")
fam("Sabertooth", "pro", dict(r=5, c=5, a=4, b=4.5, pc=4.5),
    "The highest quality core bit we sell. It performs in every aggregate and every job condition.",
    [("Years of segment R&D", "You stop matching bits to aggregate. This one just works."),
     ("Multi-use bond", "Concrete, block, asphalt. Same bit, same speed."),
     ('15", 18" and 24" barrels', "Covers shallow slabs to deep walls.")], cat="core")
new("Zenesis Green Kut Red", "green", "supreme", dict(g=5), "Zenesis diamond alignment for more footage per blade and chip-free joints.", img="Zenesis Green Kut Purple")
new("Zenesis Green Kut Yellow", "green", "supreme", dict(g=5), "Zenesis diamond alignment for more footage per blade and chip-free joints.", img="Zenesis Green Kut Purple")
