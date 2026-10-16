import { Fragment } from "react";

/* Renders the light Markdown + math used in question text:
   **bold**, `code`, $LaTeX$ (frac, sqrt, ^, _, common symbols), plain x^2 and log_2 forms, and line breaks. */

const SYMBOLS = { "\\times": "×", "\\cdot": "·", "\\div": "÷", "\\le": "≤", "\\ge": "≥", "\\leq": "≤", "\\geq": "≥", "\\neq": "≠", "\\pm": "±", "\\pi": "π", "\\infty": "∞", "\\alpha": "α", "\\beta": "β", "\\theta": "θ", "\\circ": "°", "\\log": "log", "\\ln": "ln", "\\,": " " };


function plain(text, kp) {
  const out = []; let last = 0, i = 0;
  const re = /\^(\{[^}]*\}|\([^)]*\)|[-−]?[A-Za-z0-9]+)|_(\{[^}]*\}|[A-Za-z0-9]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const clean = (s) => s.replace(/^[{(]|[})]$/g, "");
    out.push(m[1] !== undefined ? <sup key={`${kp}-${i++}`}>{clean(m[1])}</sup> : <sub key={`${kp}-${i++}`}>{clean(m[2])}</sub>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function math(src, kp) {
  const nodes = []; let rest = src, i = 0;
  const brace = (s, at) => { let d = 0; for (let k = at; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return k; } return -1; };
  while (rest.length) {
    const f = rest.indexOf("\\frac{"), r = rest.indexOf("\\sqrt{");
    const next = [f, r].filter((x) => x >= 0).sort((a, b) => a - b)[0];
    if (next === undefined) { nodes.push(...plain(sym(rest), `${kp}p${i++}`)); break; }
    if (next > 0) nodes.push(...plain(sym(rest.slice(0, next)), `${kp}p${i++}`));
    if (next === f) {
      const e1 = brace(rest, f + 5), e2 = brace(rest, e1 + 1);
      if (e1 < 0 || e2 < 0) { nodes.push(rest); break; }
      nodes.push(<span key={`${kp}f${i++}`} className="frac"><span>{math(rest.slice(f + 6, e1), `${kp}n${i}`)}</span><span>{math(rest.slice(e1 + 2, e2), `${kp}d${i}`)}</span></span>);
      rest = rest.slice(e2 + 1);
    } else {
      const e = brace(rest, r + 5);
      if (e < 0) { nodes.push(rest); break; }
      nodes.push(<Fragment key={`${kp}s${i++}`}>√({math(rest.slice(r + 6, e), `${kp}r${i}`)})</Fragment>);
      rest = rest.slice(e + 1);
    }
  }
  return nodes;
}
const sym = (s) => Object.entries(SYMBOLS).reduce((a, [k, v]) => a.split(k).join(v), s);

function inline(text, kp) {
  const parts = text.split(/(\*\*[^*]+\*\*|\$[^$]+\$|`[^`]+`)/g).filter((p) => p !== "");
  return parts.map((p, i) => {
    const k = `${kp}-${i}`;
    if (p.startsWith("**")) return <strong key={k} className="font-semibold">{plain(p.slice(2, -2), k)}</strong>;
    if (p.startsWith("$")) return <span key={k} className="whitespace-nowrap">{math(p.slice(1, -1), k)}</span>;
    if (p.startsWith("`")) return <code key={k} className="rounded bg-raised px-1 py-0.5 font-mono text-[0.9em]">{p.slice(1, -1)}</code>;
    return <Fragment key={k}>{plain(p, k)}</Fragment>;
  });
}

export function RichText({ text, inline: isInline, className }) {
  const src = String(text ?? "");
  if (isInline) return <span className={`rich ${className || ""}`}>{inline(src, "i")}</span>;
  const blocks = src.split(/\n{2,}/);
  return (
    <div className={`rich space-y-3 ${className || ""}`}>
      {blocks.map((b, bi) => (
        <p key={bi}>
          {b.split("\n").map((line, li, arr) => (
            <Fragment key={li}>{inline(line, `${bi}-${li}`)}{li < arr.length - 1 && <br />}</Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
