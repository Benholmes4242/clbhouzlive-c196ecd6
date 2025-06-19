
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RegionProgress {
  [key: string]: {
    played: number;
    total: number;
  };
}

export const useTop100CoursesData = (userId: string, isOwnProfile: boolean = false) => {
  const [regionProgress, setRegionProgress] = useState<RegionProgress>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchRegionProgress = async () => {
    try {
      // Fetch global/worldwide progress
      const { data: globalData, error: globalError } = await supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          user_top100_courses!left (
            played,
            user_id
          )
        `)
        .not('global_rank', 'is', null)
        .order('global_rank');

      if (globalError) {
        console.error('Error fetching global courses:', globalError);
        return;
      }

      // Calculate global progress
      const globalPlayed = globalData?.filter(course => 
        course.user_top100_courses?.some(utc => utc.user_id === userId && utc.played)
      ).length || 0;

      // Fetch Britain & Ireland progress (courses with regional_rank)
      const { data: britainIrelandData, error: biError } = await supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          user_top100_courses!left (
            played,
            user_id
          )
        `)
        .in('country', ['United Kingdom', 'Ireland'])
        .not('regional_rank', 'is', null)
        .order('regional_rank');

      if (biError) {
        console.error('Error fetching Britain & Ireland courses:', biError);
        return;
      }

      const biPlayed = britainIrelandData?.filter(course => 
        course.user_top100_courses?.some(utc => utc.user_id === userId && utc.played)
      ).length || 0;

      // Fetch USA courses
      const { data: usaData, error: usaError } = await supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          user_top100_courses!left (
            played,
            user_id
          )
        `)
        .eq('country', 'United States')
        .not('global_rank', 'is', null)
        .order('global_rank');

      if (usaError) {
        console.error('Error fetching USA courses:', usaError);
        return;
      }

      const usaPlayed = usaData?.filter(course => 
        course.user_top100_courses?.some(utc => utc.user_id === userId && utc.played)
      ).length || 0;

      // Fetch Europe courses (excluding UK/Ireland)
      const { data: europeData, error: europeError } = await supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          user_top100_courses!left (
            played,
            user_id
          )
        `)
        .eq('continent', 'Europe')
        .not('country', 'in', '("United Kingdom","Ireland")')
        .not('global_rank', 'is', null)
        .order('global_rank');

      if (europeError) {
        console.error('Error fetching Europe courses:', europeError);
        return;
      }

      const europePlayed = europeData?.filter(course => 
        course.user_top100_courses?.some(utc => utc.user_id === userId && utc.played)
      ).length || 0;

      setRegionProgress({
        global: {
          played: globalPlayed,
          total: globalData?.length || 100
        },
        'britain-ireland': {
          played: biPlayed,
          total: britainIrelandData?.length || 0
        },
        usa: {
          played: usaPlayed,
          total: usaData?.length || 0
        },
        europe: {
          played: europePlayed,
          total: europeData?.length || 0
        }
      });

    } catch (error) {
      console.error('Error fetching region progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityToggle = async (visible: boolean) => {
    if (!isOwnProfile) return;
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ top100_visible: visible })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating visibility:', error);
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRegionProgress();
    }
  }, [userId]);

  return {
    regionProgress,
    isLoading,
    handleVisibilityToggle: isOwnProfile ? handleVisibilityToggle : undefined
  };
};
