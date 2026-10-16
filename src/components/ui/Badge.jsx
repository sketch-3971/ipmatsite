import { cn } from "../../lib/cn.js";

const TONES = {
  neutral: "bg-raised text-muted border-line",
  accent: "bg-accent/12 text-accent-fg border-accent/30",
  mint: "bg-mint/12 text-mint-fg border-mint/30",
  amber: "bg-amber/12 text-amber-fg border-amber/30",
  rose: "bg-rose/12 text-rose-fg border-rose/30",
};
export function Badge({ tone = "neutral", dot, className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full bg-current", dot === "pulse" && "animate-pulse")} />}
      {children}
    </span>
  );
}

export const STATUS = {
  live: { label: "Live", tone: "mint", dot: "pulse" },
  completed: { label: "Completed", tone: "accent" },
  in_progress: { label: "In progress", tone: "amber", dot: true },
  not_started: { label: "Not started", tone: "neutral" },
};
export function StatusBadge({ status }) {
  const s = STATUS[status];
  return <Badge tone={s.tone} dot={s.dot}>{s.label}</Badge>;
}
