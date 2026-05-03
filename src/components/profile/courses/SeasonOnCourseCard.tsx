import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useUserSeasonXP } from '@/hooks/useUserSeasonXP';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { getSeasonLevel } from '@/utils/seasonLevels';

interface SeasonOnCourseCardProps {
  userId: string;
  isOwnProfile: boolean;
  roundsThisSeason?: number;
  newCoursesThisSeason?: number;
}

/**
 * Seasonal overview card showing activity this season.
 * Reuses existing season data hooks with refined UI.
 */
export const SeasonOnCourseCard: React.FC<SeasonOnCourseCardProps> = ({ 
  userId,
  isOwnProfile,
  roundsThisSeason = 0,
  newCoursesThisSeason = 0,
}) => {
  const navigate = useNavigate();
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(userId, currentSeason?.id);

  if (!currentSeason) return null;

  const seasonLevel = seasonXP ? getSeasonLevel(seasonXP.total_xp) : 'Rookie';
  const xpEarned = seasonXP?.total_xp ?? 0;

  // Empty state - no rounds this season
  const hasActivity = roundsThisSeason > 0 || xpEarned > 0;

  return (
    <div className="bg-gradient-to-br from-emerald-50/60 via-slate-50 to-slate-50/80 border border-slate-100 rounded-sq-lg p-5">
      {/* Header with season level pill */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            This season on course
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentSeason.name}
          </p>
        </div>
        {hasActivity && (
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-sq-pill">
            Season level: {seasonLevel}
          </span>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-400 mb-4">
        Rounds, new courses and XP reset each season.
      </p>

      {!hasActivity ? (
        // Empty state
        <div className="text-center py-4">
          <p className="text-sm text-slate-600 mb-1">
            You haven't logged any rounds this season yet.
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Add a round to start your season journey.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-sm"
          >
            View Season Hub
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{roundsThisSeason}</span> rounds
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{newCoursesThisSeason}</span> new courses
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{xpEarned.toLocaleString()}</span> XP
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile')}
            className="w-full text-sm"
          >
            View Season Hub
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </>
      )}
    </div>
  );
};