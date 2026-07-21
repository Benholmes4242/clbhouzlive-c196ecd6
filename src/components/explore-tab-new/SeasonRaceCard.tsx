import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Crown } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FONT } from './gamingLightTokens';

interface SeasonRow {
  season_name: string | null;
  season_number: number | null;
  days_left: number | null;
  rank: number | null;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  crowns_taken: number | null;
  is_viewer: boolean | null;
}

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const SLATE_400 = '#94A3B8';
const SLATE_200 = '#E2E8F0';
const SLATE_600 = '#475569';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const AMBER_TINT_BG = 'rgba(247,147,30,0.10)';
const AMBER_WASH = 'rgba(247,147,30,0.06)';
const AMBER_TOP = 'rgba(247,147,30,0.24)';
const BRONZE = '#B45309';

function initials(name: string | null | undefined): string {
  return (
    (name ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

const RANK_CHIP: Record<number, { bg: string; fg: string }> = {
  1: { bg: 'rgba(247,147,30,0.16)', fg: AMBER_DEEP },
  2: { bg: SLATE_200, fg: SLATE_600 },
  3: { bg: 'rgba(180,83,9,0.12)', fg: BRONZE },
};

interface Props {
  userId: string | undefined;
}

export function SeasonRaceCard({ userId }: Props) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['discover', 'season-race', userId ?? 'anon'],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_season_race', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data ?? []) as SeasonRow[];
    },
  });

  const { podium, viewer, header } = useMemo(() => {
    const rows = data ?? [];
    const sorted = rows.slice().sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    const top3 = sorted.slice(0, 3);
    const viewerRow = sorted.find((r) => r.is_viewer) ?? null;
    const isTopHas = top3.some((r) => r.is_viewer);
    return { podium: top3, viewer: !isTopHas ? viewerRow : null, header: sorted[0] ?? null };
  }, [data]);

  if (!userId) return null;
  if (!header || podium.length === 0) return null;

  const daysLeft = header.days_left ?? null;
  const seasonName = header.season_name ?? 'Season';

  return (
    <section style={{ padding: '0 16px', fontFamily: FONT }}>
      <button
        type="button"
        onClick={() => navigate('/championship')}
        style={{
          width: '100%',
          background: CARD_BG,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 16,
          boxShadow: CARD_SHADOW,
          overflow: 'hidden',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: FONT,
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 14px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: AMBER_DEEP,
                lineHeight: 1,
              }}
            >
              Season race
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: INK,
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {seasonName}
            </div>
          </div>
          {daysLeft != null ? (
            <div
              className="tabular-nums"
              style={{
                flexShrink: 0,
                background: AMBER_TINT_BG,
                color: AMBER_DEEP,
                padding: '5px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </div>
          ) : null}
          <ChevronRight size={18} color={MUTE} style={{ flexShrink: 0 }} />
        </div>

        {/* Podium rows */}
        {podium.map((row, idx) => (
          <PodiumRow key={row.user_id + idx} row={row} isLast={idx === podium.length - 1 && !viewer} />
        ))}

        {viewer ? (
          <>
            <div style={{ height: 1, background: HAIRLINE, margin: '0 14px' }} />
            <PodiumRow row={viewer} isLast highlighted />
          </>
        ) : null}
      </button>
    </section>
  );
}

function PodiumRow({
  row,
  isLast,
  highlighted,
}: {
  row: SeasonRow;
  isLast?: boolean;
  highlighted?: boolean;
}) {
  const isViewer = !!row.is_viewer || !!highlighted;
  const name = row.display_name ?? 'Golfer';
  const rank = row.rank ?? 0;
  const chip = RANK_CHIP[rank];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        background: isViewer ? AMBER_WASH : 'transparent',
        borderTop: isViewer ? `1px solid ${AMBER_TOP}` : 'none',
        minHeight: 56,
      }}
    >
      <div
        style={{
          width: 28,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {chip ? (
          <div
            className="tabular-nums"
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              background: chip.bg,
              color: chip.fg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {rank}
          </div>
        ) : (
          <div
            className="tabular-nums"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: isViewer ? AMBER_DEEP : SLATE_400,
              lineHeight: 1,
            }}
          >
            {rank || '—'}
          </div>
        )}
      </div>
      <SquircleAvatar
        size={36}
        srcCandidates={row.avatar_url ? [row.avatar_url] : []}
        alt={name}
        fallback={initials(name)}
        userId={row.user_id}
        hairlineRing
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: isViewer ? 700 : 600,
          color: INK,
          letterSpacing: '-0.005em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {isViewer ? 'You' : name}
      </div>
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: rank === 1 ? AMBER : MUTE,
        }}
      >
        <Crown size={13} strokeWidth={2.2} fill={rank === 1 ? AMBER : 'none'} />
        <span
          className="tabular-nums"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            lineHeight: 1,
          }}
        >
          {row.crowns_taken ?? 0}
        </span>
      </div>
    </div>
  );
}

export default SeasonRaceCard;
