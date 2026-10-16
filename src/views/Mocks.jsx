import { useMemo, useState } from "react";
import { BarChart3, Clock, FileQuestion, Layers, Play, Trophy, Users } from "lucide-react";
import { Badge, StatusBadge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Segmented } from "../components/ui/Segmented.jsx";
import { BarList } from "../components/charts/BarList.jsx";
import { EXAM_LABEL, MOCKS, MOCK_FILTERS } from "../data/mocks.js";
import { hashStr } from "../lib/format.js";
import { useApp } from "../store/AppStore.jsx";

const part = (section, topic, count, difficulty = 3) => ({ section, topic, count, difficulty });
/** A short sample run per exam: two to three questions from each section. */
export function samplePartsFor(mock) {
  if (mock.id.startsWith("sec-indore-qa")) return [part("QA-SAQ", "Mixed", 3), part("QA-MCQ", "Mixed", 3)];
  if (mock.id.startsWith("sec-indore-varc")) return [part("VARC-RC", "Reading Comprehension", 3), part("VARC-PJ", "Para Jumbles", 2), part("VARC-VOC", "Vocabulary", 1)];
  if (mock.exam === "indore") return [part("QA-SAQ", "Mixed", 2), part("QA-MCQ", "Mixed", 2), part("VARC-RC", "Reading Comprehension", 2)];
  if (mock.exam === "rohtak") return [part("QA-MCQ", "Mixed", 2), part("LR", "Mixed", 2), part("VARC-VOC", "Vocabulary", 2)];
  return [part("QA-MCQ", "Mixed", 2), part("LR", "Mixed", 2), part("VARC-RC", "Reading Comprehension", 2)];
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 text-faint" />
      <span className="text-muted">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function MockCard({ m, onAttempt, onAnalyze }) {
  const cta = m.status === "completed" ? { label: "Analyze", icon: BarChart3, v: "secondary", fn: onAnalyze }
    : m.status === "in_progress" ? { label: "Resume", icon: Play, v: "primary", fn: onAttempt }
    : { label: "Attempt now", icon: Play, v: m.status === "live" ? "primary" : "secondary", fn: onAttempt };
  const Icon = cta.icon;
  return (
    <Card interactive className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Badge tone="neutral">{EXAM_LABEL[m.exam]}{m.sectional ? " sectional" : ""}</Badge>
        <StatusBadge status={m.status} />
      </div>
      <h3 className="text-[17px] leading-snug font-semibold">{m.title}</h3>
      <p className="mt-1 min-h-5 text-[13px] text-muted">
        {m.status === "live" ? m.closes : m.status === "in_progress" ? `${m.progress.answered} of ${m.questions} answered, ${m.progress.minutesLeft} min left` : m.status === "completed" ? `Scored ${m.score} / ${m.outOf}, ${m.percentile} percentile` : m.sectional ? "Practise one section under exam timing" : "Full-length, exam pattern"}
      </p>
      <div className="my-4 space-y-2 border-y border-line py-4">
        <Stat icon={FileQuestion} label="Questions" value={m.questions} />
        <Stat icon={Clock} label="Duration" value={`${m.minutes} min`} />
        <Stat icon={Layers} label="Sections" value={m.sections.length} />
        {m.status === "live" && <Stat icon={Users} label="Taking it now" value={m.takers.toLocaleString("en-IN")} />}
      </div>
      <Button variant={cta.v} className="mt-auto w-full" onClick={cta.fn}><Icon className="size-4" /> {cta.label}</Button>
    </Card>
  );
}

export default function Mocks() {
  const { startMixed } = useApp();
  const [filter, setFilter] = useState("all");
  const [attempt, setAttempt] = useState(null);
  const [analyze, setAnalyze] = useState(null);
  const counts = useMemo(() => Object.fromEntries(MOCK_FILTERS.map((f) => [f.id, f.id === "all" ? MOCKS.length : MOCKS.filter((m) => m.exam === f.id).length])), []);
  const list = MOCKS.filter((m) => filter === "all" || m.exam === filter);
  const live = list.filter((m) => m.status === "live").length;

  const sectionStats = (m) => m.sections.map((s) => ({ label: s.name, value: 40 + (hashStr(m.id + s.name) % 50), sub: `${s.q} questions` }));
  return (
    <div>
      <PageHeader title="Mocks & Sectionals" description="Full-length tests in the pattern of IPMAT Indore, IPMAT Rohtak and JIPMAT, plus single-section drills." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter mocks" options={MOCK_FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} value={filter} onChange={setFilter} />
        {live > 0 && <Badge tone="mint" dot="pulse">{live} live now</Badge>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => <MockCard key={m.id} m={m} onAttempt={() => setAttempt(m)} onAnalyze={() => setAnalyze(m)} />)}
      </div>

      <Modal open={!!attempt} onClose={() => setAttempt(null)} title={attempt ? `${attempt.title}: before you begin` : ""} wide
        footer={attempt && <><Button onClick={() => setAttempt(null)}>Not now</Button><Button variant="primary" onClick={() => { const m = attempt; setAttempt(null); startMixed(samplePartsFor(m), `${m.title}, sample run`); }}><Play className="size-4" /> Start sample run</Button></>}>
        {attempt && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Questions", attempt.questions], ["Duration", `${attempt.minutes} min`], ["Sections", attempt.sections.length]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-raised p-3"><p className="text-xl font-bold tabular-nums">{v}</p><p className="text-xs text-muted">{k}</p></div>
              ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-raised text-left text-muted"><tr><th className="px-3 py-2 font-medium">Section</th><th className="px-3 py-2 font-medium">Questions</th><th className="px-3 py-2 font-medium">Time</th><th className="px-3 py-2 font-medium">Marking</th></tr></thead>
                <tbody>{attempt.sections.map((s) => <tr key={s.name} className="border-t border-line"><td className="px-3 py-2.5 font-medium">{s.name}</td><td className="px-3 py-2.5 tabular-nums">{s.q}</td><td className="px-3 py-2.5 tabular-nums">{s.min} min</td><td className="px-3 py-2.5 tabular-nums">{s.marking}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber-fg">This demo starts a short sample run with {samplePartsFor(attempt).reduce((t, p) => t + p.count, 0)} generated questions in this mock's section mix. Full-length papers need a question bank behind them.</p>
          </div>
        )}
      </Modal>

      <Modal open={!!analyze} onClose={() => setAnalyze(null)} title={analyze ? `${analyze.title}: analysis` : ""}
        footer={<Button onClick={() => setAnalyze(null)}>Close</Button>}>
        {analyze && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-raised p-3"><p className="text-xl font-bold tabular-nums">{analyze.score}<span className="text-sm text-muted"> / {analyze.outOf}</span></p><p className="text-xs text-muted">Score</p></div>
              <div className="rounded-lg bg-raised p-3"><p className="text-xl font-bold tabular-nums">{analyze.percentile}</p><p className="text-xs text-muted">Percentile</p></div>
              <div className="rounded-lg bg-raised p-3"><p className="flex items-center justify-center gap-1 text-xl font-bold tabular-nums"><Trophy className="size-4 text-amber" />{analyze.rank}</p><p className="text-xs text-muted">Rank</p></div>
            </div>
            <div><h4 className="mb-3 text-sm font-semibold">Accuracy by section</h4><BarList rows={sectionStats(analyze)} /></div>
            <p className="text-[13px] text-faint">Sample result shown for illustration.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
