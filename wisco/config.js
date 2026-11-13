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
  reps: [
    { name: "Frank", photo: "frank.webp", email: "", cell: "", manager: "" },
    { name: "Ronny B", photo: "", email: "", cell: "", manager: "" },
    { name: "Batman", photo: "batman.webp", email: "", cell: "", manager: "" },
    { name: "Miz", photo: "miz.webp", email: "", cell: "", manager: "" },
    { name: "Snacks", photo: "snacks.webp", email: "", cell: "", manager: "" },
    { name: "TJ", photo: "tj.webp", email: "", cell: "", manager: "" },
    { name: "JB", photo: "", email: "", cell: "", manager: "" },
    { name: "Cutty", photo: "", email: "", cell: "", manager: "" },
    { name: "Kerry", photo: "", email: "", cell: "", manager: "" },
    { name: "Cassie", photo: "cassie.webp", email: "", cell: "", manager: "" },
    { name: "Luis", photo: "", email: "", cell: "", manager: "" },
    { name: "Les", photo: "les.webp", email: "", cell: "", manager: "" },
    { name: "Jeff", photo: "jeff.webp", email: "", cell: "", manager: "" }
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
  breaks: [12, 25, 36, 50, 100, 200],
  // Months (1 = January) when mix and match pricing applies. Every other month it takes
  // singleItemMin of one item to get special pricing.
  mixMonths: [3, 5, 8, 10],
  singleItemMin: 25,

  // What a customer can ask to have checked from the pricing button.
  discounts: [
    "My account-level pricing",
    "Quantity price breaks",
    "Platinum account pricing",
    "A saw deal (blades + free saw)",
    "I want to open an account"
  ],

  // Rewards. Change the wording here and it changes everywhere on the site.
  rewards: {
    review: "10% off your next order",       // for leaving an honest review, good or bad
    referrer: "10% off their next order"     // what the person who referred a new customer earns
  },

  // Real customer quotes only. Add them as { quote: "...", who: "Name, Company, City ST" }.
  // The section stays hidden until there is at least one.
  testimonials: [
  ],

  // Blade videos. Key = blade id (the part after #blade- in its link), value = YouTube link.
  videos: {
  }
};
