import { useState } from "react";

/** Single-series trend. data: [{label, value (0-100 | null), note}] */
export function LineChart({ data, unit = "%", ariaLabel }) {
  const W = 640, H = 220, L = 34, R = 12, T = 14, B = 28;
  const [hover, setHover] = useState(null);
  const iw = W - L - R, ih = H - T - B;
  const x = (i) => L + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => T + ih - (v / 100) * ih;
  const segs = []; let cur = [];
  data.forEach((d, i) => { if (d.value == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(d.value)]); });
  if (cur.length) segs.push(cur);
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = (pts) => `${path(pts)} L${pts[pts.length - 1][0]},${T + ih} L${pts[0][0]},${T + ih} Z`;
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = 1e9;
    data.forEach((d, i) => { const dd = Math.abs(x(i) - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };
  const hd = hover != null ? data[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full select-none">
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth="1" strokeDasharray={g === 0 ? "" : "3 4"} />
            <text x={L - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--faint)">{g}</text>
          </g>
        ))}
        {data.map((d, i) => (i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--faint)">{d.label}</text>
        ))}
        {segs.map((s, i) => s.length > 1 && <path key={`a${i}`} d={area(s)} fill="var(--accent)" opacity=".08" />)}
        {segs.map((s, i) => <path key={i} d={path(s)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
        {data.map((d, i) => d.value != null && <circle key={i} cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />)}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={T + ih} stroke="var(--faint)" strokeWidth="1" />}
        <rect x={L} y={0} width={iw} height={H} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchStart={(e) => onMove(e.touches[0] && { currentTarget: e.currentTarget, clientX: e.touches[0].clientX })} />
      </svg>
      {hd && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <p className="font-semibold">{hd.label}</p>
          <p className="text-muted">{hd.value == null ? "No practice" : `${hd.value}${unit} accuracy · ${hd.note}`}</p>
        </div>
      )}
    </div>
  );
}
