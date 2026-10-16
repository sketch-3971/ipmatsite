/* The contract every generated question must satisfy, whether it comes from the
   built-in engine or from a real LLM call. */
export const QUESTION_SCHEMA = {
  question_id: "string, unique, e.g. QA-MCQ-1k3f9-01",
  section: '"QA-MCQ" | "QA-SAQ" | "VARC" | "LR"',
  topic: "string, specific concept tag",
  difficulty: "integer 1-4 (1 Easy, 2 Moderate, 3 IPMAT Standard, 4 CAT Level)",
  question_text: "string, Markdown; math as plain symbols or $LaTeX$",
  options: "array of exactly 4 strings for MCQ-style sections; [] for QA-SAQ",
  correct_answer: "string; for QA-SAQ an integer in string form; for MCQ exactly one of options",
  solution_steps: "array of strings in chronological order",
  trap_analysis: "array of { option, reason } explaining why each distractor tempts and fails",
  hints: "array of 2-3 graduated hints; the last must not state the answer",
  avg_time_sec: "integer, benchmark time in seconds",
};

export const SECTION_CODES = ["QA-MCQ", "QA-SAQ", "VARC", "LR"];

export function validateQuestion(q) {
  const e = [];
  const need = (k) => { if (q[k] === undefined || q[k] === null || q[k] === "") e.push(`missing ${k}`); };
  ["question_id", "section", "topic", "difficulty", "question_text", "correct_answer", "solution_steps", "trap_analysis"].forEach(need);
  if (!SECTION_CODES.includes(q.section)) e.push("bad section");
  if (!(q.difficulty >= 1 && q.difficulty <= 4)) e.push("difficulty out of range");
  if (q.section === "QA-SAQ") {
    if (!/^-?\d+$/.test(String(q.correct_answer))) e.push("SAQ answer must be an integer");
  } else {
    if (!Array.isArray(q.options) || q.options.length !== 4) e.push("MCQ needs 4 options");
    else {
      if (!q.options.includes(q.correct_answer)) e.push("correct_answer not among options");
      if (new Set(q.options).size !== 4) e.push("duplicate options");
    }
  }
  if (!Array.isArray(q.solution_steps) || !q.solution_steps.length) e.push("no solution steps");
  if (!Array.isArray(q.hints) || q.hints.length < 2) e.push("needs at least 2 hints");
  return e;
}
