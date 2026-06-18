import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Globe,
  Mail,
  Building,
  Sparkles,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useDomainVerification,
  useSendDomainCode,
  useVerifyDomainCode,
} from '@/hooks/useDomainVerification';

type ProofMethod =
  | 'official_website'
  | 'business_email'
  | 'registered_business'
  | 'creator_business'
  | 'golf_course';

type Step = 'readiness' | 'proof' | 'ownership' | 'domain';

const PROOF_OPTIONS: { id: ProofMethod; label: string; subtitle: string; icon: React.ElementType }[] = [
  { id: 'official_website', label: 'Official website', subtitle: 'Your main business website.', icon: Globe },
  { id: 'business_email', label: 'Business email address', subtitle: 'An email on your business domain.', icon: Mail },
  { id: 'registered_business', label: 'Registered business (legal entity)', subtitle: 'Companies House, charity register, or equivalent.', icon: Building },
  { id: 'creator_business', label: 'Creator / brand / influencer business', subtitle: 'For creator-led or personal brands.', icon: Sparkles },
  { id: 'golf_course', label: 'Golf course / facility', subtitle: 'For golf courses, clubs, academies, and facilities.', icon: MapPin },
];

const REGISTRY_OPTIONS = [
  { value: 'companies_house', label: 'Companies House' },
  { value: 'charity_register', label: 'Charity Register' },
  { value: 'other', label: 'Other' },
];

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'employee', label: 'Employee' },
  { value: 'agency', label: 'Agency' },
  { value: 'other', label: 'Other' },
] as const;

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
        throw new Error('This proof is already associated with a verified business.');
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
                <motion.div key="readiness" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">1. Confirm your business details</h3>
                    <p className="text-xs text-muted-foreground mt-1">Pulled from your business profile. Update anything that looks wrong before continuing.</p>
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="Business name" value={business?.name} />
                    <DetailRow label="Category" value={business?.category} />
                    <DetailRow label="Location" value={business?.location} />
                    <DetailRow label="Website" value={business?.website} missing={missingWebsite} missingMessage="Website required — add one to continue." />
                    <DetailRow label="Contact email" value={business?.email} missing={missingEmail} missingMessage="Contact email required — add one to continue." />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/business/${businessId}/edit`} onClick={() => onOpenChange(false)}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Edit business profile
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'proof' && (
                <motion.div key="proof" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">2. Proof of legitimacy</h3>
                    <p className="text-xs text-muted-foreground mt-1">Choose one method below. This helps us confirm your business is real.</p>
                  </div>
                  <RadioGroup
                    value={selectedProof}
                    onValueChange={(v) => { setSelectedProof(v as ProofMethod); setExclusivityError(''); }}
                    className="space-y-3"
                  >
                    {PROOF_OPTIONS.map((option) => {
                      const isSelected = selectedProof === option.id;
                      const Icon = option.icon;
                      return (
                        <div key={option.id}>
                          <label
                            className="flex items-start gap-3 p-3 rounded-sq-sm border cursor-pointer transition-colors"
                            style={isSelected ? { borderColor: '#F7931E', background: 'rgba(247,147,30,0.05)' } : { borderColor: 'rgba(15,23,42,0.10)' }}
                          >
                            <RadioGroupItem value={option.id} className="mt-0.5 [&]:border-[#F7931E] [&]:text-[#F7931E] data-[state=checked]:[&]:border-[#F7931E]" />
                            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{option.label}</p>
                              <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                            </div>
                          </label>
                          {isSelected && (
                            <ProofInputs
                              proof={selectedProof}
                              proofWebsiteUrl={proofWebsiteUrl} setProofWebsiteUrl={setProofWebsiteUrl}
                              proofEmail={proofEmail} setProofEmail={setProofEmail}
                              proofRegistry={proofRegistry} setProofRegistry={setProofRegistry}
                              proofCompanyNumber={proofCompanyNumber} setProofCompanyNumber={setProofCompanyNumber}
                              proofRegistryUrl={proofRegistryUrl} setProofRegistryUrl={setProofRegistryUrl}
                              creatorContactType={creatorContactType} setCreatorContactType={setCreatorContactType}
                              creatorEmail={creatorEmail} setCreatorEmail={setCreatorEmail}
                              creatorPhone={creatorPhone} setCreatorPhone={setCreatorPhone}
                              golfCourseWebsite={golfCourseWebsite} setGolfCourseWebsite={setGolfCourseWebsite}
                            />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                  {exclusivityError && (
                    <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-sq-sm">{exclusivityError}</p>
                  )}
                </motion.div>
              )}

              {step === 'ownership' && (
                <motion.div key="ownership" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">3. Confirm you represent this business</h3>
                    <p className="text-xs text-muted-foreground mt-1">This helps us verify you're authorised to manage this account.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-foreground">Contact email</Label>
                      <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@yourdomain.com" type="email" />
                      <p className="text-[11px] text-muted-foreground">Use a business email if possible.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-foreground">Your role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {role === 'owner' && (
                        <p className="text-[10px] font-medium" style={{ color: '#F7931E' }}>Owners are typically verified fastest.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-foreground">How are you connected to this business? <span className="text-muted-foreground font-normal">(max 500)</span></Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                        placeholder="What does this business do, and what's your role?"
                        rows={3}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-4" style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
                    By submitting, you confirm you're authorised to represent this business on Clbhouz.
                  </p>
                </motion.div>
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
            style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(248,250,252,0.97)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
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
                <Button onClick={() => setStep('proof')} disabled={!canProceedReadiness} className="flex-[1.5] h-11 gap-1 text-white border-0" style={{ background: '#0F172A' }}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 'proof' && (
                <Button onClick={() => setStep('ownership')} disabled={!validateProof} className="flex-[1.5] h-11 gap-1 text-white border-0" style={{ background: '#0F172A' }}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {step === 'ownership' && (
                <Button onClick={() => submitMutation.mutate()} disabled={!canProceedOwnership || submitMutation.isPending} className="flex-[1.5] h-11 text-white border-0" style={{ background: '#0F172A' }}>
                  {submitMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting…</span>
                  ) : 'Submit for review'}
                </Button>
              )}
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DomainStep({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [innerStep, setInnerStep] = useState<'email' | 'code' | 'success'>('email');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: request } = useQuery({
    queryKey: ['business-verification-request', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: existingVerification } = useDomainVerification(request?.id ?? null);
  const sendCode = useSendDomainCode(businessId);
  const verifyCode = useVerifyDomainCode();

  useEffect(() => {
    if (request?.domain_confirmed) setInnerStep('success');
    else if (existingVerification?.status === 'pending') {
      setVerificationId(existingVerification.id);
      setEmail(existingVerification.email);
      setInnerStep('code');
    }
  }, [request, existingVerification]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request?.id || !email.trim()) return;
    const result = await sendCode.mutateAsync({ requestId: request.id, email });
    if (result.verificationId) {
      setVerificationId(result.verificationId);
      setInnerStep('code');
    }
  };

  const handleVerify = async () => {
    if (!verificationId || code.length !== 6) return;
    await verifyCode.mutateAsync({ verificationId, code });
    setInnerStep('success');
    queryClient.invalidateQueries({ queryKey: ['business-verification-request'] });
    queryClient.invalidateQueries({ queryKey: ['business-verification-request-status'] });
  };

  const domain = request?.domain;

  if (!request?.requires_domain_check) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Domain verification isn't required for this request.</p>
        <Button variant="secondary" className="mt-6" onClick={onDone}>Close</Button>
      </div>
    );
  }

  if (innerStep === 'success') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Domain verified</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your domain has been confirmed. Your verification request is now ready for final review.
        </p>
        <Button variant="secondary" onClick={onDone}>Done</Button>
      </motion.div>
    );
  }

  if (innerStep === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-6 py-4">
        <div className="text-center">
          <div className="h-14 w-14 rounded-full bg-[#F7931E]/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-7 w-7" style={{ color: '#F7931E' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Verify your domain</h3>
          <p className="text-sm text-muted-foreground">
            Enter your business email ending in <span className="font-medium">@{domain}</span>
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain-email">Business email</Label>
          <Input id="domain-email" type="email" placeholder={`you@${domain}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
          {sendCode.isError && <p className="text-sm text-destructive">{(sendCode.error as Error).message}</p>}
        </div>
        <Button type="submit" className="w-full h-11 text-white border-0" style={{ background: '#0F172A' }} disabled={sendCode.isPending}>
          {sendCode.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : 'Send verification code'}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="h-14 w-14 rounded-full bg-[#F7931E]/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7" style={{ color: '#F7931E' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Enter verification code</h3>
        <p className="text-sm text-muted-foreground">We sent a 6-digit code to <span className="font-medium">{email}</span></p>
      </div>
      <div className="flex justify-center">
        <InputOTP value={code} onChange={setCode} maxLength={6} onComplete={handleVerify}>
          <InputOTPGroup>
            {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {verifyCode.isError && <p className="text-sm text-destructive text-center">{(verifyCode.error as Error).message}</p>}
      <Button className="w-full h-11 text-white border-0" style={{ background: '#0F172A' }} onClick={handleVerify} disabled={code.length !== 6 || verifyCode.isPending}>
        {verifyCode.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</> : 'Verify code'}
      </Button>
      <button type="button" onClick={() => setInnerStep('email')} className="w-full text-sm text-muted-foreground hover:text-foreground">
        Use a different email
      </button>
    </div>
  );
}

function ProofInputs(props: {
  proof: ProofMethod;
  proofWebsiteUrl: string; setProofWebsiteUrl: (v: string) => void;
  proofEmail: string; setProofEmail: (v: string) => void;
  proofRegistry: string; setProofRegistry: (v: string) => void;
  proofCompanyNumber: string; setProofCompanyNumber: (v: string) => void;
  proofRegistryUrl: string; setProofRegistryUrl: (v: string) => void;
  creatorContactType: 'email' | 'phone'; setCreatorContactType: (v: 'email' | 'phone') => void;
  creatorEmail: string; setCreatorEmail: (v: string) => void;
  creatorPhone: string; setCreatorPhone: (v: string) => void;
  golfCourseWebsite: string; setGolfCourseWebsite: (v: string) => void;
}) {
  const { proof } = props;
  switch (proof) {
    case 'official_website':
      return (
        <div className="space-y-2 mt-4 pl-7">
          <Label className="text-sm text-foreground">Website URL</Label>
          <Input value={props.proofWebsiteUrl} onChange={(e) => props.setProofWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" type="url" />
        </div>
      );
    case 'business_email':
      return (
        <div className="space-y-2 mt-4 pl-7">
          <Label className="text-sm text-foreground">Business email</Label>
          <Input value={props.proofEmail} onChange={(e) => props.setProofEmail(e.target.value)} placeholder="name@yourbusiness.com" type="email" />
          <p className="text-[11px] text-muted-foreground">Must use the same domain as your website.</p>
        </div>
      );
    case 'registered_business':
      return (
        <div className="space-y-4 mt-4 pl-7">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Register</Label>
            <Select value={props.proofRegistry} onValueChange={props.setProofRegistry}>
              <SelectTrigger><SelectValue placeholder="Select register" /></SelectTrigger>
              <SelectContent>
                {REGISTRY_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Company / registration number</Label>
            <Input value={props.proofCompanyNumber} onChange={(e) => props.setProofCompanyNumber(e.target.value)} placeholder="12345678" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Or registry URL <span className="text-muted-foreground font-normal">(alternative)</span></Label>
            <Input value={props.proofRegistryUrl} onChange={(e) => props.setProofRegistryUrl(e.target.value)} placeholder="https://…" type="url" />
          </div>
        </div>
      );
    case 'creator_business':
      return (
        <div className="space-y-4 mt-4 pl-7">
          <div className="flex gap-2">
            <button type="button" onClick={() => props.setCreatorContactType('email')}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px]"
              style={props.creatorContactType === 'email' ? { background: '#F7931E', color: '#ffffff' } : { background: 'rgba(15,23,42,0.05)', color: '#64748B' }}>
              Email
            </button>
            <button type="button" onClick={() => props.setCreatorContactType('phone')}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px]"
              style={props.creatorContactType === 'phone' ? { background: '#F7931E', color: '#ffffff' } : { background: 'rgba(15,23,42,0.05)', color: '#64748B' }}>
              Phone
            </button>
          </div>
          {props.creatorContactType === 'email' ? (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Business email</Label>
              <Input value={props.creatorEmail} onChange={(e) => props.setCreatorEmail(e.target.value)} placeholder="creator@brand.com" type="email" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Business phone number</Label>
              <Input value={props.creatorPhone} onChange={(e) => props.setCreatorPhone(e.target.value)} placeholder="+44 7xxx xxxxxx" type="tel" />
            </div>
          )}
        </div>
      );
    case 'golf_course':
      return (
        <div className="space-y-2 mt-4 pl-7">
          <Label className="text-sm text-foreground">Official course / facility website</Label>
          <Input value={props.golfCourseWebsite} onChange={(e) => props.setGolfCourseWebsite(e.target.value)} placeholder="https://yourgolfclub.com" type="url" />
        </div>
      );
    default:
      return null;
  }
}

function DetailRow({ label, value, missing, missingMessage }: { label: string; value?: string | null; missing?: boolean; missingMessage?: string }) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
      <span className="text-sm text-muted-foreground shrink-0 w-[100px]">{label}</span>
      {missing ? (
        <span className="text-xs text-destructive flex-1 min-w-0 text-right break-words">{missingMessage}</span>
      ) : (
        <span className="text-sm text-foreground flex-1 min-w-0 text-right overflow-hidden text-ellipsis whitespace-nowrap">{value || '—'}</span>
      )}
    </div>
  );
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`);
    return !!url.hostname;
  } catch { return false; }
}
function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}
