import { format, isTrig, type ExplorerState } from './index.js';
import {
  firstPrinciples,
  polynomialCoefficients,
  binomialCoefficient,
} from './first-principles.js';

export type AlgebraStep = { title: string; equations: string[]; note?: string };
const r = String.raw;
export function numberLatex(n: number): string {
  const [mantissa, exponent] = format(n).split('e');
  return exponent === undefined
    ? mantissa!
    : `${mantissa}\\times 10^{${Number(exponent)}}`;
}
const par = (n: number) => r`\left(${numberLatex(n)}\right)`;
function termPower(symbol: string, n: number) {
  return n === 0 ? '' : n === 1 ? symbol : `${symbol}^{${n}}`;
}
function polynomialLatex(coefficients: number[], symbol = 'x'): string {
  const terms = coefficients
    .map((coefficient, i) => ({ coefficient, power: termPower(symbol, i) }))
    .filter((t) => t.coefficient !== 0)
    .reverse();
  return terms.length
    ? terms
        .map(
          ({ coefficient: c, power }, i) =>
            `${c < 0 ? (i ? ' - ' : '-') : i ? ' + ' : ''}${Math.abs(c) === 1 && power ? '' : numberLatex(Math.abs(c))}${power}`,
        )
        .join('')
    : '0';
}
export function functionLatex(s: ExplorerState): string {
  const u = r`${par(s.k)}\left(x-${par(s.h)}\right)`;
  let parent: string;
  switch (s.family) {
    case 'linear':
      parent = u;
      break;
    case 'quadratic':
      parent = r`\left[${u}\right]^2`;
      break;
    case 'cubic':
      parent = r`\left[${u}\right]^3`;
      break;
    case 'quartic':
      parent = r`\left[${u}\right]^4`;
      break;
    case 'polynomial':
      parent = polynomialLatex(s.coefficients, r`\left[${u}\right]`);
      break;
    case 'reciprocal':
      parent = r`\frac{1}{${u}}`;
      break;
    case 'reciprocalSquared':
      parent = r`\frac{1}{\left[${u}\right]^2}`;
      break;
    case 'rationalHole':
      parent = r`\frac{\left[${u}\right]^2-1}{${u}-1}`;
      break;
    case 'exponential':
      parent = r`${par(s.base)}^{${u}}`;
      break;
    case 'logarithm':
      parent = r`\log_{${numberLatex(s.base)}}\left[${u}\right]`;
      break;
    case 'sine':
    case 'cosine':
    case 'tangent': {
      const operator = { sine: 'sin', cosine: 'cos', tangent: 'tan' }[s.family];
      parent = String.fromCharCode(92) + operator + r`\left[${u}\right]`;
      break;
    }
    case 'absolute':
      parent = r`\left|${u}\right|`;
      break;
    case 'squareRoot':
      parent = r`\sqrt{${u}}`;
      break;
  }
  const p = polynomialCoefficients(s);
  // Expanded polynomials are substantially easier to read than redundant unit factors.
  return p
    ? `f(x)=${polynomialLatex(p)}`
    : r`f(x)=${par(s.a)}\left[${parent}\right]+${par(s.b)}`;
}
const quotient = r`\frac{f(x+h)-f(x)}{h}`;
export function algebraSteps(s: ExplorerState, x: number): AlgebraStep[] {
  const rows: AlgebraStep[] = [];
  const add = (title: string, equations: string[], note?: string) =>
    rows.push({ title, equations, ...(note ? { note } : {}) });
  add(
    'Start with the definition',
    [r`f'(x)=\lim_{h\to 0}${quotient}`],
    'The step h is nonzero while we simplify. We take its limit only at the end.',
  );
  add(
    'Write the chosen function',
    [functionLatex(s)],
    isTrig(s) ? `Angles are measured in ${s.angleUnit}.` : undefined,
  );
  const p = polynomialCoefficients(s);
  if (p) {
    add('Substitute x + h', [
      `f(x+h)=${polynomialLatex(p, r`\left(x+h\right)`)}`,
    ]);
    const groups: string[] = [];
    for (let j = 1; j < p.length; j++) {
      const group = p.slice(j).map((c, i) => c * binomialCoefficient(i + j, j));
      if (group.every((c) => c === 0)) continue;
      const poly = polynomialLatex(group);
      groups.push(`${termPower('h', j)}\\left(${poly}\\right)`);
    }
    const equality = (lhs: string, terms: string[]) =>
      `${lhs}=${terms.length ? terms.join('+') : '0'}`;
    add(
      'Expand, subtract f(x), and cancel equal terms',
      [equality('f(x+h)-f(x)', groups)],
      'Group the remaining terms by powers of h. Every term has a factor of h.',
    );
    const divided: string[] = [];
    for (let j = 1; j < p.length; j++) {
      const group = p.slice(j).map((c, i) => c * binomialCoefficient(i + j, j));
      if (group.every((c) => c === 0)) continue;
      divided.push(
        `${termPower('h', j - 1)}\\left(${polynomialLatex(group)}\\right)`,
      );
    }
    add('Cancel the common factor h', [equality(quotient, divided), r`h\ne 0`]);
    const derivative = polynomialLatex(p.slice(1).map((c, i) => c * (i + 1)));
    add(
      'Take the limit as h approaches zero',
      [r`f'(x)=\lim_{h\to 0}${quotient}=${derivative}`],
      'Terms that still contain h approach zero. The remaining terms give the tangent slope.',
    );
  } else {
    const a = par(s.a),
      k = par(s.k),
      B = par(s.base),
      b = par(s.b),
      uNext = r`\left(u+${k}h\right)`;
    add(
      'Keep the horizontal shift separate from the step h',
      [
        r`u=${k}\left(x-${par(s.h)}\right)`,
        r`x\mapsto x+h\quad\Longrightarrow\quad u\mapsto u+${k}h`,
      ],
      'The vertical shift cancels when we subtract f(x).',
    );
    let derivative = '';
    switch (s.family) {
      case 'reciprocal':
        add('Subtract the fractions', [
          r`${quotient}=\frac{${a}}{h}\left[\frac{1}{${uNext}}-\frac{1}{u}\right]`,
          r`=\frac{${a}\left[u-${uNext}\right]}{hu${uNext}}`,
        ]);
        add('Cancel h', [r`${quotient}=\frac{-${a}${k}}{u${uNext}}`]);
        derivative = r`\frac{-${a}${k}}{u^2}`;
        break;
      case 'reciprocalSquared':
        add('Use a common denominator', [
          r`${quotient}=\frac{${a}\left[u^2-${uNext}^2\right]}{hu^2${uNext}^2}`,
        ]);
        add('Expand the square and cancel h', [
          r`${quotient}=\frac{${a}\left[-2u${k}-${k}^2h\right]}{u^2${uNext}^2}`,
        ]);
        derivative = r`\frac{-2${a}${k}}{u^3}`;
        break;
      case 'rationalHole':
        add('Factor and retain the excluded input', [
          r`f(x)=${a}\frac{(u-1)(u+1)}{u-1}+${b}`,
          r`=${a}(u+1)+${b},\qquad u\ne 1`,
        ]);
        add('Subtract and cancel h', [
          r`${quotient}=\frac{${a}${k}h}{h}=${a}${k}`,
        ]);
        derivative = r`${a}${k},\qquad u\ne 1`;
        break;
      case 'exponential':
        add('Factor using the exponent law', [
          r`${quotient}=${a}${B}^{u}\frac{${B}^{${k}h}-1}{h}`,
        ]);
        add('Use the fundamental exponential limit', [
          r`z=${k}h,\qquad\lim_{z\to 0}\frac{${B}^z-1}{z}=\ln ${B}`,
          r`\frac{${B}^{${k}h}-1}{h}=${k}\frac{${B}^{z}-1}{z}\longrightarrow ${k}\ln ${B}`,
        ]);
        derivative = r`${a}${k}\ln ${B}\,${B}^{u}`;
        break;
      case 'logarithm':
        add('Combine the logarithms', [
          r`${quotient}=\frac{${a}}{h\ln ${B}}\ln\left(\frac{u+${k}h}{u}\right)`,
          r`=\frac{${a}}{h\ln ${B}}\ln\left(1+\frac{${k}h}{u}\right)`,
        ]);
        add(
          'Use the fundamental logarithm limit',
          [
            r`z=\frac{${k}h}{u},\qquad\lim_{z\to 0}\frac{\ln(1+z)}{z}=1`,
            r`${quotient}=\frac{${a}${k}}{u\ln ${B}}\frac{\ln(1+z)}{z}`,
          ],
          'This calculation requires u > 0.',
        );
        derivative = r`\frac{${a}${k}}{u\ln ${B}}`;
        break;
      case 'squareRoot':
        add('Multiply by the conjugate', [
          r`${quotient}=\frac{${a}\left[\sqrt{u+${k}h}-\sqrt{u}\right]}{h}`,
          r`=\frac{${a}\left[(u+${k}h)-u\right]}{h\left[\sqrt{u+${k}h}+\sqrt{u}\right]}`,
        ]);
        add(
          'Cancel h',
          [r`${quotient}=\frac{${a}${k}}{\sqrt{u+${k}h}+\sqrt{u}}`],
          'A finite two-sided derivative requires u > 0.',
        );
        derivative = r`\frac{${a}${k}}{2\sqrt{u}}`;
        break;
      case 'absolute':
        add(
          'Simplify on each side of the corner',
          [
            r`${quotient}=\frac{${a}\left[\left|u+${k}h\right|-|u|\right]}{h}`,
            r`=\begin{cases}${a}${k},&u>0\\-${a}${k},&u<0\end{cases}`,
          ],
          'For sufficiently small h, u and u+kh stay on the same side of zero.',
        );
        add(
          'Compare one-sided slopes at the corner',
          [
            r`f'_-(${numberLatex(s.h)})=-${a}|${numberLatex(s.k)}|`,
            r`f'_+(${numberLatex(s.h)})=${a}|${numberLatex(s.k)}|`,
          ],
          'At the corner these limits disagree unless the vertical scale is zero.',
        );
        derivative = r`\begin{cases}${a}${k},&u>0\\-${a}${k},&u<0\end{cases}`;
        break;
      default: {
        const q =
          s.angleUnit === 'degrees'
            ? r`\frac{${numberLatex(s.k)}\pi}{180}`
            : numberLatex(s.k);
        add(
          'Write the angle in radians',
          [
            r`q=${q},\qquad\theta=q\left(x-${par(s.h)}\right)`,
            r`\theta(x+h)=\theta+qh`,
          ],
          s.angleUnit === 'degrees'
            ? 'The conversion factor π/180 is essential for a slope per degree.'
            : undefined,
        );
        if (s.family === 'sine') {
          add('Use the sine addition identity', [
            r`${quotient}=${a}\left[\sin\theta\,\frac{\cos(qh)-1}{h}+\cos\theta\,\frac{\sin(qh)}{h}\right]`,
          ]);
          derivative = r`${a}\left(${q}\right)\cos\theta`;
        } else if (s.family === 'cosine') {
          add('Use the cosine addition identity', [
            r`${quotient}=${a}\left[\cos\theta\,\frac{\cos(qh)-1}{h}-\sin\theta\,\frac{\sin(qh)}{h}\right]`,
          ]);
          derivative = r`-${a}\left(${q}\right)\sin\theta`;
        } else {
          add('Subtract using sine and cosine', [
            r`${quotient}=\frac{${a}\sin(qh)}{h\cos(\theta+qh)\cos\theta}`,
          ]);
          derivative = r`\frac{${a}\left(${q}\right)}{\cos^2\theta}`;
        }
        add('Use the fundamental radian limits', [
          r`\lim_{h\to 0}\frac{\sin(qh)}{h}=q`,
          r`\lim_{h\to 0}\frac{\cos(qh)-1}{h}=0`,
        ]);
      }
    }
    add(
      'Take the limit',
      [r`f'(x)=\lim_{h\to 0}${quotient}=${derivative}`],
      s.a === 0
        ? 'Here the vertical scale is zero. The derivative is zero at interior points of the original domain; original exclusions remain.'
        : undefined,
    );
  }
  const result = firstPrinciples(s, x);
  add(
    'Evaluate at your chosen x',
    result.derivative === null
      ? [r`x=${numberLatex(x)}`]
      : [r`f'\left(${numberLatex(x)}\right)=${numberLatex(result.derivative)}`],
    result.derivative === null
      ? result.reason
      : isTrig(s) && s.angleUnit === 'degrees'
        ? 'This slope is measured per degree.'
        : undefined,
  );
  return rows;
}
