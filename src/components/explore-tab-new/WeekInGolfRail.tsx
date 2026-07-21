import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SectionHead } from './SectionHead';
import { FONT } from './gamingLightTokens';
import { formatRelativeAgo } from '@/i18n/format';


type EventType =
  | 'albatross'
  | 'ace'
  | 'crown_taken'
  | 'big_round'
  | 'eagle'
  | 'rank_unlocked'
  | 'course_record';

interface WeekRow {
  event_type: EventType;
  rarity: number | null;
  occurred_at: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  line1: string | null;
  line2: string | null;
  course_id: string | null;
  window_days: number | null;
  event_key: string | null;
  reaction_count: number | null;
  my_reacted: boolean | null;
}


const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const GOLD_BG = '#FDF6E3';
const GOLD_EDGE = '#E8D9A0';
const AMBER_TINT_BG = 'rgba(247,147,30,0.10)';
const AMBER_TINT_INK = '#B45309';

const TYPE_META: Record<EventType, { glyph: string; label: string; groupLabel: string; group: 'moments' | 'crowns' | 'big_rounds' | 'ranks' | 'records' }> = {
  albatross: { glyph: '🕊', label: 'ALBATROSS', groupLabel: 'Moments', group: 'moments' },
  ace: { glyph: '⚡', label: 'ACE', groupLabel: 'Moments', group: 'moments' },
  eagle: { glyph: '🦅', label: 'EAGLE', groupLabel: 'Moments', group: 'moments' },
  crown_taken: { glyph: '👑', label: 'CROWN TAKEN', groupLabel: 'Crowns', group: 'crowns' },
  big_round: { glyph: '🎯', label: 'BIG ROUND', groupLabel: 'Big rounds', group: 'big_rounds' },
  rank_unlocked: { glyph: '🏅', label: 'RANK UNLOCKED', groupLabel: 'Ranks', group: 'ranks' },
  course_record: { glyph: '📋', label: 'COURSE RECORD', groupLabel: 'Records', group: 'records' },
};

const GROUP_ORDER: Array<'moments' | 'crowns' | 'big_rounds' | 'ranks' | 'records'> = [
  'moments',
  'crowns',
  'big_rounds',
  'ranks',
  'records',
];

function useWeekInGolf(limit: number, userId: string | undefined) {
  return useQuery({
    queryKey: ['week-in-golf', limit, userId ?? 'anon'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_week_in_golf', {
        p_limit: limit,
        p_user_id: userId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as WeekRow[];
    },
    staleTime: 10 * 60 * 1000,
  });
}



/**
 * Adjacent-type interleave: stable swap-forward so no two adjacent cards
 * share event_type where avoidable.
 */
function interleave(rows: WeekRow[]): WeekRow[] {
  const out = rows.slice();
  for (let i = 1; i < out.length; i++) {
    if (out[i].event_type === out[i - 1].event_type) {
      for (let j = i + 1; j < out.length; j++) {
        if (out[j].event_type !== out[i - 1].event_type && (j + 1 >= out.length || out[j + 1].event_type !== out[i].event_type)) {
          const tmp = out[i];
          out[i] = out[j];
          out[j] = tmp;
          break;
        }
      }
    }
  }
  return out;
}

function isGold(type: EventType) {
  return type === 'albatross' || type === 'ace';
}

interface WeekInGolfRailProps {
  onSectionShown?: () => void;
}

export function WeekInGolfRail(_props: WeekInGolfRailProps = {}) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { data, isLoading, isError, error } = useWeekInGolf(12, userId);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isError) {
    // silent — garnish section
    // eslint-disable-next-line no-console
    console.warn('[WeekInGolfRail] rpc failed', error);
    return null;
  }
  if (isLoading) return null;

  const rows = data ?? [];
  if (rows.length < 3) return null;

  const ordered = interleave(rows);
  const hasOlder = ordered.some((r) => (r.window_days ?? 0) > 7);
  const eyebrow = hasOlder ? 'RECENTLY IN GOLF' : 'THIS WEEK IN GOLF';

  const goToProfile = (username: string | null) => {
    if (!username) return;
    navigate(`/profile/${username}`);
  };

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <SectionHead
        overline={eyebrow}
        title="Moments from the community"
        meta="See all"
        onMeta={() => setSheetOpen(true)}
        paddingX={16}
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '4px 16px 12px',
          WebkitOverflowScrolling: 'touch',
        }}
        className="no-scrollbar"
      >
        {ordered.map((row, i) => (
          <RailCard
            key={`${row.user_id}-${row.occurred_at}-${i}`}
            row={row}
            onTap={() => goToProfile(row.username)}
          />
        ))}
        <SeeAllTile onTap={() => setSheetOpen(true)} />
      </div>

      <WeekInGolfSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        userId={userId}
      />
    </section>
  );
}


export default WeekInGolfRail;

function RailCard({ row, onTap, onApplause }: { row: WeekRow; onTap: () => void; onApplause: () => void }) {
  const meta = TYPE_META[row.event_type];
  const gold = isGold(row.event_type);
  const displayName = row.display_name || row.username || 'Golfer';
  const rel = formatRelativeAgo(row.occurred_at);

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        flexShrink: 0,
        width: 168,
        height: 176,
        boxSizing: 'border-box',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        background: gold ? GOLD_BG : CARD_BG,
        border: `1px solid ${gold ? GOLD_EDGE : HAIRLINE}`,
        borderRadius: 14,
        boxShadow: CARD_SHADOW,
        cursor: 'pointer',
        fontFamily: FONT,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 999,
          background: gold ? 'rgba(180,83,9,0.12)' : AMBER_TINT_BG,
          color: gold ? AMBER_DEEP : AMBER_TINT_INK,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.08em',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <span aria-hidden style={{ fontSize: 11 }}>{meta.glyph}</span>
        {meta.label}
      </span>

      <div
        style={{
          marginTop: 10,
          fontSize: 14,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.3,
          minHeight: '2.6em',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {row.line1 || '\u00A0'}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 11.5,
          color: MUTE,
          lineHeight: 1.3,
          minHeight: '1.3em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {row.line2 || '\u00A0'}
      </div>

      <div
        style={{
          width: '100%',
          height: 1,
          background: HAIRLINE,
          marginTop: 10,
          flexShrink: 0,
        }}
      />

      <div style={{ width: '100%', marginTop: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <SquircleAvatar
            src={row.avatar_url ?? undefined}
            alt={displayName}
            size="xs"
            hairlineRing
          />
          <div style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.2, flex: 1, minWidth: 0 }}>{rel}</div>
          <ApplauseChip
            reacted={!!row.my_reacted}
            count={row.reaction_count ?? 0}
            onTap={(e) => {
              e.stopPropagation();
              onApplause();
            }}
          />
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.2,
            width: '100%',
          }}
        >
          {displayName}
        </div>
      </div>


      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: -6,
          bottom: -10,
          fontSize: 64,
          opacity: 0.07,
          transform: 'rotate(-10deg)',
          filter: 'grayscale(100%)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {meta.glyph}
      </span>
    </button>
  );
}

function SeeAllTile({ onTap }: { onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        flexShrink: 0,
        width: 120,
        minHeight: 176,
        border: `1px dashed ${HAIRLINE}`,
        borderRadius: 14,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: AMBER,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: 'pointer',
      }}

    >
      See all ›
    </button>
  );
}

function WeekInGolfSheet({
  open,
  onClose,
  userId,
  onApplause,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  onApplause: (row: WeekRow) => void;
}) {
  const navigate = useNavigate();
  const { data } = useWeekInGolf(open ? 100 : 12, userId);


  const grouped = useMemo(() => {
    const rows = data ?? [];
    const byGroup: Record<string, WeekRow[]> = {};
    for (const r of rows) {
      const g = TYPE_META[r.event_type]?.group;
      if (!g) continue;
      (byGroup[g] ||= []).push(r);
    }
    return byGroup;
  }, [data]);

  const handleRowTap = useCallback(
    (username: string | null) => {
      onClose();
      if (username) {
        setTimeout(() => navigate(`/profile/${username}`), 60);
      }
    },
    [navigate, onClose],
  );

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="week-in-golf-title">
      <div style={{ padding: '4px 16px 24px', fontFamily: FONT, maxHeight: '75dvh', overflowY: 'auto' }}>
        <div
          id="week-in-golf-title"
          style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: INK, padding: '12px 0 6px' }}
        >
          Moments from the community
        </div>

        {GROUP_ORDER.map((g) => {
          const items = grouped[g];
          if (!items || items.length === 0) return null;
          const label = items[0] ? TYPE_META[items[0].event_type].groupLabel : g;
          return (
            <div key={g} style={{ marginTop: 18 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: AMBER_DEEP,
                  padding: '0 0 8px',
                }}
              >
                {label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((row, i) => (
                  <SheetRow
                    key={`${row.user_id}-${row.occurred_at}-${i}`}
                    row={row}
                    onTap={() => handleRowTap(row.username)}
                    onApplause={() => onApplause(row)}
                  />
                ))}
              </div>

            </div>
          );
        })}

        <div
          style={{
            marginTop: 28,
            padding: '16px 0 4px',
            textAlign: 'center',
            fontSize: 11.5,
            color: MUTE,
            letterSpacing: '0.02em',
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          That’s the week.
        </div>
      </div>
    </BottomSheet>
  );
}

function SheetRow({
  row,
  onTap,
  onApplause,
}: {
  row: WeekRow;
  onTap: () => void;
  onApplause: () => void;
}) {
  const displayName = row.display_name || row.username || 'Golfer';
  const meta = TYPE_META[row.event_type];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: `1px solid ${HAIRLINE}`,
        fontFamily: FONT,
      }}
    >
      <button
        type="button"
        onClick={onTap}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        <SquircleAvatar src={row.avatar_url ?? undefined} alt={displayName} size="sm" hairlineRing />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: INK,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              {displayName}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: AMBER_DEEP,
                flexShrink: 0,
              }}
            >
              {meta.glyph} {meta.label}
            </span>
          </div>
          {row.line1 ? (
            <div style={{ fontSize: 13, color: INK, marginTop: 2, lineHeight: 1.3 }}>{row.line1}</div>
          ) : null}
          {row.line2 ? (
            <div style={{ fontSize: 12, color: MUTE, marginTop: 1, lineHeight: 1.3 }}>{row.line2}</div>
          ) : null}
        </div>
        <div style={{ fontSize: 11, color: MUTE, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatRelativeAgo(row.occurred_at)}
        </div>
      </button>
      <ApplauseChip
        reacted={!!row.my_reacted}
        count={row.reaction_count ?? 0}
        onTap={(e) => {
          e.stopPropagation();
          onApplause();
        }}
      />
    </div>
  );
}

function ApplauseChip({
  reacted,
  count,
  onTap,
}: {
  reacted: boolean;
  count: number;
  onTap: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={reacted}
      aria-label={reacted ? 'Remove applause' : 'Applaud'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 999,
        background: reacted ? AMBER_TINT_BG : 'transparent',
        border: `1px solid ${reacted ? 'rgba(247,147,30,0.35)' : HAIRLINE}`,
        color: reacted ? AMBER_DEEP : MUTE,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'pointer',
        flexShrink: 0,
        fontFeatureSettings: '"tnum" 1',
      }}
    >
      <span aria-hidden style={{ fontSize: 12 }}>👏</span>
      {count > 0 ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span> : null}
    </button>
  );
}

