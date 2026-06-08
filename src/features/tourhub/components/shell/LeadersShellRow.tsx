import { memo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { INK_TINT_06, INK_TINT_07 } from '../../_shared/tokens';

interface ChipDef {
  id: string;
  label: string;
  /** Category key in LEADER_CATEGORIES selected when chip is tapped */
  categoryKey: string;
}

/**
 * Canonical Tour Hub Leaders chip set (4 chips).
 *
 * Mapping to existing LEADER_CATEGORIES (Sportradar coverage gaps mean we
 * don't yet expose true SG: Approach / SG: Off-the-Tee — closest fits used):
 *   - Earnings → earnings
 *   - Putting  → putt_avg
 *   - Approach → gir_pct (greens in regulation as proxy for approach quality)
 *   - Off-Tee  → drive_avg (driving distance as proxy for tee performance)
 *
 * If/when SG component stats land, swap categoryKey here without touching
 * LeadersTab — this row is the single source of truth for the chip taxonomy.
 */
const CHIPS: ChipDef[] = [
  { id: 'earnings', label: 'Earnings', categoryKey: 'earnings' },
  { id: 'putting',  label: 'Putting',  categoryKey: 'putt_avg' },
  { id: 'approach', label: 'Approach', categoryKey: 'gir_pct'  },
  { id: 'off-tee',  label: 'Off-Tee',  categoryKey: 'drive_avg' },
];

const DEFAULT_CATEGORY = 'earnings';

/**
 * Row 2 of the Tour Hub shell on /tourhub?tab=leaderboards.
 * Replaces the in-page underline tab strip with a 4-chip canonical set.
 */
function LeadersShellRowInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get('category') || DEFAULT_CATEGORY;

  const setCategory = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'leaderboards');
    params.set('category', key);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        aria-label="Stat category"
        className="flex justify-center gap-1.5"
        style={{ padding: '7px 16px' }}
      >
        {CHIPS.map((c) => {
          const isActive = categoryKey === c.categoryKey;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setCategory(c.categoryKey)}
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
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const LeadersShellRow = memo(LeadersShellRowInner);
export default LeadersShellRow;
