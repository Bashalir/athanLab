import type { AppAction } from '../../types';

interface Props {
  debug:    boolean;
  dispatch: React.Dispatch<AppAction>;
}

export function DebugSection({ debug, dispatch }: Props) {
  return (
    <div className="setting-section">
      <div className="setting-title">Mode débogage</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label className="debug-toggle-label">
          <input
            type="checkbox"
            checked={debug}
            onChange={e => dispatch({ type: 'SET_DEBUG', debug: e.target.checked })}
          />
          <span className="debug-toggle-track" />
        </label>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
          {debug
            ? 'Actif — double-clic sur une prière pour simuler l\u2019heure'
            : 'Désactivé'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button
          className="s-btn"
          style={{ flex: 1 }}
          onClick={() => dispatch({ type: 'SET_FAKE_MINUTES', fakeMinutes: null })}
        >
          ↺ Heure réelle
        </button>
      </div>
    </div>
  );
}
