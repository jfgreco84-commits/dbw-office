/* DBW Wisco store settings. Edit this file to change contact info, reps and videos.
   Nothing here needs a rebuild: save, commit, done. */
window.WISCO = {
  // Every order, pricing request and question lands here.
  orderEmail: "fgreco@diamondbladewarehouse.com",
  managerName: "Frank Greco",
  managerTitle: "General Manager of the Wisconsin division",

  // Extra people copied on every emailed order (optional), e.g. ["someone@diamondbladewarehouse.com"].
  alsoCopy: [],
  // Shown next to "Text Frank".
  textDisplay: "(414) 213-0084",
  // Cell that receives texted orders, digits only with country code. "" hides the Text button.
  textNumber: "+14142130084",

  // Optional Formspree form URL (what bestsolutionpolish.com uses). When set, "Send" posts
  // straight to your inbox instead of opening the customer's email app.
  formEndpoint: "",

  // "Pick your salesman". name = the PHONE NAME customers know. photo = file in wisco/brand/reps/ (optional).
  // Replace this list with the real phone-name roster. No real last names unless they sell under them.
  // This is the current roster from the sales board (13 people). Keep it in step with the board.
  // Text a customer  .../wisco/?rep=snacks  and that rep is pre-picked and greets them on the home page.
  // email   = where that rep's orders go. Leave "" and their orders go to orderEmail above.
  // cell    = where "Text it" goes for that rep, digits with country code, e.g. "+14145550100". "" = your cell.
  // manager = that rep's manager's email. They get a copy. You (orderEmail) are always copied.
  // aka     = old nicknames, so links already texted out keep working.
  reps: [
    { name: "Big Frank Greco", photo: "frank.webp", email: "", cell: "", manager: "", aka: ["frank"] },
    { name: "John Anthony", photo: "", email: "janthony@diamondbladewarehouse.com", cell: "+14143630323", manager: "", aka: ["ronny-b"] },
    { name: "Adam West", photo: "batman.webp", email: "awest@diamondbladewarehouse.com", cell: "+14143665237", manager: "", aka: ["batman"] },
    { name: "Adam Misurek", photo: "miz.webp", email: "amisurek@diamondbladewarehouse.com", cell: "+14145207257", manager: "", aka: ["miz"] },
    { name: "Joey “The Stinger” DeRuki", photo: "snacks.webp", email: "jderuki@diamondbladewarehouse.com", cell: "+12629579839", manager: "", aka: ["snacks", "joey-deruki"] },
    { name: "T.J. Sutton", photo: "tj.webp", email: "tsutton@diamondbladewarehouse.com", cell: "+12624200326", manager: "", aka: ["tj"] },
    { name: "JB Baemmert", photo: "", email: "jbaemert@diamondbladewarehouse.com", cell: "+14149168672", manager: "", aka: ["jb", "jb-bammert"] },
    { name: "Rob Redman", photo: "", email: "rredman@diamondbladewarehouse.com", cell: "+14145731192", manager: "", aka: ["cutty"] },
    { name: "Kerry Smith", photo: "", email: "ksmith@diamondbladewarehouse.com", cell: "+14144037004", manager: "", aka: ["kerry"] },
    { name: "Geoff Nurse", photo: "", email: "gnurse@diamondbladewarehouse.com", cell: "+14142544197", manager: "", aka: ["jeff", "geoff"] },
    { name: "Luis Millan", photo: "", email: "lmillan@diamondbladewarehouse.com", cell: "", manager: "", aka: ["luis", "luis-milan"] },
    { name: "Les", photo: "les.webp", email: "lkubeny@diamondbladewarehouse.com", cell: "+14142072487", manager: "", aka: ["les"] }
  ],


  // How the customer wants to pay. No card or bank numbers are ever typed into the site.
  payments: [
    "Net 30 terms",
    "Net 45 terms",
    "Card on file",
    "Call me for a new card",
    "ACH",
    "Check by phone",
    "Not sure, have my rep call"
  ],

  // Quantity price breaks a customer can ask for.
  breaks: [12, 24, 36, 50, 100, 150, 200, 500],
  // The quantity buttons on Fast Reorder.
  quickQty: [12, 24, 36, 50, 100],
  // Walk-behind saws at or under this horsepower get the low-horsepower blades in Blade Finder.
  lowHpMax: 20,
  // Account levels, lowest to highest.
  levels: ["Contractor", "Pro", "Gold", "Distributor", "Platinum"],
  // Months (1 = January) when mix and match pricing applies. Every other month it takes
  // singleItemMin of one item to get special pricing.
  mixMonths: [3, 5, 8, 10],
  singleItemMin: 24,

  // What a customer can ask to have checked from the pricing button.
  discounts: [
    "My account-level pricing",
    "Quantity price breaks",
    "Platinum account pricing",
    "A saw package (blades plus a saw)",
    "I want to open an account"
  ],

  // Rewards. Change the wording here and it changes everywhere on the site.
  rewards: {
    review: "10% off your next order",       // for leaving an honest review, good or bad
    referrer: "a free blade"                 // what the person who referred a new customer earns
  },

  // Real customer quotes only. Add them as { quote: "...", who: "Name, Company, City ST" }.
  // The section stays hidden until there is at least one.
  testimonials: [
  ],

  // Official product flyers (PDF). Key = product id (the part after #blade- in its link), value = the flyer link.
  // Only add a flyer that exists. A product with no entry shows no flyer button.
  flyers: {
    "dr-schulze-d160v-drill-stand": "https://www.diamondbladewarehouse.com/storage/app/media/blade%20flyers/D160V%20Drill%20Stand%20Flyer.pdf",
    "dr-schulze-d350r-drill-stand": "https://www.diamondbladewarehouse.com/storage/app/media/blade%20flyers/D350R%20Drill%20Stand%20Flyer.pdf",
    "dr-schulze-dk-32": "https://www.diamondbladewarehouse.com/storage/app/media/blade%20flyers/DK%2032%20Core%20Drill%20Flyer.pdf"
  },

  // Blade videos. Key = blade id (the part after #blade- in its link), value = YouTube link.
  videos: {
  }
};
