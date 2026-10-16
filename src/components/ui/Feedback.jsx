import { Check, Loader2, Sparkles } from "lucide-react";
import { STAGES } from "../../ai/generate.js";
import { cn } from "../../lib/cn.js";
import { useApp } from "../../store/AppStore.jsx";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 animate-rise rounded-xl border border-line bg-fg px-4 py-2.5 text-sm font-medium text-bg shadow-xl">
      {toast}
    </div>
  );
}

export function LoadingOverlay() {
  const { loading } = useApp();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-6 backdrop-blur-sm" role="alertdialog" aria-live="polite" aria-label="Generating questions">
      <div className="w-full max-w-sm animate-pop rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent-fg"><Sparkles className="size-5" /></span>
          <div>
            <p className="font-semibold">Preparing your set</p>
            <p className="text-sm text-muted">{loading.title}</p>
          </div>
        </div>
        <ol className="space-y-3">
          {STAGES.map((s, i) => {
            const done = i < loading.stage, active = i === loading.stage;
            return (
              <li key={s.key} className={cn("flex items-center gap-3 text-sm", done || active ? "text-fg" : "text-faint")}>
                <span className={cn("grid size-5 place-items-center rounded-full border", done ? "border-mint bg-mint text-white" : active ? "border-accent" : "border-line")}>
                  {done ? <Check className="size-3" strokeWidth={3} /> : active ? <Loader2 className="size-3 animate-spin text-accent-fg" /> : null}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
