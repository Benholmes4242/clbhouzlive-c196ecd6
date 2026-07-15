import { useEffect, useMemo, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { REGION_TABS } from './AlmanacSections';
import {
  useRegionFeats,
  rowToPar,
  type FeatRow,
  type FeatTier,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FeatListRow } from './FeatListRow';
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
  initialMode?: RecordsMode;
}

// Toggle exposed on tiers that have both RECENT and ALL TIME cache keys.
// Eagles are binary (no all-time ranking) - single-mode.
function tierHasToggle(tier: FeatTier): boolean {
  return tier !== 'eagles';
}

export function TierSeeAllSheet({ open, onClose, tier, region, rows, onRowTap, initialMode = 'latest' }: Props) {
  const [visible, setVisible] = useState(PAGE);
  const [mode, setMode] = useState<RecordsMode>(initialMode);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const hasToggle = tierHasToggle(tier);
  const isEagles = tier === 'eagles';

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
    if (!open || false) return;
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
  }, [open, displayRows.length, false]);

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
  const total = false ? 0 : displayRows.length;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="tier-see-all-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
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
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {regionLabel(region)} {'\u00B7'} WHS
            {'\u00B7'} {total} {total === 1 ? 'ENTRY' : 'ENTRIES'}
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
          background: SLATE_50,
          padding: false ? '16px 0' : '12px 0',
        }}
      >
        {visibleRows.length === 0 ? (
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
        ) : (
          <div style={{ padding: '0 16px' }}>
            {visibleRows.map((row, i) => (
              <FeatListRow
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                row={row}
                tier={tier}
                index={i}
                onTap={() => handleRowTap(row)}
              />
            ))}
          </div>
        )}

        {!false && visible < displayRows.length && (
          <div ref={sentinelRef} style={{ height: 40 }} />
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default TierSeeAllSheet;
