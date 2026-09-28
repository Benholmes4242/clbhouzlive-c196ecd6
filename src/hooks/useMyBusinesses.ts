import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessMembership {
  id: string;
  role: 'owner' | 'admin' | 'editor' | 'analyst';
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    logo_url: string | null;
    is_verified: boolean;
    is_deleted: boolean | null;
    club_id: string | null;
  };
  /** Every course the business's club owns (golf_courses by club_id), by name.
   *  Empty when the business has no club. */
  clubCourses: { id: string; name: string }[];
}

/**
 * Fetch all businesses the current user is a member of
 */
export function useMyBusinesses(userProfileId?: string) {
  return useQuery({
    queryKey: ['my-businesses', userProfileId],
    enabled: !!userProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          id,
          role,
          business:business_accounts (
            id,
            name,
            slug,
            category,
            location,
            city,
            region,
            country,
            logo_url,
            is_verified,
            is_deleted,
            club_id
          )
        `)
        .eq('user_profile_id', userProfileId);

      if (error) throw error;
      
      // Filter out deleted businesses
      const rows = (data ?? []).map(item => ({
        id: item.id,
        role: item.role as BusinessMembership['role'],
        business: item.business as unknown as BusinessMembership['business'],
      })).filter(item => item.business !== null && !item.business.is_deleted);

      // ONE read for every club's courses — counted from golf_courses by
      // club_id, never business_claimed_courses (empty even on verified clubs).
      const clubIds = [...new Set(rows.map(r => r.business.club_id).filter((v): v is string => !!v))];
      const byClub = new Map<string, { id: string; name: string }[]>();
      if (clubIds.length) {
        const { data: courses, error: cErr } = await supabase
          .from('golf_courses')
          .select('id, name, club_id')
          .in('club_id', clubIds)
          .order('name');
        if (cErr) throw cErr;
        for (const c of (courses ?? []) as { id: string; name: string; club_id: string }[]) {
          const list = byClub.get(c.club_id) ?? [];
          list.push({ id: c.id, name: c.name });
          byClub.set(c.club_id, list);
        }
      }
      return rows.map(r => ({ ...r, clubCourses: r.business.club_id ? byClub.get(r.business.club_id) ?? [] : [] }));
    },
  });
}

/**
 * Check if user has any businesses they manage
 */
export function useHasBusinesses(userProfileId?: string) {
  const { data, isLoading } = useMyBusinesses(userProfileId);
  return {
    hasBusinesses: (data?.length ?? 0) > 0,
    isLoading,
    count: data?.length ?? 0,
  };
}
