/* Each sub-topic binds to a generator: { section, topic } as understood by engine/index.js */
const q = (name, topic, blurb, base) => ({ name, topic, blurb, base, kind: "QA" });

export const TOPIC_GROUPS = [
  {
    id: "quant", title: "Quantitative Ability", tone: "accent", saq: true,
    items: [
      q("Algebra", "Algebra", "Quadratics, simultaneous equations, modulus and inequalities", 64),
      q("Number Systems", "Number Systems", "Remainders, cyclicity, factors and trailing zeros", 58),
      q("Arithmetic", "Arithmetic", "Profit and loss, time and work, mixtures, interest, boats", 72),
      q("Modern & Higher Math", "Modern Math", "Permutations, probability, sequences and series, logarithms", 49),
      q("Geometry", "Geometry", "Triangles, circles, chords and inradius", 55),
    ],
  },
  {
    id: "varc", title: "Verbal Ability (VARC)", tone: "mint",
    items: [
      { name: "Reading Comprehension", section: "VARC-RC", topic: "Reading Comprehension", blurb: "Main idea, inference, tone and detail questions", base: 70 },
      { name: "Para Jumbles", section: "VARC-PJ", topic: "Para Jumbles", blurb: "Opener, links and closers in five-sentence sets", base: 61 },
      { name: "Vocabulary", section: "VARC-VOC", topic: "Vocabulary", blurb: "Meaning in context and antonyms", base: 77 },
    ],
  },
  {
    id: "lr", title: "Logical Reasoning", tone: "amber",
    items: [
      { name: "Number Series", section: "LR", topic: "Number series", blurb: "Differences, ratios and interleaved patterns", base: 74 },
      { name: "Coding–Decoding", section: "LR", topic: "Coding–decoding", blurb: "Letter shifts and word codes", base: 69 },
      { name: "Direction Sense", section: "LR", topic: "Direction sense", blurb: "Turns, distances and final bearing", base: 66 },
      { name: "Syllogisms", section: "LR", topic: "Syllogisms", blurb: "Definite conclusions from statements", base: 52 },
      { name: "Ranking & Ordering", section: "LR", topic: "Ranking & ordering", blurb: "Positions from the front and back", base: 63 },
      { name: "Blood Relations", section: "LR", topic: "Blood relations", blurb: "Chains of relationships", base: 68 },
      { name: "Critical Reasoning", section: "LR", topic: "Critical Reasoning", blurb: "Strengthen, weaken, assumption, flaw, paradox", base: 45 },
    ],
  },
];

export const LEVELS = [
  { level: 1, label: "Level 1", name: "Easy" },
  { level: 2, label: "Level 2", name: "Moderate" },
  { level: 3, label: "Level 3", name: "IPMAT Standard" },
  { level: 4, label: "Level 4", name: "CAT Level" },
];

/* Sample progress per sub-topic and level: [attempted, correct] */
