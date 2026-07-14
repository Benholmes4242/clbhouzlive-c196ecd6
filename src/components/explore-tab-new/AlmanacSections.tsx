import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { FeatCard } from './FeatCard';
import { FeatListRow } from './FeatListRow';
import { useRegionFeats, type FeatTier } from './hooks/useRegionFeats';
import { AMBER, INK, INK_TINT_06 } from '@/features/courses/_shared/tokens';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { SPACE } from '@/lib/spacing';

const RAIL_CAP = 12;      // horizontal rails (default, compact)
const LIST_CAP = 5;       // vertical list variant (birdie hauls)

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const REGION_TABS: Array<{ slug: string | null; label: string }> = [
  { slug: null, label: 'Worldwide' },
  { slug: 'uk-ireland', label: 'GB&I' },
  { slug: 'usa', label: 'USA' },
  { slug: 'continental-europe', label: 'Europe' },
  { slug: 'rest-of-world', label: 'Rest of World' },
];

const REGION_HUMAN: Record<string, string> = {
  worldwide: 'the world',
  'uk-ireland': 'GB&I',
  usa: 'the USA',
  'continental-europe': 'Europe',
  'rest-of-world': 'the rest of the world',
};

function regionLabel(slug: string | null): string {
  return slug ? REGION_HUMAN[slug] ?? 'this region' : REGION_HUMAN.worldwide;
}

interface Props {
  region: string | null;
  onRegionChange: (slug: string | null) => void;
}

export const TIER_ICON: Record<FeatTier, string> = {
  legendary: '⛳',
  records: '🏆',
  eagles: '🦅',
  birdie_hauls: '🐦',
};

const CLAIM_LABEL: Record<FeatTier, string> = {
  legendary: 'First ace in',
  records: 'First record in',
  eagles: 'First eagle in',
  birdie_hauls: 'First haul in',
};

const FEAT_NOUN: Record<FeatTier, string> = {
  legendary: 'ace',
  records: 'record',
  eagles: 'eagle',
  birdie_hauls: 'haul',
};

export function AlmanacHead({
  title,
  icon,
  onSeeAll,
}: {
  title: string;
  icon?: string;
  onSeeAll?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `0 ${SPACE.pagePadX}px ${SPACE.sectionHeaderContent}px`,
      }}
    >
      {icon && (
        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
          {icon}
        </span>
      )}
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: 'rgba(15,23,42,0.6)',
        }}
      >
        {title}
      </span>
      <span style={{ flex: 1 }} />
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          style={{
            border: 'none',
            background: 'none',
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: AMBER,
            cursor: 'pointer',
          }}
        >
          ALL
        </button>
      )}
    </div>
  );
}

function AlmanacRegionTabsInner({ region, onRegionChange }: Props) {
  const options = REGION_TABS.map((t) => ({ id: t.slug ?? '__ww__', label: t.label }));
  const value = region ?? '__ww__';
  return (
    <section style={{ fontFamily: FONT }}>
      <div
        style={{
          padding: '0 4px',
        }}
      >
        <UnderlineTabs
          options={options}
          value={value}
          onChange={(id) => onRegionChange(id === '__ww__' ? null : id)}
          size="sm"
          align="center"
          underlineColor="#0F172A"
          ariaLabel="Region"
        />
      </div>
    </section>
  );
}

export const AlmanacRegionTabs = memo(AlmanacRegionTabsInner);

interface TierProps {
  region: string | null;
  tier: FeatTier;
  title: string;
  variant?: 'standard' | 'compact' | 'list';
  onRowTap?: (row: import('./hooks/useRegionFeats').FeatRow) => void;
}


function FeatTierRailInner({ region, tier, title, variant = 'standard', onRowTap }: TierProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useRegionFeats(region, tier);
  const rawRows = data ?? [];
  const rows = variant === 'list'
    ? [...rawRows].sort((a, b) => {
        const av = parseFloat(String(a.feat_value ?? a.value ?? '').replace(/[^\d.]/g, '')) || 0;
        const bv = parseFloat(String(b.feat_value ?? b.value ?? '').replace(/[^\d.]/g, '')) || 0;
        if (bv !== av) return bv - av;
        const ad = a.play_date ?? a.attained_at ?? '';
        const bd = b.play_date ?? b.attained_at ?? '';
        return bd.localeCompare(ad);
      })
    : rawRows;
  const cap = variant === 'list' ? LIST_CAP : RAIL_CAP;
  const displayRows = rows.slice(0, cap);
  const hasOverflow = rows.length > cap;
  const [sheetOpen, setSheetOpen] = useState(false);

  // Self-hiding: empty tier renders zero trace (no header, no gap).
  // AlmanacEmptyCard covers the all-tiers-empty case at the page level.
  if (!isLoading && rows.length === 0) return null;
  // silence unused
  void navigate;

  return (
    <section style={{ fontFamily: FONT, paddingTop: SPACE.sectionSection }}>
      <AlmanacHead
        title={title}
        icon={TIER_ICON[tier]}
        onSeeAll={hasOverflow ? () => setSheetOpen(true) : undefined}
      />


      {isLoading ? (
        <div
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ paddingBottom: SPACE.sectionSection }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: 244,
                height: 190,
                borderRadius: 16,
                background: INK_TINT_06,
              }}
            />
          ))}
        </div>
      ) : variant === 'list' ? (

        <div style={{ padding: `0 ${SPACE.pagePadX}px` }}>
          {displayRows.map((row, i) => (
            <FeatListRow
              key={`${row.score_id ?? row.course_id ?? i}-${i}`}
              row={row}
              tier={tier}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ paddingBottom: SPACE.sectionSection }}>
          {displayRows.map((row, i) => (
            <FeatCard
              key={`${row.score_id ?? row.course_id ?? i}-${i}`}
              row={row}
              tier={tier}
              size={variant === 'compact' ? 'compact' : 'default'}
            />
          ))}
        </div>
      )}


      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier={tier}
        region={region}
        rows={rows}
      />
    </section>
  );
}

export const FeatTierRail = memo(FeatTierRailInner);
