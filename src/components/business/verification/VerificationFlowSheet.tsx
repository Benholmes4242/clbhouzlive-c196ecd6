import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { BIZ } from '@/components/business/businessTokens';
import ReadinessStep from './steps/ReadinessStep';
import ProofStep from './steps/ProofStep';
import OwnershipStep from './steps/OwnershipStep';
import DomainStep from './steps/DomainStep';
import {
  isValidEmail,
  isValidUrl,
  type ProofMethod,
  type Step,
} from './steps/verificationTypes';

const PROOF_CONFLICT_MESSAGE: Record<ProofMethod, string> = {
  official_website:    'This website is already linked to a verified business.',
  business_email:      'This email address is already linked to a verified business.',
  registered_business: 'This company registration is already linked to a verified business.',
  creator_business:    'This contact is already linked to a verified business.',
  golf_course:         'This golf course website is already linked to a verified business.',
};


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  /** When 'domain', sheet opens directly on the domain-confirm step for the existing pending request. */
  mode?: 'submit' | 'domain';
}

export default function VerificationFlowSheet({ open, onOpenChange, businessId, mode = 'submit' }: Props) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(mode === 'domain' ? 'domain' : 'readiness');
  const [selectedProof, setSelectedProof] = useState<ProofMethod | ''>('');
  const [proofWebsiteUrl, setProofWebsiteUrl] = useState('');
  const [proofEmail, setProofEmail] = useState('');
  const [proofRegistry, setProofRegistry] = useState('');
  const [proofCompanyNumber, setProofCompanyNumber] = useState('');
  const [proofRegistryUrl, setProofRegistryUrl] = useState('');
  const [creatorContactType, setCreatorContactType] = useState<'email' | 'phone'>('email');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');
  const [golfCourseWebsite, setGolfCourseWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [exclusivityError, setExclusivityError] = useState('');

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(mode === 'domain' ? 'domain' : 'readiness');
      setExclusivityError('');
    }
  }, [open, mode]);

  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['business-verification-wizard', businessId],
    enabled: !!businessId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, category, location, website, email')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (business?.email && !contactEmail) setContactEmail(business.email);
  }, [business?.email]);

  const missingWebsite = !business?.website;
  const missingEmail = !business?.email;
  const canProceedReadiness = !missingWebsite && !missingEmail;

  const validateProof = useMemo(() => {
    if (!selectedProof) return false;
    switch (selectedProof) {
      case 'official_website': return !!proofWebsiteUrl.trim() && isValidUrl(proofWebsiteUrl);
      case 'business_email': return !!proofEmail.trim() && isValidEmail(proofEmail);
      case 'registered_business': return !!proofRegistry && (!!proofCompanyNumber.trim() || !!proofRegistryUrl.trim());
      case 'creator_business':
        return creatorContactType === 'email'
          ? !!creatorEmail.trim() && isValidEmail(creatorEmail)
          : !!creatorPhone.trim();
      case 'golf_course': return !!golfCourseWebsite.trim() && isValidUrl(golfCourseWebsite);
      default: return false;
    }
  }, [selectedProof, proofWebsiteUrl, proofEmail, proofRegistry, proofCompanyNumber, proofRegistryUrl, creatorContactType, creatorEmail, creatorPhone, golfCourseWebsite]);

  const canProceedOwnership = !!contactEmail.trim() && !!role;

  const getProofData = () => {
    switch (selectedProof) {
      case 'official_website': return { proof_value: proofWebsiteUrl.trim(), proof_metadata: {} };
      case 'business_email': return { proof_value: proofEmail.trim(), proof_metadata: {} };
      case 'registered_business':
        return {
          proof_value: proofCompanyNumber.trim() || proofRegistryUrl.trim(),
          proof_metadata: { registry: proofRegistry, registry_url: proofRegistryUrl.trim() || null },
        };
      case 'creator_business':
        return {
          proof_value: creatorContactType === 'email' ? creatorEmail.trim() : creatorPhone.trim(),
          proof_metadata: { contact_type: creatorContactType },
        };
      case 'golf_course': return { proof_value: golfCourseWebsite.trim(), proof_metadata: {} };
      default: return { proof_value: '', proof_metadata: {} };
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!selectedProof) throw new Error('Please select a proof method');
      const { proof_value, proof_metadata } = getProofData();
      if (!proof_value) throw new Error('Please complete the required proof details');

      const { data: existingApproved, error: checkError } = await supabase
        .from('business_verification_requests')
        .select('id, business_id')
        .eq('proof_method', selectedProof)
        .eq('proof_value', proof_value)
        .eq('status', 'approved')
        .neq('business_id', businessId)
        .limit(1);
      if (checkError) throw checkError;
      if (existingApproved && existingApproved.length > 0) {
        throw new Error(PROOF_CONFLICT_MESSAGE[selectedProof] ?? 'This proof is already linked to a verified business.');
      }


      const { error } = await supabase
        .from('business_verification_requests')
        .insert({
          business_id: businessId,
          requested_by: user.id,
          website: business?.website || null,
          note: notes || null,
          status: 'pending',
          proof_method: selectedProof,
          proof_value,
          proof_metadata,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification request submitted.');
      // Fire-and-forget admin notification (best-effort; never block success).
      supabase.functions
        .invoke('send-business-verification-email', {
          body: {
            profileId: user?.id ?? null,
            businessName: business?.name ?? null,
            businessCategory: business?.category ?? null,
            businessLocation: business?.location ?? null,
            businessWebsite: business?.website ?? null,
            businessContactEmail: contactEmail || business?.email || null,
          },
        })
        .catch((e) => console.warn('[verification] admin notify failed', e));
      queryClient.invalidateQueries({ queryKey: ['business-verification-request'] });
      queryClient.invalidateQueries({ queryKey: ['business-verification-request-status'] });
      queryClient.invalidateQueries({ queryKey: ['business-account'] });
      queryClient.invalidateQueries({ queryKey: ['business-account-verification-status'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message = (error as Error).message || 'Failed to submit verification request';
      if (message.includes('already associated')) setExclusivityError(message);
      toast.error(message);
    },
  });

  const handleBack = () => {
    if (step === 'readiness' || step === 'domain') {
      onOpenChange(false);
    } else if (step === 'proof') {
      setStep('readiness');
    } else if (step === 'ownership') {
      setStep('proof');
    }
  };

  const stepIndex = step === 'readiness' ? 1 : step === 'proof' ? 2 : step === 'ownership' ? 3 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-[440px] w-full h-[100dvh] sm:h-[92vh] sm:max-h-[820px] sm:rounded-2xl flex flex-col overflow-hidden border-0"
        style={{ background: '#F8FAFC' }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-10 backdrop-blur-xl shrink-0"
          style={{ background: 'rgba(248,250,252,0.97)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}
        >
          <div className="flex items-center px-4 h-14">
            <button
              onClick={handleBack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
              aria-label="Back"
            >
              {step === 'readiness' || step === 'domain' ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-[16px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>
                {step === 'domain' ? 'Verify domain' : 'Get verified'}
              </h2>
              {step !== 'domain' && (
                <p className="text-[12px] text-muted-foreground leading-none mt-0.5">Step {stepIndex} of 3</p>
              )}
            </div>
            <div className="w-11" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
          {step !== 'domain' && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="h-2.5 w-2.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: s === stepIndex ? '#F7931E' : 'rgba(15,23,42,0.25)',
                    outline: s === stepIndex ? '2px solid rgba(247,147,30,0.20)' : 'none',
                  }}
                />
              ))}
            </div>
          )}

          {isLoadingBusiness && step !== 'domain' ? (
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
              <div className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 'readiness' && (
                <ReadinessStep
                  businessId={businessId}
                  business={business}
                  missingWebsite={missingWebsite}
                  missingEmail={missingEmail}
                  onLeaveToEdit={() => onOpenChange(false)}
                />
              )}

              {step === 'proof' && (
                <ProofStep
                  selectedProof={selectedProof}
                  setSelectedProof={setSelectedProof}
                  proofWebsiteUrl={proofWebsiteUrl}
                  setProofWebsiteUrl={setProofWebsiteUrl}
                  proofEmail={proofEmail}
                  setProofEmail={setProofEmail}
                  proofRegistry={proofRegistry}
                  setProofRegistry={setProofRegistry}
                  proofCompanyNumber={proofCompanyNumber}
                  setProofCompanyNumber={setProofCompanyNumber}
                  proofRegistryUrl={proofRegistryUrl}
                  setProofRegistryUrl={setProofRegistryUrl}
                  creatorContactType={creatorContactType}
                  setCreatorContactType={setCreatorContactType}
                  creatorEmail={creatorEmail}
                  setCreatorEmail={setCreatorEmail}
                  creatorPhone={creatorPhone}
                  setCreatorPhone={setCreatorPhone}
                  golfCourseWebsite={golfCourseWebsite}
                  setGolfCourseWebsite={setGolfCourseWebsite}
                  exclusivityError={exclusivityError}
                  clearExclusivityError={() => setExclusivityError('')}
                />
              )}

              {step === 'ownership' && (
                <OwnershipStep
                  contactEmail={contactEmail}
                  setContactEmail={setContactEmail}
                  role={role}
                  setRole={setRole}
                  notes={notes}
                  setNotes={setNotes}
                />
              )}

              {step === 'domain' && (
                <DomainStep businessId={businessId} onDone={() => onOpenChange(false)} />
              )}
            </AnimatePresence>
          )}
        </main>

        {/* Footer */}
        {step !== 'domain' && (
          <footer
            className="shrink-0 backdrop-blur-xl"
            style={{
              borderTop: '0.5px solid rgba(15,23,42,0.07)',
              background: 'rgba(248,250,252,0.97)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
              >
                {step === 'readiness' ? 'Cancel' : 'Back'}
              </button>
              {step === 'readiness' && (
                <Button
                  onClick={() => setStep('proof')}
                  disabled={!canProceedReadiness}
                  className="flex-[1.5] h-11 gap-1 text-white border-0"
                  style={{ background: BIZ.ink }}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 'proof' && (
                <Button
                  onClick={() => setStep('ownership')}
                  disabled={!validateProof}
                  className="flex-[1.5] h-11 gap-1 text-white border-0"
                  style={{ background: BIZ.ink }}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 'ownership' && (
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!canProceedOwnership || submitMutation.isPending}
                  className="flex-[1.5] h-11 text-white border-0"
                  style={{ background: BIZ.ink }}
                >
                  {submitMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </span>
                  ) : (
                    'Submit for review'
                  )}
                </Button>
              )}
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
