/* DBW Wisco store settings. Edit this file to change contact info, reps and videos.
   Nothing here needs a rebuild: save, commit, done. */
window.WISCO = {
  // Every order, pricing request and question lands here.
  orderEmail: "fgreco@diamondbladewarehouse.com",
  managerName: "Frank Greco",
  managerTitle: "General Sales Manager",

  // Shown on the site as the number to call. Tap-to-call on phones.
  phone: "(800) 325-2337",
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
  reps: [
    { name: "Frank", photo: "frank.webp" },
    { name: "Ronny B", photo: "" },
    { name: "Batman", photo: "" },
    { name: "Miz", photo: "" },
    { name: "Snacks", photo: "" },
    { name: "TJ", photo: "" },
    { name: "JB", photo: "" },
    { name: "Cutty", photo: "" },
    { name: "Kerry", photo: "" },
    { name: "Cassie", photo: "" },
    { name: "Luis", photo: "" },
    { name: "Les", photo: "" },
    { name: "Jeff", photo: "" }
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
  breaks: [6, 12, 25, 36, 50, 100, 200, 500],

  // What a customer can ask to have checked from the pricing button.
  discounts: [
    "My account-level pricing",
    "Quantity price breaks",
    "Platinum account pricing",
    "A saw deal (blades + free saw)",
    "I want to open an account"
  ],

  // Real customer quotes only. Add them as { quote: "...", who: "Name, Company, City ST" }.
  // The section stays hidden until there is at least one.
  testimonials: [
  ],

  // Blade videos. Key = blade id (the part after #blade- in its link), value = YouTube link.
  videos: {
  }
};
