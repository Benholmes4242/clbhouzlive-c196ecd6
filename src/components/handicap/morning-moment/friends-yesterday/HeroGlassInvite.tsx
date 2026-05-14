import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { fmtDiff } from '@/lib/whs/format';
import { GlassShell, CourseHeader, HAIR, labelStyle, valueStyle } from './glassPrimitives';

const AMBER = '#F7931E';
const EM_DASH = '\u2014';

export const HeroGlassInvite: React.FC<{ friend: FriendYesterday }> = ({ friend }) => {
  const hcp = friend.handicap_index_at_time ?? friend.friend_handicap_index;
  const meta = hcp != null
    ? `ENGLAND GOLF · HANDICAP ${hcp.toFixed(1)}`
    : 'ENGLAND GOLF';

  return (
    <GlassShell>
      <CourseHeader
        courseName={friend.course_name}
        meta={meta}
        metaColor={AMBER}
        metaLetterSpacing="0.10em"
      />

      <div style={{ ...HAIR, margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={labelStyle}>GROSS</div>
          <div style={valueStyle('#FFFFFF')}>{friend.score != null ? friend.score : EM_DASH}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={labelStyle}>STABLEFORD</div>
          <div style={valueStyle('#FFFFFF')}>{friend.stableford != null ? friend.stableford : EM_DASH}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={labelStyle}>DIFF</div>
          <div style={valueStyle(friend.differential != null ? AMBER : '#FFFFFF')}>
            {friend.differential != null ? fmtDiff(friend.differential, { plus: true }) : EM_DASH}
          </div>
        </div>
      </div>
    </GlassShell>
  );
};

export default HeroGlassInvite;
