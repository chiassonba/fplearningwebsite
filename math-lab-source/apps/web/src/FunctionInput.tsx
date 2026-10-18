import { useEffect, useState } from 'react';
import {
  functionInputText,
  parseFunctionInput,
} from '../../../packages/function-explorer/src/function-input';
import type { ExplorerState } from '../../../packages/function-explorer/src/index';
export function FunctionInput({
  state,
  apply,
  disabled,
}: {
  state: ExplorerState;
  apply: (state: ExplorerState) => void;
  disabled: boolean;
}) {
  const [source, setSource] = useState(() => functionInputText(state)),
    [error, setError] = useState('');
  const signature = JSON.stringify([
    state.family,
    state.a,
    state.k,
    state.h,
    state.b,
    state.base,
    state.coefficients,
  ]);
  useEffect(() => {
    setSource(functionInputText(state));
    setError('');
  }, [signature]);
  return (
    <form
      className="function-input"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          apply(parseFunctionInput(source, state));
          setError('');
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : 'That function could not be read.',
          );
        }
      }}
    >
      <label htmlFor="function-line">Enter a function, f(x) =</label>
      <div>
        <input
          id="function-line"
          value={source}
          maxLength={500}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          aria-describedby="function-input-help function-input-error"
          aria-invalid={!!error}
          onChange={(e) => setSource(e.target.value)}
        />
        <button disabled={disabled}>Apply function</button>
      </div>
      <p id="function-input-help" className="lab-hint">
        Try 2x^2+2x-3, (x+1)^3, 3/(x-1), or 2sin(3x)-1. Press Enter to apply.
        log(x) uses base 10; ln(x) uses base e. Trigonometric inputs follow the
        selected angle unit.
      </p>
      <p
        id="function-input-error"
        className="lab-error"
        role={error ? 'alert' : undefined}
      >
        {error}
        {error ? ' The previous valid graph is unchanged.' : ''}
      </p>
    </form>
  );
}
