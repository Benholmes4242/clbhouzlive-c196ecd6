import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, ExternalLink, ChevronRight, Link as LinkIcon, User, Briefcase, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';

interface GolferVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 1 | 2 | 3;

const PROOF_OPTIONS = [
  { id: 'social', label: 'Linked social account', helper: 'Instagram, X, TikTok, LinkedIn, YouTube', icon: LinkIcon },
  { id: 'professional', label: 'Professional affiliation', helper: 'Golf club, tour, organisation', icon: Briefcase },
  { id: 'website', label: 'Official website', helper: 'Personal site or profile page', icon: Globe },
] as const;

const ROLE_OPTIONS = [
  { value: 'professional_golfer', label: 'Professional Golfer' },
  { value: 'golf_instructor', label: 'Golf Instructor / Coach' },
  { value: 'content_creator', label: 'Content Creator' },
  { value: 'industry_professional', label: 'Golf Industry Professional' },
  { value: 'notable_amateur', label: 'Notable Amateur' },
  { value: 'other', label: 'Other' },
] as const;

const GolferVerificationModal: React.FC<GolferVerificationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [proofTypes, setProofTypes] = useState<string[]>([]);
  const [proofLinks, setProofLinks] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');

  // Fetch profile details
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile-verification-modal', user?.id],
    enabled: open && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, bio, home_club')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      
      // Pre-fill contact email from auth
      if (user?.email && !contactEmail) {
        setContactEmail(user.email);
      }
      
      return data;
    },
  });

  const hasDisplayName = !!profile?.display_name?.trim();
  const hasProfilePhoto = !!profile?.profile_photo_url?.trim();
  const canProceedStep1 = hasDisplayName;

  const canProceedStep2 = proofTypes.length > 0;
  const canProceedStep3 = contactEmail.trim() && role;

  // Fetch current verification request to check for active invite
  const { data: verificationRequest } = useQuery({
    queryKey: ['golfer-verification-request-modal', user?.id],
    enabled: open && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golfer_verification_requests')
        .select('id, status')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const hasActiveInvite = verificationRequest?.status === 'invited';
  const requestId = verificationRequest?.id;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !requestId) throw new Error('Not authenticated or no invite');

      // Use the accept RPC instead of direct insert
      const { error } = await supabase.rpc('accept_golfer_verification_invite', {
        p_request_id: requestId,
        p_evidence_url: proofLinks || null,
        p_note: description || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification request submitted', {
        description: 'We\'ll review your request and notify you once a decision is made.',
      });
      queryClient.invalidateQueries({ queryKey: ['golfer-verification-request'] });
      queryClient.invalidateQueries({ queryKey: ['golfer-verification-request-modal'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
    setDescription('');
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
              <DialogTitle className="text-lg font-semibold">
                {hasActiveInvite ? "You're invited" : 'Get verified'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {hasActiveInvite 
                  ? "Complete your verification request to get a verified badge."
                  : "Verification shows you're a notable person in the golf community."
                }
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
            {/* Step 1: Confirm Profile Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">1. Confirm profile details</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    These details appear on your profile.
                  </p>
                </div>

                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <DetailRow label="Display name" value={profile?.display_name} required />
                    <DetailRow label="Username" value={profile?.username ? `@${profile.username}` : null} />
                    <DetailRow label="Profile photo" value={profile?.profile_photo_url ? 'Uploaded' : null} />
                    <DetailRow label="Bio" value={profile?.bio} />
                    <DetailRow label="Home club" value={profile?.home_club} />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={editRoute}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Edit profile
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Proof of identity or notability */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">2. Proof of identity or notability</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose at least one. This helps us confirm you are who you say you are.
                  </p>
                </div>

                <div className="space-y-3">
                  {PROOF_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
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
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{option.helper}</p>
                        </div>
                      </label>
                    );
                  })}
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
                    Add links to your social profiles, website, or articles about you. One per line.
                  </p>
                </div>

                {proofTypes.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Select at least one proof option to continue.
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 3: Confirm Identity */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-sm font-semibold text-foreground">3. Confirm identity</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps us confirm you are the person represented by this profile.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Contact email</Label>
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-foreground">Role / category</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your category" />
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
                      Tell us briefly <span className="text-muted-foreground font-normal">(max 300 characters)</span>
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                      placeholder="Why should you be verified? What makes you notable in the golf community?"
                      rows={3}
                      className="resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {description.length}/300 characters
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-4">
                  By submitting, you confirm you are the person represented by this profile.
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
  required,
}: {
  label: string;
  value?: string | null;
  required?: boolean;
}) {
  const missing = required && !value?.trim();
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      {missing ? (
        <span className="text-xs text-red-600 text-right">Required</span>
      ) : (
        <span className="text-sm text-foreground text-right truncate">{value || '—'}</span>
      )}
    </div>
  );
}

export default GolferVerificationModal;
