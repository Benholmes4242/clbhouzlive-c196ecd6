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
  const PAD = 3;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(0.1, max - min);
  const PADX = 3;
  const points = series.map((v, i) => [
    PADX + (i / (series.length - 1)) * (w - PADX * 2),
    h - PAD - ((v - min) / range) * (h - PAD * 2),
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

const ZONE_LABEL: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 800,
  letterSpacing: '0.14em',
  color: 'var(--hcp-t-40)',
  textTransform: 'uppercase',
};

export const PulseCard: React.FC<Props> = ({ friend }) => {
  const navigate = useNavigate();
  const isUp = (friend.delta90 ?? 0) >= 0.3;
  const isDown = (friend.delta90 ?? 0) <= -0.3;
  const isFlat = friend.delta90 != null && !isUp && !isDown;
  const deltaColor = isUp
    ? '#EF4444'
    : isDown
      ? '#34D399'
      : 'rgba(242,244,247,0.38)';
  // Colour describes the visible line. When delta90 is null (thin
  // history) fall back to the series' own direction so a rising line
  // is never neutral grey.
  const s = friend.hcp_series;
  const seriesMove = s.length >= 2 ? s[s.length - 1] - s[0] : 0;
  const lineUp = friend.delta90 != null ? isUp : seriesMove >= 0.3;
  const lineDown = friend.delta90 != null ? isDown : seriesMove <= -0.3;
  const lineColor = lineDown
    ? '#34D399'
    : lineUp
      ? '#EF4444'
      : 'rgba(242,244,247,0.55)';
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
        padding: 12,
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 13,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
        fontFamily: FONT,
      }}
    >
      {/* Header row: avatar + name/recency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 32, height: 34, flexShrink: 0 }}>
          {friend.profile_photo_url ? (
            <img
              src={friend.profile_photo_url}
              alt=""
              style={{
                width: 32,
                height: 34,
                borderRadius: '34%',
                objectFit: 'cover',
                background: 'var(--hcp-bg-2)',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 34,
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
          {/* Traced hairline overlay -- dark surface canon */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '34%',
              border: '1px solid rgba(255,255,255,0.22)',
              pointerEvents: 'none',
            }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.15,
            }}
          >
            {friend.first_name ?? friend.display_name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--hcp-t-60)', lineHeight: 1, marginTop: 3 }}>
            {lastPlayedLabel}
          </div>
        </div>
      </div>

      {/* Zone A: 90-DAY TREND */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={ZONE_LABEL}>90-DAY TREND</span>
          {friend.delta90 != null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: deltaColor,
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                lineHeight: 1,
              }}
            >
              {isUp && <ArrowUp size={9} strokeWidth={3} />}
              {isDown && <ArrowDown size={9} strokeWidth={3} />}
              {isFlat ? '--' : Math.abs(friend.delta90).toFixed(1)}
            </span>
          )}
        </div>
        <div style={{ marginTop: 5 }}>
          <HcpSparkline series={friend.hcp_series} color={lineColor} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--hcp-line)', margin: '9px 0 8px' }} />

      {/* Zone B: LAST 5 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={ZONE_LABEL}>LAST 5</span>
          {friend.last5.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
              {friend.last5.map((hit, i) =>
                hit ? (
                  <span
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#34D399',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <span
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'rgba(242,244,247,0.16)',
                      border: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ),
              )}
            </div>
          )}
        </div>
        {friend.hot && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '3px 7px',
              borderRadius: 999,
              border: '1px solid rgba(247,147,30,0.35)',
              color: 'var(--hcp-amber-bold, #F7931E)',
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.10em',
              background: 'transparent',
              lineHeight: 1,
            }}
          >
            <Flame size={9} strokeWidth={2.5} />
            HOT
          </span>
        )}
      </div>

      {/* Zone C: INDEX */}
      <div
        style={{
          marginTop: 8,
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {friend.handicap_index != null ? friend.handicap_index.toFixed(1) : '--'}
      </div>
    </div>
  );
};

export default PulseCard;
