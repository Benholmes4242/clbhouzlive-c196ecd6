import { memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LEADER_CATEGORIES } from '../leaders/constants';

interface GroupDef {
  id: string;
  label: string;
  /** First category key under this group — selected when chip is tapped */
  firstKey: string;
  /** All category keys belonging to this group (used for active-state matching) */
  keys: string[];
}

const GROUPS: GroupDef[] = [
  { id: 'general',       label: 'General',       firstKey: 'world_rank', keys: ['world_rank', 'events_played', 'cuts_made', 'top_10', 'earnings', 'strokes_gained_total', 'scoring_avg'] },
  { id: 'ball_striking', label: 'Ball Striking', firstKey: 'drive_avg',  keys: ['drive_avg', 'drive_acc', 'gir_pct'] },
  { id: 'short_game',    label: 'Short Game',    firstKey: 'putt_avg',   keys: ['putt_avg', 'sand_saves_pct', 'scrambling_pct'] },
];

function activeGroupId(categoryKey: string): string {
  return GROUPS.find((g) => g.keys.includes(categoryKey))?.id ?? 'general';
}

/**
 * Row 2 of the Tour Hub shell on /tourhub?tab=leaderboards.
 * Stat group chips — replaces the in-page underline tab strip with canonical
 * chip styling. Leaf categories under the active group still render in body
 * (per-group navigation, not page-level chrome).
 *
 * Note: the canonical brief proposed Earnings/Putting/Approach/Off-Tee chip
 * names. The current data taxonomy in `LEADER_CATEGORIES` exposes three
 * groups (general / ball_striking / short_game); we honour the existing
 * groupings here. Renaming to the brief's 4-chip taxonomy requires a
 * follow-up pass on `LEADER_CATEGORIES.group`.
 */
function LeadersShellRowInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get('category') || 'world_rank';
  const activeId = activeGroupId(categoryKey);

  // Suppress unused warning while still importing to keep the dependency
  // explicit — leaf-category data lives in LEADER_CATEGORIES.
  void LEADER_CATEGORIES;

  const setGroup = (firstKey: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'leaderboards');
    params.set('category', firstKey);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="relative"
      style={{
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="Stat group"
        className="flex justify-center gap-1.5"
        style={{ padding: '8.5px 16px' }}
      >
        {GROUPS.map((g) => {
          const isActive = activeId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setGroup(g.firstKey)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {g.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const LeadersShellRow = memo(LeadersShellRowInner);
export default LeadersShellRow;
