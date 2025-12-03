import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TOP100_LIST_META, type Top100ListId } from '@/config/top100ListMilestones';
import { cn } from '@/lib/utils';

type ListStats = {
  playedCount: number;
  totalCount: number;
};

type StatsByList = Partial<Record<Top100ListId, ListStats>>;

interface Top100CompletedListsRowProps {
  statsByList: StatsByList;
}

export const Top100CompletedListsRow: React.FC<Top100CompletedListsRowProps> = ({
  statsByList,
}) => {
  const navigate = useNavigate();

  // Find lists where user has completed all courses
  const completed = TOP100_LIST_META.filter(meta => {
    const s = statsByList[meta.id];
    return s && s.playedCount >= s.totalCount && s.totalCount > 0;
  });

  if (completed.length === 0) return null;

  return (
    <section className="px-5 pt-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Lists you've completed
        </h2>
        <p className="text-xs text-muted-foreground">
          {completed.length} / {TOP100_LIST_META.length} lists
        </p>
      </div>

      <div className="-mx-1 flex overflow-x-auto pb-2 scrollbar-hide">
        {completed.map(meta => {
          const s = statsByList[meta.id]!;
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => navigate(`/top100/${meta.id}`)}
              className={cn(
                'mx-1.5 w-40 flex-shrink-0 rounded-2xl bg-card shadow-sm',
                'border border-emerald-200 px-3 py-3 text-left',
                'active:scale-[0.98] transition-all hover:shadow-md'
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                  {meta.emoji}
                </div>
                <div className="text-xs font-semibold text-foreground leading-tight">
                  {meta.shortLabel}
                </div>
              </div>
              <div className="mt-1.5 text-[11px] text-emerald-600 font-medium">
                List completed ✓
              </div>
              <div className="text-[11px] text-muted-foreground">
                {s.playedCount} / {s.totalCount} courses
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
