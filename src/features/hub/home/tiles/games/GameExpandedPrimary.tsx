/**
 * Game Expanded Primary Info
 * Shows badge, course name, tee time, player count
 */

import { fmtDateTime } from './dateFormatters';

type GameExpandedPrimaryProps = {
  kind: 'Hosting' | 'Joined';
  courseName: string | null;
  startTime: string;
  slotsTotal: number;
  slotsOpen: number;
};

export function GameExpandedPrimary({ 
  kind, 
  courseName, 
  startTime,
  slotsTotal,
  slotsOpen,
}: GameExpandedPrimaryProps) {
  const playerCount = slotsTotal - slotsOpen;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[15px] font-semibold truncate" style={{ color: 'var(--hub-text-bright)' }}>
        {courseName || 'Golf Course'}
      </div>
      <div className="text-[13px]" style={{ color: 'var(--hub-text-body)', opacity: 0.7 }}>
        {fmtDateTime(startTime)} • 18 holes
      </div>
      <div className="text-[13px]" style={{ color: 'var(--hub-text-body)', opacity: 0.7 }}>
        {playerCount}/{slotsTotal} players
      </div>
    </div>
  );
}
