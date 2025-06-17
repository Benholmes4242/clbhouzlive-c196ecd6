
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export const useProfileData = () => {
  const { user } = useSupabaseSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trackerStats, setTrackerStats] = useState<{ [cat: string]: number }>({});
  const [totalStats] = useState({ 'GB&I': 100, 'Europe': 100, 'USA': 100, 'Global': 100 });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTrackerStats = async (userId: string) => {
    try {
      console.log('Fetching tracker stats for user:', userId);
      
      // Fetch played courses with their golf course details from the correct table
      const { data: userCourses, error } = await supabase
        .from('user_course_tracker')
        .select(`
          course_id,
          checked,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank
          )
        `)
        .eq('user_id', userId)
        .eq('checked', true);

      if (error) {
        console.error('Error fetching user courses:', error);
        throw error;
      }

      console.log('User courses data:', userCourses);

      let stats: { [cat: string]: number } = {
        'GB&I': 0,
        'Europe': 0,
        'USA': 0,
        'Global': 0
      };

      if (userCourses && userCourses.length > 0) {
        userCourses.forEach(userCourse => {
          const course = userCourse.golf_courses;
          if (!course) {
            console.log('No golf course data for course ID:', userCourse.course_id);
            return;
          }

          console.log('Processing course:', course.name, {
            global_rank: course.global_rank,
            regional_rank: course.regional_rank,
            country: course.country,
            continent: course.continent
          });

          // Global - courses with global rank <= 100
          if (course.global_rank && course.global_rank <= 100) {
            stats['Global']++;
            console.log('Added to Global:', course.name);
          }

          // GB&I - courses with regional rank <= 100 in GB&I countries
          if (course.regional_rank && course.regional_rank <= 100) {
            const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
            if (gbiCountries.includes(course.country)) {
              stats['GB&I']++;
              console.log('Added to GB&I:', course.name);
            }
          }

          // Europe - courses with regional rank <= 100 in Europe (excluding GB&I)
          if (course.regional_rank && course.regional_rank <= 100 && course.continent === 'Europe') {
            const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
            if (!gbiCountries.includes(course.country)) {
              stats['Europe']++;
              console.log('Added to Europe:', course.name);
            }
          }

          // USA - courses with regional rank <= 100 in USA
          if (course.regional_rank && course.regional_rank <= 100 && course.country === 'United States') {
            stats['USA']++;
            console.log('Added to USA:', course.name);
          }
        });
      }

      console.log('Final tracker stats:', stats);
      setTrackerStats(stats);
    } catch (error) {
      console.error('Error fetching tracker stats:', error);
      setTrackerStats({});
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchProfile(user.id),
        fetchTrackerStats(user.id)
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  return {
    user,
    profile,
    loading,
    trackerStats,
    totalStats,
    setProfile,
    fetchProfile,
    fetchTrackerStats
  };
};
