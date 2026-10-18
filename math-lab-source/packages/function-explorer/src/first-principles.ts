import { evaluate, format, isTrig, type ExplorerState } from './index.js';

export type Derivation = {
  steps: { title: string; expression: string }[];
  derivative: number | null;
  reason: string;
  formula: string;
};
const choose = (n: number, r: number): number => {
  let value = 1;
  for (let i = 1; i <= r; i++) value = (value * (n - i + 1)) / i;
  return value;
};
function polynomial(s: ExplorerState): number[] | null {
  let terms: number[];
  switch (s.family) {
    case 'linear':
      terms = [0, 1];
      break;
    case 'quadratic':
      terms = [0, 0, 1];
      break;
    case 'cubic':
      terms = [0, 0, 0, 1];
      break;
    case 'quartic':
      terms = [0, 0, 0, 0, 1];
      break;
    case 'polynomial':
      terms = s.coefficients;
      break;
    default:
      return null;
  }
  const result = Array<number>(terms.length).fill(0);
  terms.forEach((c, n) => {
    for (let j = 0; j <= n; j++)
      result[j] =
        (result[j] ?? 0) +
        s.a * c * s.k ** n * choose(n, j) * (-s.h) ** (n - j);
  });
  result[0] = (result[0] ?? 0) + s.b;
  return result;
}
function sum(terms: { coefficient: number; term: string }[]): string {
  const used = terms.filter((t) => t.coefficient !== 0);
  if (!used.length) return '0';
  return used
    .map(
      ({ coefficient: c, term }, i) =>
        `${c < 0 ? (i ? ' - ' : '-') : i ? ' + ' : ''}${Math.abs(c) === 1 && term ? '' : format(Math.abs(c))}${term}`,
    )
    .join('');
}
const power = (symbol: string, n: number) =>
  n === 0 ? '' : n === 1 ? symbol : `${symbol}^${n}`;
function polyText(c: number[], symbol = 'x') {
  return sum(
    c
      .map((coefficient, i) => ({ coefficient, term: power(symbol, i) }))
      .reverse(),
  );
}
export function derivativeAt(s: ExplorerState, x: number): number | null {
  if (evaluate(s, x) === null) return null;
  const u = s.k * (x - s.h),
    p = polynomial(s);
  let value: number;
  if (p)
    value = p.reduce((v, c, i) => v + (i === 0 ? 0 : i * c * x ** (i - 1)), 0);
  else {
    if (s.family === 'squareRoot' && u === 0) return null;
    if (s.a === 0) return 0;
    const q = s.k * (s.angleUnit === 'degrees' ? Math.PI / 180 : 1),
      t = q * (x - s.h);
    switch (s.family) {
      case 'reciprocal':
        value = (-s.a * s.k) / u ** 2;
        break;
      case 'reciprocalSquared':
        value = (-2 * s.a * s.k) / u ** 3;
        break;
      case 'rationalHole':
        value = s.a * s.k;
        break;
      case 'exponential':
        value = s.a * s.k * Math.log(s.base) * s.base ** u;
        break;
      case 'logarithm':
        value = (s.a * s.k) / (u * Math.log(s.base));
        break;
      case 'sine':
        value = s.a * q * Math.cos(t);
        break;
      case 'cosine':
        value = -s.a * q * Math.sin(t);
        break;
      case 'tangent':
        value = (s.a * q) / Math.cos(t) ** 2;
        break;
      case 'absolute':
        if (u === 0) return null;
        value = s.a * s.k * Math.sign(u);
        break;
      case 'squareRoot':
        value = (s.a * s.k) / (2 * Math.sqrt(u));
        break;
      default:
        return null;
    }
  }
  return Number.isFinite(value) ? value : null;
}
export function firstPrinciples(s: ExplorerState, x: number): Derivation {
  const steps = [
    {
      title: 'Start with the definition',
      expression:
        'f′(x) = lim[h → 0] (f(x+h) - f(x)) / h, with h ≠ 0 before taking the limit.',
    },
  ];
  const add = (title: string, expression: string) =>
    steps.push({ title, expression });
  const p = polynomial(s);
  let formula = '';
  if (p) {
    const derivative = p.slice(1).map((c, i) => c * (i + 1));
    add('Write the chosen function', `f(x) = ${polyText(p)}`);
    add(
      'Substitute x+h and subtract f(x)',
      `f(x+h) - f(x) = [${polyText(p, '(x+h)')}] - [${polyText(p)}]`,
    );
    const expanded: { coefficient: number; term: string }[] = [];
    p.forEach((c, n) => {
      for (let j = 1; j <= n; j++)
        expanded.push({
          coefficient: c * choose(n, j),
          term: `${power('x', n - j)}${power('h', j)}`,
        });
    });
    add(
      'Expand the brackets and cancel equal terms',
      `f(x+h) - f(x) = ${sum(expanded.reverse())}`,
    );
    const divided: { coefficient: number; term: string }[] = [];
    p.forEach((c, n) => {
      for (let j = 1; j <= n; j++)
        divided.push({
          coefficient: c * choose(n, j),
          term: `${power('x', n - j)}${power('h', j - 1)}`,
        });
    });
    add(
      'Factor out h and divide by h',
      `(f(x+h) - f(x)) / h = ${sum(divided.reverse())}, h ≠ 0`,
    );
    formula = polyText(derivative);
    add(
      'Take the limit as h approaches zero',
      `Every remaining term containing h tends to 0. f′(x) = ${formula}`,
    );
  } else {
    const a = format(s.a),
      k = format(s.k),
      b = format(s.b);
    add(
      'Keep the horizontal shift separate from the step h',
      `Let u = ${k}(x - (${format(s.h)})). Then replacing x with x+h replaces u with u + (${k})h. The vertical shift ${b} cancels in f(x+h) - f(x).`,
    );
    switch (s.family) {
      case 'reciprocal':
        add(
          'Subtract the fractions',
          `(f(x+h)-f(x))/h = ${a}[1/(u+${k}h) - 1/u]/h = ${a}[u-(u+${k}h)]/[hu(u+${k}h)]`,
        );
        add('Cancel the common factor h', `= -(${a})(${k})/[u(u+${k}h)]`);
        formula = `-(${a})(${k})/u²`;
        break;
      case 'reciprocalSquared':
        add(
          'Use a common denominator',
          `(f(x+h)-f(x))/h = ${a}[u²-(u+${k}h)²]/[hu²(u+${k}h)²]`,
        );
        add(
          'Expand the square and cancel h',
          `= ${a}[-2u(${k}) - (${k})²h]/[u²(u+${k}h)²]`,
        );
        formula = `-2(${a})(${k})/u³`;
        break;
      case 'rationalHole':
        add(
          'Factor while retaining the excluded input',
          'f(x) = a[(u-1)(u+1)/(u-1)] + b = a(u+1)+b, only when u ≠ 1.',
        );
        add(
          'Subtract and cancel h',
          `(f(x+h)-f(x))/h = [${a}(u+${k}h+1)+${b} - (${a}(u+1)+${b})]/h = (${a})(${k})`,
        );
        formula = `(${a})(${k}), excluding u = 1`;
        break;
      case 'exponential':
        add(
          'Use the exponent law and factor',
          `(f(x+h)-f(x))/h = ${a}·${format(s.base)}^u [${format(s.base)}^(${k}h) - 1]/h`,
        );
        add(
          'Use the fundamental exponential limit',
          `Let z = (${k})h. Then (B^z-1)/z → ln(B). The quotient tends to (${a})·${format(s.base)}^u·(${k})ln(${format(s.base)}).`,
        );
        formula = `(${a})(${k})ln(${format(s.base)})·${format(s.base)}^u`;
        break;
      case 'logarithm':
        add(
          'Combine the logarithms',
          `(f(x+h)-f(x))/h = ${a}·ln((u+${k}h)/u)/[h·ln(${format(s.base)})] = ${a}·ln(1+${k}h/u)/[h·ln(${format(s.base)})]`,
        );
        add(
          'Use the fundamental logarithm limit',
          `Let z = (${k})h/u. Since ln(1+z)/z → 1, the limit is (${a})(${k})/[u·ln(${format(s.base)})]. Requires u > 0.`,
        );
        formula = `(${a})(${k})/[u·ln(${format(s.base)})]`;
        break;
      case 'squareRoot':
        add(
          'Multiply by the conjugate',
          `(f(x+h)-f(x))/h = ${a}[√(u+${k}h)-√u]/h = ${a}[u+${k}h-u]/[h(√(u+${k}h)+√u)]`,
        );
        add(
          'Cancel h, then take the limit',
          `= (${a})(${k})/[√(u+${k}h)+√u] → (${a})(${k})/(2√u), for u > 0.`,
        );
        formula = `(${a})(${k})/(2√u)`;
        break;
      case 'absolute':
        add(
          'Use the sign on each side of the corner',
          `If u > 0, |u+${k}h|-|u| = (${k})h for sufficiently small h. If u < 0, the difference is -(${k})h.`,
        );
        add(
          'Divide by h and compare the one-sided limits',
          `f′(x) = (${a})(${k}) for u > 0; -(${a})(${k}) for u < 0. At u=0 the left slope is -|${k}|(${a}), and the right slope is |${k}|(${a}). They agree only if a=0.`,
        );
        formula = `(${a})(${k})·sign(u), for u ≠ 0`;
        break;
      default: {
        const q = s.angleUnit === 'degrees' ? `(${k})π/180` : k;
        add(
          'Express angles in radians for the limit',
          `Let θ = (${q})(x - (${format(s.h)})) and q = ${q}. The new angle is θ+qh.${s.angleUnit === 'degrees' ? ' The π/180 factor is essential when x is measured in degrees.' : ''}`,
        );
        if (s.family === 'sine') {
          add(
            'Apply the sine addition identity',
            `(f(x+h)-f(x))/h = ${a}[sin(θ)(cos(qh)-1)/h + cos(θ)sin(qh)/h]`,
          );
          formula = `(${a})(${q})cos(θ)`;
        } else if (s.family === 'cosine') {
          add(
            'Apply the cosine addition identity',
            `(f(x+h)-f(x))/h = ${a}[cos(θ)(cos(qh)-1)/h - sin(θ)sin(qh)/h]`,
          );
          formula = `-(${a})(${q})sin(θ)`;
        } else {
          add(
            'Subtract the tangents using sine and cosine',
            `(f(x+h)-f(x))/h = ${a}sin(qh)/[h·cos(θ+qh)cos(θ)]`,
          );
          formula = `(${a})(${q})/cos²(θ)`;
        }
        add(
          'Use the fundamental radian limits',
          'sin(qh)/h → q and (cos(qh)-1)/h → 0. Keep x inside the original domain.',
        );
      }
    }
    add(
      'Take the limit',
      `f′(x) = ${formula}.${s.a === 0 ? ' Here a=0, so the derivative is 0 at interior points of the original domain.' : ''}`,
    );
  }
  const derivative = derivativeAt(s, x);
  let reason = '';
  if (evaluate(s, x) === null)
    reason =
      'The function is undefined at the selected x, so it has no tangent there.';
  else if (s.family === 'squareRoot' && s.k * (x - s.h) === 0)
    reason =
      'This is a domain endpoint. There is no two-sided finite IROC here.';
  else if (s.family === 'absolute' && x === s.h && s.a !== 0)
    reason =
      'The left and right slopes disagree at this corner, so a tangent slope does not exist.';
  else if (derivative === null)
    reason = 'The slope is outside the supported numerical range.';
  add(
    'Evaluate at the chosen x',
    derivative === null
      ? `At x = ${format(x)}: ${reason}`
      : `f′(${format(x)}) = ${format(derivative)}${isTrig(s) && s.angleUnit === 'degrees' ? ' per degree' : ''}`,
  );
  return { steps, derivative, reason, formula };
}

export { polynomial as polynomialCoefficients, choose as binomialCoefficient };
