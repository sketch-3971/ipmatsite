import { useMemo, useState } from "react";
import { CheckCircle2, Pause, Play, Search } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Progress } from "../components/ui/Progress.jsx";
import { Segmented } from "../components/ui/Segmented.jsx";
import { VIDEOS } from "../data/videos.js";
import { cn } from "../lib/cn.js";

const TONE = { Quant: "accent", VARC: "mint", LR: "amber" };

export default function Videos() {
  const [prog, setProg] = useState(() => Object.fromEntries(VIDEOS.map((v) => [v.id, v.progress])));
  const [sec, setSec] = useState("all"), [q, setQ] = useState(""), [cur, setCur] = useState(null), [playing, setPlaying] = useState(false);
  const list = useMemo(() => VIDEOS.filter((v) => (sec === "all" || v.section === sec) && (v.title + v.topic + v.faculty).toLowerCase().includes(q.toLowerCase())), [sec, q]);
  const done = VIDEOS.filter((v) => prog[v.id] >= 100).length;
  const resume = VIDEOS.find((v) => prog[v.id] > 0 && prog[v.id] < 100);
  const open = (v) => { setCur(v); setPlaying(false); };
  const step = (id, d) => setProg((p) => ({ ...p, [id]: Math.max(0, Math.min(100, p[id] + d)) }));
  const v = cur;

  return (
    <div>
      <PageHeader title="Video Lectures" description={`${done} of ${VIDEOS.length} lectures completed.`} />
      {resume && <Card className="mb-6 flex flex-wrap items-center gap-4 p-4"><span className="grid size-11 place-items-center rounded-lg bg-accent/12 text-accent-fg"><Play className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm text-muted">Continue watching</p><p className="truncate font-semibold">{resume.title}</p><Progress value={prog[resume.id]} className="mt-2" label="Progress" /></div><Button variant="primary" onClick={() => open(resume)}>Resume</Button></Card>}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented label="Section" value={sec} onChange={setSec} options={[{ id: "all", label: "All" }, { id: "Quant", label: "Quant" }, { id: "VARC", label: "VARC" }, { id: "LR", label: "LR" }]} />
        <label className="relative ml-auto w-full sm:w-64"><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lectures" aria-label="Search lectures" className="h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm outline-none focus:border-accent" /></label>
      </div>
      {list.length === 0 ? <Card className="p-10 text-center text-muted">No lectures match your search.</Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((x) => (
            <Card key={x.id} interactive className="cursor-pointer overflow-hidden" onClick={() => open(x)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(x)}>
              <div className="relative grid h-32 place-items-center bg-raised"><span className="grid size-12 place-items-center rounded-full bg-fg/90 text-bg"><Play className="size-5 translate-x-0.5" /></span><span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">{x.minutes} min</span>{prog[x.id] >= 100 && <CheckCircle2 className="absolute top-2 right-2 size-5 text-mint" />}</div>
              <div className="p-4"><div className="mb-2 flex gap-2"><Badge tone={TONE[x.section]}>{x.section}</Badge><Badge>{x.level}</Badge></div><h3 className="font-semibold leading-snug">{x.title}</h3><p className="mt-1 text-[13px] text-muted">{x.topic} · {x.faculty}</p><Progress value={prog[x.id]} tone={prog[x.id] >= 100 ? "mint" : "accent"} className="mt-3" label={`${x.title} progress`} /><p className="mt-1.5 text-xs text-muted">{prog[x.id] >= 100 ? "Completed" : prog[x.id] ? `${prog[x.id]}% watched` : "Not started"}</p></div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!v} onClose={() => setCur(null)} title={v?.title || ""} wide footer={v && <><Button onClick={() => step(v.id, -10)}>−10%</Button><Button onClick={() => step(v.id, 10)}>+10%</Button><Button variant="success" onClick={() => setProg((p) => ({ ...p, [v.id]: 100 }))}>Mark complete</Button></>}>
        {v && <div className="space-y-4"><div className="grid aspect-video place-items-center rounded-xl bg-black"><button onClick={() => { setPlaying((p) => !p); if (!playing) step(v.id, 5); }} aria-label={playing ? "Pause" : "Play"} className="grid size-16 place-items-center rounded-full bg-white/90 text-black transition hover:scale-105">{playing ? <Pause className="size-7" /> : <Play className="size-7 translate-x-0.5" />}</button></div><div><Progress value={prog[v.id]} label="Watched" /><p className="mt-2 text-sm text-muted">{prog[v.id]}% watched · {v.faculty} · {v.topic}</p></div><p className="text-[13px] text-faint">Demo player: the controls below move your progress so you can see how tracking works. Connect a video host to stream real lectures.</p></div>}
      </Modal>
    </div>
  );
}
