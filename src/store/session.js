/* Pure session state machine for the practice arena. All timestamps are passed in. */
export const isMCQ = (q) => q.section !== "QA-SAQ";

export function checkAnswer(q, value) {
  if (value === "" || value === null || value === undefined) return false;
  if (!isMCQ(q)) return Number(String(value).replace("−", "-")) === Number(String(q.correct_answer).replace("−", "-"));
  return value === q.correct_answer;
}

export function newSession({ questions, config, meta, title }, now = Date.now()) {
  return {
    id: `s-${now.toString(36)}`,
    title, config, meta, questions,
    index: 0, activeSince: now, startedAt: now, finishedAt: null,
    answers: questions.map(() => ({ value: "", submitted: false, correct: null, timeSec: 0, hints: 0 })),
    status: "active", recorded: false,
  };
}

const settle = (s, now) => {
  const a = s.answers[s.index];
  if (a.submitted) return s.answers;
  const answers = s.answers.slice();
  answers[s.index] = { ...a, timeSec: a.timeSec + Math.max(0, (now - s.activeSince) / 1000) };
  return answers;
};

export function sessionReducer(s, act) {
  switch (act.type) {
    case "SET_VALUE": {
      const a = s.answers[s.index];
      if (a.submitted) return s;
      const answers = s.answers.slice(); answers[s.index] = { ...a, value: act.value };
      return { ...s, answers };
    }
    case "HINT": {
      const q = s.questions[s.index], a = s.answers[s.index];
      if (a.submitted || a.hints >= q.hints.length) return s;
      const answers = s.answers.slice(); answers[s.index] = { ...a, hints: a.hints + 1 };
      return { ...s, answers };
    }
    case "SUBMIT": {
      const a = s.answers[s.index], q = s.questions[s.index];
      if (a.submitted || a.value === "") return s;
      const answers = s.answers.slice();
      answers[s.index] = { ...a, submitted: true, correct: checkAnswer(q, a.value), timeSec: a.timeSec + Math.max(0, (act.now - s.activeSince) / 1000) };
      return { ...s, answers, activeSince: act.now };
    }
    case "GOTO": {
      if (act.index < 0 || act.index >= s.questions.length || act.index === s.index) return s;
      return { ...s, answers: settle(s, act.now), index: act.index, activeSince: act.now };
    }
    case "FINISH":
      return { ...s, answers: settle(s, act.now), status: "done", finishedAt: act.now, activeSince: act.now };
    case "MARK_RECORDED":
      return { ...s, recorded: true };
    default:
      return s;
  }
}

/* Estimated marks under IPMAT-style marking: +4 correct, −1 wrong MCQ, 0 for wrong SAQ or skipped. */
export function sessionMarks(s) {
  let m = 0;
  s.questions.forEach((q, i) => {
    const a = s.answers[i];
    if (!a.submitted) return;
    if (a.correct) m += 4; else if (isMCQ(q)) m -= 1;
  });
  return m;
}

export function sessionSummary(s) {
  const attempted = s.answers.filter((a) => a.submitted).length;
  const correct = s.answers.filter((a) => a.correct).length;
  const timeSec = s.answers.reduce((t, a) => t + a.timeSec, 0);
  const avgSec = s.questions.reduce((t, q) => t + q.avg_time_sec, 0);
  const hintsUsed = s.answers.reduce((t, a) => t + a.hints, 0);
  return { total: s.questions.length, attempted, correct, wrong: attempted - correct, skipped: s.questions.length - attempted, timeSec, avgSec, hintsUsed, marks: sessionMarks(s), maxMarks: s.questions.length * 4 };
}
