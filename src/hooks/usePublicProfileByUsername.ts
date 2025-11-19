import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
};

export function usePublicProfileByUsername(username?: string) {
  return useQuery<PublicProfile | null>({
    queryKey: ['public-profile', username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) return null;

      const { data, error } = await supabase
        .from('user_profiles' as any)
        .select('id, username, display_name, profile_photo_url')
        .eq('username', username)
        .single();

      if (error) throw error;
      return (data as any as PublicProfile);
    },
    staleTime: 60_000,
  });
}
