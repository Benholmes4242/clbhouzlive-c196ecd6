import React, { useState } from 'react';
import { MoreHorizontal, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { adminTheme as t } from '../theme';
import { RAISED, ECHO_GROUND, ECHO_EDGE } from '../lib/panels';
import { QUEUE_TAG, ageLabel, isLongWait } from '../lib/inboxQueue';
import { refreshAdminQueues } from '../lib/adminQueueRefresh';
import type { InboxItem } from '../hooks/useInboxFeed';
import {
  ignoreUnmatchedCourse, linkUnmatchedCourse, markUnmatchedNeedsCatalogue,
  UNMATCHED_COURSES_KEY, type UnmatchedCourseRow,
} from '../hooks/useUnmatchedCourses';
import type { CourseRequestRow } from '../hooks/useCourseRequests';
import { useCourseRequests } from '../hooks/useCourseRequests';
import type { SupportTicketRow } from '../hooks/useSupportTickets';
import type { VerificationRow } from '../hooks/useVerifications';
import { useVerifications } from '../hooks/useVerifications';
import type { ModerationQueueRow } from '../hooks/useModerationQueue';
import type { HolePhotoQueueRow } from '../hooks/useHolePhotoQueue';
import { approveHolePhoto } from '../hooks/useHolePhotoQueue';
import type { AdminRequestRow } from '../hooks/useAdminActionRequests';
import { useAdminActionRequestActions } from '../hooks/useAdminActionRequests';
import type { MatchRequestRow } from '../hooks/useMatchRequests';
import { useModerationActions } from '../hooks/useModerationActions';
import { useSupportTicketActions } from '../hooks/useSupportTicketActions';
import CourseSearchField from './CourseSearchField';
import AddCourseSheet from './AddCourseSheet';
import ConfirmDialog from './ConfirmDialog';
import { uploadCoursePhoto } from '../hooks/useCourses';

const sb = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
      ilike: (c: string, v: string) => { limit: (n: number) => Promise<{ data: { id: string }[] | null }> };
    };
  };
};

const TAG: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint };
const CTRL_H = 36;

export const btnBrand = (disabled = false): React.CSSProperties => ({
  height: CTRL_H, padding: '0 14px', borderRadius: 999, border: 'none',
  background: t.brand, color: t.canvas, fontSize: 12, fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, flexShrink: 0,
});
export const btnOutline = (disabled = false, muted = false): React.CSSProperties => ({
  height: CTRL_H, padding: '0 14px', borderRadius: 999, border: `1px solid ${t.line}`,
  background: 'transparent', color: muted ? t.inkMuted : t.ink, fontSize: 12, fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, flexShrink: 0,
});
const iconBtn: React.CSSProperties = {
  width: CTRL_H, height: CTRL_H, borderRadius: 999, border: `1px solid ${t.line}`,
  background: 'transparent', color: t.ink, display: 'inline-flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0,
};

const errMsg = (e: unknown, fallback: string) => (e as { message?: string })?.message || fallback;

export interface InboxQueueRowProps {
  item: InboxItem;
  first: boolean;
  /** Opens the queue's existing sheet / drawer for the full detail. */
  onOpen: () => void;
  /** Called after a successful inline action: the row leaves the list. */
  onResolved: (id: string) => void;
  isFullAdmin: boolean;
  catalogueTotal: number | null;
  /** Done view: the outcome replaces the action row; the age is time since closing. */
  done?: boolean;
}

/** The row's fact line (2.4). */
function SubLine({ item, isFullAdmin }: { item: InboxItem; isFullAdmin: boolean }) {
  const muted: React.CSSProperties = { fontSize: 11.5, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 };
  switch (item.type) {
    case 'unmatchedCourse': {
      const r = item.payload as UnmatchedCourseRow;
      return (
        <div style={muted}>
          <span style={{ color: t.ink, fontWeight: 700 }}>{r.round_count}</span> round{r.round_count === 1 ? '' : 's'}
          {' \u00b7 '}{r.member_count} member{r.member_count === 1 ? '' : 's'}
          {r.last_tier_tried === 'echo_no_match' ? ' \u00b7 echo found no match' : ''}
          {r.status === 'needs_catalogue' ? ' \u00b7 not in the catalogue' : ''}
        </div>
      );
    }
    case 'verification': {
      const r = item.payload as VerificationRow;
      if (r.type === 'course_claim' && !isFullAdmin) return <div style={muted}>needs a full admin</div>;
      const who = r.type === 'course_claim' ? (r.claimBusinessName ?? 'A business') : (r.displayName ?? r.username ?? 'A member');
      const what = r.type === 'course_claim' ? ' wants its page' : ' asks to be verified';
      return <div style={muted}>{who}{what}{r.claimProofNote ? ' \u00b7 proof note attached' : ''}</div>;
    }
    case 'support': {
      const r = item.payload as SupportTicketRow;
      const who = r.profile?.display_name ?? r.profile?.username ?? 'Member';
      return <div style={muted}>{who} \u00b7 {r.last_sender === 'user' ? 'last message from the member' : 'waiting on the member'}</div>;
    }
    case 'courseRequest': {
      const r = item.payload as CourseRequestRow;
      const who = r.displayName ?? (r.username ? `@${r.username}` : 'Member');
      return <div style={muted}>{who} \u00b7 {r.note?.trim() || 'no note'}</div>;
    }
    default:
      return <div style={muted}>{item.meta.replace(/^[^-]+-\s*/, '')}</div>;
  }
}

export default function InboxQueueRow({ item, first, onOpen, onResolved, isFullAdmin, catalogueTotal, done = false }: InboxQueueRowProps) {
  const long = !done && isLongWait(item.createdAt);
  return (
    <div style={{ padding: '12px 16px', borderTop: first ? 'none' : `1px solid ${t.hairline}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'start' }}>
        <button
          type="button"
          onClick={onOpen}
          style={{ textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', minWidth: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {item.title}
            </span>
            <span style={{ ...TAG, flexShrink: 0 }}>{QUEUE_TAG[item.type]}</span>
          </div>
          <SubLine item={item} isFullAdmin={isFullAdmin} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: long ? t.dangerText : t.inkMuted, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
            {ageLabel(item.createdAt)}
          </span>
          <span style={TAG}>{done ? 'Ago' : 'Waiting'}</span>
        </div>
      </div>
      {done ? (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: t.inkMuted }}>{item.closedOutcome ?? 'Closed'}</div>
      ) : (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <ActionRow item={item} onOpen={onOpen} onResolved={onResolved} isFullAdmin={isFullAdmin} catalogueTotal={catalogueTotal} />
        </div>
      )}
    </div>
  );
}

function ActionRow(props: Omit<InboxQueueRowProps, 'first'>) {
  const { item } = props;
  switch (item.type) {
    case 'unmatchedCourse': return <UnmatchedActions {...props} row={item.payload as UnmatchedCourseRow} />;
    case 'verification': return <ClaimActions {...props} row={item.payload as VerificationRow} />;
    case 'support': return <SupportActions {...props} row={item.payload as SupportTicketRow} />;
    case 'courseRequest': return <RequestActions {...props} row={item.payload as CourseRequestRow} />;
    case 'match': return <MatchActions {...props} row={item.payload as MatchRequestRow} />;
    case 'report': return <ReportActions {...props} row={item.payload as ModerationQueueRow} />;
    case 'holePhoto': return <PhotoActions {...props} row={item.payload as HolePhotoQueueRow} />;
    case 'approval': return <ApprovalActions {...props} row={item.payload as AdminRequestRow} />;
    default: return <button type="button" onClick={props.onOpen} style={btnOutline()}>OPEN</button>;
  }
}

type RowActionProps<R> = Omit<InboxQueueRowProps, 'first'> & { row: R };

// ---------- unmatched ----------

function UnmatchedActions({ item, row, onResolved, catalogueTotal }: RowActionProps<UnmatchedCourseRow>) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [searchMode, setSearchMode] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmIgnore, setConfirmIgnore] = useState(false);

  const showEcho = !!row.echo_suggestion && row.last_tier_tried === 'echo_review' && searchMode === null;

  const done = async (fn: () => Promise<void>, fail: string) => {
    setBusy(true);
    try {
      await fn();
      onResolved(item.id);
      void refreshAdminQueues(qc, [UNMATCHED_COURSES_KEY as unknown as unknown[]]);
    } catch (e) {
      toast.error(errMsg(e, fail));
    } finally {
      setBusy(false);
    }
  };

  const link = (courseId: string) => done(() => linkUnmatchedCourse(row.whs_course_id, courseId), 'Link failed');

  // MATCH on an Echo suggestion: the map's suggested id first, then an exact
  // case-insensitive name lookup. Anything but exactly one hit opens the
  // search prefilled - never link blind.
  const matchEcho = async () => {
    const name = row.echo_suggestion ?? '';
    setBusy(true);
    try {
      const { data: map } = await sb.from('whs_to_golf_course_map')
        .select('echo_suggested_golf_course_id').eq('whs_course_id', row.whs_course_id).maybeSingle();
      let id = (map?.echo_suggested_golf_course_id as string | null | undefined) ?? null;
      if (!id) {
        const escaped = name.replace(/[\\%_]/g, (c) => `\\${c}`);
        const { data: hits } = await sb.from('golf_courses').select('id').ilike('name', escaped).limit(2);
        if (hits && hits.length === 1) id = hits[0].id;
      }
      setBusy(false);
      if (!id) { setSearchMode(name); return; }
      await link(id);
    } catch (e) {
      setBusy(false);
      toast.error(errMsg(e, 'Match failed'));
    }
  };

  const placeholder = `Search ${catalogueTotal != null ? catalogueTotal.toLocaleString() : ''} courses`.replace('  ', ' ');

  return (
    <>
      {showEcho ? (
        <>
          <div
            style={{
              flex: 1, minWidth: 0, height: CTRL_H, borderRadius: 10, background: ECHO_GROUND,
              border: `1px solid ${ECHO_EDGE}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: t.brandText, flexShrink: 0 }}>ECHO</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.echo_suggestion}
            </span>
          </div>
          <button type="button" disabled={busy} onClick={() => void matchEcho()} style={btnBrand(busy)}>MATCH</button>
        </>
      ) : (
        <>
          <CourseSearchField
            placeholder={placeholder}
            initialQuery={searchMode ?? ''}
            autoFocus={searchMode !== null}
            disabled={busy}
            onPick={(hit) => void link(hit.id)}
          />
          <button type="button" disabled={busy} onClick={() => setCreateOpen(true)} style={btnOutline(busy)}>CREATE</button>
        </>
      )}
      <div style={{ position: 'relative' }}>
        <button type="button" aria-label="More" onClick={() => setMenuOpen(v => !v)} style={iconBtn}>
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute', right: 0, top: 40, zIndex: 20, minWidth: 190,
              background: t.surface, border: `1px solid ${t.line}`, borderRadius: 10, overflow: 'hidden',
              boxShadow: t.shadowCard,
            }}
          >
            {row.status !== 'needs_catalogue' && (
              <button
                type="button" role="menuitem"
                onClick={() => { setMenuOpen(false); void done(() => markUnmatchedNeedsCatalogue(row.whs_course_id), 'Update failed'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: t.ink, fontSize: 13, cursor: 'pointer' }}
              >
                Not in the catalogue
              </button>
            )}
            <button
              type="button" role="menuitem"
              onClick={() => { setMenuOpen(false); setConfirmIgnore(true); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', borderTop: `1px solid ${t.hairline}`, color: t.dangerText, fontSize: 13, cursor: 'pointer' }}
            >
              Ignore
            </button>
          </div>
        )}
      </div>
      <AddCourseSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefillName={row.whs_course_name ?? undefined}
        uploadPhoto={uploadCoursePhoto}
        onOpenExisting={(id) => { setCreateOpen(false); void link(id); }}
        onCreated={async (created) => {
          try {
            await linkUnmatchedCourse(row.whs_course_id, created.id);
            onResolved(item.id);
            void refreshAdminQueues(qc, [UNMATCHED_COURSES_KEY as unknown as unknown[]]);
            return true;
          } catch (e) {
            toast.error(errMsg(e, 'Course created but the link failed'));
            return false;
          }
        }}
      />
      <ConfirmDialog
        open={confirmIgnore}
        onClose={() => setConfirmIgnore(false)}
        onConfirm={() => { setConfirmIgnore(false); void done(() => ignoreUnmatchedCourse(row.whs_course_id), 'Update failed'); }}
        title="Ignore this course?"
        description={`Ignoring means this WHS course is never linked. ${row.round_count} rounds from ${row.member_count} members stay hidden from every gam surface until someone links it.`}
        confirmLabel="Ignore anyway"
        tone="danger"
        busy={busy}
      />
    </>
  );
}

// ---------- claims / verifications ----------

function ClaimActions({ item, row, onOpen, onResolved, isFullAdmin }: RowActionProps<VerificationRow>) {
  const { reviewMutation } = useVerifications();
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');
  const locked = row.type === 'course_claim' && !isFullAdmin;
  const busy = reviewMutation.isPending;

  const decide = (decision: 'approved' | 'rejected') => {
    reviewMutation.mutate(
      { id: row.id, type: row.type, decision: decision as never, adminNote: note.trim(), reviewReason: null },
      { onSuccess: () => onResolved(item.id) },
    );
  };

  if (declining) {
    return (
      <>
        <input
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for declining"
          aria-label="Reason for declining"
          style={{ flex: 1, minWidth: 0, height: CTRL_H, borderRadius: 10, background: RAISED, border: `1px solid ${t.hairline}`, color: t.ink, fontSize: 13, padding: '0 10px', outline: 'none' }}
        />
        <button type="button" onClick={() => { setDeclining(false); setNote(''); }} style={btnOutline(false, true)}>CANCEL</button>
        <button type="button" disabled={busy || note.trim().length < 3} onClick={() => decide('rejected')} style={btnOutline(busy || note.trim().length < 3)}>DECLINE</button>
      </>
    );
  }

  return (
    <>
      <button type="button" disabled={locked || busy} onClick={() => decide('approved')} style={{ ...btnBrand(locked || busy), flex: 1 }}>APPROVE</button>
      <button type="button" disabled={locked || busy} onClick={() => setDeclining(true)} style={{ ...btnOutline(locked || busy), flex: 1 }}>DECLINE</button>
      <button type="button" aria-label="Open proof" onClick={onOpen} style={iconBtn}><ChevronRight size={16} /></button>
    </>
  );
}

// ---------- support ----------

function SupportActions({ item, row, onResolved }: RowActionProps<SupportTicketRow>) {
  const { user } = useSupabaseSession();
  const { sendReply, setStatus } = useSupportTicketActions();
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!user?.id || !body.trim()) return;
    setBusy(true);
    try {
      await sendReply(row, user.id, body);
      setBody('');
      setExpanded(false);
      toast.success('Reply sent');
      // A reply hands the ticket to the member; it stays open, so the row stays.
    } catch (e) {
      toast.error(errMsg(e, 'Failed to send reply'));
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    setBusy(true);
    try {
      await setStatus(row.id, 'resolved');
      onResolved(item.id);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to resolve'));
    } finally {
      setBusy(false);
    }
  };

  const field: React.CSSProperties = {
    flex: 1, minWidth: 0, borderRadius: 10, background: RAISED, border: `1px solid ${t.hairline}`,
    color: t.ink, fontSize: 13, padding: expanded ? '8px 10px' : '0 10px', outline: 'none', resize: 'none',
    height: expanded ? 72 : CTRL_H, fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: expanded ? 'flex-end' : 'center', width: '100%' }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setExpanded(true)}
        onBlur={() => { if (!body.trim()) setExpanded(false); }}
        placeholder={'Reply\u2026'}
        aria-label="Reply"
        rows={expanded ? 3 : 1}
        style={field}
      />
      {expanded && (
        <button type="button" disabled={busy || !body.trim()} onMouseDown={(e) => e.preventDefault()} onClick={() => void send()} style={btnBrand(busy || !body.trim())}>SEND</button>
      )}
      <button type="button" disabled={busy} onClick={() => void resolve()} style={btnOutline(busy)}>RESOLVE</button>
    </div>
  );
}

// ---------- course requests ----------

function RequestActions({ item, row, onOpen, onResolved }: RowActionProps<CourseRequestRow>) {
  const { resolveCourseRequest } = useCourseRequests();
  const [createOpen, setCreateOpen] = useState(false);
  const busy = resolveCourseRequest.isPending;
  const plain = !row.homeClubForUserId && !row.forClubId;

  // Home-club and club-course requests keep their picker flow in the sheet.
  if (!plain) return <button type="button" onClick={onOpen} style={{ ...btnOutline(), flex: 1 }}>OPEN</button>;

  const resolve = async (status: 'added' | 'rejected' | 'duplicate') => {
    await resolveCourseRequest.mutateAsync({ id: row.id, status });
    onResolved(item.id);
  };

  return (
    <>
      <button type="button" disabled={busy} onClick={() => setCreateOpen(true)} style={{ ...btnOutline(busy), flex: 1 }}>CREATE COURSE</button>
      <button type="button" disabled={busy} onClick={() => { void resolve('rejected').catch(() => {}); }} style={{ ...btnOutline(busy, true), flex: 1 }}>DISMISS</button>
      <AddCourseSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefillName={row.courseName}
        prefillSubCountry={row.location ?? undefined}
        uploadPhoto={uploadCoursePhoto}
        onOpenExisting={() => { setCreateOpen(false); void resolve('duplicate').catch(() => {}); }}
        onCreated={async () => {
          try { await resolve('added'); return true; } catch { return false; }
        }}
      />
    </>
  );
}

// ---------- match requests ----------

function MatchActions({ item, row, onOpen, onResolved }: RowActionProps<MatchRequestRow>) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const reject = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-resolve-match-request', {
      body: { request_id: row.id, action: 'reject' },
    });
    setBusy(false);
    const msg = (error as { message?: string } | null)?.message || (data as { error?: string } | null)?.error;
    if (msg) { toast.error(String(msg)); return; }
    onResolved(item.id);
    void refreshAdminQueues(qc);
  };
  return (
    <>
      <button type="button" disabled={busy} onClick={onOpen} style={{ ...btnBrand(busy), flex: 1 }}>MATCH</button>
      <button type="button" disabled={busy} onClick={() => void reject()} style={{ ...btnOutline(busy), flex: 1 }}>REJECT</button>
    </>
  );
}

// ---------- reports / appeals / photos / approvals ----------

function ReportActions({ item, row, onOpen, onResolved }: RowActionProps<ModerationQueueRow>) {
  const { dismiss } = useModerationActions();
  return (
    <>
      <button type="button" onClick={onOpen} style={{ ...btnOutline(), flex: 1 }}>OPEN</button>
      <button
        type="button"
        disabled={dismiss.isPending}
        onClick={() => dismiss.mutate(
          { kind: row.kind, ids: row.reports.map(r => r.raw.id) },
          { onSuccess: () => onResolved(item.id) },
        )}
        style={{ ...btnOutline(dismiss.isPending, true), flex: 1 }}
      >
        DISMISS
      </button>
    </>
  );
}

function PhotoActions({ item, row, onOpen, onResolved }: RowActionProps<HolePhotoQueueRow>) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const approve = async () => {
    setBusy(true);
    try {
      await approveHolePhoto(row);
      onResolved(item.id);
      void refreshAdminQueues(qc);
    } catch (e) {
      toast.error(errMsg(e, 'Approve failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" onClick={onOpen} style={btnOutline()}>OPEN</button>
      <button type="button" disabled={busy} onClick={() => void approve()} style={{ ...btnBrand(busy), flex: 1 }}>APPROVE</button>
      {/* A rejection carries a reason; the review sheet collects it. */}
      <button type="button" disabled={busy} onClick={onOpen} style={{ ...btnOutline(busy), flex: 1 }}>REJECT</button>
    </>
  );
}

function ApprovalActions({ item, row, onOpen, onResolved }: RowActionProps<AdminRequestRow>) {
  const { approve } = useAdminActionRequestActions();
  return (
    <>
      <button type="button" onClick={onOpen} style={btnOutline()}>OPEN</button>
      <button
        type="button"
        disabled={approve.isPending}
        onClick={() => approve.mutate({ requestId: row.id }, { onSuccess: () => onResolved(item.id) })}
        style={{ ...btnBrand(approve.isPending), flex: 1 }}
      >
        APPROVE
      </button>
      {/* A rejection carries a note; the drawer collects it. */}
      <button type="button" disabled={approve.isPending} onClick={onOpen} style={{ ...btnOutline(approve.isPending), flex: 1 }}>REJECT</button>
    </>
  );
}
