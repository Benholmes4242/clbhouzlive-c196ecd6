import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useTitlesInReach, type TitleInReach } from '@/hooks/gam/useTitlesInReach';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SPACE } from '@/lib/spacing';

import { FONT } from './gamingLightTokens';
import { matchesRegionScope, regionScopePhrase } from './regionScope';
import { EmptyScopeCard } from './EmptyScopeCard';

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const AMBER_TINT_BG = 'rgba(247,147,30,0.10)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const TRACK_BG = 'rgba(15,23,42,0.08)';
const PAGE_PAD = 30;
const RED = '#DC2626';
const GREEN = '#16A34A';
const GREEN_DEEP = '#15803D';
const GREEN_TINT_BG = 'rgba(22,163,74,0.10)';
const CARD_HEIGHT = 168;

interface DefendRow {
  course_id: string;
  course_name: string;
  course_country?: string | null;
  course_region?: string | null;
  category: string;
  category_label: string | null;
  my_value: number;
  attained_at: string | null;
  challenger_user_id: string | null;
  challenger_name: string | null;
  challenger_avatar: string | null;
  challenger_value: number | null;
  gap: number | null;
  challenger_active_7d: boolean | null;
  threat_score: number | null;
}

function useUnderThreat(userId: string | undefined) {
  return useQuery({
    queryKey: ['discover', 'under-threat', userId ?? 'anon'],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_under_threat', {
        p_user_id: userId,
        p_limit: 20,
      });
      if (error) throw error;
      return (data ?? []) as DefendRow[];
    },
  });
}

// ---- Conquest helpers (mirrored from TheRecordBook) -----------------------
const CATEGORY_META: Record<
  string,
  { label: string; unit: string; unitSingular: string }
> = {
  lowest_gross: { label: 'Lowest gross', unit: 'strokes', unitSingular: 'stroke' },
  best_score_diff: { label: 'Best score diff', unit: 'strokes', unitSingular: 'stroke' },
  most_birdies: { label: 'Most birdies', unit: 'birdies', unitSingular: 'birdie' },
  best_stableford: { label: 'Best stableford', unit: 'points', unitSingular: 'point' },
  most_eagles: { label: 'Most eagles', unit: 'eagles', unitSingular: 'eagle' },
  most_aces: { label: 'Most hole-in-one', unit: 'aces', unitSingular: 'ace' },
  most_rounds: { label: 'Most rounds', unit: 'rounds', unitSingular: 'round' },
};
function stripWindow(category: string): string {
  return category.replace(/_(90d|all_time)$/, '');
}
function windowSuffix(category: string): string {
  if (category.endsWith('_all_time')) return ' (all-time)';
  if (category.endsWith('_90d')) return ' (90 days)';
  return '';
}
function gapCopyAttack(category: string, gap: number): string {
  const base = stripWindow(category);
  const meta = CATEGORY_META[base];
  const n = Math.max(0, Math.round(gap));
  if (!meta) return `${n} off`;
  const unit = n === 1 ? meta.unitSingular : meta.unit;
  return `${n} ${unit}`;
}
function sentenceCase(raw: string): string {
  const s = raw.replace(/_/g, ' ').trim();
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}
function categoryLabel(category: string): string {
  const base = stripWindow(category);
  const meta = CATEGORY_META[base];
  if (!meta) {
    // Unknown key — sentence-case the raw string and flag once for triage.
    if (typeof console !== 'undefined' && !seenUnmapped.has(base)) {
      seenUnmapped.add(base);
      // eslint-disable-next-line no-console
      console.warn('[AttackDefendBand] unmapped conquest category:', base);
    }
    return sentenceCase(base) + windowSuffix(category);
  }
  return meta.label + windowSuffix(category);
}
const seenUnmapped = new Set<string>();
function progressPct(_category: string, gap: number): number {
  const n = Math.max(1, Math.round(gap));
  return Math.max(20, 96 - (n - 1) * 14);
}

function formatGapNumber(gap: number): string {
  const rounded = Math.round(gap * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

interface Props {
  userId: string | undefined;
  region?: string | null;
}

const CONQUEST_CAP = 6;

export function AttackDefendBand({ userId, region = null }: Props) {
  const { user } = useSupabaseSession();
  const effectiveUserId = userId ?? user?.id;

  const { data: connection } = useWhsConnection(effectiveUserId);
  const { data: attackData } = useTitlesInReach(effectiveUserId);
  const { data: defendData } = useUnderThreat(effectiveUserId);

  // Attack — filter via the same shared predicate as Defend. RPC now returns
  // course_country + course_region.
  const attackPicks = useMemo(() => {
    if (!attackData || attackData.length === 0) return [];
    const seen = new Set<string>();
    const unique: TitleInReach[] = [];
    for (const row of attackData) {
      if (seen.has(row.course_id)) continue;
      if (!matchesRegionScope(region, row.course_country ?? null, row.course_region ?? null)) continue;
      seen.add(row.course_id);
      unique.push(row);
    }
    return unique.slice(0, CONQUEST_CAP);
  }, [attackData, region]);

  const defendRows = useMemo(
    () =>
      (defendData ?? []).filter((r) =>
        matchesRegionScope(region, r.course_country ?? null, r.course_region ?? null),
      ),
    [defendData, region],
  );
  const hasDefend = defendRows.length > 0;
  const hasAttack = attackPicks.length > 0;

  // Default tab = whichever has content, Defend first if both
  const initialTab: 'defend' | 'attack' = hasDefend ? 'defend' : 'attack';
  const [tab, setTab] = useState<'defend' | 'attack'>(initialTab);
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current) return;
    if (!hasDefend && !hasAttack) return;
    setTab(hasDefend ? 'defend' : 'attack');
    initialised.current = true;
  }, [hasDefend, hasAttack]);

  if (!effectiveUserId) return null;
  if (!connection) return null;
  if (!hasDefend && !hasAttack) {
    if (region == null) return null;
    return (
      <section
        id="discover-defend-rail"
        style={{ marginTop: SPACE?.sectionSection ?? 24, fontFamily: FONT, color: INK, scrollMarginTop: 96 }}
      >
        <div style={{ padding: `0 ${PAGE_PAD}px` }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTE, lineHeight: 1 }}>
            The board
          </div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: INK, lineHeight: 1.15 }}>
            Attack &amp; defend
          </div>
        </div>
        <EmptyScopeCard
          title={`No crowns ${regionScopePhrase(region)} — untaken territory.`}
          subline="Go claim the first."
        />
      </section>
    );
  }

  return (
    <section
      id="discover-defend-rail"
      style={{
        marginTop: SPACE?.sectionSection ?? 24,
        fontFamily: FONT,
        color: INK,
        scrollMarginTop: 96,
      }}
    >
      {/* Header + tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: `0 ${PAGE_PAD}px`,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: MUTE,
              lineHeight: 1,
            }}
          >
            The board
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: INK,
              lineHeight: 1.15,
            }}
          >
            Attack &amp; defend
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <TabButton
            active={tab === 'defend'}
            disabled={!hasDefend}
            onClick={() => setTab('defend')}
            label="Defend"
            count={defendRows.length}
            accent="ink"
          />
          <TabButton
            active={tab === 'attack'}
            disabled={!hasAttack}
            onClick={() => setTab('attack')}
            label="Attack"
            count={attackPicks.length}
            accent="green"
          />
        </div>
      </div>

      {/* Rail */}
      {tab === 'defend' ? (
        <DefendRail rows={defendRows} />
      ) : (
        <AttackRail picks={attackPicks} />
      )}
    </section>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  label,
  count,
  accent = 'ink',
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: 'ink' | 'green';
}) {
  const activeBg = accent === 'green' ? GREEN : INK;
  const activeBorder = accent === 'green' ? GREEN : INK;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 10px',
        borderRadius: 999,
        background: active ? activeBg : 'transparent',
        border: `1px solid ${active ? activeBorder : HAIRLINE}`,
        color: active ? '#FFFFFF' : disabled ? 'rgba(15,23,42,0.30)' : INK,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        opacity: disabled ? 0.55 : 1,
        lineHeight: 1,
      }}
    >
      <span>{label}</span>
      {count > 0 ? (
        <span
          className="tabular-nums"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: active ? 'rgba(255,255,255,0.75)' : MUTE,
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

// ---- Defend rail ----------------------------------------------------------
function DefendRail({ rows }: { rows: DefendRow[] }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{
        gap: 10,
        marginTop: 10,
        paddingLeft: PAGE_PAD,
        paddingRight: PAGE_PAD,
        paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
      }}

    >
      {rows.map((row) => (
        <DefendCard
          key={`${row.course_id}-${row.category}`}
          row={row}
          onTap={() => navigate(`/courses/${row.course_id}?tab=legends`)}
        />
      ))}
    </div>
  );
}

function DefendCard({ row, onTap }: { row: DefendRow; onTap: () => void }) {
  const hasChallenger = !!row.challenger_user_id;
  const gap = row.gap ?? 0;
  const tied = hasChallenger && gap <= 0;
  const active = !!row.challenger_active_7d;
  const label = row.category_label ?? categoryLabel(row.category);
  const gapNum = formatGapNumber(Math.max(0, gap));

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        flexShrink: 0,
        width: 220,
        height: CARD_HEIGHT,
        boxSizing: 'border-box',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: tied ? 'rgba(220,38,38,0.03)' : CARD_BG,
        border: `1px solid ${tied ? 'rgba(220,38,38,0.42)' : HAIRLINE}`,
        borderRadius: 14,
        boxShadow: tied
          ? '0 1px 3px rgba(220,38,38,0.06), 0 8px 24px rgba(220,38,38,0.08)'
          : CARD_SHADOW,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: FONT,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GhostGlyph glyph="👑" />

      {/* Category chip + course */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, position: 'relative' }}>
        <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>
          👑
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: AMBER_DEEP,
            padding: '3px 7px',
            borderRadius: 999,
            background: AMBER_TINT_BG,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 13.5,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          position: 'relative',
        }}
      >
        {row.course_name}
      </div>

      {/* Footer — pinned to the bottom so every card baselines identically */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
        {hasChallenger ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <SquircleAvatar
                size="xs"
                src={row.challenger_avatar ?? undefined}
                alt={row.challenger_name ?? 'Challenger'}
                hairlineRing
              />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.challenger_name ?? 'Challenger'}
              </div>
            </div>

            {active ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  alignSelf: 'flex-start',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: AMBER,
                    flexShrink: 0,
                    boxShadow: '0 0 0 2px rgba(247,147,30,0.18)',
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: AMBER_DEEP,
                    lineHeight: 1,
                  }}
                >
                  Played this week
                </span>
              </div>
            ) : null}

            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: tied ? RED : INK,
                letterSpacing: '-0.005em',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tied ? (
                <>LEVEL with you</>
              ) : (
                <>
                  is <span className="tabular-nums">{gapNum}</span> behind
                </>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: MUTE,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span aria-hidden>👑</span>
            No challengers
          </div>
        )}
      </div>
    </button>
  );
}

// Oversized greyscale ghost glyph — mirrors the Moments card watermark
function GhostGlyph({ glyph }: { glyph: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        right: -6,
        bottom: -18,
        fontSize: 96,
        lineHeight: 1,
        opacity: 0.07,
        transform: 'rotate(-10deg)',
        filter: 'grayscale(1)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {glyph}
    </span>
  );
}


// ---- Attack rail (mirrors old ConquestsStrip) -----------------------------
function AttackRail({ picks }: { picks: TitleInReach[] }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{
        gap: 10,
        marginTop: 10,
        paddingLeft: PAGE_PAD,
        paddingRight: PAGE_PAD,
        paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {picks.map((row) => (
        <AttackCard
          key={`${row.course_id}-${row.category}`}
          row={row}
          onTap={() => navigate(`/courses/${row.course_id}?tab=legends`)}
        />
      ))}
    </div>
  );
}

function AttackCard({ row, onTap }: { row: TitleInReach; onTap: () => void }) {
  const pct = progressPct(row.category, row.gap);
  const gap = gapCopyAttack(row.category, row.gap);
  const category = categoryLabel(row.category);
  const recordValue = formatGapNumber(row.leader_value);
  const recordLabelUnit = (() => {
    const base = stripWindow(row.category);
    const meta = CATEGORY_META[base];
    if (!meta) return '';
    // Show just "Record 8.6" for differentials / gross; keep phrasing consistent.
    return ` ${meta.unit === 'strokes' ? '' : meta.unit}`.trimEnd();
  })();
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        flexShrink: 0,
        width: 220,
        height: CARD_HEIGHT,
        boxSizing: 'border-box',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: CARD_BG,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 14,
        boxShadow: CARD_SHADOW,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: FONT,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GhostGlyph glyph="🎯" />

      {/* Category chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, position: 'relative' }}>
        <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>
          🎯
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: GREEN_DEEP,
            padding: '3px 7px',
            borderRadius: 999,
            background: GREEN_TINT_BG,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {category}
        </span>
      </div>

      <div
        style={{
          fontSize: 13.5,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          position: 'relative',
        }}
      >
        {row.course_name}
      </div>

      {/* Footer — pinned; record + progress bar + "N to take it" */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: MUTE,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Record <span className="tabular-nums" style={{ color: INK }}>{recordValue}</span>
          {recordLabelUnit}
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 999,
            background: TRACK_BG,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(8, pct)}%`,
              height: '100%',
              background: GREEN,
              borderRadius: 999,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: GREEN_DEEP,
            letterSpacing: '-0.005em',
            lineHeight: 1.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span className="tabular-nums">{gap}</span> to take it
        </div>
      </div>
    </button>
  );
}


export default AttackDefendBand;
