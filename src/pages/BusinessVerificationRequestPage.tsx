import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageRoot } from '@/components/layout/PageRoot';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const BusinessVerificationRequestPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  useHideBottomNav();
  useHideHeader();

  const [website, setWebsite] = useState('');
  const [note, setNote] = useState('');

  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['business-account-for-verification', id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, website, is_verified')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (business?.website) {
      setWebsite(business.website);
    }
  }, [business?.website]);

  const { data: existingRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['business-verification-request', id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('id, status')
        .eq('business_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingBusiness || isLoadingRequest;

  useEffect(() => {
    if (!isLoading && existingRequest?.status === 'pending') {
      navigate(`/business/${id}/verification/status`, { replace: true });
    }
    if (!isLoading && business?.is_verified) {
      navigate(`/business/${id}/verification/status`, { replace: true });
    }
  }, [isLoading, existingRequest, business, id, navigate]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!id) throw new Error('Business ID is missing');
      
      const { error } = await supabase
        .from('business_verification_requests')
        .insert({
          business_id: id,
          requested_by: user.id,
          website: website || null,
          note: note || null,
          status: 'pending',
        });

      if (error) throw error;

      if (website && website !== business?.website) {
        const { error: updateError } = await supabase
          .from('business_accounts')
          .update({ website })
          .eq('id', id);
        
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-account'] });
      queryClient.invalidateQueries({ queryKey: ['business-verification-request'] });
      navigate(`/business/${id}/verification/submitted`);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Failed to submit verification request');
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <div className="space-y-4 px-4 pt-4">
          <div className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
          <div className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
          <div className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{ background: 'rgba(248,250,252,0.97)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}
      >
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-muted-foreground active:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[16px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>Request Verification</h1>
          </div>
          <div className="w-11" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We'll review your business details to verify your profile. This usually takes a few days.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Business name</Label>
            <Input
              value={business?.name || ''}
              disabled
              className=""
              style={{ background: 'rgba(15,23,42,0.03)', border: '0.5px solid rgba(15,23,42,0.07)', color: '#94A3B8' }}
            />
            <p className="text-[11px] text-muted-foreground">
              This is the name shown on your profile.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourbusiness.com"
              type="url"
            />
            <p className="text-[11px] text-muted-foreground">
              A website helps us verify your business is authentic.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Additional information <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else you'd like us to know..."
              rows={3}
              className="resize-none"
            />
          </div>
        </motion.div>
      </main>

      {/* Footer CTAs */}
      <footer
        className="fixed inset-x-0 bottom-0 z-20 backdrop-blur-xl"
        style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(248,250,252,0.97)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitMutation.isPending}
            className="flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex-[1.5] h-11 text-white border-0"
            style={{ background: '#0F172A' }}
          >
            {submitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit request'
            )}
          </Button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessVerificationRequestPage;
