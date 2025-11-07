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

      // Find shares for this analysis
      const { data: shares, error: sharesErr } = await supabase
        .from('swing_shares')
        .select('id')
        .eq('analysis_id', analysisId);

      if (sharesErr) throw sharesErr;
      const shareIds = (shares ?? []).map((s: any) => s.id);
      if (shareIds.length === 0) return [];

      // Fetch feedback tied to those shares
      const { data, error } = await supabase
        .from('coach_feedback')
        .select('id, author, message, attachments, created_at, share_id')
        .in('share_id', shareIds)
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
