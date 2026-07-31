import type { Scope } from '../hooks/useGlobalSearchV2';

const INK = '#0F172A';
const INK_SOFT = '#475569';
const BORDER = 'rgba(15,23,42,0.08)';

const CHIPS: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'courses', label: 'Courses' },
  { key: 'players', label: 'Players' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'videos', label: 'Videos' },
  { key: 'posts', label: 'Posts' },
];

interface Props {
  scope: Scope;
  onChange: (s: Scope) => void;
}

export function ScopeChips({ scope, onChange }: Props) {
  return (
    <div
      className="w-full md:max-w-[560px] flex scrollbar-hide"
      style={{
        gap: 8,
        padding: '10px 16px 6px',
        overflowX: 'auto',
      }}
    >
      {CHIPS.map((c) => {
        const active = scope === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            style={{
              flexShrink: 0,
              padding: '9px 16px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: active ? 700 : 600,
              border: `1px solid ${active ? INK : BORDER}`,
              background: active ? INK : '#fff',
              color: active ? '#fff' : INK_SOFT,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
