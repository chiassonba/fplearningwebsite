import { describe, it, expect } from 'vitest';
import katex from 'katex';
import { families, initialState, type Family } from './index.js';
import { algebraSteps, functionLatex, numberLatex } from './math-notation.js';

describe('typeset mathematics', () => {
  it.each(Object.keys(families) as Family[])(
    'renders all %s steps with fractions, powers, and a real limit',
    (family) => {
      for (const changes of [
        {},
        { a: -2, k: -0.5, h: 3, b: -1, base: 0.5 },
        { a: 0, angleUnit: 'degrees' as const },
      ]) {
        const state = { ...initialState(family), ...changes };
        const steps = algebraSteps(state, 2);
        expect(steps[0]?.equations[0]).toContain(
          '\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}',
        );
        for (const equation of [
          functionLatex(state),
          ...steps.flatMap((step) => step.equations),
        ]) {
          const html = katex.renderToString(equation, {
            displayMode: true,
            strict: 'error',
            throwOnError: true,
            trust: false,
          });
          expect(html).toContain('<math');
          expect(html).not.toContain('katex-error');
        }
      }
    },
  );
  it('preserves scientific notation as powers of ten', () =>
    expect(numberLatex(1e-10)).toBe('1\\times 10^{-10}'));
  it('keeps the real algebraic stages in the quadratic solution', () => {
    const steps = algebraSteps(initialState(), 3);
    expect(
      steps.find((step) => step.title === 'Substitute x + h')?.equations,
    ).toContain('f(x+h)=\\left(x+h\\right)^{2}');
    expect(
      steps
        .find((step) => step.title === 'Cancel the common factor h')
        ?.equations.join(' '),
    ).toContain('\\frac{f(x+h)-f(x)}{h}');
    expect(steps.at(-1)?.equations).toEqual(["f'\\left(3\\right)=6"]);
  });
  it('retains mathematical reasons for a nonexistent tangent', () => {
    expect(algebraSteps(initialState('absolute'), 0).at(-1)?.note).toContain(
      'corner',
    );
    expect(algebraSteps(initialState('reciprocal'), 0).at(-1)?.note).toContain(
      'undefined',
    );
  });
});
