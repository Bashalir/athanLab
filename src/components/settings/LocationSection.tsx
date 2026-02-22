import { useRef } from 'react';
import type { AppAction } from '../../types';
import { httpGetJSON } from '../../lib/http';

interface Props {
  cityName: string;
  lat:      number;
  lng:      number;
  dispatch: React.Dispatch<AppAction>;
  onClose:  () => void;
}

export function LocationSection({ cityName: _cityName, lat, lng, dispatch, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function searchCity() {
    const q = inputRef.current?.value.trim();
    if (!q) return;
    try {
      const d = await httpGetJSON<Array<{ lat: string; lon: string; display_name: string }>>(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
      );
      if (!d.length) { alert('Ville non trouvée'); return; }
      dispatch({
        type:     'SET_LOCATION',
        lat:      parseFloat(d[0].lat),
        lng:      parseFloat(d[0].lon),
        cityName: d[0].display_name.split(',')[0],
      });
      onClose();
    } catch { alert('Erreur de recherche'); }
  }

  async function useGeoloc() {
    if (!navigator.geolocation) { alert('Géolocalisation non supportée'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      let cityName = 'Ma position';
      try {
        const d = await httpGetJSON<{ address?: { city?: string; town?: string; village?: string } }>(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        cityName = d.address?.city || d.address?.town || d.address?.village || 'Ma position';
      } catch { /* keep default */ }
      dispatch({ type: 'SET_LOCATION', lat, lng, cityName });
      onClose();
    }, () => alert("Impossible d'obtenir la position"));
  }

  return (
    <div className="setting-section">
      <div className="setting-title">Localisation</div>
      <div className="setting-row">
        <input
          ref={inputRef}
          type="text"
          className="settings-input"
          placeholder="Paris, Lyon, Alger..."
          onKeyDown={e => e.key === 'Enter' && searchCity()}
        />
        <div className="settings-btn-row">
          <button className="s-btn primary" onClick={searchCity}>Rechercher</button>
          <button className="s-btn" onClick={useGeoloc}>📍 GPS</button>
        </div>
        <div className="location-info">
          {lat.toFixed(4)}°N &nbsp; {lng.toFixed(4)}°E
        </div>
      </div>
    </div>
  );
}
