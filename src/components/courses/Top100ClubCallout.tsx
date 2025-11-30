import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { Button } from '@/components/ui/button';
import { getRingLabel, getTop100Title } from '@/lib/top100Prestige';

const Top100ClubCallout: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: progress } = useTop100ProgressForUser(session?.user?.id);

  const totalPlayed = progress?.total_played_top100 || 0;
  const regionsCount = progress?.regions_count || 0;
  const ringLabel = progress?.prestige_ring ? getRingLabel(progress.prestige_ring) : null;
  const clubTitle = getTop100Title(totalPlayed);
  
  // Calculate total courses across all lists for percentage
  const totalInAllLists = (progress?.lists || []).reduce((sum, list) => sum + list.total, 0);
  const progressPercent = totalInAllLists > 0
    ? Math.min((totalPlayed / totalInAllLists) * 100, 100)
    : 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Pill - tight spacing */}
      {session && totalPlayed > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/3 px-4 py-2 text-sm text-slate-900">
          <span className="text-amber-500">🏆</span>
          <span className="font-medium">
            You&apos;ve played {totalPlayed} Top 100 course{totalPlayed === 1 ? '' : 's'}
          </span>
          {ringLabel && <span className="text-slate-500">· {ringLabel}</span>}
          {clubTitle && <span className="text-slate-500">· {clubTitle}</span>}
        </div>
      )}

      {/* Top 100 Club panel */}
      <section className="rounded-3xl border border-slate-100 bg-white/90 px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        {/* Row 1 – header + count */}
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-slate-900">
              Top 100 Club
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track your pilgrimage through the world&apos;s Top 100 courses.
            </p>
          </div>
          {session && totalInAllLists > 0 && (
            <div className="text-right text-sm text-slate-500">
              {totalPlayed} played
            </div>
          )}
        </div>

        {/* Row 2 – progress bar */}
        {session && totalPlayed > 0 && (
          <div className="mb-2 h-[6px] w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Row 3 – stats line */}
        {session && totalPlayed > 0 && (
          <p className="text-xs text-slate-500">
            Across {regionsCount} {regionsCount === 1 ? 'region' : 'regions'}
            {clubTitle && <> · {clubTitle}</>}
            {ringLabel && <> · {ringLabel}</>}
          </p>
        )}

        {/* Row 4 – CTA */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="primary"
            onClick={() => {
              if (session) {
                navigate('/top100?tab=my-progress');
              } else {
                navigate('/auth?redirect=/top100?tab=my-progress');
              }
            }}
            className="w-full sm:w-auto"
          >
            {session ? 'Open Top 100 Journey' : 'Sign in to join the Top 100 Club'}
          </Button>

          {session && (
            <button
              onClick={() => navigate('/top100')}
              className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              View Top 100 hub →
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Top100ClubCallout;
