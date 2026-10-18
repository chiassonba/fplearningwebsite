import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function MathFormula({
  tex,
  inline = false,
}: {
  tex: string;
  inline?: boolean;
}) {
  const rendered = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: !inline,
        output: 'htmlAndMathml',
        throwOnError: true,
        strict: 'error',
        trust: false,
        maxExpand: 1000,
        maxSize: 20,
        macros: {},
      });
    } catch {
      return null;
    }
  }, [tex, inline]);
  if (rendered === null)
    return (
      <span className="lab-error" role="alert">
        This equation could not be typeset.
      </span>
    );
  // Only generated, numeric model notation enters here. Student-authored text stays ordinary React text.
  if (inline)
    return (
      <span
        className="math-inline"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  return (
    <div
      className="math-display"
      tabIndex={0}
      role="region"
      aria-label="Typeset equation"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
