import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CoachFeedbackItem = {
  id: string;
  author: string; // 'coach' or 'user'
  message: string;
  created_at: string;
  attachments?: any;
};

export function useSwingCoachFeedback(analysisId?: string) {
  return useQuery({
    queryKey: ['swing-coach-feedback', analysisId],
    enabled: !!analysisId,
    queryFn: async (): Promise<CoachFeedbackItem[]> => {
      if (!analysisId) return [];

      // Query coach_feedback directly, filtering via inner join on swing_shares
      const { data, error } = await supabase
        .from('coach_feedback')
        .select('id, author, message, attachments, created_at, share_id, swing_shares!inner(analysis_id)')
        .eq('swing_shares.analysis_id', analysisId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        author: d.author,
        message: d.message,
        created_at: d.created_at,
        attachments: d.attachments,
      }));
    },
  });
}
