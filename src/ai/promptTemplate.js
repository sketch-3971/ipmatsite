import { QUESTION_SCHEMA } from "./schema.js";

const LEVELS = {
  1: "Easy: single-concept, direct application, under a minute for a prepared student.",
  2: "Moderate: two-step reasoning, standard patterns.",
  3: "IPMAT Standard (High): the pitch of IPMAT Indore / Rohtak, with at least one non-obvious step.",
  4: "CAT Level (Advanced): multi-concept, trap-heavy, needs a clean method under time pressure.",
};

/** Builds the prompt that would be sent to an LLM. The built-in engine produces
 *  the same JSON shape locally, so swapping in a real model only means calling
 *  your API with this prompt and running the reply through validateQuestion(). */
export function buildPrompt({ section, topic, difficulty, count, label }) {
  return [
    "SYSTEM",
    "You are an item writer for the IPMAT (Indore, Rohtak) and JIPMAT entrance exams.",
    "Return ONLY a JSON array. No prose, no code fences.",
    "Every item must follow this schema exactly:",
    JSON.stringify(QUESTION_SCHEMA, null, 2),
    "",
    "Rules",
    "- Exactly one correct answer. Verify it by solving the problem independently before you output it.",
    "- Each distractor must be the result of a specific, named mistake (sign slip, wrong formula, partial work).",
    "- trap_analysis must name the mistake behind every distractor.",
    "- solution_steps must be short, ordered, and checkable line by line.",
    "- hints go from a nudge to a method pointer. Never reveal the final answer.",
    "- QA-SAQ answers are integers (IPMAT Indore short answer: no options, no negative marking).",
    "",
    "USER",
    `Section: ${label || section}`,
    `Sub-topic: ${topic}`,
    `Difficulty ${difficulty}/4: ${LEVELS[difficulty]}`,
    `Number of questions: ${count}`,
  ].join("\n");
}
