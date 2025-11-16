import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  points: number;
  sortOrder: number;
}

export function useAchievementCatalogue() {
  return useQuery({
    queryKey: ['achievements-catalogue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements' as any)
        .select('id, code, name, description, category, points, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any): Achievement => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category,
        points: row.points ?? 0,
        sortOrder: row.sort_order ?? 0,
      }));
    },
    staleTime: 5 * 60_000,
  });
}
