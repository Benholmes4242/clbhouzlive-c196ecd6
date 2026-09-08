/**
 * BRIEF_CHAMPIONS_TAB_REBUILD §3.3 + §3.4.
 *
 * UNCLAIMED names the boards nobody holds — a sentence, not seven dashed
 * boxes. WHAT COUNTS is the footnote that replaces ChampionsInfoCarousel:
 * nobody needs the definition before they have seen the thing being defined.
 */
import React from 'react';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { AboutSection } from '@/components/courses/course-detail/about/AboutSection';
import { FlatAction, numberWord } from './championsFlatBits';

function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export const UnclaimedSection: React.FC<{
  /** Lower-case board names with no holder, e.g. ['ace', 'albatross', 'eagle']. */
  names: string[];
  onAllBoards: () => void;
  /** State A copy — nothing has been posted here at all. */
  allUnclaimed?: boolean;
  totalBoards?: number;
}> = ({ names, onAllBoards, allUnclaimed = false, totalBoards = 7 }) => {
  if (names.length === 0) return null;
  const n = names.length;
  const sentence = allUnclaimed
    ? `All ${numberWord(totalBoards, false)} boards are there for the taking.`
    : `${n} ${n === 1 ? 'board' : 'boards'} here ${n === 1 ? 'has' : 'have'} never been claimed — ${list(names)}.`;

  return (
    <AboutSection heading="Unclaimed">
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: A.MUTE, lineHeight: 1.5 }}>
        {sentence}
      </div>
      {!allUnclaimed ? <FlatAction label="All boards" onPress={onAllBoards} /> : null}
    </AboutSection>
  );
};

export const WhatCounts: React.FC = () => (
  <div style={{ marginTop: 34, padding: '0 20px' }}>
    <div style={{ height: 1, background: A.HAIRLINE }} aria-hidden="true" />
    <div
      style={{
        marginTop: 12,
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

/** §5 state A — nobody has posted a round here. Two sections and the footnote. */
export const NobodyHasPlayed: React.FC<{ totalBoards?: number }> = ({ totalBoards = 7 }) => (
  <div style={{ paddingTop: 18 }}>
    <AboutSection heading="Champions">
      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: A.MUTE, lineHeight: 1.5 }}>
        Nobody has posted a round here yet. Post the first and you top every board — gross,
        stableford, birdies — until someone beats you.
      </div>
    </AboutSection>
    <UnclaimedSection names={['all']} onAllBoards={() => {}} allUnclaimed totalBoards={totalBoards} />
    <WhatCounts />
  </div>
);

export default UnclaimedSection;
