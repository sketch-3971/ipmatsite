import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Segmented } from "../components/ui/Segmented.jsx";
import { BarList } from "../components/charts/BarList.jsx";
import { LineChart } from "../components/charts/LineChart.jsx";
import { useApp } from "../store/AppStore.jsx";
import { accuracyByDay, configForTopic, summarize, topicShort } from "../store/history.js";
import { mmss, shortDay } from "../lib/format.js";

const COLOR = { Quant: "var(--accent)", VARC: "var(--mint)", LR: "var(--amber)" };

export default function Analytics() {
  const { history, now, startGenerated } = useApp();
  const [range, setRange] = useState(14), [area, setArea] = useState("all"), [shown, setShown] = useState(12);
  const rows = useMemo(() => history.filter((h) => h.ts > now - range * 86400000 && (area === "all" || h.area === area)), [history, range, area, now]);
  const S = useMemo(() => summarize(rows), [rows]);
  const trend = useMemo(() => accuracyByDay(rows, range, now).map((d) => ({ label: shortDay(d.ts), value: d.acc, note: `${d.n} questions` })), [rows, range, now]);
  const errors = useMemo(() => rows.filter((h) => !h.correct).sort((a, b) => b.ts - a.ts), [rows]);
  const weak = S.byTopic.filter((t) => t.n >= 3).slice(0, 6);
  const pace = S.byArea.map((a) => ({ label: a.name, value: Math.min(100, (a.time / Math.max(a.avg, 1)) * 50), right: `${mmss(a.time)} vs ${mmss(a.avg)}`, color: a.time <= a.avg ? "var(--mint)" : "var(--amber)", sub: a.time <= a.avg ? "Faster than the benchmark" : "Slower than the benchmark" }));
  const fix = (topic) => { const c = configForTopic(topic); startGenerated({ ...c, difficulty: 3, count: 5 }, `${c.label}, IPMAT Standard`); };

  return (
    <div>
      <PageHeader title="Analytics" description="Where marks are won and lost: accuracy, pace and a log of every mistake." />
      <div className="mb-6 flex flex-wrap gap-3">
        <Segmented label="Range" value={range} onChange={setRange} options={[{ id: 7, label: "7 days" }, { id: 14, label: "14 days" }, { id: 28, label: "28 days" }]} />
        <Segmented label="Section" value={area} onChange={setArea} options={[{ id: "all", label: "All" }, { id: "Quant", label: "Quant" }, { id: "VARC", label: "VARC" }, { id: "LR", label: "LR" }]} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Questions", S.n], ["Accuracy", `${Math.round(S.acc * 100)}%`], ["Mistakes", errors.length], ["Practice time", `${Math.floor(S.totalMinutes / 60)}h ${S.totalMinutes % 60}m`]].map(([k, v]) => <Card key={k} className="p-4"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-2xl font-bold tabular-nums">{v}</p></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><h3 className="font-semibold">Accuracy trend</h3><p className="mb-4 text-sm text-muted">Daily accuracy over the last {range} days.</p><LineChart data={trend} ariaLabel="Accuracy trend" /></Card>
        <Card className="p-5"><h3 className="font-semibold">By section</h3><p className="mb-5 text-sm text-muted">Accuracy</p><BarList rows={S.byArea.map((a) => ({ label: a.name, value: a.acc * 100, color: COLOR[a.name], sub: `${a.n} questions` }))} /></Card>
        <Card className="p-5 lg:col-span-2"><h3 className="font-semibold">Weakest topics</h3><p className="mb-5 text-sm text-muted">Lowest accuracy first, with at least three attempts.</p>
          {weak.length ? <ul className="space-y-3">{weak.map((t) => <li key={t.name} className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{topicShort(t.name)}</p><p className="text-xs text-muted">{t.n} questions</p></div><Badge tone={t.acc < 0.5 ? "rose" : t.acc < 0.7 ? "amber" : "mint"}>{Math.round(t.acc * 100)}%</Badge><Button size="sm" onClick={() => fix(t.name)}>Practise</Button></li>)}</ul> : <p className="text-sm text-muted">Not enough data in this range.</p>}
        </Card>
        <Card className="p-5"><h3 className="font-semibold">Time per question</h3><p className="mb-5 text-sm text-muted">Yours against the benchmark</p><BarList rows={pace} /></Card>
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-semibold">Error log</h3><p className="text-sm text-muted">{errors.length} mistakes. The reason shows the likely slip behind each one.</p></div>
        {errors.length === 0 ? <p className="p-8 text-center text-sm text-muted">No mistakes in this range.</p> : (
          <ul>{errors.slice(0, shown).map((e) => (
            <li key={e.id} className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-3.5 last:border-0">
              <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><Badge tone={e.area === "Quant" ? "accent" : e.area === "VARC" ? "mint" : "amber"}>{e.area}</Badge><span className="text-sm font-medium">{topicShort(e.topic)}</span><span className="text-xs text-muted">{shortDay(e.ts)}{e.sample ? " · sample" : ""}</span></div>
                <p className="truncate text-sm text-muted">{e.text}</p>
                <p className="mt-1 text-[13px]">You: <strong>{e.picked}</strong> · Answer: <strong>{e.answer}</strong> · {mmss(e.timeSec)} vs {mmss(e.avgSec)}</p>
                {e.reason && <p className="mt-1 text-[13px] text-muted">{e.reason}</p>}</div>
              <Button size="sm" variant="ghost" onClick={() => fix(e.topic)}><RotateCcw className="size-3.5" /> Drill topic</Button>
            </li>))}
          </ul>
        )}
        {errors.length > shown && <div className="border-t border-line p-3 text-center"><Button variant="ghost" onClick={() => setShown((n) => n + 12)}>Show more</Button></div>}
      </Card>
      <p className="mt-4 text-[13px] text-faint">Entries marked sample are illustrative history so the charts are populated. Your own attempts are added as you practise.</p>
    </div>
  );
}
