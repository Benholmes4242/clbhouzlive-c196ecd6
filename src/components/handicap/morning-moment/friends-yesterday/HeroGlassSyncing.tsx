import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { fmtDiff } from '@/lib/whs/format';
import { GlassShell, CourseHeader, HAIR, labelStyle, valueStyle } from './glassPrimitives';

const AMBER = '#F7931E';
const EM_DASH = '\u2014';

export const HeroGlassSyncing: React.FC<{ friend: FriendYesterday }> = ({ friend }) => (
  <GlassShell>
    <CourseHeader courseName={friend.course_name} meta={null} />

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
        <div style={labelStyle}>SCORE DIFF</div>
        <div style={valueStyle(friend.differential != null ? AMBER : '#FFFFFF')}>
          {friend.differential != null ? fmtDiff(friend.differential, { plus: true }) : EM_DASH}
        </div>
      </div>
    </div>

    <div style={{ ...HAIR, margin: '10px 0 8px' }} />

    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {'\u27F3'} HOLE-BY-HOLE SYNCING
    </div>
  </GlassShell>
);

export default HeroGlassSyncing;
