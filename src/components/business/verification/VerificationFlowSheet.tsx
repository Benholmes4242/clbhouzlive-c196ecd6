import { Skeleton } from '@/components/ui/skeleton';
import { TITLE } from '@/lib/tokens/type';
/**
 * VerificationFlowSheet — single-page "Get verified" flow.
 *
 * Rebuild of the previous 3-step wizard as ONE scrolling page with three
 * numbered sections and a sticky Submit. Adds:
 *  - Optional supporting document upload (private bucket + admin signed URL).
 *  - OTP-verified business email (reuses useDomainVerification infra).
 *  - Post-submit confirmation screen with the request reference.
 *
 * The mode='domain' entry (admin-initiated domain check on an existing
 * pending request) still renders the standalone DomainStep, unchanged.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,

  ChevronLeft,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { BIZ } from '@/components/business/businessTokens';
import {
  A,
  BIZ_LABEL,
  BIZ_BODY,
  bizFigure,
} from '@/features/courses/components/holes/analytical/tokens';
import DomainStep from './steps/DomainStep';
import {
  PROOF_OPTIONS,
  REGISTRY_OPTIONS,
  ROLE_OPTIONS,
  isValidEmail,
  isValidUrl,
  type ProofMethod,
} from './steps/verificationTypes';
import {
  useSendDomainCode,
  useVerifyDomainCode,
} from '@/hooks/useDomainVerification';

const DOC_BUCKET = 'business-verification-docs';
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_DOC = 'image/*,application/pdf';

const PROOF_CONFLICT_MESSAGE: Record<ProofMethod, string> = {
  official_website: 'This website is already linked to a verified business.',
  business_email: 'This email address is already linked to a verified business.',
  registered_business: 'This company registration is already linked to a verified business.',
  creator_business: 'This contact is already linked to a verified business.',
  golf_course: 'This golf course website is already linked to a verified business.',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  /** When 'domain', opens the standalone domain OTP step for an existing pending request. */
  mode?: 'submit' | 'domain';
}

type SectionKey = 'details' | 'proof' | 'ownership';

function safeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'file';
}

export default function VerificationFlowSheet({
  open,
  onOpenChange,
  businessId,
  mode = 'submit',
}: Props) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // --- proof state ---
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

  // --- ownership state ---
  const [contactEmail, setContactEmail] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  // --- doc upload state ---
  const [docPath, setDocPath] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docKind, setDocKind] = useState<'image' | 'pdf' | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  // --- OTP state (business_email method, pre-submit) ---
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const [otpVerificationId, setOtpVerificationId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmailVerified, setOtpEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const sendCode = useSendDomainCode(businessId);
  const verifyCode = useVerifyDomainCode();

  // --- ui state ---
  const [exclusivityError, setExclusivityError] = useState('');
  const [validationError, setValidationError] = useState<{ section: SectionKey; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<{ requestId: string; method: ProofMethod } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const detailsRef = useRef<HTMLDivElement | null>(null);
  const proofRef = useRef<HTMLDivElement | null>(null);
  const ownershipRef = useRef<HTMLDivElement | null>(null);

  // Reset the form each time the sheet is (re)opened.
  useEffect(() => {
    if (!open) return;
    setExclusivityError('');
    setValidationError(null);
    setConfirmation(null);
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
    setRole('');
    setNotes('');
    setDocPath(null);
    setDocFileName(null);
    setDocPreviewUrl(null);
    setDocKind(null);
    setOtpRequestId(null);
    setOtpVerificationId(null);
    setOtpCode('');
    setOtpEmailVerified(false);
    setOtpSent(false);
  }, [open, mode]);

  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['business-verification-wizard', businessId],
    enabled: !!businessId && open && mode !== 'domain',
    staleTime: 0,
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
  }, [business?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- validation & DB helpers ----
  const getProofData = () => {
    switch (selectedProof) {
      case 'official_website':
        return { proof_value: proofWebsiteUrl.trim(), proof_metadata: {} as Record<string, unknown> };
      case 'business_email':
        return {
          proof_value: proofEmail.trim(),
          proof_metadata: {
            email_verified: otpEmailVerified,
          } as Record<string, unknown>,
        };
      case 'registered_business':
        return {
          proof_value: proofCompanyNumber.trim() || proofRegistryUrl.trim(),
          proof_metadata: {
            registry: proofRegistry,
            registry_url: proofRegistryUrl.trim() || null,
          } as Record<string, unknown>,
        };
      case 'creator_business':
        return {
          proof_value: creatorContactType === 'email' ? creatorEmail.trim() : creatorPhone.trim(),
          proof_metadata: { contact_type: creatorContactType } as Record<string, unknown>,
        };
      case 'golf_course':
        return { proof_value: golfCourseWebsite.trim(), proof_metadata: {} as Record<string, unknown> };
      default:
        return { proof_value: '', proof_metadata: {} as Record<string, unknown> };
    }
  };

  const proofIsValid = useMemo(() => {
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
  }, [
    selectedProof,
    proofWebsiteUrl,
    proofEmail,
    proofRegistry,
    proofCompanyNumber,
    proofRegistryUrl,
    creatorContactType,
    creatorEmail,
    creatorPhone,
    golfCourseWebsite,
  ]);

  const detailsReady = !!business?.website && !!business?.email;

  // ---- document upload ----
  async function handleDocPick(file: File) {
    if (!file) return;
    if (file.size > MAX_DOC_BYTES) {
      toast.error('That file is over 10 MB. Please choose a smaller one.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Only image or PDF files are supported.');
      return;
    }
    setDocUploading(true);
    try {
      const path = `${businessId}/${Date.now()}-${safeFilename(file.name)}`;
      const { error } = await supabase.storage
        .from(DOC_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setDocPath(path);
      setDocFileName(file.name);
      setDocKind(isImage ? 'image' : 'pdf');
      if (isImage) {
        const { data: signed } = await supabase.storage
          .from(DOC_BUCKET)
          .createSignedUrl(path, 60 * 10);
        setDocPreviewUrl(signed?.signedUrl ?? null);
      } else {
        setDocPreviewUrl(null);
      }
      toast.success('Document attached');
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed');
    } finally {
      setDocUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDocRemove() {
    if (!docPath) return;
    try {
      await supabase.storage.from(DOC_BUCKET).remove([docPath]);
    } catch {
      /* best-effort */
    }
    setDocPath(null);
    setDocFileName(null);
    setDocPreviewUrl(null);
    setDocKind(null);
  }

  /** How many of the five confirmed details the business has not set. */
  const missingDetailCount = [
    business?.name,
    business?.category,
    business?.location,
    business?.website,
    business?.email,
  ].filter((v) => !v || !String(v).trim()).length;


  /** Proof selection. Unchanged behaviour from the previous RadioGroup handler. */
  function chooseProof(v: ProofMethod) {
    setSelectedProof(v);
    setExclusivityError('');
    // If user picks a different method, drop OTP progress so it doesn't
    // leak into the wrong proof - the row stays and can be updated on submit.
    if (v !== 'business_email') {
      setOtpEmailVerified(false);
      setOtpSent(false);
      setOtpCode('');
    }
  }


  // ---- OTP flow (business_email) ----
  async function ensureOtpRequest(): Promise<string | null> {
    if (otpRequestId) return otpRequestId;
    if (!user?.id) return null;
    const email = proofEmail.trim();
    if (!email || !isValidEmail(email)) return null;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    const { data, error } = await supabase
      .from('business_verification_requests')
      .insert({
        business_id: businessId,
        requested_by: user.id,
        website: business?.website || null,
        status: 'pending',
        proof_method: 'business_email',
        proof_value: email,
        proof_metadata: { email_verified: false, otp_flow: true } as any,
        contact_email: contactEmail.trim() || business?.email || null,
        contact_role: role || null,
        note: notes || null,
        domain,
        requires_domain_check: true,
      } as any)
      .select('id')
      .single();
    if (error) {
      toast.error(error.message || 'Could not start verification');
      return null;
    }
    setOtpRequestId(data.id);
    return data.id;
  }

  async function handleSendOtp() {
    const email = proofEmail.trim();
    if (!email || !isValidEmail(email)) {
      toast.error('Enter a valid business email first.');
      return;
    }
    setOtpSending(true);
    try {
      const rid = await ensureOtpRequest();
      if (!rid) return;
      const result = await sendCode.mutateAsync({ requestId: rid, email });
      if (result?.verificationId) {
        setOtpVerificationId(result.verificationId);
        setOtpSent(true);
      }
    } catch {
      /* toast already fired inside mutation */
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpVerificationId || otpCode.length !== 6) return;
    try {
      await verifyCode.mutateAsync({ verificationId: otpVerificationId, code: otpCode });
      setOtpEmailVerified(true);
    } catch {
      /* toast already fired inside mutation */
    }
  }

  // ---- submit ----
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Scroll-to-first-error validation.
      if (!detailsReady) {
        setValidationError({
          section: 'details',
          message: 'Add a website and contact email to your business profile first.',
        });
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        throw new Error('__validation__');
      }
      if (!selectedProof || !proofIsValid) {
        setValidationError({ section: 'proof', message: 'Choose a proof method and fill in the details.' });
        proofRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        throw new Error('__validation__');
      }
      if (!contactEmail.trim() || !isValidEmail(contactEmail) || !role) {
        setValidationError({
          section: 'ownership',
          message: 'Add your contact email and role so we can confirm you represent this business.',
        });
        ownershipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        throw new Error('__validation__');
      }
      setValidationError(null);

      const { proof_value, proof_metadata } = getProofData();
      if (!proof_value) throw new Error('Please complete the required proof details.');

      // Exclusivity check.
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
        throw new Error(
          PROOF_CONFLICT_MESSAGE[selectedProof] ?? 'This proof is already linked to a verified business.',
        );
      }

      const payload: Record<string, unknown> = {
        website: business?.website || null,
        note: notes || null,
        proof_method: selectedProof,
        proof_value,
        proof_metadata,
        contact_email: contactEmail.trim() || null,
        contact_role: role || null,
        proof_document_url: docPath,
      };

      let requestId = otpRequestId;
      if (requestId) {
        // OTP path already created the row — UPDATE with the final values.
        const { error } = await supabase
          .from('business_verification_requests')
          .update(payload as any)
          .eq('id', requestId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('business_verification_requests')
          .insert({
            business_id: businessId,
            requested_by: user.id,
            status: 'pending',
            ...payload,
          } as any)
          .select('id')
          .single();
        if (error) throw error;
        requestId = data.id;
      }

      return { requestId: requestId as string, method: selectedProof as ProofMethod };
    },
    onSuccess: (result) => {
      // Fire-and-forget admin email; DB trigger already fired the in-app + push notification.
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
      queryClient.invalidateQueries({ queryKey: ['admin-v2', 'verifications'] });
      setConfirmation(result);
    },
    onError: (error: unknown) => {
      const message = (error as Error).message || 'Failed to submit verification request';
      if (message === '__validation__') return;
      if (message.toLowerCase().includes('already linked')) setExclusivityError(message);
      toast.error(message);
    },
  });

  // ---- render ----
  const showDomainMode = mode === 'domain';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-[440px] w-full h-[100dvh] sm:h-[92vh] sm:max-h-[820px] sm:rounded-2xl flex flex-col overflow-hidden border-0"
        style={{ background: BIZ.pageBg }}
      >
        {/* Header — matches ManagePageShell (Manage Business Profiles) */}
        <header
          className="sticky top-0 z-10 shrink-0"
          style={{
            background: BIZ.pageBg,
            borderBottom: '1px solid rgba(15,23,42,0.08)',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          }}
        >
          <div
            className="flex items-center gap-3 px-4"
            style={{ paddingBottom: 12, minHeight: 56 }}
          >
            <button
              onClick={() => onOpenChange(false)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#fff', border: '1px solid rgba(15,23,42,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
              aria-label={showDomainMode ? 'Back' : 'Close'}
            >
              <ChevronLeft size={18} strokeWidth={2.5} style={{ color: '#0F172A' }} />
            </button>
            <h2
              style={{ ...TITLE, color: '#0F172A', lineHeight: 1, margin: 0 }}
            >
              {showDomainMode ? 'Verify domain' : 'Submit for review'}
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-32">
          {showDomainMode ? (
            <DomainStep businessId={businessId} onDone={() => onOpenChange(false)} />
          ) : confirmation ? (
            <ConfirmationView
              requestId={confirmation.requestId}
              method={confirmation.method}
              onDone={() => onOpenChange(false)}
            />
          ) : isLoadingBusiness ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-4">
              <style>{`
                [data-vf-field] input,
                [data-vf-field] textarea,
                [data-vf-field] button[role="combobox"] {
                  border: 1px solid ${A.BORDER};
                  border-radius: 11px;
                  padding: 12px 13px;
                  font-size: 14px;
                  font-weight: 400;
                  color: ${A.INK};
                  background: ${A.PANEL};
                  height: auto;
                  min-height: 44px;
                }
              `}</style>

              {/* Intro figures */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                  gap: 10,
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: A.PANEL,
                  border: `1px solid ${A.BORDER}`,
                }}
              >
                <div className="text-center" style={{ minWidth: 0 }}>
                  <div style={BIZ_LABEL}>To complete</div>
                  <div style={{ ...bizFigure(19), marginTop: 6 }}>2 min</div>
                </div>
                <div className="text-center" style={{ minWidth: 0 }}>
                  <div style={BIZ_LABEL}>We review in</div>
                  {/* No SLA exists in the codebase - the existing prose stands rather than
                      inventing a number the business would be held to. */}
                  <div style={{ ...bizFigure(15), marginTop: 8 }}>A few days</div>
                </div>
              </div>

              {/* SECTION 1 */}
              <SectionCard ref={detailsRef} number={1} title="Confirm your details">
                <div>
                  <DetailRow label="Business name" value={business?.name} />
                  <DetailRow label="Category" value={business?.category} />
                  <DetailRow label="Location" value={business?.location} />
                  <DetailRow
                    label="Website"
                    value={business?.website}
                    missing={!business?.website}
                    missingMessage="Website required"
                  />
                  <DetailRow
                    label="Contact email"
                    value={business?.email}
                    missing={!business?.email}
                    missingMessage="Contact email required"
                  />
                </div>
                {missingDetailCount > 0 && (
                  <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '8px 0 0' }}>
                    {missingDetailCount === 1
                      ? '1 detail is missing. You can still submit, but adding it speeds up review.'
                      : `${missingDetailCount} details are missing. You can still submit, but adding them speeds up review.`}
                  </p>
                )}
                <div className="pt-3">
                  <Link
                    to={`/business/${businessId}/edit`}
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center gap-1.5"
                    style={{ ...BIZ_LABEL, color: A.INK, minHeight: 44, alignItems: 'center' }}
                  >
                    <ExternalLink size={10} strokeWidth={2.5} />
                    Edit business profile
                  </Link>
                </div>
                {validationError?.section === 'details' && (
                  <p className="text-[12px] text-destructive mt-3">{validationError.message}</p>
                )}
              </SectionCard>


              {/* SECTION 2 */}
              <SectionCard ref={proofRef} number={2} title="Prove your business is real">
                <div
                  role="radiogroup"
                  aria-label="How you want to prove your business"
                  onKeyDown={(e) => {
                    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
                    if (!keys.includes(e.key)) return;
                    e.preventDefault();
                    const idx = PROOF_OPTIONS.findIndex((o) => o.id === selectedProof);
                    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
                    const next =
                      PROOF_OPTIONS[
                        (((idx < 0 ? 0 : idx + step) % PROOF_OPTIONS.length) +
                          PROOF_OPTIONS.length) %
                          PROOF_OPTIONS.length
                      ];
                    chooseProof(next.id);
                    const el = e.currentTarget.querySelector<HTMLElement>(
                      `[data-proof="${next.id}"]`,
                    );
                    el?.focus();
                  }}
                >
                  {PROOF_OPTIONS.map((option) => {
                    const isSelected = selectedProof === option.id;
                    const Icon = option.icon;
                    return (
                      <div key={option.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          data-proof={option.id}
                          tabIndex={
                            isSelected || (!selectedProof && option.id === PROOF_OPTIONS[0].id)
                              ? 0
                              : -1
                          }
                          onClick={() => chooseProof(option.id)}
                          className="w-full flex items-start gap-3 text-left"
                          style={{
                            minHeight: 44,
                            padding: '10px 0',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            aria-hidden
                            className="flex items-center justify-center shrink-0"
                            style={{
                              width: 15,
                              height: 15,
                              marginTop: 2,
                              borderRadius: '50%',
                              background: isSelected ? A.INK : 'transparent',
                              border: isSelected ? 'none' : '1.5px solid #CBD2DA',
                            }}
                          >
                            {isSelected && (
                              <Check size={9} strokeWidth={3.25} style={{ color: '#FFFFFF' }} />
                            )}
                          </span>
                          <Icon size={14} className="shrink-0" style={{ color: A.MUTE, marginTop: 2 }} />
                          <span className="flex-1 min-w-0">
                            <span
                              style={{
                                display: 'block',
                                fontSize: 13.5,
                                fontWeight: isSelected ? 700 : 600,
                                color: A.INK,
                                lineHeight: 1.3,
                              }}
                            >
                              {option.label}
                            </span>
                            <span
                              style={{
                                display: 'block',
                                fontSize: 12.5,
                                fontWeight: 400,
                                color: A.MUTE,
                                lineHeight: 1.35,
                              }}
                            >
                              {option.subtitle}
                            </span>
                          </span>
                        </button>

                        {isSelected && (
                          <div className="mt-3 pl-7">
                            {option.id === 'official_website' && (
                              <FieldGroup label="Website URL">
                                <Input
                                  value={proofWebsiteUrl}
                                  onChange={(e) => setProofWebsiteUrl(e.target.value)}
                                  placeholder="https://yourbusiness.com"
                                  type="url"
                                />
                              </FieldGroup>
                            )}
                            {option.id === 'business_email' && (
                              <div className="space-y-3">
                                <FieldGroup label="Business email">
                                  <div className="flex gap-2">
                                    <Input
                                      value={proofEmail}
                                      onChange={(e) => {
                                        setProofEmail(e.target.value);
                                        if (otpEmailVerified) setOtpEmailVerified(false);
                                        if (otpSent) setOtpSent(false);
                                      }}
                                      placeholder="name@yourbusiness.com"
                                      type="email"
                                      disabled={otpEmailVerified}
                                      className="flex-1"
                                    />
                                    {otpEmailVerified ? (
                                      <span
                                        className="inline-flex items-center gap-1.5 px-3 rounded-md text-[12px] font-semibold"
                                        style={{ background: 'rgba(5,150,105,0.10)', color: '#059669' }}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Verified
                                      </span>
                                    ) : (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSendOtp}
                                        disabled={
                                          !proofEmail.trim() ||
                                          !isValidEmail(proofEmail) ||
                                          otpSending ||
                                          sendCode.isPending
                                        }
                                      >
                                        {otpSending || sendCode.isPending ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : otpSent ? (
                                          'Resend code'
                                        ) : (
                                          'Send code'
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-[11px]" style={{ color: BIZ.inkMute }}>
                                    Optional: verify your email now with a 6-digit code to speed up review.
                                  </p>
                                </FieldGroup>
                                {otpSent && !otpEmailVerified && (
                                  <div className="space-y-2">
                                    <Label className="text-[13px]" style={{ color: BIZ.ink }}>
                                      Enter the 6-digit code
                                    </Label>
                                    <div className="flex items-center gap-3">
                                      <InputOTP
                                        value={otpCode}
                                        onChange={setOtpCode}
                                        maxLength={6}
                                        onComplete={handleVerifyOtp}
                                      >
                                        <InputOTPGroup>
                                          {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <InputOTPSlot key={i} index={i} />
                                          ))}
                                        </InputOTPGroup>
                                      </InputOTP>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleVerifyOtp}
                                        disabled={otpCode.length !== 6 || verifyCode.isPending}
                                        style={{ background: BIZ.ink, color: '#fff' }}
                                      >
                                        {verifyCode.isPending ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          'Verify'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {option.id === 'registered_business' && (
                              <div className="space-y-3">
                                <FieldGroup label="Type of registration">
                                  <Select value={proofRegistry} onValueChange={setProofRegistry}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {REGISTRY_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FieldGroup>
                                {/* The applicant names their OWN registry - no jurisdiction is
                                    assumed, so any country's register describes cleanly. */}
                                <FieldGroup label="Name of register or authority">
                                  <Input
                                    value={proofRegistryName}
                                    onChange={(e) => setProofRegistryName(e.target.value)}
                                    placeholder="e.g. your national company register"
                                  />
                                </FieldGroup>
                                <FieldGroup label="Registration number">
                                  <Input
                                    value={proofCompanyNumber}
                                    onChange={(e) => setProofCompanyNumber(e.target.value)}
                                    placeholder="As it appears on your registration"
                                  />
                                </FieldGroup>
                                <FieldGroup
                                  label={
                                    <>
                                      Or registry URL{' '}
                                      <span className="font-normal" style={{ color: BIZ.inkMute }}>
                                        (alternative)
                                      </span>
                                    </>
                                  }
                                >
                                  <Input
                                    value={proofRegistryUrl}
                                    onChange={(e) => setProofRegistryUrl(e.target.value)}
                                    placeholder="https://…"
                                    type="url"
                                  />
                                </FieldGroup>
                              </div>
                            )}

                            {option.id === 'creator_business' && (
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  {(['email', 'phone'] as const).map((t) => {
                                    const active = creatorContactType === t;
                                    return (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => setCreatorContactType(t)}
                                        aria-pressed={active}
                                        className="px-1 text-[13px] min-h-[44px]"
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          fontWeight: active ? 700 : 500,
                                          color: active ? A.INK : A.MUTE,
                                        }}
                                      >
                                        {t === 'email' ? 'Email' : 'Phone'}
                                      </button>

                                    );
                                  })}
                                </div>
                                {creatorContactType === 'email' ? (
                                  <FieldGroup label="Business email">
                                    <Input
                                      value={creatorEmail}
                                      onChange={(e) => setCreatorEmail(e.target.value)}
                                      placeholder="creator@brand.com"
                                      type="email"
                                    />
                                  </FieldGroup>
                                ) : (
                                  <FieldGroup label="Business phone number">
                                    <Input
                                      value={creatorPhone}
                                      onChange={(e) => setCreatorPhone(e.target.value)}
                                      placeholder="+44 7xxx xxxxxx"
                                      type="tel"
                                    />
                                  </FieldGroup>
                                )}
                              </div>
                            )}
                            {option.id === 'golf_course' && (
                              <FieldGroup label="Official course / facility website">
                                <Input
                                  value={golfCourseWebsite}
                                  onChange={(e) => setGolfCourseWebsite(e.target.value)}
                                  placeholder="https://yourgolfclub.com"
                                  type="url"
                                />
                              </FieldGroup>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {exclusivityError && (
                  <p className="text-[12px] text-destructive bg-destructive/10 p-3 rounded-lg mt-3">
                    {exclusivityError}
                  </p>
                )}

                {/* Supporting document uploader */}
                <div className="mt-4">
                  <div className="mb-2">
                    <p style={{ fontSize: 13, fontWeight: 700, color: A.INK, margin: 0 }}>
                      Supporting document{' '}
                      <span style={{ fontWeight: 400, color: A.MUTE }}>(optional)</span>
                    </p>
                    <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '2px 0 0' }}>
                      A registration certificate or licence strengthens your request.
                    </p>
                  </div>


                  {docPath ? (
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: BIZ.card, border: `1px solid ${BIZ.hair}` }}
                    >
                      {docKind === 'image' && docPreviewUrl ? (
                        <img
                          src={docPreviewUrl}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-md flex items-center justify-center"
                          style={{ background: BIZ.fillStrong }}
                        >
                          {docKind === 'image' ? (
                            <ImageIcon className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                          ) : (
                            <FileText className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium truncate"
                          style={{ color: BIZ.ink }}
                        >
                          {docFileName}
                        </p>
                        <p className="text-[11px]" style={{ color: BIZ.inkMute }}>
                          Attached
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDocRemove}
                        className="h-8 w-8 rounded-md flex items-center justify-center"
                        style={{ color: BIZ.inkMute }}
                        aria-label="Remove document"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={docUploading}
                        className="w-full flex items-center justify-center gap-2"
                        style={{
                          minHeight: 44,
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'rgba(14,18,22,0.028)',
                          ...BIZ_LABEL,
                          color: A.INK,
                        }}
                      >
                        {docUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading
                          </>
                        ) : (
                          <>
                            <Upload size={13} strokeWidth={2.25} />
                            Attach image or PDF
                          </>
                        )}
                      </button>
                      <div
                        className="text-center"
                        style={{ ...BIZ_LABEL, fontSize: 7.5, marginTop: 6 }}
                      >
                        Max 10MB
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_DOC}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleDocPick(f);
                    }}
                  />
                </div>

                {validationError?.section === 'proof' && (
                  <p className="text-[12px] text-destructive mt-3">{validationError.message}</p>
                )}
              </SectionCard>

              {/* SECTION 3 */}
              <SectionCard
                ref={ownershipRef}
                number={3}
                title="Confirm you represent this business"
              >
                <div className="space-y-3">
                  <FieldGroup label="Contact email">
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@yourdomain.com"
                      type="email"
                    />
                    <p className="text-[11px]" style={{ color: BIZ.inkMute }}>
                      Use a business email if possible.
                    </p>
                  </FieldGroup>
                  <FieldGroup label="Your role">
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
                      <p style={{ ...BIZ_LABEL, fontSize: 7.5, color: A.MUTE, margin: '6px 0 0' }}>
                        Owners are typically verified fastest.
                      </p>
                    )}
                  </FieldGroup>
                  <FieldGroup
                    label="How are you connected to this business?"
                    hint="Max 500 characters"
                  >
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      placeholder="What does this business do, and what's your role?"
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </FieldGroup>

                </div>
                <p
                  className="text-[11px] mt-4 pt-3"
                  style={{ color: BIZ.inkMute, borderTop: `0.5px solid ${BIZ.hair}` }}
                >
                  By submitting, you confirm you're authorised to represent this business on clbhouz.
                </p>
                {validationError?.section === 'ownership' && (
                  <p className="text-[12px] text-destructive mt-3">{validationError.message}</p>
                )}
              </SectionCard>
            </div>
          )}
        </main>

        {/* Sticky footer — only for the single-page submit flow, not for domain-mode or confirmation */}
        {!showDomainMode && !confirmation && (
          <footer
            className="shrink-0 backdrop-blur-xl"
            style={{
              borderTop: `0.5px solid ${BIZ.hair}`,
              background: 'rgba(248,250,252,0.97)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="mx-auto flex w-full items-center gap-3 px-4 py-3">
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="flex-1 h-12 text-white border-0 text-[15px]"
                style={{ background: BIZ.ink, borderRadius: BIZ.rInner, fontWeight: 700 }}
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
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---- small building blocks ----

const SectionCard = React.forwardRef<
  HTMLDivElement,
  { number: number; title: string; children: React.ReactNode }
>(function SectionCard({ number, title, children }, ref) {
  return (
    <div
      ref={ref}
      className="rounded-2xl p-4"
      style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
    >
      <div className="flex items-baseline gap-2.5 mb-3">
        <span style={{ ...BIZ_LABEL, flexShrink: 0 }}>{`Step ${number}`}</span>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: A.INK, margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
});

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
  /** @deprecated rows no longer draw rules; kept so callers need not change. */
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '112px minmax(0,1fr)',
        alignItems: 'baseline',
        gap: 12,
        padding: '8px 0',
      }}
    >
      <span style={BIZ_LABEL}>{label}</span>
      {missing ? (
        <span className="text-[12px] text-destructive min-w-0 text-right">{missingMessage}</span>
      ) : (
        <span
          className="min-w-0 text-right overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ fontSize: 13.5, fontWeight: 600, color: A.INK }}
        >
          {value || ''}
        </span>
      )}
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-vf-field>
      <div style={{ ...BIZ_LABEL, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ ...BIZ_LABEL, fontSize: 7.5, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}


function ConfirmationView({
  requestId,
  method,
  onDone,
}: {
  requestId: string;
  method: ProofMethod;
  onDone: () => void;
}) {
  const shortRef = requestId.slice(0, 8).toUpperCase();
  const methodLabel = PROOF_OPTIONS.find((o) => o.id === method)?.label ?? method;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(5,150,105,0.10)' }}
      >
        <CheckCircle2 className="h-8 w-8" style={{ color: '#059669' }} />
      </div>
      <h2 className="mb-2" style={{ ...TITLE, color: BIZ.ink }}>
        Request submitted
      </h2>
      <p className="text-[14px] max-w-xs mx-auto" style={{ color: BIZ.inkMute }}>
        We'll review your request, usually within a few days, and let you know by notification
        and email.
      </p>
      <div
        className="mt-6 mx-auto max-w-xs rounded-2xl p-4 text-left"
        style={{ background: BIZ.card, border: `1px solid ${BIZ.hair}` }}
      >
        <div className="flex items-center justify-between py-1">
          <span className="text-[12px]" style={{ color: BIZ.inkMute }}>
            Reference
          </span>
          <span
            className="text-[13px] font-mono"
            style={{ color: BIZ.ink, letterSpacing: '0.02em' }}
          >
            {shortRef}
          </span>
        </div>
        <div
          className="flex items-center justify-between py-1"
          style={{ borderTop: `0.5px solid ${BIZ.hair}` }}
        >
          <span className="text-[12px]" style={{ color: BIZ.inkMute }}>
            Method
          </span>
          <span className="text-[13px]" style={{ color: BIZ.ink }}>
            {methodLabel}
          </span>
        </div>
      </div>
      <div className="mt-8">
        <Button
          onClick={onDone}
          className="w-full h-11 text-white border-0"
          style={{ background: BIZ.ink, borderRadius: BIZ.rInner }}
        >
          Done
        </Button>
      </div>
    </motion.div>
  );
}
