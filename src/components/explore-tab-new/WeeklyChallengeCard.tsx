import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { FONT } from './gamingLightTokens';

interface ChallengeRow {
  challenge_key: string;
  challenge_title: string | null;
  challenge_metric: string | null;
  days_left: number | null;
  week_start: string | null;
  week_end: string | null;
  rank: number | null;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  metric_value: number | null;
  is_viewer: boolean | null;
}

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const SLATE_400 = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const AMBER = '#F7931E';
const AMBER_TINT_BG = 'rgba(247,147,30,0.10)';
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

function titleFor(row: ChallengeRow | null | undefined, keyGuess?: string): string {
  const t = row?.challenge_title;
  if (t) return t;
  const k = row?.challenge_key ?? keyGuess ?? '';
  if (k.includes('round')) return 'Round Machine';
  if (k.includes('birdie')) return 'Birdie Week';
  if (k.includes('point')) return 'Points Chase';
  return 'This week';
}

function metricLabel(row: ChallengeRow | null | undefined): string {
  const m = row?.challenge_metric ?? '';
  const norm = m.replace(/_/g, ' ').trim();
  return norm ? norm.toUpperCase() : 'SCORE';
}

interface Props {
  userId: string | undefined;
}

export function WeeklyChallengeCard({ userId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['discover', 'weekly-challenge', userId ?? 'anon'],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_weekly_challenge', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data ?? []) as ChallengeRow[];
    },
  });

  const { top, viewer, header } = useMemo(() => {
    const rows = data ?? [];
    const sorted = rows
      .slice()
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    const top5 = sorted.slice(0, 5);
    const viewerRow = sorted.find((r) => r.is_viewer) ?? null;
    const isTopHas = top5.some((r) => r.is_viewer);
    return {
      top: top5,
      viewer: !isTopHas ? viewerRow : null,
      header: sorted[0] ?? null,
    };
  }, [data]);

  if (!userId) return null;
  if (isLoading) return null;

  const title = titleFor(header);
  const daysLeft = header?.days_left ?? null;
  const metric = metricLabel(header);

  return (
    <section style={{ padding: '0 16px', fontFamily: FONT }}>
      <div
        style={{
          background: CARD_BG,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 16,
          boxShadow: CARD_SHADOW,
          overflow: 'hidden',
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
              Weekly challenge
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: INK,
                lineHeight: 1.15,
              }}
            >
              {title}
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
        </div>

        {/* Body */}
        {top.length === 0 ? (
          <div
            style={{
              padding: '20px 14px',
              fontSize: 13,
              fontWeight: 500,
              color: MUTE,
              lineHeight: 1.35,
              textAlign: 'center',
            }}
          >
            No entries yet — first round this week takes the lead.
          </div>
        ) : (
          <>
            {top.map((row, idx) => (
              <LeaderboardRow
                key={row.user_id + idx}
                row={row}
                metricLabel={metric}
                isLast={idx === top.length - 1 && !viewer}
              />
            ))}
            {viewer ? (
              <>
                <div
                  style={{
                    height: 1,
                    background: HAIRLINE,
                    margin: '0 14px',
                  }}
                />
                <LeaderboardRow row={viewer} metricLabel={metric} isLast highlighted />
              </>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function LeaderboardRow({
  row,
  metricLabel,
  isLast,
  highlighted,
}: {
  row: ChallengeRow;
  metricLabel: string;
  isLast?: boolean;
  highlighted?: boolean;
}) {
  const isViewer = !!row.is_viewer || !!highlighted;
  const name = row.display_name ?? 'Golfer';
  const rank = row.rank ?? 0;
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
        className="tabular-nums"
        style={{
          width: 22,
          flexShrink: 0,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: isViewer ? AMBER_DEEP : SLATE_400,
          lineHeight: 1,
        }}
      >
        {rank || '—'}
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
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        <div
          className="tabular-nums"
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: INK,
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          {row.metric_value ?? 0}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SLATE_400,
            lineHeight: 1,
          }}
        >
          {metricLabel}
        </div>
      </div>
    </div>
  );
}

export default WeeklyChallengeCard;
