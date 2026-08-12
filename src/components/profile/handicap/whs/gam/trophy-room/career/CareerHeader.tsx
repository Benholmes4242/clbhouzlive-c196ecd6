/**
 * Career record header. States what the record is drawn from, so every figure
 * below it has a stated sample. No level, no rank, no medal count.
 */
import React from 'react';
import { REC } from './tokens';
import { Kicker, Caption } from './Primitives';
import { yearOf, plural } from './format';
import type { CareerData } from './types';

interface Props {
  data: CareerData;
}

export const CareerHeader: React.FC<Props> = ({ data }) => {
  const { rounds, isFriendView, ownerFirstName } = data;
  const courses = new Set(
    rounds.map((r) => r.course_id || `name:${r.course_name ?? ''}`).filter(Boolean),
  ).size;
  const years = rounds.map((r) => yearOf(r.play_date)).filter((y): y is number => y !== null);
  const since = years.length > 0 ? Math.min(...years) : null;

  const title = isFriendView && ownerFirstName ? `${ownerFirstName}'s record` : 'Your record';

  return (
    <header style={{ padding: '14px 2px 16px', fontFamily: REC.FONT }}>
      <Kicker>CAREER RECORD</Kicker>
      <h2
        style={{
          margin: '8px 0 0',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: REC.INK,
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: 8 }}>
        <Caption>
          {rounds.length > 0 ? (
            <span style={REC.TABULAR}>
              {rounds.length} {plural(rounds.length, 'round', 'rounds')} across {courses}{' '}
              {plural(courses, 'course', 'courses')}
              {since ? ` since ${since}` : ''}
            </span>
          ) : (
            'No scored rounds on the record yet.'
          )}
        </Caption>
      </div>
    </header>
  );
};

export default CareerHeader;
