import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import type { WhsScoreHole } from '@/lib/whs/types';
import { fmtDiff } from '@/lib/whs/format';
import { splitCourseName } from '@/components/profile/handicap/whs/sections/last-round-card/splitCourseName';
import CinemaCardShapeStrip from '@/components/profile/handicap/whs/sections/last-round-card/CinemaCardShapeStrip';
import { GlassGrossRing } from '@/components/profile/handicap/whs/sections/shared/GrossCounterRing';
import { GlassShell, CourseHeader, HAIR, labelStyle, valueStyle } from './glassPrimitives';

const AMBER = '#F7931E';
const EM_DASH = '\u2014';

interface Props {
  friend: FriendYesterday;
  par: number | null;
  slope: number | null;
  holes: WhsScoreHole[] | null;
}

export const HeroGlassEnriched: React.FC<Props> = ({ friend, par, slope, holes }) => {
  const { suffix } = splitCourseName(friend.course_name ?? 'Round played');
  const meta = [
    suffix,
    par != null ? `PAR ${par}` : null,
    slope != null ? `SL ${slope}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  const showShape = !!holes && holes.length > 0;

  return (
    <GlassShell>
      <CourseHeader courseName={friend.course_name} meta={meta || null} />

      <div style={{ ...HAIR, margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={labelStyle}>GROSS</div>
          <span
            aria-label={`Gross score ${friend.score ?? ''}${friend.is_counter ? ', counts toward index' : ''}`}
          >
            <GlassGrossRing
              value={friend.score != null ? friend.score : EM_DASH}
              isCounter={!!friend.is_counter}
              numeralSize={28}
            />
          </span>
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

      {showShape && (
        <>
          <div style={{ ...HAIR, margin: '10px 0 8px' }} />
          <CinemaCardShapeStrip holes={holes!} />
        </>
      )}
    </GlassShell>
  );
};

export default HeroGlassEnriched;
