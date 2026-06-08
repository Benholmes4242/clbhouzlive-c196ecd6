import { memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { INK_TINT_06, INK_TINT_07 } from '../../_shared/tokens';

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
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.08)',
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
                background: isActive ? INK_TINT_06 : 'transparent',
                border: `1px solid ${isActive ? 'rgba(15,23,42,0.20)' : INK_TINT_07}`,
                color: isActive ? '#0A0E14' : '#64748B',
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
