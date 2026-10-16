import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { newSession, sessionReducer } from "./session.js";
import { seedHistory, toAttempt, streakOf } from "./history.js";
import { generateSet, generateMixed, generateDaily } from "../ai/generate.js";
import { dayKey, hashStr } from "../lib/format.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const KEY = "ipmat-forge:v1";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const write = (patch) => { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch })); } catch { /* storage unavailable: state stays in memory */ } };

export function AppProvider({ children }) {
  const saved = useMemo(read, []);
  const [view, setView] = useState("dashboard");
  const [theme, setTheme] = useState(saved.theme || "dark");
  const [collapsed, setCollapsed] = useState(!!saved.collapsed);
  const [drawer, setDrawer] = useState(false);
  const [real, setReal] = useState(saved.history || []);
  const [session, setSession] = useState(null);
  const [preset, setPreset] = useState(null);
  const [loading, setLoading] = useState(null); // { title, stage }
  const [toast, setToast] = useState(null);
  const [now] = useState(() => Date.now());
  const sample = useMemo(() => seedHistory(now), [now]);
  const history = useMemo(() => [...sample, ...real].sort((a, b) => a.ts - b.ts), [sample, real]);
  const streak = useMemo(() => streakOf(history), [history]);

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); write({ theme }); }, [theme]);
  useEffect(() => write({ collapsed }), [collapsed]);
  useEffect(() => write({ history: real.slice(-400) }), [real]);

  const toastTimer = useRef();
  const notify = useCallback((msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 3200); }, []);
  const go = useCallback((v) => { setView(v); setDrawer(false); window.scrollTo?.(0, 0); document.getElementById("main")?.scrollTo?.(0, 0); }, []);

  const begin = useCallback((payload) => { setSession(newSession(payload)); setView("ai"); setDrawer(false); }, []);

  /** Generate with the staged overlay, then open the arena. */
  const startGenerated = useCallback(async (config, title) => {
    setLoading({ title, stage: 0 });
    try {
      const res = await generateSet(config, (stage) => setLoading({ title, stage }));
      if (!res.questions.length) throw new Error("No questions could be generated for that combination.");
      begin({ questions: res.questions, config, meta: { prompt: res.prompt, seed: res.seed, issues: res.issues }, title });
    } catch (e) { notify(e.message || "Generation failed. Try a different topic."); }
    finally { setLoading(null); }
  }, [begin, notify]);

  const startMixed = useCallback(async (parts, title) => {
    setLoading({ title, stage: 0 });
    try {
      const res = await generateMixed(parts, (stage) => setLoading({ title, stage }));
      begin({ questions: res.questions, config: { section: "MIXED", topic: "Mixed", difficulty: parts[0].difficulty, count: res.questions.length }, meta: { prompt: res.prompt, issues: res.issues }, title });
    } finally { setLoading(null); }
  }, [begin]);

  const startDaily = useCallback((section = "VARC-RC", count = 3) => {
    const questions = generateDaily(section, count, dayKey(Date.now()), hashStr);
    begin({ questions, config: { section, topic: "Reading Comprehension", difficulty: 3, count }, meta: { prompt: "", issues: [] }, title: "Today's daily RC" });
  }, [begin]);

  const retry = useCallback((questions, title) => {
    begin({ questions, config: { section: "RETRY", topic: "Retry", difficulty: 3, count: questions.length }, meta: { prompt: "", issues: [] }, title });
  }, [begin]);

  const dispatch = useCallback((act) => setSession((s) => (s ? sessionReducer(s, act) : s)), []);

  const sessionRef = useRef(null);
  sessionRef.current = session;
  const finish = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const done = s.status === "done" ? s : sessionReducer(s, { type: "FINISH", now: Date.now() });
    if (done.recorded) { setSession(done); return; }
    const ts = done.finishedAt || Date.now();
    const atts = done.questions.map((q, i) => (done.answers[i].submitted ? toAttempt(q, done.answers[i], ts + i) : null)).filter(Boolean);
    setReal((r) => [...r, ...atts]);
    setSession({ ...done, recorded: true });
  }, []);

  const endSession = useCallback(() => setSession(null), []);

  const value = {
    view, go, theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    collapsed, toggleCollapsed: () => setCollapsed((c) => !c), drawer, setDrawer,
    history, realCount: real.length, streak, session, dispatch, finish, endSession,
    preset, setPreset, loading, startGenerated, startMixed, startDaily, retry, toast, notify, now,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
