import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

const PROOF_OPTIONS = [
  { id: 'website', label: 'Official website', helper: 'Your website should match your business name.' },
  { id: 'social', label: 'Linked social account', helper: 'Instagram, X, TikTok, LinkedIn, YouTube, etc.' },
  { id: 'registered', label: 'Registered business / organisation', helper: 'Companies House, charity register, etc.' },
  { id: 'club_facility', label: 'Golf club / facility website', helper: 'For clubs, coaches, facilities and golf brands.' },
] as const;

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
  const [proofTypes, setProofTypes] = useState<string[]>([]);
  const [proofLinks, setProofLinks] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

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

  const canProceedStep2 = proofTypes.length > 0;
  const canProceedStep3 = contactEmail.trim() && role;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('business_verification_requests')
        .insert({
          business_id: businessId,
          requested_by: user.id,
          website: business?.website || null,
          note: notes || null,
          status: 'pending',
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
      toast.error(error.message || 'Failed to submit verification request');
    },
  });

  const resetForm = () => {
    setStep(1);
    setProofTypes([]);
    setProofLinks('');
    setContactEmail('');
    setRole('');
    setNotes('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleProofToggle = (proofId: string) => {
    setProofTypes(prev =>
      prev.includes(proofId)
        ? prev.filter(p => p !== proofId)
        : [...prev, proofId]
    );
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            s === step ? 'bg-primary' : 'bg-muted'
          )}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Get your business verified</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Verification confirms this account officially represents the business and helps golfers trust the profile.
              </p>
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
                    These details are pulled from your business profile. If anything is wrong, update it before submitting.
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

            {/* Step 2: Proof */}
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
                    Choose at least one. We use this to confirm your business is real and active.
                  </p>
                </div>

                <div className="space-y-3">
                  {PROOF_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-sq-sm border cursor-pointer transition-colors',
                        proofTypes.includes(option.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/30'
                      )}
                    >
                      <Checkbox
                        checked={proofTypes.includes(option.id)}
                        onCheckedChange={() => handleProofToggle(option.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.helper}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-foreground">
                    Proof links <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={proofLinks}
                    onChange={(e) => setProofLinks(e.target.value)}
                    placeholder="https://..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Add 1–3 links (website/social/registry). One per line.
                  </p>
                </div>

                {proofTypes.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Select at least one proof option to continue.
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
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">
                      Tell us briefly <span className="text-muted-foreground font-normal">(max 500 characters)</span>
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

export default BusinessVerificationModal;
