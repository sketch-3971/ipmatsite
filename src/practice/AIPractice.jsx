import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Code2, Delete, Lightbulb, RotateCcw, Sparkles, X } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Progress } from "../components/ui/Progress.jsx";
import { RichText } from "../components/ui/RichText.jsx";
import { COUNTS, DIFFICULTIES, SECTIONS, generateQuestions } from "../engine/index.js";
import { buildPrompt } from "../ai/promptTemplate.js";
import { QUESTION_SCHEMA } from "../ai/schema.js";
import { isMCQ, sessionSummary } from "../store/session.js";
import { topicShort } from "../store/history.js";
import { cn } from "../lib/cn.js";
import { mmss } from "../lib/format.js";
import { useApp } from "../store/AppStore.jsx";

const LETTERS = ["A", "B", "C", "D"];
const GROUPS = [
  { label: "Quantitative Ability", ids: ["QA-MCQ", "QA-SAQ"] },
  { label: "Verbal (VARC)", ids: ["VARC-RC", "VARC-PJ", "VARC-VOC"] },
  { label: "Logical Reasoning", ids: ["LR"] },
];

function Chip({ on, onClick, children, sub }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={cn("rounded-lg border px-3.5 py-2 text-left text-sm font-medium transition", on ? "border-accent bg-accent/12 text-fg" : "border-line bg-bg text-muted hover:border-accent/40 hover:text-fg")}>
      {children}{sub && <span className="block text-xs font-normal text-muted">{sub}</span>}
    </button>
  );
}

/* ---------------- Generator ---------------- */
function Generator() {
  const { startGenerated, preset, setPreset } = useApp();
  const [section, setSection] = useState(preset?.section || "QA-MCQ");
  const [topic, setTopic] = useState(preset?.topic || "Mixed");
  const [difficulty, setDifficulty] = useState(preset?.difficulty || 3);
  const [count, setCount] = useState(preset?.count || 5);
  const [showPrompt, setShowPrompt] = useState(false);
  const [sample, setSample] = useState(null);
  useEffect(() => { if (preset) setPreset(null); }, []); // eslint-disable-line

  const S = SECTIONS[section];
  const pickSection = (id) => { setSection(id); setTopic(SECTIONS[id].topics[0]); };
  const label = topic === "Mixed" ? S.short : topic;
  const prompt = useMemo(() => buildPrompt({ section, topic, difficulty, count, label }), [section, topic, difficulty, count, label]);
  const d = DIFFICULTIES[difficulty - 1];
  const go = () => startGenerated({ section, topic, difficulty, count, label }, `${label}, ${d.label}`);
  const preview = () => setSample(generateQuestions({ section, topic, difficulty, count: 1 })[0]);

  return (
    <div>
      <PageHeader title="AI Practice" description="Choose a section, topic and level. A fresh set is generated in the IPMAT pattern, with hints, worked solutions and an analysis of the wrong options." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted">1 · Section</h2>
            <div className="space-y-3">
              {GROUPS.map((g) => (
                <div key={g.label} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 text-sm text-muted">{g.label}</span>
                  {g.ids.map((id) => <Chip key={id} on={section === id} onClick={() => pickSection(id)}>{SECTIONS[id].short}</Chip>)}
                </div>
              ))}
            </div>
            {section === "QA-SAQ" && <p className="mt-3 text-[13px] text-muted">Short answer questions have no options. Type an integer. In IPMAT Indore these carry no negative marking.</p>}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted">2 · Sub-topic</h2>
            <div className="flex flex-wrap gap-2">{S.topics.map((t) => <Chip key={t} on={topic === t} onClick={() => setTopic(t)}>{t}</Chip>)}</div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted">3 · Difficulty</h2>
            <div className="grid gap-2 sm:grid-cols-2">{DIFFICULTIES.map((x) => <Chip key={x.level} on={difficulty === x.level} onClick={() => setDifficulty(x.level)} sub={x.hint}>{x.label}</Chip>)}</div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted">4 · Number of questions</h2>
            <div className="flex gap-2">{COUNTS.map((c) => <Chip key={c} on={count === c} onClick={() => setCount(c)}>{c} questions</Chip>)}</div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-5">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Your set</p>
            <p className="mt-2 text-lg font-semibold leading-snug">{count} × {label}</p>
            <p className="text-sm text-muted">{S.label}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge tone="accent">{d.label}</Badge><Badge>About {Math.round((count * ({ "QA-MCQ": 90, "QA-SAQ": 130, "VARC-RC": 65, "VARC-PJ": 60, "VARC-VOC": 40, LR: 85 }[section] || 80)) / 60)} min</Badge></div>
            <Button variant="primary" size="lg" className="mt-5 w-full" onClick={go}><Sparkles className="size-4" /> Generate and start</Button>
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={preview}>Preview one question</Button>
          </Card>
          <Card className="p-5">
            <button onClick={() => setShowPrompt((v) => !v)} aria-expanded={showPrompt} className="flex w-full items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><Code2 className="size-4 text-muted" /> LLM prompt and schema</span><ChevronDown className={cn("size-4 transition-transform", showPrompt && "rotate-180")} /></button>
            {showPrompt && <div className="mt-3 animate-rise space-y-3"><p className="text-[13px] text-muted">The built-in engine returns this exact JSON shape. To use a real model, send this prompt to your API and run the reply through <code className="font-mono">validateQuestion()</code>.</p><pre className="max-h-64 overflow-auto rounded-lg bg-bg p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{prompt}</pre></div>}
          </Card>
        </aside>
      </div>

      {sample && (
        <Card className="mt-6 animate-rise p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Sample output</h3><button onClick={() => setSample(null)} aria-label="Close preview" className="rounded-md p-1 text-muted hover:bg-raised"><X className="size-4" /></button></div>
          <pre className="max-h-96 overflow-auto rounded-lg bg-bg p-4 font-mono text-xs leading-relaxed">{JSON.stringify(sample, null, 2)}</pre>
          <p className="mt-2 text-xs text-faint">Fields: {Object.keys(QUESTION_SCHEMA).join(", ")}</p>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Keypad ---------------- */
function Keypad({ value, onChange, disabled }) {
  const press = (k) => {
    if (disabled) return;
    if (k === "back") return onChange(value.slice(0, -1));
    if (k === "clear") return onChange("");
    if (k === "-") return onChange(value.startsWith("-") ? value.slice(1) : "-" + value);
    if (value.replace("-", "").length >= 9) return;
    onChange(value + k);
  };
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "-", "0", "back"];
  return (
    <div className="max-w-xs">
      <input value={value} disabled={disabled} inputMode="numeric" aria-label="Your answer" placeholder="Type an integer"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9-]/g, "").replace(/(?!^)-/g, ""))}
        className="mb-3 h-14 w-full rounded-xl border border-line bg-bg px-4 text-right font-mono text-2xl tabular-nums outline-none focus:border-accent disabled:opacity-70" />
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button key={k} disabled={disabled} onClick={() => press(k)} aria-label={k === "back" ? "Backspace" : k === "-" ? "Toggle minus" : k}
            className="grid h-12 place-items-center rounded-lg border border-line bg-bg text-lg font-semibold transition hover:bg-raised active:scale-95 disabled:opacity-50">
            {k === "back" ? <Delete className="size-5" /> : k === "-" ? "±" : k}
          </button>
        ))}
      </div>
      <button disabled={disabled} onClick={() => press("clear")} className="mt-2 text-sm text-muted hover:text-fg disabled:opacity-50">Clear</button>
    </div>
  );
}

/* ---------------- Explanation ---------------- */
function TimeCompare({ took, avg }) {
  const max = Math.max(took, avg, 1), fast = took <= avg;
  return (
    <div className="space-y-2 text-sm">
      {[["You", took, fast ? "var(--mint)" : "var(--amber)"], ["Average", avg, "var(--faint)"]].map(([k, v, c]) => (
        <div key={k} className="flex items-center gap-3"><span className="w-14 text-muted">{k}</span><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised"><div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: c }} /></div><span className="w-12 text-right tabular-nums">{mmss(v)}</span></div>
      ))}
      <p className="text-[13px] text-muted">{fast ? `${mmss(avg - took)} faster than the benchmark.` : `${mmss(took - avg)} slower than the benchmark.`}</p>
    </div>
  );
}

function Explanation({ q, a, picked }) {
  const wrongTrap = !a.correct && q.trap_analysis.find((t) => String(t.option) === String(picked));
  return (
    <div className="animate-rise space-y-5 border-t border-line pt-5">
      <div className={cn("flex items-start gap-3 rounded-xl border p-4", a.correct ? "border-mint/40 bg-mint/10" : "border-rose/40 bg-rose/10")}>
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-white", a.correct ? "bg-mint" : "bg-rose")}>{a.correct ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}</span>
        <div>
          <p className="font-semibold">{a.correct ? "Correct" : "Not quite"}</p>
          <p className="text-sm text-muted">Answer: <strong className="text-fg">{String(q.correct_answer)}</strong>{!a.correct && <> · You chose <strong className="text-fg">{String(picked)}</strong></>}</p>
          {wrongTrap && <p className="mt-1.5 text-sm"><span className="font-medium">Why that tempts: </span>{wrongTrap.reason}</p>}
        </div>
      </div>
      <div>
        <h4 className="mb-2.5 text-sm font-semibold">Step-by-step solution</h4>
        <ol className="space-y-2">{q.solution_steps.map((s, i) => <li key={i} className="flex gap-3 text-[15px]"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-raised text-xs font-semibold text-muted">{i + 1}</span><RichText inline text={s} className="pt-0.5" /></li>)}</ol>
      </div>
      {q.trap_analysis.length > 0 && (
        <div>
          <h4 className="mb-2.5 text-sm font-semibold">Trap analysis</h4>
          <ul className="space-y-2">{q.trap_analysis.map((t, i) => <li key={i} className="rounded-lg bg-raised p-3 text-sm"><span className="mr-2 rounded bg-bg px-1.5 py-0.5 font-mono text-xs"><RichText inline text={String(t.option)} /></span><RichText inline text={t.reason} /></li>)}</ul>
        </div>
      )}
      <div><h4 className="mb-2.5 text-sm font-semibold">Time taken</h4><TimeCompare took={a.timeSec} avg={q.avg_time_sec} /></div>
    </div>
  );
}

/* ---------------- Arena ---------------- */
function Arena() {
  const { session: s, dispatch, finish } = useApp();
  const [, tick] = useState(0);
  const [showPassage, setShowPassage] = useState(true);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  const q = s.questions[s.index], a = s.answers[s.index], mcq = isMCQ(q);
  const elapsed = a.submitted ? a.timeSec : a.timeSec + (Date.now() - s.activeSince) / 1000;
  const over = elapsed > q.avg_time_sec;
  const nSubmitted = s.answers.filter((x) => x.submitted).length;
  const last = s.index === s.questions.length - 1;
  const set = (value) => dispatch({ type: "SET_VALUE", value });
  const go = (index) => dispatch({ type: "GOTO", index, now: Date.now() });
  const submit = () => dispatch({ type: "SUBMIT", now: Date.now() });

  useEffect(() => {
    const k = (e) => {
      if (e.target.tagName === "INPUT" || a.submitted || !mcq) return;
      const i = "abcd".indexOf(e.key.toLowerCase());
      if (i >= 0 && q.options[i]) set(q.options[i]);
      if (e.key === "Enter" && a.value !== "") submit();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm text-muted">{s.title}</p><h1 className="text-xl font-bold">Question {s.index + 1} <span className="font-normal text-muted">of {s.questions.length}</span></h1></div>
        <div className="flex items-center gap-2">
          <span className={cn("flex h-10 items-center gap-2 rounded-lg border px-3 font-mono text-lg font-semibold tabular-nums", a.submitted ? "border-line text-muted" : over ? "border-amber/50 text-amber-fg" : "border-line")} role="timer" aria-label="Time on this question"><Clock className="size-4" />{mmss(elapsed)}<span className="text-xs font-normal text-muted">/ {mmss(q.avg_time_sec)}</span></span>
          <Button variant="ghost" onClick={() => { if (nSubmitted === 0 || confirm("End this session and see your results?")) finish(); }}>End session</Button>
        </div>
      </div>
      <Progress value={(nSubmitted / s.questions.length) * 100} tone="mint" className="mb-5" label="Questions answered" />

      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <Card className="p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap gap-2"><Badge tone="accent">{topicShort(q.topic)}</Badge><Badge>{DIFFICULTIES[q.difficulty - 1].label}</Badge><Badge>{q.section}</Badge></div>
          {q.passage && (
            <div className="mb-5 rounded-xl border border-line bg-bg">
              <button onClick={() => setShowPassage((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold">{q.passage_title || "Passage"}<ChevronDown className={cn("size-4 transition-transform", showPassage && "rotate-180")} /></button>
              {showPassage && <div className="max-h-72 overflow-y-auto border-t border-line px-4 py-3 text-[15px] leading-relaxed"><RichText text={q.passage} /></div>}
            </div>
          )}
          <div className="text-[17px] leading-relaxed"><RichText text={q.question_text} /></div>

          <div className="mt-6">
            {mcq ? (
              <div role="radiogroup" aria-label="Options" className="space-y-2.5">
                {q.options.map((o, i) => {
                  const on = a.value === o, right = a.submitted && o === q.correct_answer, wrong = a.submitted && on && !a.correct;
                  return (
                    <button key={i} role="radio" aria-checked={on} disabled={a.submitted} onClick={() => set(o)}
                      className={cn("flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition", right ? "border-mint bg-mint/10" : wrong ? "border-rose bg-rose/10" : on ? "border-accent bg-accent/10" : "border-line bg-bg hover:border-accent/40", !a.submitted && "hover:scale-[1.005]")}>
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-md text-sm font-semibold", right ? "bg-mint text-white" : wrong ? "bg-rose text-white" : on ? "bg-accent text-white" : "bg-raised text-muted")}>{LETTERS[i]}</span>
                      <RichText inline text={o} className="pt-0.5 text-[15px]" />
                    </button>
                  );
                })}
              </div>
            ) : <Keypad value={String(a.value)} onChange={set} disabled={a.submitted} />}
          </div>

          {!a.submitted && (
            <div className="mt-6 space-y-3">
              {a.hints > 0 && <ul className="space-y-2">{q.hints.slice(0, a.hints).map((h, i) => <li key={i} className="animate-rise flex gap-2.5 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-amber" /><span><strong>Hint {i + 1}.</strong> <RichText inline text={h} /></span></li>)}</ul>}
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => dispatch({ type: "HINT" })} disabled={a.hints >= q.hints.length}><Lightbulb className="size-4" /> {a.hints === 0 ? "Show a hint" : a.hints >= q.hints.length ? "No more hints" : "Next hint"} <span className="text-muted">({a.hints}/{q.hints.length})</span></Button>
                <Button variant="primary" className="ml-auto" disabled={a.value === ""} onClick={submit}>Submit answer</Button>
                {last ? null : <Button variant="ghost" onClick={() => go(s.index + 1)}>Skip</Button>}
              </div>
            </div>
          )}
          {a.submitted && (
            <div className="mt-6">
              <Explanation q={q} a={a} picked={a.value} />
              <div className="mt-6 flex justify-between gap-2">
                <Button variant="ghost" disabled={s.index === 0} onClick={() => go(s.index - 1)}><ArrowLeft className="size-4" /> Previous</Button>
                {last || nSubmitted === s.questions.length ? <Button variant="primary" onClick={finish}>See results <ArrowRight className="size-4" /></Button> : <Button variant="primary" onClick={() => { const n = s.answers.findIndex((x, i) => !x.submitted && i > s.index); go(n >= 0 ? n : s.answers.findIndex((x) => !x.submitted)); }}>Next question <ArrowRight className="size-4" /></Button>}
              </div>
            </div>
          )}
        </Card>

        <Card className="h-fit p-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Questions</p>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {s.questions.map((_, i) => {
              const x = s.answers[i];
              return <button key={i} onClick={() => go(i)} aria-label={`Question ${i + 1}${x.submitted ? (x.correct ? ", correct" : ", wrong") : ""}`} aria-current={i === s.index ? "true" : undefined}
                className={cn("grid aspect-square place-items-center rounded-lg border text-sm font-semibold transition", x.submitted ? (x.correct ? "border-mint bg-mint text-white" : "border-rose bg-rose text-white") : "border-line bg-bg text-muted hover:text-fg", i === s.index && "ring-2 ring-accent ring-offset-2 ring-offset-surface")}>{i + 1}</button>;
            })}
          </div>
          <p className="mt-4 text-xs text-muted">Marking: +4 correct, −1 wrong MCQ, no penalty for short answers.{mcq && " Press A to D to choose, Enter to submit."}</p>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Results ---------------- */
function Results() {
  const { session: s, retry, endSession, go } = useApp();
  const [open, setOpen] = useState(null);
  const m = sessionSummary(s);
  const acc = m.attempted ? Math.round((m.correct / m.attempted) * 100) : 0;
  const missed = s.questions.filter((_, i) => s.answers[i].submitted && !s.answers[i].correct);
  const tiles = [["Score", `${m.marks}`, `of ${m.maxMarks}`], ["Accuracy", `${acc}%`, `${m.correct} of ${m.attempted} attempted`], ["Time", mmss(m.timeSec), `benchmark ${mmss(m.avgSec)}`], ["Hints used", m.hintsUsed, m.skipped ? `${m.skipped} skipped` : "none skipped"]];
  return (
    <div>
      <PageHeader title="Session complete" description={s.title} actions={<div className="flex gap-2"><Button onClick={() => go("analytics")}>Analytics</Button><Button variant="primary" onClick={endSession}><Sparkles className="size-4" /> New set</Button></div>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([k, v, sub]) => <Card key={k} className="p-4"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-3xl font-bold tabular-nums">{v}</p><p className="text-[13px] text-muted">{sub}</p></Card>)}</div>
      {m.timeSec > m.avgSec * 1.15 && <p className="mt-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber-fg">You took longer than the benchmark overall. Check the rows marked slow below and look for questions where skipping early would have saved time.</p>}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Review</h2><p className="text-sm text-muted">Open any question to see its solution, trap analysis and time.</p></div>
        <ul>
          {s.questions.map((q, i) => {
            const a = s.answers[i], isOpen = open === i;
            return (
              <li key={q.question_id} className="border-b border-line last:border-0">
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-raised/50">
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white", !a.submitted ? "bg-faint" : a.correct ? "bg-mint" : "bg-rose")}>{!a.submitted ? "–" : a.correct ? "✓" : "✕"}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{i + 1}. {topicShort(q.topic)}</span><span className="block truncate text-[13px] text-muted">{q.question_text.replace(/\*\*|\n/g, " ").slice(0, 110)}</span></span>
                  {a.submitted && <span className={cn("shrink-0 text-xs tabular-nums", a.timeSec > q.avg_time_sec ? "text-amber-fg" : "text-muted")}>{mmss(a.timeSec)} / {mmss(q.avg_time_sec)}{a.timeSec > q.avg_time_sec ? " slow" : ""}</span>}
                  <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && <div className="px-5 pb-5"><div className="mb-4 rounded-lg bg-bg p-4 text-[15px]"><RichText text={q.question_text} /></div>{a.submitted ? <Explanation q={q} a={a} picked={a.value} /> : <><p className="mb-3 text-sm text-muted">Skipped. Answer: <strong className="text-fg">{q.correct_answer}</strong></p><ol className="space-y-1.5 text-sm">{q.solution_steps.map((x, k) => <li key={k}>{k + 1}. <RichText inline text={x} /></li>)}</ol></>}</div>}
              </li>
            );
          })}
        </ul>
      </Card>
      {missed.length > 0 && <div className="mt-5"><Button variant="primary" onClick={() => retry(missed, "Retry: questions you missed")}><RotateCcw className="size-4" /> Retry {missed.length} missed</Button></div>}
    </div>
  );
}

export default function AIPractice() {
  const { session } = useApp();
  if (!session) return <Generator />;
  return session.status === "done" ? <Results /> : <Arena />;
}
