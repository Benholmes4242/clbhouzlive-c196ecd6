import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link2, ChevronDown, ChevronUp, Image as ImageIcon, MapPin, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseMatchLabel } from '../lib/geography';
import { adminTheme as t } from '../theme';
import EmptyState from '../components/EmptyState';
import StatusPill from '../components/StatusPill';
import AdminAccessDenied from '../components/AdminAccessDenied';
import AdminErrorState from '../components/AdminErrorState';
import AdminSheet from '../components/AdminSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ignoreUnmatchedCourse,
  markUnmatchedNeedsCatalogue,
  TRIAGE_VISIBLE_STATUSES,
  UNMATCHED_COURSES_KEY,
  type UnmatchedCourseStatus,
} from '../hooks/useUnmatchedCourses';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';

type MatchMethod =
  | 'echo_no_match'
  | 'echo_review'
  | 'create_new_course_suggested'
  | string;

interface QueueRow {
  whs_course_id: string;
  whs_name: string;
  match_method: MatchMethod;
  match_confidence: number | null;
  echo_agreement_count: number | null;
  echo_reasoning: string | null;
  echo_suggested_golf_course_id: string | null;
  matched_at: string | null;
  scored_rounds: number;
  suggested_course_name?: string | null;
  /** Triage decision from whs_unmatched_courses - null when no row exists. */
  triage_status: UnmatchedCourseStatus | null;
  /** Counts off the triage row, used by the ignore consequence copy. */
  triage_rounds: number | null;
  triage_members: number | null;
}

interface CourseHit {
  id: string;
  name: string;
  region: string | null;
  sub_country: string | null;
  country: string | null;
  thumbnail_image: string | null;
}

const QUERY_KEY = ['admin-course-matching-queue'] as const;

async function fetchQueue(): Promise<QueueRow[]> {
  // 1) Unmapped rows joined to whs_courses name
  const { data: mapRows, error: mapErr } = await supabase
    .from('whs_to_golf_course_map')
    .select(
      `whs_course_id, match_method, match_confidence, echo_agreement_count,
       echo_reasoning, echo_suggested_golf_course_id, matched_at,
       whs_courses:whs_course_id ( name )`
    )
    .is('golf_course_id', null)
    .limit(500);
  if (mapErr) throw mapErr;

  const rows = (mapRows ?? []) as any[];
  const whsIds = rows.map((r) => r.whs_course_id);

  // 2) Triage decisions. whs_unmatched_courses.status is the single source of
  // truth for "has a human decided about this course"; the map row is only the
  // mapping. A course ignored on the Inbox must vanish from here too.
  const triage = new Map<string, { status: UnmatchedCourseStatus; rounds: number; members: number }>();
  if (whsIds.length) {
    const { data: triageRows, error: triageErr } = await supabase
      .from('whs_unmatched_courses')
      .select('whs_course_id, status, round_count, member_count')
      .in('whs_course_id', whsIds);
    if (triageErr) throw triageErr;
    (triageRows ?? []).forEach((r: any) => {
      triage.set(r.whs_course_id, {
        status: r.status as UnmatchedCourseStatus,
        rounds: r.round_count ?? 0,
        members: r.member_count ?? 0,
      });
    });
  }

  // 3) Scored rounds per whs course
  const roundsMap = new Map<string, number>();
  if (whsIds.length) {
    const { data: scoreRows, error: scoreErr } = await supabase
      .from('whs_scores')
      .select('course_id')
      .in('course_id', whsIds)
      .limit(10000);
    if (scoreErr) throw scoreErr;
    (scoreRows ?? []).forEach((s: any) => {
      roundsMap.set(s.course_id, (roundsMap.get(s.course_id) ?? 0) + 1);
    });
  }

  // 4) Resolve suggested course names
  const suggestedIds = Array.from(
    new Set(rows.map((r) => r.echo_suggested_golf_course_id).filter(Boolean)),
  ) as string[];
  const suggestedNames = new Map<string, string>();
  if (suggestedIds.length) {
    const { data: gc } = await supabase
      .from('golf_courses')
      .select('id, name')
      .in('id', suggestedIds);
    (gc ?? []).forEach((c: any) => suggestedNames.set(c.id, c.name));
  }

  return rows
    // A decision recorded anywhere removes the card everywhere. Courses with
    // no triage row at all are untriaged and stay.
    .filter((r) => {
      const st = triage.get(r.whs_course_id)?.status;
      return !st || TRIAGE_VISIBLE_STATUSES.includes(st);
    })
    .map((r) => ({
      whs_course_id: r.whs_course_id,
      whs_name: r.whs_courses?.name ?? '(unknown)',
      match_method: r.match_method,
      match_confidence: r.match_confidence,
      echo_agreement_count: r.echo_agreement_count,
      echo_reasoning: r.echo_reasoning,
      echo_suggested_golf_course_id: r.echo_suggested_golf_course_id,
      matched_at: r.matched_at,
      scored_rounds: roundsMap.get(r.whs_course_id) ?? 0,
      suggested_course_name: r.echo_suggested_golf_course_id
        ? suggestedNames.get(r.echo_suggested_golf_course_id) ?? null
        : null,
      triage_status: triage.get(r.whs_course_id)?.status ?? null,
      triage_rounds: triage.get(r.whs_course_id)?.rounds ?? null,
      triage_members: triage.get(r.whs_course_id)?.members ?? null,
    }))
    .sort((a, b) => b.scored_rounds - a.scored_rounds);
}

function relTime(iso: string | null): string {
  if (!iso) return '—';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return '—'; }
}

function methodTone(m: MatchMethod): 'warn' | 'neutral' {
  if (m === 'echo_no_match' || m === 'echo_review') return 'warn';
  return 'neutral';
}

function methodLabel(m: MatchMethod): string {
  switch (m) {
    case 'echo_no_match': return 'no match';
    case 'echo_review': return 'review';
    case 'create_new_course_suggested': return 'suggest new';
    default: return m;
  }
}

/** Parse "openai: ... | gemini: ..." into per-model segments. */
function parseReasoning(raw: string | null): Array<{ model: string; text: string }> {
  if (!raw) return [];
  return raw
    .split('|')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const idx = seg.indexOf(':');
      if (idx === -1) return { model: 'model', text: seg };
      return { model: seg.slice(0, idx).trim(), text: seg.slice(idx + 1).trim() };
    });
}

/** Club stem = text before first '-' (e.g. "Woburn-Marquess Course" → "Woburn"). */
function clubStem(name: string): string {
  const s = name.split('-')[0]?.trim() ?? name;
  return s;
}

export default function CourseMatchingPage() {
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const qc = useQueryClient();

  const { data = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchQueue,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<QueueRow | null>(null);
  const [confirmIgnore, setConfirmIgnore] = useState<QueueRow | null>(null);
  const [triageBusy, setTriageBusy] = useState(false);
  const [triageErr, setTriageErr] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: QUERY_KEY });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeFromQueue = (whsId: string) => {
    qc.setQueryData<QueueRow[]>(QUERY_KEY as any, (curr) =>
      (curr ?? []).filter((r) => r.whs_course_id !== whsId),
    );
  };

  const afterTriage = (whsId: string) => {
    removeFromQueue(whsId);
    qc.invalidateQueries({ queryKey: UNMATCHED_COURSES_KEY });
    qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox'] });
    qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'triage-counts'] });
  };

  const doIgnore = async (row: QueueRow) => {
    setTriageBusy(true);
    setTriageErr(null);
    try {
      await ignoreUnmatchedCourse(row.whs_course_id);
      afterTriage(row.whs_course_id);
    } catch (e) {
      setTriageErr(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setTriageBusy(false);
      setConfirmIgnore(null);
    }
  };

  const doNeedsCatalogue = async (row: QueueRow) => {
    setTriageBusy(true);
    setTriageErr(null);
    try {
      await markUnmatchedNeedsCatalogue(row.whs_course_id);
      // Stays on the screen, re-chipped as blocked - refetch rather than drop.
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: UNMATCHED_COURSES_KEY });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'inbox'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'dashboard', 'triage-counts'] });
    } catch (e) {
      setTriageErr(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setTriageBusy(false);
    }
  };

  if (!caps.viewUsers) return <AdminAccessDenied />;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          AI matching queue
        </div>
        <div style={{ color: t.inkMuted, fontSize: 13, lineHeight: 1.5, maxWidth: 640 }}>
          WHS courses the model couldn't confidently match. Link each to a <strong style={{ color: t.ink }}>golf_courses</strong> row —
          sub-course layouts map to the parent club. Ordered by scored rounds.
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: t.inkMuted, fontSize: 13, padding: 24 }}>Loading queue...</div>
      ) : isError ? (
        <AdminErrorState
          title="Couldn't load matching queue"
          message={(error as any)?.message ?? 'The request failed. Try again.'}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={28} />}
          title="Queue clear"
          subtitle="Every scored course is matched."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((row) => (
            <QueueCard
              key={row.whs_course_id}
              row={row}
              expanded={expanded.has(row.whs_course_id)}
              onToggle={() => toggleExpand(row.whs_course_id)}
              onResolve={() => setActive(row)}
              onIgnore={() => setConfirmIgnore(row)}
              onNeedsCatalogue={() => void doNeedsCatalogue(row)}
              busy={triageBusy}
            />
          ))}
        </div>
      )}

      {triageErr && (
        <div style={{ padding: '8px 10px', borderRadius: t.radius.md, background: t.dangerSoft, color: t.dangerText, fontSize: 12 }}>
          {triageErr}
        </div>
      )}

      <ConfirmDialog
        open={confirmIgnore !== null}
        onClose={() => setConfirmIgnore(null)}
        onConfirm={() => { if (confirmIgnore) void doIgnore(confirmIgnore); }}
        title="Ignore this course?"
        description={confirmIgnore ? ignoreConsequence(confirmIgnore) : undefined}
        confirmLabel="Ignore anyway"
        tone="danger"
        busy={triageBusy}
      />

      <ResolveSheet
        row={active}
        onClose={() => setActive(null)}
        onLinked={(whsId) => {
          removeFromQueue(whsId);
          setActive(null);
        }}
      />

      {/* The three cases that block a course's PROS hole view. Read-only. */}
      <ProHoleDataQueue />
    </div>

  );
}

/* -------------------- Queue card -------------------- */

/**
 * Ignore is destructive: it means these rounds never reach any member's course
 * analytics. Say so, with the counts already on the row.
 */
function ignoreConsequence(row: QueueRow): string {
  const rounds = row.triage_rounds ?? row.scored_rounds;
  const members = row.triage_members;
  const roundsTxt = `${rounds} round${rounds === 1 ? '' : 's'}`;
  const membersTxt = members != null
    ? ` played by ${members} member${members === 1 ? '' : 's'}`
    : '';
  return `Ignoring means this WHS course is never linked to a course in the catalogue. ${roundsTxt}${membersTxt} will not appear in any member's course analytics, and will stay hidden until someone links the course. This is not housekeeping - it discards those rounds from every gam surface.`;
}

interface CardProps {
  row: QueueRow;
  expanded: boolean;
  onToggle: () => void;
  onResolve: () => void;
  onIgnore: () => void;
  onNeedsCatalogue: () => void;
  busy: boolean;
}

function QueueCard({ row, expanded, onToggle, onResolve, onIgnore, onNeedsCatalogue, busy }: CardProps) {
  const segments = useMemo(() => parseReasoning(row.echo_reasoning), [row.echo_reasoning]);
  const conf = row.match_confidence != null ? row.match_confidence.toFixed(2) : '—';
  const agree = row.echo_agreement_count ?? 0;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        padding: 14,
        boxShadow: t.shadowCard,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontWeight: 700, color: t.ink, fontSize: 14 }}>{row.whs_name}</span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 8px', borderRadius: 999,
              background: t.neutralSoft, color: t.inkMuted,
              fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
            }}
          >
            {row.scored_rounds} {row.scored_rounds === 1 ? 'round' : 'rounds'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {row.triage_status === 'needs_catalogue' && (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: 999,
                background: t.neutralSoft, color: t.inkMuted,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              Needs catalogue entry
            </span>
          )}
          <StatusPill tone={methodTone(row.match_method)}>{methodLabel(row.match_method)}</StatusPill>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: t.inkMuted, fontSize: 12 }}>
        <span>conf <span style={{ color: t.ink, fontWeight: 600, fontFeatureSettings: '"tnum" 1' }}>{conf}</span></span>
        <span>·</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{agree} {agree === 1 ? 'model agrees' : 'models agree'}</span>
        <span>·</span>
        <span>{relTime(row.matched_at)}</span>
        {row.suggested_course_name && (
          <>
            <span>·</span>
            <span>suggests <span style={{ color: t.ink, fontWeight: 600 }}>{row.suggested_course_name}</span></span>
          </>
        )}
      </div>

      {segments.length > 0 && (
        <button
          type="button"
          onClick={onToggle}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', padding: 0,
            color: t.inkMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide model reasoning' : 'Show model reasoning'}
        </button>
      )}

      {expanded && segments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', background: t.neutralSoft, borderRadius: t.radius.md }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ fontSize: 12, color: t.ink, lineHeight: 1.5 }}>
              <strong style={{ textTransform: 'lowercase' }}>{seg.model}:</strong>{' '}
              <span style={{ color: t.inkMuted }}>{seg.text}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onIgnore}
          disabled={busy}
          style={{
            padding: '8px 14px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.surface,
            color: t.ink,
            fontSize: 13, fontWeight: 600,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.5 : 1,
          }}
        >
          Ignore
        </button>
        {row.triage_status !== 'needs_catalogue' && (
          <button
            type="button"
            onClick={onNeedsCatalogue}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: t.radius.md,
              border: `1px solid ${t.line}`,
              background: t.surface,
              color: t.ink,
              fontSize: 13, fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            Not in the catalogue
          </button>
        )}
        <button
          type="button"
          onClick={onResolve}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            borderRadius: t.radius.md,
            border: 'none',
            background: t.brand,
            color: t.canvas,
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Link2 size={14} />
          Link course
        </button>
      </div>
    </div>
  );
}

/* -------------------- Resolve sheet -------------------- */

interface SheetProps {
  row: QueueRow | null;
  onClose: () => void;
  onLinked: (whsId: string) => void;
}

function ResolveSheet({ row, onClose, onLinked }: SheetProps) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CourseHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<CourseHit | null>(null);
  const [chosen, setChosen] = useState<CourseHit | null>(null);
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [writeErr, setWriteErr] = useState<string | null>(null);
  const [linkedHint, setLinkedHint] = useState(false);

  // Reset & seed on open
  useEffect(() => {
    if (!row) return;
    setChosen(null);
    setNotes('');
    setWriteErr(null);
    setLinkedHint(false);
    setConfirming(false);
    setQuery(clubStem(row.whs_name));
    setSuggestion(null);

    let cancel = false;
    (async () => {
      if (!row.echo_suggested_golf_course_id) return;
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, region, sub_country, country, thumbnail_image')
        .eq('id', row.echo_suggested_golf_course_id)
        .maybeSingle();
      if (!cancel && data) setSuggestion(data as CourseHit);
    })();
    return () => { cancel = true; };
  }, [row?.whs_course_id]);

  // Debounced search
  useEffect(() => {
    if (!row) return;
    const q = query.trim();
    if (q.length < 2) { setHits([]); return; }
    setSearching(true);
    setSearchErr(null);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, sub_country, country, thumbnail_image')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(25);
      setSearching(false);
      if (error) { setSearchErr(error.message); setHits([]); return; }
      setHits((data ?? []) as CourseHit[]);
    }, 220);
    return () => clearTimeout(handle);
  }, [query, row?.whs_course_id]);

  if (!row) return null;

  const doLink = async () => {
    if (!chosen) return;
    setBusy(true);
    setWriteErr(null);

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;

    const { error } = await supabase
      .from('whs_to_golf_course_map')
      .update({
        golf_course_id: chosen.id,
        match_method: 'manual_admin',
        match_confidence: 1.0,
        reviewed_at: new Date().toISOString(),
        reviewed_by: uid,
        notes: notes.trim() || null,
      })
      .eq('whs_course_id', row.whs_course_id);

    setBusy(false);
    setConfirming(false);
    if (error) {
      setWriteErr(error.message || 'Update failed.');
      return;
    }
    setLinkedHint(true);
    // Small delay so admin sees confirmation, then remove from queue
    setTimeout(() => onLinked(row.whs_course_id), 900);
  };

  const CourseRow: React.FC<{ hit: CourseHit; label?: string }> = ({ hit, label }) => {
    const active = chosen?.id === hit.id;
    return (
      <button
        type="button"
        onClick={() => setChosen(hit)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          borderRadius: t.radius.md,
          border: `1px solid ${active ? t.brand : t.line}`,
          background: active ? t.brandSoft : t.surface,
          textAlign: 'left', cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: t.neutralSoft, color: t.inkFaint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: hit.thumbnail_image ? `1px solid ${t.line}` : 'none',
          }}
        >
          <ImageIcon size={14} style={{ opacity: hit.thumbnail_image ? 0.9 : 0.4 }} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
            <span style={{ color: t.ink, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hit.name}
            </span>
            {label && (
              <span style={{ fontSize: 10, fontWeight: 700, color: t.brandText, background: t.brandSoft, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </span>
            )}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: t.inkMuted, fontSize: 11 }}>
            <MapPin size={10} />
            {courseMatchLabel(hit) || '—'}
          </span>
        </span>
      </button>
    );
  };

  const hitsToShow = suggestion
    ? hits.filter((h) => h.id !== suggestion.id)
    : hits;

  return (
    <>
      <AdminSheet
        open={row !== null}
        onClose={onClose}
        title="Link WHS course"
        subtitle={row.whs_name}
        maxWidth={560}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 14px',
                borderRadius: t.radius.md,
                border: `1px solid ${t.line}`,
                background: t.surface,
                color: t.ink,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!chosen || busy}
              style={{
                padding: '10px 14px',
                borderRadius: t.radius.md,
                border: 'none',
                background: t.brand,
                color: t.canvas,
                fontSize: 13, fontWeight: 700,
                cursor: chosen && !busy ? 'pointer' : 'default',
                opacity: chosen && !busy ? 1 : 0.5,
              }}
            >
              Link course
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {linkedHint && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: t.radius.md,
                background: t.okSoft,
                color: t.okText,
                fontSize: 12, lineHeight: 1.5,
              }}
            >
              Linked. Images and IDs appear in Discover after the next cache refresh (up to 6h).
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: t.inkFaint, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Search golf_courses
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Club name…"
              style={{
                padding: '10px 12px',
                borderRadius: t.radius.md,
                border: `1px solid ${t.line}`,
                background: t.surface,
                color: t.ink,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {suggestion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ color: t.inkFaint, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Model suggestion
              </div>
              <CourseRow hit={suggestion} label="Model suggestion" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ color: t.inkFaint, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Results
            </div>
            {searchErr ? (
              <div style={{ color: t.dangerText, fontSize: 12 }}>{searchErr}</div>
            ) : searching ? (
              <div style={{ color: t.inkMuted, fontSize: 12 }}>Searching…</div>
            ) : hitsToShow.length === 0 ? (
              <div style={{ color: t.inkMuted, fontSize: 12 }}>
                {query.trim().length < 2 ? 'Type at least 2 characters.' : 'No matches.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hitsToShow.map((h) => <CourseRow key={h.id} hit={h} />)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: t.inkFaint, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context for future reviewers…"
              rows={3}
              style={{
                padding: '10px 12px',
                borderRadius: t.radius.md,
                border: `1px solid ${t.line}`,
                background: t.surface,
                color: t.ink,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {writeErr && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: t.radius.md,
                background: t.dangerSoft,
                color: t.dangerText,
                fontSize: 12, lineHeight: 1.5,
              }}
            >
              {writeErr}
            </div>
          )}
        </div>
      </AdminSheet>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={doLink}
        title="Link this course?"
        description={
          chosen
            ? `Map "${row.whs_name}" → "${chosen.name}". This overwrites the AI verdict and sets confidence to 1.0.`
            : undefined
        }
        confirmLabel="Link course"
        busy={busy}
      />
    </>
  );
}
