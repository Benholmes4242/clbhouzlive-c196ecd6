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

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const AMBER_TINT_BG = 'rgba(247,147,30,0.10)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const TRACK_BG = 'rgba(15,23,42,0.08)';
const CHIP_BG = 'rgba(15,23,42,0.04)';
const PAGE_PAD = 16;
const RED = '#DC2626';

interface DefendRow {
  course_id: string;
  course_name: string;
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
  lowest_gross: { label: 'Gross', unit: 'strokes', unitSingular: 'stroke' },
  best_score_diff: { label: 'Score', unit: 'strokes', unitSingular: 'stroke' },
  most_birdies: { label: 'Birdies', unit: 'birdies', unitSingular: 'birdie' },
  best_stableford: { label: 'Stableford', unit: 'points', unitSingular: 'point' },
  most_eagles: { label: 'Eagles', unit: 'eagles', unitSingular: 'eagle' },
  most_aces: { label: 'Hole-in-one', unit: 'aces', unitSingular: 'ace' },
  most_rounds: { label: 'Most rounds', unit: 'rounds', unitSingular: 'round' },
};
function stripWindow(category: string): string {
  return category.replace(/_(90d|all_time)$/, '');
}
function gapCopyAttack(category: string, gap: number): string {
  const base = stripWindow(category);
  const meta = CATEGORY_META[base];
  const n = Math.max(0, Math.round(gap));
  if (!meta) return `${n} off`;
  const unit = n === 1 ? meta.unitSingular : meta.unit;
  return `${n} ${unit}`;
}
function categoryLabel(category: string): string {
  const base = stripWindow(category);
  return CATEGORY_META[base]?.label ?? base.replace(/_/g, ' ');
}
function recordCopy(category: string, value: number): string {
  const base = stripWindow(category);
  if (base === 'best_score_diff') {
    const n = Math.round(value * 10) / 10;
    return `${n} differential`;
  }
  const meta = CATEGORY_META[base];
  const n = Math.round(value);
  if (!meta) return String(n);
  const unit = n === 1 ? meta.unitSingular : meta.unit;
  return `${n} ${unit}`;
}
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
}

const CONQUEST_CAP = 6;

export function AttackDefendBand({ userId }: Props) {
  const { user } = useSupabaseSession();
  const effectiveUserId = userId ?? user?.id;

  const { data: connection } = useWhsConnection(effectiveUserId);
  const { data: attackData } = useTitlesInReach(effectiveUserId);
  const { data: defendData } = useUnderThreat(effectiveUserId);

  const attackPicks = useMemo(() => {
    if (!attackData || attackData.length === 0) return [];
    const seen = new Set<string>();
    const unique: TitleInReach[] = [];
    for (const row of attackData) {
      if (seen.has(row.course_id)) continue;
      seen.add(row.course_id);
      unique.push(row);
    }
    return unique.slice(0, CONQUEST_CAP);
  }, [attackData]);

  const defendRows = defendData ?? [];
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
  if (!hasDefend && !hasAttack) return null;

  return (
    <section
      id="discover-defend-rail"
      style={{
        marginTop: SPACE?.sectionSection ?? 24,
        fontFamily: FONT,
        color: INK,
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
          />
          <TabButton
            active={tab === 'attack'}
            disabled={!hasAttack}
            onClick={() => setTab('attack')}
            label="Attack"
            count={attackPicks.length}
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
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 10px',
        borderRadius: 999,
        background: active ? INK : 'transparent',
        border: `1px solid ${active ? INK : HAIRLINE}`,
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
        boxSizing: 'border-box',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: CARD_BG,
        border: `1px solid ${tied ? 'rgba(220,38,38,0.35)' : HAIRLINE}`,
        borderRadius: 14,
        boxShadow: CARD_SHADOW,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: FONT,
        position: 'relative',
      }}
    >
      {/* Category chip + course */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          aria-hidden
          style={{ fontSize: 12, lineHeight: 1 }}
        >
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
        }}
      >
        {row.course_name}
      </div>

      {/* Challenger block */}
      {hasChallenger ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
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
            {active ? (
              <span
                aria-hidden
                title="Played this week"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: AMBER,
                  flexShrink: 0,
                  boxShadow: '0 0 0 2px rgba(247,147,30,0.16)',
                }}
              />
            ) : null}
          </div>

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
            marginTop: 2,
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
    </button>
  );
}

// ---- Attack rail (mirrors old ConquestsStrip) -----------------------------
function AttackRail({ picks }: { picks: TitleInReach[] }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{
        gap: 8,
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
        <AttackChip
          key={`${row.course_id}-${row.category}`}
          row={row}
          onTap={() => navigate(`/courses/${row.course_id}?tab=legends`)}
        />
      ))}
    </div>
  );
}

function AttackChip({ row, onTap }: { row: TitleInReach; onTap: () => void }) {
  const pct = progressPct(row.category, row.gap);
  const gap = gapCopyAttack(row.category, row.gap);
  const category = categoryLabel(row.category);
  const record = recordCopy(row.category, row.leader_value);
  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:opacity-80 transition-opacity"
      style={{
        flexShrink: 0,
        width: 196,
        borderRadius: 10,
        background: CHIP_BG,
        border: 'none',
        padding: '10px 11px',
        cursor: 'pointer',
        fontFamily: FONT,
        color: INK,
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: INK,
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.course_name}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 10.5,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.5)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {`${category} · record ${record}`}
      </div>
      <div
        style={{
          marginTop: 8,
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
            background: AMBER,
            borderRadius: 999,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 7,
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.55)',
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: INK, fontWeight: 700 }}>{gap}</span> to take it
      </div>
    </button>
  );
}

export default AttackDefendBand;
