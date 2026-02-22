import { useMemo, useState } from 'react';
import { clearHealthLog, readHealthLog } from '../../lib/healthLog';

interface Props {
  buildVersion: string;
}

function getLogText(buildVersion: string): string {
  const lines: string[] = [];
  lines.push(`build: ${buildVersion}`);
  lines.push(`now: ${new Date().toISOString()}`);
  lines.push(`online: ${navigator.onLine ? 'yes' : 'no'}`);
  lines.push(`userAgent: ${navigator.userAgent}`);
  lines.push('');
  lines.push('health log:');
  const appLines = readHealthLog();
  if (appLines.length === 0) {
    lines.push('(empty)');
  } else {
    for (let i = 0; i < appLines.length; i += 1) {
      lines.push(appLines[i]);
    }
  }
  return lines.join('\n');
}

export function LogsSection({ buildVersion }: Props) {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const text = useMemo(() => getLogText(buildVersion), [buildVersion, nonce]);

  const copyLogs = () => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
    const area = document.getElementById('logs-modal-text') as HTMLTextAreaElement | null;
    if (!area) return;
    area.focus();
    area.select();
    try {
      document.execCommand('copy');
    } catch {
      // Ignore copy failures on old iOS.
    }
  };

  const clearLogs = () => {
    clearHealthLog();
    setNonce((v) => v + 1);
  };

  return (
    <div className="setting-section">
      <div className="setting-title">Diagnostic</div>
      <div className="settings-btn-row">
        <button className="s-btn" onClick={() => { setNonce((v) => v + 1); setOpen(true); }}>
          Ouvrir les logs
        </button>
        <button className="s-btn" onClick={clearLogs}>
          Effacer logs
        </button>
      </div>

      {open && (
        <div className="logs-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="logs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logs-modal-header">
              <span>Logs App</span>
              <button className="logs-modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <textarea
              id="logs-modal-text"
              className="logs-modal-text"
              value={text}
              readOnly
              rows={14}
            />
            <div className="logs-modal-actions">
              <button className="s-btn" onClick={() => setNonce((v) => v + 1)}>Rafraichir</button>
              <button className="s-btn primary" onClick={copyLogs}>Copier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

