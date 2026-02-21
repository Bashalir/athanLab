import { THEMES } from '../../lib/themes';
import type { Theme } from '../../lib/themes';
import type { AppAction } from '../../types';

interface Props {
  theme:    Theme;
  dispatch: React.Dispatch<AppAction>;
}

export function ThemeSection({ theme, dispatch }: Props) {
  return (
    <div className="setting-section">
      <div className="setting-title">Thème</div>
      <div className="theme-grid">
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`theme-btn${theme === t.id ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SET_THEME', theme: t.id })}
          >
            <div
              className="theme-swatch"
              style={{ background: t.accent }}
            />
            <div className="theme-label">{t.label}</div>
            <div className="theme-desc">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
