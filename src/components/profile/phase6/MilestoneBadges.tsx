/**
 * MilestoneBadges - Phase 6: Soft recognition without gamification pressure
 * Subtle, modern badges for achievements
 */
import React from 'react';
import { Check, Star, MapPin, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface MilestoneBadgesProps {
  userId: string | undefined;
  isOwnProfile?: boolean;
  showPrivateToggle?: boolean;
  className?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: string;
}

export const MilestoneBadges: React.FC<MilestoneBadgesProps> = ({
  userId,
  isOwnProfile = false,
  showPrivateToggle = false,
  className,
}) => {
  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestone-badges', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Milestone[]> => {
      if (!userId) return [];

      // Get user's course count
      const { count: courseCount } = await supabase
        .from('course_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_mock', false);

      const playedCount = courseCount || 0;

      // Get first rating date
      const { data: firstRating } = await supabase
        .from('course_ratings')
        .select('created_at')
        .eq('user_id', userId)
        .eq('is_mock', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Check if user has played any Top 100 course
      const { data: top100Ratings } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', userId)
        .eq('is_mock', false);

      const { data: top100Memberships } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .in('course_id', top100Ratings?.map(r => r.course_id) || []);

      const hasTop100 = (top100Memberships?.length || 0) > 0;

      // Check for region completion (simplified - any region with 10+ courses)
      const { data: regionData } = await supabase
        .from('course_ratings')
        .select('golf_courses!inner(country)')
        .eq('user_id', userId)
        .eq('is_mock', false);

      const countryCount = new Map<string, number>();
      regionData?.forEach((r: any) => {
        const country = r.golf_courses?.country;
        if (country) {
          countryCount.set(country, (countryCount.get(country) || 0) + 1);
        }
      });
      const hasRegionComplete = Array.from(countryCount.values()).some(c => c >= 10);

      return [
        {
          id: 'first-course',
          name: 'First Course',
          description: 'Played your first course',
          icon: <Target className="h-4 w-4" />,
          unlocked: playedCount >= 1,
          unlockedAt: firstRating?.created_at,
        },
        {
          id: 'ten-courses',
          name: '10 Courses',
          description: 'Played 10 courses',
          icon: <Star className="h-4 w-4" />,
          unlocked: playedCount >= 10,
        },
        {
          id: 'twenty-five-courses',
          name: '25 Courses',
          description: 'Played 25 courses',
          icon: <Star className="h-4 w-4" />,
          unlocked: playedCount >= 25,
        },
        {
          id: 'first-top100',
          name: 'Top 100',
          description: 'Played a Top 100 course',
          icon: <Trophy className="h-4 w-4" />,
          unlocked: hasTop100,
        },
        {
          id: 'region-explorer',
          name: 'Explorer',
          description: '10+ courses in one country',
          icon: <MapPin className="h-4 w-4" />,
          unlocked: hasRegionComplete,
        },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-xl p-5", className)}>
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const unlockedMilestones = milestones?.filter(m => m.unlocked) || [];
  const lockedMilestones = milestones?.filter(m => !m.unlocked) || [];

  if (unlockedMilestones.length === 0 && !isOwnProfile) {
    return null; // Hide if no milestones and viewing someone else
  }

  return (
    <div className={cn("bg-white rounded-xl p-5 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Milestones</h3>
        {isOwnProfile && showPrivateToggle && (
          <span className="text-xs text-slate-400">Private</span>
        )}
      </div>

      {/* Unlocked milestones */}
      {unlockedMilestones.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {unlockedMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl"
              title={milestone.description}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                {milestone.icon}
              </div>
              <span className="text-sm font-medium text-emerald-800">
                {milestone.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {isOwnProfile 
            ? "Play courses to unlock milestones."
            : "No milestones unlocked yet."}
        </p>
      )}

      {/* Show next milestone for own profile */}
      {isOwnProfile && lockedMilestones.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Next milestone</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              {lockedMilestones[0].icon}
            </div>
            <span className="text-sm text-slate-600">
              {lockedMilestones[0].description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneBadges;
