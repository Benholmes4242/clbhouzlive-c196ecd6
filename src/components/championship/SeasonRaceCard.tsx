import React from 'react';

interface SeasonRaceCardProps {
  seasonLabel: string;
  seasonColor: string;
  yourCourses: number;
  leaderCourses: number;
  yourRank: number;
  totalPlayers: number;
  daysRemaining: number;
  majorsBonusActive?: boolean;
}

const getRankSuffix = (rank: number): string => {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * SeasonRaceCard — Compact card showing user's live position in the season race.
 * Only renders when yourCourses > 0.
 */
export const SeasonRaceCard: React.FC<SeasonRaceCardProps> = ({
  seasonLabel,
  seasonColor,
  yourCourses,
  leaderCourses,
  yourRank,
  totalPlayers,
  daysRemaining,
  majorsBonusActive = false,
}) => {
  if (yourCourses <= 0) return null;

  const trackSegments = 20;
  const filledSegments = Math.min(yourCourses, trackSegments);

  // Calculate gap to next rank
  const gap = leaderCourses - yourCourses;
  const rankAbove = yourRank > 1 ? yourRank - 1 : null;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 18,
        border: `1.5px solid ${seasonColor}20`,
        background: `linear-gradient(135deg, ${seasonColor}08, ${seasonColor}03)`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full"
        style={{
          background: `linear-gradient(90deg, ${seasonColor}, ${seasonColor}25)`,
        }}
      />

      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: `${seasonColor}90` }}
            >
              {seasonLabel} · Race
            </p>
            <p className="text-base font-extrabold text-foreground mt-0.5">
              Your Season Standing
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[32px] font-black leading-none"
              style={{ color: seasonColor }}
            >
              {yourRank}{getRankSuffix(yourRank)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              of {totalPlayers} players
            </p>
          </div>
        </div>

        {/* Track visualisation */}
        <div className="space-y-1.5">
          <div className="flex gap-[3px]">
            {Array.from({ length: trackSegments }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[6px]"
                style={{
                  borderRadius: 3,
                  backgroundColor:
                    i < filledSegments
                      ? seasonColor
                      : i === filledSegments
                        ? `${seasonColor}25`
                        : 'rgba(0,0,0,0.06)',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span
              className="text-[11px] font-semibold"
              style={{ color: seasonColor }}
            >
              {yourCourses} courses played
            </span>
            <span className="text-[11px] text-muted-foreground">
              Leader: {leaderCourses} · {daysRemaining}d left
            </span>
          </div>
        </div>

        {/* Bottom chips */}
        <div className="flex gap-2">
          {/* Gap chip */}
          <div
            className="flex-1 px-3 py-2 text-center"
            style={{
              borderRadius: 10,
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <p className="text-[10px] text-muted-foreground font-medium">
              {rankAbove ? `To reach ${rankAbove}${getRankSuffix(rankAbove)}` : 'You\'re #1!'}
            </p>
            <p
              className="text-[15px] font-extrabold"
              style={{ color: '#92400E' }}
            >
              {gap > 0 ? `+${gap} courses` : '🏆 Leading'}
            </p>
          </div>

          {/* Bonus / motivation chip */}
          <div
            className="flex-1 px-3 py-2 text-center"
            style={{
              borderRadius: 10,
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <p className="text-[10px] text-muted-foreground font-medium">
              {majorsBonusActive ? 'Majors count' : 'Keep playing'}
            </p>
            <p
              className="text-[15px] font-extrabold"
              style={{
                color: majorsBonusActive ? '#92400E' : '#92400E',
              }}
            >
              {majorsBonusActive ? '×2 pts' : 'Stay consistent'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
