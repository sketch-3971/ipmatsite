import { cn } from "../../lib/cn.js";

const FILL = { accent: "bg-accent", mint: "bg-mint", amber: "bg-amber", rose: "bg-rose" };
export function Progress({ value, tone = "accent", className, label }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn("h-1.5 w-full overflow-hidden rounded-full bg-raised", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", FILL[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}
