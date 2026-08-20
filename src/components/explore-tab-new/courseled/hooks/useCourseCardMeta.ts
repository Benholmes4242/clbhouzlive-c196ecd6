import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useCourseCardMeta — name, region line and hero image for a set of catalogue
 * course ids. One round-trip, shared by every course-led Discover section so
 * the atom always carries the same region and imagery.
 */

export interface CourseCardMeta {
  id: string;
  name: string;
  /** "Kent", "Perthshire" — the tightest place name we hold. */
  region: string | null;
  /** Macro area, the Courses browse vocabulary: "Britain & Ireland". */
  country: string | null;
  /** Nation: "Scotland", "England". */
  subCountry: string | null;
  imageUrl: string | null;
}

export function useCourseCardMeta(courseIds: string[]) {
  const key = Array.from(new Set(courseIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['courseled', 'course-meta', key.join('|')],
    queryFn: async (): Promise<Map<string, CourseCardMeta>> => {
      const out = new Map<string, CourseCardMeta>();
      if (key.length === 0) return out;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, sub_country, country, thumbnail_image')
        .in('id', key);
      if (error) throw error;
      for (const c of (data ?? []) as Array<{
        id: string;
        name: string;
        region: string | null;
        sub_country: string | null;
        country: string;
        thumbnail_image: string | null;
      }>) {
        out.set(c.id, {
          id: c.id,
          name: c.name,
          region: c.region || c.sub_country || c.country || null,
          country: c.country || null,
          subCountry: c.sub_country || null,
          imageUrl: c.thumbnail_image ?? null,
        });
      }
      return out;
    },
    enabled: key.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
