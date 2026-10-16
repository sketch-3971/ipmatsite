import { cn } from "../../lib/cn.js";

/** Horizontal bars, each labelled directly. rows: [{label, value (0-100), right, color, sub}] */
export function BarList({ rows, className }) {
  return (
    <ul className={cn("space-y-3.5", className)}>
      {rows.map((r) => (
        <li key={r.label} title={r.sub}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted">{r.right ?? `${Math.round(r.value)}%`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-raised">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(2, r.value)}%`, background: r.color || "var(--accent)" }} />
          </div>
          {r.sub && <p className="mt-1 text-xs text-faint">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
