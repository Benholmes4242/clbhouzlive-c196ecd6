import { useMemo, useState } from 'react';

import { AcesAlbatrossesPodium } from './AcesAlbatrossesPodium';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { SectionHead } from './SectionHead';
import { EmptyScopeCard } from './EmptyScopeCard';
import { regionScopePhrase } from './regionScope';
import { useRegionFeats, type FeatRow, type RecordsMode } from './hooks/useRegionFeats';

/**
 * MomentsSection — "Moments of the game" (aces + albatrosses).
 *
 * Extracted verbatim from the inline `LegendarySection` that used to live in
 * ExploreTabContent.tsx. Adds `embedded` (header owned by the parent
 * FeatsSection) and a controlled-sheet contract so the merged feats section
 * can drive "View all" for the active tier.
 */

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap: (row: FeatRow) => void;
  onLeaderTap: (uid: string) => void;
  /** Parent owns the SectionHead + section spacing. */
  embedded?: boolean;
  /** Controlled sheet (used when embedded). */
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

export function MomentsSection({
  region,
  regionUpper,
  mode,
  onRowTap,
  onLeaderTap,
  embedded = false,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: Props) {
  const { data } = useRegionFeats(region, 'legendary');
  const rows = useMemo(() => data ?? [], [data]);
  const [localSheetOpen, setLocalSheetOpen] = useState(false);
  const [sheetMetric, setSheetMetric] = useState<'aces' | 'albatrosses'>('aces');

  const controlled = typeof onSheetOpenChange === 'function';
  const sheetOpen = controlled ? !!sheetOpenProp : localSheetOpen;
  const setSheetOpen = (open: boolean) => {
    if (controlled) onSheetOpenChange!(open);
    else setLocalSheetOpen(open);
  };

  const overline = mode === 'alltime' ? 'All-time honours' : 'Latest honours';

  // Suppress region-only used prop lint
  void regionUpper;

  const sectionStyle = { marginTop: embedded ? 0 : 32 } as const;

  // Scoped-empty: render the unconquered empty-state.
  if ((data ?? []).length > 0 && rows.length === 0 && region != null) {
    return (
      <section style={sectionStyle}>
        {!embedded && (
          <SectionHead overline={overline} title="Moments of the game" paddingX={14} />
        )}
        <EmptyScopeCard
          title={`No moments ${regionScopePhrase(region)} yet.`}
          subline={'This region is unconquered \u2014 be the first.'}
        />
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      {!embedded && (
        <SectionHead
          overline={overline}
          title="Moments of the game"
          meta="View all"
          onMeta={() => setSheetOpen(true)}
          paddingX={14}
        />
      )}

      {mode === 'alltime' && (
        <div
          role="tablist"
          aria-label="Metric"
          style={{
            margin: '0 14px 8px',
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 999,
          }}
        >
          {([
            { v: 'aces', label: 'Aces' },
            { v: 'albatrosses', label: 'Albatrosses' },
          ] as const).map((o) => {
            const active = sheetMetric === o.v;
            return (
              <button
                key={o.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSheetMetric(o.v)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: active ? '#15171F' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                  border: 'none',
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      <AcesAlbatrossesPodium
        region={region}
        mode={mode}
        metric={sheetMetric}
        onRowTap={onLeaderTap}
        onLatestRowTap={onRowTap}
      />
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="legendary"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode={mode}
        initialMetric={sheetMetric}
      />
    </section>
  );
}

export default MomentsSection;
