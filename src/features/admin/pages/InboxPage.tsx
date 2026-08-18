import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LABEL } from '@/lib/tokens/type';
import { courseMatchLabel } from '../lib/geography';
import { adminTheme as t } from '../theme';
import { useInboxFeed, type InboxItem, type InboxType } from '../hooks/useInboxFeed';
import { useInboxOpsStats, formatDurationShort as formatDurationMs } from '../hooks/useInboxOpsStats';
// Seconds in. The Dashboard's System panel uses this exact formatter, so an age
// reads identically on both surfaces.
import { formatDurationShort } from '../lib/chartPrimitives';
import EmptyState from '../components/EmptyState';
import AdminAccessDenied from '../components/AdminAccessDenied';
import ModerationDetailDrawer from '../components/ModerationDetailDrawer';
import AppealDetailDrawer from '../components/AppealDetailDrawer';
import SupportTicketDrawer from '../components/SupportTicketDrawer';
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer';
import AdminSheet from '../components/AdminSheet';
import HolePhotoReviewSheet from '../components/HolePhotoReviewSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import type { HolePhotoQueueRow } from '../hooks/useHolePhotoQueue';
import CourseMatchingPage from './CourseMatchingPage';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { supabase } from '@/integrations/supabase/client';
import { useVerifications, type VerificationRow } from '../hooks/useVerifications';
import { VerificationDetailBody } from '../components/VerificationsReview';
import { reasonRequiresNote, type ReviewReason } from '@/components/business/verification/reviewReasons';
import type { ModerationQueueRow } from '../hooks/useModerationQueue';
import type { AppealRow } from '../hooks/useAppeals';
import type { AdminRequestRow } from '../hooks/useAdminActionRequests';
import type { SupportTicketRow } from '../hooks/useSupportTickets';
import type { MatchRequestRow } from '../hooks/useMatchRequests';
import type { CourseRequestRow } from '../hooks/useCourseRequests';
import {
  UNMATCHED_COURSES_KEY,
  ignoreUnmatchedCourse,
  linkUnmatchedCourse,
  markUnmatchedNeedsCatalogue,
  type UnmatchedCourseRow,
} from '../hooks/useUnmatchedCourses';

// ---------- type meta ----------

const TYPE_LABEL: Record<InboxType, string> = {
  report: 'Reports',
  appeal: 'Appeals',
  support: 'Support',
  verification: 'Verifications',
  approval: 'Approvals',
  match: 'Matches',
  courseRequest: 'Course requests',
  unmatchedCourse: 'Unmatched courses',
  holePhoto: 'Hole photos',
};

/** The page's one age format. Absolute, tabular-safe: "44m" / "31h" / "32d". */
function ageShort(iso: string): string {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  return Number.isFinite(secs) ? formatDurationShort(Math.max(0, secs)) : '-';
}

/** Kept for the Done view only: "closed 2 days ago" beats an absolute age. */
function relTime(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function ageColour(iso: string): string {
  const diffH = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (diffH >= 24) return t.dangerText;
  if (diffH >= 8) return t.warnText;
  return t.inkFaint;
}

const LABEL_T = { ...LABEL, fontFeatureSettings: '"kern" 1, "liga" 1' } as const;

// ---------- redirects helper ----------

export function RedirectWithSearch({ to, extraType }: { to: string; extraType?: InboxType }) {
  const [params] = useSearchParams();
  const search = new URLSearchParams(params);
  if (extraType) search.set('type', extraType);
  const qs = search.toString();
  return <Navigate to={`${to}${qs ? `?${qs}` : ''}`} replace />;
}

// ---------- workbench count ----------

function useWorkbenchCount(enabled: boolean) {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const { count: n } = await supabase
        .from('whs_to_golf_course_map' as any)
        .select('whs_course_id', { count: 'exact', head: true })
        .is('golf_course_id', null);
      if (!cancelled) setCount(n ?? 0);
    })();
    return () => { cancelled = true; };
  }, [enabled]);
  return count;
}

// ---------- inbox list page ----------

function InboxListPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const canMod = caps.viewModeration;
  const canUsers = caps.viewUsers;
  const canApprove = caps.approveRequests;

  const [params, setParams] = useSearchParams();
  const typeFilter = (params.get('type') as InboxType | 'all' | null) ?? 'all';
  const view = (params.get('view') as 'open' | 'done' | null) ?? 'open';

  const feed = useInboxFeed();
  const qc = useQueryClient();
  const workbenchCount = useWorkbenchCount(canUsers);

  // Refresh
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  // Drawer states
  const [modRow, setModRow] = useState<ModerationQueueRow | null>(null);
  const [appealRow, setAppealRow] = useState<AppealRow | null>(null);
  const [approvalRow, setApprovalRow] = useState<AdminRequestRow | null>(null);
  const [supportRow, setSupportRow] = useState<SupportTicketRow | null>(null);
  const [verifRow, setVerifRow] = useState<VerificationRow | null>(null);
  const [matchRow, setMatchRow] = useState<MatchRequestRow | null>(null);
  const [courseReqRow, setCourseReqRow] = useState<CourseRequestRow | null>(null);
  const [unmatchedRow, setUnmatchedRow] = useState<UnmatchedCourseRow | null>(null);
  const [holePhotoRow, setHolePhotoRow] = useState<HolePhotoQueueRow | null>(null);

  // Deep-link ?ticket= opens support drawer
  useEffect(() => {
    const ticketId = params.get('ticket');
    if (!ticketId) return;
    const item = [...feed.items, ...feed.doneItems].find(i => i.type === 'support' && (i.payload as any)?.id === ticketId);
    if (item) setSupportRow(item.payload as SupportTicketRow);
  }, [params, feed.items, feed.doneItems]);

  const setType = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('type'); else next.set('type', id);
    setParams(next, { replace: true });
  };

  const setView = (id: 'open' | 'done') => {
    const next = new URLSearchParams(params);
    if (id === 'open') next.delete('view'); else next.set('view', id);
    setParams(next, { replace: true });
  };

  const visibleTypes = useMemo<InboxType[]>(() => {
    const out: InboxType[] = [];
    if (canMod) out.push('report', 'appeal', 'support');
    if (canUsers) out.push('verification', 'match', 'courseRequest', 'unmatchedCourse', 'holePhoto');
    if (canApprove) out.push('approval');
    return out;
  }, [canMod, canUsers, canApprove]);

  const openItems = feed.items;
  const doneItems = feed.doneItems;
  const source = view === 'done' ? doneItems : openItems;
  const filtered = typeFilter === 'all' ? source : source.filter(i => i.type === typeFilter);

  const openCount = openItems.length;
  const oldest = feed.oldestCreatedAt;

  // Oldest OPEN item per queue. The feed sorts high-priority to the top, so the
  // first row of a type is not necessarily its oldest - take the minimum.
  const oldestByType = useMemo(() => {
    const out: Partial<Record<InboxType, string>> = {};
    for (const item of openItems) {
      const held = out[item.type];
      if (!held || new Date(item.createdAt) < new Date(held)) out[item.type] = item.createdAt;
    }
    return out;
  }, [openItems]);

  const openRow = (item: InboxItem) => {
    switch (item.type) {
      case 'report': setModRow(item.payload as ModerationQueueRow); break;
      case 'appeal': setAppealRow(item.payload as AppealRow); break;
      case 'support': {
        const row = item.payload as SupportTicketRow;
        setSupportRow(row);
        const next = new URLSearchParams(params);
        next.set('ticket', row.id);
        setParams(next, { replace: true });
        break;
      }
      case 'approval': setApprovalRow(item.payload as AdminRequestRow); break;
      case 'verification': setVerifRow(item.payload as VerificationRow); break;
      case 'match': setMatchRow(item.payload as MatchRequestRow); break;
      case 'courseRequest': setCourseReqRow(item.payload as CourseRequestRow); break;
      case 'unmatchedCourse': setUnmatchedRow(item.payload as UnmatchedCourseRow); break;
      case 'holePhoto': setHolePhotoRow(item.payload as HolePhotoQueueRow); break;
    }
  };

  const closeSupport = () => {
    setSupportRow(null);
    const next = new URLSearchParams(params);
    next.delete('ticket');
    setParams(next, { replace: true });
  };

  if (visibleTypes.length === 0) return <AdminAccessDenied />;

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, margin: '0 auto' }}>
      {/* Header — the shell already renders ADMIN / Inbox; only the summary lives here. */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {openCount > 0 && (
          <div
            style={{
              color: t.inkMuted, fontSize: 13,
              fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: t.ink, fontWeight: 700 }}>{openCount}</span> open
            {oldest && (
              <>
                {' - longest '}
                <span style={{ color: ageColour(oldest), fontWeight: 700 }}>{ageShort(oldest)}</span>
              </>
            )}
          </div>
        )}
        {view === 'open' && <InboxOpsStrip doneItems={feed.doneItems} />}
      </header>

      {feed.hadErrors && (
        <div
          role="alert"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: t.radius.md,
            background: t.warnSoft, color: t.warnText,
            border: `1px solid ${t.warnText}22`,
            fontSize: 12, fontWeight: 600,
          }}
        >
          <AlertTriangle size={14} /> Some queues could not load
        </div>
      )}

      {/* Open/Done toggle */}
      <div
        style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          background: t.canvas, border: `1px solid ${t.line}`, borderRadius: 999, padding: 3,
        }}
      >
        {(['open', 'done'] as const).map(k => {
          const active = view === k;
          return (
            <button
              key={k}
              onClick={() => setView(k)}
              style={{
                padding: '6px 14px', borderRadius: 999,
                background: active ? t.ink : 'transparent',
                color: active ? t.surface : t.inkMuted,
                fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {k === 'open' ? 'Open' : 'Done'}
              {k === 'open' && openCount > 0 && (
                <span style={{
                  background: active ? t.brand : t.line,
                  color: active ? t.surface : t.inkMuted,
                  fontSize: 10, fontWeight: 700, padding: '0 6px', borderRadius: 999,
                  fontFeatureSettings: '"tnum" 1',
                }}>{openCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${visibleTypes.length <= 4 ? 2 : 3}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        {visibleTypes.map(tp => (
          <QueueTile
            key={tp}
            label={TYPE_LABEL[tp]}
            count={feed.counts[tp] ?? 0}
            oldestIso={oldestByType[tp] ?? null}
            active={typeFilter === tp}
            onClick={() => setType(typeFilter === tp ? 'all' : tp)}
          />
        ))}
      </div>

      {/* Stream card */}
      <section
        style={{
          background: t.surface, border: `1px solid ${t.line}`,
          borderRadius: 18, boxShadow: t.shadowCard,
          padding: 12, display: 'flex', flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            gap: 10, padding: '4px 4px 8px',
          }}
        >
          <span style={{ ...LABEL_T, color: t.inkMuted }}>
            {typeFilter === 'all' ? 'All queues' : TYPE_LABEL[typeFilter as InboxType]}
          </span>
          <span style={{ ...LABEL_T, color: t.inkFaint }}>
            {view === 'done' ? 'Recently closed' : 'Longest wait first'}
          </span>
        </div>

        {feed.isLoading && filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                height: 60, background: t.canvas, borderRadius: t.radius.md,
                animation: 'admin-pulse 1.4s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : filtered.length === 0 && view === 'open' && typeFilter === 'all' ? (
          <EmptyState
            icon={<CheckCircle2 size={28} />}
            title="Inbox zero"
            subtitle="Every queue is clear. New items land here the moment they arrive."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nothing here" subtitle="No items match this filter." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((item, idx) => (
              <StreamRow
                key={item.id}
                item={item}
                first={idx === 0}
                done={view === 'done'}
                showQueue={typeFilter === 'all'}
                onClick={() => openRow(item)}
              />
            ))}
          </div>
        )}

      </section>

      {/* TOOLS */}
      {canUsers && workbenchCount > 0 && view === 'open' && (
        <section
          style={{
            background: t.surface, border: `1px solid ${t.line}`,
            borderRadius: 18, boxShadow: t.shadowCard,
            padding: 12, display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{ ...LABEL_T, color: t.inkFaint, padding: '2px 4px 8px' }}>Tools</div>
          <Link
            to="/admin-v2/inbox/matching"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '4px 4px',
              textDecoration: 'none', color: t.ink,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: t.ink }}>Course matching workbench</div>
              <div style={{ fontSize: 11.5, color: t.inkMuted }}>
                {workbenchCount} scored course{workbenchCount === 1 ? '' : 's'} unmatched
              </div>
            </div>
            <ChevronRight size={16} color={t.inkFaint} />
          </Link>
        </section>
      )}

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>

      {/* Drawers */}
      <ModerationDetailDrawer open={modRow !== null} onClose={() => setModRow(null)} row={modRow} />
      <AppealDetailDrawer open={appealRow !== null} onClose={() => setAppealRow(null)} row={appealRow} />
      <ApprovalDetailDrawer open={approvalRow !== null} onClose={() => setApprovalRow(null)} row={approvalRow} />
      <SupportTicketDrawer ticket={supportRow} onClose={closeSupport} />
      <VerificationInboxSheet row={verifRow} onClose={() => setVerifRow(null)} />
      <MatchInboxSheet row={matchRow} onClose={() => setMatchRow(null)} />
      <UnmatchedCourseSheet row={unmatchedRow} onClose={() => setUnmatchedRow(null)} />
      <CourseRequestInboxSheet row={courseReqRow} onClose={() => setCourseReqRow(null)} />
      <HolePhotoReviewSheet row={holePhotoRow} onClose={() => setHolePhotoRow(null)} />
    </div>
  );
}

// ---------- pieces ----------

function QueueTile({
  label, count, oldestIso, active, onClick,
}: {
  label: string;
  count: number;
  oldestIso: string | null;
  active: boolean;
  onClick: () => void;
}) {
  const empty = count === 0;
  const tone = oldestIso ? ageColour(oldestIso) : t.line;
  const capOpacity = !oldestIso ? 1 : tone === t.inkFaint ? 0.5 : 1;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '8px 10px 10px',
        borderRadius: t.radius.lg,
        background: active ? t.neutralSoft : t.surface,
        border: `1px solid ${active ? t.line : t.hairline}`,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: empty ? 0.55 : 1,
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          height: 2.5, borderRadius: 2, width: '100%',
          background: tone, opacity: capOpacity,
        }}
      />
      <span
        style={{
          ...LABEL_T, color: t.inkMuted,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span
          style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: t.ink,
            fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </span>
        {!empty && oldestIso && (
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: tone,
              fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
            }}
          >
            {ageShort(oldestIso)}
          </span>
        )}
      </span>
    </button>
  );
}

function StreamRow({ item, first, done, showQueue, onClick }: {
  item: InboxItem; first: boolean; done: boolean; showQueue: boolean; onClick: () => void;
}) {
  const meta = item.meta.replace(/^[^-]+-\s*/, '');
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 4px',
        borderTop: first ? 'none' : `1px solid ${t.line}`,
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', width: '100%',
        opacity: done ? 0.72 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {item.isHighPriority && (
            <span
              style={{
                padding: '1px 6px', borderRadius: 4,
                background: t.dangerSoft, color: t.dangerText,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
                flexShrink: 0,
              }}
            >
              High
            </span>
          )}
          <span
            style={{
              color: t.ink, fontSize: 13.5, fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </span>
          {showQueue && (
            <span style={{ ...LABEL_T, color: t.inkFaint, flexShrink: 0 }}>
              {TYPE_LABEL[item.type]}
            </span>
          )}
        </div>
        <div
          style={{
            color: t.inkMuted, fontSize: 11.5, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {done && item.closedOutcome ? item.closedOutcome : meta}
        </div>
      </div>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11, fontWeight: 700,
            color: done ? t.inkFaint : ageColour(item.createdAt),
            fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {done ? relTime(item.createdAt) : ageShort(item.createdAt)}
        </span>
        {!done && (
          <span style={{ ...LABEL_T, color: t.inkFaint, marginTop: 1 }}>Waiting</span>
        )}
      </span>
      <ChevronRight size={14} color={t.inkFaint} />
    </button>
  );
}

// ---------- verification sheet ----------

function VerificationInboxSheet({ row, onClose }: { row: VerificationRow | null; onClose: () => void }) {
  const { reviewMutation } = useVerifications();
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_more_info' | null>(null);
  // PHASE 4 §3.2 — the same gate as the Verifications tab: a refusal carries a reason.
  const [reviewReason, setReviewReason] = useState<ReviewReason | null>(null);
  useEffect(() => { if (!row) { setNote(''); setDecision(null); setReviewReason(null); } }, [row]);

  if (!row) return null;

  const refusalReady = !!reviewReason && (!reasonRequiresNote(reviewReason) || note.trim().length >= 3);

  const submit = (d: 'approved' | 'rejected' | 'needs_more_info') => {
    if (d !== 'approved' && !refusalReady) { setDecision(d); return; }
    if (row.type === 'golfer' && d === 'needs_more_info') return;
    reviewMutation.mutate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: row.id, type: row.type, decision: d as any, adminNote: note, reviewReason: d === 'approved' ? null : reviewReason },
      { onSuccess: onClose },
    );
  };

  const title =
    row.type === 'course_claim' ? `Course claim: ${row.claimCourseName ?? row.claimBusinessName ?? 'course'}`
    : row.type === 'business' ? 'Business verification'
    : 'Golfer verification';

  return (
    <AdminSheet
      open={row !== null}
      onClose={onClose}
      title={title}
      subtitle={row.displayName ?? row.username ?? undefined}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {row.type !== 'golfer' && (
            <button
              onClick={() => submit('needs_more_info')}
              disabled={reviewMutation.isPending}
              style={btnGhost()}
            >
              Needs info
            </button>
          )}
          <button
            onClick={() => submit('rejected')}
            disabled={reviewMutation.isPending}
            style={btnGhost()}
          >
            Reject
          </button>
          <button
            onClick={() => submit('approved')}
            disabled={reviewMutation.isPending}
            style={btnPrimary(reviewMutation.isPending)}
          >
            {reviewMutation.isPending ? 'Working...' : 'Approve'}
          </button>
        </div>
      }
    >
      <VerificationDetailBody
        row={row}
        note={note}
        setNote={setNote}
        decision={decision}
        reviewReason={reviewReason}
        setReviewReason={setReviewReason}
      />
    </AdminSheet>
  );
}

// ---------- match sheet ----------

function MatchInboxSheet({ row, onClose }: { row: MatchRequestRow | null; onClose: () => void }) {
  const [whs, setWhs] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!row) { setWhs(''); setErr(null); return; }
    setWhs(row.whs_course_name ?? '');
  }, [row]);

  if (!row) return null;

  const run = async (action: 'match' | 'reject') => {
    if (action === 'match' && !whs.trim()) { setErr('WHS name is required.'); return; }
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.functions.invoke('admin-resolve-match-request', {
      body: action === 'match'
        ? { request_id: row.id, action: 'match', whs_name: whs.trim() }
        : { request_id: row.id, action: 'reject' },
    });
    setBusy(false);
    const msg = (error as any)?.message || (data as any)?.error;
    if (msg) { setErr(String(msg)); return; }
    qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox'] });
    onClose();
  };

  return (
    <AdminSheet
      open={row !== null}
      onClose={onClose}
      title="Match WHS course"
      subtitle={row.course_name ?? undefined}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => run('reject')} disabled={busy} style={btnGhost()}>Reject</button>
          <button onClick={() => run('match')} disabled={busy || !whs.trim()} style={btnPrimary(busy)}>
            {busy ? 'Working...' : 'Confirm match'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, color: t.inkMuted }}>
          Requester: <span style={{ color: t.ink, fontWeight: 600 }}>{row.requester_name ?? row.requester_username ?? row.user_id.slice(0, 8)}</span>
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: t.inkFaint }}>
          WHS course name to alias
        </label>
        <input
          type="text"
          value={whs}
          onChange={(e) => setWhs(e.target.value)}
          placeholder="WHS course name"
          style={{
            padding: '10px 12px', borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
            fontSize: 13, outline: 'none',
          }}
        />
        {err && (
          <div style={{
            padding: '8px 10px', borderRadius: t.radius.md,
            background: t.dangerSoft, color: t.dangerText, fontSize: 12,
          }}>{err}</div>
        )}
      </div>
    </AdminSheet>
  );
}

// ---------- unmatched course sheet ----------

interface CourseHit { id: string; name: string; region: string | null; sub_country: string | null; country: string | null }

function UnmatchedCourseSheet({ row, onClose }: { row: UnmatchedCourseRow | null; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CourseHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<CourseHit | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmIgnore, setConfirmIgnore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();

  const whsId = row?.whs_course_id;

  useEffect(() => {
    if (!row) return;
    setChosen(null);
    setErr(null);
    setHits([]);
    setQuery(row.echo_suggestion ?? (row.whs_course_name ?? '').split('-')[0].trim());
  }, [whsId]);

  useEffect(() => {
    if (!row) return;
    const q = query.trim();
    if (q.length < 2) { setHits([]); return; }
    setSearching(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, sub_country, country')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(25);
      setSearching(false);
      if (error) { setErr(error.message); setHits([]); return; }
      setHits((data ?? []) as CourseHit[]);
    }, 220);
    return () => clearTimeout(handle);
  }, [query, whsId]);

  if (!row) return null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox'] });
    qc.invalidateQueries({ queryKey: UNMATCHED_COURSES_KEY });
    qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'triage-counts'] });
  };

  const doLink = async () => {
    if (!chosen) return;
    setBusy(true); setErr(null);
    try {
      await linkUnmatchedCourse(row.whs_course_id, chosen.id);
      refresh();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Link failed.');
    } finally {
      setBusy(false);
    }
  };

  const doNeedsCatalogue = async () => {
    setBusy(true); setErr(null);
    try {
      await markUnmatchedNeedsCatalogue(row.whs_course_id);
      refresh();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const doIgnore = async () => {
    setBusy(true); setErr(null);
    try {
      await ignoreUnmatchedCourse(row.whs_course_id);
      refresh();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const rounds = `${row.round_count} round${row.round_count === 1 ? '' : 's'}`;
  const members = `${row.member_count} member${row.member_count === 1 ? '' : 's'}`;

  return (
    <>
    <AdminSheet
      open={row !== null}
      onClose={onClose}
      title={row.whs_course_name ?? 'Unnamed WHS course'}
      subtitle={`${rounds} from ${members}`}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setConfirmIgnore(true)} disabled={busy} style={btnGhost()}>Ignore</button>
          <button onClick={doNeedsCatalogue} disabled={busy} style={btnGhost()}>Not in the catalogue</button>
          <button onClick={doLink} disabled={busy || !chosen} style={btnPrimary(busy || !chosen)}>
            {busy ? 'Working...' : 'Link to course'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {row.status === 'needs_catalogue' && (
          <div style={{
            alignSelf: 'flex-start', padding: '3px 9px', borderRadius: 999,
            background: t.neutralSoft, color: t.inkMuted,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Needs catalogue entry
          </div>
        )}
        <div style={{ fontSize: 12, color: t.inkMuted }}>
          Waiting {relTime(row.first_seen_at)}
          {row.last_tier_tried ? ` - last tier: ${row.last_tier_tried}` : ''}
        </div>
        {row.echo_suggestion && (
          <div style={{ fontSize: 12, color: t.inkMuted }}>
            Echo suggests: <span style={{ color: t.ink, fontWeight: 600 }}>{row.echo_suggestion}</span>
          </div>
        )}
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: t.inkFaint }}>
          Search courses
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Club name..."
          style={{
            padding: '10px 12px', borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
            fontSize: 13, outline: 'none',
          }}
        />
        {searching ? (
          <div style={{ color: t.inkMuted, fontSize: 12 }}>Searching...</div>
        ) : hits.length === 0 ? (
          <div style={{ color: t.inkMuted, fontSize: 12 }}>
            {query.trim().length < 2 ? 'Type at least 2 characters.' : 'No matches.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hits.map((h) => {
              const active = chosen?.id === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => setChosen(h)}
                  style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: t.radius.md,
                    border: `1px solid ${active ? t.brand : t.line}`,
                    background: active ? t.brandSoft ?? t.canvas : t.surface,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: t.inkMuted }}>
                    {courseMatchLabel(h) || '-'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {err && (
          <div style={{
            padding: '8px 10px', borderRadius: t.radius.md,
            background: t.dangerSoft, color: t.dangerText, fontSize: 12,
          }}>{err}</div>
        )}
      </div>
    </AdminSheet>
    <ConfirmDialog
      open={confirmIgnore}
      onClose={() => setConfirmIgnore(false)}
      onConfirm={() => { setConfirmIgnore(false); void doIgnore(); }}
      title="Ignore this course?"
      description={`Ignoring means this WHS course is never linked to a course in the catalogue. ${rounds} played here by ${members} will not appear in any member's course analytics, and will stay hidden until someone links the course. This is not housekeeping - it discards those rounds from every gam surface.`}
      confirmLabel="Ignore anyway"
      tone="danger"
      busy={busy}
    />
    </>
  );
}

// ---------- course request sheet ----------

function CourseRequestInboxSheet({ row, onClose }: { row: CourseRequestRow | null; onClose: () => void }) {
  if (!row) return null;
  return (
    <AdminSheet
      open={row !== null}
      onClose={onClose}
      title={row.courseName}
      subtitle="Course request"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: t.ink }}>
        {row.location && <div><b>Location:</b> {row.location}</div>}
        {row.country && <div><b>Country:</b> {row.country}</div>}
        {row.note && <div style={{ color: t.inkMuted, lineHeight: 1.5 }}>{row.note}</div>}
        <div style={{ marginTop: 8 }}>
          <Link
            to="/admin-v2/content"
            style={{ color: t.brandText, fontWeight: 600, fontSize: 13 }}
          >
            Manage in Content
          </Link>
        </div>
      </div>
    </AdminSheet>
  );
}

// ---------- shared button styles ----------

function btnGhost(): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  };
}
function btnPrimary(busy = false): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md,
    border: 'none', background: t.brand, color: t.canvas,
    fontSize: 13, fontWeight: 700,
    cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.55 : 1,
  };
}

// ---------- routes ----------

export default function InboxPage() {
  return (
    <Routes>
      <Route index element={<InboxListPage />} />
      <Route path="matching" element={<CourseMatchingPage />} />
    </Routes>
  );
}

// C4-6: Inbox ops strip - resolved this week + median time-to-resolution.
// Duration only from sources with authoritative reviewed timestamps
// (report, appeal, verification). Never fabricates a duration; when no
// duration-eligible items exist in the recent done set, shows the resolved
// count alone.
function InboxOpsStrip({ doneItems }: { doneItems: InboxItem[] }) {
  const { resolvedThisWeek, medianMs, sampleSize } = useInboxOpsStats(doneItems);
  if (resolvedThisWeek === 0 && medianMs == null) return null;

  const Chip: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
    <div style={{
      background: t.canvas, border: `1px solid ${t.line}`,
      borderRadius: t.radius.md, padding: '6px 10px', minWidth: 0,
    }}>
      <div style={{ color: t.inkMuted, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {note && <div style={{ color: t.inkFaint, fontSize: 10 }}>{note}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
      <Chip label="Resolved this week" value={String(resolvedThisWeek)} />
      {medianMs != null && (
        <Chip
          label="Median time to resolve"
          value={formatDurationMs(medianMs)}
          note={`n=${sampleSize}`}
        />
      )}
    </div>
  );
}

