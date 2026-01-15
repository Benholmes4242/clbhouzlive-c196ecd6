import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Season {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_default: boolean;
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['current-season'],
    queryFn: async (): Promise<Season | null> => {
      const { data, error } = await supabase
        .from('seasons' as any)
        .select('id, slug, name, description, starts_at, ends_at, is_active, is_default')
        .eq('is_active', true)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Season | null;
    },
    staleTime: 60_000,
  });
}
