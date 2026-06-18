import React from 'react';
import { ArrowUp, ArrowDown, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PulseFriend } from '@/hooks/gam/usePulseFriends';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  friend: PulseFriend;
}

function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function colorFromUserId(id: string): string {
  const palette = ['#475569', '#7C2D12', '#1E3A8A', '#831843', '#064E3B', '#92400E', '#581C87', '#0F766E'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

const HcpSparkline: React.FC<{ series: number[]; color: string }> = ({ series, color }) => {
  const h = 18;
  if (series.length < 2) {
    return <div style={{ height: h }} />;
  }
  const w = 110;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(0.1, max - min);
  const points = series.map((v, i) => [
    (i / (series.length - 1)) * w,
    h - ((v - min) / range) * h,
  ]);
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const lastPoint = points[points.length - 1];
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r={2} fill={color} />
    </svg>
  );
};

export const PulseCard: React.FC<Props> = ({ friend }) => {
  const navigate = useNavigate();
  const isUp = (friend.delta90 ?? 0) >= 0.3;
  const isDown = (friend.delta90 ?? 0) <= -0.3;
  const isFlat = friend.delta90 != null && !isUp && !isDown;
  const deltaColor = isUp
    ? 'var(--hcp-bad, #EF4444)'
    : isDown
      ? 'var(--hcp-good, #10B981)'
      : 'var(--hcp-t-40)';
  const lineColor = friend.hot
    ? 'var(--hcp-amber-bold, #FBBC2E)'
    : isDown
      ? 'var(--hcp-good, #10B981)'
      : isUp
        ? 'var(--hcp-bad, #EF4444)'
        : 'var(--hcp-t-60)';
  const lastPlayedLabel = relativeDay(friend.last_played);
  const nameForInitial = friend.first_name ?? friend.display_name;
  const initial = (nameForInitial || '?').charAt(0).toUpperCase();
  const avatarBg = colorFromUserId(friend.user_id);

  return (
    <div
      onClick={() => navigate(`/handicap/${friend.user_id}`)}
      style={{
        position: 'relative',
        width: 132,
        flexShrink: 0,
        padding: 11,
        background: friend.hot
          ? 'linear-gradient(160deg, rgba(247,147,30,0.10) 0%, rgba(247,147,30,0.02) 50%, var(--hcp-bg-1) 100%)'
          : 'var(--hcp-bg-1)',
        border: friend.hot ? '1px solid rgba(247,147,30,0.32)' : '1px solid var(--hcp-line)',
        borderRadius: 13,
        cursor: 'pointer',
        boxShadow: friend.hot
          ? '0 0 24px -10px rgba(247,147,30,0.45)'
          : '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {friend.hot && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 6px',
            background: '#F7931E',
            color: '#0d0d0d',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.08em',
            borderRadius: 999,
            lineHeight: 1,
          }}
        >
          <Flame size={9} strokeWidth={2.5} />
          HOT
        </div>
      )}

      {friend.profile_photo_url ? (
        <img
          src={friend.profile_photo_url}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: '34%',
            objectFit: 'cover',
            background: 'var(--hcp-bg-2)',
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '34%',
            background: avatarBg,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initial}
        </div>
      )}

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}
      >
        {friend.first_name ?? friend.display_name}
      </div>

      <div style={{ fontSize: 10, color: 'var(--hcp-t-60)', lineHeight: 1, marginTop: -2 }}>
        {lastPlayedLabel}
      </div>

      <div style={{ marginTop: 2 }}>
        <HcpSparkline series={friend.hcp_series} color={lineColor} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 6,
          marginTop: 2,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {friend.handicap_index != null ? friend.handicap_index.toFixed(1) : '—'}
        </div>
        {friend.delta90 != null && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 1,
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: deltaColor,
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {isUp && <ArrowUp size={9} strokeWidth={3} />}
              {isDown && <ArrowDown size={9} strokeWidth={3} />}
              {isFlat ? '—' : Math.abs(friend.delta90).toFixed(1)}
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
                letterSpacing: '0.10em',
              }}
            >
              90D
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PulseCard;
