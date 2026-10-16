import { generateQuestions } from "../engine/index.js";
import { U } from "../engine/index.js";
import { dayKey } from "../lib/format.js";

export const areaOf = (section) => (section.startsWith("QA") ? "Quant" : section === "VARC" ? "VARC" : "LR");
export const topicGroup = (topic) => topic.split(" · ")[0];
export const topicShort = (topic) => topic.split(" · ").slice(1).join(" · ") || topic;

/** Compact record of one attempted question. */
export function toAttempt(q, a, ts) {
  let picked = a.value, reason = "";
  if (!a.correct) {
    const hit = q.trap_analysis.find((t) => String(t.option) === String(a.value));
    reason = hit ? hit.reason : "Not one of the common distractors, so this is likely a slip in the working.";
  }
  return {
    id: q.question_id + ":" + ts, qid: q.question_id, ts, section: q.section, area: areaOf(q.section),
    topic: q.topic, difficulty: q.difficulty, correct: !!a.correct, timeSec: Math.round(a.timeSec), avgSec: q.avg_time_sec,
    picked: String(picked), answer: String(q.correct_answer), text: q.question_text.replace(/\*\*/g, "").replace(/\s+/g, " ").slice(0, 170),
    reason, hints: a.hints,
  };
}

/** Deterministic sample history so charts are populated on first load. Always flagged sample:true. */
export function seedHistory(now = Date.now()) {
  const R = U.rng(20261016);
  const DAY = 86400000;
  const mix = [["QA-MCQ", "Mixed", 0.34], ["QA-SAQ", "Mixed", 0.14], ["VARC-RC", "Reading Comprehension", 0.14], ["VARC-VOC", "Vocabulary", 0.07], ["VARC-PJ", "Para Jumbles", 0.07], ["LR", "Mixed", 0.24]];
  const base = { "QA-MCQ": 0.6, "QA-SAQ": 0.48, VARC: 0.72, LR: 0.66 };
  const out = [];
  for (let back = 0; back < 28; back++) {
    if (back === 12) continue; // a gap, so the sample streak is exactly 12 days
    const n = back < 12 ? R.int(7, 12) : R.int(0, 6);
    for (let i = 0; i < n; i++) {
      let r = R.f(), pick = mix[0];
      for (const m of mix) { if (r < m[2]) { pick = m; break; } r -= m[2]; }
      const d = R.pick([2, 3, 3, 4, 2]);
      const q = generateQuestions({ section: pick[0], topic: pick[1], difficulty: d, count: 1, seed: R.int(1, 1e9) })[0];
      if (!q) continue;
      const ts = now - back * DAY - R.int(0, 9 * 3600000) - 1800000;
      if (back === 0 && ts > now) continue;
      const p = Math.min(0.92, Math.max(0.2, (base[q.section] ?? 0.66) + (28 - back) * 0.004 - (d - 2) * 0.09));
      const correct = R.f() < p;
      const timeSec = Math.round(q.avg_time_sec * (correct ? 0.55 + R.f() * 0.75 : 0.8 + R.f() * 1.1));
      let value = q.correct_answer;
      if (!correct) {
        const t = q.trap_analysis.length ? R.pick(q.trap_analysis) : null;
        value = t ? t.option : String(Number(q.correct_answer) + 1 || "0");
      }
      const att = toAttempt(q, { value, correct, timeSec, hints: R.chance(0.2) ? 1 : 0 }, ts);
      att.sample = true;
      out.push(att);
    }
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export function streakOf(history, now = Date.now()) {
  const days = new Set(history.map((h) => dayKey(h.ts)));
  let streak = 0, d = now;
  const today = days.has(dayKey(now));
  if (!today) d -= 86400000;
  while (days.has(dayKey(d))) { streak++; d -= 86400000; }
  return { streak, today };
}

export function summarize(history) {
  const acc = (arr) => (arr.length ? arr.filter((h) => h.correct).length / arr.length : 0);
  const group = (key) => {
    const m = new Map();
    history.forEach((h) => { const k = key(h); if (!m.has(k)) m.set(k, []); m.get(k).push(h); });
    return [...m.entries()].map(([name, arr]) => ({ name, n: arr.length, acc: acc(arr), time: arr.reduce((t, h) => t + h.timeSec, 0) / arr.length, avg: arr.reduce((t, h) => t + h.avgSec, 0) / arr.length }));
  };
  return {
    n: history.length, acc: acc(history),
    byArea: group((h) => h.area), byTopic: group((h) => h.topic).sort((a, b) => a.acc - b.acc),
    timeRatio: history.length ? history.reduce((t, h) => t + h.timeSec, 0) / Math.max(1, history.reduce((t, h) => t + h.avgSec, 0)) : 0,
    totalMinutes: Math.round(history.reduce((t, h) => t + h.timeSec, 0) / 60),
  };
}

export function accuracyByDay(history, days = 14, now = Date.now()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = now - i * 86400000, k = dayKey(ts);
    const arr = history.filter((h) => dayKey(h.ts) === k);
    out.push({ ts, n: arr.length, acc: arr.length ? Math.round((arr.filter((h) => h.correct).length / arr.length) * 100) : null });
  }
  return out;
}

/** Which generator config reproduces a topic label like "Algebra · Roots of a quadratic"? */
export function configForTopic(topic, mode = "mcq") {
  const [g, sub = ""] = topic.split(" · ");
  const QA = ["Algebra", "Number Systems", "Arithmetic", "Modern Math", "Geometry"];
  if (QA.includes(g)) return { section: mode === "saq" ? "QA-SAQ" : "QA-MCQ", topic: g, label: g };
  if (g === "Logical Reasoning") return { section: "LR", topic: sub.startsWith("Critical Reasoning") ? "Critical Reasoning" : sub, label: sub.replace(/ \(.*\)/, "") };
  if (sub.startsWith("Reading")) return { section: "VARC-RC", topic: "Reading Comprehension", label: "Reading Comprehension" };
  if (sub.startsWith("Para")) return { section: "VARC-PJ", topic: "Para Jumbles", label: "Para Jumbles" };
  return { section: "VARC-VOC", topic: "Vocabulary", label: "Vocabulary" };
}
