import type { CalculationMethod, AppAction } from '../../types';

const METHODS: Array<{ value: CalculationMethod; label: string }> = [
  { value: 'MWL',     label: 'Muslim World League' },
  { value: 'ISNA',    label: 'ISNA — Amérique du Nord' },
  { value: 'Egypt',   label: 'Égypte' },
  { value: 'Makkah',  label: 'Oum al-Qura — Makkah' },
  { value: 'Karachi', label: 'Université de Karachi' },
  { value: 'Tehran',  label: 'Téhéran' },
  { value: 'UOIF',    label: 'UOIF — France' },
];

interface Props {
  method:   CalculationMethod;
  dispatch: React.Dispatch<AppAction>;
}

export function MethodSection({ method, dispatch }: Props) {
  return (
    <div className="setting-section">
      <div className="setting-title">Méthode de calcul des heures</div>
      <select
        className="method-select"
        value={method}
        onChange={e => dispatch({ type: 'SET_METHOD', method: e.target.value as CalculationMethod })}
      >
        {METHODS.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
