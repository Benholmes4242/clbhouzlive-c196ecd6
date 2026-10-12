/**
 * ProfileSheetV2 · Your courses (E). Three figures and the door, no sentence.
 *
 * NO TOP 100 FIGURE ON THIS SHEET, FROM ANY SOURCE (E.1): two count definitions
 * exist and the first already disagreed with the Leaderboards board.
 * A cell with no figure shows its label and an em dash; the grid keeps three
 * columns. No courses → no card (E.4).
 */
import React from 'react';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseFigures } from '../sheetState';
import { CARD, CardHead, Door } from './sheetCardParts';

const DASH = '\u2014';

const Cell: React.FC<{ label: string; value: string | null; sub: string | null }> = ({ label, value, sub }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    <div style={{ fontSize: 21, fontWeight: 800, marginTop: 3, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{value ?? DASH}</div>
    {sub && <div style={{ fontSize: 10, fontWeight: 600, color: A.DIM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
  </div>
);

const CoursesCard: React.FC<{ figures: CourseFigures | null; onOpen: () => void }> = ({ figures, onOpen }) => {
  if (!figures) return null;
  return (
    <div data-card="courses" style={CARD}>
      <CardHead label="Your courses" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 11 }}>
        <Cell label="Played" value={String(figures.played)} sub={`${figures.playedThisYear} this year`} />
        <Cell label="Rounds" value={String(figures.rounds)} sub={`across ${figures.played} ${figures.played === 1 ? 'course' : 'courses'}`} />
        <Cell label="Lowest round" value={figures.lowest ? String(figures.lowest.gross) : null} sub={figures.lowest?.name ?? null} />
      </div>
      <Door label="Course analytics" onClick={onOpen} style={{ marginTop: 12 }} />
    </div>
  );
};

export default CoursesCard;
