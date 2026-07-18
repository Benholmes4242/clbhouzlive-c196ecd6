import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, XCircle, BadgeCheck, Mail, AlertCircle, ArrowRight, Check, FileCheck } from 'lucide-react';
import { formatMonthDayYearShort } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
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

export default function BusinessVerificationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabaseSession();

  useHideBottomNav();
  useHideHeader();
  useBusinessVerificationRealtime(id);
  useVerificationNotificationsRealtime(user?.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'submit' | 'domain'>('submit');

  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ['business-account-verification-status', id],
    enabled: !!id && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
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
    <ManagePageShell title="Verification" offsetForChrome>
      <main className="px-4 py-6 max-w-lg mx-auto" style={{ paddingBottom: 140 }}>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
            <div className="h-40 animate-pulse rounded-xl" style={{ background: 'rgba(15,23,42,0.08)' }} />
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
            reviewedAt={request?.reviewed_at}
            onAmend={() => openFlow('submit')}
          />
        ) : (
          <RejectedState
            reviewedAt={request?.reviewed_at}
            adminNote={request?.admin_note}
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

function NoneState({ onStart }: { onStart: () => void }) {
  const MUTED = 'rgba(15,23,42,0.55)';
  const MUTED_LIGHT = 'rgba(15,23,42,0.45)';
  const MUTED_FAINT = 'rgba(15,23,42,0.35)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
      style={{ minHeight: '100%' }}
    >
      {/* Scrollable content */}
      <div className="flex-1" style={{ paddingBottom: 24 }}>
        {/* Badge Hero */}
        <div className="flex flex-col items-center" style={{ paddingTop: 8, gap: 12 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 84,
              height: 84,
              borderRadius: 26,
              background: BIZ.amberTint,
              boxShadow: '0 0 0 6px rgba(247,147,30,0.06)',
            }}
          >
            <BadgeCheck size={40} color={BIZ.amber} strokeWidth={2} />
          </div>
          <h2
            className="text-center"
            style={{
              fontSize: 23,
              fontWeight: 800,
              color: BIZ.ink,
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Get verified on clbhouz
          </h2>
          <p
            className="text-center"
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              color: MUTED,
              maxWidth: 300,
              margin: 0,
            }}
          >
            The verified badge tells golfers your business is authentic and trusted.
          </p>
        </div>

        {/* Benefit Cards */}
        <div className="flex flex-col" style={{ gap: 10, marginTop: 24 }}>
          {[
            { title: 'Build trust', desc: 'A verified badge shows golfers your business is legitimate.' },
            { title: 'Stand out in search', desc: 'Verified businesses are more visible in search and discovery.' },
            { title: 'Professional presence', desc: 'Join other verified clubs, coaches, and brands on clbhouz.' },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="flex items-start"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${BIZ.hair}`,
                borderRadius: 14,
                padding: '12px 16px',
                gap: 12,
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(5,150,105,0.10)',
                  marginTop: 1,
                }}
              >
                <Check size={14} color="#059669" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0" style={{ paddingTop: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: BIZ.ink, lineHeight: 1.25, marginBottom: 2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4, color: MUTED }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stepper */}
        <div style={{ marginTop: 32 }}>
          <div
            className="text-center"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: MUTED_FAINT,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            THREE SIMPLE STEPS
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Node 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, flexShrink: 0 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: BIZ.amber,
                }}
              >
                <FileCheck size={18} color="#FFFFFF" strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: BIZ.ink, marginTop: 10, lineHeight: 1.2 }}>
                Submit
              </div>
              <div style={{ fontSize: 11, color: MUTED_LIGHT, marginTop: 2, lineHeight: 1.2 }}>
                with proof
              </div>
            </div>
            {/* Line 1-2 */}
            <div style={{ flex: 1, height: 1, background: BIZ.hair, marginTop: 19, minWidth: 16 }} />
            {/* Node 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, flexShrink: 0 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: `1.5px solid ${BIZ.hair}`,
                }}
              >
                <Clock size={18} color={MUTED_FAINT} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: BIZ.ink, marginTop: 10, lineHeight: 1.2 }}>
                We review
              </div>
              <div style={{ fontSize: 11, color: MUTED_LIGHT, marginTop: 2, lineHeight: 1.2 }}>
                a few days
              </div>
            </div>
            {/* Line 2-3 */}
            <div style={{ flex: 1, height: 1, background: BIZ.hair, marginTop: 19, minWidth: 16 }} />
            {/* Node 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80, flexShrink: 0 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: `1.5px solid ${BIZ.hair}`,
                }}
              >
                <BadgeCheck size={18} color={MUTED_FAINT} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: BIZ.ink, marginTop: 10, lineHeight: 1.2 }}>
                Verified
              </div>
              <div style={{ fontSize: 11, color: MUTED_LIGHT, marginTop: 2, lineHeight: 1.2 }}>
                badge added
              </div>
            </div>
          </div>
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
            background: BIZ.ink,
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 700,
            gap: 8,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Start verification
          <ArrowRight size={18} strokeWidth={2.25} />
        </button>
        <p
          className="text-center"
          style={{
            fontSize: 11.5,
            color: MUTED_LIGHT,
            margin: '10px 0 0',
          }}
        >
          Verification is optional and not required to use clbhouz.
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
          We're reviewing your request. This usually takes 1–3 days.
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
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-1">•</span><span>We'll review your business details and proof of legitimacy</span></li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-1">•</span><span>You'll get an in-app notification when the review is complete</span></li>
          <li className="flex items-start gap-2"><span className="text-muted-foreground/60 mt-1">•</span><span>Approved profiles receive a verified badge across Clbhouz</span></li>
        </ul>
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

function RejectedState({
  reviewedAt,
  adminNote,
  onReapply,
  onUpdate,
}: {
  reviewedAt?: string | null;
  adminNote?: string | null;
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

      {adminNote && (
        <div className="bg-muted/30 border border-border/50 rounded-sq-lg p-4 mb-6 text-left">
          <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
          <p className="text-sm" style={{ color: BIZ.ink }}>{adminNote}</p>
        </div>
      )}

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
      </div>
    </motion.div>
  );
}

function NeedsMoreInfoState({
  adminNote,
  reviewedAt,
  onAmend,
}: {
  adminNote?: string | null;
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

      {adminNote && (
        <div className="rounded-2xl p-4 text-left" style={{ background: '#FFFFFF', border: `1px solid ${BIZ.amberHair}` }}>
          <p className="text-xs font-medium mb-1" style={{ color: BIZ.amber }}>What we need</p>
          <p className="text-sm" style={{ color: BIZ.ink }}>{adminNote}</p>
        </div>
      )}

      {reviewedAt && (
        <p className="text-xs text-muted-foreground/70 text-center">
          Updated {formatMonthDayYearShort(reviewedAt)}
        </p>
      )}

      <Button onClick={onAmend} className="w-full h-11 text-white border-0" style={{ background: BIZ.ink, borderRadius: BIZ.rInner }}>
        Amend and resubmit
      </Button>
    </motion.div>
  );
}
