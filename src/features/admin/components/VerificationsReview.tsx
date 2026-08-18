import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Mail, ShieldOff, X } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { adminTheme as t } from '../theme';
import SectionTabs from './SectionTabs';
import StatusPill from './StatusPill';
import EmptyState from './EmptyState';
import DetailDrawer from './DetailDrawer';
import ConfirmDialog from './ConfirmDialog';
import { useVerifications, useProofConflict, type VerificationRow } from '../hooks/useVerifications';
import {
  REVIEW_REASON_OPTIONS, reasonRequiresNote, reviewReasonLabel,
  type ReviewReason,
} from '@/components/business/verification/reviewReasons';
import {
  GOLFER_REASON_OPTIONS, golferReasonLabel,
  REVOCATION_REASON_OPTIONS, revocationReasonLabel,
} from '@/components/business/verification/revocationReasons';
import { confirmedSignals } from '@/components/business/verification/evidenceLine';
import { BarVerdict, RawMetadataDisclosure, SignalsPanel, resolveSignals } from './VerificationSignals';

/**
 * Extracted from UsersPage during the Members rebuild (D4). Behaviour and
 * markup are preserved verbatim so InboxPage / VerificationsPage can keep
 * using this without regression.
 */

function relTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
  catch { return '-'; }
}

/* PROOF_LABELS retired in Phase 4: the drawer names signals, not proof methods.
   PROOF_NOUNS survives because the duplicate warning still names the evidence. */
const PROOF_NOUNS: Record<string, string> = {
  official_website: 'website',
  business_email: 'email address',
  registered_business: 'company registration',
  creator_business: 'contact',
  golf_course: 'golf course website',
};

type EntityFilter = 'business' | 'golfer' | 'course_claim';

export function VerificationsTab({
  data, loading, review,
}: {
  data: VerificationRow[];
  loading: boolean;
  review: ReturnType<typeof useVerifications>['reviewMutation'];
}) {
  const [params, setParams] = useSearchParams();
  const entityFromUrl = (params.get('entity') as EntityFilter | null) ?? null;

  const pendingByEntity = useMemo(() => ({
    business: data.filter(r => r.type === 'business' && r.status === 'pending').length,
    course_claim: data.filter(r => r.type === 'course_claim' && r.status === 'pending').length,
    golfer: data.filter(r => r.type === 'golfer' && r.status === 'pending').length,
  }), [data]);

  const defaultEntity: EntityFilter =
    entityFromUrl ??
    (pendingByEntity.business > 0 ? 'business'
      : pendingByEntity.course_claim > 0 ? 'course_claim'
      : pendingByEntity.golfer > 0 ? 'golfer'
      : 'business');

  const [entityFilter, setEntityFilterState] = useState<EntityFilter>(defaultEntity);
  const setEntityFilter = (id: EntityFilter) => {
    setEntityFilterState(id);
    const next = new URLSearchParams(params);
    next.set('entity', id);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (entityFromUrl && entityFromUrl !== entityFilter) {
      setEntityFilterState(entityFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFromUrl]);

  const [statusFilter, setStatusFilter] = useState<'pending' | 'needs_info' | 'approved' | 'rejected' | 'all'>('pending');
  const [active, setActive] = useState<VerificationRow | null>(null);
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_more_info' | null>(null);
  // PHASE 4 §3 — the reason is part of the decision, so it lives beside it.
  const [reviewReason, setReviewReason] = useState<ReviewReason | null>(null);
  const [bizDetail, setBizDetail] = useState<{ name?: string; category?: string; location?: string; website?: string; email?: string; is_verified?: boolean; is_system_account?: boolean; verification_recheck_state?: string | null; verification_recheck_reason?: string | null; verification_recheck_due_at?: string | null } | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const { data: proofConflict } = useProofConflict(active);

  useEffect(() => {
    let cancelled = false;
    setBizDetail(null);
    if (active?.type === 'business' && active.businessId) {
      import('@/integrations/supabase/client').then(({ supabase }) =>
        supabase.from('business_accounts')
          .select('name, category, location, website, email, is_verified, is_system_account, verification_recheck_state, verification_recheck_reason, verification_recheck_due_at')
          .eq('id', active.businessId!)
          .maybeSingle()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(({ data }) => { if (!cancelled && data) setBizDetail(data as any); })
      );
    }
    return () => { cancelled = true; };
  }, [active?.id, active?.businessId, active?.type]);

  const entityFiltered = useMemo(
    () => data.filter(r => r.type === entityFilter),
    [data, entityFilter],
  );

  const rows = useMemo(() => {
    if (statusFilter === 'all') return entityFiltered;
    if (statusFilter === 'needs_info') return entityFiltered.filter(r => r.status === 'needs_more_info');
    if (statusFilter === 'approved') return entityFiltered.filter(r => r.status === 'approved' || r.status === 'accepted');
    if (statusFilter === 'rejected') return entityFiltered.filter(r => r.status === 'rejected' || r.status === 'declined');
    return entityFiltered.filter(r => r.status === 'pending');
  }, [entityFiltered, statusFilter]);

  const close = () => { setActive(null); setNote(''); setDecision(null); setReviewReason(null); setBizDetail(null); setConfirmApprove(false); };

  const doApprove = () => {
    if (!active) return;
    review.mutate(
      { id: active.id, type: active.type, decision: 'approved', adminNote: note },
      { onSuccess: close },
    );
  };

  const submit = (d: 'approved' | 'rejected' | 'needs_more_info') => {
    if (!active) return;
    if (d === 'rejected' || d === 'needs_more_info') {
      // §3.2 — a refusal now needs a REASON. Free text is required only when the
      // list cannot carry it ('other'); otherwise the reason names the cause.
      if (!reviewReason) { setDecision(d); return; }
      if (reasonRequiresNote(reviewReason) && note.trim().length < 3) { setDecision(d); return; }
    }
    if (active.type === 'golfer' && d === 'needs_more_info') return;
    if (d === 'approved' && proofConflict) {
      setConfirmApprove(true);
      return;
    }
    review.mutate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: active.id, type: active.type, decision: d as any, adminNote: note, reviewReason },
      { onSuccess: close },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTabs
        tabs={[
          { id: 'business',     label: 'Businesses', count: pendingByEntity.business || undefined },
          { id: 'golfer',       label: 'Users',      count: pendingByEntity.golfer || undefined },
          { id: 'course_claim', label: 'Courses',    count: pendingByEntity.course_claim || undefined },
        ]}
        activeId={entityFilter}
        onChange={(id) => setEntityFilter(id as EntityFilter)}
      />

      <SectionTabs
        tabs={[
          { id: 'pending',   label: 'Pending',    count: entityFiltered.filter(r => r.status === 'pending').length },
          { id: 'needs_info', label: 'Needs info', count: entityFiltered.filter(r => r.status === 'needs_more_info').length },
          { id: 'approved',  label: 'Approved' },
          { id: 'rejected',  label: 'Rejected' },
          { id: 'all',       label: 'All',        count: entityFiltered.length },
        ]}
        activeId={statusFilter}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange={(id) => setStatusFilter(id as any)}
      />

      {loading ? <SkeletonRows /> : rows.length === 0 ? (
        <EmptyState title="No verification requests" subtitle="You're all caught up." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => (
            <VerificationCard key={r.id} row={r} disabled={review.isPending} onOpen={() => setActive(r)} onQuick={(d) => {
              if (review.isPending) return;
              setActive(r);
              if (d === 'approved' && r.type === 'business') {
                review.mutate({ id: r.id, type: r.type, decision: 'approved', adminNote: '' }, { onSuccess: close });
              } else {
                setDecision(d);
              }
            }} />
          ))}
        </div>
      )}

      <DetailDrawer
        open={!!active}
        onClose={close}
        title={active ? (
          active.type === 'course_claim'
            ? (active.claimCourseName ?? active.claimBusinessName ?? 'Course claim')
            : (bizDetail?.name ?? active.displayName ?? active.username ?? 'Verification request')
        ) : ''}
        subtitle={active ? (
          active.type === 'course_claim'
            ? `Course claim - requested by ${active.displayName ?? active.username ?? '-'} - ${relTime(active.createdAt)}`
            : `${active.type === 'business' ? 'Business' : 'Golfer'} - ${relTime(active.createdAt)}`
        ) : undefined}
        footer={active && active.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <DrawerBtn icon={<X size={14} />} tone="danger" disabled={review.isPending} onClick={() => submit('rejected')}>Reject</DrawerBtn>
            {(active.type === 'business' || active.type === 'course_claim') && (
              <DrawerBtn icon={<Mail size={14} />} tone="warn" disabled={review.isPending} onClick={() => submit('needs_more_info')}>Needs info</DrawerBtn>
            )}
            <DrawerBtn icon={<CheckCircle2 size={14} />} disabled={review.isPending} onClick={() => submit('approved')}>Approve</DrawerBtn>
          </div>
        ) : undefined}
      >
        {active && (
          <VerificationDetailBody
            row={active}
            note={note}
            setNote={setNote}
            decision={decision}
            reviewReason={reviewReason}
            setReviewReason={setReviewReason}
          />
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={() => { setConfirmApprove(false); doApprove(); }}
        title="Approve duplicate proof?"
        description={
          proofConflict && active?.proofMethod
            ? `This ${PROOF_NOUNS[active.proofMethod] ?? 'proof'} is already verified for ${proofConflict.businessName}. Approving will verify a second business with the same proof.`
            : 'This proof is already verified for another business. Approve anyway?'
        }
        confirmLabel="Approve anyway"
        cancelLabel="Cancel"
        tone="danger"
        busy={review.isPending}
      />
    </div>
  );
}

/* Default export mirrors the named one for import-style flexibility. */
export default VerificationsTab;

/* ─────────────────────── Shared detail body ─────────────────────── */

/**
 * Renders the full evidence set + admin-note textarea for a verification
 * request. Single source of truth consumed by both VerificationsTab (this
 * file) and VerificationInboxSheet in InboxPage.tsx. Loads business detail
 * and duplicate-proof conflict internally; callers wire their own footer
 * decisions and reviewMutation.
 */
export function VerificationDetailBody({
  row, note, setNote, decision, reviewReason, setReviewReason,
}: {
  row: VerificationRow;
  note: string;
  setNote: (v: string) => void;
  decision: 'approved' | 'rejected' | 'needs_more_info' | null;
  /** PHASE 4 §3 — optional so callers that have not adopted reasons still compile. */
  reviewReason?: ReviewReason | null;
  setReviewReason?: (v: ReviewReason | null) => void;
}) {
  const [bizDetail, setBizDetail] = useState<{ name?: string; category?: string; location?: string; website?: string; email?: string; is_verified?: boolean; is_system_account?: boolean; verification_recheck_state?: string | null; verification_recheck_reason?: string | null; verification_recheck_due_at?: string | null } | null>(null);
  const { data: proofConflict } = useProofConflict(row);

  useEffect(() => {
    let cancelled = false;
    setBizDetail(null);
    if (row.type === 'business' && row.businessId) {
      import('@/integrations/supabase/client').then(({ supabase }) =>
        supabase.from('business_accounts')
          .select('name, category, location, website, email, is_verified, is_system_account, verification_recheck_state, verification_recheck_reason, verification_recheck_due_at')
          .eq('id', row.businessId!)
          .maybeSingle()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(({ data }) => { if (!cancelled && data) setBizDetail(data as any); })
      );
    }
    return () => { cancelled = true; };
  }, [row.id, row.businessId, row.type]);

  const resolved = useMemo(() => resolveSignals(row), [row]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill tone={
          row.type === 'business' ? 'warn' :
          row.type === 'course_claim' ? 'warn' : 'neutral'
        }>
          {row.type === 'business' ? 'Business' :
           row.type === 'course_claim' ? 'Course claim' : 'Golfer'}
        </StatusPill>
        <StatusPill tone={
          row.status === 'pending' ? 'warn' :
          row.status === 'needs_more_info' ? 'warn' :
          row.status === 'approved' || row.status === 'accepted' ? 'ok' :
          row.status === 'rejected' || row.status === 'declined' ? 'danger' : 'neutral'
        }>
          {row.status}
        </StatusPill>
      </div>

      {row.type === 'course_claim' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {row.businessAlreadyVerified && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.10)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: t.warnText,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.4,
            }}>
              Note: this business is already verified. Course claims grant club linkage,
              which the verified tick alone does not - review the claim on its own merits.
            </div>
          )}
          {row.claimBusinessName && <Field label="Business" value={row.claimBusinessName} />}
          {row.claimCourseName && <Field label="Course / Club" value={row.claimCourseName} />}
          {row.claimProofNote && <Field label="Proof note" value={row.claimProofNote} />}
        </div>
      )}

      {row.type === 'business' && bizDetail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bizDetail.category && <Field label="Category" value={bizDetail.category} />}
          {bizDetail.location && <Field label="Location" value={bizDetail.location} />}
          {bizDetail.website && (
            <Field label="Website">
              <a href={bizDetail.website} target="_blank" rel="noreferrer" style={{ color: t.brandText, fontSize: 13, wordBreak: 'break-all' }}>
                {bizDetail.website}
              </a>
            </Field>
          )}
          {bizDetail.email && <Field label="Business email" value={bizDetail.email} />}
        </div>
      )}

      {/* PHASE 4 §2.3 — the CONFLICT comes before the evidence. A reviewer must
          not form a view and then discover the proof belongs to someone else. */}
      {proofConflict && row.type === 'business' && (
        <div role="alert" style={{
          background: t.dangerSoft,
          border: `1px solid ${t.danger}`,
          borderRadius: t.radius.md,
          padding: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden>!</span>
          <div style={{ fontSize: 13, color: t.dangerText, lineHeight: 1.45 }}>
            <strong style={{ fontWeight: 700 }}>Already verified elsewhere</strong> - this{' '}
            {PROOF_NOUNS[row.proofMethod ?? ''] ?? 'evidence'} is verified for{' '}
            <strong style={{ fontWeight: 700 }}>{proofConflict.businessName}</strong>
            {proofConflict.approvedAt ? ` (${relTime(proofConflict.approvedAt)})` : ''}.
            Approving verifies a second business on the same evidence.
          </div>
        </div>
      )}

      {/* PHASE 4 §1 — SIGNALS, not a proof field. The verdict states itself first. */}
      {row.type === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BarVerdict claimed={resolved.claimed} />
          {resolved.legacy && (
            <div style={{ fontSize: 12, color: t.inkMuted, lineHeight: 1.4 }}>
              Submitted before the signal model - signals below are inferred from the
              original proof fields. The raw submission is under the disclosure.
            </div>
          )}
          <SignalsPanel
            signals={resolved.signals}
            renderDocument={(path) => <SupportingDocLink path={path} />}
          />
          <RawMetadataDisclosure row={row} />
        </div>
      )}

      {row.type === 'business' && row.contactEmail && (
        <Field label="Applicant contact email" value={row.contactEmail} />
      )}
      {row.type === 'business' && row.contactRole && (
        <Field label="Applicant role" value={row.contactRole} />
      )}

      {row.note && <Field label="Request note" value={row.note} />}
      {row.evidenceUrl && (
        <Field label="Evidence">
          <a href={row.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: t.brandText, fontSize: 13 }}>
            {row.evidenceUrl}
          </a>
        </Field>
      )}
      {row.inviteReason && <Field label="Reason" value={row.inviteReason} />}

      {/* PHASE 4 §4 — a decision is a RECORD: who, when, on what grounds. */}
      {row.status !== 'pending' && (
        <div style={{
          background: t.canvas, border: `1px solid ${t.line}`,
          borderRadius: t.radius.md, padding: 10,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 11, color: t.inkFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Decision
          </div>
          <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.45 }}>
            {row.status} {row.reviewerName ? `by ${row.reviewerName}` : row.reviewedBy ? `by ${row.reviewedBy.slice(0, 8)}` : ''}
            {row.reviewedAt ? ` - ${relTime(row.reviewedAt)}` : ''}
          </div>
          {reviewReasonLabel(row.reviewReason) && (
            <div style={{ fontSize: 13, color: t.ink }}>
              <span style={{ color: t.inkMuted }}>Reason:</span> {reviewReasonLabel(row.reviewReason)}
            </div>
          )}
          {row.adminNote && (
            <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.45 }}>
              <span style={{ color: t.inkMuted }}>Note:</span> {row.adminNote}
            </div>
          )}
          {(row.requiredApprovals ?? 1) > 1 && (
            <div style={{ fontSize: 12, color: t.inkMuted }}>
              Approvals {row.approvalCount ?? 0}/{row.requiredApprovals}
            </div>
          )}
        </div>
      )}
      {row.status === 'pending' && row.adminNote && <Field label="Previous admin note" value={row.adminNote} />}
      {row.status === 'pending' && (row.requiredApprovals ?? 1) > 1 && (
        <div style={{ fontSize: 12, color: t.inkMuted }}>
          Two-reviewer sign-off: {row.approvalCount ?? 0}/{row.requiredApprovals} recorded.
          A second, different reviewer must approve to complete it.
        </div>
      )}

      {/* PHASE 4 §3.2 — the reason is chosen from the published criteria, so the
          applicant gets a cause and a remedy rather than a mood. */}
      {row.status === 'pending' && setReviewReason && (decision === 'rejected' || decision === 'needs_more_info') && (
        <div>
          <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
            Reason <span style={{ color: t.danger }}>(required)</span>
          </label>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {REVIEW_REASON_OPTIONS.map(opt => {
              const on = reviewReason === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReviewReason(on ? null : opt.value)}
                  style={{
                    textAlign: 'left', padding: '8px 10px',
                    borderRadius: t.radius.md,
                    border: `1px solid ${on ? t.brandText : t.line}`,
                    background: on ? t.warnSoft : t.surface,
                    cursor: 'pointer',
                  }}
                  aria-pressed={on}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: t.inkMuted, lineHeight: 1.35 }}>{opt.hint}</div>
                </button>
              );
            })}
          </div>
          {!reviewReason && (
            <div style={{ fontSize: 12, color: t.dangerText, marginTop: 6 }}>
              Choose the reason this request does not pass.
            </div>
          )}
        </div>
      )}

      {row.status === 'pending' && (
        <div>
          <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
            Admin note {reviewReason && reasonRequiresNote(reviewReason) && <span style={{ color: t.danger }}>(required, min 3 chars)</span>}
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Adds detail to the reason. Required only for 'Other'."
            rows={3}
            style={{
              marginTop: 6, width: '100%',
              padding: 10, borderRadius: t.radius.md,
              border: `1px solid ${reviewReason && reasonRequiresNote(reviewReason) && note.trim().length < 3 ? t.danger : t.line}`,
              background: t.canvas, color: t.ink, fontSize: 13,
              outline: 'none', resize: 'vertical',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Local helpers ─────────────────────── */


function VerificationCard({
  row, onOpen, onQuick, disabled,
}: { row: VerificationRow; onOpen: () => void; onQuick: (d: 'approved' | 'rejected' | 'needs_more_info') => void; disabled?: boolean }) {
  const tone =
    row.status === 'pending' || row.status === 'needs_more_info' ? 'warn' :
    row.status === 'approved' || row.status === 'accepted' ? 'ok' :
    row.status === 'rejected' || row.status === 'declined' ? 'danger' : 'neutral';
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: t.radius.md, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <button
        onClick={onOpen}
        style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
      >
        <SquircleAvatar size={36} src={row.avatarUrl ?? null} alt={row.displayName ?? ''} userId={row.requestedBy} hairlineRing />
        <div style={{ flex: 1, minWidth: 0 }}>
          {row.type === 'course_claim' ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.claimCourseName ?? row.claimBusinessName ?? 'Course claim'}
              </div>
              <div style={{ fontSize: 12, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Course claim - requested by {row.displayName ?? row.username ?? '-'} - {relTime(row.createdAt)}
                {row.claimBusinessName && row.claimBusinessName !== row.claimCourseName ? ` - ${row.claimBusinessName}` : ''}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
                {row.displayName ?? row.username ?? row.requestedBy?.slice(0, 8) ?? '-'}
              </div>
              <div style={{ fontSize: 12, color: t.inkMuted }}>
                {row.type === 'business' ? 'Business' : 'Golfer'} - {relTime(row.createdAt)}
              </div>
            </>
          )}
        </div>
        <StatusPill tone={tone}>{row.status}</StatusPill>
      </button>
      {row.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DrawerBtn icon={<X size={14} />} tone="danger" disabled={disabled} onClick={() => onQuick('rejected')}>Reject</DrawerBtn>
          {(row.type === 'business' || row.type === 'course_claim') && (
            <DrawerBtn icon={<Mail size={14} />} tone="warn" disabled={disabled} onClick={() => onQuick('needs_more_info')}>Needs info</DrawerBtn>
          )}
          <DrawerBtn icon={<CheckCircle2 size={14} />} disabled={disabled} onClick={() => onQuick('approved')}>Approve</DrawerBtn>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      {children ?? <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.45 }}>{value}</div>}
    </div>
  );
}

function DrawerBtn({
  children, onClick, tone, icon, disabled,
}: { children: React.ReactNode; onClick: () => void; tone?: 'warn' | 'danger'; icon?: React.ReactNode; disabled?: boolean }) {
  const bg = tone === 'danger' ? t.dangerSoft : tone === 'warn' ? t.warnSoft : t.surface;
  const fg = tone === 'danger' ? t.dangerText : tone === 'warn' ? t.warnText : t.ink;
  const border = tone ? 'transparent' : t.line;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: t.radius.md,
        background: bg, color: fg,
        border: `1px solid ${border}`,
        fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}{children}
    </button>
  );
}

function SkeletonRows({ n = 6 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          height: 64, background: t.canvas,
          borderRadius: t.radius.md,
          animation: 'admin-pulse 1.4s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes admin-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </div>
  );
}

function SupportingDocLink({ path }: { path: string }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.storage
        .from('business-verification-docs')
        .createSignedUrl(path, 60 * 10);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('[verification] signed URL failed', e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      style={{
        fontSize: 13, color: t.brandText,
        textDecoration: 'underline', background: 'transparent',
        border: 'none', padding: 0,
        cursor: busy ? 'wait' : 'pointer',
      }}
    >
      {busy ? 'Opening...' : 'View supporting document'}
    </button>
  );
}
