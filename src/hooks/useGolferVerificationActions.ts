import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to accept a golfer verification invite
 */
export function useAcceptGolferInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      evidenceUrl,
      note,
    }: {
      requestId: string;
      evidenceUrl?: string;
      note?: string;
    }) => {
      const { error } = await supabase.rpc('accept_golfer_verification_invite', {
        p_request_id: requestId,
        p_evidence_url: evidenceUrl || null,
        p_note: note || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification request submitted', {
        description: "We'll review your request and notify you once a decision is made.",
      });
      queryClient.invalidateQueries({ queryKey: ['golfer-verification-request'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-notifications'] });
    },
    onError: (error: any) => {
      toast.error('Failed to submit verification request', {
        description: error.message || 'Please try again later.',
      });
    },
  });
}

/**
 * Hook to decline a golfer verification invite
 */
export function useDeclineGolferInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      note,
    }: {
      requestId: string;
      note?: string;
    }) => {
      const { error } = await supabase.rpc('decline_golfer_verification_invite', {
        p_request_id: requestId,
        p_note: note || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("No worries — you can accept later if you change your mind.");
      queryClient.invalidateQueries({ queryKey: ['golfer-verification-request'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-notifications'] });
    },
    onError: (error: any) => {
      toast.error('Failed to decline invite', {
        description: error.message || 'Please try again later.',
      });
    },
  });
}
