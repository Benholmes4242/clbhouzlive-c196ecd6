import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DomainVerification {
  id: string;
  request_id: string;
  business_id: string;
  email: string;
  status: 'pending' | 'verified' | 'expired';
  created_at: string;
  expires_at: string;
  verified_at: string | null;
}

export function useDomainVerification(requestId?: string) {
  return useQuery({
    queryKey: ['domain-verification', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_domain_verifications')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DomainVerification | null;
    },
  });
}

export function useRequestDomainCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, domain }: { requestId: string; domain: string }) => {
      const { data, error } = await supabase.rpc('request_domain_verification', {
        p_request_id: requestId,
        p_domain: domain,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to request domain verification');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      toast({ title: 'Domain verification requested' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to request domain verification', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSendDomainCode(businessId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, email }: { requestId: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('send-domain-verification-code', {
        body: { requestId, businessId, email },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send verification code');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-verification'] });
      toast({ title: 'Verification code sent', description: 'Check your email for the 6-digit code' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send code', description: error.message, variant: 'destructive' });
    },
  });
}

export function useVerifyDomainCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ verificationId, code }: { verificationId: string; code: string }) => {
      const { data, error } = await supabase.rpc('verify_domain_code', {
        p_verification_id: verificationId,
        p_code: code,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Invalid code');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-verification'] });
      queryClient.invalidateQueries({ queryKey: ['business-verification-request'] });
      toast({ title: 'Domain verified!', description: 'Your business domain has been confirmed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
    },
  });
}
