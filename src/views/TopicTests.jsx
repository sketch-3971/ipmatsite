import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Progress } from "../components/ui/Progress.jsx";
import { Segmented } from "../components/ui/Segmented.jsx";
import { LEVELS, TOPIC_GROUPS } from "../data/topics.js";
import { cn } from "../lib/cn.js";
import { useApp } from "../store/AppStore.jsx";

const TONE = { accent: "accent", mint: "mint", amber: "amber" };
const matches = (h, item) => (item.kind === "QA" ? h.topic.startsWith(item.topic + " ·") : h.topic.includes(item.topic));

function LevelChip({ level, stats, onStart }) {
  const acc = stats.n ? Math.round((stats.ok / stats.n) * 100) : null;
  const tone = acc == null ? "border-line text-muted" : acc >= 70 ? "border-mint/40 text-mint-fg" : acc >= 50 ? "border-amber/40 text-amber-fg" : "border-rose/40 text-rose-fg";
  return (
    <button onClick={onStart} title={`Start 5 questions at ${level.name}`}
      className={cn("group flex flex-col rounded-lg border bg-bg px-3 py-2 text-left transition hover:scale-[1.03] hover:bg-raised", tone)}>
      <span className="text-[13px] font-semibold text-fg">{level.label}</span>
      <span className="text-xs text-muted">{level.name}</span>
      <span className="mt-1.5 text-xs font-medium tabular-nums">{acc == null ? "Not started" : `${acc}% · ${stats.n} done`}</span>
    </button>
  );
}

export default function TopicTests() {
  const { history, startGenerated } = useApp();
  const [open, setOpen] = useState({ quant: true, varc: false, lr: false });
  const [qaMode, setQaMode] = useState("mcq");
  const [filter, setFilter] = useState("all");

  const progress = useMemo(() => {
    const out = {};
    TOPIC_GROUPS.forEach((g) => g.items.forEach((item) => {
      const rows = history.filter((h) => matches(h, item));
      out[item.name] = { all: { n: rows.length, ok: rows.filter((r) => r.correct).length }, levels: LEVELS.map((l) => { const r = rows.filter((x) => x.difficulty === l.level); return { n: r.length, ok: r.filter((x) => x.correct).length }; }) };
    }));
    return out;
  }, [history]);

  const start = (g, item, level) => {
    const section = g.id === "quant" ? (qaMode === "saq" ? "QA-SAQ" : "QA-MCQ") : item.section;
    startGenerated({ section, topic: item.topic, difficulty: level.level, count: 5, label: item.name }, `${item.name}, ${level.name}`);
  };
  const groups = TOPIC_GROUPS.filter((g) => filter === "all" || g.id === filter);

  return (
    <div>
      <PageHeader title="Topic Tests" description="Pick a sub-topic and a level. Each level starts a fresh set of five questions and shows your running accuracy." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter by section" value={filter} onChange={setFilter} options={[{ id: "all", label: "All sections" }, { id: "quant", label: "Quant" }, { id: "varc", label: "VARC" }, { id: "lr", label: "LR" }]} />
        <div className="flex items-center gap-2 text-sm text-muted">Level guide: {LEVELS.map((l) => <Badge key={l.level}>{l.level} {l.name}</Badge>)}</div>
      </div>
      <div className="space-y-4">
        {groups.map((g) => {
          const isOpen = open[g.id] || filter !== "all";
          const tot = g.items.reduce((t, i) => ({ n: t.n + progress[i.name].all.n, ok: t.ok + progress[i.name].all.ok }), { n: 0, ok: 0 });
          return (
            <Card key={g.id} className="overflow-hidden">
              <button onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-5 text-left hover:bg-raised/50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5"><h2 className="text-lg font-semibold">{g.title}</h2><Badge tone={TONE[g.tone]}>{g.items.length} sub-topics</Badge></div>
                  <p className="mt-1 text-sm text-muted">{tot.n} questions attempted{tot.n ? `, ${Math.round((tot.ok / tot.n) * 100)}% accuracy` : ""}</p>
                </div>
                <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="animate-rise border-t border-line p-5">
                  {g.saq && (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-muted">Question format</span>
                      <Segmented size="sm" label="Quant format" value={qaMode} onChange={setQaMode} options={[{ id: "mcq", label: "MCQ" }, { id: "saq", label: "Short answer (Indore)" }]} />
                    </div>
                  )}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {g.items.map((item) => {
                      const p = progress[item.name];
                      const acc = p.all.n ? (p.all.ok / p.all.n) * 100 : 0;
                      return (
                        <div key={item.name} className="rounded-xl border border-line bg-bg p-4">
                          <div className="flex items-baseline justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><span className="text-sm tabular-nums text-muted">{p.all.n ? `${Math.round(acc)}%` : "New"}</span></div>
                          <p className="mt-1 text-[13px] leading-snug text-muted">{item.blurb}</p>
                          <Progress value={acc} tone={acc >= 70 ? "mint" : acc >= 50 ? "amber" : "rose"} className="my-3" label={`${item.name} accuracy`} />
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {LEVELS.map((l, i) => <LevelChip key={l.level} level={l} stats={p.levels[i]} onStart={() => start(g, item, l)} />)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
