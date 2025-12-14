import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, ExternalLink, ChevronRight, Globe, Mail, Building, Sparkles, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BusinessVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  isReapply?: boolean;
}

type Step = 1 | 2 | 3;

type ProofMethod = 'official_website' | 'business_email' | 'registered_business' | 'creator_business' | 'golf_course';

const PROOF_OPTIONS: { id: ProofMethod; label: string; subtitle: string; icon: React.ElementType }[] = [
  { id: 'official_website', label: 'Official website', subtitle: 'Your main business website.', icon: Globe },
  { id: 'business_email', label: 'Business email address', subtitle: 'An email address on your business domain.', icon: Mail },
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

const BusinessVerificationModal: React.FC<BusinessVerificationModalProps> = ({
  open,
  onOpenChange,
  businessId,
  isReapply = false,
}) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  
  // Step 2: Proof state
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
  
  // Step 3: Ownership state
  const [contactEmail, setContactEmail] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  
  // Exclusivity error
  const [exclusivityError, setExclusivityError] = useState('');

  // CRITICAL: Clean up on unmount to prevent stuck overlay/scroll lock
  // This ensures navigation away closes the modal properly
  useEffect(() => {
    return () => {
      // Force close on unmount - this releases Radix scroll lock and removes overlay
      if (open) {
        onOpenChange(false);
      }
      // Ensure body scroll is restored (belt-and-suspenders)
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [open, onOpenChange]);

  // Fetch business details
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['business-verification-modal', businessId],
    enabled: open && !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, category, location, website, email')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      
      // Pre-fill contact email
      if (data?.email && !contactEmail) {
        setContactEmail(data.email);
      }
      
      return data;
    },
  });

  const missingWebsite = !business?.website;
  const missingEmail = !business?.email;
  const canProceedStep1 = !missingWebsite && !missingEmail;

  // Validate Step 2 based on selected proof method
  const validateStep2 = useMemo(() => {
    if (!selectedProof) return false;
    
    switch (selectedProof) {
      case 'official_website':
        return !!proofWebsiteUrl.trim() && isValidUrl(proofWebsiteUrl);
      case 'business_email':
        return !!proofEmail.trim() && isValidEmail(proofEmail);
      case 'registered_business':
        return !!proofRegistry && (!!proofCompanyNumber.trim() || !!proofRegistryUrl.trim());
      case 'creator_business':
        return creatorContactType === 'email' 
          ? !!creatorEmail.trim() && isValidEmail(creatorEmail)
          : !!creatorPhone.trim();
      case 'golf_course':
        return !!golfCourseWebsite.trim() && isValidUrl(golfCourseWebsite);
      default:
        return false;
    }
  }, [selectedProof, proofWebsiteUrl, proofEmail, proofRegistry, proofCompanyNumber, proofRegistryUrl, creatorContactType, creatorEmail, creatorPhone, golfCourseWebsite]);

  const canProceedStep2 = validateStep2;
  const canProceedStep3 = contactEmail.trim() && role;

  // Get proof value and metadata for submission
  const getProofData = () => {
    switch (selectedProof) {
      case 'official_website':
        return { proof_value: proofWebsiteUrl.trim(), proof_metadata: {} };
      case 'business_email':
        return { proof_value: proofEmail.trim(), proof_metadata: {} };
      case 'registered_business':
        return { 
          proof_value: proofCompanyNumber.trim() || proofRegistryUrl.trim(), 
          proof_metadata: { registry: proofRegistry, registry_url: proofRegistryUrl.trim() || null } 
        };
      case 'creator_business':
        return { 
          proof_value: creatorContactType === 'email' ? creatorEmail.trim() : creatorPhone.trim(), 
          proof_metadata: { contact_type: creatorContactType } 
        };
      case 'golf_course':
        return { proof_value: golfCourseWebsite.trim(), proof_metadata: {} };
      default:
        return { proof_value: '', proof_metadata: {} };
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!selectedProof) throw new Error('Please select a proof method');

      const { proof_value, proof_metadata } = getProofData();
      
      if (!proof_value) throw new Error('Please complete the required proof details');

      // Check for exclusivity conflicts
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
          proof_value: proof_value,
          proof_metadata: proof_metadata,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification request submitted.');
      queryClient.invalidateQueries({ queryKey: ['business-verification-request'] });
      queryClient.invalidateQueries({ queryKey: ['business-account'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to submit verification request';
      if (message.includes('already associated')) {
        setExclusivityError(message);
        toast.error(message);
      } else {
        toast.error(message);
      }
      console.error('[Verification submit error]', error);
    },
  });

  const resetForm = () => {
    setStep(1);
    setSelectedProof('');
    setProofWebsiteUrl('');
    setProofEmail('');
    setProofRegistry('');
    setProofCompanyNumber('');
    setProofRegistryUrl('');
    setCreatorContactType('email');
    setCreatorEmail('');
    setCreatorPhone('');
    setGolfCourseWebsite('');
    setContactEmail('');
    setRole('');
    setNotes('');
    setExclusivityError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const stepIndicator = (
    <div className="flex flex-col items-center gap-2 mb-6">
      {/* Dots */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-colors',
              s === step ? 'bg-primary shadow-sm ring-2 ring-primary/20' : 'bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
      {/* Step text - desktop only */}
      <span className="hidden md:block text-xs text-muted-foreground">
        Step {step} of 3
      </span>
    </div>
  );

  const renderProofInputs = () => {
    switch (selectedProof) {
      case 'official_website':
        return (
          <div className="space-y-2 mt-4 pl-7">
            <Label className="text-sm text-foreground">Website URL</Label>
            <Input
              value={proofWebsiteUrl}
              onChange={(e) => setProofWebsiteUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              type="url"
            />
            <p className="text-[11px] text-muted-foreground">
              Use the primary website that represents this business.
            </p>
          </div>
        );
      
      case 'business_email':
        return (
          <div className="space-y-2 mt-4 pl-7">
            <Label className="text-sm text-foreground">Business email</Label>
            <Input
              value={proofEmail}
              onChange={(e) => setProofEmail(e.target.value)}
              placeholder="name@yourbusiness.com"
              type="email"
            />
            <p className="text-[11px] text-muted-foreground">
              Must use the same domain as your website.
            </p>
          </div>
        );
      
      case 'registered_business':
        return (
          <div className="space-y-4 mt-4 pl-7">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Register</Label>
              <Select value={proofRegistry} onValueChange={setProofRegistry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select register" />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Company / registration number</Label>
              <Input
                value={proofCompanyNumber}
                onChange={(e) => setProofCompanyNumber(e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">
                Or registry URL <span className="text-muted-foreground font-normal">(alternative)</span>
              </Label>
              <Input
                value={proofRegistryUrl}
                onChange={(e) => setProofRegistryUrl(e.target.value)}
                placeholder="https://find-and-update.company-information.service.gov.uk/..."
                type="url"
              />
            </div>
          </div>
        );
      
      case 'creator_business':
        return (
          <div className="space-y-4 mt-4 pl-7">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={creatorContactType === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreatorContactType('email')}
              >
                Email
              </Button>
              <Button
                type="button"
                variant={creatorContactType === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreatorContactType('phone')}
              >
                Phone
              </Button>
            </div>
            {creatorContactType === 'email' ? (
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Business email</Label>
                <Input
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  placeholder="creator@brand.com"
                  type="email"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Business phone number</Label>
                <Input
                  value={creatorPhone}
                  onChange={(e) => setCreatorPhone(e.target.value)}
                  placeholder="+44 7xxx xxxxxx"
                  type="tel"
                />
              </div>
            )}
          </div>
        );
      
      case 'golf_course':
        return (
          <div className="space-y-2 mt-4 pl-7">
            <Label className="text-sm text-foreground">Official course / facility website</Label>
            <Input
              value={golfCourseWebsite}
              onChange={(e) => setGolfCourseWebsite(e.target.value)}
              placeholder="https://yourgolfclub.com"
              type="url"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Get your business verified</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Verification confirms this account officially represents the business and helps golfers trust the profile.
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 flex items-center justify-center rounded-sq-sm hover:bg-muted/50 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {stepIndicator}

          <AnimatePresence mode="wait">
            {/* Step 1: Confirm Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">1. Confirm your business details</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    These details are pulled from your business profile. If anything looks incorrect, update it before continuing.
                  </p>
                </div>

                {isLoadingBusiness ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <DetailRow label="Business name" value={business?.name} />
                    <DetailRow label="Category" value={business?.category} />
                    <DetailRow label="Location" value={business?.location} />
                    <DetailRow 
                      label="Website" 
                      value={business?.website} 
                      missing={missingWebsite}
                      missingMessage="Website required — Add a website to request verification."
                    />
                    <DetailRow 
                      label="Contact email" 
                      value={business?.email} 
                      missing={missingEmail}
                      missingMessage="Contact email required — Add a contact email to request verification."
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/business/${businessId}/edit`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Edit business profile
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Proof of legitimacy */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">2. Proof of legitimacy</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose one method below. This helps us confirm your business is real and active.
                  </p>
                </div>

                <RadioGroup
                  value={selectedProof}
                  onValueChange={(value) => {
                    setSelectedProof(value as ProofMethod);
                    setExclusivityError('');
                  }}
                  className="space-y-3"
                >
                  {PROOF_OPTIONS.map((option) => {
                    const isSelected = selectedProof === option.id;
                    const Icon = option.icon;
                    return (
                      <div key={option.id}>
                        <label
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-sq-sm border cursor-pointer transition-colors',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/30'
                          )}
                        >
                          <RadioGroupItem value={option.id} className="mt-0.5" />
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                          </div>
                        </label>
                        {isSelected && renderProofInputs()}
                      </div>
                    );
                  })}
                </RadioGroup>

                {exclusivityError && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-sq-sm">
                    {exclusivityError}
                  </p>
                )}

                {!selectedProof && (
                  <p className="text-xs text-amber-600">
                    Select a proof option to continue.
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 3: Ownership */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">3. Confirm you represent this business</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps us verify you're authorised to manage this account.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Contact email</Label>
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@yourdomain.com"
                      type="email"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use a business email if possible (e.g., name@yourdomain.com).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Your role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {role === 'owner' && (
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Owners are typically verified fastest.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">
                      Tell us briefly how you're connected to this business <span className="text-muted-foreground font-normal">(max 500 characters)</span>
                    </Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      placeholder="What does this business do, and what's your role?"
                      rows={3}
                      className="resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Keep it short — 1–3 sentences is enough.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-4">
                  By submitting, you confirm you're authorised to represent this business on Clbhouz.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t border-border/40 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            {step === 1 ? (
              <Button
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setStep((s) => (s - 1) as Step)}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="gap-1"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceedStep3 || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Submitting…
                  </>
                ) : (
                  'Submit for review'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for detail rows
function DetailRow({
  label,
  value,
  missing,
  missingMessage,
}: {
  label: string;
  value?: string | null;
  missing?: boolean;
  missingMessage?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      {missing ? (
        <span className="text-xs text-red-600 text-right">{missingMessage}</span>
      ) : (
        <span className="text-sm text-foreground text-right truncate">{value || '—'}</span>
      )}
    </div>
  );
}

// Validation helpers
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith('http') ? str : `https://${str}`);
    return !!url.hostname;
  } catch {
    return false;
  }
}

function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export default BusinessVerificationModal;
