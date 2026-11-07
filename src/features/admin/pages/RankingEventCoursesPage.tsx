/**
 * Admin review for world-ranking events matched to catalogue courses.
 *
 * The RPC owns matching and every pro's profile activity. This page only lets
 * an admin choose the course, record "no course", or create the missing course;
 * geography-incompatible candidates stay visible under the divider so a human
 * can override vocabulary gaps deliberately.
 */
import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import AdminSheet from '../components/AdminSheet';
import AddCourseSheet from '../components/AddCourseSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import DataList, { type DataListColumn } from '../components/DataList';
import StatusPill from '../components/StatusPill';
import AdminErrorState from '../components/AdminErrorState';
import { uploadCoursePhoto } from '../hooks/useCourses';
import { owgrCountryMatches, owgrGeoNote } from '@/lib/tourhub/owgrEventGeography';
import {
  cardMeta,
  headerSummary,
  inFilter,
  playedSentence,
  reasonLine,
  STATUS_LABEL,
  STATUS_TONE,
  type RankingEventFilter,
  type RankingEventPlayed,
  type RankingEventStatus,
} from './rankingEventRules';

interface RankingEventRow {
  id: string;
  event_name: string;
  country: string | null;
  status: RankingEventStatus;
  candidate_count: number;
  golf_course_id: string | null;
  course_name: string | null;
  seed: string | null;
  years: number[];
  events: number;
  pros: number;
  last_played: string | null;
  played: RankingEventPlayed[];
}

interface Candidate {
  id: string;
  name: string;
  sub_country: string | null;
  country: string | null;
  region: string | null;
  /** The linked/current course arrives without geography; only searched rows can be checked. */
  geoKnown?: boolean;
}

const KEY = ['admin-owgr-event-courses'] as const;

function parsePlayed(value: unknown): RankingEventPlayed[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const v = row as Record<string, unknown>;
    if (typeof v.pro !== 'string' || typeof v.date !== 'string') return [];
    return [{ pro: v.pro, date: v.date, finish: typeof v.finish === 'string' ? v.finish : null }];
  });
}

async function fetchRankingEvents(): Promise<RankingEventRow[]> {
  const { data, error } = await supabase.rpc('admin_get_owgr_event_courses');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    event_name: row.event_name,
    country: row.country ?? null,
    status: row.status as RankingEventStatus,
    candidate_count: row.candidate_count,
    golf_course_id: row.golf_course_id ?? null,
    course_name: row.course_name ?? null,
    seed: row.seed ?? null,
    years: row.years ?? [],
    events: row.events,
    pros: row.pros,
    last_played: row.last_played ?? null,
    played: parsePlayed(row.played),
  }));
}

function titleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (/^[\s-]+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

export default function RankingEventCoursesPage() {
  const { data = [], isLoading, isError, error, refetch } = useQuery({ queryKey: KEY, queryFn: fetchRankingEvents });
  const [filter, setFilter] = useState<RankingEventFilter>('review');
  const [active, setActive] = useState<RankingEventRow | null>(null);

  const rows = useMemo(() => data.filter((row) => inFilter(row.status, filter)), [data, filter]);

  if (isError) return <AdminErrorState message={(error as Error)?.message} onRetry={() => refetch()} />;

  const columns: DataListColumn<RankingEventRow>[] = [
    { key: 'event', header: 'Event', render: (row) => <b style={{ color: t.ink }}>{row.event_name}</b> },
    { key: 'country', header: 'Country', render: (row) => row.country ?? '—' },
    { key: 'years', header: 'Years', render: (row) => row.years.join(', ') },
    { key: 'pros', header: 'Pros', align: 'right', render: (row) => row.pros, width: 70 },
    { key: 'state', header: 'State', render: (row) => <StatusPill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</StatusPill>, width: 150 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.ink }}>Ranking event courses</div>
        <div style={{ fontSize: 12, color: t.inkMuted }}>{headerSummary(data)}</div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {(['review', 'matched', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13,
            fontWeight: filter === f ? 700 : 500, color: filter === f ? t.ink : t.inkFaint,
          }}>{f === 'review' ? 'Needs review' : f === 'matched' ? 'Matched' : 'All'}</button>
        ))}
      </div>
      <DataList
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={isLoading}
        emptyTitle="Nothing to review"
        renderCard={(row) => (
          <button onClick={() => setActive(row)} style={{
            width: '100%', textAlign: 'left', background: t.surface, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b style={{ color: t.ink, fontSize: 13.5 }}>{row.event_name}</b>
              <StatusPill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</StatusPill>
            </div>
            <div style={{ fontSize: 12, color: t.inkMuted }}>{cardMeta(row)}</div>
            {row.course_name && <div style={{ fontSize: 12, color: t.inkFaint }}>→ {row.course_name}</div>}
          </button>
        )}
      />
      {active && <RankingEventDetail key={active.id} row={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function RankingEventDetail({ row, onClose }: { row: RankingEventRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [term, setTerm] = useState(row.seed || row.event_name);
  const [picked, setPicked] = useState<Candidate | null>(() =>
    row.golf_course_id && row.course_name
      ? { id: row.golf_course_id, name: row.course_name, sub_country: null, country: null, region: null, geoKnown: false }
      : null,
  );
  const [confirm, setConfirm] = useState<'link' | 'none' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ['admin-owgr-event-candidates', term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, sub_country, country, region')
        .ilike('name', `%${term.trim()}%`)
        .order('name')
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Candidate[];
    },
  });
  const compatible = hits.filter((course) => owgrCountryMatches(row.country, course));
  const differentPlace = hits.filter((course) => !owgrCountryMatches(row.country, course));
  const pickedNote = picked?.geoKnown === false ? null : picked ? owgrGeoNote(row.country, picked) : null;

  async function write(courseId: string | null) {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc(
      'admin_set_owgr_event_course',
      { p_id: row.id, p_course_id: courseId } as never,
    );
    setBusy(false);
    if (error) {
      setErr(`Not saved: ${error.message}`);
      return;
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['admin-owgr-event-courses'] }),
      qc.invalidateQueries({ queryKey: ['admin-owgr-events-needing-course'] }),
      qc.invalidateQueries({ queryKey: ['pro-tour-courses'] }),
      qc.invalidateQueries({ queryKey: ['user-course-activity'] }),
    ]);
    onClose();
  }

  const candidateRow = (course: Candidate) => {
    const note = owgrGeoNote(row.country, course);
    const selected = picked?.id === course.id;
    return (
      <button key={course.id} onClick={() => setPicked(course)} style={{
        textAlign: 'left', padding: '8px 10px', borderRadius: t.radius.sm, cursor: 'pointer',
        border: `1px solid ${selected ? t.ink : t.line}`, background: selected ? t.neutralSoft : t.surface,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <b style={{ color: t.ink, fontSize: 13 }}>{course.name}</b>
          {note && <GeoFlag />}
        </div>
        <div style={{ fontSize: 11.5, color: t.inkMuted }}>
          {[course.region, course.sub_country ?? 'no sub-country'].filter(Boolean).join(', ')} · {course.country ?? '—'}
        </div>
      </button>
    );
  };

  return (
    <AdminSheet
      open
      onClose={onClose}
      title={row.event_name}
      subtitle={`${row.country || 'No country'} · ${row.events} event${row.events === 1 ? '' : 's'} · ${row.pros} pro${row.pros === 1 ? '' : 's'}`}
      footer={
        <div data-testid="ranking-event-footer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button disabled={!picked || busy} onClick={() => setConfirm('link')} style={btn(true, !picked || busy)}>
            Link event to course
          </button>
          <button disabled={busy} onClick={() => setConfirm('none')} style={btn(false, busy)}>No course</button>
          <button disabled={busy} onClick={() => setAddOpen(true)} style={btn(false, busy)}>Add course…</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start', padding: '2px 8px', borderRadius: 999,
          background: row.country ? t.neutralSoft : t.dangerSoft, color: row.country ? t.ink : t.dangerText,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Event: {row.country || 'No country'}
        </div>
        <div style={{ fontSize: 12, color: t.inkMuted, lineHeight: 1.5 }}>
          {playedSentence(row.played)}
          <br />
          {reasonLine(row)}
        </div>
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search courses"
          style={{ padding: '8px 10px', borderRadius: t.radius.sm, border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontSize: 13 }}
        />
        {pickedNote && <GeoBanner note={pickedNote} />}
        {err && <div role="alert" style={{ color: t.dangerText, fontSize: 12 }}>{err}</div>}
        {isFetching && <div style={{ fontSize: 12, color: t.inkFaint }}>Searching…</div>}
        {compatible.map(candidateRow)}
        {differentPlace.length > 0 && (
          <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 8, fontSize: 11, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Different place ({differentPlace.length})
          </div>
        )}
        {differentPlace.map(candidateRow)}
        {!isFetching && hits.length === 0 && term.trim().length >= 2 && (
          <div style={{ fontSize: 12, color: t.inkMuted }}>No courses match "{term}".</div>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        busy={busy}
        tone={confirm === 'link' && pickedNote ? 'danger' : 'default'}
        title={confirm === 'none' ? 'Record no course?' : `Link to ${picked?.name ?? ''}?`}
        description={confirm === 'none'
          ? `${row.event_name} is marked reviewed with no course and won't add a course to any pro's profile.`
          : `Links ${row.event_name} to ${picked?.name ?? ''} for every pro who played it, in every year.${pickedNote ? ` ${pickedNote}` : ''}`}
        confirmLabel={confirm === 'none' ? 'Record no course' : 'Link'}
        onConfirm={async () => {
          const action = confirm;
          setConfirm(null);
          await write(action === 'link' ? picked!.id : null);
        }}
      />
      <AddCourseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        prefillName={titleCase(row.seed || row.event_name)}
        uploadPhoto={uploadCoursePhoto}
        onOpenExisting={() => setAddOpen(false)}
        onCreated={(created) => {
          setAddOpen(false);
          setTerm(created.name);
          setPicked({ id: created.id, name: created.name, sub_country: null, country: null, region: null, geoKnown: false });
        }}
      />
    </AdminSheet>
  );
}

function GeoFlag() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 999,
      background: t.dangerSoft, color: t.dangerText, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      <AlertTriangle size={9} /> Different place
    </span>
  );
}

function GeoBanner({ note }: { note: string }) {
  return (
    <div role="alert" style={{
      display: 'flex', gap: 8, padding: '9px 11px', borderRadius: t.radius.md,
      background: t.dangerSoft, color: t.dangerText, border: `1px solid ${t.line}`, fontSize: 12, lineHeight: 1.45,
    }}>
      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span><b>Places disagree.</b> {note} Only link these if you know the event is genuinely played there.</span>
    </div>
  );
}

function btn(primary: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: t.radius.md, fontSize: 13, fontWeight: primary ? 700 : 600,
    border: primary ? 'none' : `1px solid ${t.line}`, background: primary ? t.brand : t.surface,
    color: primary ? t.canvas : t.ink, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
  };
}
