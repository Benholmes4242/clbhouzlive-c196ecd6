/**
 * Game Expanded Primary Info
 * Shows badge, course name, tee time, player count
 */

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
  const startDate = new Date(startTime);
  const timePretty = startDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span 
          className="px-2 py-0.5 rounded-md text-[12px] font-semibold"
          style={{ 
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--hub-text-body)',
          }}
        >
          {kind}
        </span>
        <div className="text-[15px] font-semibold" style={{ color: 'var(--hub-text-bright)' }}>
          {courseName || 'Golf Course'}
        </div>
      </div>
      <div className="text-[13px]" style={{ color: 'var(--hub-text-body)', opacity: 0.7 }}>
        {timePretty} • 18 holes
      </div>
      <div className="text-[13px]" style={{ color: 'var(--hub-text-body)', opacity: 0.7 }}>
        {playerCount}/{slotsTotal} players
      </div>
    </div>
  );
}
