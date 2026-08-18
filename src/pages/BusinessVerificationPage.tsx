/**
 * BRIEF_VERIFICATION_UI — the verification page as a SETTINGS surface.
 *
 * Phases 1-5B rebuilt the copy, the logic and the data. This file is the
 * presentation, and it is aligned to /manage/*:
 *
 *   - the TITLE is ManagePageShell's 18/600 h1. The body renders no title.
 *   - every group is a ManageCard, with a 13/600 uppercase header above and,
 *     where a rule needs explaining, a 13/400 INK_45 footnote BENEATH.
 *   - 600 is the ceiling weight. Nothing is bold.
 *   - one filled button per screen, in INK. No 64px circle icons.
 *   - status colour carries information only: GREEN confirmed, amber waiting,
 *     INK_30 absent. Declined uses no red.
 *
 * NOTHING about the Phase 1-5B logic, RPCs, states or queries changes here.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatMonthDayYearShort } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { INK, INK_45, INK_60, HAIR, SF_STACK, ManageCard } from '@/components/manage/ui';
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
import { REVIEW_REASON_APPLICANT } from '@/components/business/verification/reviewReasons';
import { SIGNALS } from '@/components/business/verification/signals';
import { confirmedSignals } from '@/components/business/verification/evidenceLine';
import {
  Intro,
  Group,
  Row,
  RowList,
  BusinessRow,
  FilledButton,
  PlainButton,
  Footnote,
} from '@/components/business/verification/manageRows';

interface BusinessSummary {
  id: string;
  name: string;
  slug: string | null;
  is_verified: boolean | null;
  verified_at: string | null;
  logo_url: string | null;
  category: string | null;
  location: string | null;
  verification_recheck_due_at: string | null;
}

/** §5.2 — the ONE destination for "How verification works". */
const CRITERIA_PATH = '/legal/business-verification';

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
        .select(
          'id, name, slug, is_verified, verified_at, logo_url, category, location, verification_recheck_due_at',
        )
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BusinessSummary | null;
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

  const openCriteria = () => navigate(CRITERIA_PATH);

  // requires_domain_check is admin-initiated; the client never sets this.
  // When true the owner must complete the Domain step before an admin can approve.
  const needsDomain =
    state === 'pending' && !!request?.requires_domain_check && !request?.domain_confirmed;

  const identity = business ? (
    <BusinessRow
      name={business.name}
      logoUrl={business.logo_url}
      fallbackKey={business.id}
      secondary={[business.category, business.location].filter(Boolean).join(' · ') || null}
      verified={state === 'verified'}
    />
  ) : null;

  return (
    <ManagePageShell title="Verification">
      <main className="px-4 pt-4 max-w-lg mx-auto w-full" style={{ paddingBottom: 32 }}>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-[14px]" />
            <Skeleton className="h-32 rounded-[14px]" />
            <Skeleton className="h-24 rounded-[14px]" />
          </div>
        ) : state === 'none' ? (
          <NoneState identity={identity} onStart={() => openFlow('submit')} onCriteria={openCriteria} />
        ) : state === 'pending' ? (
          <PendingState
            identity={identity}
            requestedAt={request?.created_at}
            domainConfirmed={!!request?.domain_confirmed}
            needsDomain={needsDomain}
            domain={request?.domain}
            onVerifyDomain={() => openFlow('domain')}
            onCriteria={openCriteria}
          />
        ) : state === 'verified' ? (
          <VerifiedState
            identity={identity}
            proofMetadata={request?.proof_metadata}
            reviewedAt={request?.reviewed_at ?? business?.verified_at ?? null}
            recheckDueAt={business?.verification_recheck_due_at ?? null}
            onViewProfile={() => {
              if (business?.slug) navigate(`/business/${business.slug}`);
              else navigate('/businesses/manage');
            }}
          />
        ) : state === 'needs_more_info' ? (
          <NeedsInfoState
            identity={identity}
            adminNote={request?.admin_note}
            reviewReason={request?.review_reason}
            reviewedAt={request?.reviewed_at}
            domainConfirmed={!!request?.domain_confirmed}
            onAmend={() => openFlow('submit')}
            onCriteria={openCriteria}
          />
        ) : (
          <DeclinedState
            identity={identity}
            reviewedAt={request?.reviewed_at}
            adminNote={request?.admin_note}
            reviewReason={request?.review_reason}
            onReapply={() => openFlow('submit')}
            onUpdate={() => navigate(`/business/${id}/edit`)}
            onCriteria={openCriteria}
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

const Fade = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    {children}
  </motion.div>
);

/** §5.4 — the criteria are a chevron ROW inside a group, never a floating link. */
function HowItWorksRow({ onCriteria }: { onCriteria: () => void }) {
  return <Row label="How verification works" onClick={onCriteria} />;
}

const ACTIONS = { marginTop: 8, display: 'flex', flexDirection: 'column' as const, gap: 10 };

/* ─────────────────────────── NOT STARTED (§3.1) ─────────────────────────── */

function NoneState({
  identity,
  onStart,
  onCriteria,
}: {
  identity: React.ReactNode;
  onStart: () => void;
  onCriteria: () => void;
}) {
  return (
    <Fade>
      <Intro>
        A verified badge tells golfers this business is real and that someone here stands behind it.
        A person reads every request.
      </Intro>

      {identity ? <Group header="Business">{identity}</Group> : null}

      <Group
        header="What's needed"
        footnote="Two of the three, and at least one of them a business domain or a document. Presence on its own is never enough."
      >
        <RowList>
          {SIGNALS.map((s) => (
            <Row
              key={s.key}
              label={s.label}
              sub={s.what}
              value={s.qualifying ? 'Qualifying' : 'Supporting'}
            />
          ))}
        </RowList>
      </Group>

      <Group header="Before you start">
        <RowList>
          <Row label="Cost" value="Free" />
          <Row label="Reviewed by" value="A person" />
          <HowItWorksRow onCriteria={onCriteria} />
        </RowList>
      </Group>

      <div style={ACTIONS}>
        <FilledButton onClick={onStart}>Start verification</FilledButton>
        <Footnote>Verification is optional. Nothing about this business changes if you skip it.</Footnote>
      </div>
    </Fade>
  );
}

/* ─────────────────────────── UNDER REVIEW (§3.2) ─────────────────────────── */

function PendingState({
  identity,
  requestedAt,
  domainConfirmed,
  needsDomain,
  domain,
  onVerifyDomain,
  onCriteria,
}: {
  identity: React.ReactNode;
  requestedAt?: string | null;
  domainConfirmed: boolean;
  needsDomain: boolean;
  domain?: string | null;
  onVerifyDomain: () => void;
  onCriteria: () => void;
}) {
  const submitted = requestedAt ? formatMonthDayYearShort(requestedAt) : null;
  return (
    <Fade>
      {/* NO SLA — a review time was never committed to. */}
      <Intro>A person is reading your request. You'll be notified when a decision is made.</Intro>

      {identity ? <Group header="Business">{identity}</Group> : null}

      {/* §3.2 — the LIST is the timeline. No timeline graphic. */}
      <Group
        header="Progress"
        footnote={submitted ? `Submitted ${submitted}.` : undefined}
      >
        <RowList>
          <Row label="Request submitted" glyph="confirmed" value={submitted ?? 'Done'} tone="confirmed" />
          {needsDomain ? (
            <Row
              label="Confirm your domain"
              sub={domain ? `A code goes to an address on @${domain}` : undefined}
              glyph="waiting"
              value="Your turn"
              tone="waiting"
              onClick={onVerifyDomain}
            />
          ) : domainConfirmed ? (
            <Row label="Domain confirmed" glyph="confirmed" value="Done" tone="confirmed" />
          ) : null}
          <Row label="Reviewed by a person" glyph="waiting" value="Waiting" tone="waiting" />
          <Row label="Decision" glyph="absent" value="Not yet" tone="absent" />
        </RowList>
      </Group>

      <Group header="What you sent">
        <RowList>
          <Row label="Reviewed by" value="A person" />
          <Row label="Notified by" value="App and email" />
          <HowItWorksRow onCriteria={onCriteria} />
        </RowList>
      </Group>

      {needsDomain && (
        <div style={ACTIONS}>
          <FilledButton onClick={onVerifyDomain}>Confirm your domain</FilledButton>
        </div>
      )}
    </Fade>
  );
}

/* ───────────────── the reviewer's decision, as a card (§3.3) ───────────────── */

/**
 * The structured reason is the CARD: a title and an explanation. The reviewer's
 * own words are a FOOTNOTE beneath it, attributed. Pre-Phase-4 rows carry no
 * reason, so the note alone still renders.
 */
function ReasonCard({
  reviewReason,
  adminNote,
  attribution,
}: {
  reviewReason?: string | null;
  adminNote?: string | null;
  attribution: string;
}) {
  const reason = reviewReason ? REVIEW_REASON_APPLICANT[reviewReason] : null;
  const cause = reason?.cause || '';
  const fix = reason?.fix || '';
  if (!cause && !adminNote) return null;

  return (
    <section style={{ marginBottom: 20 }}>
      <ManageCard padding={16}>
        {cause ? (
          <>
            <p
              style={{
                fontFamily: SF_STACK,
                fontSize: 17,
                fontWeight: 600,
                color: INK,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {cause}
            </p>
            {fix ? (
              <p
                style={{
                  fontFamily: SF_STACK,
                  fontSize: 15.5,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: INK_60,
                  margin: '6px 0 0',
                }}
              >
                {fix}
              </p>
            ) : null}
          </>
        ) : (
          <p
            style={{
              fontFamily: SF_STACK,
              fontSize: 15.5,
              fontWeight: 400,
              lineHeight: 1.45,
              color: INK_60,
              margin: 0,
            }}
          >
            {adminNote}
          </p>
        )}
      </ManageCard>
      {cause && adminNote ? (
        <Footnote>
          {attribution}: “{adminNote}”
        </Footnote>
      ) : null}
    </section>
  );
}

/* ─────────────────────────── NEEDS INFO (§3.3) ─────────────────────────── */

function NeedsInfoState({
  identity,
  adminNote,
  reviewReason,
  reviewedAt,
  domainConfirmed,
  onAmend,
  onCriteria,
}: {
  identity: React.ReactNode;
  adminNote?: string | null;
  reviewReason?: string | null;
  reviewedAt?: string | null;
  domainConfirmed: boolean;
  onAmend: () => void;
  onCriteria: () => void;
}) {
  return (
    <Fade>
      <Intro>A reviewer has read your request and needs one more thing before deciding.</Intro>

      {identity ? <Group header="Business">{identity}</Group> : null}

      <ReasonCard reviewReason={reviewReason} adminNote={adminNote} attribution="From the reviewer" />

      {/* §3.3 — nothing else is lost. */}
      <Group
        header="Still confirmed"
        footnote={
          reviewedAt
            ? `Reviewed ${formatMonthDayYearShort(reviewedAt)}. Your request stays open — nothing you sent has been thrown away.`
            : 'Your request stays open — nothing you sent has been thrown away.'
        }
      >
        <RowList>
          <Row label="Your request" glyph="confirmed" value="Open" tone="confirmed" />
          {domainConfirmed ? (
            <Row label="Domain" glyph="confirmed" value="Confirmed" tone="confirmed" />
          ) : null}
          <Row label="Anything you attached" glyph="confirmed" value="Kept" tone="confirmed" />
          <HowItWorksRow onCriteria={onCriteria} />
        </RowList>
      </Group>

      <div style={ACTIONS}>
        <FilledButton onClick={onAmend}>Amend and resubmit</FilledButton>
      </div>
    </Fade>
  );
}

/* ─────────────────── DECLINED (§3.4) — NO RED ANYWHERE ─────────────────── */

function DeclinedState({
  identity,
  reviewedAt,
  adminNote,
  reviewReason,
  onReapply,
  onUpdate,
  onCriteria,
}: {
  identity: React.ReactNode;
  reviewedAt?: string | null;
  adminNote?: string | null;
  reviewReason?: string | null;
  onReapply: () => void;
  onUpdate: () => void;
  onCriteria: () => void;
}) {
  return (
    <Fade>
      <Intro>
        We couldn't verify this business from what we could see. That is about the evidence, not
        about you — most declined requests pass on a second try.
      </Intro>

      {identity ? <Group header="Business">{identity}</Group> : null}

      <ReasonCard reviewReason={reviewReason} adminNote={adminNote} attribution="From the reviewer" />

      {/* §4.4 — an appeal IS reapplying with better evidence. */}
      <Group
        header="What happens next"
        footnote={
          reviewedAt
            ? `Reviewed ${formatMonthDayYearShort(reviewedAt)}. There is no separate appeal: if you can now show something the reviewer could not see, reapply with it and it will be looked at again.`
            : 'There is no separate appeal: if you can now show something the reviewer could not see, reapply with it and it will be looked at again.'
        }
      >
        <RowList>
          <Row label="Reapply" sub="With better evidence, as many times as you need" value="Free" />
          <HowItWorksRow onCriteria={onCriteria} />
        </RowList>
      </Group>

      <div style={ACTIONS}>
        <FilledButton onClick={onReapply}>Reapply</FilledButton>
        <PlainButton onClick={onUpdate}>Update business details</PlainButton>
      </div>
    </Fade>
  );
}

/* ─────────────────────────── VERIFIED (§3.5) ─────────────────────────── */

function VerifiedState({
  identity,
  proofMetadata,
  reviewedAt,
  recheckDueAt,
  onViewProfile,
}: {
  identity: React.ReactNode;
  proofMetadata: unknown;
  reviewedAt: string | null;
  recheckDueAt: string | null;
  onViewProfile: () => void;
}) {
  // §2.5 of the evidence rule: no signals object means we claim nothing.
  const confirmed = confirmedSignals(proofMetadata);
  return (
    <Fade>
      <Intro>The badge now shows next to this business wherever it appears on clbhouz.</Intro>

      {identity ? <Group header="Business">{identity}</Group> : null}

      <Group
        header="Confirmed"
        footnote={
          confirmed.length === 0
            ? 'This approval predates our signal record, so we do not list which signals were used.'
            : reviewedAt
              ? `Verified ${formatMonthDayYearShort(reviewedAt)}.`
              : undefined
        }
      >
        <RowList>
          {SIGNALS.map((s) => {
            const on = confirmed.includes(s.key as 'domain' | 'document' | 'presence');
            return (
              <Row
                key={s.key}
                label={s.label}
                glyph={on ? 'confirmed' : 'absent'}
                value={on ? 'Confirmed' : 'Not provided'}
                tone={on ? 'confirmed' : 'absent'}
                dim={!on}
              />
            );
          })}
        </RowList>
      </Group>

      <Group
        header="Next check"
        footnote="We re-check verified businesses once a year. A check that doesn't pass is read by a person — the badge is never removed automatically."
      >
        <RowList>
          <Row
            label="Annual re-check"
            value={recheckDueAt ? formatMonthDayYearShort(recheckDueAt) : 'Scheduled'}
          />
        </RowList>
      </Group>

      {/* §5.3 — no criteria row on verified: the rules are behind them. */}
      <div style={ACTIONS}>
        <FilledButton onClick={onViewProfile}>View profile</FilledButton>
      </div>
      <div style={{ height: 1, background: HAIR, margin: '20px 4px 0' }} />
      <p
        style={{
          fontFamily: SF_STACK,
          fontSize: 13,
          fontWeight: 400,
          color: INK_45,
          margin: '10px 4px 0',
        }}
      >
        Verification says this business is real. It does not rank it, promote it, or change where it
        appears.
      </p>
    </Fade>
  );
}
