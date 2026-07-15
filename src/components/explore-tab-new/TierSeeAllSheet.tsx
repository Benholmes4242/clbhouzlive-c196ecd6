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
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SC_ACE, SC_ALBATROSS, SC_EAGLE, SC_EAGLE_DARK, SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { formatHcp } from '@/lib/formatHcp';
import { REGION_TABS } from './AlmanacSections';
import {
  useRegionFeats,
  useRegionLegendaryLeaders,
  useRegionEagleLeaders,
  rowToPar,
  sortRecordsAllTime,
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
  const metricAccent = metric === 'aces' ? SC_ACE : SC_ALBATROSS;
  const eagleBarGradient = `linear-gradient(90deg, ${SC_EAGLE}, ${SC_EAGLE_DARK})`;


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
            <div style={{ display: 'inline-flex', flexShrink: 0, gap: 6 }}>
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
                  { v: 'aces', label: 'ACES', color: SC_ACE },
                  { v: 'albatrosses', label: 'ALBATROSSES', color: SC_ALBATROSS },
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
                        color: active ? o.color : 'rgba(15,23,42,0.55)',
                        border: 'none',
                        fontFamily: FONT,
                        fontSize: 9.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: '0.08em',
                        whiteSpace: 'nowrap',
                        boxShadow: active ? '0 1px 4px rgba(15,23,42,0.14)' : 'none',
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
            <div style={{ padding: '0 16px' }}>
              {legendaryLeaderRows.map((r, i) => {
                const count = r[metric] ?? 0;
                const other = metric === 'aces' ? (r.albatrosses ?? 0) : (r.aces ?? 0);
                const otherLabel =
                  other > 0
                    ? metric === 'aces'
                      ? `+${other} ${other === 1 ? 'albatross' : 'albatrosses'}`
                      : `+${other} ${other === 1 ? 'ace' : 'aces'}`
                    : null;
                const barGradient =
                  metric === 'aces'
                    ? `linear-gradient(90deg, ${SC_ACE}, ${SC_FILL_GOLD})`
                    : `linear-gradient(90deg, ${SC_ALBATROSS}, #FFD84D)`;
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
                    accent={metricAccent}
                    barGradient={barGradient}
                    countLabelSingular={metric === 'aces' ? 'ACE' : 'ALBATROSS'}
                    countLabelPlural={metric === 'aces' ? 'ACES' : 'ALBATROSSES'}
                    subline={otherLabel}
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
            <div style={{ padding: '0 16px' }}>
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
                  accent={SC_EAGLE}
                  barGradient={eagleBarGradient}
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
          <div style={{ padding: '0 16px' }}>
            {visibleRows.map((row, i) => (
              <FeatListRow
                key={`${row.score_id ?? row.course_id ?? i}-${i}`}
                row={row}
                tier={tier}
                index={i}
                onTap={() => handleRowTap(row)}
                mode={mode}
                bestToPar={bestToPar}
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
// Legendary leaders row - all-time aces / albatrosses (leaders payload).
// Distinct data shape from FeatRow so it lives here rather than in FeatListRow.
// ─────────────────────────────────────────────────────────────────────────────

const LEGEND_INK = '#0F172A';
const LEGEND_MUTE = 'rgba(15,23,42,0.42)';
const LEGEND_HAIRLINE = 'rgba(15,23,42,0.07)';

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

interface LegendaryLeaderRowProps {
  row: LegendaryLeaderRow;
  index: number;
  metric: 'aces' | 'albatrosses';
  metricAccent: string;
  max: number;
  onTap?: () => void;
}

function LegendaryLeaderRow({ row, index, metric, metricAccent, max, onTap }: LegendaryLeaderRowProps) {
  const rank = index + 1;
  const isTop = rank === 1;
  const name = formatLeaderName(row.holder_name);
  const count = row[metric] ?? 0;
  const other = metric === 'aces' ? (row.albatrosses ?? 0) : (row.aces ?? 0);
  const otherLabel =
    metric === 'aces'
      ? `+${other} ${other === 1 ? 'albatross' : 'albatrosses'}`
      : `+${other} ${other === 1 ? 'ace' : 'aces'}`;
  const hcp = row.holder_hcp;
  const club = row.holder_club;
  const pct = Math.max(0.08, Math.min(1, count / (max || 1)));

  const barGradient =
    metric === 'aces'
      ? `linear-gradient(90deg, ${SC_ACE}, ${SC_FILL_GOLD})`
      : `linear-gradient(90deg, ${SC_ALBATROSS}, #FFD84D)`;

  const countLabel =
    metric === 'aces'
      ? count === 1
        ? 'ACE'
        : 'ACES'
      : count === 1
        ? 'ALBATROSS'
        : 'ALBATROSSES';

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left active:scale-[0.995] transition-transform"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        borderRadius: 16,
        padding: '13px 15px',
        marginBottom: 9,
        background: isTop
          ? 'linear-gradient(120deg, rgba(255,210,0,0.10), rgba(255,210,0,0.02))'
          : '#FFFFFF',
        border: isTop
          ? `1px solid rgba(255,210,0,0.55)`
          : `1px solid ${LEGEND_HAIRLINE}`,
        cursor: onTap ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <div
          style={{
            width: 20,
            flexShrink: 0,
            fontSize: 16,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: isTop ? metricAccent : 'rgba(15,23,42,0.35)',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {rank}
        </div>
        <div style={{ flexShrink: 0 }}>
          <SquircleAvatar
            size={40}
            srcCandidates={row.holder_avatar ? [row.holder_avatar] : []}
            alt={name}
            fallback={leaderInitials(name)}
            userId={row.user_id ?? undefined}
            hairlineRing
            ringColor={isTop ? '#FBBC2E' : undefined}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: LEGEND_INK,
                lineHeight: 1.15,
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
            {hcp != null ? (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#F7931E',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatHcp(hcp)}
              </span>
            ) : null}
          </div>
          {(other > 0 || club) && (
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: LEGEND_MUTE,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {other > 0 && club
                ? `${otherLabel} \u00B7 ${club}`
                : other > 0
                  ? otherLabel
                  : club}
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
              fontSize: 24,
              fontWeight: 900,
              color: isTop ? metricAccent : LEGEND_INK,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}
          >
            {count}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'rgba(15,23,42,0.4)',
              lineHeight: 1,
            }}
          >
            {countLabel}
          </div>
        </div>
      </div>
      <div style={{ paddingLeft: 32, width: '100%' }}>
        <div
          style={{
            width: '100%',
            height: 4,
            borderRadius: 999,
            background: 'rgba(15,23,42,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              borderRadius: 999,
              background: barGradient,
              transition: 'width .35s cubic-bezier(.2,.8,.2,1)',
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default TierSeeAllSheet;
