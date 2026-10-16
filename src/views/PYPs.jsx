import { useMemo, useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Progress } from "../components/ui/Progress.jsx";
import { Segmented } from "../components/ui/Segmented.jsx";
import { PYPS, SYLLABUS } from "../data/pyps.js";
import { EXAM_LABEL } from "../data/mocks.js";
import { cn } from "../lib/cn.js";
import { useApp } from "../store/AppStore.jsx";

const TONE = { Easy: "mint", Moderate: "amber", Hard: "rose" };
const LEVEL = { Easy: 2, Moderate: 3, Hard: 4 };
const PARTS = (p) => {
  const d = LEVEL[p.difficulty];
  if (p.exam === "indore") return [{ section: "QA-SAQ", topic: "Mixed", difficulty: d, count: 3 }, { section: "QA-MCQ", topic: "Mixed", difficulty: d, count: 3 }, { section: "VARC-RC", topic: "Reading Comprehension", difficulty: d, count: 2 }];
  return [{ section: "QA-MCQ", topic: "Mixed", difficulty: d, count: 3 }, { section: "LR", topic: "Mixed", difficulty: d, count: 2 }, { section: "VARC-RC", topic: "Reading Comprehension", difficulty: d, count: 2 }];
};
const PRACTICE = {
  "Number Systems": { section: "QA-MCQ", topic: "Number Systems" }, Algebra: { section: "QA-MCQ", topic: "Algebra" }, Arithmetic: { section: "QA-MCQ", topic: "Arithmetic" },
  "Modern Math": { section: "QA-MCQ", topic: "Modern Math" }, "Geometry & Mensuration": { section: "QA-MCQ", topic: "Geometry" },
  "Reading Comprehension": { section: "VARC-RC", topic: "Reading Comprehension" }, "Verbal Ability": { section: "VARC-PJ", topic: "Para Jumbles" },
  "Verbal Logic": { section: "LR", topic: "Critical Reasoning" }, "Analytical Logic": { section: "LR", topic: "Mixed" },
};

function Papers() {
  const { startMixed } = useApp();
  const [exam, setExam] = useState("all"), [diff, setDiff] = useState("all"), [year, setYear] = useState("all");
  const years = useMemo(() => [...new Set(PYPS.map((p) => p.year))].sort((a, b) => b - a), []);
  const list = PYPS.filter((p) => (exam === "all" || p.exam === exam) && (diff === "all" || p.difficulty === diff) && (year === "all" || p.year === +year));
  const sel = "h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent";
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented label="Exam" value={exam} onChange={setExam} options={[{ id: "all", label: "All" }, { id: "indore", label: "Indore" }, { id: "rohtak", label: "Rohtak" }, { id: "jipmat", label: "JIPMAT" }]} />
        <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} className={sel}><option value="all">All years</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
        <select aria-label="Difficulty" value={diff} onChange={(e) => setDiff(e.target.value)} className={sel}><option value="all">Any difficulty</option>{["Easy", "Moderate", "Hard"].map((d) => <option key={d}>{d}</option>)}</select>
        <span className="ml-auto text-sm text-muted">{list.length} papers</span>
      </div>
      {list.length === 0 ? <Card className="p-10 text-center text-muted">No papers match these filters.</Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} interactive className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-semibold">{EXAM_LABEL[p.exam]} {p.year}</h3><p className="text-sm text-muted">{p.questions} questions · {p.minutes} min</p></div><Badge tone={TONE[p.difficulty]}>{p.difficulty}</Badge></div>
              <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs text-muted"><span>{p.solved === 100 ? "Solved" : p.solved ? "In progress" : "Not started"}</span><span className="tabular-nums">{p.solved}%</span></div><Progress value={p.solved} tone={p.solved === 100 ? "mint" : "accent"} label="Solved" /></div>
              <Button className="mt-5" variant={p.solved === 100 ? "secondary" : "primary"} onClick={() => startMixed(PARTS(p), `${EXAM_LABEL[p.exam]} ${p.year}, practice run`)}><Play className="size-4" /> {p.solved === 100 ? "Practise again" : "Practise"}</Button>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 text-[13px] text-faint">Practise runs a short set of generated questions in this paper's section mix and difficulty. Official paper text is not included.</p>
    </div>
  );
}

function Syllabus() {
  const { startGenerated } = useApp();
  const [open, setOpen] = useState("qa");
  return (
    <div className="space-y-4">
      {SYLLABUS.map((sec) => {
        const on = open === sec.id;
        return (
          <Card key={sec.id} className="overflow-hidden">
            <button onClick={() => setOpen(on ? null : sec.id)} aria-expanded={on} className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-raised/50"><div><h3 className="text-lg font-semibold">{sec.title}</h3><p className="text-sm text-muted">{sec.weight}</p></div><ChevronDown className={cn("size-5 text-muted transition-transform", on && "rotate-180")} /></button>
            {on && <div className="grid animate-rise gap-4 border-t border-line p-5 md:grid-cols-2">{sec.topics.map(([name, items]) => (
              <div key={name} className="rounded-xl border border-line bg-bg p-4">
                <div className="mb-2 flex items-center justify-between gap-2"><h4 className="font-semibold">{name}</h4>{PRACTICE[name] && <Button size="sm" onClick={() => startGenerated({ ...PRACTICE[name], difficulty: 3, count: 5, label: name }, `${name}, IPMAT Standard`)}>Practise</Button>}</div>
                <ul className="space-y-1.5 text-sm text-muted">{items.map((i) => <li key={i} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-faint" />{i}</li>)}</ul>
              </div>
            ))}</div>}
          </Card>
        );
      })}
      <p className="text-[13px] text-faint">Syllabus shown is a typical outline. Confirm weights against the official brochure for your exam year.</p>
    </div>
  );
}

export default function PYPs() {
  const [tab, setTab] = useState("papers");
  return (
    <div>
      <PageHeader title="PYPs & Syllabus" description="Past year papers filtered by exam, year and difficulty, with the topic outline behind them." />
      <Segmented className="mb-6" label="View" value={tab} onChange={setTab} options={[{ id: "papers", label: "Past year papers" }, { id: "syllabus", label: "Syllabus" }]} />
      {tab === "papers" ? <Papers /> : <Syllabus />}
    </div>
  );
}
