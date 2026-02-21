import { triggerAdhan } from '../../lib/adhan';

interface Props {
  onClose: () => void;
}

export function AthanSection({ onClose }: Props) {
  function testAdhan() {
    triggerAdhan('fajr');
    onClose();
  }

  return (
    <div className="setting-section">
      <div className="setting-title">Athan</div>
      <button className="s-btn primary" onClick={testAdhan}>▶ Tester l'athan</button>
      <div className="location-info">
        Fichier attendu :{' '}
        <code style={{ color: 'rgba(46,204,113,0.6)' }}>adhan.mp3</code> à la racine du projet
      </div>
    </div>
  );
}
