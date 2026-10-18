import { z } from 'zod';

export const families = {
  linear: 'Linear',
  quadratic: 'Quadratic',
  cubic: 'Cubic',
  quartic: 'Quartic',
  polynomial: 'Polynomial (up to degree 6)',
  reciprocal: 'Rational: reciprocal',
  reciprocalSquared: 'Rational: reciprocal squared',
  rationalHole: 'Rational: removable hole',
  exponential: 'Exponential',
  logarithm: 'Logarithmic',
  sine: 'Sine',
  cosine: 'Cosine',
  tangent: 'Tangent',
  absolute: 'Absolute value',
  squareRoot: 'Square root',
} as const;
export type Family = keyof typeof families;
const bounded = z.number().finite().min(-20).max(20);
const coordinate = z.number().finite().min(-1000).max(1000);
export const viewportSchema = z
  .strictObject({
    xMin: coordinate,
    xMax: coordinate,
    yMin: coordinate,
    yMax: coordinate,
  })
  .refine(
    (v) => v.xMax - v.xMin >= 0.1 && v.yMax - v.yMin >= 0.1,
    'Each axis needs a span of at least 0.1.',
  );
export const stateSchema = z.strictObject({
  family: z.enum(Object.keys(families) as [Family, ...Family[]]),
  a: bounded,
  k: bounded.refine(
    (n) => Math.abs(n) >= 0.1,
    'k must have magnitude at least 0.1.',
  ),
  h: bounded,
  b: bounded,
  base: z
    .number()
    .finite()
    .min(0.1)
    .max(20)
    .refine((n) => n !== 1, 'The base cannot be 1.'),
  coefficients: z.array(bounded).length(7),
  angleUnit: z.enum(['radians', 'degrees']),
  viewport: viewportSchema,
  tableX: z.array(coordinate).min(1).max(21),
  compare: z.boolean(),
  probe: z.strictObject({ x: coordinate, h: coordinate }),
});
export type ExplorerState = z.infer<typeof stateSchema>;
export type Point = { x: number; y: number };
export function initialState(family: Family = 'quadratic'): ExplorerState {
  const trig = ['sine', 'cosine', 'tangent'].includes(family);
  return {
    family,
    a: 1,
    k: 1,
    h: 0,
    b: 0,
    base: 2,
    coefficients: [0, -3, 0, 1, 0, 0, 0],
    angleUnit: 'radians',
    viewport: {
      xMin: trig ? -2 * Math.PI : -10,
      xMax: trig ? 2 * Math.PI : 10,
      yMin: -10,
      yMax: 10,
    },
    tableX: [-2, -1, 0, 1, 2],
    compare: true,
    probe: { x: 1, h: 0.1 },
  };
}
export function isTrig(s: ExplorerState) {
  return ['sine', 'cosine', 'tangent'].includes(s.family);
}
export function evaluate(s: ExplorerState, x: number): number | null {
  if (!Number.isFinite(x)) return null;
  const u = s.k * (x - s.h);
  const theta = s.angleUnit === 'degrees' ? (u * Math.PI) / 180 : u;
  let y: number;
  switch (s.family) {
    case 'linear':
      y = u;
      break;
    case 'quadratic':
      y = u * u;
      break;
    case 'cubic':
      y = u ** 3;
      break;
    case 'quartic':
      y = u ** 4;
      break;
    case 'polynomial':
      y = s.coefficients.reduceRight((acc, c) => acc * u + c, 0);
      break;
    case 'reciprocal':
      if (u === 0) return null;
      y = 1 / u;
      break;
    case 'reciprocalSquared':
      if (u === 0) return null;
      y = 1 / (u * u);
      break;
    case 'rationalHole':
      if (Math.abs(u - 1) <= 4 * Number.EPSILON * Math.max(1, Math.abs(u)))
        return null;
      y = u + 1;
      break;
    case 'exponential':
      y = s.base ** u;
      break;
    case 'logarithm':
      if (u <= 0) return null;
      y = Math.log(u) / Math.log(s.base);
      break;
    case 'sine':
      y = Math.sin(theta);
      break;
    case 'cosine':
      y = Math.cos(theta);
      break;
    case 'tangent':
      if (Math.abs(Math.cos(theta)) < 1e-12) return null;
      y = Math.tan(theta);
      break;
    case 'absolute':
      y = Math.abs(u);
      break;
    case 'squareRoot':
      if (u < 0) return null;
      y = Math.sqrt(u);
      break;
  }
  // Domain restrictions survive a zero vertical scale, while numerical overflow does not.
  const result = s.a === 0 ? s.b : s.a * y + s.b;
  return Number.isFinite(result) ? result : null;
}
export const format = (n: number): string =>
  Number(n.toPrecision(7)).toString();
function shifted(s: ExplorerState) {
  return `${format(s.k)}(x ${s.h < 0 ? '+' : '-'} ${format(Math.abs(s.h))})`;
}
export function equation(s: ExplorerState): string {
  const u = shifted(s);
  const inner = {
    linear: u,
    quadratic: `(${u})²`,
    cubic: `(${u})³`,
    quartic: `(${u})⁴`,
    polynomial: s.coefficients
      .map((c, i) => `${format(c)}·(${u})^${i}`)
      .join(' + '),
    reciprocal: `1/(${u})`,
    reciprocalSquared: `1/(${u})²`,
    rationalHole: `((${u})² - 1)/((${u}) - 1)`,
    exponential: `${format(s.base)}^(${u})`,
    logarithm: `log_${format(s.base)}(${u})`,
    sine: `sin(${u})`,
    cosine: `cos(${u})`,
    tangent: `tan(${u})`,
    absolute: `|${u}|`,
    squareRoot: `√(${u})`,
  }[s.family];
  return `y = ${format(s.a)}·[${inner}] ${s.b < 0 ? '-' : '+'} ${format(Math.abs(s.b))}${isTrig(s) ? ` (${s.angleUnit})` : ''}`;
}
export function baseline(s: ExplorerState): ExplorerState {
  return { ...s, a: 1, k: 1, h: 0, b: 0 };
}
export function discontinuities(s: ExplorerState): number[] {
  if (['reciprocal', 'reciprocalSquared', 'logarithm'].includes(s.family))
    return [s.h];
  if (s.family === 'rationalHole') return [s.h + 1 / s.k];
  if (s.family !== 'tangent') return [];
  const unit = s.angleUnit === 'degrees' ? 180 : Math.PI;
  const lo = Math.min(
    s.k * (s.viewport.xMin - s.h),
    s.k * (s.viewport.xMax - s.h),
  );
  const hi = Math.max(
    s.k * (s.viewport.xMin - s.h),
    s.k * (s.viewport.xMax - s.h),
  );
  const start = Math.ceil(lo / unit - 0.5),
    end = Math.floor(hi / unit - 0.5);
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, i) => s.h + ((start + i + 0.5) * unit) / s.k,
  ).sort((a, b) => a - b);
}
export function features(s: ExplorerState): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value: string) => rows.push({ label, value });
  const direction = s.k > 0 ? '>' : '<';
  let domain = 'All real x';
  if (s.family === 'logarithm') domain = `x ${direction} ${format(s.h)}`;
  if (s.family === 'squareRoot') domain = `x ${direction}= ${format(s.h)}`;
  if (['reciprocal', 'reciprocalSquared'].includes(s.family))
    domain = `All real x except ${format(s.h)}`;
  if (s.family === 'rationalHole')
    domain = `All real x except ${format(s.h + 1 / s.k)}`;
  if (s.family === 'tangent')
    domain = `x ≠ ${format(s.h)} + (${s.angleUnit === 'degrees' ? '90° + n·180°' : 'π/2 + nπ'}) / ${format(s.k)}, integer n`;
  add('Domain', domain);
  if (s.a === 0) add('Range', `y = ${format(s.b)} on the stated domain`);
  else if (
    ['quadratic', 'quartic', 'absolute', 'squareRoot'].includes(s.family)
  )
    add('Range', `y ${s.a > 0 ? '≥' : '≤'} ${format(s.b)}`);
  else if (s.family === 'reciprocalSquared' || s.family === 'exponential')
    add('Range', `y ${s.a > 0 ? '>' : '<'} ${format(s.b)}`);
  else if (s.family === 'reciprocal')
    add('Range', `All real y except ${format(s.b)}`);
  else if (s.family === 'rationalHole')
    add('Range', `All real y except ${format(2 * s.a + s.b)}`);
  else if (s.family === 'sine' || s.family === 'cosine')
    add(
      'Range',
      `${format(s.b - Math.abs(s.a))} ≤ y ≤ ${format(s.b + Math.abs(s.a))}`,
    );
  else if (s.family !== 'polynomial') add('Range', 'All real y');
  const y0 = evaluate(s, 0);
  add('y-intercept', y0 === null ? 'Undefined at x = 0' : `(0, ${format(y0)})`);
  if (s.a === 0)
    add(
      'Relation',
      'Constant on the stated domain; original exclusions remain.',
    );
  if (s.family === 'linear') {
    const slope = s.a * s.k,
      intercept = s.b - slope * s.h;
    add('Slope', format(slope));
    add(
      'x-intercept',
      slope === 0
        ? intercept === 0
          ? 'Every real x'
          : 'None'
        : `(${format(-intercept / slope)}, 0)`,
    );
  }
  if (s.family === 'quadratic' && s.a !== 0) {
    const A = s.a * s.k ** 2,
      B = -2 * A * s.h,
      C = A * s.h ** 2 + s.b;
    add(
      'Expanded form',
      `y = ${format(A)}x² + (${format(B)})x + (${format(C)})`,
    );
    add('Vertex', `(${format(s.h)}, ${format(s.b)})`);
    add('Axis of symmetry', `x = ${format(s.h)}`);
    add('Opening', s.a > 0 ? 'Upward' : 'Downward');
    const rad = -s.b / s.a;
    add(
      'Real roots',
      rad < 0
        ? 'None'
        : rad === 0
          ? format(s.h)
          : [
              s.h - Math.sqrt(rad) / Math.abs(s.k),
              s.h + Math.sqrt(rad) / Math.abs(s.k),
            ]
              .map(format)
              .join(', '),
    );
  }
  if (s.family === 'polynomial') {
    let degree = -1;
    s.coefficients.forEach((c, i) => {
      if (c !== 0) degree = i;
    });
    add(
      'Degree',
      s.a === 0 || degree <= 0
        ? 'Constant (zero polynomial has no degree)'
        : String(degree),
    );
    add(
      'Roots and turning points',
      'Inspect graph and table; general polynomial roots are not solved symbolically.',
    );
  }
  if (
    ['reciprocal', 'reciprocalSquared', 'logarithm'].includes(s.family) &&
    s.a !== 0
  )
    add('Vertical asymptote', `x = ${format(s.h)}`);
  if (
    ['reciprocal', 'reciprocalSquared', 'exponential'].includes(s.family) &&
    s.a !== 0
  )
    add('Horizontal asymptote', `y = ${format(s.b)}`);
  if (s.family === 'rationalHole')
    add('Open hole', `(${format(s.h + 1 / s.k)}, ${format(2 * s.a + s.b)})`);
  if (isTrig(s) && s.a !== 0) {
    const cycle =
      s.angleUnit === 'degrees'
        ? s.family === 'tangent'
          ? 180
          : 360
        : s.family === 'tangent'
          ? Math.PI
          : 2 * Math.PI;
    add('Period', `${format(cycle / Math.abs(s.k))} ${s.angleUnit}`);
    if (s.family !== 'tangent') add('Amplitude', format(Math.abs(s.a)));
    add('Midline', `y = ${format(s.b)}`);
    if (s.family === 'tangent')
      add('Vertical asymptotes', 'At every excluded x in the domain formula.');
  }
  add(
    'Transformations',
    `Vertical scale ${format(s.a)}; horizontal scale ${format(1 / Math.abs(s.k))}${s.k < 0 ? ' with horizontal reflection' : ''}; shift right ${format(s.h)}, up ${format(s.b)}.`,
  );
  return rows;
}
export function averageRate(
  s: ExplorerState,
  x1: number,
  x2: number,
): number | null {
  if (!Number.isFinite(x1) || !Number.isFinite(x2) || x1 === x2) return null;
  const y1 = evaluate(s, x1),
    y2 = evaluate(s, x2);
  if (y1 === null || y2 === null) return null;
  const result = (y2 - y1) / (x2 - x1);
  return Number.isFinite(result) ? result : null;
}

// Clip each sampled segment in mathematical coordinates before sending finite pixels to SVG.
function clip(
  p: Point,
  q: Point,
  v: ExplorerState['viewport'],
): [Point, Point] | null {
  let lo = 0,
    hi = 1;
  const dx = q.x - p.x,
    dy = q.y - p.y;
  for (const [d, n] of [
    [-dx, p.x - v.xMin],
    [dx, v.xMax - p.x],
    [-dy, p.y - v.yMin],
    [dy, v.yMax - p.y],
  ]) {
    if (d === undefined || n === undefined) return null;
    if (d === 0) {
      if (n < 0) return null;
      continue;
    }
    const t = n / d;
    if (d < 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
    if (lo > hi) return null;
  }
  return [
    { x: p.x + lo * dx, y: p.y + lo * dy },
    { x: p.x + hi * dx, y: p.y + hi * dy },
  ];
}
export function plot(s: ExplorerState): {
  segments: [Point, Point][];
  limited: boolean;
} {
  const v = s.viewport;
  const cycles = isTrig(s)
    ? (Math.abs(s.k) * (v.xMax - v.xMin)) /
      (s.angleUnit === 'degrees' ? 360 : 2 * Math.PI)
    : 0;
  const limited = cycles > 64;
  // Refuse an undersampled oscillatory plot. The table remains available.
  if (limited) return { segments: [], limited: true };
  const count = Math.max(600, Math.ceil(cycles * 64));
  const xs = Array.from(
    { length: count + 1 },
    (_, i) => v.xMin + ((v.xMax - v.xMin) * i) / count,
  );
  if (s.h > v.xMin && s.h < v.xMax) xs.push(s.h);
  const cuts = discontinuities(s);
  for (const cut of cuts) {
    if (cut < v.xMin || cut > v.xMax) continue;
    for (let exponent = 2; exponent <= 12; exponent++)
      for (const sign of [-1, 1]) {
        const near = cut + sign * (v.xMax - v.xMin) * 10 ** -exponent;
        if (near > v.xMin && near < v.xMax) xs.push(near);
      }
  }
  xs.sort((a, b) => a - b);
  const segments: [Point, Point][] = [];
  let prev: Point | null = null;
  for (const x of xs) {
    const y = evaluate(s, x);
    if (y === null) {
      prev = null;
      continue;
    }
    const next = { x, y };
    if (prev && !cuts.some((c) => c >= prev!.x && c <= x)) {
      const line = clip(prev, next, v);
      if (line) segments.push(line);
    }
    prev = next;
  }
  return { segments, limited: false };
}
export const captureSchema = z.strictObject({
  moduleId: z.literal('function-explorer'),
  schemaVersion: z.literal(1),
  moduleVersion: z.literal('1.0.0'),
  activityId: z.literal('predict-transform-explain'),
  capturedAt: z.iso.datetime(),
  initialState: stateSchema,
  state: stateSchema,
  prediction: z.string().min(1).max(2000),
  observation: z.string().min(1).max(2000),
  calculation: z.string().max(2000),
  explanation: z.string().max(2000),
});
export type ExperimentCapture = z.infer<typeof captureSchema>;
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export function createCapture(input: unknown): ExperimentCapture {
  return freeze(captureSchema.parse(input));
}
export function restoreCapture(input: unknown): ExperimentCapture {
  return createCapture(input);
}
