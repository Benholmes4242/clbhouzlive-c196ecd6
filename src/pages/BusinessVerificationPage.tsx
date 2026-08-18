import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, XCircle, Mail, AlertCircle } from 'lucide-react';
import {
  A,
  BIZ_KICKER,
  BIZ_LABEL,
  BIZ_TITLE,
  BIZ_BODY,
  bizFigure,
} from '@/features/courses/components/holes/analytical/tokens';
import { formatMonthDayYearShort } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import {
  useBusinessVerificationRealtime,
  useVerificationNotificationsRealtime,
} from '@/hooks/useBusinessVerificationRealtime';
import {
  useBusinessVerificationRequest,
  deriveVerificationState,
} from '@/hooks/useBusinessVerificationRequest';
import VerificationFlowSheet from '@/components/business/verification/VerificationFlowSheet';
import { BIZ } from '@/components/business/businessTokens';
import VerificationCriteriaLink from '@/components/business/verification/VerificationCriteriaLink';
import { REVIEW_REASON_APPLICANT } from '@/components/business/verification/reviewReasons';


export default function BusinessVerificationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabaseSession();

  useHideBottomNav();
  useBusinessVerificationRealtime(id);
  useVerificationNotificationsRealtime(user?.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'submit' | 'domain'>('submit');

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ['business-account-verification-status', id],
    enabled: !!id && !!user,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, slug, is_verified, verified_at')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: request, isLoading: loadingRequest } = useBusinessVerificationRequest(id);

  const state = useMemo(
    () => deriveVerificationState(business?.is_verified, request),
    [business?.is_verified, request],
  );

  const isLoading = loadingBusiness || loadingRequest;

  const openFlow = (mode: 'submit' | 'domain' = 'submit') => {
    setSheetMode(mode);
    setSheetOpen(true);
  };

  // requires_domain_check is admin-initiated; the client never sets this.
  // When true the owner must complete the Domain step before an admin can approve.
  const needsDomain =
    state === 'pending' && !!request?.requires_domain_check && !request?.domain_confirmed;

  return (
    <ManagePageShell title="Verification">
      <main className="px-4 py-6 max-w-lg mx-auto" style={{ paddingBottom: 140 }}>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : state === 'none' ? (
          <NoneState onStart={() => openFlow('submit')} />
        ) : state === 'pending' ? (
          <PendingState
            requestedAt={request?.created_at}
            needsDomain={needsDomain}
            domain={request?.domain}
            onVerifyDomain={() => openFlow('domain')}
          />
        ) : state === 'verified' ? (
          <VerifiedState
            reviewedAt={request?.reviewed_at ?? business?.verified_at ?? null}
            onViewProfile={() => {
              if (business?.slug) navigate(`/business/${business.slug}`);
              else navigate('/businesses/manage');
            }}
          />
        ) : state === 'needs_more_info' ? (
          <NeedsMoreInfoState
            adminNote={request?.admin_note}
            reviewReason={request?.review_reason}
            reviewedAt={request?.reviewed_at}
            onAmend={() => openFlow('submit')}
          />
        ) : (
          <RejectedState
            reviewedAt={request?.reviewed_at}
            adminNote={request?.admin_note}
            reviewReason={request?.review_reason}
            onReapply={() => openFlow('submit')}
            onUpdate={() => navigate(`/business/${id}/edit`)}
          />
        )}
      </main>

      {id && (
        <VerificationFlowSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          businessId={id}
          mode={sheetMode}
        />
      )}
    </ManagePageShell>
  );
}

const BENEFITS: Array<{ claim: string; tail: string }> = [
  { claim: 'Build trust', tail: 'golfers can see the business is legitimate' },
  // NOT a discovery claim: the badge is shown wherever the name is, it does not
  // change where the name appears. Nothing in search or the directory reads is_verified.
  { claim: 'Recognisable everywhere', tail: 'the badge shows next to your name wherever you appear' },
  { claim: 'Professional presence', tail: 'alongside other verified clubs and coaches' },
];

const HOW_IT_WORKS: Array<{ label: string; sub: string }> = [
  { label: 'Submit', sub: 'with proof' },
  { label: 'We review', sub: 'by hand' },
  { label: 'Verified', sub: 'badge added' },
];

function NoneState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
      style={{ minHeight: '100%' }}
    >
      <div className="flex-1" style={{ paddingBottom: 24 }}>
        {/* Title block — the kicker says which surface this is. */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ ...BIZ_KICKER, marginBottom: 8 }}>Verification</div>
          <h2 style={{ ...BIZ_TITLE, fontSize: 21, margin: 0 }}>Get verified on clbhouz</h2>
          <p style={{ ...BIZ_BODY, margin: '8px 0 0', maxWidth: '30em' }}>
            The verified badge tells golfers your business is authentic and trusted.
          </p>
        </div>

        {/* What the badge does — one panel, one line each. */}
        <div
          style={{
            marginTop: 24,
            background: A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <div style={{ ...BIZ_LABEL, marginBottom: 10 }}>What the badge does</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BENEFITS.map(({ claim, tail }) => (
              <p key={claim} style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>
                <span style={{ fontWeight: 700, color: A.INK }}>{claim}</span>
                <span style={{ fontWeight: 400, color: A.MUTE }}>{` \u2014 ${tail}`}</span>
              </p>
            ))}
          </div>
        </div>

        {/* How it works — the order is the information. Nothing reads as current. */}
        <div
          style={{
            marginTop: 12,
            background: A.PANEL,
            border: `1px solid ${A.BORDER}`,
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <div style={{ ...BIZ_LABEL, marginBottom: 12 }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            {HOW_IT_WORKS.map(({ label, sub }, i) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={bizFigure(19)}>{i + 1}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: A.INK,
                    marginTop: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </div>
                <div style={{ ...BIZ_LABEL, fontSize: 7.5, marginTop: 4, lineHeight: 1.3 }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
          {/* §3 — read the bar before starting. */}
          <VerificationCriteriaLink className="pt-2" />
        </div>
      </div>

      {/* Fixed Footer (pinned to viewport bottom, matches shell max-width) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 440,
          background: BIZ.pageBg,
          padding: '16px 16px calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 16px)',
          zIndex: 40,
        }}
      >
        {/* Top fade */}
        <div
          style={{
            position: 'absolute',
            top: -32,
            left: 0,
            right: 0,
            height: 32,
            background: `linear-gradient(to top, ${BIZ.pageBg}, transparent)`,
            pointerEvents: 'none',
          }}
        />
        <button
          type="button"
          onClick={onStart}
          className="w-full flex items-center justify-center active:opacity-90 transition-opacity"
          style={{
            minHeight: 54,
            borderRadius: BIZ.rInner,
            background: A.INK,
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Start verification
        </button>
        <p className="text-center" style={{ fontSize: 11.5, color: A.MUTE, margin: '10px 0 0' }}>
          Verification is optional
        </p>
      </div>

    </motion.div>
  );
}


function PendingState({
  requestedAt,
  needsDomain,
  domain,
  onVerifyDomain,
}: {
  requestedAt?: string | null;
  needsDomain: boolean;
  domain?: string | null;
  onVerifyDomain: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
          <Clock className="h-8 w-8" style={{ color: BIZ.amber }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: BIZ.ink }}>Verification under review</h2>
        <p className="text-sm text-muted-foreground">
          {/* NO SLA. Phase 1 missed this line; a review time was never committed to. */}
          A person is reading your request. You'll be notified when a decision is made.
        </p>
        {requestedAt && (
          <p className="text-xs text-muted-foreground/70 mt-3">
            Submitted {formatMonthDayYearShort(requestedAt)}
          </p>
        )}
      </div>

      {needsDomain && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#FFFFFF', border: `1px solid ${BIZ.amberHair}` }}>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: BIZ.amberTint }}>
              <Mail className="h-4 w-4" style={{ color: BIZ.amber }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: BIZ.ink }}>One more step</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirm a business email on <span className="font-medium">@{domain}</span> to complete your verification.
              </p>
            </div>
          </div>
          <Button onClick={onVerifyDomain} className="w-full h-11 text-white border-0" style={{ background: BIZ.amber, borderRadius: BIZ.rInner }}>
            Verify your domain
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <SectionHeader tier="standard" kicker="WHAT HAPPENS NEXT" />
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-1">•</span><span>A person reviews your business details and proof of legitimacy</span></li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-1">•</span><span>You'll get an in-app notification when the review is complete</span></li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-1">•</span><span>Approved profiles receive a verified badge across Clbhouz</span></li>
        </ul>
        {/* §3.4 — what is being assessed, while you wait. */}
        <VerificationCriteriaLink tone="mute" />
      </div>
    </motion.div>
  );
}

function VerifiedState({ reviewedAt, onViewProfile }: { reviewedAt: string | null; onViewProfile: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
        <VerifiedBadge size="xl" />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: BIZ.ink }}>Your business is verified</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Your profile now shows a verified badge across Clbhouz.
      </p>
      {reviewedAt && (
        <p className="text-xs text-muted-foreground/70 mb-8">
          Verified on {formatMonthDayYearShort(reviewedAt)}
        </p>
      )}
      <Button variant="secondary" onClick={onViewProfile} className="gap-2">View profile</Button>
    </motion.div>
  );
}

/**
 * PHASE 4 §3.3 — one block, two layers: the structured reason (cause + remedy)
 * and, beneath it, whatever the reviewer typed. Pre-Phase-4 rows carry no
 * reason, so the note alone still renders.
 */
function ApplicantReasonBlock({
  reviewReason,
  adminNote,
  noteLabel,
  tone = 'neutral',
}: {
  reviewReason?: string | null;
  adminNote?: string | null;
  noteLabel: string;
  tone?: 'neutral' | 'amber';
}) {
  const reason = reviewReason ? REVIEW_REASON_APPLICANT[reviewReason] : null;
  const cause = reason?.cause || '';
  const fix = reason?.fix || '';
  if (!cause && !adminNote) return null;

  const border = tone === 'amber' ? BIZ.amberHair : 'rgba(15,23,42,0.10)';
  const label = tone === 'amber' ? BIZ.amber : '#94A3B8';

  return (
    <div className="rounded-2xl p-4 mb-6 text-left" style={{ background: '#FFFFFF', border: `1px solid ${border}` }}>
      {cause ? (
        <>
          <p className="text-sm font-semibold" style={{ color: BIZ.ink }}>{cause}</p>
          {fix && <p className="text-sm mt-1" style={{ color: '#475569' }}>{fix}</p>}
        </>
      ) : null}
      {adminNote ? (
        <div style={{ marginTop: cause ? 12 : 0, paddingTop: cause ? 12 : 0, borderTop: cause ? `1px solid ${border}` : undefined }}>
          <p className="text-xs font-medium mb-1" style={{ color: label }}>{noteLabel}</p>
          <p className="text-sm" style={{ color: BIZ.ink }}>{adminNote}</p>
        </div>
      ) : null}
    </div>
  );
}

function RejectedState({
  reviewedAt,
  adminNote,
  reviewReason,
  onReapply,
  onUpdate,
}: {
  reviewedAt?: string | null;
  adminNote?: string | null;
  reviewReason?: string | null;
  onReapply: () => void;
  onUpdate: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <XCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: BIZ.ink }}>Verification not approved</h2>
      <p className="text-sm text-muted-foreground mb-4">We couldn't verify your business at this time.</p>

      {/* PHASE 4 §3.3 — the structured reason names the signal that failed and
          what would fix it. The reviewer's own words sit BELOW it, not instead. */}
      <ApplicantReasonBlock reviewReason={reviewReason} adminNote={adminNote} noteLabel="From the reviewer" />

      {/* PHASE 5B §4.4 — an appeal IS reapplying with better evidence. Saying so
          is more honest than an appeals queue that would only ask for the same. */}
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        There is no separate appeal. If you disagree, or if you can now show
        something the reviewer could not see, reapply with that evidence and it
        will be looked at again.
      </p>

      {reviewedAt && (
        <p className="text-xs text-muted-foreground/70 mb-8">
          Reviewed on {formatMonthDayYearShort(reviewedAt)}
        </p>
      )}


      <div className="space-y-3 max-w-xs mx-auto">
        <Button onClick={onReapply} className="w-full h-11 text-white border-0" style={{ background: BIZ.ink, borderRadius: BIZ.rInner }}>
          Reapply
        </Button>
        <Button variant="outline" onClick={onUpdate} className="w-full">
          Update business details
        </Button>
        {/* §3.2 — the criteria are what the request was assessed against. */}
        <VerificationCriteriaLink align="center" />
      </div>
    </motion.div>
  );
}

function NeedsMoreInfoState({
  adminNote,
  reviewReason,
  reviewedAt,
  onAmend,
}: {
  adminNote?: string | null;
  reviewReason?: string | null;
  reviewedAt?: string | null;
  onAmend: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
          <AlertCircle className="h-8 w-8" style={{ color: BIZ.amber }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: BIZ.ink }}>More information needed</h2>
        <p className="text-sm text-muted-foreground">
          Our team has reviewed your request and needs a bit more before approving.
        </p>
      </div>

      <ApplicantReasonBlock reviewReason={reviewReason} adminNote={adminNote} noteLabel="What we need" tone="amber" />

      {reviewedAt && (
        <p className="text-xs text-muted-foreground/70 text-center">
          Updated {formatMonthDayYearShort(reviewedAt)}
        </p>
      )}

      <Button onClick={onAmend} className="w-full h-11 text-white border-0" style={{ background: BIZ.ink, borderRadius: BIZ.rInner }}>
        Amend and resubmit
      </Button>
      <VerificationCriteriaLink align="center" />
    </motion.div>
  );
}
