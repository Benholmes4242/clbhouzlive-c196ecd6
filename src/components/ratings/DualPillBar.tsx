import React from 'react';

interface DualPillBarProps {
  userScore: number | null;
  communityScore: number | null;
}

const clampScore = (score: number | null) =>
  Math.max(0, Math.min(10, score ?? 0));

export const DualPillBar: React.FC<DualPillBarProps> = ({
  userScore,
  communityScore,
}) => {
  const userWidth = `${(clampScore(userScore) / 10) * 100}%`;
  const communityWidth = `${(clampScore(communityScore) / 10) * 100}%`;

  return (
    <div className="space-y-1.5">
      {/* Pills row */}
      <div className="flex gap-2">
        {/* You pill */}
        <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-200 ease-out"
            style={{ width: userScore == null ? '0%' : userWidth }}
          />
        </div>

        {/* Community pill */}
        <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-700 transition-all duration-200 ease-out"
            style={{ width: communityScore == null ? '0%' : communityWidth }}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-slate-700">
        <span>
          You{' '}
          {userScore != null ? userScore.toFixed(1) : '--'}
        </span>
        <span>
          Com{' '}
          {communityScore != null ? communityScore.toFixed(1) : '--'}
        </span>
      </div>
    </div>
  );
};
