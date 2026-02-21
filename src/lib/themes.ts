export type Theme = 'night' | 'gold' | 'dawn' | 'emerald' | 'mono';

export const THEMES: { id: Theme; label: string; accent: string; desc: string }[] = [
  { id: 'night',   label: 'Night',   accent: '#2ecc71', desc: 'Navy & Vert'    },
  { id: 'gold',    label: 'Dhahab',  accent: '#cba455', desc: 'Or sur Noir'    },
  { id: 'dawn',    label: 'Fajr',    accent: '#ff9f43', desc: 'Aube Ambre'     },
  { id: 'emerald', label: 'Zamrud',  accent: '#00e676', desc: 'Émeraude'       },
  { id: 'mono',    label: 'Raqq',    accent: '#e8e8e8', desc: 'Monochrome'     },
];

const VALID_THEMES = new Set<string>(THEMES.map(t => t.id));

export function resolveTheme(raw: string | null): Theme {
  if (raw && VALID_THEMES.has(raw)) return raw as Theme;
  return 'night';
}
