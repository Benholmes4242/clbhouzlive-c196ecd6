import { useEffect, useMemo, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  AMBER,
  FONT,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
                style={{
                  display: 'inline-flex',
                  flexShrink: 0,
                  gap: 2,
                  padding: 3,
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.06)',
                }}
              >
                {([
                  { v: 'aces', label: 'ACES' },
                  { v: 'albatrosses', label: 'ALBATROSSES' },
                ] as const).map((o) => {
                  const active = metric === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setMetric(o.v)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: active ? '#FFFFFF' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: active ? '0 1px 4px rgba(15,23,42,0.14)' : 'none',
                        transition: 'all .15s',
                        fontFamily: FONT,
                      }}
                    >
                      <span
                        className={active ? 'clbhouz-gold-shimmer-light' : undefined}
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          whiteSpace: 'nowrap',
                          ...(active ? {} : { color: 'rgba(15,23,42,0.55)' }),
                        }}
                      >
                        {o.label}
                      </span>
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
                onTap={() => handleRowTap(row)}
                mode={mode}
                bestToPar={bestToPar}
                maxCount={birdieMaxCount}
                crownLeader={mode === 'alltime'}
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
// eagles all-time views. Distinct data shape from FeatRow.
// ─────────────────────────────────────────────────────────────────────────────

const LEGEND_INK = '#0F172A';
const LEGEND_SUB = 'rgba(15,23,42,0.5)';
const LEGEND_LABEL = 'rgba(15,23,42,0.4)';
const LEGEND_RANK = 'rgba(15,23,42,0.35)';

function formatLeaderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function leaderInitials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
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
  /** Optional secondary line, e.g. cross-metric or club. */
  subline: string | null;
  onTap?: () => void;
  /**
   * 'amber' (default) = eagles all-time champion chrome.
   * 'gold' = legendary (aces & albatrosses) — champion adopts the exceptional
   * review gold system (shimmer rank/value, gold-edge border, champagne
   * gradient, shimmering bar); HCP suppressed sheet-wide.
   */
  variant?: 'amber' | 'gold';
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
}: CountLeaderSheetRowProps) {
  const rank = index + 1;
  const isTop = rank === 1;
  const isGold = variant === 'gold';
  const goldChampion = isGold && isTop;
  const name = formatLeaderName(holderName);
  const pct = Math.max(0.08, Math.min(1, count / (max || 1)));
  const countLabel = count === 1 ? countLabelSingular : countLabelPlural;
  const secondLine =
    subline && holderClub
      ? `${subline} \u00B7 ${holderClub}`
      : subline
        ? subline
        : holderClub;

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left active:scale-[0.995] transition-transform"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
        padding: '10px 16px',
        background: index % 2 === 0 ? 'rgba(15,23,42,0.035)' : 'transparent',
        borderTop: index === 0 ? 'none' : '0.5px solid rgba(15,23,42,0.08)',
        cursor: onTap ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <div
          className={goldChampion ? 'clbhouz-gold-shimmer-light' : undefined}
          style={{
            width: 20,
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textAlign: 'center',
            ...(goldChampion ? {} : { color: isTop ? AMBER : LEGEND_RANK }),
          }}
        >
          {rank}
        </div>
        <div style={{ flexShrink: 0 }}>
          <SquircleAvatar
            size={34}
            srcCandidates={holderAvatar ? [holderAvatar] : []}
            alt={name}
            fallback={leaderInitials(name)}
            userId={userId ?? undefined}
            hairlineRing
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: LEGEND_INK,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                flex: '0 1 auto',
              }}
            >
              {name}
            </span>
            {!isGold && holderHcp != null ? (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: AMBER,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatHcp(holderHcp)}
              </span>
            ) : null}
          </div>
          {secondLine && (
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                fontWeight: 500,
                color: LEGEND_SUB,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {secondLine}
            </div>
          )}
        </div>
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            minWidth: 42,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: LEGEND_LABEL,
              lineHeight: 1,
            }}
          >
            {countLabel}
          </div>
          <div
            className={goldChampion ? 'clbhouz-gold-shimmer-light' : undefined}
            style={{
              marginTop: 3,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              ...(goldChampion ? {} : { color: isTop ? AMBER : LEGEND_INK }),
            }}
          >
            {count}
          </div>
        </div>
      </div>
      <div style={{ paddingLeft: 35, width: '100%' }}>
        <div
          style={{
            width: '100%',
            height: 3,
            borderRadius: 999,
            background: 'rgba(15,23,42,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            className={isGold ? 'clbhouz-gold-shimmer-bar' : undefined}
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              borderRadius: 999,
              transition: 'width .35s cubic-bezier(.2,.8,.2,1)',
              ...(isGold ? {} : { background: AMBER }),
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default TierSeeAllSheet;

