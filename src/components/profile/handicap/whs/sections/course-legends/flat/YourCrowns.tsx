/**
 * BRIEF_CHAMPIONS_TAB_REBUILD §3.1 — YOUR CROWNS.
 *
 * A statement, not a cabinet. The seven-box CrownCabinet and ChampionsYouCard
 * are retired from this tab: seven dashed placeholders is a wall of nothing
 * for a member with no crowns, which is most members on most courses.
 *
 * ALWAYS ALL TIME. A crown is a claim on a course record; "you hold this over
 * 90 days" is a weaker and different claim, so the board's window toggle does
 * not reach this section.
 */
import React from 'react';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { numberWord } from './championsFlatBits';

export interface CrownHeld {
  /** Short board name, e.g. "Birdies". */
  label: string;
  attainedAt: string | null;
}

function tenurePhrase(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (days <= 1) return 'a day';
  if (days < 31) return `${numberWord(days, false)} days`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return m === 1 ? 'a month' : `${numberWord(m, false)} months`;
  }
  const y = Math.floor(days / 365);
  return y === 1 ? 'a year' : `${numberWord(y, false)} years`;
}

function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

interface Props {
  /** Absent for signed-out visitors. */
  signedOut?: boolean;
  /** No WHS connection — the boards still render, this becomes the invitation. */
  noHandicap?: boolean;
  onConnect?: () => void;
  /** All-time boards on this course. */
  totalBoards: number;
  held: CrownHeld[];
  /** Who holds the claimed boards, when the viewer holds none. */
  otherHolderName?: string | null;
  claimedCount?: number;
  otherHolderClaimedCount?: number;
}

export const YourCrowns: React.FC<Props> = ({
  signedOut = false,
  noHandicap = false,
  onConnect,
  totalBoards,
  held,
  otherHolderName = null,
  claimedCount = 0,
  otherHolderClaimedCount = 0,
}) => {
  if (signedOut) return null;

  if (noHandicap) {
    return (
      <div style={{ padding: '0 20px', fontFamily: SANS }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: A.MUTE, lineHeight: 1.5 }}>
          Connect your handicap to appear on these boards.
        </p>
        {onConnect ? (
          <button
            type="button"
            onClick={onConnect}
            style={{
              marginTop: 10,
              padding: '9px 16px',
              borderRadius: 999,
              border: 'none',
              background: A.INK,
              color: A.PANEL,
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Connect handicap
          </button>
        ) : null}
      </div>
    );
  }

  if (held.length === 0) {
    let sentence = `You hold none of the ${numberWord(totalBoards, false)} boards here yet.`;
    if (otherHolderName && claimedCount > 0) {
      const holds =
        otherHolderClaimedCount >= claimedCount
          ? claimedCount === 1
            ? 'holds the only one that has been claimed'
            : claimedCount === 2
              ? 'holds both that have been claimed'
              : `holds all ${numberWord(claimedCount, false)} that have been claimed`
          : `holds ${numberWord(otherHolderClaimedCount, false)} of the ${numberWord(claimedCount, false)} that have been claimed`;
      sentence = `You hold none of the ${numberWord(totalBoards, false)} boards here. ${otherHolderName} ${holds}.`;
    }
    return (
      <div style={{ padding: '0 20px', fontFamily: SANS }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: A.MUTE, lineHeight: 1.5 }}>{sentence}</p>
      </div>
    );
  }

  const phrases = held.map((h) => tenurePhrase(h.attainedAt));
  const allSame = phrases.every((p) => p && p === phrases[0]);
  const names = list(held.map((h) => h.label));
  let detail = names;
  if (allSame && phrases[0]) {
    detail =
      held.length === 1
        ? `${names}, held ${phrases[0]}`
        : held.length === 2
          ? `${names}, both held ${phrases[0]}`
          : `${names}, each held ${phrases[0]}`;
  }

  return (
    <div style={{ padding: '0 20px', fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ ...FIGS, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: A.AMBER, lineHeight: 1 }}>
          {held.length}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: A.INK, letterSpacing: '-0.01em' }}>
          {`of ${totalBoards} boards are yours`}
        </span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 500, color: A.MUTE, lineHeight: 1.45 }}>
        {`${detail}.`}
      </p>
    </div>
  );
};

export default YourCrowns;
