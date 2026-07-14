import { useEffect, useMemo, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { REGION_TABS } from './AlmanacSections';
import {
  useRegionFeats,
  type FeatRow,
  type FeatTier,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FeatCard } from './FeatCard';
import { FeatListRow } from './FeatListRow';
import { CrownCard } from './CourseCrownsRail';
import { LegendaryLeadersBoards } from './LegendaryLeadersBoards';
import { useScorecardOpener } from './useScorecardOpener';

const PAGE = 20;

const TIER_TITLE: Record<FeatTier, string> = {
  legendary: 'Aces & Albatrosses',
  records: 'Course records',
  eagles: 'Eagles',
  birdie_hauls: 'Birdie hauls',
};

const TIER_SHORT: Record<FeatTier, string> = {
  legendary: 'LEGENDARY',
  records: 'COURSE RECORDS',
  eagles: 'EAGLES',
  birdie_hauls: 'BIRDIE HAULS',
};

function regionLabel(slug: string | null): string {
  return REGION_TABS.find((t) => t.slug === slug)?.label ?? 'Worldwide';
}

interface Props {
  open: boolean;
  onClose: () => void;
  tier: FeatTier;
  region: string | null;
  /** Fallback rows used while the sheet's own fetch is loading. */
  rows: FeatRow[];
  onRowTap?: (row: FeatRow) => void;
}

// Toggle exposed on tiers that have both RECENT and ALL TIME cache keys.
// Eagles are binary (no all-time ranking) - single-mode.
function tierHasToggle(tier: FeatTier): boolean {
  return tier !== 'eagles';
}

export function TierSeeAllSheet({ open, onClose, tier, region, rows, onRowTap }: Props) {
  const [visible, setVisible] = useState(PAGE);
  const [mode, setMode] = useState<RecordsMode>('latest');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const hasToggle = tierHasToggle(tier);
  const isLegendary = tier === 'legendary';
  const isRecords = tier === 'records';
  const isEagles = tier === 'eagles';
  const isBirdieHauls = tier === 'birdie_hauls';
  const showBoards = isLegendary && mode === 'alltime';

  // Fetch the mode-appropriate cache. Records / birdie_hauls / legendary use
  // useRegionFeats with the mode; eagles is latest-only.
  const fetchTier: FeatTier = tier;
  const fetchMode: RecordsMode = isEagles ? 'latest' : mode;
  const { data: fetched } = useRegionFeats(region, fetchTier, fetchMode);

  const displayRows: FeatRow[] = useMemo(() => {
    if (fetched && fetched.length > 0) return fetched;
    // Fallback to the caller-provided rows only while the mode-fetch is empty
    // (typical during the first paint of the recent tab).
    if (mode === 'latest') return rows;
    return [];
  }, [fetched, mode, rows]);

  useEffect(() => {
    if (!open) return;
    setVisible(PAGE);
    setMode('latest');
  }, [open]);

  useEffect(() => {
    setVisible(PAGE);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [mode]);

  useEffect(() => {
    if (!open || showBoards) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + PAGE, displayRows.length));
        }
      },
      { root: scrollerRef.current, rootMargin: '200px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [open, displayRows.length, showBoards]);

  // Own scorecard opener so ALL TIME rows (not present in the caller's list)
  // still open cleanly. Fall back to caller's onRowTap if provided.
  const opener = useScorecardOpener();
  const handleRowTap = (row: FeatRow) => {
    if (onRowTap) {
      onClose();
      setTimeout(() => onRowTap(row), 60);
      return;
    }
    if (row.score_id) opener.openByScore(row.score_id, null, row.user_id);
    else if (row.user_id) opener.openProfile(row.user_id);
  };

  const visibleRows = displayRows.slice(0, visible);
  const total = showBoards ? 0 : displayRows.length;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tier-see-all-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '90vh',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px 12px',
          borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
          background: SLATE_50,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 4,
            }}
          >
            {TIER_SHORT[tier]}
          </div>
          <div
            id="tier-see-all-title"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {TIER_TITLE[tier]}
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: INK_MUTE,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: 3,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {regionLabel(region)} {'\u00B7'} WHS
            {showBoards
              ? ` \u00B7 LEADERBOARDS`
              : ` \u00B7 ${total} ${total === 1 ? 'ENTRY' : 'ENTRIES'}`}
          </div>
        </div>

        {hasToggle && (
          <div style={{ marginTop: 12, display: 'inline-flex', flexShrink: 0, gap: 6 }}>
            {([
              { v: 'latest', label: 'RECENT' },
              { v: 'alltime', label: 'ALL TIME' },
            ] as const).map((o) => {
              const active = mode === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setMode(o.v)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 999,
                    background: active ? '#15171F' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(15,23,42,0.65)',
                    border: 'none',
                    fontFamily: FONT,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      <div
        ref={scrollerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SURFACE,
          padding: showBoards ? '16px 0' : '12px 0',
        }}
      >
        {showBoards ? (
          <LegendaryLeadersBoards region={region} />
        ) : visibleRows.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              color: INK_MUTE,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            None yet.
          </div>
        ) : isRecords ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: 10,
              padding: '0 12px',
            }}
          >
            {visibleRows.map((row, i) => (
              <div
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                style={{ display: 'flex' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CrownCard
                    row={row}
                    opener={{
                      target: null,
                      openByScore: (sid, cid, uid) => handleRowTap({ ...row, score_id: sid ?? row.score_id, user_id: uid ?? row.user_id }),
                      openProfile: (uid) => handleRowTap({ ...row, user_id: uid }),
                      close: () => {},
                    } as any}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : isEagles ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
              padding: '0 12px',
            }}
          >
            {visibleRows.map((row, i) => (
              <div
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                style={{ display: 'flex' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FeatCard
                    row={row}
                    tier="eagles"
                    onTap={() => handleRowTap(row)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // birdie_hauls + legendary RECENT: reuse FeatListRow
          <div style={{ padding: '0 16px' }}>
            {visibleRows.map((row, i) => (
              <FeatListRow
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                row={row}
                tier={isBirdieHauls ? 'birdie_hauls' : 'legendary'}
                index={i}
                onTap={() => handleRowTap(row)}
              />
            ))}
          </div>
        )}

        {!showBoards && visible < displayRows.length && (
          <div ref={sentinelRef} style={{ height: 40 }} />
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default TierSeeAllSheet;
