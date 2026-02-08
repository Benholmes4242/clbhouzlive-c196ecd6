import React from 'react';
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CourseTop100SpotlightProps = {
  courseId: string;
  courseName: string;
};

export const CourseTop100Spotlight: React.FC<CourseTop100SpotlightProps> = ({
  courseId,
  courseName,
}) => {
  const { data, isLoading } = useTop100CourseInsights(courseId);
  const { user } = useSupabaseSession();
  const { data: top100Progress } = useTop100ProgressForUser(user?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-card rounded-2xl border border-amber-100 p-5 overflow-hidden relative">
        <div className="mb-1 h-4 w-32 animate-pulse rounded bg-amber-100/50" />
        <div className="mb-2 h-3 w-56 animate-pulse rounded bg-amber-100/50" />
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-amber-100/50" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-amber-100/50" />
        </div>
      </div>
    );
  }

  if (!data || !data.list_memberships || data.list_memberships.length === 0) {
    return null;
  }

  const handleChipTap = (listSlug: string) => {
    navigate(`/top100?list=${listSlug}`);
  };

  const listCount = data.list_memberships.length;

  // Build a map from list slug to progress data
  const progressBySlug = new Map(
    (top100Progress?.lists ?? []).map(l => [l.listSlug, l])
  );

  // Find the best progress (highest completion %) for the progress bar
  const relevantProgress = data.list_memberships
    .map(m => progressBySlug.get(m.list_slug))
    .filter((p): p is NonNullable<typeof p> => !!p && p.total > 0);

  const bestProgress = relevantProgress.length > 0
    ? relevantProgress.reduce((best, current) =>
        (current.played / current.total) > (best.played / best.total) ? current : best
      )
    : null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-card rounded-2xl border border-amber-100 p-5 overflow-hidden relative">
      {/* Subtle decorative element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Top 100 Spotlight</h3>
            <p className="text-xs text-muted-foreground">
              Appears in {listCount} prestigious {listCount === 1 ? 'list' : 'lists'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {data.list_memberships.map((list) => {
            const progress = progressBySlug.get(list.list_slug);

            return (
              <button
                key={list.list_slug}
                type="button"
                onClick={() => handleChipTap(list.list_slug)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-full bg-card border border-amber-200 text-sm font-medium text-foreground hover:border-amber-300 hover:bg-amber-50 transition-colors active:scale-[0.97]"
              >
                <span>{list.list_name}</span>
                {progress && progress.played > 0 && (
                  <>
                    <span className="text-amber-300">·</span>
                    <span className="text-amber-600 tabular-nums">
                      {progress.played}/{progress.total}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress bar for best list */}
        {bestProgress && bestProgress.played > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                Your Top 100 Journey
              </span>
              <span className="text-xs font-medium text-amber-600 tabular-nums">
                {bestProgress.played} of {bestProgress.total} played
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${(bestProgress.played / bestProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};