import { describe, it, expect } from 'vitest';
import { families, initialState, evaluate, type Family } from './index.js';
import { parseFunctionInput, functionInputText } from './function-input.js';
import { derivativeAt } from './first-principles.js';
describe('single-line function input', () => {
  it('applies the requested quadratic to all mathematics', () => {
    const s = parseFunctionInput('2x^2+2x-3', initialState());
    expect(evaluate(s, 2)).toBe(9);
    expect(derivativeAt(s, 2)).toBe(10);
    expect(s.family).toBe('quadratic');
    expect(functionInputText(s)).toBe('2x^2+2x-3');
  });
  it.each([
    ['-x^2', 2, -4],
    ['(x+1)^3', 2, 27],
    ['x/2+1', 2, 2],
    ['f(x)=2x²+2x−3', 2, 9],
    ['2sin(3x)-1', 0, -1],
    ['3/(x-1)', 2, 3],
    ['2^x', 3, 8],
    ['ln(x+2)', Math.E - 2, 1],
    ['log(x)', 100, 2],
    ['log(x,2)', 8, 3],
    ['sqrt(x+1)', 3, 2],
    ['abs(2x-1)', -1, 3],
    ['x^-2', 2, 0.25],
    ['(x^2-1)/(x-1)', 2, 3],
  ] as const)('reads %s', (source, x, y) =>
    expect(evaluate(parseFunctionInput(source, initialState()), x)).toBeCloseTo(
      y,
      10,
    ),
  );
  it.each(Object.keys(families) as Family[])(
    'round-trips the displayed %s input',
    (family) => {
      const s = initialState(family),
        restored = parseFunctionInput(functionInputText(s), s);
      for (const x of [-2, -0.5, 0, 0.5, 2]) {
        const expected = evaluate(s, x),
          actual = evaluate(restored, x);
        if (expected === null) expect(actual).toBeNull();
        else expect(actual).toBeCloseTo(expected, 6);
      }
    },
  );
  it.each([
    '',
    'x;alert(1)',
    'window.location',
    '__proto__(x)',
    'x^999',
    '1/0',
    'sin(x^2)',
    'sin(x)+cos(x)',
    '100x^2',
    '2x+',
    '('.repeat(40) + 'x' + ')'.repeat(40),
  ])('rejects unsafe, unsupported or incomplete input %s', (source) =>
    expect(() => parseFunctionInput(source, initialState())).toThrow(),
  );
});
