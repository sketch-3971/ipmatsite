import { generateQuestions } from "../engine/index.js";
import { buildPrompt } from "./promptTemplate.js";
import { validateQuestion } from "./schema.js";

export const STAGES = [
  { key: "plan", label: "Choosing concepts for your topic and level", ms: 420 },
  { key: "draft", label: "Drafting questions and distractors", ms: 620 },
  { key: "verify", label: "Verifying answers and checking the schema", ms: 480 },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** config: { section, topic, difficulty, count, label }  (section is an engine code such as "QA-MCQ" or "VARC-RC") */
export async function generateSet(config, onStage = () => {}) {
  const prompt = buildPrompt(config);
  const out = { questions: [], prompt, issues: [], seed: null };
  onStage(0);
  await wait(STAGES[0].ms);
  onStage(1);
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  let qs = generateQuestions({ ...config, seed });
  await wait(STAGES[1].ms);
  onStage(2);
  // Verification pass: drop anything that fails the schema, then top up once.
  const keep = (list) => list.filter((q) => { const e = validateQuestion(q); if (e.length) out.issues.push({ id: q.question_id, errors: e }); return !e.length; });
  qs = keep(qs);
  if (qs.length < config.count) qs = qs.concat(keep(generateQuestions({ ...config, seed: seed + 1 })).filter((q) => !qs.some((x) => x.question_text === q.question_text)).slice(0, config.count - qs.length));
  await wait(STAGES[2].ms);
  out.questions = qs.slice(0, config.count);
  out.seed = seed;
  return out;
}

/** A mixed set (used by mock samples and daily sets): parts = [{section, topic, difficulty, count}] */
export async function generateMixed(parts, onStage = () => {}) {
  onStage(0); await wait(300); onStage(1);
  let questions = [], issues = [];
  parts.forEach((p, i) => {
    const qs = generateQuestions({ ...p, seed: ((Date.now() >>> 0) + i * 977) >>> 0 });
    qs.forEach((q) => { const e = validateQuestion(q); if (e.length) issues.push({ id: q.question_id, errors: e }); else questions.push(q); });
  });
  onStage(2); await wait(300);
  return { questions, issues, prompt: parts.map((p) => buildPrompt({ ...p, label: p.section })).join("\n\n---\n\n"), seed: null };
}

/** Deterministic daily set so "Today's Daily RC" is the same all day. */
export function generateDaily(section, count, dayKey, hash) {
  const seed = hash(section + dayKey);
  return generateQuestions({ section, topic: section === "VARC-RC" ? "Reading Comprehension" : "Mixed", difficulty: 3, count, seed });
}
