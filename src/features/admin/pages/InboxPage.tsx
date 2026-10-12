import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateAdminQueues, subscribeAdminQueueChanges, refreshAdminQueues } from '@/features/admin/lib/adminQueueRefresh';
import { ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LABEL } from '@/lib/tokens/type';
import { courseMatchLabel } from '../lib/geography';
import {
  CandidateCountryFlag,
  CountryMismatchWarning,
  WhsCountryChip,
} from '../components/CountryMismatchWarning';
import { adminTheme as t } from '../theme';
import { useInboxFeed, type InboxItem, type InboxType } from '../hooks/useInboxFeed';
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
import VenueMappingPage from './VenueMappingPage';
import AddCourseSheet from '../components/AddCourseSheet';
import InboxQueueRow from '../components/InboxQueueRow';
import { OpenDoneControl, FigureTiles, QueueChips, RowSkeleton, FlowPanel, ToolRow, useCatalogueTotal } from '../components/InboxPanels';
import { useInboxFlow } from '../hooks/useInboxFlow';
import { orderOpenItems, summariseQueues } from '../lib/inboxQueue';
import { LIST_PANEL } from '../lib/panels';
import CourseSearchField, { useCourseSearch, type CourseSearchHit } from '../components/CourseSearchField';
import { uploadCoursePhoto } from '../hooks/useCourses';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { supabase } from '@/integrations/supabase/client';
import { useVerifications, type VerificationRow } from '../hooks/useVerifications';
import { useCourseRequests } from '../hooks/useCourseRequests';
import { useHomeClubSearch } from '@/features/home-club/useHomeClubSearch';
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
  const flow14 = useInboxFlow(14);
  const flow7 = useInboxFlow(7);
  const catalogueTotal = useCatalogueTotal(canUsers);

  // Rows removed by an inline action leave at once; the refetch confirms.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const onResolved = (id: string) => {
    setRemoved(prev => new Set(prev).add(id));
    void refreshAdminQueues(qc);
  };

  // Refresh — manual refresh, plus queue changes made in another admin tab.
  useEffect(() => {
    const handler = () => { void invalidateAdminQueues(qc); };
    window.addEventListener('admin-v2:refetch', handler);
    const unsubscribe = subscribeAdminQueueChanges(handler);
    return () => {
      window.removeEventListener('admin-v2:refetch', handler);
      unsubscribe();
    };
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
    const item = [...feed.items, ...feed.doneItems].find(i => i.type === 'support' && (i.payload as SupportTicketRow | undefined)?.id === ticketId);
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

  const openItems = useMemo(
    () => orderOpenItems(feed.items.filter(i => !removed.has(i.id))),
    [feed.items, removed],
  );
  const doneItems = feed.doneItems;
  const queues = useMemo(() => summariseQueues(openItems), [openItems]);
  const source = view === 'done' ? doneItems : openItems;
  const filtered = typeFilter === 'all' ? source : source.filter(i => i.type === typeFilter);
  const openCount = openItems.length;
  const loading = feed.isLoading && feed.items.length === 0;

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
      {/* 2.1 - the page's first row is the Open/Done control, nothing else. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <OpenDoneControl view={view} openCount={openCount} onChange={setView} />
      </div>

      {feed.hadErrors && (
        <div
          role="alert"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: t.radius.md,
            background: t.warnSoft, color: t.warnText,
            fontSize: 12, fontWeight: 600,
          }}
        >
          <AlertTriangle size={14} /> Some queues could not load
        </div>
      )}

      <FigureTiles
        view={view}
        loading={loading}
        openItems={openItems}
        doneItems={doneItems}
        queueCount={queues.length}
        flow7={flow7.data}
        flow7Loading={flow7.isLoading}
      />

      {view === 'open' && (
        <QueueChips loading={loading} total={openCount} queues={queues} selected={typeFilter} onSelect={setType} />
      )}

      {/* 2.4 The list */}
      <section style={{ ...LIST_PANEL, padding: '14px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '0 16px 10px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ink }}>
            {view === 'done' ? 'Recently closed' : 'Members affected first'}
          </span>
          <span style={{ fontSize: 11, color: t.inkFaint }}>
            {view === 'done' ? 'newest first' : 'then longest wait'}
          </span>
        </div>

        {loading ? (
          <div aria-busy>
            {[0, 1, 2].map(i => <RowSkeleton key={i} first={i === 0} />)}
          </div>
        ) : filtered.length === 0 && view === 'open' ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', borderTop: `1px solid ${t.hairline}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Nothing waiting</div>
            <div style={{ fontSize: 11.5, color: t.inkMuted, marginTop: 2 }}>
              {typeFilter === 'all' ? 'every queue is clear' : 'this queue is clear'}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', borderTop: `1px solid ${t.hairline}`, fontSize: 11.5, color: t.inkMuted }}>
            Nothing closed yet
          </div>
        ) : view === 'open' ? (
          <div style={{ borderTop: `1px solid ${t.hairline}` }}>
            {filtered.map((item, idx) => (
              <InboxQueueRow
                key={item.id}
                item={item}
                first={idx === 0}
                onOpen={() => openRow(item)}
                onResolved={onResolved}
                isFullAdmin={role === 'full'}
                catalogueTotal={catalogueTotal}
              />
            ))}
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${t.hairline}` }}>
            {filtered.map((item, idx) => (
              <InboxQueueRow
                key={item.id}
                item={item}
                first={idx === 0}
                done
                onOpen={() => openRow(item)}
                onResolved={onResolved}
                isFullAdmin={role === 'full'}
                catalogueTotal={catalogueTotal}
              />
            ))}
          </div>
        )}
      </section>

      {view === 'open' && <FlowPanel flow={flow14.data} loading={flow14.isLoading} />}

      {/* 2.6 TOOLS */}
      {canUsers && workbenchCount > 0 && view === 'open' && (
        <section style={{ ...LIST_PANEL, padding: '14px 0 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ink, padding: '0 16px 10px' }}>Tools</div>
          <ToolRow
            to="/admin-v2/inbox/matching"
            title="Course matching workbench"
            sub={`${workbenchCount} scored course${workbenchCount === 1 ? '' : 's'} unmatched`}
          />
          <ToolRow to="/admin-v2/inbox/venues" title="Tour venue mapping" sub="Link tournament venues to courses" />
        </section>
      )}

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } } .inbox-chips::-webkit-scrollbar { display: none; }`}</style>

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
  // The WHS-published country for the name being aliased. Looked up by name because
  // this path types a WHS name rather than picking a whs_courses row.
  const [whsCountry, setWhsCountry] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!row) { setWhs(''); setErr(null); return; }
    setWhs(row.whs_course_name ?? '');
  }, [row]);

  useEffect(() => {
    const name = whs.trim();
    if (name.length < 2) { setWhsCountry(null); return; }
    let cancel = false;
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('whs_courses')
        .select('country_name')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      if (!cancel) setWhsCountry((data as any)?.country_name ?? null);
    }, 250);
    return () => { cancel = true; clearTimeout(handle); };
  }, [whs]);

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
    await refreshAdminQueues(qc);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <WhsCountryChip country={whsCountry} />
          <span style={{ fontSize: 12, color: t.inkMuted }}>
            catalogue: {row.course_sub_country ?? 'no recorded country'}
          </span>
        </div>
        <CountryMismatchWarning whsCountry={whsCountry} subCountry={row.course_sub_country} />
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
    setQuery(row.echo_suggestion ?? (row.whs_course_name ?? '').split('-')[0].trim());
  }, [whsId]);

  const { hits: rawHits, searching, error: searchError } = useCourseSearch(query, { enabled: !!row });
  const hits = rawHits as CourseHit[];
  useEffect(() => { if (searchError) setErr(searchError); }, [searchError]);

  if (!row) return null;

  const refresh = () => {
    void refreshAdminQueues(qc, [UNMATCHED_COURSES_KEY as unknown as unknown[]]);
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
        {/* The WHS country, beside the WHS name, before any candidate is picked. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <WhsCountryChip country={row.whs_country_name} />
          {chosen && (
            <span style={{ fontSize: 12, color: t.inkMuted }}>
              selected: {chosen.sub_country ?? 'no recorded country'}
            </span>
          )}
        </div>
        {chosen && (
          <CountryMismatchWarning whsCountry={row.whs_country_name} subCountry={chosen.sub_country} />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11, color: t.inkMuted }}>
                    {courseMatchLabel(h) || '-'}
                    <CandidateCountryFlag whsCountry={row.whs_country_name} subCountry={h.sub_country} />
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

/**
 * BRIEF_HOME_CLUB_PICKER §4 — home-club requests are triaged here, marked as
 * such, and resolving one offers to connect the member (and everyone else who
 * asked for the same club) in a single action.
 */
function CourseRequestInboxSheet({ row, onClose }: { row: CourseRequestRow | null; onClose: () => void }) {
  const isHomeClub = !!row?.homeClubForUserId;
  const isClubCourse = !!row?.forClubId;
  const { data: allRequests, resolveHomeClubRequest, rejectHomeClubRequest } = useCourseRequests();
  const [clubQuery, setClubQuery] = useState('');
  const [pickedClub, setPickedClub] = useState<{ id: string; name: string } | null>(null);
  const { data: clubHits, loading: clubsLoading } = useHomeClubSearch(clubQuery);

  useEffect(() => {
    setClubQuery(row?.courseName ?? '');
    setPickedClub(null);
  }, [row?.id, row?.courseName]);

  if (!row) return null;

  const who = row.username ? `@${row.username}` : (row.displayName ?? 'this member');

  // §4.3 — several members may have asked for the same club. Resolving once
  // connects all of them, so say how many are waiting before the admin acts.
  const alsoWaiting = isHomeClub
    ? (allRequests ?? []).filter(r =>
        r.id !== row.id &&
        !!r.homeClubForUserId &&
        r.status === 'pending' &&
        r.courseName.trim().toLowerCase() === row.courseName.trim().toLowerCase(),
      )
    : [];

  const busy = resolveHomeClubRequest.isPending || rejectHomeClubRequest.isPending;

  return (
    <AdminSheet
      open={row !== null}
      onClose={onClose}
      title={row.courseName}
      subtitle={isClubCourse ? (row.forCourseId ? 'Club course request · attach' : 'Club course request · new course') : isHomeClub ? `Home club request - ${who}` : 'Course request'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: t.ink }}>
        {isClubCourse && (
          <>
            <div><b>Club:</b> {row.clubName ?? row.forClubId}</div>
            <div><b>Business:</b> {row.businessName ?? row.forBusinessId}</div>
            {row.forCourseId && (
              <div><b>Picked course:</b> {row.pickedCourseName ?? row.courseName} — already in the catalogue</div>
            )}
          </>
        )}
        {isHomeClub && (
          <div style={{
            background: 'rgba(247,147,30,0.10)', border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: '8px 10px', color: t.ink, lineHeight: 1.45,
          }}>
            <b>{who}</b> is waiting on this club.
            {alsoWaiting.length > 0 && (
              <> {alsoWaiting.length} other member{alsoWaiting.length === 1 ? '' : 's'} asked for the same club — resolving connects all {alsoWaiting.length + 1}.</>
            )}
          </div>
        )}
        {row.location && <div><b>Location:</b> {row.location}</div>}
        {row.country && <div><b>Country:</b> {row.country}</div>}
        {row.note && <div style={{ color: t.inkMuted, lineHeight: 1.5 }}>{row.note}</div>}

        {isHomeClub && row.status === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ color: t.inkMuted, fontSize: 12 }}>
              Match to a club in the catalogue, then connect the member.
            </div>
            <input
              value={clubQuery}
              onChange={(e) => { setClubQuery(e.target.value); setPickedClub(null); }}
              placeholder="Search golf_clubs"
              style={{
                height: 36, padding: '0 10px', borderRadius: t.radius.md,
                border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontSize: 13,
              }}
            />
            {pickedClub ? (
              <div style={{ fontSize: 13 }}>
                Selected: <b>{pickedClub.name}</b>{' '}
                <button type="button" onClick={() => setPickedClub(null)} style={{ background: 'transparent', border: `1px solid ${t.line}`, borderRadius: t.radius.md, color: t.inkMuted, fontSize: 12, padding: '2px 8px', marginLeft: 6, cursor: 'pointer' }}>
                  Change
                </button>
              </div>
            ) : clubsLoading ? (
              <div style={{ color: t.inkMuted, fontSize: 12 }}>Searching…</div>
            ) : clubHits.length === 0 && clubQuery.trim().length >= 2 ? (
              <div style={{ color: t.inkMuted, fontSize: 12 }}>
                No catalogue match — the club still needs creating before this can be connected.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 180, overflowY: 'auto' }}>
                {clubHits.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPickedClub({ id: c.id, name: c.name })}
                    style={{
                      textAlign: 'left', background: 'transparent', border: 'none',
                      borderBottom: `1px solid ${t.line}`, padding: '7px 2px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: t.inkMuted }}>
                      {[c.sub_country, c.region].filter(Boolean).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!pickedClub || busy}
                onClick={async () => {
                  if (!pickedClub) return;
                  await resolveHomeClubRequest.mutateAsync({ id: row.id, clubId: pickedClub.id });
                  onClose();
                }}
                style={{
                  height: 34, padding: '0 12px', borderRadius: t.radius.md, border: 'none',
                  background: t.brand, color: '#0F172A', fontSize: 12.5, fontWeight: 700,
                  cursor: !pickedClub || busy ? 'default' : 'pointer',
                  opacity: !pickedClub || busy ? 0.55 : 1,
                }}
              >
                {alsoWaiting.length > 0
                  ? `Resolve and set as home club for ${alsoWaiting.length + 1} members`
                  : `Resolve and set as home club for ${who}`}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await rejectHomeClubRequest.mutateAsync({ id: row.id });
                  onClose();
                }}
                style={{
                  height: 34, padding: '0 12px', borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`, background: 'transparent',
                  color: t.inkMuted, fontSize: 12.5, fontWeight: 600,
                  cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.55 : 1,
                }}
              >
                Reject and clear pending
              </button>
            </div>
          </div>
        )}

        {isClubCourse && row.status === 'pending' && row.forClubId && row.forCourseId && (
          <AttachPickedCourse requestId={row.id} courseId={row.forCourseId} clubName={row.clubName ?? 'club'} onDone={onClose} />
        )}
        {isClubCourse && row.status === 'pending' && row.forClubId && !row.forCourseId && (
          <ClubCoursePicker requestId={row.id} clubId={row.forClubId} initialQuery={row.courseName} requestLocation={row.location ?? undefined} onDone={onClose} />
        )}

        {!isHomeClub && !isClubCourse && row.status === 'pending' && (
          <PlainRequestResolver row={row} onDone={onClose} />
        )}
      </div>
    </AdminSheet>
  );
}

/**
 * BRIEF_INBOX_WORK_THE_QUEUE 1.2 - a plain course request resolves in the
 * Inbox: 'added' when a course is created for it, 'duplicate' when the admin
 * uses an existing catalogue course instead, 'rejected' on Dismiss.
 */
function PlainRequestResolver({ row, onDone }: { row: CourseRequestRow; onDone: () => void }) {
  const { resolveCourseRequest } = useCourseRequests();
  const [createOpen, setCreateOpen] = useState(false);
  const busy = resolveCourseRequest.isPending;
  const resolve = async (status: 'added' | 'rejected' | 'duplicate') => {
    await resolveCourseRequest.mutateAsync({ id: row.id, status });
    onDone();
  };
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <button type="button" disabled={busy} onClick={() => setCreateOpen(true)} style={{ ...btnGhost(), flex: 1 }}>
        Create course
      </button>
      <button type="button" disabled={busy} onClick={() => { void resolve('rejected').catch(() => {}); }} style={{ ...btnGhost(), flex: 1, color: t.inkMuted }}>
        Dismiss
      </button>
      <AddCourseSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefillName={row.courseName}
        prefillSubCountry={row.location ?? undefined}
        uploadPhoto={uploadCoursePhoto}
        onOpenExisting={() => {
          setCreateOpen(false);
          void resolve('duplicate').catch(() => {});
        }}
        onCreated={async () => {
          try {
            await resolve('added');
            return true;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}

/** BRIEF_CLUB_COURSE_PICKER §8 — the club already chose; one button attaches it. */
function AttachPickedCourse({
  requestId, courseId, clubName, onDone,
}: { requestId: string; courseId: string; clubName: string; onDone: () => void }) {
  const { resolveClubCourseRequest } = useCourseRequests();
  const busy = resolveClubCourseRequest.isPending;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        await resolveClubCourseRequest.mutateAsync({ id: requestId, courseId });
        onDone();
      }}
      style={{ ...btnPrimary(busy), alignSelf: 'flex-start', marginTop: 4 }}
    >
      Attach to {clubName}
    </button>
  );
}

/**
 * BRIEF_CLUB_REQUEST_ANOTHER_COURSE §5 — the RPC takes a course id, so the
 * admin picks an existing golf_courses row. Only unattached rows are
 * selectable; the RPC also refuses a course owned by another club.
 */
function ClubCoursePicker({
  requestId, clubId, initialQuery, requestLocation, onDone,
}: { requestId: string; clubId: string; initialQuery: string; requestLocation?: string; onDone: () => void }) {
  const { resolveClubCourseRequest } = useCourseRequests();
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState(initialQuery);
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);
  const { hits, searching: loading } = useCourseSearch(q, { limit: 10, columns: 'id, name, club_id', debounceMs: 250 });

  const busy = resolveClubCourseRequest.isPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      <div style={{ color: t.inkMuted, fontSize: 12 }}>Pick the catalogue course to attach to this club.</div>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setPicked(null); }}
        placeholder="Search golf_courses"
        style={{
          height: 36, padding: '0 10px', borderRadius: t.radius.md,
          border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontSize: 13,
        }}
      />
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        disabled={busy}
        style={{ ...btnGhost(), alignSelf: 'flex-start', fontSize: 12.5 }}
      >
        Create this course ›
      </button>
      <AddCourseSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefillName={initialQuery}
        prefillSubCountry={requestLocation}
        uploadPhoto={uploadCoursePhoto}
        onOpenExisting={() => setCreateOpen(false)}
        onCreated={async (created) => {
          try {
            await resolveClubCourseRequest.mutateAsync({ id: requestId, courseId: created.id });
            onDone();
            return true;
          } catch {
            // Course exists now but is not attached: select it so the admin
            // can retry the attach alone. The mutation already toasts the error.
            setPicked({ id: created.id, name: created.name });
            return false;
          }
        }}
      />
      {picked ? (
        <div style={{ fontSize: 13 }}>
          Selected: <b>{picked.name}</b>{' '}
          <button type="button" onClick={() => setPicked(null)} style={{ background: 'transparent', border: `1px solid ${t.line}`, borderRadius: t.radius.md, color: t.inkMuted, fontSize: 12, padding: '2px 8px', marginLeft: 6, cursor: 'pointer' }}>
            Change
          </button>
        </div>
      ) : loading ? (
        <div style={{ color: t.inkMuted, fontSize: 12 }}>Searching…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {hits.map((c) => {
            const reason = c.club_id === clubId
              ? 'Already on this club'
              : c.club_id
              ? 'Already belongs to another club'
              : null;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!!reason}
                onClick={() => setPicked({ id: c.id, name: c.name })}
                style={{
                  textAlign: 'left', background: 'transparent', border: 'none',
                  borderBottom: `1px solid ${t.line}`, padding: '7px 2px',
                  cursor: reason ? 'default' : 'pointer', opacity: reason ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{c.name}</div>
                {reason && <div style={{ fontSize: 11.5, color: t.inkMuted }}>{reason}</div>}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        disabled={!picked || busy}
        onClick={async () => {
          if (!picked) return;
          await resolveClubCourseRequest.mutateAsync({ id: requestId, courseId: picked.id });
          onDone();
        }}
        style={{ ...btnPrimary(busy), alignSelf: 'flex-start', opacity: !picked || busy ? 0.55 : 1 }}
      >
        Attach to club
      </button>
    </div>
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
      <Route path="venues" element={<VenueMappingPage />} />
    </Routes>
  );
}


