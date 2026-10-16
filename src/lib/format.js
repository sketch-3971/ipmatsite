export const mmss = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
export const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const shortDay = (ts) => new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
