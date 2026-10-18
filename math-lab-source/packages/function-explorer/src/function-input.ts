import {
  stateSchema,
  type ExplorerState,
  type Family,
  format,
} from './index.js';
import { polynomialCoefficients } from './first-principles.js';
type Node =
  | { kind: 'number'; value: number }
  | { kind: 'x' }
  | { kind: 'op'; op: string; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] };
const num = (value: number): Node => ({ kind: 'number', value });
const op = (operator: string, left: Node, right: Node): Node => ({
  kind: 'op',
  op: operator,
  left,
  right,
});
const constant = (n: Node): number | null => {
  const p = polynomial(n);
  return p && p.slice(1).every((c) => c === 0) ? p[0]! : null;
};
const clean = (p: number[]) => {
  while (p.length > 1 && p.at(-1) === 0) p.pop();
  if (p.some((c) => !Number.isFinite(c)))
    throw new Error('The coefficients must be finite.');
  return p;
};
function add(a: number[], b: number[], factor = 1) {
  return clean(
    Array.from(
      { length: Math.max(a.length, b.length) },
      (_, i) => (a[i] ?? 0) + factor * (b[i] ?? 0),
    ),
  );
}
function multiply(a: number[], b: number[]) {
  if (a.length + b.length - 2 > 6)
    throw new Error('Use a polynomial of degree 6 or lower.');
  const p = Array<number>(a.length + b.length - 1).fill(0);
  a.forEach((c, i) =>
    b.forEach((d, j) => {
      p[i + j] = (p[i + j] ?? 0) + c * d;
    }),
  );
  return clean(p);
}
function polynomial(n: Node, replace?: Node): number[] | null {
  if (n === replace) return [0, 1];
  if (n.kind === 'number') return [n.value];
  if (n.kind === 'x') return replace ? null : [0, 1];
  if (n.kind === 'call') return null;
  const a = polynomial(n.left, replace),
    b = polynomial(n.right, replace);
  if (!a || !b) return null;
  switch (n.op) {
    case '+':
      return add(a, b);
    case '-':
      return add(a, b, -1);
    case '*':
      return multiply(a, b);
    case '/':
      return b.length === 1 && b[0] !== 0
        ? clean(a.map((c) => c / b[0]!))
        : null;
    case '^': {
      if (b.length !== 1 || !Number.isInteger(b[0]) || b[0]! < 0 || b[0]! > 6)
        return null;
      let p = [1];
      for (let i = 0; i < b[0]!; i++) p = multiply(p, a);
      return p;
    }
  }
  return null;
}
function parse(source: string): Node {
  const text = source
    .trim()
    .replace(/^(?:f\(x\)|y)\s*=\s*/i, '')
    .replaceAll('−', '-')
    .replace(/[·×]/g, '*')
    .replaceAll('÷', '/')
    .replaceAll('**', '^')
    .replace(/[²³⁴⁵⁶]/g, (c) => `^${'²³⁴⁵⁶'.indexOf(c) + 2}`);
  if (!text || text.length > 500)
    throw new Error('Enter a function using at most 500 characters.');
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i]!)) {
      i++;
      continue;
    }
    const match =
      /^(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[+\-*/^(),])/.exec(
        text.slice(i),
      );
    if (!match) throw new Error('Use numbers, x, brackets, +, -, *, / and ^.');
    tokens.push(match[0]);
    i += match[0].length;
    if (tokens.length > 256) throw new Error('That expression is too long.');
  }
  let at = 0,
    depth = 0;
  const peek = () => tokens[at];
  const enter = () => {
    if (++depth > 32) throw new Error('Use fewer nested brackets.');
  };
  function atom(): Node {
    enter();
    try {
      const token = tokens[at++];
      if (!token) throw new Error('The expression is incomplete.');
      if (token === '(') {
        const node = sum();
        if (tokens[at++] !== ')')
          throw new Error('Close each opening bracket.');
        return node;
      }
      if (token.toLowerCase() === 'x') return { kind: 'x' };
      if (token.toLowerCase() === 'pi') return num(Math.PI);
      if (token.toLowerCase() === 'e') return num(Math.E);
      if (/^\d|^\./.test(token)) {
        const value = Number(token);
        if (!Number.isFinite(value)) throw new Error('Use finite numbers.');
        return num(value);
      }
      const name = token.toLowerCase();
      if (
        !['sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'ln', 'log'].includes(name)
      )
        throw new Error(
          `Unknown name. Use x, sin, cos, tan, sqrt, abs, exp, ln or log.`,
        );
      if (tokens[at++] !== '(')
        throw new Error(`Write ${name} with brackets, for example ${name}(x).`);
      const args = [sum()];
      if (peek() === ',') {
        at++;
        args.push(sum());
      }
      if (tokens[at++] !== ')') throw new Error('Close each function bracket.');
      return { kind: 'call', name, args };
    } finally {
      depth--;
    }
  }
  function power(): Node {
    let left = atom();
    if (peek() === '^') {
      at++;
      left = op('^', left, unary());
    }
    return left;
  }
  function unary(): Node {
    if (peek() === '+' || peek() === '-') {
      const sign = tokens[at++];
      return sign === '-' ? op('*', num(-1), unary()) : unary();
    }
    return power();
  }
  function product(): Node {
    let node = unary();
    while (true) {
      if (peek() === '*' || peek() === '/') {
        const operation = tokens[at++]!;
        node = op(operation, node, unary());
      } else if (peek() && (peek() === '(' || /^[a-zA-Z\d.]/.test(peek()!))) {
        node = op('*', node, unary());
      } else return node;
    }
  }
  function sum(): Node {
    let node = product();
    while (peek() === '+' || peek() === '-') {
      const operation = tokens[at++]!;
      node = op(operation, node, product());
    }
    return node;
  }
  const result = sum();
  if (at !== tokens.length)
    throw new Error('Check the brackets and operators.');
  return result;
}
function nodes(n: Node): Node[] {
  return [
    n,
    ...(n.kind === 'op'
      ? [...nodes(n.left), ...nodes(n.right)]
      : n.kind === 'call'
        ? n.args.flatMap(nodes)
        : []),
  ];
}
export function parseFunctionInput(
  source: string,
  current: ExplorerState,
): ExplorerState {
  const tree = parse(source),
    poly = polynomial(tree);
  if (poly) {
    const coefficients = Array.from({ length: 7 }, (_, i) => poly[i] ?? 0);
    const result = stateSchema.safeParse({
      ...current,
      family: 'polynomial',
      a: 1,
      k: 1,
      h: 0,
      b: 0,
      coefficients,
    });
    if (!result.success)
      throw new Error(
        'Use polynomial coefficients between -20 and 20 and degree 6 or lower.',
      );
    if (poly.length <= 2)
      return stateSchema.parse({
        ...result.data,
        family: 'linear',
        a: poly[1] ?? 0,
        b: poly[0] ?? 0,
      });
    if (poly.length === 3) {
      const a = poly[2]!,
        h = -poly[1]! / (2 * a),
        b = poly[0]! - a * h * h;
      const quadratic = stateSchema.safeParse({
        ...result.data,
        family: 'quadratic',
        a,
        h,
        b,
      });
      if (quadratic.success) return quadratic.data;
    }
    return result.data;
  }
  for (const candidate of nodes(tree)) {
    let family: Family | undefined,
      arg: Node | undefined,
      base = 2,
      innerScale = 1;
    if (candidate.kind === 'call') {
      const names: Record<string, Family> = {
        sin: 'sine',
        cos: 'cosine',
        tan: 'tangent',
        sqrt: 'squareRoot',
        abs: 'absolute',
        exp: 'exponential',
        ln: 'logarithm',
        log: 'logarithm',
      };
      family = names[candidate.name];
      arg = candidate.args[0];
      base =
        candidate.name === 'exp' || candidate.name === 'ln'
          ? Math.E
          : candidate.name === 'log'
            ? 10
            : 2;
      if (candidate.args.length === 2) {
        if (candidate.name !== 'log') continue;
        const value = constant(candidate.args[1]!);
        if (value === null) continue;
        base = value;
      }
    } else if (candidate.kind === 'op' && candidate.op === '^') {
      const exponent = constant(candidate.right),
        B = constant(candidate.left);
      if (exponent === -1 || exponent === -2) {
        family = exponent === -1 ? 'reciprocal' : 'reciprocalSquared';
        arg = candidate.left;
      } else if (B !== null) {
        family = 'exponential';
        arg = candidate.right;
        base = B;
      }
    } else if (candidate.kind === 'op' && candidate.op === '/') {
      const numerator = constant(candidate.left);
      if (numerator !== null) {
        family = 'reciprocal';
        innerScale = numerator;
        arg = candidate.right;
        if (arg.kind === 'op' && arg.op === '^' && constant(arg.right) === 2) {
          family = 'reciprocalSquared';
          arg = arg.left;
        }
      } else {
        const numeratorPoly = polynomial(candidate.left),
          denominator = polynomial(candidate.right);
        if (numeratorPoly && denominator?.length === 2) {
          const u = add(denominator, [1]),
            expected = add(multiply(u, u), [1], -1),
            index = expected.findIndex((c) => c !== 0);
          if (index >= 0) {
            const scale = (numeratorPoly[index] ?? 0) / expected[index]!;
            if (
              Array.from(
                { length: Math.max(numeratorPoly.length, expected.length) },
                (_, i) =>
                  Math.abs(
                    (numeratorPoly[i] ?? 0) - scale * (expected[i] ?? 0),
                  ),
              ).every((n) => n < 1e-10)
            ) {
              family = 'rationalHole';
              arg = op('+', candidate.right, num(1));
              innerScale = scale;
            }
          }
        }
      }
    }
    if (!family || !arg) continue;
    const inner = polynomial(arg),
      outer = polynomial(tree, candidate);
    if (
      !inner ||
      inner.length !== 2 ||
      inner[1] === 0 ||
      !outer ||
      outer.length > 2
    )
      continue;
    const k = inner[1]!,
      h = -inner[0]! / k,
      a = (outer[1] ?? 0) * innerScale,
      b = outer[0] ?? 0;
    const next = stateSchema.safeParse({
      ...current,
      family,
      a,
      k,
      h,
      b,
      base,
    });
    if (next.success) return next.data;
  }
  throw new Error(
    'Use a polynomial up to degree 6, or a transformed supported function such as 2sin(3x)-1, 2^(x-1), ln(x+2) or 3/(x-1). Combined functions are not supported yet.',
  );
}
export function functionInputText(s: ExplorerState): string {
  const p = polynomialCoefficients(s);
  if (p) {
    const terms = p
      .map((c, i) => ({ c, i }))
      .filter((t) => t.c !== 0)
      .reverse();
    return terms.length
      ? terms
          .map(
            ({ c, i }, j) =>
              `${c < 0 ? '-' : j ? '+' : ''}${Math.abs(c) === 1 && i ? '' : format(Math.abs(c))}${i ? (i === 1 ? 'x' : `x^${i}`) : ''}`,
          )
          .join('')
      : '0';
  }
  const u = `(${format(s.k)}*(x-(${format(s.h)})))`;
  const parent = {
    reciprocal: `1/${u}`,
    reciprocalSquared: `1/${u}^2`,
    rationalHole: `(${u}^2-1)/(${u}-1)`,
    exponential: `${format(s.base)}^${u}`,
    logarithm: `log(${u},${format(s.base)})`,
    sine: `sin(${u})`,
    cosine: `cos(${u})`,
    tangent: `tan(${u})`,
    absolute: `abs(${u})`,
    squareRoot: `sqrt(${u})`,
  }[
    s.family as Exclude<
      Family,
      'linear' | 'quadratic' | 'cubic' | 'quartic' | 'polynomial'
    >
  ];
  return `${format(s.a)}*(${parent})+(${format(s.b)})`;
}
