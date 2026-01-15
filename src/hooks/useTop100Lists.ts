import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Top100List {
  id: string;
  slug: string;
  name: string;
  short_label: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export function useTop100Lists() {
  return useQuery({
    queryKey: ['top100-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top100_lists' as any)
        .select('id, slug, name, short_label, description, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return (data || []) as unknown as Top100List[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - this data rarely changes
  });
}
