import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [hidden, setHidden]   = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHidden(true), 800);
    const t2 = setTimeout(() => setRemoved(true), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (removed) return null;

  return (
    <div className={`loading-screen${hidden ? ' hide' : ''}`}>
      <div className="load-text">مواقيت الصلاة</div>
      <div className="load-sub">Prayer Times</div>
      <div className="loader-ring" />
    </div>
  );
}
