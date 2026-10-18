import { describe, expect, it } from 'vitest';
import {
  averageRate,
  createCapture,
  discontinuities,
  evaluate,
  features,
  initialState,
  plot,
  restoreCapture,
  stateSchema,
  type ExplorerState,
  type Family,
} from './index.js';
import { derivativeAt, firstPrinciples } from './first-principles.js';

const state = (family: Family, overrides: Partial<ExplorerState> = {}) => ({
  ...initialState(family),
  ...overrides,
});
describe('independent Advanced Functions fixtures', () => {
  it.each([
    ['linear', 3, 3],
    ['quadratic', 3, 9],
    ['cubic', -2, -8],
    ['quartic', -2, 16],
    ['polynomial', 2, 2],
    ['reciprocal', 2, 0.5],
    ['reciprocalSquared', -2, 0.25],
    ['rationalHole', 2, 3],
    ['exponential', 3, 8],
    ['logarithm', 8, 3],
    ['sine', Math.PI / 2, 1],
    ['cosine', Math.PI, -1],
    ['tangent', Math.PI / 4, 1],
    ['absolute', -3, 3],
    ['squareRoot', 9, 3],
  ] as const)('%s values', (family, x, y) =>
    expect(evaluate(state(family), x)).toBeCloseTo(y, 12),
  );
  it('handles shifts, reflection and scaling independently', () => {
    const s = state('quadratic', { a: -2, k: 0.5, h: 3, b: 1 });
    expect(evaluate(s, 7)).toBe(-7);
    expect(features(s)).toContainEqual({ label: 'Vertex', value: '(3, 1)' });
    expect(features(s)).toContainEqual({
      label: 'Expanded form',
      value: 'y = -0.5x² + (3)x + (-3.5)',
    });
  });
  it.each(['reciprocal', 'reciprocalSquared', 'logarithm'] as const)(
    'retains the %s domain with a=0',
    (family) => expect(evaluate(state(family, { a: 0 }), 0)).toBeNull(),
  );
  it('keeps the removable hole and domain endpoints', () => {
    expect(evaluate(state('rationalHole'), 1)).toBeNull();
    expect(evaluate(state('squareRoot'), 0)).toBe(0);
    expect(evaluate(state('squareRoot'), -1)).toBeNull();
    expect(evaluate(state('logarithm', { k: -1 }), -8)).toBe(3);
    expect(evaluate(state('tangent'), Math.PI / 2)).toBeNull();
  });
  it('uses degrees explicitly', () => {
    expect(evaluate(state('sine', { angleUnit: 'degrees' }), 90)).toBe(1);
    expect(
      derivativeAt(state('sine', { angleUnit: 'degrees' }), 0),
    ).toBeCloseTo(Math.PI / 180, 14);
  });
  it('rejects hostile, unsupported, non-finite and degenerate states', () => {
    for (const changes of [
      { family: '<script>' },
      { a: Infinity },
      { k: 0 },
      { base: 1 },
      { a: 21 },
      { probe: { x: NaN, h: 0 } },
      { viewport: { xMin: 0, xMax: 0, yMin: -1, yMax: 1 } },
      { unknown: 'code' },
    ])
      expect(
        stateSchema.safeParse({ ...initialState(), ...changes }).success,
      ).toBe(false);
  });
  it('supports bases between zero and one', () =>
    expect(evaluate(state('logarithm', { base: 0.5 }), 0.25)).toBe(2));
});
describe('first-principles algebra and secant limits', () => {
  it.each([
    ['linear', 2, 1],
    ['quadratic', 3, 6],
    ['cubic', 2, 12],
    ['quartic', 2, 32],
    ['polynomial', 2, 9],
    ['reciprocal', 2, -0.25],
    ['reciprocalSquared', 2, -0.25],
    ['rationalHole', 2, 1],
    ['exponential', 3, 8 * Math.LN2],
    ['logarithm', 2, 1 / (2 * Math.LN2)],
    ['sine', 0, 1],
    ['cosine', Math.PI / 2, -1],
    ['tangent', 0, 1],
    ['absolute', -2, -1],
    ['squareRoot', 4, 0.25],
  ] as const)(
    '%s IROC agrees with independent algebra and both secant limits',
    (family, x, d) => {
      const s = state(family);
      expect(derivativeAt(s, x)).toBeCloseTo(d, 10);
      for (const h of [-0.00001, 0.00001])
        expect(averageRate(s, x, x + h)).toBeCloseTo(d, 3);
    },
  );
  it('derives the transformed quadratic by actual binomial expansion', () => {
    const s = state('quadratic', { a: 2, k: 1, h: 3, b: 4 });
    const d = firstPrinciples(s, 5);
    expect(d.derivative).toBe(8);
    expect(d.steps.map((x) => x.expression).join('\n')).toContain(
      '2h^2 + 4xh - 12h',
    );
    expect(d.steps.map((x) => x.expression).join('\n')).toContain(
      '2h + 4x - 12',
    );
    expect(d.formula).toBe('4x - 12');
  });
  it('does not divide by zero or invent a tangent at a cusp, hole or endpoint', () => {
    expect(averageRate(state('quadratic'), 1, 1)).toBeNull();
    for (const [family, x] of [
      ['absolute', 0],
      ['rationalHole', 1],
      ['reciprocal', 0],
      ['squareRoot', 0],
      ['logarithm', 0],
    ] as const)
      expect(firstPrinciples(state(family), x).derivative).toBeNull();
    expect(derivativeAt(state('absolute', { a: 0, b: 2 }), 0)).toBe(0);
  });
  it('retains overflow boundaries and no arbitrary code execution', () => {
    expect(evaluate(state('exponential', { base: 20 }), 1000)).toBeNull();
    expect(firstPrinciples(state('squareRoot'), 0).reason).toContain(
      'endpoint',
    );
  });
});
describe('sampled graph geometry', () => {
  it.each([
    'reciprocal',
    'reciprocalSquared',
    'rationalHole',
    'tangent',
  ] as const)('%s has no false segment crossing a discontinuity', (family) => {
    const s = state(family);
    const graph = plot(s);
    expect(graph.segments.length).toBeGreaterThan(0);
    for (const [p, q] of graph.segments) {
      for (const c of discontinuities(s))
        expect(p.x < c && q.x > c).toBe(false);
    }
  });
  it('clips finite geometry into the viewport', () => {
    const s = state('exponential', { base: 20 });
    for (const points of plot(s).segments)
      for (const p of points) {
        expect(Number.isFinite(p.y)).toBe(true);
        expect(p.y).toBeGreaterThanOrEqual(s.viewport.yMin - 1e-9);
        expect(p.y).toBeLessThanOrEqual(s.viewport.yMax + 1e-9);
      }
  });
  it('matches the quadratic coordinate mapping before clipping', () => {
    const s = state('quadratic');
    const segments = plot(s).segments;
    const exact = segments.flat().filter((p) => p.y > 0.1 && p.y < 8);
    expect(exact.length).toBeGreaterThan(20);
    for (const p of exact) expect(p.y).toBeCloseTo(p.x * p.x, 9);
  });
  it('refuses aliased trig curves at excessive frequency', () =>
    expect(
      plot(
        state('sine', {
          k: 20,
          viewport: { xMin: -1000, xMax: 1000, yMin: -2, yMax: 2 },
        }),
      ),
    ).toEqual({ segments: [], limited: true }));
});
describe('immutable experiment handoff to notebooks', () => {
  it('round-trips model, viewport, selected x, h and reasoning without tracking live edits', () => {
    const s = initialState('cubic');
    const c = createCapture({
      moduleId: 'function-explorer',
      schemaVersion: 1,
      moduleVersion: '1.0.0',
      activityId: 'predict-transform-explain',
      capturedAt: '2026-10-18T12:00:00.000Z',
      initialState: s,
      state: s,
      prediction: 'The slope will increase.',
      observation: 'The slope increased.',
      calculation: '3x²',
      explanation: 'The difference quotient tends to 3x².',
    });
    s.a = 5;
    s.probe.x = 10;
    expect(c.state.a).toBe(1);
    expect(c.state.probe.x).toBe(1);
    expect(Object.isFrozen(c.state.probe)).toBe(true);
    expect(restoreCapture(JSON.parse(JSON.stringify(c)))).toEqual(c);
    expect(() => restoreCapture({ ...c, schemaVersion: 99 })).toThrow();
  });
});
