import { memo } from 'react';
import { FONT } from './gamingLightTokens';
import type { RecordsMode } from './hooks/useRegionFeats';
import { ScopeSegment } from '@/components/shared/ScopeSegment';


export const REGION_TABS: Array<{ slug: string | null; label: string }> = [
  { slug: null, label: 'Worldwide' },
  { slug: 'uk-ireland', label: 'GB&I' },
  { slug: 'usa', label: 'USA' },
  { slug: 'continental-europe', label: 'Europe' },
  { slug: 'rest-of-world', label: 'Rest of World' },
];

interface LensProps {
  region: string | null;
  onRegionChange: (slug: string | null) => void;
  scope: RecordsMode;
  onScopeChange: (m: RecordsMode) => void;
}

// THE LENS: single sticky control bar. Region chips (scrollable) + scope segment.
// One toggle governs the page; sheets receive scope via initialMode.
function AlmanacLensInner({ region, onRegionChange, scope, onScopeChange }: LensProps) {
  return (
    <section
      style={{
        fontFamily: FONT,
        position: 'sticky',
        top: 'var(--sat, 0px)',
        zIndex: 10,
        background: 'rgba(244,246,249,0.94)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(15,23,42,0.06)',
        padding: '10px 14px',
        marginTop: -1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
        className="scrollbar-hide"
      >
        {REGION_TABS.map((t) => {
          const id = t.slug ?? '__ww__';
          const current = region ?? '__ww__';
          const active = id === current;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onRegionChange(t.slug)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 999,
                background: active ? '#15171F' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#0F172A',
                border: active ? 'none' : '1px solid rgba(15,23,42,0.08)',
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <ScopeSegment<RecordsMode>
        value={scope}
        onChange={onScopeChange}
        ariaLabel="Scope"
        options={[
          { value: 'latest', label: 'Recent' },
          { value: 'alltime', label: 'All time' },
        ]}
      />
    </section>
  );
}


export const AlmanacLens = memo(AlmanacLensInner);
