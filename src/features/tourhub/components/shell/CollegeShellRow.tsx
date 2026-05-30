import { memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SHELL_BG, SURFACE, WHITE_ALPHA_06, WHITE_ALPHA_18, WHITE_ALPHA_55, WHITE_ALPHA_65 } from '../../_shared/tokens';

type MetricTab = 'earnings' | 'wins' | 'top10s' | 'movers';
const VALID_METRICS = new Set<string>(['earnings', 'wins', 'top10s', 'movers']);

interface ChipDef {
  id: MetricTab;
  label: string;
}

const METRICS: ChipDef[] = [
  { id: 'earnings', label: 'Earnings' },
  { id: 'wins',     label: 'Wins'     },
  { id: 'top10s',   label: 'Top 10s'  },
  { id: 'movers',   label: 'Movers'   },
];

/**
 * Row 2 of the Tour Hub shell on /tourhub/college-golf.
 * Earnings / Wins / Top 10s / Movers — canonical chip styling, replaces the
 * in-page underline metric tabs. URL `?sort=` is the source of truth.
 */
function CollegeShellRowInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';

  const setMetric = (m: MetricTab) => {
    const params = new URLSearchParams(searchParams);
    if (m === 'earnings') params.delete('sort');
    else params.set('sort', m);
    setSearchParams(params, { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <div
      className="relative"
      style={{
        background: '#0A0E14',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="College Franchise metric"
        className="flex justify-center gap-1.5"
        style={{ padding: '7px 16px' }}
      >
        {METRICS.map((m) => {
          const isActive = activeMetric === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMetric(m.id)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? WHITE_ALPHA_10 : 'transparent',
                border: isActive ? `1px solid ${WHITE_ALPHA_55}` : `1.5px solid ${WHITE_ALPHA_10}`,
                color: isActive ? '#FFFFFF' : WHITE_ALPHA_55,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const CollegeShellRow = memo(CollegeShellRowInner);
export default CollegeShellRow;
