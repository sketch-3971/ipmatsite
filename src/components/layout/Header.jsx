import { Flame, Menu, Moon, Sparkles, Sun, User } from "lucide-react";
import { NAV } from "../../data/nav.js";
import { useApp } from "../../store/AppStore.jsx";
import { Brand } from "./Sidebar.jsx";

export function Header() {
  const { view, go, setDrawer, theme, toggleTheme, streak } = useApp();
  const cur = NAV.find((n) => n.id === view);
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-6">
      <button onClick={() => setDrawer(true)} aria-label="Open menu" className="-ml-1 rounded-md p-2 text-muted hover:bg-raised hover:text-fg lg:hidden"><Menu className="size-5" /></button>
      <div className="lg:hidden"><Brand compact /></div>
      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-sm font-semibold">{cur?.label}</p>
        <p className="truncate text-[13px] text-muted">{cur?.blurb}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => go("dashboard")} title="Daily streak" className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm font-semibold hover:bg-raised">
          <Flame className="size-4 text-amber" /> <span className="tabular-nums">{streak.streak}</span><span className="hidden text-muted sm:inline">day streak</span>
        </button>
        <button onClick={() => go("ai")} className="hidden h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:brightness-110 sm:flex"><Sparkles className="size-4" /> Generate questions</button>
        <button onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted hover:bg-raised hover:text-fg">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <span className="grid size-9 place-items-center rounded-full bg-raised text-muted" aria-label="Profile"><User className="size-4" /></span>
      </div>
    </header>
  );
}
