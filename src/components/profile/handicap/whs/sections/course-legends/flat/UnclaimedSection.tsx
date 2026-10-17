/**
 * BRIEF_CHAMPIONS_TAB_REBUILD §3.3 + §3.4.
 *
 * UNCLAIMED names the boards nobody holds — a sentence, not seven dashed
 * boxes. WHAT COUNTS is the footnote that replaced the old explainer carousel
 * (ChampionsInfoCarousel, deleted 10 Sep 2026):
 * nobody needs the definition before they have seen the thing being defined.
 */
import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { AboutSection } from '@/components/courses/course-detail/about/AboutSection';

function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export const UnclaimedSection: React.FC<{
  /** Lower-case board names with no holder, e.g. ['ace', 'albatross', 'eagle']. */
  names: string[];
}> = ({ names }) => {
  if (names.length === 0) return null;
  const n = names.length;
  const sentence = `${n} ${n === 1 ? 'board' : 'boards'} here ${n === 1 ? 'has' : 'have'} never been claimed, ${list(names)}.`;

  return (
    <AboutSection heading="Unclaimed">
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: A.MUTE, lineHeight: 1.5 }}>
        {sentence}
      </div>
    </AboutSection>
  );
};

export const WhatCounts: React.FC = () => (
  <div style={{ marginTop: 16, padding: '0 20px' }}>
    <div style={{ height: 1, background: A.HAIRLINE }} aria-hidden="true" />
    <div
      style={{
        marginTop: 16,
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 500,
        color: A.DIM,
        lineHeight: 1.5,
      }}
    >
      Boards rank official WHS scores only. A round has to be on your handicap record to count.
    </div>
  </div>
);

export default UnclaimedSection;
