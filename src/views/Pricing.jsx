import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, PageHeader } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Segmented } from "../components/ui/Segmented.jsx";
import { FAQ, PLANS } from "../data/plans.js";
import { cn } from "../lib/cn.js";
import { useApp } from "../store/AppStore.jsx";

export default function Pricing() {
  const { notify } = useApp();
  const [billing, setBilling] = useState("annual"), [pick, setPick] = useState(null), [faq, setFaq] = useState(0);
  return (
    <div>
      <PageHeader title="Pricing / Plans" description="Start free. Upgrade when you want every mock, full analytics and unlimited AI practice." />
      <div className="mb-6 flex items-center gap-3"><Segmented label="Billing" value={billing} onChange={setBilling} options={[{ id: "monthly", label: "Monthly" }, { id: "annual", label: "Annual" }]} />{billing === "annual" && <Badge tone="mint">Save about 33%</Badge>}</div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = billing === "annual" ? p.annual : p.monthly;
          return (
            <Card key={p.id} interactive className={cn("flex flex-col p-6", p.featured && "border-accent ring-1 ring-accent/40")}>
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{p.name}</h3>{p.featured && <Badge tone="accent">Most popular</Badge>}</div>
              <p className="mt-1 text-sm text-muted">{p.blurb}</p>
              <p className="mt-5 flex items-baseline gap-1"><span className="text-4xl font-bold tabular-nums">{price === 0 ? "Free" : `₹${price}`}</span>{price > 0 && <span className="text-sm text-muted">/ month{billing === "annual" ? ", billed yearly" : ""}</span>}</p>
              <ul className="my-6 flex-1 space-y-2.5">{p.features.map((f) => <li key={f} className="flex gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-mint" />{f}</li>)}</ul>
              <Button variant={p.featured ? "primary" : "secondary"} disabled={p.id === "free"} onClick={() => setPick(p)}>{p.cta}</Button>
            </Card>
          );
        })}
      </div>
      <h2 className="mt-10 mb-4 text-xl font-bold">Questions</h2>
      <Card className="divide-y divide-line">
        {FAQ.map(([q, a], i) => (
          <div key={q}><button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium hover:bg-raised/50">{q}<ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", faq === i && "rotate-180")} /></button>{faq === i && <p className="animate-rise px-5 pb-4 text-sm text-muted">{a}</p>}</div>
        ))}
      </Card>
      <Modal open={!!pick} onClose={() => setPick(null)} title={pick ? `Upgrade to ${pick.name}` : ""} footer={<><Button onClick={() => setPick(null)}>Cancel</Button><Button variant="primary" onClick={() => { notify(`Demo only: no payment taken for ${pick.name}.`); setPick(null); }}>Confirm</Button></>}>
        {pick && <div className="space-y-3 text-sm"><p>{pick.name} at <strong>₹{billing === "annual" ? pick.annual : pick.monthly} per month</strong>, billed {billing === "annual" ? "yearly" : "monthly"}.</p><p className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-amber-fg">This is a demo. Connect a payment provider before taking real payments.</p></div>}
      </Modal>
    </div>
  );
}
