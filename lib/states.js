export const STATES = [
  {
    id: "driving-to-restaurant",
    label: "Driving to restaurant (My parents)",
    shortLabel: "To parents",
    message: "En route to the restaurant. Also known as mom and dad's house.",
    eta: "~45 min",
    progress: 0,
    emoji: "🚗",
  },
  {
    id: "eating-obligatory-food",
    label: "Eating obligatory food",
    shortLabel: "Obligatory food",
    message: "Politely finishing whatever was already on the table.",
    eta: "~35 min",
    progress: 14,
    emoji: "🥗",
  },
  {
    id: "making-small-talk",
    label: "Making small talk",
    shortLabel: "Small talk",
    message: "Weather, neighbors, and at least one story you've heard before.",
    eta: "~28 min",
    progress: 29,
    emoji: "💬",
  },
  {
    id: "packaging-food",
    label: "Packaging food",
    shortLabel: "Packaging",
    message: "The pizza is finally getting boxed up for the road.",
    eta: "~20 min",
    progress: 43,
    emoji: "📦",
  },
  {
    id: "midwestern-goodbye",
    label: "Midwestern goodbye",
    shortLabel: "Goodbye",
    message: "Standing in the doorway. Saying goodbye again. Almost leaving.",
    eta: "~15 min",
    progress: 57,
    emoji: "👋",
  },
  {
    id: "driving-home",
    label: "Driving home",
    shortLabel: "Driving home",
    message: "Back in the car. Pizza warming on the passenger seat.",
    eta: "~10 min",
    progress: 71,
    emoji: "🏠",
  },
  {
    id: "driving-to-your-place",
    label: "Driving to your place",
    shortLabel: "To you",
    message: "Final stretch. Your pizza is officially out for delivery.",
    eta: "~5 min",
    progress: 86,
    emoji: "🍕",
  },
  {
    id: "arriving-soon",
    label: "Arriving any minute now",
    shortLabel: "Almost there",
    message: "Pulling up now. Get the door!",
    eta: "Any minute",
    progress: 100,
    emoji: "⏰",
  },
];

export const DEFAULT_STATE_ID = STATES[0].id;

export const ALIASES = {
  1: "driving-to-restaurant",
  2: "eating-obligatory-food",
  3: "making-small-talk",
  4: "packaging-food",
  5: "midwestern-goodbye",
  6: "driving-home",
  7: "driving-to-your-place",
  8: "arriving-soon",
  parents: "driving-to-restaurant",
  restaurant: "driving-to-restaurant",
  food: "eating-obligatory-food",
  talk: "making-small-talk",
  package: "packaging-food",
  packaging: "packaging-food",
  goodbye: "midwestern-goodbye",
  home: "driving-home",
  delivery: "driving-to-your-place",
  arriving: "arriving-soon",
  soon: "arriving-soon",
};

export function normalizeStateId(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return null;

  if (ALIASES[value]) return ALIASES[value];

  const match = STATES.find(
    (state) =>
      state.id === value ||
      state.label.toLowerCase() === value ||
      state.shortLabel.toLowerCase() === value
  );

  return match?.id ?? null;
}

export function getStateById(stateId) {
  return STATES.find((state) => state.id === stateId) ?? STATES[0];
}
