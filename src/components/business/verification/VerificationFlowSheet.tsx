import { Skeleton } from '@/components/ui/skeleton';
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
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import { RailChips } from '@/components/ui/RailChips';
import { cn } from '@/lib/utils';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { BIZ } from '@/components/business/businessTokens';
import {
  A,
  BIZ_LABEL,
  BIZ_BODY,
} from '@/features/courses/components/holes/analytical/tokens';
import DomainStep from './steps/DomainStep';
import { MEMBER_PANEL, surfaceWithAlpha } from '@/lib/tokens/surfaces';
import { Group, Row, RowList } from './manageRows';
import { INK, INK_45, INK_30, INK_60, GREEN, HAIR, SF_STACK } from '@/components/manage/ui';

/**
 * B5 — every control in the wizard takes the field canon (6% rest ground, 10%
 * rest border, radius 14, 38% placeholder, focus-within step). No inline
 * background/border/radius on a control, or the focus step dies silently.
 */
const FIELD_CLASS = cn(
  FIELD_PAINT_CLASS,
  FIELD_PLACEHOLDER_CLASS,
  'h-auto min-h-[44px] px-[13px] py-3 text-[14px] font-normal',
);

const SIGNAL_PHRASE: Record<SignalKey, string> = {
  domain: 'a business domain',
  document: 'a document',
  presence: 'your presence',
};

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
import {
  REGISTRY_OPTIONS,
  ROLE_OPTIONS,
  isValidEmail,
  isValidUrl,
  type ProofMethod,
} from './steps/verificationTypes';
import {
  SIGNALS,
  signalOfProofMethod,
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
  const navigate = useNavigate();
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

  // --- presence evidence --- (B3a: one draft PER KIND; switching preserves each)
  const [presenceKind, setPresenceKind] = useState<PresenceKind>('website');
  const [presenceValues, setPresenceValues] = useState<Record<PresenceKind, string>>({
    website: '', listing: '', social: '', phone: '',
  });
  const presenceValue = presenceValues[presenceKind];

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
  const mainRef = useRef<HTMLDivElement | null>(null);

  // Reset the form each time the sheet is (re)opened.
  useEffect(() => {
    if (!open) return;
    setClaimed(NO_SIGNALS);
    setPageIndex(0);
    setExclusivityError('');
    setValidationError(null);
    setConfirmation(null);
    setProofEmail('');
    setContactEmail('');
    setProofRegistry('');
    setProofRegistryName('');
    setProofCompanyNumber('');
    setProofRegistryUrl('');
    setPresenceKind('website');
    setPresenceValues({ website: '', listing: '', social: '', phone: '' });
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
    // A1 — runs AFTER the reset (declared later, same open trigger). The
    // functional update reads the queued '' from the reset, never a stale value.
    if (!open || !business?.email) return;
    const email = business.email;
    setContactEmail((prev) => prev || email);
  }, [open, businessId, business?.email]);

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
    // B9g — move focus to the new step's heading so the change is announced.
    requestAnimationFrame(() => {
      const h = mainRef.current?.querySelector<HTMLElement>('h3[data-vf-heading]');
      h?.focus({ preventScroll: true });
    });
  }, [safeIndex, pages.length]);

  // ---- §1.4 free-provider check, AT THE POINT OF ENTRY ----
  const emailIsFreeProvider = !!proofEmail.trim() && isValidEmail(proofEmail) && isFreeEmailDomain(proofEmail);

  const domainReady = !!proofEmail.trim() && isValidEmail(proofEmail) && !emailIsFreeProvider;
  const documentReady = !!docPath;
  const presenceReady = useMemo(() => {
    const v = presenceValue.trim();
    if (!v) return false;
    if (presenceKind === 'phone') return v.replace(/[^\d]/g, '').length >= 7;
    // B3e — a handle ("@" + at least 2 more) or a real profile link.
    if (presenceKind === 'social') return /^@\S{2,}$/.test(v) || isValidUrl(v);
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

  /**
   * §3 — claimed signals with NOTHING behind them, derived from the SAME
   * readiness flags buildSignals() writes as `provided`. A domain with an email
   * entered but no code counts as provided: it gets checked by hand.
   */
  const unevidencedSignals = useMemo(() => {
    const out: SignalKey[] = [];
    if (claimed.domain && !domainReady) out.push('domain');
    if (claimed.document && !documentReady) out.push('document');
    if (claimed.presence && !presenceReady) out.push('presence');
    return out;
  }, [claimed, domainReady, documentReady, presenceReady]);

  const stepEmpty =
    (page === 'domain' && !domainReady) ||
    (page === 'document' && !documentReady) ||
    (page === 'presence' && !presenceReady);



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
    // B10a — unticking the document drops the upload too (best-effort storage remove).
    if (key === 'document' && claimed.document && docPath) void handleDocRemove();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        proof_metadata: { email_verified: false, otp_flow: true, signals: buildSignals() } as any,
        contact_email: contactEmail.trim() || business?.email || null,
        contact_role: role || null,
        note: notes || null,
        domain,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // A validation stop must be VISIBLE. It sets the inline message, is
      // surfaced as a toast, and is tagged so onError can scroll it into view.
      const stop = (msg: string) => {
        setValidationError(msg);
        const e: any = new Error(msg);
        e.isValidation = true;
        throw e;
      };

      if (bar.count === 0) {
        stop('Mark at least one signal you can provide.');
      }
      if (!contactEmail.trim() || !isValidEmail(contactEmail) || !role) {
        stop('Add your contact email and role so we can confirm you represent this business.');
      }
      setValidationError(null);


      const proof_value = primaryProofValue();
      if (!proof_value) stop('Please complete the evidence for the signals you marked.');

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
        const conflict = new Error(
          PROOF_CONFLICT_MESSAGE[primaryMethod] ?? 'This proof is already linked to a verified business.',
        ) as Error & { isProofConflict?: boolean };
        conflict.isProofConflict = true;
        throw conflict;
      }

      const payload: Record<string, unknown> = {
        website: business?.website || null,
        note: notes || null,
        proof_method: primaryMethod,
        proof_value,
        proof_metadata,
        contact_email: contactEmail.trim() || null,
        contact_role: role || null,
        proof_document_url: claimed.document ? docPath : null,
      };

      let requestId = otpRequestId;
      if (requestId) {
        const { data, error } = await supabase
          .from('business_verification_requests')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(payload as any)
          .eq('id', requestId)
          .select('id');
        if (error) throw error;
        // An update that matches nothing is a FAILURE, not a success. Without
        // this the sheet would report a submission that never landed.
        if (!data || data.length === 0) {
          throw new Error('We could not save your request. Please try again.');
        }
      } else {
        const { data, error } = await supabase
          .from('business_verification_requests')
          .insert({
            business_id: businessId,
            requested_by: user.id,
            status: 'pending',
            ...payload,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Pressing submit ALWAYS lands somewhere the member can see: the
      // confirmation screen plus a toast, so the outcome is never ambiguous.
      toast.success('Verification request submitted');
      setConfirmation(result);
    },
    onError: (error: unknown) => {
      const err = error as Error & { isValidation?: boolean; isProofConflict?: boolean };
      const message = err?.message || 'Failed to submit verification request';
      if (err?.isProofConflict) setExclusivityError(message);
      // Validation stops used to be swallowed entirely — the member pressed
      // submit and nothing moved. Now every stop toasts and scrolls into view.
      toast.error(message);
      requestAnimationFrame(() => {
        const el = mainRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
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
            borderBottom: `1px solid ${HAIR}`,
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
                background: BIZ.fill, border: `1px solid ${BIZ.hair}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
              aria-label={!confirmation && !showDomainMode && safeIndex > 0 ? 'Back' : 'Close'}
            >
              <ChevronLeft size={18} strokeWidth={2.5} style={{ color: A.INK }} />
            </button>
            <DialogTitle asChild>
              <h2 style={{ fontFamily: SF_STACK, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: INK, lineHeight: 1, margin: 0 }}>
                {showDomainMode ? 'Verify domain' : 'Get verified'}
              </h2>
            </DialogTitle>
            {!showDomainMode && !confirmation && (
              <span role="status" aria-live="polite" style={{ ...BIZ_LABEL, marginLeft: 'auto' }}>
                {safeIndex + 1} / {pages.length}
              </span>
            )}
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 py-4 pb-32">
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


              {/* ================= STEP 1 — ELIGIBILITY ================= */}
              {page === 'eligibility' && (
                <>
                  <p
                    style={{
                      fontFamily: SF_STACK,
                      fontSize: 15.5,
                      fontWeight: 400,
                      lineHeight: 1.45,
                      color: INK_60,
                      margin: '0 0 20px',
                    }}
                  >
                    Mark every signal you can provide. We only ask for the evidence you mark.
                  </p>

                  {/* §6.2 — the three signals as ONE group of toggle rows. */}
                  <Group
                    header="What can you show us?"
                    footnote="Two of the three, and at least one a business domain or a document. An address on a personal mailbox provider — gmail, outlook, icloud and the like — is not a domain signal."
                  >
                    <div role="group" aria-label="Signals you can provide">
                      {SIGNALS.map((s, i) => {
                        const on = claimed[s.key];
                        return (
                          <React.Fragment key={s.key}>
                            {i > 0 && <div style={{ height: 1, background: HAIR, marginLeft: 14 }} />}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() => toggleSignal(s.key)}
                              className="w-full flex items-center text-left active:opacity-60"
                              style={{
                                gap: 12,
                                minHeight: 44,
                                padding: '12px 14px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: SF_STACK,
                              }}
                            >
                              <span
                                aria-hidden
                                className="flex items-center justify-center shrink-0"
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 6,
                                  background: on ? INK : 'transparent',
                                  border: on ? 'none' : `1.5px solid ${INK_30}`,
                                }}
                              >
                                {on && <Check size={11} strokeWidth={3} style={{ color: A.CANVAS }} />}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: 17,
                                    fontWeight: 400,
                                    color: INK,
                                    lineHeight: 1.25,
                                    letterSpacing: '-0.01em',
                                  }}
                                >
                                  {s.label}
                                </span>
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: 13,
                                    fontWeight: 400,
                                    color: INK_45,
                                    lineHeight: 1.35,
                                    marginTop: 2,
                                  }}
                                >
                                  {s.what}
                                </span>
                              </span>
                              <span
                                style={{
                                  fontSize: 15.5,
                                  fontWeight: 400,
                                  color: INK_45,
                                  flexShrink: 0,
                                }}
                              >
                                {s.qualifying ? 'Qualifying' : 'Supporting'}
                              </span>
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </Group>

                  {/* B2a THE LIVE VERDICT — a sentence, never a count. */}
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex"
                    style={{ background: A.SOFT, borderRadius: 12, padding: '12px 13px', marginTop: 12, gap: 10 }}
                  >
                    <span
                      aria-hidden
                      className="flex-none"
                      style={{
                        width: 7, height: 7, borderRadius: '50%', marginTop: 5,
                        background: bar.met ? A.GREEN : BIZ.amber,
                      }}
                    />
                    <p style={{ fontFamily: SF_STACK, fontSize: 12.5, lineHeight: 1.45, color: A.BODY, margin: 0 }}>
                      <span style={{ color: A.INK, fontWeight: 700 }}>{bar.met ? 'That works.' : 'Not yet.'}</span>{' '}
                      {bar.met
                        ? `You'll show us ${joinAnd(
                            SIGNALS.filter((s) => claimed[s.key]).map((s) => SIGNAL_PHRASE[s.key]),
                          )}. We need two signals, and at least one has to be a domain or a document.`
                        : bar.missing}
                    </p>
                  </div>

                  {/* §5.4 — the criteria as a chevron row. */}
                  <Group header="Before you start">
                    <RowList>
                      <Row label="Cost" value="Free" />
                      <Row label="Reviewed by" value="A person" />
                      <Row
                        label="How verification works"
                        onClick={() => {
                          onOpenChange(false);
                          navigate('/legal/business-verification');
                        }}
                      />
                    </RowList>
                  </Group>
                </>
              )}

              {/* ================= DOMAIN EVIDENCE ================= */}
              {page === 'domain' && (
                <SectionCard title="Confirm your business domain">
                  <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '0 0 12px' }}>
                    Enter an address on your business's own domain. We send a 6-digit code to it.
                  </p>
                  <div className="space-y-3">
                    <FieldGroup label="Business email">
                      {(id) => (
                        <>
                          <div className="flex gap-2">
                            <Input
                              id={id}
                              value={proofEmail}
                              onChange={(e) => {
                                setProofEmail(e.target.value);
                                if (otpEmailVerified) setOtpEmailVerified(false);
                                if (otpSent) setOtpSent(false);
                                // B7b — a code must never be checked against a previous address.
                                setOtpVerificationId(null);
                                setOtpCode('');
                              }}
                              placeholder="name@yourbusiness.com"
                              type="email"
                              disabled={otpEmailVerified}
                              className={cn(FIELD_CLASS, 'flex-1')}
                            />
                            {otpEmailVerified ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 rounded-md text-[12px] font-semibold"
                                style={{ background: A.SOFT, color: A.GREEN }}
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
                                disabled={!domainReady || otpSending || sendCode.isPending}
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
                            <p role="alert" className="text-[12px]" style={{ color: A.RED, marginTop: 6, lineHeight: 1.4 }}>
                              {emailDomain(proofEmail)} is a personal mailbox provider. It proves you
                              control an inbox, not that you are connected to this business, so it does
                              not count as a domain signal. Use an address on your own domain — or
                              go back and claim a document instead.
                            </p>
                          ) : otpEmailVerified ? (
                            <>
                              <p style={{ fontFamily: SF_STACK, fontSize: 13, fontWeight: 400, marginTop: 6, color: GREEN }}>
                                {emailDomain(proofEmail)} is a business domain, not a mailbox provider.
                              </p>
                              {/* B7c — a way back from a verified address. */}
                              <button
                                type="button"
                                onClick={() => {
                                  setProofEmail('');
                                  setOtpEmailVerified(false);
                                  setOtpSent(false);
                                  setOtpVerificationId(null);
                                  setOtpCode('');
                                }}
                                className="min-h-[44px]"
                                style={{ ...BIZ_LABEL, color: A.INK, background: 'transparent', border: 'none', padding: 0 }}
                              >
                                Use a different email
                              </button>
                            </>
                          ) : !proofEmail.trim() ? (
                            <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '6px 0 0' }}>
                              You can continue without this. Your domain will be checked by hand, which takes longer.
                            </p>
                          ) : !isValidEmail(proofEmail) ? (
                            <p style={{ fontFamily: SF_STACK, fontSize: 12.5, color: A.DIM, margin: '6px 0 0' }}>
                              That isn't a complete email address yet.
                            </p>
                          ) : (
                            <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '6px 0 0' }}>
                              Confirm it now and it's done. Continue without it and a reviewer checks by hand, which takes longer.
                            </p>
                          )}
                        </>
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
                            /* INK fill takes a CANVAS label; white-on-white
                               after BIZ.ink was re-pointed to A.INK. */
                            style={{ background: BIZ.ink, color: A.CANVAS }}
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
                <SectionCard title="Attach a document">
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
                          background: BIZ.fill,
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
                      <div className="text-center" style={{ ...BIZ_LABEL, marginTop: 6 }}>
                        Image or PDF · Max 10MB
                      </div>
                      {/* B10e — the reason sits with the thing that fixes it. */}
                      <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '8px 0 0', textAlign: 'center' }}>
                        Without a document attached, this signal does not count.
                      </p>
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
                      {(id) => (
                        <Select value={proofRegistry} onValueChange={setProofRegistry}>
                          <SelectTrigger id={id} className={FIELD_CLASS}>
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
                      )}
                    </FieldGroup>
                    {/* Phase 1: the applicant names their OWN registry. */}
                    <FieldGroup label="Name of register or authority">
                      {(id) => (
                        <Input
                          id={id}
                          className={FIELD_CLASS}
                          value={proofRegistryName}
                          onChange={(e) => setProofRegistryName(e.target.value)}
                          placeholder="e.g. your national company register"
                        />
                      )}
                    </FieldGroup>
                    <FieldGroup label="Registration number">
                      {(id) => (
                        <Input
                          id={id}
                          className={FIELD_CLASS}
                          value={proofCompanyNumber}
                          onChange={(e) => setProofCompanyNumber(e.target.value)}
                          placeholder="As it appears on your document"
                        />
                      )}
                    </FieldGroup>
                    <FieldGroup label="Registry URL" hint="If your register is searchable online.">
                      {(id) => (
                        <Input
                          id={id}
                          className={FIELD_CLASS}
                          value={proofRegistryUrl}
                          onChange={(e) => setProofRegistryUrl(e.target.value)}
                          placeholder="https://…"
                          type="url"
                        />
                      )}
                    </FieldGroup>
                  </div>
                </SectionCard>
              )}

              {/* ================= PRESENCE EVIDENCE ================= */}
              {page === 'presence' && (
                <SectionCard title="Show us your presence">
                  <p style={{ ...BIZ_BODY, fontSize: 12.5, margin: '0 0 12px' }}>
                    One public thing that matches this business.{' '}
                    <span style={{ color: A.INK, fontWeight: 700 }}>
                      One is enough — this counts as a single signal however you evidence it.
                    </span>
                  </p>
                  <div style={{ fontFamily: SF_STACK, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.MUTE, marginBottom: 8 }}>
                    Choose one
                  </div>
                  <RailChips
                    options={PRESENCE_KINDS.map((k) => ({ id: k.value, label: k.short }))}
                    value={presenceKind}
                    onChange={(id) => setPresenceKind(id as PresenceKind)}
                    ariaLabel="Kind of presence"
                    style={{ marginBottom: 12 }}
                  />
                  <FieldGroup
                    label={PRESENCE_KINDS.find((k) => k.value === presenceKind)!.label}
                  >
                    {(id) => (
                      <>
                        <Input
                          id={id}
                          className={FIELD_CLASS}
                          value={presenceValue}
                          onChange={(e) => setPresenceValues((v) => ({ ...v, [presenceKind]: e.target.value }))}
                          placeholder={PRESENCE_KINDS.find((k) => k.value === presenceKind)!.placeholder}
                          type={presenceKind === 'phone' ? 'tel' : 'text'}
                        />
                        {!!presenceValue.trim() && !presenceReady && (
                          <p role="alert" className="text-[12px]" style={{ color: A.RED, marginTop: 6 }}>
                            {presenceKind === 'phone'
                              ? 'That does not look like a phone number.'
                              : presenceKind === 'social'
                                ? 'Enter a handle or a profile link.'
                                : 'Enter a full web address.'}
                          </p>
                        )}
                        <p style={{ fontFamily: SF_STACK, fontSize: 11.5, color: A.DIM, margin: '6px 0 0' }}>
                          A reviewer judges whether it matches. We only check the shape.
                        </p>
                      </>
                    )}
                  </FieldGroup>
                </SectionCard>
              )}

              {/* ================= OWNERSHIP ================= */}
              {page === 'ownership' && (
                <>
                  <SectionCard title="Confirm you represent this business">
                    {/* §3.5 kept: who you are is a separate question from whether
                        the business is real, and the reviewer needs both. */}
                    <div className="space-y-3">
                      <FieldGroup label="Contact email" hint="Use a business email if possible.">
                        {(id) => (
                          <Input
                            id={id}
                            className={FIELD_CLASS}
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="name@yourdomain.com"
                            type="email"
                          />
                        )}
                      </FieldGroup>
                      <FieldGroup
                        label="Your role"
                        hint={role === 'owner' ? 'Owners can usually answer our questions fastest.' : undefined}
                      >
                        {() => (
                          <RailChips
                            options={ROLE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
                            value={role}
                            onChange={setRole}
                            ariaLabel="Your role"
                          />
                        )}
                      </FieldGroup>
                      <FieldGroup label="How are you connected to this business?" hint="Max 500 characters">
                        {(id) => (
                          <Textarea
                            id={id}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                            placeholder="What does this business do, and what's your role?"
                            rows={3}
                            className={cn(FIELD_CLASS, 'resize-none')}
                          />
                        )}
                      </FieldGroup>
                    </div>
                    <p
                      className="text-[11px] mt-4 pt-3"
                      style={{ color: BIZ.inkMute, borderTop: `0.5px solid ${BIZ.hair}` }}
                    >
                      By submitting, you confirm you're authorised to represent this business on clbhouz.
                    </p>
                  </SectionCard>

                  {/* B2b — what the reviewer will actually receive, not a count. */}
                  <section>
                    <div style={{ fontFamily: SF_STACK, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.MUTE, marginBottom: 8 }}>
                      What the reviewer will get
                    </div>
                    <dl
                      style={{ background: BIZ.card, border: `1px solid ${HAIR}`, borderRadius: 14, margin: 0, overflow: 'hidden' }}
                    >
                      {SIGNALS.filter((s) => claimed[s.key]).map((s) => {
                        const ready =
                          s.key === 'domain' ? domainReady : s.key === 'document' ? documentReady : presenceReady;
                        const text =
                          s.key === 'domain'
                            ? ready ? 'Confirmed' : 'Not confirmed'
                            : s.key === 'document'
                              ? ready ? 'Attached' : 'Nothing attached'
                              : ready ? 'Given' : 'Nothing given';
                        return (
                          <DetailRow key={s.key} label={s.label} value={text} tone={ready ? A.GREEN : A.DIM} />
                        );
                      })}
                      <DetailRow label="Business name" value={business?.name} />
                      <DetailRow label="Category" value={business?.category} />
                      <DetailRow label="Location" value={business?.location} />
                      <DetailRow label="Website" value={business?.website} />
                      <DetailRow label="Profile email" value={business?.email} />
                    </dl>

                    <p style={{ fontFamily: SF_STACK, fontSize: 12.5, lineHeight: 1.45, color: A.BODY, margin: '12px 0 0' }}>
                      {unevidencedSignals.length === 0 && evidencedBar.met ? (
                        "Everything's here. A reviewer will look at this within a few days."
                      ) : (
                        <>
                          <span style={{ color: A.INK, fontWeight: 700 }}>
                            {evidencedBar.display === 0
                              ? 'No signals of the two yet.'
                              : evidencedBar.display === 1
                                ? 'One signal of the two.'
                                : 'Both signals are in.'}
                          </span>
                          {unevidencedSignals.length > 0 &&
                            ` You marked ${joinAnd(unevidencedSignals.map((k) => SIGNAL_PHRASE[k]))} but haven't given anything to check.`}
                          {' '}You can still submit — a reviewer will look either way, it just takes longer.
                        </>
                      )}
                    </p>

                    {missingDetailCount > 0 && (
                      <div style={{ fontFamily: SF_STACK, fontSize: 11.5, color: A.DIM, marginTop: 8 }}>
                        Adding a website and contact email to your profile helps the reviewer place you.{' '}
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
                    )}
                  </section>
                </>
              )}

              {exclusivityError && (
                <p className="text-[12px] text-destructive bg-destructive/10 p-3 rounded-lg">
                  {exclusivityError}
                </p>
              )}
              {validationError && <p className="text-[12px] text-destructive">{validationError}</p>}
            </div>
          )}
        </main>

        {!showDomainMode && !confirmation && !isLoadingBusiness && (
          <footer
            className="shrink-0 backdrop-blur-xl"
            style={{
              borderTop: `0.5px solid ${BIZ.hair}`,
              /* A.PANEL at 92% - a surface, not ink. The backdrop-blur-xl below
                 needs the remaining 8% to read as glass over scrolling content. */
              background: surfaceWithAlpha(MEMBER_PANEL, 0.92),
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="mx-auto flex w-full items-center gap-3 px-4 py-3">
              {safeIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setPageIndex(safeIndex - 1)}
                  className="h-12 px-5 text-[15px]"
                  style={{
                    borderRadius: BIZ.rInner,
                    /* BIZ.fill (6%) — shadcn's outline variant is near
                       invisible against the dark footer. */
                    background: BIZ.fill,
                    color: A.INK,
                    border: `1px solid ${A.BORDER}`,
                  }}
                >
                  Back
                </Button>
              )}
              {(() => {
                // B4 — the label says what the button does. Last page is always primary.
                const ghost = !isLast && stepEmpty;
                return (
                  <Button
                    onClick={() => (isLast ? submitMutation.mutate() : setPageIndex(safeIndex + 1))}
                    disabled={submitMutation.isPending || !canContinue}
                    className="flex-1 h-12 border-0 text-[15px]"
                    style={{
                      background: ghost ? 'transparent' : INK,
                      color: ghost ? INK : A.CANVAS,
                      border: ghost ? `1px solid ${HAIR}` : 'none',
                      borderRadius: BIZ.rInner,
                      fontWeight: 600,
                    }}
                  >
                    {submitMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </span>
                    ) : isLast ? (
                      'Submit for review'
                    ) : ghost ? (
                      'Skip for now'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                );
              })()}
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
  { title: string; children: React.ReactNode }
>(function SectionCard({ title, children }, ref) {
  return (
    <div
      ref={ref}
      className="rounded-[14px] p-4"
      style={{ background: BIZ.card, border: `1px solid ${HAIR}` }}
    >
      <h3
        data-vf-heading
        tabIndex={-1}
        className="mb-3 outline-none"
        style={{ fontFamily: SF_STACK, fontSize: 17, fontWeight: 600, color: INK, margin: 0, marginBottom: 12, letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
});

/** One <dt>/<dd> row of the reviewer list. A missing value always reads "Not set". */
function DetailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value?: string | null;
  tone?: string;
}) {
  const missing = !value || !String(value).trim();
  return (
    <div
      className="flex items-baseline justify-between"
      style={{ gap: 12, padding: '11px 14px', borderTop: `1px solid ${HAIR}`, marginTop: -1 }}
    >
      <dt style={{ fontFamily: SF_STACK, fontSize: 13.5, fontWeight: 400, color: A.BODY, flexShrink: 0 }}>{label}</dt>
      <dd
        className="min-w-0 text-right overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontFamily: SF_STACK, fontSize: 13.5, fontWeight: 400, margin: 0, color: missing ? A.DIM : tone ?? A.INK }}
      >
        {missing ? 'Not set' : value}
      </dd>
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
  /** Render prop: receives the generated id to put on the control (label htmlFor). */
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div data-vf-field>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: SF_STACK,
          fontSize: 13,
          fontWeight: 600,
          color: INK_60,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children(id)}
      {hint && (
        <div style={{ fontFamily: SF_STACK, fontSize: 13, fontWeight: 400, color: INK_45, marginTop: 6 }}>
          {hint}
        </div>
      )}
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
  const signalLabel = SIGNALS.find((s) => s.key === signalOfProofMethod(method))!.label;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-6"
    >
      <h2
        className="mb-2"
        style={{ fontFamily: SF_STACK, fontSize: 18, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}
      >
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
            {signalLabel}
          </span>
        </div>
      </div>
      <div className="mt-8">
        <Button
          onClick={onDone}
          className="w-full h-11 border-0"
          style={{ background: BIZ.ink, borderRadius: BIZ.rInner, color: A.CANVAS }}
        >
          Done
        </Button>
      </div>
    </motion.div>
  );
}
