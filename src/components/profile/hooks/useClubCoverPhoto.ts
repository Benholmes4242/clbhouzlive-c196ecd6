import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useClubCoverPhoto — the home club's own course photo for a member's cover
 * fallback. Same rule BusinessProfilePage applies to clubCourseImage: the
 * club's courses in created_at order, first non-empty thumbnail_image, else
 * null — so a member's cover matches their club's page.
 *
 * Callers own visibility: pass a club id only when the home club is allowed to
 * supply a photo (useProfileClubs already withholds a hidden home club).
 */
export const useClubCoverPhoto = (clubId: string | null | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['club-cover-photo', clubId ?? null],
    enabled: !!clubId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('golf_courses')
        .select('thumbnail_image')
        .eq('club_id', clubId as string)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useClubCoverPhoto] Course query error:', error);
        return null;
      }

      const first = (rows ?? []).find(
        (r) => typeof r.thumbnail_image === 'string' && r.thumbnail_image.trim() !== '',
      );
      return first?.thumbnail_image ?? null;
    },
  });

  return { coverPhoto: data ?? null, isLoading };
};

export default useClubCoverPhoto;
