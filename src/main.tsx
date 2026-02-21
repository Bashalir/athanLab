import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

const supportsCssVars = (() => {
  const css = window.CSS;
  return !!(css && typeof css.supports === 'function' && css.supports('--tmp-var', '0'));
})();

if (!supportsCssVars) {
  document.documentElement.classList.add('no-css-vars');
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
