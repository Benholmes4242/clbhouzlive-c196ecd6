import React from 'react';
import { DualPillBar } from './DualPillBar';

interface CategoryScoreCardProps {
  title: string;
  userScore: number | null;
  communityScore: number | null;
  icon?: React.ReactNode; // optional future icon
}

export const CategoryScoreCard: React.FC<CategoryScoreCardProps> = ({
  title,
  userScore,
  communityScore,
  icon,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      <DualPillBar userScore={userScore} communityScore={communityScore} />
    </div>
  );
};
