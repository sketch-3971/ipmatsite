/* ============================================================
   IPMAT Forge · question engine core
   Schema: question_id, section, topic, difficulty, question_text,
           options, correct_answer, solution_steps, trap_analysis
   (+ hints, avg_time_sec, passage for VARC)
   ============================================================ */
const U = {};

U.rng = function (seed) {
  let a = seed >>> 0;
  const f = function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    f,
    int: (lo, hi) => lo + Math.floor(f() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
    shuffle: (arr) => {
      const b = arr.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(f() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    },
  };
};

U.gcd = (a, b) => (b ? U.gcd(b, a % b) : Math.abs(a));
U.lcm = (a, b) => (a / U.gcd(a, b)) * b;
U.fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
U.comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
U.powmod = (a, n, m) => {
  let r = 1n, b = BigInt(a) % BigInt(m), e = BigInt(n); const M = BigInt(m);
  while (e > 0n) { if (e & 1n) r = (r * b) % M; b = (b * b) % M; e >>= 1n; }
  return Number(r);
};
U.legendre = (n, p) => { let c = 0; while (n >= p) { n = Math.floor(n / p); c += n; } return c; };
U.num = (n) => String(+Number(n).toFixed(2));
U.frac = (p, q) => { const g = U.gcd(p, q) || 1; return (p / g) + "/" + (q / g); };
U.sign = (n) => (n < 0 ? "−" : "+");
U.coef = (a) => (a === 1 ? "" : a === -1 ? "−" : String(a));
U.multiset = (word) => { const m = {}; for (const ch of word) m[ch] = (m[ch] || 0) + 1; return m; };
U.msPerms = (letters) => {
  const m = U.multiset(letters.join(""));
  let r = U.fact(letters.length);
  for (const k in m) r /= U.fact(m[k]);
  return Math.round(r);
};

/* AVG time per question (seconds) by difficulty 1..4 */
U.AVG = { "QA-MCQ": [60, 80, 100, 130], "QA-SAQ": [90, 120, 150, 180], VARC: [45, 60, 75, 90], LR: [60, 80, 100, 130] };

/* Build 4 options from a correct answer + labelled distractors */
U.buildOptions = function (R, answer, traps, fmt) {
  fmt = fmt || ((v) => (typeof v === "number" ? U.num(v) : String(v)));
  const seen = new Set([fmt(answer)]);
  const dis = [];
  for (const t of R.shuffle(traps)) {
    if (t.v === undefined || (typeof t.v === "number" && !isFinite(t.v))) continue;
    if (typeof answer === "number" && answer > 0 && t.v <= 0) continue;
    const s = fmt(t.v);
    if (seen.has(s)) continue;
    seen.add(s);
    dis.push({ text: s, reason: t.why });
  }
  let k = 1;
  while (dis.length < 3 && typeof answer === "number" && k < 40) {
    const step = Math.max(1, Math.round(Math.abs(answer) * 0.08)) * k;
    for (const v of [answer + step, answer - step]) {
      if (dis.length >= 3) break;
      if (answer > 0 && v <= 0) continue;
      const s = fmt(v);
      if (!seen.has(s)) { seen.add(s); dis.push({ text: s, reason: "A near-miss value that comes from a small slip in the last arithmetic step." }); }
    }
    k++;
  }
  const picked = dis.slice(0, 3);
  const correct = fmt(answer);
  return {
    options: R.shuffle([correct].concat(picked.map((d) => d.text))),
    correct,
    trap_analysis: picked.map((d) => ({ option: d.text, reason: d.reason })),
  };
};

U.finalize = function (spec, section, d, R, id) {
  const isMCQ = section !== "QA-SAQ";
  const fmt = spec.fmt || ((v) => (typeof v === "number" ? U.num(v) : String(v)));
  const q = {
    question_id: id,
    section,
    topic: spec.topic,
    difficulty: d,
    question_text: spec.text,
    options: [],
    correct_answer: "",
    solution_steps: spec.steps,
    trap_analysis: [],
    hints: spec.hints,
    avg_time_sec: spec.avg || U.AVG[section][d - 1],
  };
  if (spec.passage) { q.passage = spec.passage; q.passage_title = spec.passage_title; }
  if (isMCQ) {
    const o = U.buildOptions(R, spec.answer, spec.traps || [], fmt);
    q.options = o.options; q.correct_answer = o.correct; q.trap_analysis = o.trap_analysis;
  } else {
    q.correct_answer = fmt(spec.answer);
    q.trap_analysis = (spec.traps || []).slice(0, 3).map((t) => ({ option: fmt(t.v), reason: t.why }));
  }
  return q;
};

/* ---------- Quantitative Ability generators: Algebra + Number Systems ---------- */
const REG = [];
const reg = (id, group, saq, fn) => REG.push({ id, group, saq, fn });

/* ===== ALGEBRA ===== */
reg("alg_roots", "Algebra", true, function (d, R) {
  const a = d >= 3 ? R.pick([2, 3]) : 1;
  const S = R.int(3, [8, 12, 14, 18][d - 1]);
  const P = R.int(2, Math.max(2, Math.floor((S * S) / 4)));
  const kind = ["sq", "cube", "cube", "fourth"][d - 1];
  const eq = `${a > 1 ? a : ""}x^2 − ${a * S}x + ${a * P} = 0`;
  let ans, expr, ident, sub, traps;
  if (kind === "sq") {
    ans = S * S - 2 * P; expr = "α^2 + β^2"; ident = "α² + β² = (α+β)² − 2αβ";
    sub = `${S}² − 2×${P} = ${S * S} − ${2 * P}`;
    traps = [
      { v: S * S - P, why: "Used (α+β)² − αβ; the identity needs 2αβ, not αβ." },
      { v: S * S + 2 * P, why: "Sign slip: wrote (α+β)² + 2αβ instead of subtracting." },
      { v: S - 2 * P, why: "Forgot to square the sum of the roots." },
      { v: S * S - 4 * P, why: "Computed the discriminant (α−β)² instead of α²+β²." },
    ];
  } else if (kind === "cube") {
    ans = S ** 3 - 3 * S * P; expr = "α^3 + β^3"; ident = "α³ + β³ = (α+β)³ − 3αβ(α+β)";
    sub = `${S}³ − 3×${P}×${S} = ${S ** 3} − ${3 * S * P}`;
    traps = [
      { v: S ** 3 - 3 * P, why: "Dropped the factor (α+β) from the 3αβ(α+β) term." },
      { v: S ** 3 + 3 * S * P, why: "Sign slip in the identity: it is minus 3αβ(α+β)." },
      { v: S ** 3 - S * P, why: "Used coefficient 1 instead of 3 on αβ(α+β)." },
      { v: S ** 3 - 2 * S * P, why: "Borrowed the coefficient 2 from the square identity." },
    ];
  } else {
    ans = (S * S - 2 * P) ** 2 - 2 * P * P; expr = "α^4 + β^4"; ident = "α⁴ + β⁴ = (α²+β²)² − 2(αβ)², with α²+β² = (α+β)² − 2αβ";
    sub = `(${S}² − 2×${P})² − 2×${P}² = ${(S * S - 2 * P) ** 2} − ${2 * P * P}`;
    traps = [
      { v: (S * S - 2 * P) ** 2, why: "Stopped at (α²+β²)² and forgot to subtract 2(αβ)²." },
      { v: (S * S - 2 * P) ** 2 + 2 * P * P, why: "Sign slip: added 2(αβ)² instead of subtracting." },
      { v: (S * S - 2 * P) ** 2 - 2 * P, why: "Used 2αβ instead of 2(αβ)² in the last step." },
      { v: S ** 4 - 4 * S * S * P, why: "Dropped the +2(αβ)² term from the expanded form S⁴ − 4S²P + 2P²." },
    ];
  }
  return {
    topic: "Algebra · Roots of a quadratic",
    text: `If α and β are the roots of the equation ${eq}, find the value of ${expr}.`,
    answer: ans,
    traps,
    hints: [
      "You do not need the roots themselves. Think of what the coefficients tell you about them.",
      `Use Vieta's formulas for the sum and product, then rewrite the target using ${ident.split("=")[0].trim()}-type identities.`,
      `The sum of the roots is ${S} and the product is ${P}. Now substitute into: ${ident}.`,
    ],
    steps: [
      a > 1 ? `Divide the equation by ${a} to get x² − ${S}x + ${P} = 0.` : `The equation is already monic: x² − ${S}x + ${P} = 0.`,
      `By Vieta's formulas, α + β = ${S} and αβ = ${P}.`,
      `Use the identity ${ident}.`,
      `Substitute: ${sub}.`,
      `Therefore the value is ${ans}.`,
    ],
  };
});

reg("alg_system", "Algebra", true, function (d, R) {
  const lim = [6, 9, 12, 15][d - 1];
  let x, y, a1, b1, a2, b2, det;
  do {
    const neg = d >= 3;
    x = R.int(1, lim) * (neg && R.chance(0.3) ? -1 : 1);
    y = R.int(1, lim) * (neg && R.chance(0.3) ? -1 : 1);
    a1 = R.int(1, 5); a2 = R.int(1, 5);
    b1 = R.int(1, 5) * (d >= 2 && R.chance(0.35) ? -1 : 1);
    b2 = R.int(1, 5) * (d >= 2 && R.chance(0.35) ? -1 : 1);
    det = a1 * b2 - a2 * b1;
  } while (det === 0);
  const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
  const eqs = (a, b, c) => `${U.coef(a)}x ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y = ${c}`;
  const tg = [
    [["x + y", (p, q) => p + q], ["x − y", (p, q) => p - q]],
    [["x × y", (p, q) => p * q], ["2x + y", (p, q) => 2 * p + q]],
    [["x^2 + y^2", (p, q) => p * p + q * q], ["x^2 − y^2", (p, q) => p * p - q * q]],
    [["x^2 + y^2 + xy", (p, q) => p * p + q * q + p * q], ["x^2 − y^2 + 2xy", (p, q) => p * p - q * q + 2 * p * q]],
  ][d - 1];
  const [label, f] = R.pick(tg);
  const Nx = c1 * b2 - c2 * b1;
  return {
    topic: "Algebra · Simultaneous equations",
    text: `If ${eqs(a1, b1, c1)} and ${eqs(a2, b2, c2)}, find the value of ${label}.`,
    answer: f(x, y),
    traps: [
      { v: f(y, x), why: "Swapped the values of x and y before evaluating." },
      { v: f(x, -y), why: "Sign error on y while eliminating the variable." },
      { v: f(-x, y), why: "Sign error on x when dividing by the determinant." },
      { v: f(x + 1, y), why: "Arithmetic slip while solving for x." },
      { v: f(x, y - 1), why: "Arithmetic slip while back-substituting for y." },
    ],
    hints: [
      "Eliminate one variable first; do not guess values.",
      "Multiply the equations so the coefficients of y match in size, then add or subtract.",
      `Eliminating y gives ${det}x = ${Nx}. Solve for x, then substitute back into either equation.`,
    ],
    steps: [
      `Multiply the first equation by ${b2} and the second by ${b1}, then subtract to remove y: (${a1}×${b2} − ${a2}×${b1})x = ${c1}×${b2} − ${c2}×${b1}.`,
      `That simplifies to ${det}x = ${Nx}, so x = ${x}.`,
      `Substitute x = ${x} into the first equation: ${b1}y = ${c1} − ${a1 * x} = ${c1 - a1 * x}, so y = ${y}.`,
      `Evaluate ${label.replace("^2", "²")} at x = ${x}, y = ${y}: the value is ${f(x, y)}.`,
    ],
  };
});

reg("alg_inequality", "Algebra", true, function (d, R) {
  const brute = (pred) => { let c = 0; const xs = []; for (let x = -300; x <= 300; x++) if (pred(x)) { c++; xs.push(x); } return { c, xs }; };
  let a = 1, b, c, strict = d !== 2, text, pred, other, shownRange;
  let centre = R.int(-6, 12); if (centre === 0) centre = 3;
  if (d <= 2) {
    b = R.int(4, 14);
    pred = (x) => (strict ? Math.abs(x - centre) < b : Math.abs(x - centre) <= b);
    other = (x) => (!strict ? Math.abs(x - centre) < b : Math.abs(x - centre) <= b);
    text = `How many integers x satisfy |x ${centre < 0 ? "+" : "−"} ${Math.abs(centre)}| ${strict ? "<" : "≤"} ${b}?`;
  } else {
    a = R.int(2, 4); c = R.int(6, 20); b = a * R.int(-3, 6) + R.int(0, a - 1); if (b === 0) b = a + 1;
    pred = (x) => (strict ? Math.abs(a * x - b) < c : Math.abs(a * x - b) <= c);
    other = (x) => (!strict ? Math.abs(a * x - b) < c : Math.abs(a * x - b) <= c);
    text = `How many integers x satisfy |${a}x ${b < 0 ? "+" : "−"} ${Math.abs(b)}| ${strict ? "<" : "≤"} ${c}?`;
  }
  let finalPred = pred, extra = "";
  if (d === 4) {
    const k = R.pick([3, 4, 5]);
    finalPred = (x) => pred(x) && x % k !== 0;
    text += ` Also, x must not be a multiple of ${k}.`;
    extra = k;
  }
  const base = brute(pred), res = brute(finalPred), oth = brute(other);
  const lo = base.xs[0], hi = base.xs[base.xs.length - 1];
  const steps = [];
  if (d <= 2) steps.push(`|x − (${centre})| ${strict ? "<" : "≤"} ${b} means ${centre - b} ${strict ? "<" : "≤"} x ${strict ? "<" : "≤"} ${centre + b}.`);
  else steps.push(`Rewrite as −${c} ${strict ? "<" : "≤"} ${a}x − ${b} ${strict ? "<" : "≤"} ${c}, i.e. ${b - c} ${strict ? "<" : "≤"} ${a}x ${strict ? "<" : "≤"} ${b + c}. Divide by ${a}.`);
  steps.push(`The integers that qualify run from ${lo} to ${hi}, which is ${base.c} integers.`);
  if (d === 4) {
    steps.push(`Remove the multiples of ${extra} in that range: ${base.c - res.c} of them.`);
    steps.push(`${base.c} − ${base.c - res.c} = ${res.c}.`);
  } else steps.push(`So the answer is ${res.c}.`);
  return {
    topic: "Algebra · Modulus inequalities",
    text,
    answer: res.c,
    traps: [
      { v: oth.c, why: strict ? "Treated the strict inequality as inclusive, which adds the two boundary integers." : "Treated the inclusive inequality as strict, which drops the two boundary integers." },
      { v: res.c + 1, why: "Fencepost error: counted one integer too many in the range." },
      { v: res.c - 1, why: "Fencepost error: computed end − start and forgot the +1." },
      { v: d >= 3 ? 2 * c : 2 * b, why: "Used the width of the interval without checking which integers actually fall inside it." },
    ],
    hints: [
      "A modulus inequality is two inequalities in one. Remove the modulus by writing a double inequality.",
      "Solve the double inequality for x, paying attention to whether each end is included.",
      `Once you have the interval, count the integers between its ends. Here the smallest qualifying integer is ${lo}.`,
    ],
    steps,
  };
});

/* ===== NUMBER SYSTEMS ===== */
reg("ns_remainder", "Number Systems", true, function (d, R) {
  let a, n, m, tries = 0;
  const ms = [[7, 9, 11, 13], [7, 11, 13, 17], [12, 15, 20, 35, 45], [100, 100, 63, 72]][d - 1];
  do {
    m = R.pick(ms); a = R.int(2, d >= 3 ? 19 : 12);
    n = R.int(...[[20, 60], [90, 300], [200, 900], [500, 2500]][d - 1]);
    tries++;
  } while (U.gcd(a, m) !== 1 && tries < 100);
  if (U.gcd(a, m) !== 1) { a = 7; m = 100; }
  const r = []; let L = 0;
  for (let k = 1; k <= 400; k++) { r.push(U.powmod(a, k, m)); if (r[k - 1] === 1) { L = k; break; } }
  const idx = n % L === 0 ? L : n % L;
  const ans = r[idx - 1];
  const showR = r.slice(0, Math.min(L, 12)).join(", ") + (L > 12 ? ", …" : "");
  return {
    topic: "Number Systems · Remainders & cyclicity",
    text: `What is the remainder when ${a}^${n} is divided by ${m}?`,
    answer: ans,
    traps: [
      { v: U.powmod(a, idx + 1, m), why: "Went one step too far along the cycle of remainders." },
      { v: U.powmod(a, Math.max(idx - 1, 0), m), why: "Stopped one step short in the cycle (off-by-one in the exponent)." },
      { v: n % m, why: "Divided the exponent by the modulus instead of the base power." },
      { v: a % m, why: "Assumed the remainder of the base alone carries through the power." },
      { v: n % L === 0 ? 0 : 1, why: "When the exponent is a multiple of the cycle length, the remainder is the last entry of the cycle, not 0." },
    ],
    hints: [
      "Remainders of successive powers repeat. Look for the cycle.",
      `Compute ${a}¹, ${a}², ${a}³ … modulo ${m} until the remainder returns to 1.`,
      `The cycle has length ${L}. Reduce the exponent ${n} modulo ${L} to find the position in the cycle.`,
    ],
    steps: [
      `Since gcd(${a}, ${m}) = 1, remainders of powers of ${a} modulo ${m} repeat.`,
      `The remainders are ${showR}. They first return to 1 after ${L} steps, so the cycle length is ${L}.`,
      `${n} ÷ ${L} leaves remainder ${n % L}${n % L === 0 ? ", so use the last position in the cycle" : ""}; the position is ${idx}.`,
      `The ${idx}${idx === 1 ? "st" : idx === 2 ? "nd" : idx === 3 ? "rd" : "th"} remainder in the cycle is ${ans}.`,
    ],
  };
});

reg("ns_trailing", "Number Systems", true, function (d, R) {
  const rng = [[25, 99], [100, 260], [400, 1200], [60, 180]][d - 1];
  let n = R.int(...rng);
  if (d < 4 && n % 5 === 0) n += 1;
  if (d < 4) {
    const parts = [];
    let p = 5, tot = 0;
    while (p <= n) { const q = Math.floor(n / p); parts.push(`⌊${n}/${p}⌋ = ${q}`); tot += q; p *= 5; }
    return {
      topic: "Number Systems · Factorials & zeros",
      text: `How many trailing zeros does ${n}! have?`,
      answer: tot,
      traps: [
        { v: Math.floor(n / 5), why: "Counted only the multiples of 5 and ignored extra 5s from 25, 125, …" },
        { v: tot + 1, why: "Added one extra term beyond the highest power of 5 that fits." },
        { v: Math.floor(n / 10), why: "Counted multiples of 10 instead of factors of 5." },
        { v: tot - Math.floor(n / 125) || tot - 1, why: "Missed the higher powers of 5 (125, 625)." },
      ],
      hints: [
        "A trailing zero comes from a factor 10 = 2 × 5. Which of the two is scarcer in a factorial?",
        "Count the factors of 5, remembering that 25, 125, … contribute more than one.",
        `Add ⌊${n}/5⌋ + ⌊${n}/25⌋ + ⌊${n}/125⌋ + … until the quotient reaches 0.`,
      ],
      steps: [
        "Each trailing zero needs one factor 2 and one factor 5. Factors of 2 are far more plentiful, so count the 5s.",
        `Number of 5s in ${n}! = ${parts.join(" + ")}.`,
        `Total = ${tot}. So ${n}! ends with ${tot} zeros.`,
      ],
    };
  }
  const v2 = U.legendre(n, 2), v3 = U.legendre(n, 3);
  const ans = Math.min(Math.floor(v2 / 2), v3);
  return {
    topic: "Number Systems · Factorials & zeros",
    text: `How many trailing zeros does ${n}! have when written in base 12?`,
    answer: ans,
    traps: [
      { v: U.legendre(n, 5), why: "Counted factors of 5, which is the base-10 rule and irrelevant in base 12." },
      { v: v3, why: "Counted only factors of 3 and forgot that 12 = 2² × 3 needs two 2s per zero." },
      { v: v2, why: "Counted factors of 2 without dividing by 2 for the 2² in 12." },
      { v: Math.floor(v2 / 2), why: "Used only the supply of 2s; check which prime runs out first." },
    ],
    hints: [
      "Write the base as a product of primes. What must n! contain for each zero?",
      "12 = 2² × 3, so each zero uses two 2s and one 3. Find how many of each n! contains.",
      `n! has ${v2} factors of 2 and ${v3} factors of 3. How many complete (2², 3) pairs can you form?`,
    ],
    steps: [
      "12 = 2² × 3, so every trailing zero in base 12 consumes two factors of 2 and one factor of 3.",
      `Factors of 2 in ${n}! = ${v2}, so at most ⌊${v2}/2⌋ = ${Math.floor(v2 / 2)} blocks of 2².`,
      `Factors of 3 in ${n}! = ${v3}.`,
      `Zeros = min(${Math.floor(v2 / 2)}, ${v3}) = ${ans}.`,
    ],
  };
});

reg("ns_divisors", "Number Systems", true, function (d, R) {
  const primes = R.shuffle([2, 3, 5, 7, 11]).slice(0, d === 1 ? 2 : 3);
  const exps = primes.map(() => R.int(d === 1 ? 2 : 1, d >= 3 ? 6 : 4));
  const N = primes.map((p, i) => (exps[i] > 1 ? `${p}^${exps[i]}` : `${p}`)).join(" × ");
  const total = exps.reduce((s, e) => s * (e + 1), 1);
  if (d <= 2) {
    return {
      topic: "Number Systems · Factors",
      text: `How many positive divisors does ${N} have?`,
      answer: total,
      traps: [
        { v: exps.reduce((s, e) => s + e, 0), why: "Added the exponents instead of multiplying (e + 1) for each prime." },
        { v: exps.reduce((s, e) => s * e, 1), why: "Multiplied the exponents and forgot the +1 for the exponent 0 choice." },
        { v: exps.reduce((s, e) => s + e + 1, 0), why: "Added the (e + 1) values instead of multiplying them." },
        { v: total - 1, why: "Removed 1 from the count; the divisor 1 and the number itself both count." },
      ],
      hints: [
        "A divisor picks, for each prime, how many times to include it.",
        "For a prime with exponent e, you can include it 0, 1, …, e times. That is e + 1 choices.",
        `Multiply the number of choices across all ${primes.length} primes.`,
      ],
      steps: [
        "A divisor takes each prime p to some power from 0 up to its exponent in N.",
        `Choices per prime: ${exps.map((e) => e + 1).join(", ")}.`,
        `Total divisors = ${exps.map((e) => e + 1).join(" × ")} = ${total}.`,
      ],
    };
  }
  if (d === 3) {
    const sq = exps.reduce((s, e) => s * (Math.floor(e / 2) + 1), 1);
    return {
      topic: "Number Systems · Factors",
      text: `How many positive divisors of ${N} are perfect squares?`,
      answer: sq,
      traps: [
        { v: total, why: "Counted all divisors, not only the perfect squares." },
        { v: exps.reduce((s, e) => s * Math.max(1, Math.floor(e / 2)), 1), why: "Forgot that an exponent of 0 is allowed (it is even), so each prime has one more choice." },
        { v: exps.reduce((s, e) => s * Math.ceil(e / 2), 1), why: "Rounded up instead of down when counting even exponents." },
        { v: exps.reduce((s, e) => s * (Math.floor((e + 1) / 2) + 1), 1), why: "Counted odd and even exponents together instead of only even ones." },
      ],
      hints: [
        "A number is a perfect square when every prime has an even exponent.",
        "For a prime with exponent e, count the even numbers from 0 to e.",
        `The count of even values in 0..e is ⌊e/2⌋ + 1. Here the exponents are ${exps.join(", ")}.`,
      ],
      steps: [
        "A divisor is a perfect square exactly when each prime appears to an even power.",
        `For exponents ${exps.join(", ")}, the even choices (0 included) are ${exps.map((e) => Math.floor(e / 2) + 1).join(", ")}.`,
        `Multiply: ${exps.map((e) => Math.floor(e / 2) + 1).join(" × ")} = ${sq}.`,
      ],
    };
  }
  const mult = primes.map((p, i) => R.int(0, Math.max(0, exps[i] - 1)));
  if (mult.every((m) => m === 0)) mult[0] = 1;
  const M = primes.map((p, i) => (mult[i] ? (mult[i] > 1 ? `${p}^${mult[i]}` : `${p}`) : null)).filter(Boolean).join(" × ");
  const cnt = exps.reduce((s, e, i) => s * (e - mult[i] + 1), 1);
  return {
    topic: "Number Systems · Factors",
    text: `How many positive divisors of ${N} are multiples of ${M}?`,
    answer: cnt,
    traps: [
      { v: total, why: "Counted every divisor instead of only multiples of the given number." },
      { v: exps.reduce((s, e, i) => s * (e - mult[i]), 1), why: "Used (e − m) choices per prime; the count is e − m + 1 because both ends are allowed." },
      { v: exps.reduce((s, e, i) => s * (e - mult[i] + 2), 1), why: "Used one choice too many for each prime." },
      { v: total - cnt, why: "Counted the divisors that are NOT multiples of the given number." },
    ],
    hints: [
      "A divisor of N that is a multiple of M must contain at least M's prime powers.",
      "For each prime, the exponent must lie between M's exponent and N's exponent.",
      `The number of choices for a prime is (exponent in N) − (exponent in M) + 1. Exponents in N: ${exps.join(", ")}; in M: ${mult.join(", ")}.`,
    ],
    steps: [
      `For a divisor to be a multiple of ${M}, each prime's exponent must be at least its exponent in M.`,
      `Choices per prime: ${exps.map((e, i) => e - mult[i] + 1).join(", ")} (from ${mult.join(", ")} up to ${exps.join(", ")}).`,
      `Multiply: ${exps.map((e, i) => e - mult[i] + 1).join(" × ")} = ${cnt}.`,
    ],
  };
});

/* ---------- Quantitative Ability generators: Arithmetic ---------- */

reg("ar_profit", "Arithmetic", true, function (d, R) {
  if (d === 1) {
    const cp = R.int(8, 60) * 50, pct = R.pick([10, 12, 15, 20, 25, 30]);
    const sp = cp * (100 + pct) / 100;
    if (!Number.isInteger(sp)) return REG.find((g) => g.id === "ar_profit").fn(d, R);
    return {
      topic: "Arithmetic · Profit & loss",
      text: `An article is sold for ₹${sp} at a profit of ${pct}%. What is its cost price (in ₹)?`,
      answer: cp,
      traps: [
        { v: sp * (100 - pct) / 100, why: "Subtracted the profit percentage from the selling price instead of dividing by (1 + profit)." },
        { v: Math.round(sp - sp * pct / 100), why: "Took the profit as a percentage of the selling price instead of the cost price." },
        { v: Math.round(sp * (100 + pct) / 100), why: "Added the profit again on top of the selling price." },
      ],
      hints: ["Profit is always measured on the cost price unless told otherwise.", `Selling price = cost price × (1 + ${pct}/100).`, `Divide ${sp} by ${(100 + pct) / 100}.`],
      steps: [`Profit % is on cost price, so SP = CP × ${100 + pct}/100.`, `CP = ${sp} × 100 / ${100 + pct}.`, `CP = ₹${cp}.`],
    };
  }
  if (d === 3) {
    const g = R.pick([10, 20, 25, 30, 40]);
    const sp = R.pick([1200, 1500, 1800, 2400, 3000]);
    const loss = g * g / 100;
    return {
      topic: "Arithmetic · Profit & loss",
      text: `A trader sells two articles at ₹${sp} each. On one he gains ${g}% and on the other he loses ${g}%. What is his overall loss percentage on the whole transaction?`,
      answer: loss,
      traps: [
        { v: 0, why: "Assumed equal gain and loss percentages cancel out. The two cost prices are different." },
        { v: g, why: "Took the overall result to equal the individual percentage." },
        { v: g / 2, why: "Averaged the percentages without weighting by cost price." },
        { v: g * g / 10, why: "Slipped a factor of 10 while computing g²/100." },
      ],
      hints: ["Compute the two cost prices separately. They are not equal.", "Add the two cost prices and compare with the total selling price.", `The standard result is a loss of (gain %)² / 100 percent when the gain and loss percentages match.`],
      steps: [
        `Cost price of the first article = ${sp} × 100/${100 + g}; of the second = ${sp} × 100/${100 - g}.`,
        `Total cost price = ${sp} × 100 × (1/${100 + g} + 1/${100 - g}) = ${sp} × 100 × ${200}/${(100 + g) * (100 - g)}.`,
        `Total selling price = ${2 * sp}. Overall loss % = (total CP − total SP)/total CP × 100 = ${g}²/100 = ${loss}%.`,
      ],
    };
  }
  // d2 and d4: marked price with one or two discounts, find profit %
  let M, d1, d2n, res, tries = 0, num, den;
  do {
    M = R.pick([20, 25, 30, 40, 50, 60, 80]);
    d1 = R.pick([10, 20, 25, 30, 40]);
    d2n = d === 4 ? R.pick([5, 10, 20, 25]) : 0;
    num = (100 + M) * (100 - d1) * (d === 4 ? 100 - d2n : 100);
    den = d === 4 ? 10000 : 10000;
    tries++;
  } while (num % den !== 0 && tries < 400);
  res = num / den - 100;
  const asked = res;
  const naive = M - d1 - d2n;
  const additive = d === 4 ? (100 + M) * (100 - (d1 + d2n)) / 100 - 100 : M * (100 - d1) / 100;
  return {
    topic: "Arithmetic · Mark-up & discount",
    text: d === 2
      ? `A shopkeeper marks his goods ${M}% above cost price and then allows a discount of ${d1}%. What is his profit percentage?`
      : `A shopkeeper marks his goods ${M}% above cost price. He allows two successive discounts of ${d1}% and ${d2n}%. What is his overall profit percentage?`,
    answer: asked,
    traps: [
      { v: naive, why: "Subtracted the discount percentages directly from the mark-up. Discounts apply to the marked price, not the cost price." },
      { v: additive, why: d === 4 ? "Added the two discounts into one (" + (d1 + d2n) + "%). Successive discounts multiply; they do not add." : "Applied the discount to the mark-up percentage alone instead of the whole marked price." },
      { v: d === 4 ? M - d1 : M - d1 / 2, why: d === 4 ? "Ignored the second discount." : "Halved the discount, as if only part of the marked price were affected." },
      { v: d === 4 ? (100 + M) * (100 - d1) / 100 - 100 : M, why: d === 4 ? "Stopped after the first discount." : "Reported the mark-up as the profit and ignored the discount." },
    ],
    hints: ["Take cost price as ₹100 and track the price step by step.", d === 2 ? "Marked price is 100 + mark-up. The selling price keeps (100 − discount)% of it." : "Apply each discount in turn to the running price, not to the original.", `Marked price = ₹${100 + M}. Multiply by the retention factor(s) to get the selling price.`],
    steps: [
      `Take cost price = ₹100. Marked price = ₹${100 + M}.`,
      d === 2 ? `Selling price = ${100 + M} × ${(100 - d1)}/100 = ₹${(100 + M) * (100 - d1) / 100}.` : `After the first discount: ${100 + M} × ${100 - d1}/100 = ₹${(100 + M) * (100 - d1) / 100}. After the second: that × ${100 - d2n}/100 = ₹${num / den}.`,
      `Profit % = (SP − 100)/100 × 100 = ${asked}%.`,
    ],
  };
});

reg("ar_boat", "Arithmetic", true, function (d, R) {
  let v, y, a, b, D, T, tries = 0;
  do {
    y = R.int(2, [4, 6, 8, 10][d - 1]);
    v = R.int(y + 2, [14, 20, 26, 34][d - 1]);
    a = v + y; b = v - y;
    D = U.lcm(a, b) * R.int(1, 2);
    T = D / a + D / b;
    tries++;
  } while ((D > 900 || !Number.isInteger(T)) && tries < 300);
  const askDist = d >= 3;
  return {
    topic: "Arithmetic · Boats & streams",
    text: askDist
      ? `A boat can travel ${v} km/h in still water, and the stream flows at ${y} km/h. A round trip between two jetties takes ${T} hours in total. Find the distance between the jetties (in km).`
      : `A boat's speed in still water is ${v} km/h and the stream flows at ${y} km/h. How many hours does it take to go ${D} km downstream and return to the starting point?`,
    answer: askDist ? D : T,
    traps: askDist
      ? [
        { v: T * v / 2, why: "Used the still-water speed for both legs and ignored the stream." },
        { v: T * a / 2, why: "Used the downstream speed for the whole trip." },
        { v: T * b / 2, why: "Used the upstream speed for the whole trip." },
        { v: T * v, why: "Forgot that the round trip covers the distance twice." },
      ]
      : [
        { v: 2 * D / v, why: "Ignored the stream. It speeds up one leg and slows the other, and the legs do not cancel." },
        { v: D / a, why: "Counted only the downstream leg." },
        { v: D / b, why: "Counted only the upstream leg." },
        { v: 2 * D / ((a + b) / 2) , why: "Averaged the two speeds. Time-weighted travel needs the harmonic mean, not the arithmetic mean." },
      ],
    hints: ["Downstream speed adds the stream; upstream speed subtracts it.", `Downstream speed = ${a} km/h, upstream speed = ${b} km/h.`, askDist ? `Let the distance be x. Then x/${a} + x/${b} = ${T}.` : `Time = ${D}/${a} + ${D}/${b}.`],
    steps: askDist
      ? [`Downstream speed = ${v} + ${y} = ${a} km/h; upstream speed = ${v} − ${y} = ${b} km/h.`, `Let the distance be x km: x/${a} + x/${b} = ${T}.`, `x(${a + b})/(${a}×${b}) = ${T}, so x = ${T} × ${a * b}/${a + b} = ${D} km.`]
      : [`Downstream speed = ${v} + ${y} = ${a} km/h; upstream speed = ${v} − ${y} = ${b} km/h.`, `Time downstream = ${D}/${a} = ${D / a} h; time upstream = ${D}/${b} = ${D / b} h.`, `Total time = ${T} hours.`],
  };
});

reg("ar_work", "Arithmetic", true, function (d, R) {
  if (d <= 2) {
    let a, b, tries = 0;
    do { a = R.int(6, 40); b = R.int(6, 40); tries++; } while ((a === b || (a * b) % (a + b) !== 0) && tries < 500);
    if ((a * b) % (a + b) !== 0) { a = 12; b = 24; }
    const t = (a * b) / (a + b);
    if (d === 1) {
      return {
        topic: "Arithmetic · Time & work",
        text: `A can finish a job in ${a} days and B can finish it in ${b} days. Working together, in how many days will they finish the job?`,
        answer: t,
        traps: [
          { v: (a + b) / 2, why: "Averaged the two times. Work rates add, not times." },
          { v: a + b, why: "Added the times taken instead of the rates." },
          { v: Math.min(a, b) / 2, why: "Assumed that two workers halve the faster worker's time." },
        ],
        hints: ["Think in terms of the fraction of the job done per day.", `A does 1/${a} per day and B does 1/${b} per day.`, `Together they do 1/${a} + 1/${b} per day. Take the reciprocal.`],
        steps: [`A's rate = 1/${a} per day, B's rate = 1/${b} per day.`, `Combined rate = 1/${a} + 1/${b} = ${a + b}/${a * b}.`, `Time = ${a * b}/${a + b} = ${t} days.`],
      };
    }
    const k = R.int(2, Math.max(2, Math.min(a, b) - 2));
    const L = U.lcm(a, b), ra = L / a, rb = L / b;
    const done = k * (ra + rb), rem = L - done;
    if (rem <= 0) return REG.find((g) => g.id === "ar_work").fn(d, R);
    const extra = rem / ra;
    const ans = k + extra;
    if (!Number.isInteger(ans)) return REG.find((g) => g.id === "ar_work").fn(d, R);
    return {
      topic: "Arithmetic · Time & work",
      text: `A can finish a job in ${a} days and B can finish it in ${b} days. They start together, but B leaves after ${k} days and A finishes the rest alone. In how many days in all is the job completed?`,
      answer: ans,
      traps: [
        { v: extra, why: "Counted only the days A works alone and forgot the first " + k + " days." },
        { v: t * 1 + k, why: "Added the joint-work time to the days B worked." },
        { v: a, why: "Assumed A alone takes its usual full time." },
        { v: k + rem / rb, why: "Let B finish the remaining work instead of A." },
      ],
      hints: ["Take the total work as the LCM of the two times so every rate is a whole number.", `With total work ${L} units: A does ${ra} units/day and B does ${rb} units/day.`, `In ${k} days together they complete ${k}×${ra + rb} = ${done} units. How long does A take for the remaining ${rem}?`],
      steps: [`Let total work = LCM(${a}, ${b}) = ${L} units. A does ${ra} units a day, B does ${rb}.`, `In ${k} days together: ${k} × ${ra + rb} = ${done} units. Remaining = ${rem} units.`, `A alone needs ${rem}/${ra} = ${extra} more days.`, `Total time = ${k} + ${extra} = ${ans} days.`],
    };
  }
  if (d === 3) {
    let a, b, days, tries = 0, ok = false;
    for (; tries < 800 && !ok; tries++) {
      a = R.int(8, 40); b = R.int(8, 40);
      if (a === b) continue;
      const L = U.lcm(a, b), ra = L / a, rb = L / b;
      let w = 0, dd = 0;
      while (w < L && dd < 200) { dd++; w += dd % 2 === 1 ? ra : rb; }
      if (w === L && dd % 2 === 0 && dd >= 6) { days = dd; ok = true; }
    }
    if (!ok) { a = 12; b = 15; days = 10; }
    const L = U.lcm(a, b), ra = L / a, rb = L / b;
    return {
      topic: "Arithmetic · Time & work",
      text: `A can complete a job in ${a} days and B in ${b} days. They work on alternate days, with A working on the first day. In how many days is the job completed?`,
      answer: days,
      traps: [
        { v: Math.round((a * b) / (a + b)), why: "Used the together-time formula; alternating days is not the same as working together." },
        { v: days - 1, why: "Stopped one day early. The last day of work still counts." },
        { v: days + 2, why: "Counted a full extra pair of days after the work was done." },
        { v: (a + b) / 2, why: "Averaged the two completion times." },
      ],
      hints: ["Work out how much gets done in one two-day cycle.", `Total work ${L} units: A does ${ra}/day, B does ${rb}/day, so a two-day cycle does ${ra + rb}.`, `Count whole cycles first, then check whether the remaining work is finished on A's day or B's day.`],
      steps: [`Total work = LCM(${a}, ${b}) = ${L} units. A does ${ra} units on odd days; B does ${rb} units on even days.`, `One two-day cycle completes ${ra + rb} units.`, `Simulating the days: the cumulative work reaches exactly ${L} units at the end of day ${days}.`, `The job is completed in ${days} days.`],
    };
  }
  // d4: pairs given, find all three together
  let L, rA, rB, rC, found = false, tries = 0;
  while (!found && tries < 2000) {
    tries++;
    L = R.pick([60, 120, 180, 240, 360]);
    rA = R.int(1, 12); rB = R.int(1, 12); rC = R.int(1, 12);
    if (rA === rB || rB === rC || rA === rC) continue;
    if (L % (rA + rB) || L % (rB + rC) || L % (rC + rA) || L % (rA + rB + rC)) continue;
    found = true;
  }
  if (!found) { L = 60; rA = 2; rB = 3; rC = 7; }
  const tab = L / (rA + rB), tbc = L / (rB + rC), tca = L / (rC + rA), tall = L / (rA + rB + rC);
  return {
    topic: "Arithmetic · Time & work",
    text: `A and B together can finish a job in ${tab} days, B and C together in ${tbc} days, and C and A together in ${tca} days. In how many days will all three working together finish the job?`,
    answer: tall,
    traps: [
      { v: (tab + tbc + tca) / 3, why: "Averaged the three times. Rates add, times do not." },
      { v: tab + tbc + tca, why: "Added the three times." },
      { v: (tab + tbc + tca) / 2, why: "Halved the sum of times instead of halving the sum of rates." },
      { v: L / (rA + rB + rC) + 1, why: "A slip while converting the combined rate back to days." },
    ],
    hints: ["Convert each time into a rate (work per day) and add the three pair-rates.", `Add the three equations: 2(A + B + C) = 1/${tab} + 1/${tbc} + 1/${tca}.`, "Halve the sum to get the rate of all three together, then take the reciprocal."],
    steps: [`Pair rates: A+B = 1/${tab}, B+C = 1/${tbc}, C+A = 1/${tca}.`, `Adding: 2(A+B+C) = 1/${tab} + 1/${tbc} + 1/${tca} = ${L / tab + L / tbc + L / tca}/${L}.`, `So A+B+C = ${(L / tab + L / tbc + L / tca) / 2}/${L} = 1/${tall}.`, `All three together take ${tall} days.`],
  };
});

reg("ar_alligation", "Arithmetic", true, function (d, R, mode) {
  let r1, r2, p1, p2, m, tries = 0;
  do {
    r1 = R.int(1, d >= 3 ? 7 : 5); r2 = R.int(1, d >= 3 ? 7 : 5);
    p1 = R.int(20, 80); p2 = p1 + R.int(10, 60);
    m = (r1 * p1 + r2 * p2) / (r1 + r2);
    tries++;
  } while ((U.gcd(r1, r2) !== 1 || r1 === r2 || !Number.isInteger(m) || m <= p1 || m >= p2) && tries < 1000);
  if (!Number.isInteger(m)) { r1 = 2; r2 = 3; p1 = 40; p2 = 65; m = 55; }
  const ratio = (x, y) => `${x} : ${y}`;
  if (mode === "saq") {
    const k = R.int(2, 6), total = k * (r1 + r2);
    return {
      topic: "Arithmetic · Mixtures & alligation",
      text: `Rice costing ₹${p1}/kg is mixed with rice costing ₹${p2}/kg to make ${total} kg of a blend worth ₹${m}/kg. How many kilograms of the cheaper rice are used?`,
      answer: k * r1,
      traps: [
        { v: k * r2, why: "Swapped the ratio: the cheaper rice has the larger share only if the mean is closer to its price." },
        { v: total / 2, why: "Assumed equal quantities of the two varieties." },
        { v: (p2 - p1) * 1, why: "Used the difference in prices as a quantity." },
      ],
      hints: ["Use alligation: the ratio of quantities is inverse to the distance of each price from the mean.", `Cheaper : dearer = (${p2} − ${m}) : (${m} − ${p1}).`, `Reduce the ratio, then split ${total} kg in that ratio.`],
      steps: [`By alligation, cheaper : dearer = (${p2} − ${m}) : (${m} − ${p1}) = ${p2 - m} : ${m - p1} = ${r1} : ${r2}.`, `Total parts = ${r1 + r2}, so each part is ${total}/${r1 + r2} = ${k} kg.`, `Cheaper rice = ${r1} × ${k} = ${k * r1} kg.`],
    };
  }
  return {
    topic: "Arithmetic · Mixtures & alligation",
    text: `In what ratio must a variety of rice costing ₹${p1}/kg be mixed with another costing ₹${p2}/kg so that the mixture is worth ₹${m}/kg? (Give cheaper : dearer.)`,
    answer: ratio(r1, r2),
    fmt: (v) => String(v),
    traps: [
      { v: ratio(r2, r1), why: "Reversed the ratio. The cheaper variety's share is proportional to the dearer price's distance from the mean." },
      { v: ratio(m - p1, p2 - m), why: "Put each distance against its own price; alligation crosses them over." },
      { v: ratio(p1, p2), why: "Used the ratio of the prices themselves." },
      { v: ratio(p2 - p1, m - p1), why: "Compared the full price gap with one of the two distances." },
    ],
    hints: ["Mark the mean price between the two prices and look at the two distances.", `Distances: dearer − mean = ${p2 - m}, mean − cheaper = ${m - p1}.`, "The quantities are in the ratio of these distances, crossed over: cheaper gets the dearer's distance."],
    steps: [`Cheaper price ₹${p1}, dearer price ₹${p2}, mean ₹${m}.`, `Cheaper : dearer = (dearer − mean) : (mean − cheaper) = (${p2} − ${m}) : (${m} − ${p1}).`, `= ${p2 - m} : ${m - p1} = ${r1} : ${r2}.`],
  };
});

reg("ar_ci_si", "Arithmetic", true, function (d, R) {
  const n = d <= 2 ? 2 : 3;
  let r, P, tries = 0, diff;
  do {
    r = R.pick([5, 10, 20]);
    P = R.int(1, 40) * (n === 2 ? 100 : 1000);
    const num = n === 2 ? P * r * r : P * r * r * (300 + r);
    const den = n === 2 ? 10000 : 1000000;
    diff = num / den;
    tries++;
  } while (!Number.isInteger(diff) && tries < 500);
  const SI = P * r * n / 100;
  const CI = +(P * (Math.pow(1 + r / 100, n) - 1)).toFixed(2);
  return {
    topic: "Arithmetic · Simple & compound interest",
    text: `Find the difference between the compound interest and the simple interest on ₹${P} for ${n} years at ${r}% per annum, compounded annually (in ₹).`,
    answer: diff,
    traps: [
      { v: CI, why: "Gave the compound interest itself, not the difference." },
      { v: SI, why: "Gave the simple interest instead of the difference." },
      { v: n === 2 ? P * r * r * (300 + r) / 1000000 : P * r * r / 10000, why: n === 2 ? "Used the 3-year formula for a 2-year problem." : "Used the 2-year shortcut P(r/100)² for a 3-year problem." },
      { v: +(CI - SI + r).toFixed(2), why: "A slip in the last subtraction." },
    ],
    hints: ["Compute both amounts, or use the shortcut for the difference.", n === 2 ? "For 2 years, CI − SI = P × (r/100)²." : "For 3 years, CI − SI = P × (r/100)² × (3 + r/100).", `Plug in P = ${P}, r = ${r}.`],
    steps: [`Simple interest = ${P} × ${r} × ${n}/100 = ₹${SI}.`, `Compound interest = ${P} × ((1 + ${r}/100)^${n} − 1) = ₹${CI}.`, `Difference = ${CI} − ${SI} = ₹${diff}.`, n === 2 ? `Check with the shortcut: ${P} × (${r}/100)² = ₹${diff}.` : `Check with the shortcut: ${P} × (${r}/100)² × (3 + ${r}/100) = ₹${diff}.`],
  };
});

/* ---------- Quantitative Ability generators: Modern Math + Geometry ---------- */
const VOW = "AEIOU";
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

reg("mm_arrange", "Modern Math", true, function (d, R) {
  const W = {
    1: ["BANANA", "PEPPER", "LEVEL", "SUCCESS"],
    2: ["BALLOON", "COMMITTEE", "MISSISSIPPI"],
    3: ["DAUGHTER", "LOGARITHM", "COMMITTEE", "EDUCATION"],
    4: ["TRIANGLE", "DAUGHTER", "COMMITTEE", "PRIORITY"],
  };
  const w = R.pick(W[d]);
  const letters = w.split("");
  const total = U.msPerms(letters);
  const vowels = letters.filter((c) => VOW.includes(c)), cons = letters.filter((c) => !VOW.includes(c));
  if (d <= 2) {
    const m = U.multiset(w);
    const reps = Object.keys(m).filter((k) => m[k] > 1).map((k) => `${k} appears ${m[k]} times`).join(", ");
    const denom = Object.keys(m).filter((k) => m[k] > 1).map((k) => `${m[k]}!`).join(" × ");
    return {
      topic: "Modern Math · Permutations",
      text: `How many distinct arrangements can be made using all the letters of the word ${w}?`,
      answer: total,
      traps: [
        { v: U.fact(letters.length), why: "Treated repeated letters as different. Swapping identical letters gives the same word." },
        { v: Math.round(U.fact(letters.length) / U.fact(Math.max(...Object.values(m)))), why: "Divided by the factorial of only the largest repeat and ignored the other repeated letters." },
        { v: Math.round(total / letters.length), why: "Divided by the number of letters one time too many." },
        { v: total * 2, why: "Doubled the count by treating the order of identical letters as significant in pairs." },
      ],
      hints: ["Count arrangements as if all letters were different, then correct for repeated letters.", `The word has ${letters.length} letters. ${reps || "No letter repeats"}.`, `Divide ${letters.length}! by ${denom || "1"}.`],
      steps: [`${w} has ${letters.length} letters; ${reps}.`, `If all were distinct there would be ${letters.length}! = ${U.fact(letters.length)} arrangements.`, `Each repeated letter group is counted ${denom} times too often, so divide by it.`, `Arrangements = ${U.fact(letters.length)} / (${denom}) = ${total}.`],
    };
  }
  const vPerm = U.msPerms(vowels), cPerm = U.msPerms(cons);
  if (d === 3) {
    const blockPerm = U.msPerms(cons.concat(["#"]));
    const ans = vPerm * blockPerm;
    return {
      topic: "Modern Math · Permutations",
      text: `In how many distinct ways can the letters of the word ${w} be arranged so that all the vowels come together?`,
      answer: ans,
      traps: [
        { v: total, why: "Counted all arrangements with no condition on the vowels." },
        { v: blockPerm, why: "Treated the vowel block as one unit but forgot to arrange the vowels inside the block." },
        { v: vPerm * cPerm, why: "Arranged vowels and consonants separately without placing the block among the consonants." },
        { v: vPerm * U.msPerms(cons), why: "Ignored the position of the block relative to the consonants." },
      ],
      hints: ["Glue the vowels into one block and treat the block as a single letter.", `The block plus ${cons.length} consonants gives ${cons.length + 1} items to arrange${cons.length !== new Set(cons).size ? " (watch for repeated consonants)" : ""}.`, `Multiply by the number of ways to arrange the vowels inside the block (${vowels.join(", ")}).`],
      steps: [`Vowels: ${vowels.join(", ")} (${vowels.length}). Consonants: ${cons.join(", ")} (${cons.length}).`, `Treat the vowels as one block. Arrange the block with the ${cons.length} consonants: ${blockPerm} ways${cons.length !== new Set(cons).size ? " (after dividing for repeated consonants)" : ""}.`, `Arrange the vowels inside the block: ${vPerm} ways${vowels.length !== new Set(vowels).size ? " (after dividing for repeated vowels)" : ""}.`, `Total = ${blockPerm} × ${vPerm} = ${ans}.`],
    };
  }
  const gaps = U.comb(cons.length + 1, vowels.length);
  const ans = cPerm * gaps * vPerm;
  return {
    topic: "Modern Math · Permutations",
    text: `In how many distinct ways can the letters of the word ${w} be arranged so that no two vowels are adjacent?`,
    answer: ans,
    traps: [
      { v: total - U.msPerms(cons.concat(["#"])) * vPerm, why: "Subtracted the all-vowels-together case only. Other arrangements can still have two vowels adjacent." },
      { v: cPerm * U.comb(cons.length, vowels.length) * vPerm, why: "Used " + cons.length + " gaps instead of " + (cons.length + 1) + ". The two ends of the row count as gaps too." },
      { v: cPerm * gaps, why: "Chose the gaps but forgot to arrange the vowels within them." },
      { v: cPerm * vPerm, why: "Arranged consonants and vowels separately without choosing gaps." },
    ],
    hints: ["Place the consonants first, then slot the vowels into the gaps between them.", `${cons.length} consonants create ${cons.length + 1} gaps (including both ends). Choose ${vowels.length} different gaps.`, "Remember to count the arrangements of the consonants, the choice of gaps, and the arrangements of the vowels."],
    steps: [`Vowels: ${vowels.join(", ")} (${vowels.length}). Consonants: ${cons.join(", ")} (${cons.length}).`, `Arrange the consonants first: ${cPerm} ways.`, `They leave ${cons.length + 1} gaps. Put one vowel in each of ${vowels.length} distinct gaps: C(${cons.length + 1}, ${vowels.length}) = ${gaps} ways.`, `Arrange the vowels in the chosen gaps: ${vPerm} ways.`, `Total = ${cPerm} × ${gaps} × ${vPerm} = ${ans}.`],
  };
});

reg("mm_prob", "Modern Math", true, function (d, R, mode) {
  const cases = {
    1: [
      { n: 2, t: "the sum of the two numbers is 8", f: (a) => a[0] + a[1] === 8 },
      { n: 2, t: "the sum of the two numbers is 9", f: (a) => a[0] + a[1] === 9 },
      { n: 2, t: "the two numbers are equal", f: (a) => a[0] === a[1] },
    ],
    2: [
      { n: 2, t: "the sum is a prime number", f: (a) => [2, 3, 5, 7, 11].includes(a[0] + a[1]) },
      { n: 2, t: "the sum is a multiple of 4", f: (a) => (a[0] + a[1]) % 4 === 0 },
      { n: 2, t: "the product is a perfect square", f: (a) => [1, 4, 9, 16, 25, 36].includes(a[0] * a[1]) },
    ],
    3: [
      { n: 3, t: "the sum of the three numbers is 10", f: (a) => a[0] + a[1] + a[2] === 10 },
      { n: 3, t: "the sum of the three numbers is 12", f: (a) => a[0] + a[1] + a[2] === 12 },
      { n: 3, t: "at least one die shows a 6", f: (a) => a.includes(6) },
    ],
    4: [
      { n: 3, t: "the product of the three numbers is a multiple of 6", f: (a) => (a[0] * a[1] * a[2]) % 6 === 0 },
      { n: 3, t: "the three numbers are all different and their sum is 12", f: (a) => new Set(a).size === 3 && a[0] + a[1] + a[2] === 12 },
      { n: 3, t: "the product of the three numbers is odd", f: (a) => a.every((x) => x % 2 === 1) },
    ],
  };
  const c = R.pick(cases[d]);
  let count = 0; const total = Math.pow(6, c.n);
  const rec = (arr) => { if (arr.length === c.n) { if (c.f(arr)) count++; return; } for (let i = 1; i <= 6; i++) rec(arr.concat(i)); };
  rec([]);
  const dice = c.n === 2 ? "two fair dice are rolled" : "three fair dice are rolled";
  const steps = [`${dice[0].toUpperCase() + dice.slice(1)}: there are 6^${c.n} = ${total} equally likely ordered outcomes.`, `Count the ordered outcomes where ${c.t}: ${count}.`];
  if (mode === "saq") {
    return {
      topic: "Modern Math · Probability",
      text: `When ${dice}, in how many of the ${total} equally likely ordered outcomes is ${c.t}?`,
      answer: count,
      traps: [
        { v: Math.round(count / 2), why: "Counted unordered pairs. (3,5) and (5,3) are different outcomes." },
        { v: count + 1, why: "Counted one outcome too many while listing." },
        { v: Math.max(count - 1, 0), why: "Missed one outcome while listing." },
      ],
      hints: ["Treat the dice as distinguishable and list outcomes systematically.", `Count by the value of the first die, then see how many values of the other die(s) work.`, "Check that you have counted both (a, b) and (b, a) when a ≠ b."],
      steps: steps.concat([`So the number of favourable outcomes is ${count}.`]),
    };
  }
  const ans = U.frac(count, total);
  return {
    topic: "Modern Math · Probability",
    text: `${dice[0].toUpperCase() + dice.slice(1)}. What is the probability that ${c.t}?`,
    answer: ans,
    fmt: (v) => String(v),
    traps: [
      { v: U.frac(count + 1, total), why: "Counted one outcome too many in the favourable set." },
      { v: U.frac(Math.max(count - 1, 1), total), why: "Missed one favourable outcome." },
      { v: U.frac(total - count, total), why: "Computed the probability of the complement." },
      { v: count * 2 <= total ? U.frac(count * 2, total) : U.frac(Math.max(1, count - 3), total), why: "Double-counted symmetric outcomes such as (a, b) and (b, a)." },
      { v: U.frac(count, total / 2), why: "Used half the sample space as the denominator." },
    ],
    hints: ["Probability = favourable outcomes ÷ total outcomes, with every ordered outcome equally likely.", `The sample space has ${total} ordered outcomes.`, `Count the favourable ordered outcomes carefully, then reduce the fraction.`],
    steps: steps.concat([`Probability = ${count}/${total} = ${ans}.`]),
  };
});

reg("mm_ap", "Modern Math", true, function (d, R) {
  if (d <= 2) {
    const a = R.int(1, 12), dd = R.int(2, 7), p = R.int(2, 5), q = p + R.int(3, 6), n = R.pick([10, 12, 16, 20]);
    const tp = a + (p - 1) * dd, tq = a + (q - 1) * dd;
    const S = n * (2 * a + (n - 1) * dd) / 2;
    return {
      topic: "Modern Math · Sequences & series",
      text: `In an arithmetic progression the ${ordinal(p)} term is ${tp} and the ${ordinal(q)} term is ${tq}. Find the sum of its first ${n} terms.`,
      answer: S,
      traps: [
        { v: n * (tp + tq) / 2, why: "Averaged the two given terms and multiplied by n, which is not the sum of the first n terms." },
        { v: n * (2 * a + (n - 2) * dd) / 2, why: "Used (n − 2) in the sum formula instead of (n − 1)." },
        { v: n * (a + (n - 1) * dd), why: "Forgot to halve the sum." },
        { v: (n / 2) * (2 * (a + dd) + (n - 1) * dd), why: "Started the progression from the wrong first term." },
      ],
      hints: ["Use the two given terms to find the common difference first.", `The difference between the ${ordinal(q)} and ${ordinal(p)} terms is ${q - p} common differences.`, `With d = ${dd}, find a, then use S = n/2 × (2a + (n − 1)d).`],
      steps: [`Terms differ by ${q - p} common differences: ${tq} − ${tp} = ${q - p}d, so d = ${dd}.`, `a = ${tp} − ${p - 1}×${dd} = ${a}.`, `S${n} = ${n}/2 × (2×${a} + ${n - 1}×${dd}) = ${S}.`],
    };
  }
  if (d === 3) {
    const p = R.int(1, 6), q = R.int(-4, 9), k = R.int(8, 20);
    const ans = p * (2 * k - 1) + q;
    return {
      topic: "Modern Math · Sequences & series",
      text: `The sum of the first n terms of a sequence is S_n = ${p}n^2 ${q < 0 ? "−" : "+"} ${Math.abs(q)}n. Find its ${ordinal(k)} term.`,
      answer: ans,
      traps: [
        { v: p * k * k + q * k, why: "Gave S_" + k + " (the sum), not the " + ordinal(k) + " term." },
        { v: p * (2 * k + 1) + q, why: "Used S_(n+1) − S_n, which gives the next term." },
        { v: p * (2 * k - 3) + q, why: "Used S_(n−1) − S_(n−2), which gives the previous term." },
        { v: p * (2 * k - 1) - q, why: "Sign slip on the linear coefficient." },
      ],
      hints: ["The nth term is the difference of two consecutive partial sums.", "Use a_n = S_n − S_(n−1).", `Expand S_${k} − S_${k - 1} carefully; the n² terms leave 2n − 1.`],
      steps: [`a_n = S_n − S_(n−1) = ${p}[n² − (n−1)²] + ${q}[n − (n−1)].`, `= ${p}(2n − 1) + ${q}.`, `For n = ${k}: ${p}×${2 * k - 1} + ${q} = ${ans}.`],
    };
  }
  const a = R.int(8, 30), dd = R.int(1, a - 3);
  const prod = (a - dd) * a * (a + dd);
  return {
    topic: "Modern Math · Sequences & series",
    text: `Three positive numbers are in arithmetic progression. Their sum is ${3 * a} and their product is ${prod}. Find the largest of the three numbers.`,
    answer: a + dd,
    traps: [
      { v: a, why: "Reported the middle term." },
      { v: a - dd, why: "Reported the smallest term." },
      { v: a + 2 * dd, why: "Took the common difference to be 2d when setting up the terms." },
      { v: prod / (a * a), why: "Divided the product by the square of the middle term and stopped." },
    ],
    hints: ["Write the three numbers as a − d, a, a + d.", "The sum gives a directly. The product gives d.", `With a = ${a}, the product is a(a² − d²) = ${prod}.`],
    steps: [`Let the numbers be a − d, a, a + d. Their sum is 3a = ${3 * a}, so a = ${a}.`, `Product: a(a² − d²) = ${prod}, so ${a}² − d² = ${prod / a}, giving d² = ${a * a - prod / a}.`, `So d = ${dd} (positive). The largest number is ${a} + ${dd} = ${a + dd}.`],
  };
});

reg("mm_log", "Modern Math", true, function (d, R) {
  const T = {
    1: [[2, 4, 2, 3, "minus"], [2, 8, 4, 5, "minus"]],
    2: [[3, 9, 6, 3, "minus"], [5, 25, 20, 3, "minus"]],
    3: [[2, 16, 8, 7, "minus"], [3, 27, 18, 5, "minus"]],
    4: [[2, 5, 3, 4, "diff2"], [2, 10, 6, 6, "diff2"], [3, 5, 4, 2, "diff2"], [5, 13, 12, 2, "diff2"]],
  };
  const [b, x, k, m, kind] = R.pick(T[d]);
  const M = Math.pow(b, m);
  if (kind === "minus") {
    const other = k - x;
    return {
      topic: "Modern Math · Logarithms",
      text: `Solve for x: log_${b}(x) + log_${b}(x − ${k}) = ${m}.`,
      answer: x,
      traps: [
        { v: other, why: "Reported the negative root. It makes log(x) undefined, so it must be rejected." },
        { v: M, why: "Set x equal to " + b + "^" + m + " and forgot that the product is x(x − " + k + ")." },
        { v: x - k, why: "Reported x − " + k + " instead of x." },
        { v: x + k, why: "Sign slip when solving the quadratic." },
      ],
      hints: ["Combine the two logarithms into one using the product rule.", `log_${b}[x(x − ${k})] = ${m}, so x(x − ${k}) = ${b}^${m}.`, `Solve the quadratic x² − ${k}x − ${M} = 0 and check the domain (x > ${k}).`],
      steps: [`Product rule: log_${b}[x(x − ${k})] = ${m}.`, `So x(x − ${k}) = ${b}^${m} = ${M}, i.e. x² − ${k}x − ${M} = 0.`, `Roots: x = ${x} or x = ${other}.`, `Both logarithms need x > ${k}, so reject ${other}. Answer: x = ${x}.`],
    };
  }
  return {
    topic: "Modern Math · Logarithms",
    text: `If log_${b}(x + ${k}) + log_${b}(x − ${k}) = ${m}, find x.`,
    answer: x,
    traps: [
      { v: -x, why: "Reported the negative root of x² = " + (M + k * k) + ", which is outside the domain." },
      { v: M, why: "Ignored the product rule and equated x directly to " + b + "^" + m + "." },
      { v: Math.round(Math.sqrt(M)), why: "Took the square root of " + b + "^" + m + " and forgot the " + k * k + " from the difference of squares." },
      { v: x + k, why: "Reported x + " + k + " instead of x." },
    ],
    hints: ["Use the product rule to merge the two logs.", `(x + ${k})(x − ${k}) is a difference of squares.`, `x² − ${k * k} = ${b}^${m}. Remember the domain requires x > ${k}.`],
    steps: [`Product rule: log_${b}[(x + ${k})(x − ${k})] = ${m}.`, `So x² − ${k * k} = ${b}^${m} = ${M}, giving x² = ${M + k * k}.`, `x = ±${x}. The arguments of the logs must be positive, so x > ${k}.`, `Answer: x = ${x}.`],
  };
});

/* ===== GEOMETRY ===== */
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

reg("geo_inradius", "Geometry", true, function (d, R) {
  const t = R.pick(TRIPLES.slice(0, d <= 2 ? 3 : 6)), k = R.int(1, d === 1 ? 2 : 4);
  const [a, b, c] = t.map((x) => x * k);
  const r = (a + b - c) / 2;
  if (!Number.isInteger(r)) return REG.find((g) => g.id === "geo_inradius").fn(d, R);
  return {
    topic: "Geometry · Triangles & circles",
    text: `The sides of a triangle are ${a} cm, ${b} cm and ${c} cm. Find the radius of the circle inscribed in the triangle (in cm).`,
    answer: r,
    traps: [
      { v: c / 2, why: "Gave the circumradius (half the hypotenuse) instead of the inradius." },
      { v: (a * b) / (a + b + c), why: "Used area / perimeter. The inradius is area / semi-perimeter." },
      { v: a + b - c, why: "Forgot to halve in r = (a + b − c)/2." },
      { v: (a * b) / (2 * (a + b + c)), why: "Divided the area by the full perimeter and then halved again." },
    ],
    hints: ["Check whether this triangle is a right triangle.", `${a}² + ${b}² = ${a * a + b * b} = ${c}², so the angle between the legs is 90°.`, "The inradius equals area divided by semi-perimeter."],
    steps: [`${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} = ${c}², so it is a right triangle with legs ${a} and ${b}.`, `Area = ½ × ${a} × ${b} = ${a * b / 2}. Semi-perimeter s = (${a} + ${b} + ${c})/2 = ${(a + b + c) / 2}.`, `r = Area / s = ${a * b / 2} / ${(a + b + c) / 2} = ${r} cm.`],
  };
});

reg("geo_chord", "Geometry", true, function (d, R) {
  const [r, h, Rr] = (() => { const t = R.pick(TRIPLES.slice(0, d <= 2 ? 3 : 6)); const k = R.int(1, d === 1 ? 2 : 3); return [t[0] * k, t[1] * k, t[2] * k]; })();
  return {
    topic: "Geometry · Circles",
    text: `Two concentric circles have radii ${Rr} cm and ${r} cm. A chord of the larger circle touches the smaller circle. Find the length of the chord (in cm).`,
    answer: 2 * h,
    traps: [
      { v: h, why: "Gave half the chord. The tangent point is the midpoint of the chord." },
      { v: 2 * Rr, why: "Gave the diameter of the larger circle, which is the longest possible chord." },
      { v: 2 * (Rr - r), why: "Subtracted the radii instead of using the right triangle." },
      { v: 2 * Math.sqrt(Rr * Rr + r * r), why: "Added the squares instead of subtracting: the radius to the endpoint is the hypotenuse." },
    ],
    hints: ["A chord that touches the inner circle is tangent to it. What does that say about the radius at the point of contact?", "The radius of the inner circle drawn to the touching point is perpendicular to the chord and bisects it.", `You get a right triangle with hypotenuse ${Rr} and one leg ${r}.`],
    steps: [`Let the chord touch the inner circle at T. The radius to T is perpendicular to the chord, so T is the midpoint.`, `In the right triangle (centre, T, an endpoint): (half chord)² = ${Rr}² − ${r}² = ${Rr * Rr - r * r}, so half chord = ${h} cm.`, `Chord = 2 × ${h} = ${2 * h} cm.`],
  };
});

/* ===== QA builder ===== */
const QA_GROUPS = ["Algebra", "Number Systems", "Arithmetic", "Modern Math", "Geometry"];
function makeQA(section, group, d, count, R, idBase) {
  const mode = section === "QA-SAQ" ? "saq" : "mcq";
  let pool = REG.filter((g) => (group === "Mixed" || g.group === group) && (mode === "mcq" || g.saq));
  const out = [], seenText = new Set();
  let order = R.shuffle(pool), cursor = 0;
  for (let i = 0; i < count; i++) {
    let spec = null, fallback = null;
    for (let tries = 0; tries < 60; tries++) {
      if (cursor >= order.length) { order = R.shuffle(pool); cursor = 0; }
      const g = order[cursor];
      if (tries % 3 === 2) cursor++;
      let s;
      try { s = g.fn(d, R, mode); } catch (e) { continue; }
      if (!s) continue;
      if (mode === "saq" && !(Number.isFinite(s.answer) && Number.isInteger(s.answer))) continue;
      fallback = s;
      if (seenText.has(s.text)) continue;
      spec = s; break;
    }
    cursor++;
    if (!spec) spec = fallback;
    if (!spec) continue;
    seenText.add(spec.text);
    out.push(U.finalize(spec, section, d, R, `${idBase}-${String(i + 1).padStart(2, "0")}`));
  }
  return out;
}

/* ---------- VARC: Reading Comprehension, Para Jumbles, Vocabulary ---------- */
const RC_BANK = [
  {
    title: "The hidden price of interruptions", d: 2,
    text: "Most people believe they lose focus because the world has grown noisier. The research on interruptions suggests a quieter explanation: the cost of an interruption is rarely the interruption itself. When a worker stops a task to answer a message, the message may take thirty seconds, but returning to the original task takes far longer, because the mind must rebuild the thread it dropped. Experiments in office settings found that workers who were interrupted often completed their tasks just as accurately as those left alone, but they did so faster and with noticeably higher stress, as if compressing effort to make up for lost time. The lesson is not that interruptions are always harmful. A question from a colleague can unblock a day's work. The lesson is that the price is paid later and out of sight, which is why people consistently underestimate it.",
    qs: [
      { d: 2, q: "The central point of the passage is that", a: "the real cost of an interruption lies mostly in resuming the original task, a cost people tend to underestimate",
        w: [["modern workplaces have become noisier than they used to be", "The passage presents this as a common belief and offers a 'quieter explanation' instead."], ["interruptions reduce the accuracy of the work that employees produce", "The experiments found accuracy was largely unaffected; the effect showed up in speed and stress."], ["interruptions should be removed from the workplace altogether", "The author explicitly says interruptions are not always harmful; a colleague's question can unblock work."]],
        steps: ["The first sentences reject 'noise' as the explanation and say the cost is 'rarely the interruption itself'.", "The middle explains that the real cost is the time and effort of returning to the task.", "The closing sentence adds that the price is paid 'later and out of sight', so it is underestimated. That combines the correct option's two halves."], hints: ["Ask what the author thinks the real cost of an interruption is.", "Look at where the author says the price is paid, and by whom it is noticed.", "The correct option mentions both the cost of resuming and the habit of underestimating it."] },
      { d: 3, q: "According to the passage, workers who were interrupted frequently", a: "finished their tasks about as accurately as others but under greater stress",
        w: [["made noticeably more errors than workers left alone", "The passage says they were 'just as accurate'."], ["took longer to complete their tasks than uninterrupted workers", "They actually finished faster, compressing their effort."], ["showed no measurable difference from uninterrupted workers", "Their stress was noticeably higher, so there was a difference."]],
        steps: ["The experiments sentence states three results: equally accurate, faster, and more stressed.", "Only the correct option reports accuracy unchanged and stress higher.", "The other options contradict at least one of the three stated results."], hints: ["Go back to the sentence about the experiments in office settings.", "Note what stayed the same and what changed.", "Accuracy stayed the same; stress changed."] },
      { d: 3, q: "Why does the author mention that a question from a colleague can unblock a day's work?", a: "To show that the argument does not claim all interruptions are harmful",
        w: [["To suggest that colleagues interrupt one another too often", "The sentence points to a benefit, not to frequency."], ["To prove that workers underestimate the cost of interruptions", "The underestimation point comes in the following sentence and is unrelated to the colleague example."], ["To argue for redesigning offices so that colleagues sit closer together", "Office layout is never discussed."]],
        steps: ["The sentence begins 'The lesson is not that interruptions are always harmful'.", "The colleague example is the supporting evidence for that qualification.", "So its role is to limit the scope of the claim."], hints: ["Look at the sentence just before the example.", "Is the author attacking interruptions or limiting an attack on them?", "The example qualifies the claim."] },
    ],
  },
  {
    title: "Why prices stick", d: 3,
    text: "Economists have long puzzled over why prices do not change every time costs do. If the price of flour rises, a bakery could reprice its bread within the hour, yet most bakeries wait. One explanation is the so-called menu cost: the literal expense of reprinting menus and tags, and the figurative expense of deciding what the new price should be. Another is customer memory. Shoppers remember the price they paid last week, and a bakery that raises prices at every wobble in wheat risks being labelled unreliable. Firms therefore tend to absorb small shocks and pass on only the large, lasting ones. This caution has a curious side effect. When a shock finally does force a price change, the adjustment is bigger and more abrupt than the underlying cost movement would justify, because it carries the accumulated weight of the changes that were postponed.",
    qs: [
      { d: 3, q: "Which of the following best expresses the main idea of the passage?", a: "Firms delay price changes for reasons beyond the direct expense of repricing, and this delay can make eventual changes sharper",
        w: [["Menu costs are the only reason prices are slow to adjust", "The passage gives a second reason, customer memory."], ["Bakeries are unusual in delaying price changes when costs rise", "Bakeries are an illustration; the passage speaks of firms in general."], ["Customers generally prefer higher prices to frequent price changes", "Customers' preference for higher prices is never stated; they dislike unreliability."]],
        steps: ["The passage gives two reasons (menu costs, customer memory).", "It then adds a consequence: delayed changes arrive larger and more abruptly.", "Only the correct option covers both the plural reasons and the consequence."], hints: ["The passage lists reasons and then a side effect. A good summary covers both.", "Eliminate options that say 'only' or 'unusual'.", "Look for the option that mentions the sharper eventual change."] },
      { d: 3, q: "Which of the following is NOT offered in the passage as a reason why firms delay changing prices?", a: "Government rules that limit how often prices may be revised",
        w: [["The cost of physically reprinting menus and price tags", "Mentioned as the literal menu cost."], ["The effort of deciding what the new price should be", "Mentioned as the figurative menu cost."], ["The risk that frequent changes make a firm look unreliable", "Mentioned under customer memory."]],
        steps: ["The passage names the literal and figurative menu costs and the risk of seeming unreliable.", "Government regulation never appears anywhere in the passage.", "In an EXCEPT question the correct answer is the one that is not stated."], hints: ["Check each option against the text and tick off what is mentioned.", "Three options appear almost verbatim.", "The odd one out is about the state, not the firm or its customers."] },
      { d: 4, q: "According to the passage, a delayed price change tends to be larger because it", a: "bundles together several cost increases that were previously absorbed",
        w: [["is a deliberate attempt by firms to recover lost profits", "The passage attributes the size to accumulated postponed changes, not to a profit-recovery motive."], ["is easier for customers to accept when the increase is big", "Customer acceptance is not discussed in this context."], ["reflects a sudden rise in the cost of printing menus", "Menu costs are a reason for delay, not the cause of the size."]],
        steps: ["The last sentence says the adjustment 'carries the accumulated weight of the changes that were postponed'.", "That means several earlier cost movements are rolled into one change.", "The correct option restates this."], hints: ["Reread the final sentence.", "'Accumulated weight' points to many small things added up.", "Choose the option that mentions bundling or accumulation."] },
    ],
  },
  {
    title: "The bridge that changes the river", d: 3,
    text: "A translator is often described as a bridge, but the metaphor flatters the translator and misleads the reader. A bridge connects two banks without changing either, while a translation changes the text it carries. Every choice between a literal rendering and a natural one gives up something: fidelity to the original's structure, or fidelity to its effect on a reader. Idioms show the problem most clearly. Rendering 'raining cats and dogs' word for word preserves the image and loses the meaning; replacing it with a local expression preserves the meaning and loses the image. Neither is an error. Good translators therefore do not hunt for the single correct version; they decide what the text must keep, and accept the loss of the rest.",
    qs: [
      { d: 3, q: "The author calls the bridge metaphor misleading because", a: "a translation alters the text it carries, whereas a bridge leaves both banks unchanged",
        w: [["translators are less important than the metaphor suggests", "The author's complaint is about what translators do, not about their importance."], ["bridges are built from permanent materials and translations are not", "Permanence is never discussed."], ["readers do not trust translations of idioms", "Reader trust is not mentioned."]],
        steps: ["The second sentence states the contrast directly: a bridge changes neither bank, a translation changes the text.", "That is why the metaphor misleads readers into thinking nothing is altered."], hints: ["Find the sentence that compares a bridge with a translation.", "What does a bridge do to the banks?", "The correct option mentions change versus no change."] },
      { d: 3, q: "As used in the passage, the word 'flatters' most nearly means", a: "gives a more favourable picture of the translator than is deserved",
        w: [["praises the translator openly and sincerely", "'Flatters' here describes a distortion, and the author is criticising the metaphor, not praising anyone sincerely."], ["imitates the translator's style", "Imitation is unrelated."], ["attracts more readers to the translator's work", "The sentence is about how the translator is portrayed, not about readership."]],
        steps: ["The same sentence says the metaphor 'misleads the reader'.", "So 'flatters' means it presents the translator in a better light than the facts support."], hints: ["The word is paired with 'misleads'.", "Is the author's tone approving or critical?", "Pick the meaning that involves an overly favourable portrayal."] },
      { d: 4, q: "Which of the following would the author most likely agree with?", a: "A translation that gives up an idiom's image to keep its meaning is not necessarily flawed",
        w: [["The best translations are always the most literal ones", "The author says neither literal nor natural rendering is an error."], ["A translator should look for the one correct version of a text", "The author says good translators do not hunt for a single correct version."], ["Idioms cannot be translated in any satisfactory way", "The passage shows idioms can be translated, each way with a loss."]],
        steps: ["The author says of the idiom example: 'Neither is an error.'", "The last sentence says good translators accept some loss.", "The correct option is consistent with both statements."], hints: ["Look at what the author says about each way of rendering the idiom.", "Eliminate any option that uses 'always' or 'cannot'.", "Choose the option that treats loss as acceptable."] },
    ],
  },
  {
    title: "Commons without tragedy", d: 4,
    text: "The phrase 'tragedy of the commons' is often cited as proof that shared resources inevitably collapse. Yet the studies that revived interest in the idea found something less tidy. Communities that share irrigation channels or fishing grounds frequently survive for centuries, not because of private ownership or distant regulation, but because members monitor one another and punish those who take more than their share. What destroys a commons, on this view, is less sharing than anonymity. Where users know each other and expect to meet again, restraint is cheap to enforce. Where they are strangers drawn by an open door, it is not. The commons does not fail because people are selfish; it fails when selfishness has nowhere to be seen.",
    qs: [
      { d: 3, q: "The main argument of the passage is that shared resources", a: "tend to survive when users can observe and sanction one another, and fail when users are anonymous",
        w: [["always collapse unless they are privately owned", "The passage rejects this as an oversimplification."], ["survive only where distant authorities regulate them", "The passage says survival does not depend on distant regulation."], ["fail because most users are selfish", "The final sentence rejects selfishness as the cause."]],
        steps: ["The author challenges the idea of inevitable collapse.", "Survival is credited to mutual monitoring and punishment; failure to anonymity.", "Only the correct option states both."], hints: ["What does the author say destroys a commons?", "And what lets one survive?", "Look for an option mentioning observation and anonymity."] },
      { d: 4, q: "Which of the following would the author expect to be MOST vulnerable to collapse?", a: "A fishing ground open to boats from many distant ports, with no one monitoring catches",
        w: [["An irrigation channel managed by families who have farmed together for generations", "Users know each other and expect to meet again, the conditions under which restraint is cheap."], ["A pasture shared by one village whose members fine anyone who overgrazes", "Monitoring and punishment are present."], ["A fishing cooperative whose members inspect each other's nets", "Mutual monitoring is the survival condition in the passage."]],
        steps: ["The passage says restraint is hard to enforce where users are strangers drawn by an open door.", "The distant-ports fishing ground matches 'strangers' and 'open door' with no monitoring.", "The other three describe monitored or familiar communities."], hints: ["Which condition does the author connect with failure?", "Look for strangers, an open door, and no monitoring.", "Three options describe communities that watch each other."] },
      { d: 4, q: "The final sentence of the passage suggests that", a: "the problem lies in unobserved behaviour rather than in an inherent human flaw",
        w: [["people are naturally selfless when given the chance", "The sentence does not claim people are selfless, only that selfishness is not the root cause."], ["selfish behaviour should be kept out of public view", "It says the opposite: failure comes when selfishness 'has nowhere to be seen'."], ["shared resources should be divided into private holdings", "Privatisation is mentioned only as something survival does not depend on."]],
        steps: ["The sentence denies that selfishness alone causes failure.", "It locates the failure where selfish acts are not visible to others.", "So visibility, not human nature, is the issue."], hints: ["Reread the sentence slowly: what does it deny, and what does it affirm?", "'Nowhere to be seen' is about visibility.", "Pick the option that blames lack of observation, not human nature."] },
    ],
  },
  {
    title: "The library as a place", d: 1,
    text: "Public libraries are sometimes described as relics of an age before the internet, but their usage figures tell a different story. In many cities, visits have held steady even as the lending of printed books has declined. People come for other things: a quiet desk, free internet access, a class in writing a resume, a room where a children's story hour is held. The library has quietly become a place rather than a collection. This matters for how libraries are judged. If success is measured by books lent, a library looks like a shrinking business. If it is measured by the number of people who walk through the door and what they do there, it looks like one of the few public spaces that still asks nothing of its visitors.",
    qs: [
      { d: 1, q: "The passage mainly argues that libraries", a: "remain relevant because their role has shifted from lending books to serving as public spaces",
        w: [["are becoming obsolete now that the internet exists", "The passage opens by rejecting this view."], ["should stop lending printed books altogether", "No such recommendation is made."], ["attract fewer visitors than they did in the past", "Visits are said to have held steady."]],
        steps: ["The opening sentence presents and rejects the 'relic' view.", "The passage then shows that visits are steady and that people come for other services.", "The conclusion: the library is now a place rather than a collection."], hints: ["What does the author say about visits?", "Note the phrase 'a place rather than a collection'.", "The answer mentions the shift in role."] },
      { d: 2, q: "Which of the following is mentioned in the passage as a reason people visit libraries?", a: "To use free internet access",
        w: [["To buy discounted books", "Buying books is not mentioned."], ["To attend lectures by well-known authors", "Author lectures are not mentioned; story hours and resume classes are."], ["To borrow more printed books than before", "Lending of printed books is said to have declined."]],
        steps: ["The list in the third sentence includes a quiet desk, free internet access, a resume class and a story hour.", "Only free internet access matches an option."], hints: ["Find the list of things people come for.", "Compare each option against that list.", "One option is a direct match."] },
      { d: 3, q: "The author suggests that judging libraries by the number of books lent is", a: "an incomplete measure that makes libraries look weaker than they are",
        w: [["the fairest way to compare libraries across cities", "The author calls this measure misleading, not fair."], ["a measure that exaggerates how popular libraries are", "It makes libraries look like a 'shrinking business', which understates them."], ["unimportant because no one uses printed books any more", "The passage says lending has declined, not vanished, and does not call books unimportant."]],
        steps: ["'If success is measured by books lent, a library looks like a shrinking business.'", "The alternative measure paints a healthier picture.", "So the lending measure understates the library's value."], hints: ["Reread the last two sentences.", "Which measure makes libraries look weaker?", "The correct option says the measure is incomplete."] },
    ],
  },
];

/* Para jumbles: sentences stored in correct order, cue[i] explains why sentence i+1 follows sentence i */
const PJ_BANK = [
  { d: 1, s: ["Rohan missed the morning train.", "He waited on the platform for nearly an hour.", "The next train was crowded, so he stood all the way to the city.", "He reached the office after eleven."], cue: ["Sentence 2 says what he did after missing the train, so it follows the missed train.", "'The next train' only makes sense after the waiting in the previous sentence.", "The arrival at the office is the end of the journey and the natural last event."] },
  { d: 1, s: ["Sleep researchers have long known that memory is not fixed in a single moment.", "Instead, a new memory is fragile when first formed.", "During sleep, the brain replays the day's events and strengthens the important links.", "This is why a student who sleeps after studying often remembers more than one who stays up."], cue: ["'Instead' contrasts with the claim that memory is fixed in one moment.", "'During sleep' explains how the fragile memory gets strengthened.", "'This is why' draws a consequence from the replay process."] },
  { d: 1, s: ["Plants turn toward light.", "A hormone called auxin collects on the shaded side of the stem.", "Cells on that side grow longer than the cells on the lit side.", "The unequal growth bends the stem toward the light."], cue: ["The hormone is introduced as the cause of the turning described first.", "'That side' refers to the shaded side named in the previous sentence.", "'The unequal growth' refers to the difference in cell length just described."] },
  { d: 2, s: ["The first cities grew along rivers.", "Water was needed for drinking and for irrigating crops.", "Rivers also served as roads, moving grain and timber to markets.", "As trade increased, settlements near river junctions swelled the fastest."], cue: ["The need for water explains why cities grew by rivers.", "'Also' adds a second function after the first use of water.", "'As trade increased' follows from the mention of markets."] },
  { d: 2, s: ["A coupon is a small discount that feels like a large win.", "Shoppers who would never haggle over price will happily hunt for a code.", "The reason is that the discount seems earned, not given.", "Retailers understand this and keep coupons visible but slightly effortful to claim."], cue: ["The hunting for codes illustrates the 'large win' feeling.", "'The reason' explains the behaviour described just before.", "'Retailers understand this' relies on the explanation given in the previous sentence."] },
  { d: 2, s: ["Public speaking frightens many people more than they expect.", "The fear usually comes from imagining the audience as a panel of judges.", "In reality, most listeners are quietly hoping the speaker does well.", "Speakers who grasp this tend to relax and speak more naturally."], cue: ["The cause of the fear is the natural next point after stating the fear.", "'In reality' contrasts with the imagined panel of judges.", "'This' in the last sentence refers to the listeners' real attitude."] },
  { d: 3, s: ["Early clocks were kept in monastery towers.", "Their purpose was to call monks to prayer at fixed hours.", "Towns soon wanted the same regularity for markets and courts.", "Public clocks therefore appeared in town squares.", "Over time, the hour became a shared fact rather than a private ritual."], cue: ["'Their purpose' refers to the clocks in the towers.", "'The same regularity' refers to the fixed hours mentioned just before.", "'Therefore' states the result of towns wanting regularity.", "'Over time' sums up the long-run effect of public clocks."] },
  { d: 3, s: ["Not every innovation arrives with a flash of insight.", "Many are the result of a slow accumulation of small fixes.", "A bicycle gear, for instance, took decades of minor changes to become reliable.", "Each change looked trivial on its own.", "Together they transformed the machine."], cue: ["The slow accumulation contrasts with the 'flash of insight'.", "'For instance' introduces an example of the slow accumulation.", "'Each change' refers to the minor changes in the example.", "'Together' follows 'each', completing the thought."] },
  { d: 3, s: ["A map is always a simplification.", "A road map leaves out hills, because the driver does not need them.", "A hiking map includes them, because the walker does.", "What a map shows therefore depends on who will use it, not only on what the land contains."], cue: ["The road map is a first example of the simplification.", "The hiking map is set against the road map, with the same structure.", "'Therefore' draws the general lesson from both examples."] },
  { d: 4, s: ["Critics of standardised testing often point to what a test cannot measure.", "That complaint is fair, but it proves less than it seems to.", "No single instrument measures everything; a thermometer says nothing about humidity.", "The relevant question is whether the test measures what it claims to, and does so consistently.", "On that question, the evidence is more favourable than the critics admit."], cue: ["'That complaint' refers to the critics' point in the first sentence.", "The thermometer analogy supports the claim that the complaint proves little.", "'The relevant question' replaces the weak complaint with a better test.", "'On that question' refers back to the relevant question just stated."] },
  { d: 4, s: ["The paradox of thrift says that saving more can leave everyone poorer.", "If every household cuts spending at once, firms sell less.", "Firms that sell less hire fewer workers or cut wages.", "Household incomes fall, and the savings that each family wanted to build become harder to achieve.", "What is sensible for one household becomes self-defeating for all."], cue: ["The mechanism starts with households cutting spending.", "'Firms that sell less' picks up from the previous sentence.", "'Household incomes fall' follows from fewer jobs and lower wages.", "The final sentence states the paradox in general form."] },
  { d: 4, s: ["It is tempting to treat correlation as a cheap substitute for explanation.", "Ice-cream sales and drowning deaths both rise in summer.", "Neither causes the other; heat drives both.", "A pattern, however strong, tells us what travels together, not why."], cue: ["The example of ice-cream and drowning illustrates the temptation.", "'Neither' refers to the two things in the previous sentence.", "The last sentence generalises from the example."] },
];

const VOCAB_BANK = [
  { d: 1, w: "candid", s: "The manager's candid feedback surprised the team.", a: "frank and honest", clue: "feedback that surprised the team", tone: "positive or neutral", x: [["polite", "Candid feedback is not necessarily gentle; it is direct."], ["secret", "'Candid' does not mean hidden. It means open and direct."], ["angry", "Candid describes honesty, not an emotion."]] },
  { d: 1, w: "reluctant", s: "She was reluctant to speak in public.", a: "unwilling", clue: "she did not want to speak", tone: "negative", x: [["eager", "The opposite of reluctant."], ["unable", "Reluctance is about willingness, not ability."], ["forced", "Being forced is an outside pressure; reluctant describes her attitude."]] },
  { d: 2, w: "corroborated", s: "The scientist's claims were corroborated by two independent studies.", a: "confirmed", clue: "independent studies supporting the claims", tone: "positive", x: [["challenged", "The opposite of what the two supporting studies did."], ["ignored", "Studies that are cited as independent evidence are not ignoring the claims."], ["summarised", "Summarising a claim does not add evidence."]] },
  { d: 2, w: "ephemeral", s: "His ephemeral fame vanished within a season.", a: "short-lived", clue: "vanished within a season", tone: "neutral", x: [["eternal", "The opposite of ephemeral."], ["noisy", "Nothing in the sentence concerns volume."], ["undeserved", "The sentence says how long the fame lasted, not whether it was earned."]] },
  { d: 2, w: "meticulous", s: "A meticulous accountant checks every figure twice.", a: "extremely careful and precise", clue: "checks every figure twice", tone: "positive", x: [["hasty", "The opposite of meticulous."], ["boastful", "Nothing suggests showing off."], ["suspicious", "Checking figures twice is care, not distrust of people."]] },
  { d: 2, w: "frugal", s: "Choose the word OPPOSITE in meaning to 'frugal'.", a: "extravagant", clue: "frugal means careful with money", tone: "opposite", x: [["thrifty", "A synonym of frugal, not an antonym."], ["poor", "Frugal describes spending habits; a rich person can be frugal, and a poor one can be extravagant."], ["modest", "Close to frugal in sense, so not an opposite."]], opp: true },
  { d: 3, w: "ambiguous", s: "The minister's speech was deliberately ambiguous.", a: "open to more than one interpretation", clue: "the speech was made so on purpose", tone: "neutral", x: [["false", "Ambiguous statements are unclear, not necessarily untrue."], ["loud", "Nothing in the word concerns volume."], ["lengthy", "Length is unrelated to ambiguity."]] },
  { d: 3, w: "rigour", s: "The rule was applied with such rigour that exceptions became impossible.", a: "strictness", clue: "exceptions became impossible", tone: "neutral", x: [["cruelty", "Rigour means strict, not necessarily cruel."], ["speed", "Nothing in the sentence is about how fast the rule was applied."], ["leniency", "The opposite of rigour."]] },
  { d: 3, w: "magnanimous", s: "His magnanimous reply to the insult surprised everyone.", a: "generous in forgiving", clue: "a kind reply to an insult", tone: "positive", x: [["bitter", "A bitter reply would not surprise anyone after an insult."], ["arrogant", "Sound-alike confusion with 'magnificent'; magnanimous is about generosity of spirit."], ["silent", "The sentence says he replied."]] },
  { d: 3, w: "precarious", s: "The company's growth was precarious, depending on a single client.", a: "unstable and insecure", clue: "depending on a single client", tone: "negative", x: [["impressive", "Depending on one client suggests risk, not admiration."], ["rapid", "The sentence does not describe the speed of growth."], ["illegal", "Nothing in the sentence suggests wrongdoing."]] },
  { d: 3, w: "obsolete", s: "Choose the word OPPOSITE in meaning to 'obsolete'.", a: "in current use", clue: "obsolete means no longer used", tone: "opposite", x: [["ancient", "Obsolete is about no longer being used, not age. Something ancient can still be in use."], ["rare", "Rarity is not the opposite of being outdated."], ["broken", "A broken item is not the same as an outdated one."]], opp: true },
  { d: 4, w: "pellucid", s: "The author's prose is pellucid, and even a first-time reader follows every step.", a: "clear and easy to understand", clue: "a first-time reader follows every step", tone: "positive", x: [["dense", "Dense prose is hard to follow, which contradicts the sentence."], ["ornate", "Ornate means heavily decorated, not clear."], ["dull", "Nothing in the sentence is about how interesting it is."]] },
  { d: 4, w: "specious", s: "Her argument was specious: it sounded convincing but fell apart under scrutiny.", a: "seemingly plausible but actually wrong", clue: "sounded convincing but fell apart", tone: "negative", x: [["special", "A sound-alike. 'Specious' has nothing to do with being special."], ["thorough", "A thorough argument would survive scrutiny."], ["brief", "Length is not described."]] },
  { d: 4, w: "perfunctory", s: "The committee's remarks were largely perfunctory, offering no real engagement with the proposal.", a: "done as a routine, without real interest", clue: "no real engagement with the proposal", tone: "negative", x: [["heartfelt", "The opposite of perfunctory."], ["lengthy and detailed", "Detailed remarks would show engagement."], ["critical", "Criticism is a form of engagement; the sentence says there was none."]] },
  { d: 4, w: "profligate", s: "The king's profligate spending emptied the treasury.", a: "recklessly extravagant", clue: "spending that emptied the treasury", tone: "negative", x: [["prudent", "The opposite of profligate."], ["highly profitable", "A sound-alike with 'profit'. Profligate means wasteful."], ["secret", "Nothing in the sentence concerns secrecy."]] },
];

function makeRC(d, count, R, idBase) {
  const flat = [];
  RC_BANK.forEach((p, pi) => p.qs.forEach((q, qi) => flat.push({ p, q, pi, qi, dist: Math.abs(q.d - d) })));
  const byPass = R.shuffle(RC_BANK.map((p, i) => i)).sort((a, b) => {
    const da = Math.abs(RC_BANK[a].qs.reduce((s, q) => s + q.d, 0) / 3 - d), db = Math.abs(RC_BANK[b].qs.reduce((s, q) => s + q.d, 0) / 3 - d);
    return da - db;
  });
  const out = []; let i = 0;
  for (const pi of byPass) {
    for (const q of RC_BANK[pi].qs) {
      if (out.length >= count) break;
      out.push({ p: RC_BANK[pi], q });
    }
    if (out.length >= count) break;
  }
  return out.map((it, k) => {
    const spec = {
      topic: "VARC · Reading Comprehension",
      text: it.q.q,
      passage: it.p.text,
      passage_title: it.p.title,
      answer: it.q.a,
      traps: it.q.w.map(([v, why]) => ({ v, why })),
      steps: it.q.steps,
      hints: it.q.hints,
      avg: 70 + it.q.d * 10,
      fmt: (v) => String(v),
    };
    const q = U.finalize(spec, "VARC", d, R, `${idBase}-${String(k + 1).padStart(2, "0")}`);
    q.difficulty = it.q.d;
    return q;
  });
}

function makePJ(d, count, R, idBase) {
  const pool = R.shuffle(PJ_BANK).sort((a, b) => Math.abs(a.d - d) - Math.abs(b.d - d));
  const out = [];
  for (let k = 0; k < count; k++) {
    const j = pool[k % pool.length];
    const n = j.s.length;
    const disp = R.shuffle(j.s.map((_, i) => i)); // disp[pos] = index of true sentence shown at label pos+1
    const label = (trueIdx) => disp.indexOf(trueIdx) + 1;
    const correctSeq = j.s.map((_, i) => label(i));
    const fmtSeq = (seq) => seq.join(" – ");
    // distractors: adjacent swaps
    const swaps = R.shuffle([...Array(n - 1).keys()]);
    const traps = swaps.map((i) => {
      const seq = correctSeq.slice(); [seq[i], seq[i + 1]] = [seq[i + 1], seq[i]];
      return { v: fmtSeq(seq), why: `Swaps sentences ${correctSeq[i]} and ${correctSeq[i + 1]}. ${j.cue[i]}` };
    });
    const text = "Rearrange the sentences below into a coherent paragraph. Choose the correct order.\n\n" + disp.map((ti, pos) => `**${pos + 1}.** ${j.s[ti]}`).join("\n");
    const spec = {
      topic: "VARC · Para Jumbles",
      text,
      answer: fmtSeq(correctSeq),
      fmt: (v) => String(v),
      traps,
      avg: 60 + j.d * 12,
      hints: [
        "Find the sentence that introduces the topic and does not depend on anything earlier.",
        "Look for linking words (this, instead, therefore, also, each) and pronouns that need an earlier noun.",
        `Sentence ${correctSeq[0]} is the opener. Match each next sentence to the one it refers back to.`,
      ],
      steps: [
        `Sentence ${correctSeq[0]} states the idea without referring to anything earlier, so it opens the paragraph.`,
      ].concat(j.cue.map((c, i) => `${correctSeq[i]} → ${correctSeq[i + 1]}: ${c}`)).concat([`The correct order is ${fmtSeq(correctSeq)}.`]),
    };
    const q = U.finalize(spec, "VARC", d, R, `${idBase}-${String(k + 1).padStart(2, "0")}`);
    q.difficulty = j.d;
    out.push(q);
  }
  return out;
}

function makeVocab(d, count, R, idBase) {
  const pool = R.shuffle(VOCAB_BANK).sort((a, b) => Math.abs(a.d - d) - Math.abs(b.d - d));
  const out = [];
  for (let k = 0; k < count; k++) {
    const v = pool[k % pool.length];
    const stem = v.opp ? v.s : `${v.s}\n\nChoose the option closest in meaning to the word **${v.w}** as used above.`;
    const spec = {
      topic: v.opp ? "VARC · Vocabulary (antonyms)" : "VARC · Vocabulary in context",
      text: stem,
      answer: v.a,
      fmt: (x) => String(x),
      traps: v.x.map(([t, why]) => ({ v: t, why })),
      avg: 35 + v.d * 8,
      hints: [
        `Look for the clue in the sentence: "${v.clue}".`,
        v.opp ? "First decide what the word means, then look for its opposite." : `In this sentence the word carries a ${v.tone} sense.`,
        `The correct option begins with "${v.a.slice(0, 3)}…".`,
      ],
      steps: v.opp
        ? [`${v.w} means ${v.clue.replace(/^\S+ means /, "")}.`, `Its opposite is therefore "${v.a}".`]
        : [`Context clue: ${v.clue}.`, `That points to a ${v.tone} meaning, so ${v.w} means "${v.a}".`],
    };
    const q = U.finalize(spec, "VARC", d, R, `${idBase}-${String(k + 1).padStart(2, "0")}`);
    q.difficulty = v.d;
    out.push(q);
  }
  return out;
}

/* ---------- Logical Reasoning ---------- */
const LR_GEN = [];
const lr = (id, topic, fn) => LR_GEN.push({ id, topic, fn });

lr("series", "Number series", function (d, R) {
  const kinds = [["ap2", "dp"], ["sq", "alt"], ["diff2", "mix"], ["alt", "mix", "diff2"]][d - 1];
  const kind = R.pick(kinds);
  let seq = [], rule = "";
  if (kind === "ap2") { const a = R.int(2, 15), s = R.int(3, 9); seq = [0, 1, 2, 3, 4, 5].map((i) => a + i * s); rule = `each term adds ${s}`; }
  else if (kind === "dp") { const a = R.int(2, 6), r = R.pick([2, 3]); seq = [0, 1, 2, 3, 4, 5].map((i) => a * Math.pow(r, i)); rule = `each term is multiplied by ${r}`; }
  else if (kind === "sq") { const o = R.int(1, 6), k = R.int(0, 4); seq = [0, 1, 2, 3, 4, 5].map((i) => (i + o) * (i + o) + k); rule = `the terms are (n)² ${k ? "+ " + k : ""} for consecutive n starting from ${o}`; }
  else if (kind === "diff2") { const a = R.int(1, 9), s = R.int(2, 5), inc = R.int(1, 3); let v = a, st = s; seq = [v]; for (let i = 0; i < 5; i++) { v += st; st += inc; seq.push(v); } rule = `the gaps grow by ${inc} each time (${s}, ${s + inc}, ${s + 2 * inc}, …)`; }
  else if (kind === "alt") { const a = R.int(2, 12), s = R.int(2, 6), b = R.int(30, 60), t = R.int(2, 5); seq = []; for (let i = 0; i < 3; i++) { seq.push(a + i * s); seq.push(b - i * t); } rule = `two interleaved series: one adds ${s} (${a}, ${a + s}, ${a + 2 * s}) and the other subtracts ${t} (${b}, ${b - t}, ${b - 2 * t})`; }
  else { const a = R.int(2, 6); seq = [a]; for (let i = 1; i < 6; i++) seq.push(i % 2 ? seq[i - 1] * 2 : seq[i - 1] + 3); rule = "the operations alternate: multiply by 2, then add 3"; }
  const hide = 5, ans = seq[hide];
  const shown = seq.slice(0, hide).join(", ") + ", ?";
  const last = seq[hide - 1], pd = seq[hide - 1] - seq[hide - 2];
  return {
    topic: "Logical Reasoning · Number series",
    text: `Find the missing number in the series: ${shown}`,
    answer: ans,
    traps: [
      { v: last + pd, why: "Continued the most recent difference without checking whether the pattern changes." },
      { v: last * 2, why: "Assumed doubling because the last step looked like a doubling." },
      { v: ans + 1, why: "Right pattern, off-by-one slip in the final calculation." },
      { v: ans - 2, why: "Applied the rule one step too early." },
    ],
    hints: ["Look at the differences or ratios between neighbouring terms.", "If the differences are not constant, check their differences, or look at alternate terms separately.", `The pattern: ${rule.split(":")[0]}…`],
    steps: [`Study the terms: ${seq.slice(0, hide).join(", ")}.`, `The pattern is that ${rule}.`, `Applying it once more gives ${ans}.`],
  };
});

lr("coding", "Coding–decoding", function (d, R) {
  const words = ["STONE", "PLANT", "BRICK", "MONEY", "TABLE", "CLOUD", "HORSE", "RIVER", "SMILE", "TRAIN", "QUIET", "NORTH"];
  const w = R.pick(words), w2 = R.pick(words.filter((x) => x !== w));
  const sh = R.int(1, d >= 3 ? 5 : 3);
  const enc = (s, k) => s.split("").map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + 26) % 26) + 65)).join("");
  if (d <= 2) {
    return {
      topic: "Logical Reasoning · Coding–decoding",
      text: `In a certain code, each letter of a word is replaced by the letter ${sh} place${sh > 1 ? "s" : ""} ahead of it in the alphabet. How would ${w2} be written in that code?`,
      answer: enc(w2, sh), fmt: (v) => String(v),
      traps: [
        { v: enc(w2, -sh), why: "Moved each letter backward instead of forward." },
        { v: enc(w2, sh + 1), why: "Shifted one place too far." },
        { v: enc(w2, sh - 1) === w2 ? enc(w2, sh + 2) : enc(w2, sh - 1), why: "Shifted one place too few." },
        { v: enc(w2, 2 * sh), why: "Doubled the shift." },
      ],
      hints: ["Take the first letter and move it forward in the alphabet by the stated number of places.", `${w2[0]} + ${sh} = ${enc(w2[0], sh)}.`, "Repeat for every letter, remembering Z wraps around to A."],
      steps: [`Shift each letter ${sh} place${sh > 1 ? "s" : ""} forward.`, w2.split("").map((c) => `${c}→${enc(c, sh)}`).join(", ") + ".", `The code is ${enc(w2, sh)}.`],
    };
  }
  const L = (s) => s.split("").join("");
  return {
    topic: "Logical Reasoning · Coding–decoding",
    text: `In a certain code, ${w} is written as ${enc(w, sh)}. How would ${w2} be written in the same code?`,
    answer: enc(w2, sh), fmt: (v) => String(v),
    traps: [
      { v: enc(w2, -sh), why: "Applied the shift in the wrong direction." },
      { v: enc(w2, sh + 1), why: "Misjudged the size of the shift by one." },
      { v: w2.split("").reverse().join(""), why: "Reversed the word instead of finding the letter shift." },
      { v: enc(w2, sh - 1) === w2 ? enc(w2, sh + 2) : enc(w2, sh - 1), why: "Misjudged the size of the shift by one in the other direction." },
    ],
    hints: ["Compare one letter of the original with its coded letter.", `${w[0]} becomes ${enc(w, sh)[0]}. How many places apart are they?`, "Apply the same shift to every letter of the new word."],
    steps: [`Compare ${w[0]} and ${enc(w, sh)[0]}: the shift is ${sh} forward.`, `Check with the second letter: ${w[1]}→${enc(w, sh)[1]}, also ${sh}.`, `Apply to ${w2}: ${w2.split("").map((c) => `${c}→${enc(c, sh)}`).join(", ")}.`, `The code is ${enc(w2, sh)}.`],
  };
});

lr("direction", "Direction sense", function (d, R) {
  const dirs = ["north", "east", "south", "west"], vec = { north: [0, 1], east: [1, 0], south: [0, -1], west: [-1, 0] };
  const nLegs = [2, 3, 4, 5][d - 1];
  let x = 0, y = 0, face = R.int(0, 3), legs = [], story = [];
  const start = dirs[face];
  story.push(`A person starts facing ${start} and walks ${(() => { const k = R.int(2, 9); x += vec[start][0] * k; y += vec[start][1] * k; return k; })()} km.`);
  for (let i = 1; i < nLegs; i++) {
    const turn = R.pick(["left", "right"]);
    face = (face + (turn === "right" ? 1 : 3)) % 4;
    const k = R.int(2, 9); x += vec[dirs[face]][0] * k; y += vec[dirs[face]][1] * k;
    story.push(`Then he turns ${turn} and walks ${k} km.`);
  }
  const dist = Math.sqrt(x * x + y * y);
  const askDir = d >= 3 || Number.isInteger(dist) === false;
  const dirName = (() => { if (x === 0 && y === 0) return null; const ns = y > 0 ? "north" : y < 0 ? "south" : ""; const ew = x > 0 ? "east" : x < 0 ? "west" : ""; return ns + (ns && ew ? "-" : "") + ew; })();
  if (!dirName) return REG_LR_RETRY();
  const all = ["north", "south", "east", "west", "north-east", "north-west", "south-east", "south-west"];
  const opp = { north: "south", south: "north", east: "west", west: "east", "north-east": "south-west", "south-west": "north-east", "north-west": "south-east", "south-east": "north-west" };
  return {
    topic: "Logical Reasoning · Direction sense",
    text: story.join(" ") + " In which direction is he now with respect to his starting point?",
    answer: dirName, fmt: (v) => String(v),
    traps: [
      { v: opp[dirName], why: "Gave the direction of the starting point from him, which is the reverse of what is asked." },
      { v: all.filter((a) => a !== dirName && a !== opp[dirName])[0], why: "Lost track of one turn when updating the facing direction." },
      { v: all.filter((a) => a !== dirName && a !== opp[dirName])[3], why: "Mixed up left and right on one turn." },
      { v: all.filter((a) => a !== dirName && a !== opp[dirName])[5], why: "Added the displacement along the wrong axis." },
    ],
    hints: ["Draw a coordinate grid with north up, and track the facing direction after each turn.", "A right turn rotates the facing direction clockwise: north → east → south → west.", `Net displacement: ${Math.abs(x)} km ${x >= 0 ? "east" : "west"} and ${Math.abs(y)} km ${y >= 0 ? "north" : "south"}.`],
    steps: story.map((s, i) => s).concat([`Net position from the start: ${Math.abs(x)} km ${x >= 0 ? "east" : "west"} and ${Math.abs(y)} km ${y >= 0 ? "north" : "south"}.`, `So he is to the ${dirName} of the starting point.`]),
  };
});
function REG_LR_RETRY() { return null; }

lr("syllogism", "Syllogisms", function (d, R) {
  const sets = [["cats", "mammals", "pets"], ["doctors", "graduates", "readers"], ["roses", "flowers", "plants"], ["engineers", "thinkers", "writers"], ["planets", "stars", "rocks"], ["pens", "tools", "toys"]];
  const [A, B, C] = R.pick(sets);
  const forms = [
    { p: [`All ${A} are ${B}.`, `All ${B} are ${C}.`], opts: { c1: `All ${A} are ${C}.`, c2: `Some ${C} are ${A}.`, c3: `No ${A} is ${C}.`, c4: `All ${C} are ${A}.` }, valid: ["c1", "c2"], good: "Both 1 and 2 follow", note: "From All A are B and All B are C we get All A are C. A universal statement implies its converse particular, so Some C are A also follows. The reverse universal and the negative do not follow." },
    { p: [`Some ${A} are ${B}.`, `All ${B} are ${C}.`], opts: { c1: `Some ${A} are ${C}.`, c2: `All ${A} are ${C}.`, c3: `Some ${C} are ${A}.`, c4: `No ${A} is ${C}.` }, valid: ["c1", "c3"], good: "Both 1 and 3 follow", note: "The A that are B are also C, so Some A are C, and by conversion Some C are A. All A are C would need every A to be B." },
    { p: [`No ${A} is ${B}.`, `All ${C} are ${B}.`], opts: { c1: `No ${C} is ${A}.`, c2: `Some ${C} are ${A}.`, c3: `Some ${A} are ${C}.`, c4: `All ${A} are ${C}.` }, valid: ["c1"], good: "Only 1 follows", note: "Everything in C lies inside B, and nothing in A is in B, so no C is A. The particular statements and All A are C contradict this." },
    { p: [`All ${A} are ${B}.`, `Some ${B} are ${C}.`], opts: { c1: `Some ${A} are ${C}.`, c2: `All ${A} are ${C}.`, c3: `Some ${C} are ${B}.`, c4: `No ${A} is ${C}.` }, valid: ["c3"], good: "Only 3 follows", note: "The B that are C need not be the ones that are A, so nothing definite follows about A and C. Only the converse of the second premise, Some C are B, is certain." },
  ];
  const f = forms[(d - 1 + R.int(0, 1)) % forms.length];
  const keys = ["c1", "c2", "c3", "c4"];
  const labels = keys.map((k, i) => `${i + 1}. ${f.opts[k]}`);
  const validIdx = f.valid.map((k) => keys.indexOf(k) + 1);
  const combos = [];
  for (let i = 1; i <= 4; i++) combos.push(`Only ${i} follows`);
  for (let i = 1; i <= 4; i++) for (let j = i + 1; j <= 4; j++) combos.push(`Both ${i} and ${j} follow`);
  const ans = validIdx.length === 1 ? `Only ${validIdx[0]} follows` : `Both ${validIdx[0]} and ${validIdx[1]} follow`;
  const others = combos.filter((c) => c !== ans);
  return {
    topic: "Logical Reasoning · Syllogisms",
    text: `Statements:\n${f.p.map((p, i) => `**${i + 1}.** ${p}`).join("\n")}\n\nConclusions:\n${labels.join("\n")}\n\nWhich of the conclusions definitely follow?`,
    answer: ans, fmt: (v) => String(v),
    traps: R.shuffle(others).slice(0, 4).map((o, i) => ({ v: o, why: i === 0 ? "Accepted a conclusion that looks plausible but is not forced by the statements." : i === 1 ? "Rejected a conclusion that follows from conversion of a statement." : "Mixed up which conclusions are certain and which are only possible." })),
    hints: ["Draw Venn circles for the statements and test each conclusion against every possible drawing.", "A conclusion follows only if it is true in every valid drawing.", `Check conclusions ${validIdx.join(" and ")} first.`],
    steps: [`Statements: ${f.p.join(" ")}`, f.note, `Therefore: ${ans}.`],
  };
});

lr("ranking", "Ranking & ordering", function (d, R) {
  const names = R.shuffle(["Aman", "Bela", "Chirag", "Divya", "Esha", "Farhan", "Gita", "Harsh"]).slice(0, d + 3);
  const order = R.shuffle(names); // tallest first
  const n = order.length;
  const clues = [];
  for (let i = 0; i < n - 1; i++) clues.push(`${order[i]} is taller than ${order[i + 1]}.`);
  const shuffled = R.shuffle(clues);
  const qs = R.pick(["third", "mid", "pos"]);
  let text, ans, why, steps;
  if (d === 1 || qs === "third") {
    const k = 3; ans = order[k - 1];
    text = `${n} friends are compared by height. ${shuffled.join(" ")} Who is the ${k === 3 ? "third tallest" : ""}?`;
    steps = [`Chain the clues from tallest to shortest: ${order.join(" > ")}.`, `The third tallest is ${ans}.`];
  } else if (qs === "mid") {
    const k = Math.ceil(n / 2); ans = order[k - 1];
    text = `${n} friends are compared by height. ${shuffled.join(" ")} Who is in the middle (exactly ${k - 1} taller and ${n - k} shorter)?`;
    steps = [`Chain the clues: ${order.join(" > ")}.`, `Position ${k} from the top has ${k - 1} people taller and ${n - k} shorter: ${ans}.`];
  } else {
    const who = order[R.int(1, n - 2)];
    ans = order.indexOf(who) + 1;
    text = `${n} friends are compared by height. ${shuffled.join(" ")} What is ${who}'s position from the shortest end?`;
    ans = n - order.indexOf(who);
    steps = [`Chain the clues: ${order.join(" > ")}.`, `${who} has ${order.indexOf(who)} taller and ${n - order.indexOf(who) - 1} shorter people.`, `From the shortest end, ${who} is at position ${ans}.`];
  }
  const isName = typeof ans === "string";
  return {
    topic: "Logical Reasoning · Ranking & ordering",
    text, answer: ans, fmt: (v) => String(v),
    traps: isName
      ? [order[0], order[1], order[order.length - 1], order[Math.min(3, order.length - 1)]].filter((x) => x !== ans).map((v) => ({ v, why: "Counted from the wrong end or skipped one link in the chain." }))
      : [ans + 1, ans - 1, n - ans + 1, n - ans].map((v) => ({ v, why: "Counted from the tall end instead of the short end, or made an off-by-one slip." })),
    hints: ["Link the statements into one single chain from tallest to shortest.", "Each clue gives one link; look for a name that appears in two clues.", `The tallest person is the one who never appears as the shorter one in a clue.`],
    steps,
  };
});

lr("blood", "Blood relations", function (d, R) {
  const items = [
    { s: "Pointing to a photograph, Meera said, \"He is the son of my father's only brother.\"", q: "How is the man in the photograph related to Meera?", a: "Cousin", x: ["Brother", "Nephew", "Uncle"], why: "Her father's brother's son shares a grandparent with her, which is a cousin.", d: 1 },
    { s: "A is the mother of B. B is the sister of C. C is the father of D.", q: "How is A related to D?", a: "Grandmother", x: ["Mother", "Aunt", "Great-grandmother"], why: "A is C's mother (B and C are siblings). C is D's father, so A is D's paternal grandmother.", d: 1 },
    { s: "Rahul says, \"Her mother is the only daughter of my mother.\"", q: "How is the woman related to Rahul?", a: "Niece", x: ["Sister", "Cousin", "Daughter"], why: "Rahul's mother's only daughter is his sister. The woman's mother is his sister, so she is his sister's daughter, a niece.", d: 2 },
    { s: "P is the brother of Q. Q is the mother of R. R is the sister of S.", q: "How is S related to P?", a: "Nephew or niece (sister's child)", x: ["Son", "Brother", "Cousin"], why: "Q is P's sister, R and S are Q's children, so S is P's sister's child.", d: 2 },
    { s: "Pointing to a man, a woman said, \"His mother is the only daughter of my mother.\"", q: "How is the woman related to the man?", a: "Maternal aunt", x: ["Mother", "Sister", "Grandmother"], why: "The only daughter of her mother is herself, so she is the man's mother. This makes her the man's mother.", d: 3, override: "Mother", overrideX: ["Maternal aunt", "Sister", "Grandmother"] },
    { s: "X is the father of Y. Y is the brother of Z. Z is the daughter of W. W is the wife of X's brother.", q: "How is Y related to W?", a: "Nephew", x: ["Son", "Brother", "Cousin"], why: "W is the wife of X's brother. Z is W's daughter and Y is Z's brother, so Y would be W's son. But Y's father is X, so Y and Z share a father, which makes W's husband X's brother = X. Reading the statements as given, Y is W's nephew only if Z is a half-sibling of Y.", d: 4, skip: true },
    { s: "A is B's sister. C is B's mother. D is C's father. E is D's mother.", q: "How is A related to D?", a: "Granddaughter", x: ["Daughter", "Great-granddaughter", "Niece"], why: "A is C's daughter (A is B's sister), and C is D's child, so A is D's granddaughter.", d: 3 },
    { s: "A is B's sister. C is B's mother. D is C's father. E is D's mother.", q: "How is E related to B?", a: "Great-grandmother", x: ["Grandmother", "Mother", "Aunt"], why: "E is D's mother, D is C's father, C is B's mother. So E is B's mother's father's mother, a great-grandmother.", d: 4 },
  ].filter((x) => !x.skip);
  const pool = R.shuffle(items).sort((a, b) => Math.abs(a.d - d) - Math.abs(b.d - d));
  const it = pool[0];
  const answer = it.override || it.a, xs = it.overrideX || it.x;
  return {
    topic: "Logical Reasoning · Blood relations",
    text: `${it.s}\n\n${it.q}`,
    answer, fmt: (v) => String(v),
    traps: xs.map((v) => ({ v, why: "A plausible relation, but it does not match the chain of statements. Re-trace each link." })),
    hints: ["Draw a small family tree and place each person as you read.", "Fix the gender and generation of each person before moving on.", "Move one link at a time from the first named person to the one in the question."],
    steps: [it.why, `So the relationship is: ${answer}.`],
    avg: 55 + it.d * 10,
  };
});

/* Critical Reasoning bank */
const CR_BANK = [
  { d: 1, t: "Strengthen", arg: "A town noticed that its crime rate fell after streetlights were installed on the main road. The council concluded that the lights reduced crime.", q: "Which of the following, if true, most strengthens the council's conclusion?", a: "Crime fell only on the streets where lights were installed and stayed the same on streets without them.", x: [["The town also hired a few more clerks in the council office that year.", "An unrelated change that does not link the lights to crime."], ["The lights cost less than the council had expected.", "Cost has no bearing on whether the lights reduced crime."], ["Many residents like the look of the new lights.", "Opinion about appearance says nothing about crime."]], why: "A comparison with streets that had no lights isolates the lights as the cause." },
  { d: 1, t: "Weaken", arg: "A company introduced free fruit in its office and found that sick leave dropped by 15% the next year. It concluded that eating fruit makes employees healthier.", q: "Which of the following, if true, most weakens the conclusion?", a: "That year the company also introduced a rule that required a doctor's note for any sick leave.", x: [["Most employees said they enjoyed the fruit.", "Enjoyment does not affect whether the fruit improved health."], ["Fruit is generally considered part of a healthy diet.", "This supports the conclusion rather than weakening it."], ["The company's profits rose that year.", "Profit has no link to sick leave."]], why: "The new rule offers a rival explanation for the drop in sick leave." },
  { d: 2, t: "Assumption", arg: "Our city's cycling accidents have risen since the new bike lanes were opened. Therefore the bike lanes have made cycling more dangerous.", q: "The argument above assumes that", a: "the number of cyclists did not rise enough to explain the increase in accidents.", x: [["bike lanes are more expensive than regular roads.", "Cost is irrelevant to the safety claim."], ["all cyclists use the bike lanes.", "The argument does not need every cyclist to use them."], ["accidents involving cars have also gone up.", "Car accidents do not bear on the claim about cycling."]], why: "If many more people started cycling, more accidents could occur even if lanes were safer. The argument needs this alternative to be false." },
  { d: 2, t: "Inference", arg: "All the students who scored above 90 in the mock test enrolled in the advanced course. Priya enrolled in the advanced course.", q: "Which of the following must be true?", a: "None of the above can be concluded for certain.", x: [["Priya scored above 90 in the mock test.", "Enrolment in the course does not require a score above 90 for everyone; this reverses the statement."], ["Priya scored below 90 in the mock test.", "Nothing in the statements rules out a high score."], ["Only students scoring above 90 enrolled in the advanced course.", "The statement says high scorers enrolled, not that only high scorers did."]], why: "The statement gives 'all high scorers enrolled', not 'all enrollees were high scorers'. Reversing it is the classic error." },
  { d: 3, t: "Flaw", arg: "Every successful entrepreneur I have met works long hours. So if you want to become successful, you should work long hours.", q: "The reasoning above is flawed because it", a: "treats a feature common among successful people as a sufficient cause of success.", x: [["relies on the opinion of someone who has met too few entrepreneurs.", "The flaw is in the logic, not in the sample size alone."], ["assumes all entrepreneurs want to be successful.", "This is not required by the argument."], ["contradicts its own premise.", "The conclusion does not contradict the premise."]], why: "Many unsuccessful people also work long hours. The argument mistakes a common trait for a cause." },
  { d: 3, t: "Strengthen", arg: "A study found that children who play a musical instrument score higher on maths tests. The authors conclude that learning music improves maths ability.", q: "Which of the following, if true, most strengthens the authors' conclusion?", a: "When children who had never played music were randomly assigned to music lessons, their maths scores rose compared with a control group.", x: [["Children who play music also tend to come from wealthier families.", "This offers another explanation, which weakens the conclusion."], ["Maths teachers often recommend music lessons.", "Recommendation does not show that music improves maths."], ["Many successful mathematicians play instruments.", "An anecdotal association is weaker than a randomised comparison."]], why: "Random assignment removes the possibility that families or pre-existing ability explain the result." },
  { d: 4, t: "Paradox", arg: "A city expanded its public bus service, and ridership on buses rose sharply. Yet total traffic congestion in the city increased in the same period.", q: "Which of the following, if true, best explains how both facts could hold?", a: "Most of the new riders had previously used trains, not private cars, while car ownership continued to grow.", x: [["The buses use special lanes in the busiest areas.", "This would reduce congestion, deepening the puzzle."], ["The city's population fell during the period.", "A smaller population would reduce congestion too."], ["Bus fares were lowered at the start of the year.", "Lower fares explain higher ridership but not congestion."]], why: "If riders came from trains rather than cars, congestion would not fall, and growing car ownership could make it worse." },
  { d: 4, t: "Weaken", arg: "A bank argues that because its new app has 2 million downloads, customers clearly prefer digital banking to visiting branches.", q: "Which of the following, if true, most seriously weakens the bank's argument?", a: "Most of the downloads were by customers who have since stopped using the app and still visit branches regularly.", x: [["The app was downloaded more often on weekends than on weekdays.", "Day-of-week patterns say nothing about preference."], ["Some customers use more than one banking app.", "This does not reduce the evidence of preference for the bank's own app."], ["The bank spent heavily on advertising the app.", "Advertising may explain downloads, but it does not show that customers prefer branches."]], why: "Downloads measure curiosity, not sustained use. If users abandoned the app and kept using branches, downloads do not show preference." },
];

function makeLR(group, d, count, R, idBase) {
  const out = [];
  const gens = LR_GEN.filter((g) => group === "Mixed" || group === "Critical Reasoning" ? true : g.topic === group);
  const useCR = group === "Critical Reasoning" || (group === "Mixed" && true);
  const crPool = R.shuffle(CR_BANK).sort((a, b) => Math.abs(a.d - d) - Math.abs(b.d - d));
  let crI = 0, gi = 0;
  const genOrder = R.shuffle(group === "Critical Reasoning" ? [] : gens.filter((g) => group === "Mixed" || g.topic === group));
  for (let k = 0; k < count; k++) {
    const wantCR = group === "Critical Reasoning" || (group === "Mixed" && k % 4 === 3);
    if (wantCR) {
      const c = crPool[crI++ % crPool.length];
      const spec = {
        topic: `Logical Reasoning · Critical Reasoning (${c.t})`,
        text: `**Argument:** ${c.arg}\n\n${c.q}`,
        answer: c.a, fmt: (v) => String(v),
        traps: c.x.map(([v, why]) => ({ v, why })),
        avg: 70 + c.d * 12,
        hints: [`Identify the conclusion and the evidence the author uses to support it.`, `This is a ${c.t.toLowerCase()} question. Look for the gap between evidence and conclusion.`, c.t === "Paradox" ? "The right answer must reconcile two facts that seem to clash." : "The right answer must act on the link between the evidence and the conclusion, not just touch the same topic."],
        steps: [`Conclusion and evidence: the author moves from the evidence to the conclusion stated in the argument.`, c.why, `The correct option is the one that does this job.`],
      };
      const q = U.finalize(spec, "LR", d, R, `${idBase}-${String(k + 1).padStart(2, "0")}`);
      q.difficulty = c.d; out.push(q); continue;
    }
    let spec = null;
    for (let t = 0; t < 40 && !spec; t++) {
      const g = genOrder[(gi++) % genOrder.length];
      spec = g.fn(d, R);
    }
    if (!spec) continue;
    out.push(U.finalize(spec, "LR", d, R, `${idBase}-${String(k + 1).padStart(2, "0")}`));
  }
  return out;
}
const LR_TOPICS = ["Mixed", "Number series", "Coding–decoding", "Direction sense", "Syllogisms", "Ranking & ordering", "Blood relations", "Critical Reasoning"];

/* ============================================================
   Public API
   ============================================================ */
export const SECTIONS = {
  "QA-MCQ": { label: "Quantitative Ability · MCQ", short: "QA MCQ", topics: ["Mixed"].concat(QA_GROUPS) },
  "QA-SAQ": { label: "Quantitative Ability · SAQ (Indore)", short: "QA SAQ", topics: ["Mixed"].concat(QA_GROUPS) },
  "VARC-RC": { label: "VARC · Reading Comprehension", short: "RC", topics: ["Reading Comprehension"] },
  "VARC-PJ": { label: "VARC · Para Jumbles", short: "Para Jumbles", topics: ["Para Jumbles"] },
  "VARC-VOC": { label: "VARC · Vocabulary", short: "Vocabulary", topics: ["Vocabulary"] },
  LR: { label: "Logical Reasoning", short: "LR", topics: LR_TOPICS },
};
export const DIFFICULTIES = [
  { level: 1, label: "Easy", hint: "Warm-up, direct application" },
  { level: 2, label: "Moderate", hint: "Two-step, standard patterns" },
  { level: 3, label: "IPMAT Standard (High)", hint: "Indore / Rohtak exam pitch" },
  { level: 4, label: "CAT Level (Advanced)", hint: "Multi-concept, trap-heavy" },
];
export const COUNTS = [5, 10, 15];

let uid = 0;
export function generateQuestions({ section, topic, difficulty, count, seed }) {
  const s = seed ?? ((Date.now() ^ (++uid * 2654435761)) >>> 0);
  const R = U.rng(s);
  const base = `${section}-${s.toString(36)}`;
  let qs = [];
  if (section === "QA-MCQ" || section === "QA-SAQ") qs = makeQA(section, topic || "Mixed", difficulty, count, R, base);
  else if (section === "VARC-RC") qs = makeRC(difficulty, count, R, base);
  else if (section === "VARC-PJ") qs = makePJ(difficulty, count, R, base);
  else if (section === "VARC-VOC") qs = makeVocab(difficulty, count, R, base);
  else if (section === "LR") qs = makeLR(topic || "Mixed", difficulty, count, R, base);
  // Normalise the public section code to the schema: "QA-MCQ" | "QA-SAQ" | "VARC" | "LR"
  return qs.map((q) => ({ ...q, section: q.section === "VARC" ? "VARC" : q.section }));
}
export { U };
