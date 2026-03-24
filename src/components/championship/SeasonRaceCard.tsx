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
  const isLeading = gap <= 0;

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
          <div className="text-right relative">
            {/* Subtle accent circle behind rank */}
            <div
              className="absolute -z-10"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: `${seasonColor}0F`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <p
              className="text-[36px] font-black leading-none"
              style={{ color: seasonColor }}
            >
              {yourRank}{getRankSuffix(yourRank)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              of {totalPlayers} players
            </p>
          </div>
        </div>

        {/* Track visualisation — 8px height */}
        <div className="space-y-1.5">
          <div className="flex gap-[3px]">
            {Array.from({ length: trackSegments }).map((_, i) => {
              const isFilled = i < filledSegments;
              const isLastFilled = i === filledSegments - 1;
              const isNextEmpty = i === filledSegments;
              return (
                <div
                  key={i}
                  className="flex-1 h-[8px] flex items-center"
                  style={{
                    borderRadius: isLastFilled ? '3px 999px 999px 3px' : 3,
                    backgroundColor: isFilled
                      ? seasonColor
                      : isNextEmpty
                        ? `${seasonColor}25`
                        : 'rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Position indicator after last filled segment */}
                  {isLastFilled && (
                    <span className="ml-auto -mr-2 text-[10px]">⛳</span>
                  )}
                </div>
              );
            })}
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
        {isLeading ? (
          /* Leading state — full-width celebration */
          <div
            className="relative overflow-hidden px-3 py-3 text-center"
            style={{
              borderRadius: 10,
              backgroundColor: `${seasonColor}08`,
              border: `1px solid ${seasonColor}25`,
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${seasonColor}, ${seasonColor}40)` }}
            />
            <p className="text-[15px] font-extrabold" style={{ color: seasonColor }}>
              🏆 You're leading!
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Gap chip */}
            <div
              className="flex-1 px-3 py-2 relative overflow-hidden"
              style={{
                borderRadius: 10,
                backgroundColor: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, ${seasonColor}, ${seasonColor}40)` }}
              />
              <p className="text-[10px] text-muted-foreground font-medium text-left">
                {rankAbove ? `To reach ${rankAbove}${getRankSuffix(rankAbove)}` : 'You\'re #1!'}
              </p>
              <p
                className="text-[15px] font-extrabold text-left"
                style={{ color: '#92400E' }}
              >
                +{gap} courses
              </p>
            </div>

            {/* Bonus / motivation chip */}
            <div
              className="flex-1 px-3 py-2 relative overflow-hidden"
              style={{
                borderRadius: 10,
                backgroundColor: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, ${seasonColor}, ${seasonColor}40)` }}
              />
              <p className="text-[10px] text-muted-foreground font-medium text-left">
                {majorsBonusActive ? 'Majors count' : 'Keep playing'}
              </p>
              <p
                className="text-[15px] font-extrabold text-left"
                style={{ color: '#92400E' }}
              >
                {majorsBonusActive ? '×2 pts' : 'Stay consistent'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
