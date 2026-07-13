import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { FeatCard } from './FeatCard';
import { useRegionFeats, type FeatTier } from './hooks/useRegionFeats';
import { AMBER, INK, INK_TINT_06 } from '@/features/courses/_shared/tokens';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';

const RAIL_CAP = 12;

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
        padding: '0 16px 8px',
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
          position: 'sticky',
          top: 'var(--chrome-total-h, 0px)',
          zIndex: 5,
          background: '#F8FAFC',
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
}


function FeatTierRailInner({ region, tier, title }: TierProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useRegionFeats(region, tier);
  const rows = data ?? [];
  const displayRows = rows.slice(0, RAIL_CAP);
  const hasOverflow = rows.length > RAIL_CAP;
  const [sheetOpen, setSheetOpen] = useState(false);
  const goToClaim = () => navigate('/handicap');

  return (
    <section style={{ fontFamily: FONT, paddingTop: 24 }}>
      <AlmanacHead
        title={title}
        icon={TIER_ICON[tier]}
        onSeeAll={hasOverflow ? () => setSheetOpen(true) : undefined}
      />

      {isLoading ? (
        <div
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ paddingTop: 4, marginTop: -4, paddingBottom: 16, marginBottom: -16 }}>
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
      ) : rows.length === 0 ? (
        <div style={{ padding: '0 16px' }}>
          <button
            type="button"
            onClick={goToClaim}
            style={{
              width: 250,
              borderRadius: 14,
              padding: 12,
              border: '1.5px dashed rgba(15,23,42,0.18)',
              background: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: FONT,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '34%',
                  border: '1.5px dashed rgba(15,23,42,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  opacity: 0.6,
                  flexShrink: 0,
                }}
              >
                {TIER_ICON[tier]}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'rgba(15,23,42,0.45)',
                  }}
                >
                  Unclaimed
                </div>
                <div style={{ fontSize: 11, color: 'rgba(15,23,42,0.35)' }}>
                  {CLAIM_LABEL[tier]} {regionLabel(region)}
                </div>
              </div>
            </div>
            <div
              style={{
                paddingTop: 8,
                borderTop: '1px dashed rgba(15,23,42,0.12)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: AMBER,
                  lineHeight: 1.4,
                }}
              >
                Claim it with an official WHS round — first verified {FEAT_NOUN[tier]} takes the
                plinth.
              </span>
              <ChevronRight
                size={13}
                color="rgba(15,23,42,0.3)"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
            </div>
          </button>
        </div>
      ) : (
        <div
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ paddingTop: 4, marginTop: -4, paddingBottom: 16, marginBottom: -16 }}>
          {displayRows.map((row, i) => (
            <FeatCard key={`${row.score_id ?? row.course_id ?? i}-${i}`} row={row} tier={tier} />
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
