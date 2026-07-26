import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  AMBER,
  FONT,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { ScopeSegment } from '@/components/shared/ScopeSegment';

import { formatHcp } from '@/lib/formatHcp';
import { REGION_TABS } from './AlmanacSections';
import {
  useRegionFeats,
  useRegionLegendaryLeaders,
  useRegionEagleLeaders,
  rowToPar,
  sortRecordsAllTime,
  sortBirdieHauls,
  type FeatRow,
  type FeatTier,
  type LegendaryLeaderRow,
  type EagleLeaderRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { FeatListRow } from './FeatListRow';
import { StatRow } from './StatRow';
import { LedgerSubline } from './PinIcon';
import { useScorecardOpener } from './useScorecardOpener';
import { GolferSearchField, normalizeName } from './GolferSearchField';




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
  initialMetric?: 'aces' | 'albatrosses';
}

// All tiers are dual-mode (RECENT / ALL TIME) as of the eagles all-time upgrade.

export function TierSeeAllSheet({ open, onClose, tier, region, rows, onRowTap, initialMode = 'latest', initialMetric = 'aces' }: Props) {
  const [visible, setVisible] = useState(PAGE);
  const [mode, setMode] = useState<RecordsMode>(initialMode);
  const [metric, setMetric] = useState<'aces' | 'albatrosses'>(initialMetric);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const hasToggle = true;
  const isEagles = tier === 'eagles';
  const isLegendaryLeaders = tier === 'legendary' && mode === 'alltime';
  const isEagleLeaders = tier === 'eagles' && mode === 'alltime';
  const isLeaderView = isLegendaryLeaders || isEagleLeaders;

  // Fetch the mode-appropriate cache. Records / birdie_hauls use useRegionFeats
  // with mode. Eagles and legendary keep their feats fetch pinned to 'latest'
  // so RECENT stays warm; ALL TIME sources the dedicated leaders payload.
  const fetchTier: FeatTier = tier;
  const fetchMode: RecordsMode = isEagles || tier === 'legendary' ? 'latest' : mode;
  const { data: fetched } = useRegionFeats(region, fetchTier, fetchMode);
  const { data: leadersData } = useRegionLegendaryLeaders(region);
  const { data: eagleLeadersData } = useRegionEagleLeaders(region);

  const displayRows: FeatRow[] = useMemo(() => {
    if (isLeaderView) return [];
    const base =
      fetched && fetched.length > 0
        ? fetched
        : mode === initialMode
          ? rows
          : [];
    if (tier === 'records' && mode === 'alltime') {
      return sortRecordsAllTime(base);
    }
    if (tier === 'birdie_hauls') {
      return sortBirdieHauls(base, mode);
    }
    return base;
  }, [fetched, mode, rows, initialMode, tier, isLeaderView]);

  const legendaryLeaderRows: LegendaryLeaderRow[] = useMemo(() => {
    if (!isLegendaryLeaders) return [];
    return (leadersData ?? [])
      .filter((r) => (r[metric] ?? 0) > 0)
      .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0));
  }, [isLegendaryLeaders, leadersData, metric]);

  const eagleLeaderRows: EagleLeaderRow[] = useMemo(() => {
    if (!isEagleLeaders) return [];
    return (eagleLeadersData ?? [])
      .filter((r) => (r.eagles ?? 0) > 0)
      .sort((a, b) => (b.eagles ?? 0) - (a.eagles ?? 0));
  }, [isEagleLeaders, eagleLeadersData]);

  const legendaryMax = legendaryLeaderRows[0]?.[metric] ?? 1;
  const eagleMax = eagleLeaderRows[0]?.eagles ?? 1;

  const bestToPar: number | null = useMemo(() => {
    if (tier !== 'records') return null;
    let best: number | null = null;
    for (const r of displayRows) {
      const d = rowToPar(r);
      if (d == null) continue;
      if (best == null || d < best) best = d;
    }
    return best;
  }, [tier, displayRows]);

  const birdieMaxCount: number | null = useMemo(() => {
    if (tier !== 'birdie_hauls') return null;
    let max = 0;
    for (const r of displayRows) {
      const n = parseFloat(String(r.feat_value ?? r.value ?? '').replace(/[^\d.]/g, '')) || 0;
      if (n > max) max = n;
    }
    return max > 0 ? max : null;
  }, [tier, displayRows]);

  useEffect(() => {
    if (!open) return;
    setVisible(PAGE);
    setMode(initialMode);
    setMetric(initialMetric);
  }, [open, initialMode, initialMetric]);

  useEffect(() => {
    setVisible(PAGE);
    if (mode === 'alltime') setMetric(initialMetric);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [mode, initialMetric]);

  useEffect(() => {
    if (!open || isLeaderView) return;
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
  }, [open, displayRows.length, isLeaderView]);

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
  const total = isLegendaryLeaders
    ? legendaryLeaderRows.length
    : isEagleLeaders
      ? eagleLeaderRows.length
      : displayRows.length;
  



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
          background: SLATE_50,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
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
              fontSize: 20,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {TIER_TITLE[tier]}
          </div>
        </div>

        {hasToggle && (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <ScopeSegment
              value={mode}
              onChange={(v) => setMode(v)}
              ariaLabel="Scope"
              options={[
                { value: 'latest', label: 'Recent' },
                { value: 'alltime', label: 'All time' },
              ]}
            />

            {isLegendaryLeaders && (
              <div
                role="tablist"
                aria-label="Metric"
                style={{
                  flexShrink: 0,
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
                  const active = metric === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMetric(o.v)}
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
            )}
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
          padding: '12px 0',
        }}
      >
        {isLegendaryLeaders ? (
          legendaryLeaderRows.length === 0 ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: INK_MUTE,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              No {metric === 'aces' ? 'aces' : 'albatrosses'} yet.
            </div>
          ) : (
            <div>
              {legendaryLeaderRows.map((r, i) => {
                const count = r[metric] ?? 0;
                const other = metric === 'aces' ? (r.albatrosses ?? 0) : (r.aces ?? 0);
                const otherLabel =
                  other > 0
                    ? metric === 'aces'
                      ? `+${other} ${other === 1 ? 'albatross' : 'albatrosses'}`
                      : `+${other} ${other === 1 ? 'ace' : 'aces'}`
                    : null;
                return (
                  <CountLeaderSheetRow
                    key={`${r.user_id ?? r.holder_name ?? i}-${i}`}
                    index={i}
                    userId={r.user_id}
                    holderName={r.holder_name}
                    holderAvatar={r.holder_avatar}
                    holderHcp={r.holder_hcp ?? null}
                    holderClub={r.holder_club ?? null}
                    count={count}
                    max={legendaryMax}
                    countLabelSingular={metric === 'aces' ? 'ACE' : 'ALBATROSS'}
                    countLabelPlural={metric === 'aces' ? 'ACES' : 'ALBATROSSES'}
                    subline={otherLabel}
                    variant="gold"
                    isLast={i === legendaryLeaderRows.length - 1}
                    onTap={() => {
                      if (r.user_id) opener.openProfile(r.user_id);
                    }}
                  />

                );
              })}
            </div>
          )
        ) : isEagleLeaders ? (
          eagleLeaderRows.length === 0 ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: INK_MUTE,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              No eagles yet.
            </div>
          ) : (
            <div>
              {eagleLeaderRows.map((r, i) => (
                <CountLeaderSheetRow
                  key={`${r.user_id ?? r.holder_name ?? i}-${i}`}
                  index={i}
                  userId={r.user_id}
                  holderName={r.holder_name}
                  holderAvatar={r.holder_avatar}
                  holderHcp={r.holder_hcp ?? null}
                  holderClub={r.holder_club ?? null}
                  count={r.eagles ?? 0}
                  max={eagleMax}
                  countLabelSingular="EAGLE"
                  countLabelPlural="EAGLES"
                  subline={null}
                  isLast={i === eagleLeaderRows.length - 1}
                  onTap={() => {
                    if (r.user_id) opener.openProfile(r.user_id);
                  }}
                />

              ))}
            </div>
          )
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
        ) : (
          <div>
            {visibleRows.map((row, i) => (
              <FeatListRow
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                row={row}
                tier={tier}
                index={i}
                isLast={i === visibleRows.length - 1}
                onTap={() => handleRowTap(row)}
                mode={mode}
                bestToPar={bestToPar}
                maxCount={birdieMaxCount}
                density="compact"
              />

            ))}
          </div>
        )}

        {!isLeaderView && visible < displayRows.length && (
          <div ref={sentinelRef} style={{ height: 40 }} />
        )}

        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generalized count-leader row - used for legendary (aces/albatrosses) and
// eagles all-time views. Delegates to the canonical StatRow.
// ─────────────────────────────────────────────────────────────────────────────

function formatLeaderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

interface CountLeaderSheetRowProps {
  index: number;
  userId: string | null;
  holderName: string | null;
  holderAvatar: string | null;
  holderHcp: number | null;
  holderClub: string | null;
  count: number;
  max: number;
  countLabelSingular: string;
  countLabelPlural: string;
  subline: string | null;
  onTap?: () => void;
  variant?: 'amber' | 'gold';
  isLast?: boolean;
}

function CountLeaderSheetRow({
  index,
  userId,
  holderName,
  holderAvatar,
  holderHcp,
  holderClub,
  count,
  max,
  countLabelSingular,
  countLabelPlural,
  subline,
  onTap,
  variant = 'amber',
  isLast = false,
}: CountLeaderSheetRowProps) {
  void max;
  const rank = index + 1;
  const isGold = variant === 'gold';
  const name = formatLeaderName(holderName);
  const countLabel = count === 1 ? countLabelSingular : countLabelPlural;
  const combined = holderClub ? <LedgerSubline courseName={holderClub} /> : null;

  return (
    <StatRow
      rank={rank}
      avatarUrl={holderAvatar}
      avatarUserId={userId ?? null}
      name={name}
      nameMeta={subline ?? undefined}
      subline={combined ?? undefined}
      statValue={count}
      statLabel={countLabel}
      showWatermark={rank === 1}
      isLast={isLast}
      onPress={onTap}
      density="compact"
    />
  );
}

export default TierSeeAllSheet;


