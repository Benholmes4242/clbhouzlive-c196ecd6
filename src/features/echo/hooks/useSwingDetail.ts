import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SwingDetail = {
  id: string;
  created_at: string;
  video_url: string | null;
  session_id: string | null;
  swing_context: string | null;
  analysis_results: any;
  thread_id?: string | null;
};

export function useSwingDetail(id?: string) {
  return useQuery({
    queryKey: ['swing-detail', id],
    enabled: !!id,
    queryFn: async (): Promise<SwingDetail | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .select('id, created_at, video_url, session_id, swing_context, analysis_results, thread_id')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as SwingDetail;
    },
  });
}
