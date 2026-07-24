import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHead } from './SectionHead';
import { MomentsSection } from './MomentsSection';
import { EaglesLedger } from './EaglesLedger';
import { BirdieHaulsLedger } from './BirdieHaulsLedger';
import { FONT } from './gamingLightTokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { FeatRow, RecordsMode } from './hooks/useRegionFeats';

/**
 * FeatsSection — "Feats of the game".
 *
 * Merges the three consecutive feat sections (Moments of the game, Eagles,
 * Birdie hauls) behind one header and one segmented control. The control is
 * the same capsule pill pattern used by HardestHolesRail (Toughest |
 * Scoreable) and the toughest-courses rail: 1px hairline capsule, radius 999,
 * active #15171F on white, 10.5/600 labels.
 *
 * Selection is component-local and intentionally NOT persisted.
 */

type FeatsTier = 'moments' | 'eagles' | 'birdie_hauls';

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap: (row: FeatRow) => void;
  onLeaderTap: (uid: string) => void;
}

export function FeatsSection({ region, regionUpper, mode, onRowTap, onLeaderTap }: Props) {
  const { t } = useTranslation('courses');
  const [tier, setTier] = useState<FeatsTier>('moments');
  const [sheetOpen, setSheetOpen] = useState(false);

  const options: ReadonlyArray<{ v: FeatsTier; label: string }> = [
    { v: 'moments', label: t('discover.feats.tabs.moments', 'Moments') },
    { v: 'eagles', label: t('discover.feats.tabs.eagles', 'Eagles') },
    { v: 'birdie_hauls', label: t('discover.feats.tabs.birdieHauls', 'Birdie hauls') },
  ];

  const overline =
    mode === 'alltime'
      ? t('discover.feats.overlineAllTime', 'All-time honours')
      : t('discover.feats.overlineLatest', 'Latest honours');

  const handleTierChange = (next: FeatsTier) => {
    if (next === tier) return;
    setTier(next);
    setSheetOpen(false);
    analyticsEvents.track('discover_feats_tab', { tier: next });
  };

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHead
        overline={overline}
        title={t('discover.feats.title', 'Feats of the game')}
        meta={t('discover.feats.viewAll', 'View all')}
        onMeta={() => setSheetOpen(true)}
        paddingX={14}
        paddingBottom={10}
      />

      <div style={{ padding: '0 14px 10px' }}>
        <div
          role="tablist"
          aria-label={t('discover.feats.title', 'Feats of the game')}
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 999,
          }}
        >
          {options.map((o) => {
            const active = tier === o.v;
            return (
              <button
                key={o.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTierChange(o.v)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: active ? '#15171F' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                  border: 'none',
                  fontFamily: FONT,
                  fontSize: 10.5,
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
      </div>

      {tier === 'moments' && (
        <MomentsSection
          embedded
          region={region}
          regionUpper={regionUpper}
          mode={mode}
          onRowTap={onRowTap}
          onLeaderTap={onLeaderTap}
          sheetOpen={sheetOpen}
          onSheetOpenChange={setSheetOpen}
        />
      )}
      {tier === 'eagles' && (
        <EaglesLedger
          embedded
          region={region}
          regionUpper={regionUpper}
          mode={mode}
          onRowTap={onRowTap}
          onLeaderTap={onLeaderTap}
          sheetOpen={sheetOpen}
          onSheetOpenChange={setSheetOpen}
        />
      )}
      {tier === 'birdie_hauls' && (
        <BirdieHaulsLedger
          embedded
          region={region}
          regionUpper={regionUpper}
          mode={mode}
          onRowTap={onRowTap}
          sheetOpen={sheetOpen}
          onSheetOpenChange={setSheetOpen}
        />
      )}
    </section>
  );
}

export default FeatsSection;
