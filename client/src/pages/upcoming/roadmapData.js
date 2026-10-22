// Roadmap content for OUR, the fare-comparison platform. Edit here without touching the page component.
// Statuses are deliberately conservative: nothing below is claimed to be live.
// OUR’S (the planned Tier-3 booking product) has its own page at /ours.

export const AVAILABLE_TODAY = [
  {
    icon: "pin",
    title: "Route search on a map",
    text: "Choose pickup and drop points with location search and see the route on an OpenStreetMap-based map.",
  },
  {
    icon: "check",
    title: "Secure accounts",
    text: "Sign up with email verification, sign in with email or Google, and reset your password with a one-time code.",
  },
  {
    icon: "clock",
    title: "Saved searches",
    text: "Your ride searches are stored against your account.",
  },
  {
    icon: "layers",
    title: "Provider comparison view",
    text: "Ola, Uber and Rapido cards show only figures the app actually has. Estimates and demo data are labelled as such.",
  },
];

export const CAPABILITIES = [
  {
    id: "cities",
    icon: "search",
    status: "Planned",
    title: "Wider Tier-2 coverage",
    summary:
      "Bring ride comparison to more Tier-2 cities, adapted to which providers operate there.",
    points: [
      "Location-aware ride discovery for more cities",
      "Comparison adapted to local provider availability",
      "Cities added gradually, based on demand and data availability",
      "Affordability, transparency and ease of use come first",
    ],
  },
  {
    id: "fares",
    icon: "activity",
    status: "Exploring",
    title: "Smarter fare intelligence",
    summary:
      "Help riders understand fares over time, once enough real historical data exists to do it responsibly.",
    points: [
      "Historical fare trends and cross-provider, cross-category comparison",
      "Fare alerts and potential-savings insights",
      "Demand-aware travel suggestions",
      "Quotes, estimates and demo data always shown as distinct things",
    ],
    note: "These are not live forecasts. No prediction will be presented as accurate until it has been validated.",
  },
  {
    id: "ai",
    icon: "users",
    status: "Exploring",
    title: "AI-powered ride recommendations",
    summary:
      "Suggest suitable options from price, estimated travel time and personal preference.",
    points: [
      "Personalised comparison and decision assistance",
      "Explainable suggestions that show why an option is recommended",
      "Travel-pattern insights where they genuinely help",
    ],
    note: "Planned only. Not available until it has been built and validated.",
  },
  {
    id: "providers",
    icon: "car",
    status: "Exploring",
    title: "Expanded provider coverage",
    summary:
      "Cover more ride categories and providers in the comparison, where official access is available.",
    points: [
      "Additional providers, subject to feasibility",
      "Provider APIs and deep links where permitted",
      "Better coverage of supported ride categories",
    ],
    note: "No new provider partnership, API access or commercial agreement is implied by this roadmap.",
  },
  {
    id: "accuracy",
    icon: "receipt",
    status: "Planned",
    title: "Accuracy & transparency",
    summary: "Make it clearer where every number in a comparison comes from.",
    points: [
      "Clear separation of provider quotes, estimates and demo data",
      "More transparent comparison information",
      "Measuring how reliable comparisons are",
    ],
  },
  {
    id: "platform",
    icon: "home",
    status: "Planned",
    title: "Platform improvements",
    summary: "Make OUR faster, clearer and usable by more people.",
    points: [
      "Accessibility improvements",
      "Performance work and low-bandwidth support",
      "Multilingual interface for users in different cities",
      "Better mobile usability",
    ],
  },
];

export const PHASES = [
  {
    id: "p1",
    label: "Phase 1",
    title: "Strengthen the core",
    points: [
      "Stabilise the current comparison flow",
      "Improve provider coverage and estimate transparency",
      "Validate with clearly labelled test data where needed",
      "Measure comparison reliability and user experience",
    ],
  },
  {
    id: "p2",
    label: "Phase 2",
    title: "Expand Tier-2 coverage",
    points: [
      "Shortlist candidate Tier-2 cities by demand, provider coverage and data availability",
      "Validate location search, routes and provider coverage per city",
      "Show city availability only when backed by real application data",
      "Expand gradually, never claiming universal coverage",
    ],
  },
  {
    id: "p3",
    label: "Phase 3",
    title: "Localise the experience",
    points: [
      "Local-language accessibility",
      "Interface adapted to local usage patterns",
      "Optimised for mobile networks and budget devices",
      "Better discovery of relevant ride categories",
    ],
  },
  {
    id: "p4",
    label: "Phase 4",
    title: "Build smarter insights",
    points: [
      "Develop fare intelligence from validated historical data",
      "Evaluate recommendation quality before release",
      "Improve comparison transparency using user feedback",
    ],
  },
];
