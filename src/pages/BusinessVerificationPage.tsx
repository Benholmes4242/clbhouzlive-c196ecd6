import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Users, Star, Clock, XCircle, BadgeCheck, Mail, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
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

  const needsDomain =
    state === 'pending' && !!request?.requires_domain_check && !request?.domain_confirmed;

  return (
    <PageRoot className="min-h-screen md:!max-w-[440px]" style={{ background: BIZ.pageBg }}>
      {/* Title block — CompactHeader provides the back arrow */}
      <div
        className="px-4 pt-3 pb-3"
        style={{ paddingTop: 'calc(var(--chrome-total-h, 0px) + 12px)' }}
      >
        <SectionHeader tier="standard" kicker="VERIFICATION" tone="amber" />
        <h1 className="text-[18px] mt-0.5" style={{ color: BIZ.ink, fontWeight: 800, letterSpacing: '-0.01em' }}>
          {state === 'verified' ? 'Verified business' : state === 'pending' ? 'Under review' : state === 'needs_more_info' ? 'More info needed' : state === 'rejected' ? 'Not approved' : 'Get verified'}
        </h1>
      </div>


      <main className="px-4 py-6 max-w-lg mx-auto pb-20">
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
    </PageRoot>
  );
}

function NoneState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
          <BadgeCheck className="h-8 w-8" style={{ color: BIZ.amber }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: BIZ.ink }}>Get verified on clbhouz</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Verification helps golfers know your business is authentic and trusted.
        </p>
      </div>

      <div className="space-y-4">
        <SectionHeader tier="standard" kicker="WHY GET VERIFIED" />
        <div className="space-y-3">
          {[
            { icon: Shield, title: 'Build trust', desc: 'A verified badge shows golfers your business is legitimate.' },
            { icon: Users, title: 'Stand out', desc: 'Verified businesses are more visible in search and discovery.' },
            { icon: Star, title: 'Professional presence', desc: 'Join other verified clubs, coaches, and brands on clbhouz.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: BIZ.ink }}>{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader tier="standard" kicker="HOW IT WORKS" />
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="font-medium" style={{ color: BIZ.ink }}>1.</span><span>Submit a verification request with proof of legitimacy</span></li>
          <li className="flex items-start gap-2"><span className="font-medium" style={{ color: BIZ.ink }}>2.</span><span>We review your request (usually within a few days)</span></li>
          <li className="flex items-start gap-2"><span className="font-medium" style={{ color: BIZ.ink }}>3.</span><span>Approved profiles receive a verified badge</span></li>
        </ol>
      </div>

      <Button
        onClick={onStart}
        className="w-full h-11 text-white border-0"
        style={{ background: BIZ.ink, borderRadius: BIZ.rInner }}
      >
        Start verification
      </Button>

      <p className="text-[11px] text-muted-foreground/70 text-center">
        Verification is optional and not required to use clbhouz.
      </p>
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
            Submitted {format(new Date(requestedAt), 'MMM d, yyyy')}
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
          Verified on {format(new Date(reviewedAt), 'MMM d, yyyy')}
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
          Reviewed on {format(new Date(reviewedAt), 'MMM d, yyyy')}
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
          Updated {format(new Date(reviewedAt), 'MMM d, yyyy')}
        </p>
      )}

      <Button onClick={onAmend} className="w-full h-11 text-white border-0" style={{ background: BIZ.ink, borderRadius: BIZ.rInner }}>
        Amend and resubmit
      </Button>
    </motion.div>
  );
}
