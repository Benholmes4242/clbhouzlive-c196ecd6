
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_app_connected: boolean | null;
  eg_handicap_index: number | null;
  eg_recent_rounds: any | null;
  bag_visible: boolean | null;
  tracker_visible: boolean | null;
  eg_visible: boolean | null;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export const useProfileData = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackerStats, setTrackerStats] = useState<{ [cat: string]: number }>({});
  const [totalStats, setTotalStats] = useState<{ [cat: string]: number }>({});

  const fetchProfile = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', id).maybeSingle();
    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const fetchTrackerStats = async (userId: string) => {
    // Fetch played courses with their golf course details
    const { data: userCourses } = await supabase
      .from('user_courses')
      .select(`
        course_id,
        played,
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
      .eq('played', true);

    let stats: { [cat: string]: number } = {
      'GB&I': 0,
      'Europe': 0,
      'USA': 0,
      'Global': 0
    };
    
    let totals: { [cat: string]: number } = {
      'GB&I': 100,
      'Europe': 100,
      'USA': 100,
      'Global': 100
    };

    if (userCourses) {
      userCourses.forEach(userCourse => {
        const course = userCourse.golf_courses;
        if (!course) return;

        // Global - courses with global rank <= 100
        if (course.global_rank && course.global_rank <= 100) {
          stats['Global']++;
        }

        // GB&I - courses with regional rank <= 100 in GB&I countries
        if (course.regional_rank && course.regional_rank <= 100) {
          const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
          if (gbiCountries.includes(course.country)) {
            stats['GB&I']++;
          }
        }

        // Europe - courses with regional rank <= 100 in Europe (excluding GB&I)
        if (course.regional_rank && course.regional_rank <= 100 && course.continent === 'Europe') {
          const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
          if (!gbiCountries.includes(course.country)) {
            stats['Europe']++;
          }
        }

        // USA - courses with regional rank <= 100 in USA
        if (course.regional_rank && course.regional_rank <= 100 && course.country === 'United States') {
          stats['USA']++;
        }
      });
    }

    setTrackerStats(stats);
    setTotalStats(totals);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      if (data?.user) {
        fetchProfile(data.user.id);
        fetchTrackerStats(data.user.id);
      } else {
        setProfile(null);
        setTrackerStats({});
        setTotalStats({});
        setLoading(false);
      }
    });
  }, []);

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
