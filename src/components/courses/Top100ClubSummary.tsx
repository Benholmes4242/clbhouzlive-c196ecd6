import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { getTop100Title, getRingLabel } from '@/lib/top100Prestige';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Top100ClubSummary() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: progressData } = useTop100ProgressForUser(user?.id);

  const totalPlayed = progressData?.total_played_top100 ?? 0;
  const regionsCount = progressData?.regions_count ?? 0;
  const clubTitle = getTop100Title(totalPlayed);
  const ringLabel = getRingLabel(progressData?.prestige_ring);

  // Calculate total courses across all lists
  const totalInAllLists = progressData?.lists?.reduce((sum, list) => sum + list.total, 0) ?? 0;
  const progress = totalInAllLists > 0 ? Math.min(100, Math.round((totalPlayed / totalInAllLists) * 100)) : 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Pill - compact summary */}
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/[0.03] px-4 py-2 text-sm text-slate-900">
        <Trophy className="h-4 w-4 text-amber-500" />
        <span className="font-medium">
          You've played {totalPlayed} Top 100 course{totalPlayed !== 1 ? 's' : ''}
        </span>
        {ringLabel && <span className="text-slate-500">· {ringLabel}</span>}
        {clubTitle && <span className="text-slate-500">· {clubTitle}</span>}
      </div>

      {/* Top 100 Club panel */}
      <section className="rounded-3xl border border-slate-100 bg-white/90 px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        {/* Row 1 – header + count */}
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-slate-900">
              Top 100 Club
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track your pilgrimage through the world's Top 100 courses.
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            {totalPlayed} played{totalInAllLists ? ` of ${totalInAllLists}` : ''}
          </div>
        </div>

        {/* Row 2 – progress bar */}
        <div className="mb-2 h-[6px] w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Row 3 – stats line */}
        <p className="text-xs text-slate-500">
          Across {regionsCount ?? 0} region{regionsCount !== 1 ? 's' : ''}
          {clubTitle && <> · {clubTitle}</>}
          {ringLabel && <> · {ringLabel}</>}
        </p>

        {/* Row 4 – CTAs */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="primary"
            onClick={() => navigate('/top100?tab=my-progress')}
            className="w-full sm:w-auto"
          >
            Open Top 100 Journey
          </Button>

          <button
            onClick={() => navigate('/top100')}
            className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            View Top 100 hub →
          </button>
        </div>
      </section>
    </div>
  );
}
