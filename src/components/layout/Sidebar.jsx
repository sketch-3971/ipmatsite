import { useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, X, Crown } from "lucide-react";
import { NAV } from "../../data/nav.js";
import { cn } from "../../lib/cn.js";
import { useApp } from "../../store/AppStore.jsx";

export function Brand({ compact }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 shrink-0 place-items-center rounded-[5px] bg-accent px-2 font-mono text-[12px] font-bold tracking-tight text-white">IPMAT</span>
      {!compact && <span className="text-[17px] font-bold tracking-tight">Forge</span>}
    </div>
  );
}

function NavList({ compact, onPick }) {
  const { view, go, session } = useApp();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const on = view === item.id, Icon = item.icon;
        return (
          <button key={item.id} onClick={() => { go(item.id); onPick?.(); }} aria-current={on ? "page" : undefined} title={compact ? item.label : undefined}
            className={cn("group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", compact && "justify-center px-0", on ? "bg-raised text-fg" : "text-muted hover:bg-raised/70 hover:text-fg")}>
            <span className={cn("absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-accent transition-opacity", on ? "opacity-100" : "opacity-0")} />
            <Icon className={cn("size-[18px] shrink-0", on && "text-accent-fg")} />
            {!compact && <span className="truncate">{item.label}</span>}
            {!compact && item.badge && !(session && item.id === "ai") && <span className="ml-auto rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-semibold text-mint-fg">{item.badge}</span>}
            {!compact && session && item.id === "ai" && session.status === "active" && <span className="ml-auto rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-semibold text-amber-fg">Live</span>}
          </button>
        );
      })}
    </nav>
  );
}

function PlanCard({ compact }) {
  const { go } = useApp();
  if (compact) return <button onClick={() => go("pricing")} title="Upgrade" className="mx-auto grid size-10 place-items-center rounded-lg border border-line text-amber-fg hover:bg-raised"><Crown className="size-[18px]" /></button>;
  return (
    <div className="rounded-xl border border-line bg-bg p-3.5">
      <p className="text-sm font-semibold">Starter plan</p>
      <p className="mt-0.5 text-[13px] text-muted">2 of 12 mocks unlocked</p>
      <button onClick={() => go("pricing")} className="mt-3 h-8 w-full rounded-md bg-fg text-[13px] font-semibold text-bg hover:opacity-90">Upgrade to Pro</button>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, toggleCollapsed, drawer, setDrawer } = useApp();
  useEffect(() => {
    if (!drawer) return;
    const k = (e) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [drawer, setDrawer]);
  return (
    <>
      <aside className={cn("hidden shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex h-16 items-center border-b border-line", collapsed ? "justify-center" : "justify-between px-4")}>
          <Brand compact={collapsed} />
          {!collapsed && <button onClick={toggleCollapsed} aria-label="Collapse sidebar" className="rounded-md p-1.5 text-muted hover:bg-raised hover:text-fg"><PanelLeftClose className="size-[18px]" /></button>}
        </div>
        <div className="flex-1 overflow-y-auto p-3"><NavList compact={collapsed} /></div>
        <div className="space-y-2 border-t border-line p-3">
          {collapsed && <button onClick={toggleCollapsed} aria-label="Expand sidebar" className="mx-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-raised hover:text-fg"><PanelLeftOpen className="size-[18px]" /></button>}
          <PlanCard compact={collapsed} />
        </div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs animate-drawer flex-col border-r border-line bg-surface shadow-2xl" aria-label="Navigation drawer">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Brand />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-md p-1.5 text-muted hover:bg-raised"><X className="size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3"><NavList onPick={() => setDrawer(false)} /></div>
            <div className="border-t border-line p-3"><PlanCard /></div>
          </aside>
        </div>
      )}
    </>
  );
}
