import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { fmtDiff } from '@/lib/whs/format';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const AMBER = '#F7931E';
const EM_DASH = '\u2014';

const labelStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  marginBottom: 2,
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: 20,
  fontWeight: 300,
  color,
  fontFamily: FONT_MONO,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
});

interface Props {
  friend: FriendYesterday;
}

export const MiniGlass: React.FC<Props> = ({ friend }) => {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.015em',
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 8,
        }}
      >
        {friend.course_name || 'Round played'}
      </div>

      <div style={{ height: 0, borderTop: '0.5px solid rgba(255,255,255,0.15)', marginBottom: 8 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={labelStyle}>GROSS</div>
          <div style={valueStyle('#FFFFFF')}>{friend.score != null ? friend.score : EM_DASH}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={labelStyle}>POINTS</div>
          <div style={valueStyle('#FFFFFF')}>{friend.stableford != null ? friend.stableford : EM_DASH}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>DIFF</div>
          <div style={valueStyle(friend.differential != null ? AMBER : '#FFFFFF')}>
            {friend.differential != null ? fmtDiff(friend.differential, { plus: true }) : EM_DASH}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniGlass;
