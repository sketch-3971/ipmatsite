import { cn } from "../../lib/cn.js";

/** Pill tabs with an active indicator. options: [{id,label,count?}] */
export function Segmented({ options, value, onChange, className, size = "md", label }) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1", className)}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} role="tab" aria-selected={on} onClick={() => onChange(o.id)}
            className={cn("flex shrink-0 items-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors", size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-3.5 py-2 text-sm", on ? "bg-fg text-bg shadow-sm" : "text-muted hover:bg-raised hover:text-fg")}>
            {o.label}
            {o.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", on ? "bg-bg/20" : "bg-raised")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
