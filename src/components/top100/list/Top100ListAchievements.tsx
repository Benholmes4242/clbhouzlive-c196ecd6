import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ListAchievementProgress {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  current: number;
  target: number;
}

interface Top100ListAchievementsProps {
  achievements: ListAchievementProgress[];
}

export const Top100ListAchievements: React.FC<Top100ListAchievementsProps> = ({
  achievements,
}) => {
  const navigate = useNavigate();

  if (achievements.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="px-2.5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Achievements tied to this list
        </h2>
        <button
          onClick={() => navigate('/profile')}
          className="text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          See all →
        </button>
      </div>

      <div className="mt-3 pl-4 pr-2 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {achievements.map((ach) => {
          const pct = Math.min(ach.current / ach.target, 1);
          const nearly = pct >= 0.8 && pct < 1;
          const isComplete = pct >= 1;

          return (
            <div
              key={ach.id}
              className="min-w-[150px] rounded-2xl bg-white shadow-sm px-3 py-3 flex flex-col border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{ach.emoji}</span>
                <div className="text-[13px] font-semibold leading-tight text-slate-900">
                  {ach.title}
                </div>
              </div>
              <div className="mt-1 text-[12px] text-slate-500">{ach.subtitle}</div>
              
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-500'
                      : nearly
                      ? 'bg-[#F3B13E]'
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              
              <div className="mt-1 text-[11px] text-slate-500">
                {ach.current}/{ach.target} courses
                {isComplete && (
                  <span className="ml-1 font-semibold text-emerald-600">· Complete!</span>
                )}
                {nearly && !isComplete && (
                  <span className="ml-1 font-semibold text-[#F3B13E]">· Almost there</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
