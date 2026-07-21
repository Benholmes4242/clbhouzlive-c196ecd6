import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FONT } from './gamingLightTokens';

interface LeaderboardRow {
  rank: number | null;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  correct_count: number | null;
  total_count: number | null;
  is_viewer: boolean | null;
}

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const SLATE_50 = '#F8FAFC';
const SLATE_400 = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const AMBER_WASH = 'rgba(247,147,30,0.06)';
const AMBER_TOP = 'rgba(247,147,30,0.24)';

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

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function PickemLeaderboardSheet({ open, onClose, userId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['discover', 'pickem-leaderboard', userId ?? 'anon'],
    enabled: open && !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_pickem_leaderboard', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
  });

  const { rows, viewer } = useMemo(() => {
    const sorted = (data ?? []).slice().sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    const top = sorted.slice(0, 50);
    const viewerRow = sorted.find((r) => r.is_viewer) ?? null;
    const inTop = viewerRow ? top.some((r) => r.user_id === viewerRow.user_id) : true;
    return { rows: top, viewer: !inTop ? viewerRow : null };
  }, [data]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="pickem-leaderboard-title"
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
      <div style={{ padding: '10px 16px 12px' }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: AMBER_DEEP,
            marginBottom: 4,
          }}
        >
          Pick'em
        </div>
        <div
          id="pickem-leaderboard-title"
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: INK,
            lineHeight: 1.1,
          }}
        >
          Standings
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 24 }}>
        {isLoading ? null : rows.length === 0 ? (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: MUTE,
              lineHeight: 1.4,
            }}
          >
            First results land Sunday night.
          </div>
        ) : (
          <>
            {rows.map((r, idx) => (
              <StandingsRow key={r.user_id + idx} row={r} isLast={idx === rows.length - 1 && !viewer} />
            ))}
            {viewer ? (
              <>
                <div style={{ height: 1, background: HAIRLINE, margin: '8px 16px' }} />
                <StandingsRow row={viewer} isLast highlighted />
              </>
            ) : null}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function StandingsRow({
  row,
  isLast,
  highlighted,
}: {
  row: LeaderboardRow;
  isLast?: boolean;
  highlighted?: boolean;
}) {
  const isViewer = !!row.is_viewer || !!highlighted;
  const name = row.display_name ?? 'Golfer';
  const rank = row.rank ?? 0;
  const correct = row.correct_count ?? 0;
  const total = row.total_count ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        background: isViewer ? AMBER_WASH : 'transparent',
        borderTop: isViewer ? `1px solid ${AMBER_TOP}` : 'none',
        minHeight: 64,
      }}
    >
      <div
        className="tabular-nums"
        style={{
          width: 26,
          flexShrink: 0,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: isViewer ? AMBER_DEEP : SLATE_400,
          lineHeight: 1,
        }}
      >
        {rank || '—'}
      </div>
      <SquircleAvatar
        size={40}
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
        className="tabular-nums"
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.005em',
        }}
      >
        {correct} <span style={{ color: MUTE, fontWeight: 600 }}>of {total} correct</span>
      </div>
    </div>
  );
}

export default PickemLeaderboardSheet;
