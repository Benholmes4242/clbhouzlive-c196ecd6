import { Skeleton } from '@/components/ui/skeleton';
import { TITLE } from '@/lib/tokens/type';
/**
 * VerificationFlowSheet — BRIEF_VERIFICATION_PHASE_3.
 *
 * The flow is no longer "pick one proof method". It is:
 *   1. ELIGIBILITY  — the three published signals as a checklist, with a LIVE
 *                     verdict on the two-of-three bar.
 *   2. EVIDENCE     — one screen per CLAIMED signal, and no others.
 *   3. OWNERSHIP    — who the applicant is to the business (unchanged question).
 *
 * The five legacy proof methods survive as the PRIMARY signal written to
 * proof_method / proof_value, so useProofConflict keeps working. The full
 * signal set lives in proof_metadata.signals — no migration.
 *
 * The mode='domain' entry (admin-initiated domain check on an existing pending
 * request) still renders the standalone DomainStep, unchanged.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
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
import VerificationCriteriaLink from './VerificationCriteriaLink';
import {
  PROOF_OPTIONS,
  REGISTRY_OPTIONS,
  ROLE_OPTIONS,
  isValidEmail,
  isValidUrl,
  type ProofMethod,
} from './steps/verificationTypes';
import {
  SIGNALS,
  NO_SIGNALS,
  PRESENCE_KINDS,
  evaluateBar,
  isFreeEmailDomain,
  emailDomain,
  primaryProofMethod,
  type ClaimedSignals,
  type PresenceKind,
  type SignalKey,
} from './signals';
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

type PageKey = 'eligibility' | SignalKey | 'ownership';

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

  // --- §2 eligibility ---
  const [claimed, setClaimed] = useState<ClaimedSignals>(NO_SIGNALS);
  const [pageIndex, setPageIndex] = useState(0);

  // --- domain evidence ---
  const [proofEmail, setProofEmail] = useState('');

  // --- document evidence ---
  const [proofRegistry, setProofRegistry] = useState('');
  const [proofRegistryName, setProofRegistryName] = useState('');
  const [proofCompanyNumber, setProofCompanyNumber] = useState('');
  const [proofRegistryUrl, setProofRegistryUrl] = useState('');

  // --- presence evidence ---
  const [presenceKind, setPresenceKind] = useState<PresenceKind>('website');
  const [presenceValue, setPresenceValue] = useState('');

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

  // --- OTP state (domain signal) ---
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ requestId: string; method: ProofMethod } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  // Reset the form each time the sheet is (re)opened.
  useEffect(() => {
    if (!open) return;
    setClaimed(NO_SIGNALS);
    setPageIndex(0);
    setExclusivityError('');
    setValidationError(null);
    setConfirmation(null);
    setProofEmail('');
    setProofRegistry('');
    setProofRegistryName('');
    setProofCompanyNumber('');
    setProofRegistryUrl('');
    setPresenceKind('website');
    setPresenceValue('');
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

  // ---- §2.2 the live verdict ----
  const bar = useMemo(() => evaluateBar(claimed), [claimed]);

  /** §3.1 — only claimed signals produce evidence screens. */
  const pages = useMemo<PageKey[]>(() => {
    const claimedPages = (['domain', 'document', 'presence'] as SignalKey[]).filter((k) => claimed[k]);
    return ['eligibility', ...claimedPages, 'ownership'];
  }, [claimed]);

  const safeIndex = Math.min(pageIndex, pages.length - 1);
  const page = pages[safeIndex];
  const isLast = safeIndex === pages.length - 1;

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    setValidationError(null);
  }, [safeIndex, pages.length]);

  // ---- §1.4 free-provider check, AT THE POINT OF ENTRY ----
  const emailIsFreeProvider = !!proofEmail.trim() && isValidEmail(proofEmail) && isFreeEmailDomain(proofEmail);

  const domainReady = !!proofEmail.trim() && isValidEmail(proofEmail) && !emailIsFreeProvider;
  const documentReady = !!docPath;
  const presenceReady = useMemo(() => {
    const v = presenceValue.trim();
    if (!v) return false;
    if (presenceKind === 'phone') return v.replace(/[^\d]/g, '').length >= 7;
    if (presenceKind === 'social') return v.length >= 3;
    return isValidUrl(v);
  }, [presenceKind, presenceValue]);

  /** Signals with usable evidence attached — what the reviewer will actually get. */
  const evidencedBar = useMemo(
    () =>
      evaluateBar({
        domain: claimed.domain && domainReady,
        document: claimed.document && documentReady,
        presence: claimed.presence && presenceReady,
      }),
    [claimed, domainReady, documentReady, presenceReady],
  );

  const detailsReady = !!business?.website && !!business?.email;

  // ---- §1.5 signal payload ----
  const buildSignals = () => {
    const signals: Record<string, unknown> = {};
    if (claimed.domain) {
      signals.domain = {
        type: 'business_email_otp',
        email: proofEmail.trim() || null,
        domain: emailDomain(proofEmail) || null,
        email_verified: otpEmailVerified,
        free_provider: emailIsFreeProvider,
        provided: domainReady,
      };
    }
    if (claimed.document) {
      signals.document = {
        registry_type: proofRegistry || null,
        registry_name: proofRegistryName.trim() || null,
        registration_number: proofCompanyNumber.trim() || null,
        registry_url: proofRegistryUrl.trim() || null,
        document_path: docPath,
        document_filename: docFileName,
        provided: documentReady,
      };
    }
    if (claimed.presence) {
      signals.presence = {
        kind: presenceKind,
        value: presenceValue.trim() || null,
        provided: presenceReady,
      };
    }
    return signals;
  };

  const primaryMethod = primaryProofMethod(claimed, presenceKind);

  const primaryProofValue = () => {
    if (claimed.domain) return proofEmail.trim();
    if (claimed.document)
      return proofCompanyNumber.trim() || proofRegistryUrl.trim() || proofRegistryName.trim() || (docPath ?? '');
    return presenceValue.trim();
  };

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

  function toggleSignal(key: SignalKey) {
    setClaimed((prev) => ({ ...prev, [key]: !prev[key] }));
    setExclusivityError('');
  }

  // ---- OTP flow (domain signal) ----
  async function ensureOtpRequest(): Promise<string | null> {
    if (otpRequestId) return otpRequestId;
    if (!user?.id) return null;
    const email = proofEmail.trim();
    if (!email || !isValidEmail(email)) return null;
    const domain = emailDomain(email);
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
        proof_metadata: { email_verified: false, otp_flow: true, signals: buildSignals() } as any,
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
    if (isFreeEmailDomain(email)) {
      toast.error('That is a personal mailbox, not a business domain.');
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

      if (bar.count === 0) {
        setValidationError('Mark at least one signal you can provide.');
        throw new Error('__validation__');
      }
      if (!contactEmail.trim() || !isValidEmail(contactEmail) || !role) {
        setValidationError(
          'Add your contact email and role so we can confirm you represent this business.',
        );
        throw new Error('__validation__');
      }
      setValidationError(null);

      const proof_value = primaryProofValue();
      if (!proof_value) throw new Error('Please complete the evidence for the signals you marked.');

      const signals = buildSignals();
      const proof_metadata: Record<string, unknown> = {
        // §1.5 the signal set, alongside the legacy flat fields the admin
        // console and useProofConflict already read.
        signals,
        claimed_signals: (Object.keys(claimed) as SignalKey[]).filter((k) => claimed[k]),
        bar_met: evidencedBar.met,
        email: claimed.domain ? proofEmail.trim() : null,
        email_verified: claimed.domain ? otpEmailVerified : false,
        registry_type: claimed.document ? proofRegistry || null : null,
        registry_name: claimed.document ? proofRegistryName.trim() || null : null,
        registration_number: claimed.document ? proofCompanyNumber.trim() || null : null,
        registry_url: claimed.document ? proofRegistryUrl.trim() || null : null,
        presence_kind: claimed.presence ? presenceKind : null,
        presence_value: claimed.presence ? presenceValue.trim() || null : null,
      };

      // Exclusivity check.
      const { data: existingApproved, error: checkError } = await supabase
        .from('business_verification_requests')
        .select('id, business_id')
        .eq('proof_method', primaryMethod)
        .eq('proof_value', proof_value)
        .eq('status', 'approved')
        .neq('business_id', businessId)
        .limit(1);
      if (checkError) throw checkError;
      if (existingApproved && existingApproved.length > 0) {
        throw new Error(
          PROOF_CONFLICT_MESSAGE[primaryMethod] ?? 'This proof is already linked to a verified business.',
        );
      }

      const payload: Record<string, unknown> = {
        website: business?.website || null,
        note: notes || null,
        proof_method: primaryMethod,
        proof_value,
        proof_metadata,
        contact_email: contactEmail.trim() || null,
        contact_role: role || null,
        proof_document_url: docPath,
      };

      let requestId = otpRequestId;
      if (requestId) {
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

      return { requestId: requestId as string, method: primaryMethod };
    },
    onSuccess: (result) => {
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

  const canContinue = page === 'eligibility' ? bar.count > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-[440px] w-full h-[100dvh] sm:h-[92vh] sm:max-h-[820px] sm:rounded-2xl flex flex-col overflow-hidden border-0"
        style={{ background: BIZ.pageBg }}
      >
        <header
          className="sticky top-0 z-10 shrink-0"
          style={{
            background: BIZ.pageBg,
            borderBottom: '1px solid rgba(15,23,42,0.08)',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          }}
        >
          <div className="flex items-center gap-3 px-4" style={{ paddingBottom: 12, minHeight: 56 }}>
            <button
              onClick={() => {
                if (!showDomainMode && !confirmation && safeIndex > 0) setPageIndex(safeIndex - 1);
                else onOpenChange(false);
              }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#fff', border: '1px solid rgba(15,23,42,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
              aria-label={safeIndex > 0 ? 'Back' : 'Close'}
            >
              <ChevronLeft size={18} strokeWidth={2.5} style={{ color: '#0F172A' }} />
            </button>
            <h2 style={{ ...TITLE, color: '#0F172A', lineHeight: 1, margin: 0 }}>
              {showDomainMode ? 'Verify domain' : 'Get verified'}
            </h2>
            {!showDomainMode && !confirmation && (
              <span style={{ ...BIZ_LABEL, marginLeft: 'auto' }}>
                {safeIndex + 1} / {pages.length}
              </span>
            )}
          </div>
        </header>

        <main ref={mainRef as any} className="flex-1 overflow-y-auto px-4 py-4 pb-32">
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

              {/* ================= STEP 1 — ELIGIBILITY ================= */}
              {page === 'eligibility' && (
                <>
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
                      <div style={BIZ_LABEL}>The bar</div>
                      <div style={{ ...bizFigure(19), marginTop: 6 }}>2 of 3</div>
                    </div>
                    <div className="text-center" style={{ minWidth: 0 }}>
                      <div style={BIZ_LABEL}>Reviewed</div>
                      <div style={{ ...bizFigure(15), marginTop: 8 }}>By hand</div>
                    </div>
                  </div>

                  <SectionCard number={1} title="What can you show us?">
                    <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '0 0 10px' }}>
                      Mark every signal you can provide. You need two, and at least one must be a
                      business domain or a document.
                    </p>

                    <div role="group" aria-label="Signals you can provide">
                      {SIGNALS.map((s) => {
                        const on = claimed[s.key];
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleSignal(s.key)}
                            className="w-full flex items-start gap-3 text-left"
                            style={{
                              minHeight: 44,
                              padding: '11px 0',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <span
                              aria-hidden
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: 16,
                                height: 16,
                                marginTop: 2,
                                borderRadius: 5,
                                background: on ? A.INK : 'transparent',
                                border: on ? 'none' : '1.5px solid #CBD2DA',
                              }}
                            >
                              {on && <Check size={10} strokeWidth={3.25} style={{ color: '#FFFFFF' }} />}
                            </span>
                            <Icon size={14} className="shrink-0" style={{ color: A.MUTE, marginTop: 2 }} />
                            <span className="flex-1 min-w-0">
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: 13.5,
                                  fontWeight: on ? 700 : 600,
                                  color: A.INK,
                                  lineHeight: 1.3,
                                }}
                              >
                                {s.label}
                                {!s.qualifying && (
                                  <span style={{ fontWeight: 500, color: A.MUTE }}> — never enough alone</span>
                                )}
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
                                {s.what}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* §2.2 THE LIVE VERDICT */}
                    <div
                      role="status"
                      aria-live="polite"
                      className="mt-3 flex items-start gap-2.5 p-3"
                      style={{
                        borderRadius: 12,
                        background: bar.met ? 'rgba(5,150,105,0.08)' : 'rgba(14,18,22,0.035)',
                      }}
                    >
                      {bar.met ? (
                        <CheckCircle2 size={15} style={{ color: '#059669', marginTop: 1 }} />
                      ) : (
                        <AlertTriangle size={15} style={{ color: A.MUTE, marginTop: 1 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: bar.met ? '#047857' : A.INK }}>
                          {bar.met ? 'You meet the bar' : 'Not there yet'}
                        </div>
                        <div style={{ ...BIZ_BODY, fontSize: 12.5, marginTop: 2 }}>
                          {bar.met
                            ? 'Next we will ask only for the evidence you marked.'
                            : bar.missing}
                        </div>
                      </div>
                    </div>

                    {/* §2.5 SOFT BLOCK — plain warning, never a refusal. */}
                    {bar.count > 0 && !bar.met && (
                      <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '10px 0 0' }}>
                        You can still submit below the bar, but a reviewer will decline it for the
                        reason above.
                      </p>
                    )}

                    {/* §2.4 the criteria link belongs here now. */}
                    <div className="mt-1">
                      <VerificationCriteriaLink onNavigate={() => onOpenChange(false)} />
                    </div>
                  </SectionCard>
                </>
              )}

              {/* ================= DOMAIN EVIDENCE ================= */}
              {page === 'domain' && (
                <SectionCard number={safeIndex + 1} title="Confirm your business domain">
                  <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '0 0 12px' }}>
                    Enter an address on your business's own domain. We send a 6-digit code to it.
                  </p>
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
                              !domainReady || otpSending || sendCode.isPending
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
                      {/* §1.4 THE REASON, IN THE FLOW, AT THE POINT OF ENTRY. */}
                      {emailIsFreeProvider ? (
                        <p className="text-[12px]" style={{ color: '#B91C1C', marginTop: 6, lineHeight: 1.4 }}>
                          {emailDomain(proofEmail)} is a personal mailbox provider. It proves you
                          control an inbox, not that you are connected to this business, so it does
                          not count as a domain signal. Use an address on your own domain — or
                          go back and claim a document instead.
                        </p>
                      ) : (
                        <p className="text-[11px]" style={{ color: BIZ.inkMute }}>
                          Verifying the code now speeds up review.
                        </p>
                      )}
                    </FieldGroup>

                    {otpSent && !otpEmailVerified && (
                      <div className="space-y-2">
                        <Label className="text-[13px]" style={{ color: BIZ.ink }}>
                          Enter the 6-digit code
                        </Label>
                        <div className="flex items-center gap-3">
                          <InputOTP value={otpCode} onChange={setOtpCode} maxLength={6} onComplete={handleVerifyOtp}>
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
                            {verifyCode.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Verify'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* ================= DOCUMENT EVIDENCE ================= */}
              {page === 'document' && (
                <SectionCard number={safeIndex + 1} title="Attach a document">
                  {/* §3.3 what it must SHOW, not what kind it must be. */}
                  <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '0 0 12px' }}>
                    One document that shows your business name, legibly. A registration, a licence,
                    a tax record, an invoice header — the kind matters less than the name being
                    readable. Image or PDF, up to 10 MB.
                  </p>

                  {docPath ? (
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: BIZ.card, border: `1px solid ${BIZ.hair}` }}
                    >
                      {docKind === 'image' && docPreviewUrl ? (
                        <img src={docPreviewUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
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
                        <p className="text-[13px] font-medium truncate" style={{ color: BIZ.ink }}>
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
                      <div className="text-center" style={{ ...BIZ_LABEL, fontSize: 7.5, marginTop: 6 }}>
                        Image or PDF · Max 10MB
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

                  <div className="space-y-3 mt-4">
                    <FieldGroup label="What kind of document is it?">
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
                    {/* Phase 1: the applicant names their OWN registry. */}
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
                        placeholder="As it appears on your document"
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

                  {!documentReady && (
                    <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '10px 0 0' }}>
                      Without a document attached, this signal does not count.
                    </p>
                  )}
                </SectionCard>
              )}

              {/* ================= PRESENCE EVIDENCE ================= */}
              {page === 'presence' && (
                <SectionCard number={safeIndex + 1} title="Show us your presence">
                  <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '0 0 12px' }}>
                    Something public that matches this business. A reviewer judges whether it does —
                    we only check the shape of what you enter.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {PRESENCE_KINDS.map((k) => {
                      const active = presenceKind === k.value;
                      return (
                        <button
                          key={k.value}
                          type="button"
                          onClick={() => setPresenceKind(k.value)}
                          aria-pressed={active}
                          className="px-1 text-[13px] min-h-[44px]"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontWeight: active ? 700 : 500,
                            color: active ? A.INK : A.MUTE,
                          }}
                        >
                          {k.label}
                        </button>
                      );
                    })}
                  </div>
                  <FieldGroup label={PRESENCE_KINDS.find((k) => k.value === presenceKind)!.label}>
                    <Input
                      value={presenceValue}
                      onChange={(e) => setPresenceValue(e.target.value)}
                      placeholder={PRESENCE_KINDS.find((k) => k.value === presenceKind)!.placeholder}
                      type={presenceKind === 'phone' ? 'tel' : 'text'}
                    />
                    {!!presenceValue.trim() && !presenceReady && (
                      <p className="text-[12px]" style={{ color: '#B91C1C', marginTop: 6 }}>
                        {presenceKind === 'phone'
                          ? 'That does not look like a phone number.'
                          : presenceKind === 'social'
                            ? 'Enter a handle or a profile link.'
                            : 'Enter a full web address.'}
                      </p>
                    )}
                  </FieldGroup>
                </SectionCard>
              )}

              {/* ================= OWNERSHIP ================= */}
              {page === 'ownership' && (
                <>
                  <SectionCard number={safeIndex + 1} title="Confirm you represent this business">
                    {/* §3.5 kept: who you are is a separate question from whether
                        the business is real, and the reviewer needs both. */}
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
                            Owners can usually answer our questions fastest.
                          </p>
                        )}
                      </FieldGroup>
                      <FieldGroup label="How are you connected to this business?" hint="Max 500 characters">
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
                  </SectionCard>

                  <SectionCard number={safeIndex + 2} title="Your details">
                    <div>
                      <DetailRow label="Business name" value={business?.name} />
                      <DetailRow label="Category" value={business?.category} />
                      <DetailRow label="Location" value={business?.location} />
                      <DetailRow
                        label="Website"
                        value={business?.website}
                        missing={!business?.website}
                        missingMessage="Not set"
                      />
                      <DetailRow
                        label="Contact email"
                        value={business?.email}
                        missing={!business?.email}
                        missingMessage="Not set"
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
                  </SectionCard>

                  {/* §2.5 the warning follows them to the submit screen. */}
                  {!evidencedBar.met && (
                    <div
                      className="flex items-start gap-2.5 p-3"
                      style={{ borderRadius: 12, background: 'rgba(185,28,28,0.06)' }}
                    >
                      <AlertTriangle size={15} style={{ color: '#B91C1C', marginTop: 1 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>
                          This will be declined
                        </div>
                        <div style={{ ...BIZ_BODY, fontSize: 12.5, marginTop: 2 }}>
                          {evidencedBar.missing || 'The evidence attached does not meet the two-of-three bar.'}{' '}
                          You can submit anyway, but a reviewer will decline it for that reason.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {exclusivityError && (
                <p className="text-[12px] text-destructive bg-destructive/10 p-3 rounded-lg">
                  {exclusivityError}
                </p>
              )}
              {validationError && <p className="text-[12px] text-destructive">{validationError}</p>}
              {!detailsReady && page === 'ownership' && (
                <p style={{ ...BIZ_BODY, fontSize: 12.5 }}>
                  Adding a website and contact email to your profile helps the reviewer place you.
                </p>
              )}
            </div>
          )}
        </main>

        {!showDomainMode && !confirmation && !isLoadingBusiness && (
          <footer
            className="shrink-0 backdrop-blur-xl"
            style={{
              borderTop: `0.5px solid ${BIZ.hair}`,
              background: 'rgba(248,250,252,0.97)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="mx-auto flex w-full items-center gap-3 px-4 py-3">
              {safeIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setPageIndex(safeIndex - 1)}
                  className="h-12 px-5 text-[15px]"
                  style={{ borderRadius: BIZ.rInner }}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={() => (isLast ? submitMutation.mutate() : setPageIndex(safeIndex + 1))}
                disabled={submitMutation.isPending || !canContinue}
                className="flex-1 h-12 text-white border-0 text-[15px]"
                style={{ background: BIZ.ink, borderRadius: BIZ.rInner, fontWeight: 700 }}
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : isLast ? (
                  'Submit for review'
                ) : (
                  'Continue'
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
        We review every request by hand, and let you know by notification and email.
      </p>
      <div
        className="mt-6 mx-auto max-w-xs rounded-2xl p-4 text-left"
        style={{ background: BIZ.card, border: `1px solid ${BIZ.hair}` }}
      >
        <div className="flex items-center justify-between py-1">
          <span className="text-[12px]" style={{ color: BIZ.inkMute }}>
            Reference
          </span>
          <span className="text-[13px] font-mono" style={{ color: BIZ.ink, letterSpacing: '0.02em' }}>
            {shortRef}
          </span>
        </div>
        <div
          className="flex items-center justify-between py-1"
          style={{ borderTop: `0.5px solid ${BIZ.hair}` }}
        >
          <span className="text-[12px]" style={{ color: BIZ.inkMute }}>
            Primary signal
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
