import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { GamSheet } from '../_shared/GamSheet';
import { Skeleton, RetryStub } from '../_shared/GamAtoms';
import { useMyPodStandings, type PodStandingRow } from '@/hooks/gam/useMyPodStandings';
import { leaguesSheetBus } from '../../whs/gam/events';
import {
  POD_SIZE,
  PROMOTE_COUNT,
  RELEGATE_COUNT,
  bracketLabel,
  bracketEmoji,
  seasonLabel,
} from './leagueTokens';
import PromoteRelegateBar from './PromoteRelegateBar';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function initial(name: string | null | undefined): string {
  return (name?.charAt(0) ?? '?').toUpperCase();
}

const Avatar: React.FC<{ url: string | null; name: string | null }> = ({ url, name }) =>
  url ? (
    <img
      src={url}
      alt=""
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: 'linear-gradient(135deg,#F7931E,#C97211)',
        color: '#fff',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {initial(name)}
    </div>
  );

function homeClubOrHcp(row: PodStandingRow): string {
  const parts: string[] = [];
  if (row.home_club) parts.push(row.home_club);
  if (Number.isFinite(row.eg_handicap_index)) parts.push(`HI ${row.eg_handicap_index.toFixed(1)}`);
  if (parts.length === 0) parts.push(`${row.rounds_counted} rounds`);
  return parts.join(' · ');
}

const Row: React.FC<{ row: PodStandingRow }> = ({ row }) => {
  let railColor: string | null = null;
  if (row.live_rank <= PROMOTE_COUNT) railColor = '#059669';
  else if (row.live_rank > POD_SIZE - RELEGATE_COUNT) railColor = '#DC2626';

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '28px 32px 1fr auto',
        gap: 10,
        alignItems: 'center',
        padding: '10px 16px',
        background: row.is_self ? 'rgba(247,147,30,0.10)' : 'transparent',
        borderBottom: '1px solid var(--hcp-line)',
        fontFamily: FONT,
      }}
    >
      {railColor && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: railColor,
          }}
        />
      )}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
        }}
      >
        {row.live_rank}
      </div>
      <Avatar url={row.user_photo_url} name={row.home_club} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: row.is_self ? 800 : 600,
            color: 'var(--hcp-t-100)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.is_self ? 'You' : row.home_club ?? 'Player'}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-40)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.rounds_counted} rounds · {homeClubOrHcp(row)}
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {row.current_points}
      </div>
    </div>
  );
};

const HowItWorks: React.FC<{ bracket: string; pod: PodStandingRow[] }> = ({ bracket, pod }) => {
  const handicaps = pod.map((r) => r.eg_handicap_index).filter((n) => Number.isFinite(n));
  const lo = handicaps.length ? Math.min(...handicaps) : 0;
  const hi = handicaps.length ? Math.max(...handicaps) : 0;

  const paragraphs = [
    `Pods of ${POD_SIZE} bucketed by handicap (${bracket}: ${lo.toFixed(1)} – ${hi.toFixed(1)}).`,
    'Points come from your best 8 stableford scores this season — same as your WHS counters.',
    `Top ${PROMOTE_COUNT} promote up · Bottom ${RELEGATE_COUNT} relegate down · Middle ${POD_SIZE - PROMOTE_COUNT - RELEGATE_COUNT} stay.`,
    'New pods every quarter.',
  ];

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-40)',
          marginBottom: 10,
        }}
      >
        How it works
      </div>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: 'var(--hcp-t-60)',
            lineHeight: 1.55,
            marginBottom: 10,
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
};

export const LeaguesSheet: React.FC = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => leaguesSheetBus.subscribe(() => setOpen(true)), []);

  const { data, isLoading, isError, refetch } = useMyPodStandings();

  const pod = useMemo(
    () => (data ?? []).slice().sort((a, b) => a.live_rank - b.live_rank),
    [data],
  );
  const self = pod.find((r) => r.is_self);
  const headerLabel = self
    ? `${bracketLabel(self.bracket)} · Pod ${self.pod_number}`
    : 'Leagues';

  return (
    <GamSheet open={open} onClose={() => setOpen(false)}>
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--hcp-line-2)',
          }}
        />
      </div>

      {/* Sticky header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--hcp-line)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.01em',
          }}
        >
          {headerLabel}
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--hcp-t-60)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {isError && (
          <div style={{ padding: 16 }}>
            <RetryStub message="Couldn't load pod standings" onRetry={() => refetch()} />
          </div>
        )}

        {isLoading && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton height={140} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={52} />
            ))}
          </div>
        )}

        {!isLoading && !isError && self && (
          <>
            {/* Hero */}
            <div
              style={{
                padding: '20px 16px 18px',
                borderBottom: '1px solid var(--hcp-line)',
                background:
                  'linear-gradient(135deg, var(--hcp-bg-1) 0%, var(--hcp-bg-2) 60%, rgba(247,147,30,0.06) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 48, lineHeight: 1 }} aria-hidden>
                  {bracketEmoji(self.bracket)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 44,
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: '-0.04em',
                        color: 'var(--hcp-t-100)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      #{self.live_rank}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 14,
                        color: 'var(--hcp-t-60)',
                      }}
                    >
                      of {POD_SIZE}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 12,
                      color: 'var(--hcp-t-60)',
                      marginTop: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {self.current_points} pts · {seasonLabel(self.season)}
                  </div>
                </div>
              </div>
              <PromoteRelegateBar rank={self.live_rank} height={10} dotSize={14} />
            </div>

            {/* Standings */}
            <div>
              {pod.map((r) => (
                <Row key={r.user_id} row={r} />
              ))}
              {!pod.some((r) => r.is_self) && (
                <div
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontSize: 13,
                    color: 'var(--hcp-t-60)',
                  }}
                >
                  Couldn't find your position.
                  <button
                    onClick={() => refetch()}
                    style={{
                      marginLeft: 10,
                      background: 'transparent',
                      border: '1px solid var(--hcp-line)',
                      borderRadius: 8,
                      color: 'var(--hcp-t-100)',
                      padding: '4px 10px',
                      fontFamily: FONT,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>

            <HowItWorks bracket={bracketLabel(self.bracket)} pod={pod} />
          </>
        )}

        {!isLoading && !isError && !self && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 13,
              color: 'var(--hcp-t-60)',
            }}
          >
            You haven't been placed in a pod yet. Check back at the season start.
          </div>
        )}
      </div>
    </GamSheet>
  );
};

export default LeaguesSheet;
