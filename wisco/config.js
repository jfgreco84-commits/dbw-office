/* DBW Wisco store settings. Edit this file to change contact info, reps and videos.
   Nothing here needs a rebuild: save, commit, done. */
window.WISCO = {
  // Where orders and pricing requests go
  orderEmail: "fgreco@diamondbladewarehouse.com",
  managerName: "Frank Greco",
  managerTitle: "General Sales Manager",

  // Shown on the site as the number to call. Tap-to-call on phones.
  phone: "(800) 325-2337",
  // Shown next to "Text Frank".
  textDisplay: "(414) 213-0084",

  // Cell number that receives TEXTED orders, digits only with country code, e.g. "+14145551234".
  // Leave "" to hide the "Text my order" button.
  textNumber: "+14142130084",

  // Optional: a Formspree form URL (same service bestsolutionpolish.com uses), e.g. "https://formspree.io/f/abcdwxyz".
  // When set, "Send order" posts straight to your inbox instead of opening the customer's email app.
  formEndpoint: "",

  // Sales reps. Add each rep's email and their orders CC them directly.
  // A rep with no email still shows in the list: the order goes to orderEmail with their name on it.
  // Text a customer  .../wisco/?rep=adam-misurek  and that rep is pre-selected.
  reps: [
    { name: "Adam Misurek", email: "" },
    { name: "Adam West", email: "" },
    { name: "Anessa Balistreri", email: "" },
    { name: "Anthony Sutton", email: "" },
    { name: "Cassie Kolhouse", email: "" },
    { name: "Chris Kussrow", email: "" },
    { name: "Geoff Nurse", email: "" },
    { name: "John Baemmert", email: "" },
    { name: "Kerry Smith", email: "" },
    { name: "Leslie Kubeny", email: "" },
    { name: "Luis Millan", email: "" },
    { name: "Paul Zillette", email: "" },
    { name: "Ronald Bonich", email: "" },
    { name: "Scott Toporsh", email: "" }
  ],

  // The discount types a customer can ask for from the pricing button.
  discounts: [
    "My account-level pricing",
    "Quantity break on this order",
    "Platinum account pricing",
    "Package deal (blades + saw)",
    "I want to open an account"
  ],

  // Blade videos. Key = the blade's id (the part after #blade- in its link), value = YouTube link.
  // Example:  "super-g": "https://www.youtube.com/watch?v=XXXXXXXXXXX"
  videos: {
  }
};
