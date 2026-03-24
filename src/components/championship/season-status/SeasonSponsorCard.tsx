import React from 'react';

interface SeasonSponsorCardProps {
  sponsorName: string;
  prizeDescription: string;
  seasonColor: string;
  seasonLabel: string;
  leaderCourses: number;
  yourCourses: number;
  yourSeasonRank: number;
  totalSeasonPlayers: number;
  daysRemaining: number;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const SeasonSponsorCard: React.FC<SeasonSponsorCardProps> = ({
  sponsorName,
  prizeDescription,
  seasonColor,
  seasonLabel,
  leaderCourses,
  yourCourses,
  yourSeasonRank,
  totalSeasonPlayers,
  daysRemaining,
}) => {
  const gap = Math.max(0, leaderCourses - yourCourses);
  const progressPercent = leaderCourses > 0 ? Math.min(100, (yourCourses / leaderCourses) * 100) : 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 20,
        border: `1.5px solid ${seasonColor}30`,
        boxShadow: `0 0 24px ${seasonColor}08, 0 4px 16px rgba(0,0,0,0.05)`,
        background: `linear-gradient(150deg, ${seasonColor}06, ${seasonColor}02)`,
      }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 35%, ${seasonColor}05 50%, transparent 65%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmerSeason 4s linear infinite',
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${seasonColor}, ${seasonColor}20)`,
        }}
      />

      <div className="relative px-4 py-4 space-y-3">
        {/* Sponsored-by row */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Season sponsored by
            </p>
            <p className="text-[17px] font-black mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>
              {sponsorName}
            </p>
          </div>
          <span
            className="flex-shrink-0 px-3 py-1 text-[11px] font-bold rounded-full"
            style={{
              backgroundColor: seasonColor,
              color: 'white',
            }}
          >
            🏆 Prize
          </span>
        </div>

        {/* Prize box */}
        <div
          className="px-3 py-2.5"
          style={{
            borderRadius: 12,
            backgroundColor: `${seasonColor}06`,
            border: `1px solid ${seasonColor}12`,
          }}
        >
          <p className="text-[13px] font-semibold" style={{ color: seasonColor }}>
            🎁 {prizeDescription}
          </p>
          <p
            className="text-[11px] mt-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Most Top 100 courses played during {seasonLabel} wins
          </p>
        </div>

        {/* Race progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              You — {yourCourses} this season
            </span>
            <span className="text-[12px] font-semibold" style={{ color: seasonColor }}>
              Leader — {leaderCourses}
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="w-full overflow-hidden"
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'hsl(var(--muted) / 0.4)',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: 4,
                background: `linear-gradient(90deg, ${seasonColor}, ${seasonColor}99)`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {gap > 0 ? `${gap} behind the lead` : gap === 0 && yourCourses > 0 ? "You're in the lead!" : 'Play a course to start'}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: seasonColor }}>
              {ordinal(yourSeasonRank)} of {totalSeasonPlayers}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmerSeason {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default SeasonSponsorCard;
