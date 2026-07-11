import { memo } from 'react';
import { FeatCard } from './FeatCard';
import { useRegionFeats, type FeatTier } from './hooks/useRegionFeats';
import { AMBER, INK, INK_MUTE, HAIRLINE_INK_8, INK_TINT_06 } from '@/features/courses/_shared/tokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const REGION_TABS: Array<{ slug: string | null; label: string }> = [
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

function AlmanacRegionTabsInner({ region, onRegionChange }: Props) {
  return (
    <section style={{ fontFamily: FONT }}>
      <SectionHeader
        role="section"
        kicker="THE REGISTER"
        title="Global feats"
        sub="What's been happening on the fairways"
        paddingX={16}
        paddingTop={12}
      />
      <div
        className="flex gap-4 px-4 overflow-x-auto scrollbar-hide"
        style={{
          paddingBottom: 0,
          position: 'sticky',
          top: 'var(--chrome-total-h, 0px)',
          zIndex: 5,
          background: '#F8FAFC',
        }}
      >
        {REGION_TABS.map((t) => {
          const active = t.slug === region;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => onRegionChange(t.slug)}
              style={{
                position: 'relative',
                padding: '10px 2px 12px',
                background: 'transparent',
                border: 'none',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                color: active ? INK : INK_FAINT,
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          );
        })}
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

const TIER_EMPTY_LABEL: Record<FeatTier, string> = {
  legendary: 'legendary feats',
  eagles: 'eagles',
  birdie_hauls: 'birdie hauls',
  records: 'course records',
};

function FeatTierRailInner({ region, tier, title }: TierProps) {
  const { data, isLoading } = useRegionFeats(region, tier);
  const rows = data ?? [];

  return (
    <section style={{ fontFamily: FONT, paddingTop: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px 8px',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background:
              tier === 'legendary' ? '#FBBC2E'
              : tier === 'records' ? '#3B82F6'
              : tier === 'eagles' ? '#10B981'
              : '#F7931E',
          }}
        />
        <h3
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.01em',
            flex: 1,
          }}
        >
          {title}
        </h3>
        {rows.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: INK_MUTE }}>
            {rows.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
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
        <div style={{ padding: '0 16px 4px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 16,
              padding: '16px 16px',
              fontSize: 13.5,
              color: INK_MUTE,
              lineHeight: 1.45,
              fontWeight: 600,
            }}
          >
            No {TIER_EMPTY_LABEL[tier]} in {regionLabel(region)} yet —{' '}
            <span style={{ color: AMBER, fontWeight: 800 }}>
              be the first. Log a round and you'll headline this register.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
          {rows.map((row, i) => (
            <FeatCard key={`${row.score_id ?? row.course_id ?? i}-${i}`} row={row} tier={tier} />
          ))}
        </div>
      )}
    </section>
  );
}

export const FeatTierRail = memo(FeatTierRailInner);
