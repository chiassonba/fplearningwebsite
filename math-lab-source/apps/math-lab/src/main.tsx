import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FunctionExplorer } from '../../web/src/FunctionExplorer';
import '../../web/src/styles.css';
import './public.css';

function MathLab() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );
  function select(value: 'light' | 'dark') {
    document.documentElement.dataset.theme = value;
    setTheme(value);
    try {
      localStorage.setItem('fplab.theme', value);
    } catch {
      /* Appearance remains available without saved preferences. */
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="wordmark" href="./" aria-label="FPLab Math Lab home">
          <img
            className="brand-mark"
            src={`./brand/FPL-stamp-${theme === 'dark' ? 'white' : 'navy'}-gold-transparent-20261013.png`}
            width="54"
            height="54"
            alt=""
          />
          <span className="brand-lockup">
            <span>
              FPL<span className="wordmark-end">ab</span>
            </span>
            <span className="company-caption">First Principles Learning</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#function-explorer">Math Lab</a>
          <a href="https://fplearning.ca/">FP Learning</a>
        </nav>
        <div className="theme-selector" role="group" aria-label="Colour theme">
          {(['light', 'dark'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={theme === value}
              onClick={() => select(value)}
            >
              {value === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="public-intro">
          <p className="eyebrow">EXPLORE · PREDICT · EXPLAIN</p>
          <h1>
            A little change.
            <br />
            <span>A deeper understanding.</span>
          </h1>
          <p>
            Type a function. Choose a point. Move a second point along the
            curve, and watch a secant approach a tangent. Follow the algebra,
            one step at a time.
          </p>
          <p className="public-local-note">
            Functions and experiment notes are calculated and kept in this
            browser. Export experiments as JSON to keep them or replay them
            later.
          </p>
        </section>
        <FunctionExplorer />
      </main>
      <footer>
        <div>
          <span className="footer-name">First Principles Learning</span>
          <p>Building Understanding. Developing Independence.</p>
        </div>
        <a href="https://fplearning.ca/">fplearning.ca</a>
      </footer>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MathLab />
  </StrictMode>,
);
