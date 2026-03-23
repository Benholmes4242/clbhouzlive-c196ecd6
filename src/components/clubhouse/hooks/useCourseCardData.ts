import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseCardData {
  globalRank: number | null;
  latitude: number | null;
  longitude: number | null;
  thumbnailImage: string | null;
  hasHostedMajor: boolean | null;
  country: string | null;
  region: string | null;
  subCountry: string | null;
  courseType: string | null;
  regionalRank: number | null;
  countryRank: number | null;
  majorChampionships: string[] | null;
}

export function useCourseCardData(courseId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['course-card-data', courseId],
    queryFn: async (): Promise<CourseCardData> => {
      if (!courseId) throw new Error('No course id');
      const { data, error } = await supabase
        .from('golf_courses')
        .select('global_rank, latitude, longitude, thumbnail_image, has_hosted_major, country, region, sub_country, course_type, regional_rank, country_rank, major_championships')
        .eq('id', courseId)
        .maybeSingle();
      if (error || !data) throw new Error('Course not found');
      return {
        globalRank: data.global_rank,
        latitude: data.latitude,
        longitude: data.longitude,
        thumbnailImage: data.thumbnail_image,
        hasHostedMajor: data.has_hosted_major,
        country: data.country,
        region: data.region,
        subCountry: data.sub_country,
        courseType: data.course_type,
        regionalRank: data.regional_rank,
        countryRank: data.country_rank,
        majorChampionships: data.major_championships,
      };
    },
    enabled: !!courseId && enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
