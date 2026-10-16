import { useMemo } from "react";
import { ArrowUpRight, ClipboardList, Flame, History, Sparkles, Target, Zap } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Progress } from "../components/ui/Progress.jsx";
import { BarList } from "../components/charts/BarList.jsx";
import { LineChart } from "../components/charts/LineChart.jsx";
import { Ring } from "../components/charts/Ring.jsx";
import { useApp } from "../store/AppStore.jsx";
import { accuracyByDay, configForTopic, summarize, topicShort } from "../store/history.js";
import { dayKey, mmss, shortDay } from "../lib/format.js";
import { cn } from "../lib/cn.js";

const LINES = [
  "Ten focused questions today beat a three-hour session on Sunday.",
  "Review the mistakes you made yesterday before attempting anything new.",
  "Accuracy first, speed second. The clock follows once the method is solid.",
  "Your error log is the most personal textbook you will own.",
  "Skip early, return later. Marks lost to stubbornness are the easiest to win back.",
  "A hard question you solved today is a medium question next month.",
  "Read one long passage slowly today. VARC rewards patience.",
];
const AREA_COLOR = { Quant: "var(--accent)", VARC: "var(--mint)", LR: "var(--amber)" };
const AREA_NAME = { Quant: "Quantitative Ability", VARC: "Verbal (VARC)", LR: "Logical Reasoning" };

export default function Dashboard() {
  const { go, history, streak, startDaily, startGenerated, now } = useApp();
  const S = useMemo(() => summarize(history), [history]);
  const trend = useMemo(() => accuracyByDay(history, 14, now).map((d) => ({ label: shortDay(d.ts), value: d.acc, note: `${d.n} ${d.n === 1 ? "question" : "questions"}` })), [history, now]);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const ts = now - (6 - i) * 86400000, k = dayKey(ts);
    return { ts, letter: new Date(ts).toLocaleDateString("en-IN", { weekday: "narrow" }), done: history.some((h) => dayKey(h.ts) === k), today: i === 6 };
  }), [history, now]);
  const weekQs = history.filter((h) => h.ts > now - 7 * 86400000).length;
  const weak = S.byTopic.filter((t) => t.n >= 4)[0];
  const line = LINES[Math.floor(now / 86400000) % LINES.length];
  const hour = new Date(now).getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const areas = ["Quant", "VARC", "LR"].map((a) => S.byArea.find((x) => x.name === a)).filter(Boolean);
  const recent = history.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{greet}. Keep the streak alive.</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{line}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => startDaily("VARC-RC", 3)}><Zap className="size-4" /> Attempt today's daily RC</Button>
              <Button onClick={() => go("ai")}><Sparkles className="size-4" /> Generate a set</Button>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-bg p-4 sm:min-w-[300px]">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-amber/15 text-amber"><Flame className="size-7" /></span>
              <div>
                <p className="text-2xl font-bold leading-none tabular-nums">{streak.streak} Day Streak</p>
                <p className="mt-1 text-[13px] text-muted">{streak.today ? "You have practised today." : "Practise today to keep it going."}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between" aria-label="Last seven days">
              {week.map((d) => (
                <div key={d.ts} className="flex flex-col items-center gap-1.5">
                  <span className={cn("grid size-7 place-items-center rounded-full border text-[11px] font-semibold", d.done ? "border-mint bg-mint text-white" : "border-line text-faint", d.today && !d.done && "border-accent text-accent-fg")}>{d.done ? "✓" : ""}</span>
                  <span className="text-[11px] text-muted">{d.letter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <section aria-label="Quick actions" className="grid gap-4 md:grid-cols-3">
        <Card interactive className="flex cursor-pointer flex-col p-5" onClick={() => go("mocks")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go("mocks")}>
          <div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-lg bg-accent/12 text-accent-fg"><ClipboardList className="size-5" /></span><Badge tone="amber" dot>In progress</Badge></div>
          <h3 className="mt-4 font-semibold">Resume last mock</h3>
          <p className="mt-1 text-sm text-muted">IPMAT Indore Mock 07: 38 of 75 answered, 52 minutes left.</p>
          <Progress value={(38 / 75) * 100} className="mt-4" label="Mock progress" />
        </Card>
        <Card interactive className="flex cursor-pointer flex-col p-5" onClick={() => startDaily("VARC-RC", 3)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && startDaily("VARC-RC", 3)}>
          <div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-lg bg-mint/12 text-mint-fg"><Target className="size-5" /></span><Badge tone="mint">3 questions</Badge></div>
          <h3 className="mt-4 font-semibold">Attempt today's daily RC</h3>
          <p className="mt-1 text-sm text-muted">One passage, three questions, about five minutes. A new one tomorrow.</p>
        </Card>
        <Card interactive className={cn("flex flex-col p-5", weak && "cursor-pointer")} onClick={() => weak && (() => { const c = configForTopic(weak.name); startGenerated({ ...c, difficulty: 3, count: 5 }, `${c.label}, IPMAT Standard`); })()} role="button" tabIndex={0}>
          <div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-lg bg-amber/12 text-amber-fg"><History className="size-5" /></span>{weak && <Badge tone="rose">{Math.round(weak.acc * 100)}% accuracy</Badge>}</div>
          <h3 className="mt-4 font-semibold">Fix your weakest topic</h3>
          <p className="mt-1 text-sm text-muted">{weak ? `${topicShort(weak.name)}: five fresh IPMAT Standard questions.` : "Practise a few sets and your weakest topic will show up here."}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-4 p-5 sm:flex-row lg:flex-col lg:items-center">
          <Ring value={S.acc * 100} label="Overall accuracy" sub="overall accuracy" />
          <dl className="grid w-full grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-raised p-3"><dt className="text-muted">Questions</dt><dd className="text-lg font-semibold tabular-nums">{S.n}</dd></div>
            <div className="rounded-lg bg-raised p-3"><dt className="text-muted">Time spent</dt><dd className="text-lg font-semibold tabular-nums">{Math.floor(S.totalMinutes / 60)}h {S.totalMinutes % 60}m</dd></div>
            <div className="col-span-2 rounded-lg bg-raised p-3"><dt className="text-muted">Pace versus the benchmark</dt><dd className="text-lg font-semibold tabular-nums">{S.timeRatio <= 1 ? `${Math.round((1 - S.timeRatio) * 100)}% faster` : `${Math.round((S.timeRatio - 1) * 100)}% slower`}</dd></div>
          </dl>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">Accuracy, last 14 days</h3><p className="text-sm text-muted">Hover a point for that day's questions.</p></div>
            <Button size="sm" variant="ghost" onClick={() => go("analytics")}>Full analytics <ArrowUpRight className="size-4" /></Button>
          </div>
          <LineChart data={trend} ariaLabel="Daily accuracy for the last 14 days" />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Quant, VARC and LR strength</h3>
          <p className="mb-5 text-sm text-muted">Accuracy by section across everything you have attempted.</p>
          <BarList rows={areas.map((a) => ({ label: AREA_NAME[a.name], value: a.acc * 100, color: AREA_COLOR[a.name], sub: `${a.n} questions, average ${mmss(a.time)} against a ${mmss(a.avg)} benchmark` }))} />
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-baseline justify-between"><h3 className="font-semibold">Weekly goal</h3><span className="text-sm tabular-nums text-muted">{weekQs} / 70</span></div>
            <Progress value={(weekQs / 70) * 100} tone="mint" className="mt-3" label="Weekly goal" />
            <p className="mt-2 text-[13px] text-muted">{weekQs >= 70 ? "Goal reached. Nice work." : `${70 - weekQs} questions to go this week.`}</p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Recent questions</h3>
            <ul className="space-y-2.5">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-2.5 text-sm">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", r.correct ? "bg-mint" : "bg-rose")}>{r.correct ? "✓" : "✕"}</span>
                  <span className="min-w-0 flex-1 truncate">{topicShort(r.topic)}</span>
                  <span className="shrink-0 tabular-nums text-xs text-muted">{mmss(r.timeSec)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}
