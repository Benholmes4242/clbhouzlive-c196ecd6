import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, Gavel, LifeBuoy, BadgeCheck, ShieldCheck, Link2, Map, ChevronRight,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { adminTheme as t } from '../theme';
import { useInboxFeed, type InboxItem, type InboxType } from '../hooks/useInboxFeed';
import EmptyState from '../components/EmptyState';
import AdminAccessDenied from '../components/AdminAccessDenied';
import ModerationDetailDrawer from '../components/ModerationDetailDrawer';
import AppealDetailDrawer from '../components/AppealDetailDrawer';
import SupportTicketDrawer from '../components/SupportTicketDrawer';
import ApprovalDetailDrawer from '../components/ApprovalDetailDrawer';
import AdminSheet from '../components/AdminSheet';
import CourseMatchingPage from './CourseMatchingPage';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { supabase } from '@/integrations/supabase/client';
import { useVerifications, type VerificationRow } from '../hooks/useVerifications';
import type { ModerationQueueRow } from '../hooks/useModerationQueue';
import type { AppealRow } from '../hooks/useAppeals';
import type { AdminRequestRow } from '../hooks/useAdminActionRequests';
import type { SupportTicketRow } from '../hooks/useSupportTickets';
import type { MatchRequestRow } from '../hooks/useMatchRequests';
import type { CourseRequestRow } from '../hooks/useCourseRequests';

// ---------- type meta ----------

const TYPE_LABEL: Record<InboxType, string> = {
  report: 'Reports',
  appeal: 'Appeals',
  support: 'Support',
  verification: 'Verifications',
  approval: 'Approvals',
  match: 'Matches',
  courseRequest: 'Course requests',
};

const TYPE_META: Record<InboxType, { icon: React.ReactNode; bg: string; fg: string }> = {
  report:        { icon: <ShieldAlert size={16} />, bg: '#FEE2E2', fg: '#B91C1C' },
  appeal:        { icon: <Gavel size={16} />,       bg: '#EDE9FE', fg: '#6D28D9' },
  support:       { icon: <LifeBuoy size={16} />,    bg: '#E0F2FE', fg: '#0369A1' },
  verification:  { icon: <BadgeCheck size={16} />,  bg: '#FEF3C7', fg: '#B45309' },
  approval:      { icon: <ShieldCheck size={16} />, bg: '#DCFCE7', fg: '#15803D' },
  match:         { icon: <Link2 size={16} />,       bg: '#F1F5F9', fg: '#0F172A' },
  courseRequest: { icon: <Map size={16} />,         bg: '#F1F5F9', fg: '#0F172A' },
};

function relTime(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '-'; }
}

function ageColour(iso: string): string {
  const diffH = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (diffH >= 24) return t.dangerText;
  if (diffH >= 8) return t.warnText;
  return t.inkFaint;
}

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
    if (canUsers) out.push('verification', 'match', 'courseRequest');
    if (canApprove) out.push('approval');
    return out;
  }, [canMod, canUsers, canApprove]);

  const openItems = feed.items;
  const doneItems = feed.doneItems;
  const source = view === 'done' ? doneItems : openItems;
  const filtered = typeFilter === 'all' ? source : source.filter(i => i.type === typeFilter);

  const openCount = openItems.length;
  const oldest = feed.oldestCreatedAt;

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
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: t.brandText, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Admin
        </div>
        <div style={{ color: t.ink, fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>Inbox</div>
        {openCount > 0 && (
          <div
            style={{
              color: t.inkMuted, fontSize: 13, marginTop: 4,
              fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
            }}
          >
            {openCount} open{oldest ? ` - longest ${relTime(oldest)}` : ''}
          </div>
        )}
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

      {/* Filter chips */}
      <div
        style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          scrollbarWidth: 'none', padding: '2px 0',
        }}
        className="admin-inbox-chips"
      >
        <Chip label="All" active={typeFilter === 'all'} onClick={() => setType('all')} />
        {visibleTypes.map(tp => (
          <Chip
            key={tp}
            label={TYPE_LABEL[tp]}
            count={view === 'open' ? feed.counts[tp] : undefined}
            active={typeFilter === tp}
            onClick={() => setType(tp)}
          />
        ))}
        <style>{`.admin-inbox-chips::-webkit-scrollbar{display:none}`}</style>
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
            fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
            color: t.inkFaint, padding: '4px 4px 8px',
          }}
        >
          {view === 'done' ? 'Recently closed' : 'Oldest wait first'}
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
                onClick={() => openRow(item)}
              />
            ))}
          </div>
        )}

        {/* Workbench pinned row */}
        {canUsers && workbenchCount > 0 && (typeFilter === 'all' || typeFilter === 'match') && view === 'open' && (
          <Link
            to="/admin-v2/inbox/matching"
            style={{
              marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 4px',
              borderTop: `1px solid ${t.line}`,
              textDecoration: 'none', color: t.ink,
            }}
          >
            <TypeChip type="match" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: t.ink }}>Course matching workbench</div>
              <div style={{ fontSize: 11.5, color: t.inkMuted }}>
                {workbenchCount} scored course{workbenchCount === 1 ? '' : 's'} unmatched
              </div>
            </div>
            <ChevronRight size={16} color={t.inkFaint} />
          </Link>
        )}
      </section>

      <style>{`@keyframes admin-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>

      {/* Drawers */}
      <ModerationDetailDrawer open={modRow !== null} onClose={() => setModRow(null)} row={modRow} />
      <AppealDetailDrawer open={appealRow !== null} onClose={() => setAppealRow(null)} row={appealRow} />
      <ApprovalDetailDrawer open={approvalRow !== null} onClose={() => setApprovalRow(null)} row={approvalRow} />
      <SupportTicketDrawer ticket={supportRow} onClose={closeSupport} />
      <VerificationInboxSheet row={verifRow} onClose={() => setVerifRow(null)} />
      <MatchInboxSheet row={matchRow} onClose={() => setMatchRow(null)} />
      <CourseRequestInboxSheet row={courseReqRow} onClose={() => setCourseReqRow(null)} />
    </div>
  );
}

// ---------- pieces ----------

function Chip({
  label, count, active, onClick,
}: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '8px 14px', borderRadius: 999,
        border: `1px solid ${active ? 'transparent' : t.line}`,
        background: active ? t.ink : t.surface,
        color: active ? t.surface : t.inkMuted,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}
    >
      {label}
      {typeof count === 'number' && count > 0 && (
        <span style={{
          background: active ? t.brand : t.line,
          color: active ? t.surface : t.inkMuted,
          fontSize: 11, padding: '0 6px', borderRadius: 999, minWidth: 18, textAlign: 'center',
          fontFeatureSettings: '"tnum" 1',
        }}>{count}</span>
      )}
    </button>
  );
}

function TypeChip({ type }: { type: InboxType }) {
  const meta = TYPE_META[type];
  return (
    <span
      aria-hidden
      style={{
        width: 34, height: 34, borderRadius: 12,
        background: meta.bg, color: meta.fg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {meta.icon}
    </span>
  );
}

function StreamRow({ item, first, done, onClick }: {
  item: InboxItem; first: boolean; done: boolean; onClick: () => void;
}) {
  const meta = `${TYPE_LABEL[item.type]} - ${item.meta.replace(/^[^-]+-\s*/, '')}`;
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
      <TypeChip type={item.type} />
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
        </div>
        <div
          style={{
            color: t.inkMuted, fontSize: 11.5, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {done && item.closedOutcome ? `${TYPE_LABEL[item.type]} - ${item.closedOutcome}` : meta}
        </div>
      </div>
      <span
        style={{
          fontSize: 11, fontWeight: 600,
          color: done ? t.inkFaint : ageColour(item.createdAt),
          fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {relTime(item.createdAt)}
      </span>
      <ChevronRight size={14} color={t.inkFaint} />
    </button>
  );
}

// ---------- verification sheet ----------

function VerificationInboxSheet({ row, onClose }: { row: VerificationRow | null; onClose: () => void }) {
  const { reviewMutation } = useVerifications();
  const [note, setNote] = useState('');
  useEffect(() => { if (!row) setNote(''); }, [row]);

  if (!row) return null;

  const submit = (decision: 'approved' | 'rejected' | 'needs_more_info') => {
    if (decision !== 'approved' && note.trim().length < 3) return;
    if (row.type === 'golfer' && decision === 'needs_more_info') return;
    reviewMutation.mutate(
      { id: row.id, type: row.type, decision: decision as any, adminNote: note },
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
              disabled={reviewMutation.isPending || note.trim().length < 3}
              style={btnGhost()}
            >
              Needs info
            </button>
          )}
          <button
            onClick={() => submit('rejected')}
            disabled={reviewMutation.isPending || note.trim().length < 3}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {row.note && (
          <div style={{ padding: 12, background: t.canvas, borderRadius: t.radius.md, border: `1px solid ${t.line}`, fontSize: 13, color: t.ink, lineHeight: 1.5 }}>
            {row.note}
          </div>
        )}
        {row.evidenceUrl && (
          <a href={row.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ color: t.brandText, fontSize: 13, fontWeight: 600 }}>
            Open evidence
          </a>
        )}
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: t.inkFaint }}>
          Admin note (required to reject or ask for info)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Note for the requester"
          style={{
            width: '100%', padding: 10, borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
            fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          }}
        />
      </div>
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
    border: 'none', background: t.brand, color: '#fff',
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
