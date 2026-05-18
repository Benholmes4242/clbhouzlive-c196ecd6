import React from 'react';
import { X } from 'lucide-react';
import { GamSheet } from '../_shared/GamSheet';
import { Skeleton, RetryStub } from '../_shared/GamAtoms';
import { useMyPodStandings } from '@/hooks/gam/useMyPodStandings';
import { bracketEmoji, bracketLabel, bracketHcpRange, daysUntil } from '@/lib/gam/visuals';
import type { PodStanding, LeagueBracket } from '@/lib/gam/types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const COLOR_GREEN = '#059669';
const COLOR_RED = '#DC2626';
const COLOR_AMBER = '#F7931E';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
}

function formatSeason(s: string | null | undefined): string {
  if (!s) return 'Season';
  return s
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PROMOTE_PCT = (7 / 30) * 100;
const RELEGATE_START_PCT = (25 / 30) * 100;

const HeroBar: React.FC<{ liveRank: number; podSize: number }> = ({ liveRank, podSize }) => {
  const dotLeftPct = ((liveRank - 0.5) / podSize) * 100;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 10,
        borderRadius: 5,
        background: `linear-gradient(90deg,
          ${COLOR_GREEN} 0%, ${COLOR_GREEN} ${PROMOTE_PCT}%,
          rgba(255,255,255,0.10) ${PROMOTE_PCT}%, rgba(255,255,255,0.10) ${RELEGATE_START_PCT}%,
          ${COLOR_RED} ${RELEGATE_START_PCT}%, ${COLOR_RED} 100%
        )`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${dotLeftPct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: COLOR_AMBER,
          border: '2px solid #FFFFFF',
          boxShadow: '0 0 4px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
};

const RankRow: React.FC<{ row: PodStanding }> = ({ row }) => {
  const promote = row.live_rank <= 7;
  const relegate = row.live_rank >= 26;
  const rail = promote ? COLOR_GREEN : relegate ? COLOR_RED : 'transparent';
  const isMe = row.is_self;
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderBottom: '0.5px solid var(--hcp-line)',
        background: isMe ? 'rgba(247,147,30,0.08)' : 'transparent',
        fontFamily: FONT,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: rail,
        }}
      />
      <div
        style={{
          width: 26,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.live_rank}
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '34%',
          background: 'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundImage: row.user_photo_url ? `url(${row.user_photo_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: isMe ? 700 : 600,
            color: isMe ? COLOR_AMBER : 'var(--hcp-t-100)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.home_club ? 'Player' : 'Player'}
          {isMe ? ' (you)' : ''}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            marginTop: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {row.rounds_counted} rounds · hcp {row.eg_handicap_index ?? '—'}
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.current_points}
      </div>
    </div>
  );
};

export const LeaguesSheet: React.FC<Props> = ({ open, onClose, userId: _userId }) => {
  const { data, isLoading, isError, refetch } = useMyPodStandings(open);
  const standings = (data ?? []).slice().sort((a, b) => a.live_rank - b.live_rank);
  const self = standings.find((s) => s.is_self);
  const bracket = (self?.bracket ?? 'open') as LeagueBracket;
  const emoji = bracketEmoji[bracket] ?? '🏆';
  const podSize = standings.length || 30;
  const days = self ? daysUntil(self.season_end) : null;

  return (
    <GamSheet open={open} onClose={onClose}>
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hcp-line-2)' }} />
      </div>

      {/* Sticky header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '0.5px solid var(--hcp-line)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
          }}
        >
          {bracketLabel[bracket] ?? 'League'} Pod
          {self?.pod_number != null ? ` ${self.pod_number}` : ''}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: 'var(--hcp-t-60)',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: 32,
          willChange: 'transform',
        }}
      >
        {isLoading && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height={140} radius={12} />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={52} radius={8} />
            ))}
          </div>
        )}

        {isError && (
          <div style={{ padding: 16 }}>
            <RetryStub message="Couldn't load pod standings" onRetry={() => refetch()} />
          </div>
        )}

        {!isLoading && !isError && self && (
          <>
            {/* Hero */}
            <div
              style={{
                padding: '20px 16px 16px',
                borderBottom: '0.5px solid var(--hcp-line)',
                textAlign: 'center',
                fontFamily: FONT,
              }}
            >
              <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden>
                {emoji}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--hcp-t-60)',
                  marginTop: 8,
                }}
              >
                {formatSeason(self.season).toUpperCase()}
                {days != null && days >= 0 ? ` · ${days} DAYS LEFT` : ''}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: 6,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: 'var(--hcp-t-100)',
                    lineHeight: 1,
                  }}
                >
                  #{self.live_rank}
                </span>
                <span style={{ fontSize: 14, color: 'var(--hcp-t-60)' }}>of {podSize}</span>
              </div>
              <div style={{ marginTop: 14, padding: '0 4px' }}>
                <HeroBar liveRank={self.live_rank} podSize={podSize} />
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ color: COLOR_GREEN }}>↑ promote (7)</span>
                <span style={{ color: 'var(--hcp-t-40)' }}>middle</span>
                <span style={{ color: COLOR_RED }}>↓ relegate (5)</span>
              </div>
            </div>

            {/* Standings list */}
            <div>
              {standings.map((row) => (
                <RankRow key={`${row.user_id}-${row.live_rank}`} row={row} />
              ))}
            </div>

            {/* How it works */}
            <div style={{ padding: '20px 16px 0', fontFamily: FONT }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--hcp-t-60)',
                  marginBottom: 10,
                }}
              >
                <span style={{ color: COLOR_AMBER, marginRight: 6 }}>•</span>
                How it works
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--hcp-t-60)',
                  lineHeight: 1.55,
                }}
              >
                <p style={{ margin: '0 0 8px' }}>
                  Pods of 30 bucketed by handicap ({bracketHcpRange[bracket] ?? 'all'}).
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  Points come from your best 8 stableford scores this season — the same counters
                  that drive your WHS index.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  Top 7 promote · Bottom 5 relegate · Middle 18 stay.
                </p>
                <p style={{ margin: 0 }}>New pods every quarter.</p>
              </div>
            </div>
          </>
        )}

        {!isLoading && !isError && !self && (
          <div style={{ padding: 24, textAlign: 'center', fontFamily: FONT }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--hcp-t-100)', marginBottom: 6 }}>
              Your league starts soon
            </div>
            <div style={{ fontSize: 13, color: 'var(--hcp-t-60)' }}>
              Pods refresh at season start.
            </div>
          </div>
        )}
      </div>
    </GamSheet>
  );
};

export default LeaguesSheet;
