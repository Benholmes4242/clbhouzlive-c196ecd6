import React from 'react';
import { Lock } from 'lucide-react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { fmtDiff } from '@/lib/whs/format';
import { MiniGrossRing } from '@/components/profile/handicap/whs/sections/shared/GrossCounterRing';
import { splitCourseName } from '@/components/profile/handicap/whs/sections/last-round-card/splitCourseName';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';
const EM_DASH = '\u2014';

const HAIR: React.CSSProperties = {
  height: 0,
  borderTop: '0.5px solid rgba(255,255,255,0.15)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: FONT_GEIST,
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: 18,
  fontWeight: 300,
  color,
  fontFamily: FONT_GEIST,
  letterSpacing: '-0.03em',
  lineHeight: 1,
  marginTop: 2,
  fontVariantNumeric: 'tabular-nums',
});

interface Props {
  friend: FriendYesterday;
}

export const MiniGlass: React.FC<Props> = ({ friend }) => {
  const { title, suffix } = splitCourseName(friend.course_name ?? 'Round played');
  const meta = suffix ? suffix.toUpperCase() : '';

  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.08)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>
      {meta && (
        <div
          style={{
            marginTop: 1,
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.60)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {meta}
        </div>
      )}

      <div style={{ ...HAIR, margin: '5px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={labelStyle}>GROSS</div>
          <span
            style={{ marginTop: 2 }}
            aria-label={`Gross score ${friend.score ?? ''}${friend.is_counter ? ', counts toward index' : ''}`}
          >
            <MiniGrossRing
              value={friend.score != null ? friend.score : EM_DASH}
              isCounter={!!friend.is_counter}
            />
          </span>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={labelStyle}>STABLEFORD</div>
          {friend.stableford != null ? (
            <div style={valueStyle('#FFFFFF')}>{friend.stableford}</div>
          ) : (
            <div style={{ ...valueStyle('rgba(255,255,255,0.55)'), display: 'flex', justifyContent: 'center', alignItems: 'center', height: 18 }}>
              <Lock size={12} strokeWidth={2} />
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={labelStyle}>SCORE DIFF</div>
          {friend.differential != null ? (
            <div style={valueStyle(AMBER)}>{fmtDiff(friend.differential, { plus: true })}</div>
          ) : (
            <div style={{ ...valueStyle('rgba(255,255,255,0.55)'), display: 'flex', justifyContent: 'center', alignItems: 'center', height: 18 }}>
              <Lock size={12} strokeWidth={2} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniGlass;
