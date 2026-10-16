/* Sample catalogue. Section structures follow the commonly published patterns;
   confirm against the current official brochure before using them for real. */
const INDORE = [
  { name: "Quantitative Ability (short answer)", q: 15, min: 40, marking: "+4 / 0" },
  { name: "Quantitative Ability (MCQ)", q: 15, min: 40, marking: "+4 / −1" },
  { name: "Verbal Ability (VARC)", q: 45, min: 40, marking: "+4 / −1" },
];
const ROHTAK = [
  { name: "Quantitative Ability", q: 40, min: 50, marking: "+4 / −1" },
  { name: "Logical Reasoning", q: 20, min: 25, marking: "+4 / −1" },
  { name: "Verbal Ability", q: 40, min: 45, marking: "+4 / −1" },
];
const JIPMAT = [
  { name: "Quantitative Aptitude", q: 33, min: 40, marking: "+4 / −1" },
  { name: "Data Interpretation & LR", q: 33, min: 40, marking: "+4 / −1" },
  { name: "Verbal Ability & RC", q: 34, min: 40, marking: "+4 / −1" },
];
const total = (s, k) => s.reduce((a, b) => a + b[k], 0);
const mk = (o) => ({ ...o, questions: total(o.sections, "q"), minutes: total(o.sections, "min") });

export const MOCKS = [
  mk({ id: "indore-08", exam: "indore", title: "IPMAT Indore Mock 08", status: "live", sections: INDORE, tag: "All-India live window", closes: "Closes Sunday, 11:59 PM", takers: 2814 }),
  mk({ id: "indore-07", exam: "indore", title: "IPMAT Indore Mock 07", status: "in_progress", sections: INDORE, progress: { answered: 38, minutesLeft: 52 } }),
  mk({ id: "indore-06", exam: "indore", title: "IPMAT Indore Mock 06", status: "completed", sections: INDORE, score: 212, outOf: 300, percentile: 91.4, rank: 248 }),
  mk({ id: "indore-05", exam: "indore", title: "IPMAT Indore Mock 05", status: "completed", sections: INDORE, score: 188, outOf: 300, percentile: 84.9, rank: 462 }),
  mk({ id: "indore-09", exam: "indore", title: "IPMAT Indore Mock 09", status: "not_started", sections: INDORE }),
  mk({ id: "rohtak-04", exam: "rohtak", title: "IPMAT Rohtak Mock 04", status: "live", sections: ROHTAK, tag: "Live this week", closes: "Closes Saturday, 9:00 PM", takers: 1320 }),
  mk({ id: "rohtak-03", exam: "rohtak", title: "IPMAT Rohtak Mock 03", status: "completed", sections: ROHTAK, score: 236, outOf: 400, percentile: 88.2, rank: 331 }),
  mk({ id: "rohtak-05", exam: "rohtak", title: "IPMAT Rohtak Mock 05", status: "not_started", sections: ROHTAK }),
  mk({ id: "jipmat-02", exam: "jipmat", title: "JIPMAT Mock 02", status: "completed", sections: JIPMAT, score: 201, outOf: 400, percentile: 79.5, rank: 902 }),
  mk({ id: "jipmat-03", exam: "jipmat", title: "JIPMAT Mock 03", status: "not_started", sections: JIPMAT }),
  mk({ id: "sec-indore-qa", exam: "indore", title: "Indore Sectional: Quant (SAQ + MCQ)", status: "not_started", sections: INDORE.slice(0, 2), sectional: true }),
  mk({ id: "sec-indore-varc", exam: "indore", title: "Indore Sectional: VARC", status: "not_started", sections: INDORE.slice(2), sectional: true }),
];

export const MOCK_FILTERS = [
  { id: "all", label: "All" },
  { id: "indore", label: "IPMAT Indore" },
  { id: "rohtak", label: "IPMAT Rohtak" },
  { id: "jipmat", label: "JIPMAT" },
];
export const EXAM_LABEL = { indore: "Indore", rohtak: "Rohtak", jipmat: "JIPMAT" };
