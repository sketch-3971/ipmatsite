/* Sample catalogue. Question content in this demo is generated, not the official paper text. */
const row = (exam, year, difficulty, questions, minutes, solved, shift = "") => ({ id: `${exam}-${year}${shift}`, exam, year, difficulty, questions, minutes, solved, shift });
export const PYPS = [
  row("indore", 2025, "Hard", 75, 120, 0), row("indore", 2024, "Moderate", 75, 120, 100), row("indore", 2023, "Moderate", 75, 120, 100),
  row("indore", 2022, "Hard", 75, 120, 64), row("indore", 2021, "Easy", 75, 120, 100), row("indore", 2020, "Moderate", 75, 120, 0), row("indore", 2019, "Easy", 75, 120, 0),
  row("rohtak", 2025, "Moderate", 100, 120, 0), row("rohtak", 2024, "Hard", 100, 120, 40), row("rohtak", 2023, "Moderate", 100, 120, 100), row("rohtak", 2022, "Easy", 100, 120, 0),
  row("jipmat", 2025, "Moderate", 100, 120, 0), row("jipmat", 2024, "Easy", 100, 120, 100), row("jipmat", 2023, "Moderate", 100, 120, 55), row("jipmat", 2022, "Hard", 100, 120, 0),
];

export const SYLLABUS = [
  { id: "qa", title: "Quantitative Ability", weight: "Indore: 30 of 75 questions", topics: [
    ["Number Systems", ["Divisibility and remainders", "Cyclicity of units digits", "Factors, HCF and LCM", "Trailing zeros and factorial powers"]],
    ["Algebra", ["Quadratics and roots", "Simultaneous equations", "Inequalities and modulus", "Functions and graphs"]],
    ["Arithmetic", ["Percentages, profit and loss", "Ratio, mixtures and alligation", "Time, speed, distance, work", "Simple and compound interest"]],
    ["Modern Math", ["Permutations and combinations", "Probability", "Sequences and series", "Logarithms and surds"]],
    ["Geometry & Mensuration", ["Triangles and similarity", "Circles and chords", "Coordinate geometry basics", "Areas and volumes"]],
  ] },
  { id: "varc", title: "Verbal Ability and Reading Comprehension", weight: "Indore: 45 of 75 questions", topics: [
    ["Reading Comprehension", ["Main idea and tone", "Inference and implication", "Vocabulary in context", "Passage structure"]],
    ["Verbal Ability", ["Para jumbles", "Sentence completion", "Grammar and usage", "Synonyms and antonyms"]],
  ] },
  { id: "lr", title: "Logical Reasoning", weight: "Rohtak: 20 of 100 questions", topics: [
    ["Verbal Logic", ["Syllogisms", "Critical reasoning", "Blood relations"]],
    ["Analytical Logic", ["Number series", "Coding–decoding", "Direction sense", "Ranking and ordering"]],
  ] },
];
