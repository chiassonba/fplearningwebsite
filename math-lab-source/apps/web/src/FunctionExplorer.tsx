import { useEffect, useId, useMemo, useState } from 'react';
import {
  averageRate,
  baseline,
  createCapture,
  discontinuities,
  equation,
  evaluate,
  families,
  features,
  format,
  initialState,
  isTrig,
  plot,
  restoreCapture,
  stateSchema,
  viewportSchema,
  type ExperimentCapture,
  type ExplorerState,
  type Family,
} from '../../../packages/function-explorer/src/index';
import { firstPrinciples } from '../../../packages/function-explorer/src/first-principles';
import './function-explorer.css';
import { MathFormula } from './MathFormula';
import { FunctionInput } from './FunctionInput';
import {
  algebraSteps,
  functionLatex,
  numberLatex,
} from '../../../packages/function-explorer/src/math-notation';

function NumberControl({
  label,
  value,
  onChange,
  min = -20,
  max = 20,
  step = 0.1,
  slider = false,
  valid = () => true,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  slider?: boolean;
  valid?: (n: number) => boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const number = Number(draft);
  const okay =
    draft.trim() !== '' &&
    Number.isFinite(number) &&
    number >= min &&
    number <= max &&
    valid(number);
  function update(text: string) {
    setDraft(text);
    const n = Number(text);
    if (
      text.trim() !== '' &&
      Number.isFinite(n) &&
      n >= min &&
      n <= max &&
      valid(n)
    )
      onChange(n);
  }
  return (
    <div className="lab-number">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        disabled={disabled}
        aria-invalid={!okay}
        aria-describedby={!okay ? `${id}-error` : undefined}
        onChange={(e) => update(e.target.value)}
      />
      {slider && (
        <input
          aria-label={`${label} slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => update(e.target.value)}
        />
      )}
      {!okay && (
        <p id={`${id}-error`} className="lab-error">
          Enter a valid value from {min} to {max}. The graph keeps the last
          valid value.
        </p>
      )}
    </div>
  );
}
function Graph({
  state,
  x,
  h,
  showSlope,
}: {
  state: ExplorerState;
  x: number;
  h: number;
  showSlope: boolean;
}) {
  const id = useId().replaceAll(':', '');
  const v = state.viewport,
    width = 640,
    height = 380;
  const px = (n: number) => 48 + ((n - v.xMin) / (v.xMax - v.xMin)) * 560;
  const py = (n: number) => 340 - ((n - v.yMin) / (v.yMax - v.yMin)) * 308;
  const live = useMemo(() => plot(state), [state]);
  const reference = useMemo(
    () => plot({ ...baseline(state), viewport: v }),
    [state, v],
  );
  const path = (
    segments: [{ x: number; y: number }, { x: number; y: number }][],
  ) =>
    segments
      .map(([p, q]) => `M${px(p.x)},${py(p.y)}L${px(q.x)},${py(q.y)}`)
      .join('');
  const ticks = Array.from({ length: 5 }, (_, i) => i / 4);
  const y = evaluate(state, x),
    qy = evaluate(state, x + h);
  const derivation = firstPrinciples(state, x),
    slope = h === 0 ? derivation.derivative : averageRate(state, x, x + h);
  const cuts = live.limited
    ? []
    : discontinuities(state).filter((c) => c >= v.xMin && c <= v.xMax);
  const within = (xx: number, yy: number) =>
    xx >= v.xMin && xx <= v.xMax && yy >= v.yMin && yy <= v.yMax;
  const curveLabel = `${families[state.family]} graph. ${equation(state)}. ${features(
    state,
  )
    .map((r) => `${r.label}: ${r.value}`)
    .join('. ')}. Coordinates are also in the table.`;
  const slopePath = () => {
    if (y === null || slope === null) return '';
    let left = v.xMin,
      right = v.xMax;
    if (slope !== 0) {
      const a = x + (v.yMin - y) / slope,
        b = x + (v.yMax - y) / slope;
      left = Math.max(left, Math.min(a, b));
      right = Math.min(right, Math.max(a, b));
    }
    if (left > right) return '';
    const y1 = y + slope * (left - x),
      y2 = y + slope * (right - x);
    if (!Number.isFinite(y1) || !Number.isFinite(y2)) return '';
    return `M${px(left)},${py(y1)}L${px(right)},${py(y2)}`;
  };
  return (
    <div className="lab-graph-card">
      <svg
        className="lab-graph"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>
          Function graph with selected x and moving second point
        </title>
        <desc id={`${id}-desc`}>{curveLabel}</desc>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="48" y="32" width="560" height="308" />
          </clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={t} className="lab-grid">
            <line x1={48 + t * 560} x2={48 + t * 560} y1="32" y2="340" />
            <line x1="48" x2="608" y1={32 + t * 308} y2={32 + t * 308} />
            <text x={48 + t * 560} y="361" textAnchor="middle">
              {format(v.xMin + t * (v.xMax - v.xMin))}
            </text>
            <text x="41" y={344 - t * 308} textAnchor="end">
              {format(v.yMin + t * (v.yMax - v.yMin))}
            </text>
          </g>
        ))}
        <text x="623" y="361">
          x
        </text>
        <text x="24" y="18">
          y
        </text>
        <g clipPath={`url(#${id}-clip)`}>
          {v.xMin <= 0 && v.xMax >= 0 && (
            <line className="lab-axis" x1={px(0)} x2={px(0)} y1="32" y2="340" />
          )}
          {v.yMin <= 0 && v.yMax >= 0 && (
            <line className="lab-axis" x1="48" x2="608" y1={py(0)} y2={py(0)} />
          )}
          {state.a !== 0 &&
            state.family !== 'rationalHole' &&
            cuts.map((c) => (
              <line
                key={c}
                className="lab-asymptote"
                x1={px(c)}
                x2={px(c)}
                y1="32"
                y2="340"
              />
            ))}
          {state.compare && (
            <path className="lab-baseline" d={path(reference.segments)} />
          )}
          <path
            className="lab-curve"
            data-testid="function-curve"
            d={path(live.segments)}
          />
          {showSlope && y !== null && slope !== null && (
            <path
              data-testid="slope-line"
              fill="none"
              d={slopePath()}
              className={h === 0 ? 'lab-tangent' : 'lab-secant'}
            />
          )}
          {y !== null && within(x, y) && (
            <g>
              <circle className="lab-point-p" cx={px(x)} cy={py(y)} r="5" />
              <text className="lab-point-label" x={px(x) + 9} y={py(y) - 10}>
                P
              </text>
            </g>
          )}
          {h !== 0 && qy !== null && within(x + h, qy) && (
            <g>
              <circle
                className="lab-point-q"
                cx={px(x + h)}
                cy={py(qy)}
                r="5"
              />
              <text
                className="lab-point-label"
                x={px(x + h) + 9}
                y={py(qy) + 18}
              >
                Q
              </text>
            </g>
          )}
          {state.family === 'rationalHole' && (
            <circle
              className="lab-hole"
              cx={px(state.h + 1 / state.k)}
              cy={py(2 * state.a + state.b)}
              r="5"
            />
          )}
        </g>
      </svg>
      <div className="lab-legend">
        <span>Solid: chosen function</span>
        {state.compare && <span>Dashed: parent function</span>}
        {showSlope && (
          <span>
            {h === 0 ? 'Dotted: limiting tangent' : 'Long dash: moving secant'}
          </span>
        )}
      </div>
      {live.limited && (
        <p className="lab-error">
          Too many cycles to plot reliably. Narrow the x range or reduce |k|.
          Use the table for individual values.
        </p>
      )}
      {showSlope && y !== null && !within(x, y) && (
        <p className="lab-hint">
          P is outside this viewport. Adjust the axis ranges to bring it into
          view.
        </p>
      )}
      {showSlope && h !== 0 && qy !== null && !within(x + h, qy) && (
        <p className="lab-hint">
          Q is outside this viewport. Adjust the axis ranges or bring h closer
          to zero.
        </p>
      )}
      <p className="lab-hint">
        Curves use clipped samples. Dashed vertical guides mark asymptotes; open
        circles mark holes. Undefined values never connect across a
        discontinuity.
      </p>
    </div>
  );
}
function Viewport({
  state,
  change,
  disabled,
}: {
  state: ExplorerState;
  change: (s: ExplorerState) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState(state.viewport),
    [error, setError] = useState('');
  useEffect(() => setDraft(state.viewport), [state.viewport]);
  return (
    <details className="lab-details">
      <summary>Graph window and chosen table coordinates</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const result = viewportSchema.safeParse(draft);
          if (result.success) {
            change({ ...state, viewport: result.data });
            setError('');
          } else
            setError(
              'Use bounds from -1000 to 1000, with an axis span of at least 0.1.',
            );
        }}
      >
        <div className="lab-four">
          {(['xMin', 'xMax', 'yMin', 'yMax'] as const).map((key) => (
            <NumberControl
              key={key}
              label={key}
              value={draft[key]}
              min={-1000}
              max={1000}
              disabled={disabled}
              onChange={(n) => setDraft({ ...draft, [key]: n })}
            />
          ))}
        </div>
        <button disabled={disabled}>Apply graph window</button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            change({ ...state, viewport: initialState(state.family).viewport });
            setError('');
          }}
        >
          Reset graph window
        </button>
        {error && (
          <p role="alert" className="lab-error">
            {error}
          </p>
        )}
      </form>
      <TableCoordinates state={state} change={change} disabled={disabled} />
    </details>
  );
}
function TableCoordinates({
  state,
  change,
  disabled,
}: {
  state: ExplorerState;
  change: (s: ExplorerState) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState(state.tableX.join(', ')),
    [error, setError] = useState('');
  useEffect(() => setText(state.tableX.join(', ')), [state.tableX]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parts = text.split(',');
        const result = stateSchema.safeParse({
          ...state,
          tableX: parts.map(Number),
        });
        if (parts.some((p) => p.trim() === '') || !result.success) {
          setError(
            'Enter 1 to 21 comma-separated x values from -1000 to 1000.',
          );
          return;
        }
        change(result.data);
        setError('');
      }}
    >
      <label>
        Table x values
        <input
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <button disabled={disabled}>Update table</button>
      {error && (
        <p role="alert" className="lab-error">
          {error}
        </p>
      )}
    </form>
  );
}
function ProbeControls({
  state,
  x,
  setX,
  h,
  setH,
  disabled,
}: {
  state: ExplorerState;
  x: number;
  setX: (x: number) => void;
  h: number;
  setH: (h: number) => void;
  disabled: boolean;
}) {
  const [side, setSide] = useState(1);
  const near =
    h === 0
      ? 100
      : Math.max(0, Math.min(99, 16 * (1 - Math.log10(Math.abs(h)))));
  useEffect(() => {
    if (h !== 0) setSide(Math.sign(h));
  }, [h]);
  const d = firstPrinciples(state, x),
    slope = h === 0 ? d.derivative : averageRate(state, x, x + h),
    p = evaluate(state, x),
    q = evaluate(state, x + h);
  function approach(value: number, sign = side) {
    setH(value === 100 ? 0 : sign * 10 ** (1 - value / 16));
  }
  const numeric = (n: number | null) => (n === null ? 'Undefined' : format(n));
  return (
    <div className="lab-probe">
      <p className="lab-hint">
        Choose x for P, then move h to slide Q along the curve.
      </p>
      <div className="lab-rate-controls">
        <NumberControl
          label="Selected x"
          value={x}
          min={-1000}
          max={1000}
          onChange={setX}
          disabled={disabled}
        />
        <NumberControl
          label="Step h"
          value={h}
          min={-1000}
          max={1000}
          step={0.0001}
          onChange={setH}
          disabled={disabled}
        />
        <div className="lab-approach">
          <label htmlFor="h-slider">Move h around zero</label>
          <input
            id="h-slider"
            type="range"
            min="-100"
            max="100"
            step="0.1"
            value={h === 0 ? 0 : Math.sign(h) * Math.min(100, Math.abs(h) * 10)}
            onChange={(e) => setH(Number(e.target.value) / 10)}
            disabled={disabled}
            aria-valuetext={`h equals ${format(h)}`}
          />
          <p>-10 ← h = 0 → +10. Fine control below.</p>
        </div>
        <div className="lab-approach">
          <label htmlFor="h-approach">Approach h = 0 (fine scale)</label>
          <input
            id="h-approach"
            type="range"
            min="0"
            max="100"
            step="1"
            value={near}
            onChange={(e) => approach(Number(e.target.value))}
            disabled={disabled}
            aria-valuetext={`h equals ${format(h)}; slide right toward zero`}
          />
          <label>
            Approach from
            <select
              value={side}
              disabled={disabled}
              onChange={(e) => {
                const sign = Number(e.target.value);
                setSide(sign);
                approach(near, sign);
              }}
            >
              <option value="1">Positive h (right)</option>
              <option value="-1">Negative h (left)</option>
            </select>
          </label>
          <span>Slide right to reach the limit exactly.</span>
        </div>
      </div>
      <div className="lab-readings" aria-live="polite">
        <p>
          P = ({format(x)}, {numeric(p)})
        </p>
        <p>
          {h === 0 ? 'Q approaches P' : `Q = (${format(x + h)}, ${numeric(q)})`}
        </p>
        <p data-testid="current-slope">
          {h === 0 ? 'IROC (limiting tangent)' : 'AROC (moving secant)'} ={' '}
          {numeric(slope)}
        </p>
        <p data-testid="iroc">
          Algebraic IROC at x = {format(x)}: {numeric(d.derivative)}
        </p>
      </div>
      {h === 0 && d.derivative === null && (
        <p role="alert" className="lab-error">
          {d.reason}
        </p>
      )}
      <p className="lab-hint">
        At h = 0, the difference quotient is 0/0 and is undefined. The tangent
        uses its algebraic limit. A secant with endpoints on different branches
        does not imply a tangent exists between them.
      </p>
    </div>
  );
}
function Rates({
  state,
  x,
  disabled,
}: {
  state: ExplorerState;
  x: number;
  disabled: boolean;
}) {
  const [arocStart, setArocStart] = useState(0),
    [arocEnd, setArocEnd] = useState(2);
  const steps = algebraSteps(state, x);
  const numeric = (n: number | null) => (n === null ? 'Undefined' : format(n));
  return (
    <section className="lab-rates" aria-labelledby="rates-title">
      <p className="eyebrow">FROM TWO POINTS TO ONE TANGENT</p>
      <h3 id="rates-title">Rate of change from first principles</h3>
      <details className="lab-details" open>
        <summary>Algebraic solution, step by step</summary>
        <ol className="lab-algebra">
          {steps.map((step, i) => (
            <li key={i}>
              <h4>{step.title}</h4>
              {step.note && <p className="lab-step-note">{step.note}</p>}
              {step.equations.map((tex, j) => (
                <MathFormula key={j} tex={tex} />
              ))}
            </li>
          ))}
        </ol>
        <p className="lab-hint">
          Polynomial solutions use the binomial expansion. Other families use
          the identities and fundamental limits shown above. This is a
          derivation for the selected family, rather than a general symbolic
          algebra solver.
        </p>
      </details>
      <details className="lab-details">
        <summary>Check the limit numerically from both sides</summary>
        <div className="lab-table-wrap">
          <table>
            <caption>
              Secant slopes near x = {format(x)}. Floating-point values
              approximate the algebraic limit.
            </caption>
            <thead>
              <tr>
                <th>h</th>
                <th>x+h</th>
                <th>
                  <MathFormula inline tex={String.raw`\frac{f(x+h)-f(x)}{h}`} />
                </th>
              </tr>
            </thead>
            <tbody>
              {[-1, -0.1, -0.01, -0.001, 0.001, 0.01, 0.1, 1].map((step) => (
                <tr key={step}>
                  <td>{step}</td>
                  <td>{format(x + step)}</td>
                  <td>{numeric(averageRate(state, x, x + step))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className="lab-details">
        <summary>Average rate over another interval</summary>
        <div className="lab-four">
          <NumberControl
            label="Interval start"
            value={arocStart}
            min={-1000}
            max={1000}
            disabled={disabled}
            onChange={setArocStart}
          />
          <NumberControl
            label="Interval end"
            value={arocEnd}
            min={-1000}
            max={1000}
            disabled={disabled}
            onChange={setArocEnd}
          />
        </div>
        <MathFormula
          tex={String.raw`\operatorname{AROC}=\frac{f(${numberLatex(arocEnd)})-f(${numberLatex(arocStart)})}{(${numberLatex(arocEnd)})-(${numberLatex(arocStart)})}=${averageRate(state, arocStart, arocEnd) === null ? '\\text{undefined}' : numberLatex(averageRate(state, arocStart, arocEnd)!)}`}
        />
      </details>
    </section>
  );
}
export function FunctionExplorer({
  onAddToNotebook,
  replayRequest,
}: {
  onAddToNotebook?: (capture: ExperimentCapture) => void;
  replayRequest?: { id: string; capture: ExperimentCapture } | null;
} = {}) {
  const [live, setLive] = useState<ExplorerState>(() => initialState());
  const [selected, setSelected] = useState<ExperimentCapture | null>(null);
  useEffect(() => {
    if (replayRequest) {
      setSelected(restoreCapture(replayRequest.capture));
      document
        .getElementById('function-explorer')
        ?.scrollIntoView({ block: 'start' });
    }
  }, [replayRequest]);
  const state = selected?.state ?? live,
    readonly = selected !== null;
  const x = state.probe.x,
    h = state.probe.h;
  const setX = (n: number) =>
    change({ ...live, probe: { ...live.probe, x: n } });
  const setH = (n: number) =>
    change({ ...live, probe: { ...live.probe, h: n } });
  const [prediction, setPrediction] = useState(''),
    [observation, setObservation] = useState(''),
    [calculation, setCalculation] = useState(''),
    [explanation, setExplanation] = useState('');
  const [start, setStart] = useState<{
    state: ExplorerState;
    prediction: string;
  } | null>(null);
  const [captures, setCaptures] = useState<ExperimentCapture[]>([]),
    [message, setMessage] = useState('');
  function change(next: ExplorerState) {
    const parsed = stateSchema.safeParse(next);
    if (parsed.success) setLive(parsed.data);
  }
  function save() {
    if (!start) {
      setMessage('Record a prediction before capturing the result.');
      return;
    }
    if (!observation.trim()) {
      setMessage('Add an observation before capturing.');
      return;
    }
    if (captures.length >= 20) {
      setMessage(
        'This preview holds up to 20 captures. Export your captures before starting a new session.',
      );
      return;
    }
    const capture = createCapture({
      moduleId: 'function-explorer',
      schemaVersion: 1,
      moduleVersion: '1.0.0',
      activityId: 'predict-transform-explain',
      capturedAt: new Date().toISOString(),
      initialState: start.state,
      state: live,
      prediction: start.prediction,
      observation: observation.trim(),
      calculation,
      explanation,
    });
    setCaptures([...captures, capture]);
    setStart(null);
    setObservation('');
    setMessage(
      'Experiment captured for this session. Export the JSON to keep it after leaving this page.',
    );
  }
  function download(capture: ExperimentCapture) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(capture, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fplab-experiment.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error('size');
      const capture = restoreCapture(JSON.parse(await file.text()));
      setSelected(capture);
      setMessage('Imported capture opened in read-only replay.');
    } catch {
      setMessage(
        'Cannot open this capture. Use a supported FPLab experiment JSON file under 64 KB.',
      );
    }
  }
  const update = (key: 'a' | 'k' | 'h' | 'b' | 'base', n: number) =>
    change({ ...live, [key]: n });
  return (
    <section
      id="function-explorer"
      className="function-explorer"
      aria-labelledby="explorer-title"
    >
      <div className="lab-heading">
        <div>
          <p className="eyebrow">MATH LAB · ADVANCED FUNCTIONS</p>
          <h2 id="explorer-title">Function Explorer</h2>
          <p>Predict. Change one thing. Explain what you see.</p>
        </div>
        <span className="planned-label">Local exploration</span>
      </div>
      <FunctionInput state={state} apply={change} disabled={readonly} />
      <p className="lab-hint">
        Experiment captures stay in this browser session until exported.
        Export an experiment as JSON to keep it or replay it later.
      </p>
      {readonly && (
        <div className="lab-replay">
          <p>
            Read-only replay: {selected.capturedAt}. The live experiment is
            preserved.
          </p>
          <button onClick={() => setSelected(null)}>
            Return to live explorer
          </button>
          {onAddToNotebook && (
            <button onClick={() => onAddToNotebook(selected!)}>
              Add replayed experiment to notebook
            </button>
          )}
          <button
            onClick={() => {
              setLive(stateSchema.parse(selected.state));
              setSelected(null);
              setStart(null);
              setMessage(
                'A new live exploration was started from the capture.',
              );
            }}
          >
            Use as new exploration
          </button>
        </div>
      )}
      <div className="lab-layout">
        <aside className="lab-controls" aria-label="Function parameters">
          <label>
            Function family
            <select
              value={state.family}
              disabled={readonly}
              onChange={(e) => {
                change({ ...initialState(e.target.value as Family) });
                setStart(null);
              }}
            >
              {Object.entries(families).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <NumberControl
            label="Vertical scale a"
            value={state.a}
            onChange={(n) => update('a', n)}
            slider
            disabled={readonly}
          />
          <NumberControl
            label="Horizontal factor k"
            value={state.k}
            onChange={(n) => update('k', n)}
            slider
            valid={(n) => Math.abs(n) >= 0.1}
            disabled={readonly}
          />
          <p className="lab-hint">
            k cannot be zero. Horizontal scale is 1/|k|.
          </p>
          <NumberControl
            label="Horizontal shift"
            value={state.h}
            onChange={(n) => update('h', n)}
            slider
            disabled={readonly}
          />
          <NumberControl
            label="Vertical shift"
            value={state.b}
            onChange={(n) => update('b', n)}
            slider
            disabled={readonly}
          />
          {['exponential', 'logarithm'].includes(state.family) && (
            <NumberControl
              label="Base"
              value={state.base}
              min={0.1}
              max={20}
              valid={(n) => n !== 1}
              onChange={(n) => update('base', n)}
              disabled={readonly}
            />
          )}
          {isTrig(state) && (
            <label>
              Angle unit
              <select
                value={state.angleUnit}
                disabled={readonly}
                onChange={(e) =>
                  change({
                    ...live,
                    angleUnit: e.target.value as 'radians' | 'degrees',
                    viewport: {
                      ...live.viewport,
                      xMin: e.target.value === 'degrees' ? -360 : -2 * Math.PI,
                      xMax: e.target.value === 'degrees' ? 360 : 2 * Math.PI,
                    },
                  })
                }
              >
                <option value="radians">Radians</option>
                <option value="degrees">Degrees</option>
              </select>
            </label>
          )}
          {state.family === 'polynomial' && (
            <fieldset disabled={readonly}>
              <legend>Parent coefficients: Σ cₙuⁿ</legend>
              {state.coefficients.map((c, i) => (
                <NumberControl
                  key={i}
                  label={`Coefficient x^${i}`}
                  value={c}
                  onChange={(n) => {
                    const coefficients = [...live.coefficients];
                    coefficients[i] = n;
                    change({ ...live, coefficients });
                  }}
                />
              ))}
            </fieldset>
          )}
          <label className="lab-check">
            <input
              type="checkbox"
              checked={state.compare}
              disabled={readonly}
              onChange={(e) => change({ ...live, compare: e.target.checked })}
            />
            Compare with parent function
          </label>
          <button
            disabled={readonly}
            onClick={() => {
              change(initialState(state.family));
              setStart(null);
            }}
          >
            Reset this function
          </button>
        </aside>
        <div className="lab-results">
          <div className="lab-equation" data-testid="equation">
            <MathFormula tex={functionLatex(state)} />
          </div>
          <div className="lab-investigation">
            <Graph state={state} x={x} h={h} showSlope />
            <ProbeControls
              state={state}
              x={x}
              h={h}
              setX={setX}
              setH={setH}
              disabled={readonly}
            />
          </div>
          <Viewport state={state} change={change} disabled={readonly} />
          <div className="lab-facts">
            <dl>
              {features(state).map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
            <div className="lab-table-wrap">
              <table>
                <caption>Chosen coordinates</caption>
                <thead>
                  <tr>
                    <th scope="col">x</th>
                    <th scope="col">f(x)</th>
                    {state.compare && <th scope="col">Parent f(x)</th>}
                  </tr>
                </thead>
                <tbody>
                  {state.tableX.map((tx, i) => (
                    <tr key={i}>
                      <td>{format(tx)}</td>
                      <td>
                        {evaluate(state, tx) === null
                          ? 'Undefined / not finite'
                          : format(evaluate(state, tx)!)}
                      </td>
                      {state.compare && (
                        <td>
                          {evaluate(baseline(state), tx) === null
                            ? 'Undefined / not finite'
                            : format(evaluate(baseline(state), tx)!)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Rates state={state} x={x} disabled={readonly} />
      <section className="lab-capture" aria-labelledby="capture-title">
        <h3 id="capture-title">Keep an experiment</h3>
        <p>
          Predict before changing a parameter. Record what happened, show a
          calculation, and explain the relationship.
        </p>
        {readonly ? (
          <dl>
            <dt>Prediction</dt>
            <dd>{selected.prediction}</dd>
            <dt>Observation</dt>
            <dd>{selected.observation}</dd>
            <dt>Calculation</dt>
            <dd>{selected.calculation || 'No calculation recorded.'}</dd>
            <dt>Explanation</dt>
            <dd>{selected.explanation || 'No explanation recorded.'}</dd>
          </dl>
        ) : (
          <>
            <div className="lab-writing">
              <label>
                My prediction
                <textarea
                  maxLength={2000}
                  value={prediction}
                  onChange={(e) => setPrediction(e.target.value)}
                />
              </label>
              <div>
                <button
                  disabled={!prediction.trim()}
                  onClick={() => {
                    setStart({
                      state: stateSchema.parse(live),
                      prediction: prediction.trim(),
                    });
                    setMessage(
                      'Prediction recorded with the starting function. Change a parameter, then capture your observation.',
                    );
                  }}
                >
                  Record prediction
                </button>
                {start && <p>Recorded: {start.prediction}</p>}
              </div>
              <label>
                My observation
                <textarea
                  maxLength={2000}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </label>
              <label>
                My calculation
                <textarea
                  maxLength={2000}
                  value={calculation}
                  onChange={(e) => setCalculation(e.target.value)}
                />
              </label>
              <label>
                My explanation
                <textarea
                  maxLength={2000}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </label>
            </div>
            <button onClick={save}>Capture experiment</button>
          </>
        )}
        <p aria-live="polite">{message}</p>
        <ol className="lab-captures">
          {captures.map((c, i) => (
            <li key={i}>
              <span>
                Experiment {i + 1}: {families[c.state.family]}
              </span>
              <button onClick={() => setSelected(c)}>
                Replay experiment {i + 1}
              </button>
              {onAddToNotebook && (
                <button onClick={() => onAddToNotebook(c)}>
                  Add experiment {i + 1} to notebook
                </button>
              )}
              <button onClick={() => download(c)}>
                Export experiment {i + 1}
              </button>
            </li>
          ))}
        </ol>
        <label className="lab-import">
          Replay an exported experiment
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
      </section>
    </section>
  );
}
