/**
 * Tour venue mapping (BRIEF_TOURNAMENT_VENUE_MAPPING_GATE_AND_REVIEW).
 *
 * One row per DISTINCT sr_tournaments.venue_name, sorted by next event date.
 * Approving writes sr_course_map (source 'manual', confidence 1.00) AND
 * sr_tournaments.golf_course_id for every tournament on that venue_name, in one
 * action - they are the same fact. "No match" is recorded as a manual row with a
 * null course so the venue stops reading as unreviewed.
 *
 * Geography-incompatible candidates are shown LAST under a divider, never hidden:
 * a human may know something the vocabulary does not (see CountryMismatchWarning).
 * Never edits sr_tournaments.venue_* - those are the vendor's.
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
import {
  isVenueGeographyCompatible,
  venueGeoLabel,
  venueGeographyNote,
} from '@/lib/tourhub/venueGeography';

type VenueState = 'unmapped' | 'fuzzy' | 'mapped' | 'no_match';

interface VenueRow {
  venueName: string;
  city: string | null;
  state: string | null;
  country: string | null;
  tournaments: number;
  nextEvent: string | null;
  lastEvent: string | null;
  status: VenueState;
  mappedCourseName: string | null;
}

interface Candidate {
  id: string;
  name: string;
  sub_country: string | null;
  country: string | null;
  region: string | null;
}

const KEY = ['admin-venue-mapping'] as const;

async function fetchVenues(): Promise<VenueRow[]> {
  const [{ data: tours, error: e1 }, { data: maps, error: e2 }] = await Promise.all([
    supabase
      .from('sr_tournaments')
      .select('venue_name, venue_city, venue_state, venue_country, start_date, golf_course_id')
      .not('venue_name', 'is', null)
      .limit(2000),
    supabase
      .from('sr_course_map')
      .select('sr_venue_name, source, golf_course_id, golf_courses:golf_course_id(name)')
      .limit(2000),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const mapBy = new Map<string, any>();
  (maps ?? []).forEach((m: any) => mapBy.set(m.sr_venue_name, m));
  const today = new Date().toISOString().slice(0, 10);
  const by = new Map<string, VenueRow & { linked: number }>();
  for (const r of (tours ?? []) as any[]) {
    let v = by.get(r.venue_name);
    if (!v) {
      v = {
        venueName: r.venue_name, city: r.venue_city, state: r.venue_state, country: r.venue_country,
        tournaments: 0, nextEvent: null, lastEvent: null, status: 'unmapped', mappedCourseName: null, linked: 0,
      };
      by.set(r.venue_name, v);
    }
    v.tournaments += 1;
    if (r.golf_course_id) v.linked += 1;
    const d = r.start_date as string | null;
    if (d && d >= today && (!v.nextEvent || d < v.nextEvent)) v.nextEvent = d;
    if (d && (!v.lastEvent || d > v.lastEvent)) v.lastEvent = d;
  }
  for (const v of by.values()) {
    const m = mapBy.get(v.venueName);
    v.mappedCourseName = m?.golf_courses?.name ?? null;
    if (m?.source === 'manual' && !m.golf_course_id) v.status = 'no_match';
    else if (m?.source === 'fuzzy') v.status = 'fuzzy';
    else if ((m?.golf_course_id && m.source !== 'fuzzy') || v.linked === v.tournaments) v.status = 'mapped';
  }
  return [...by.values()].sort((a, b) => {
    if (a.nextEvent && b.nextEvent) return a.nextEvent.localeCompare(b.nextEvent);
    if (a.nextEvent) return -1;
    if (b.nextEvent) return 1;
    return (b.lastEvent ?? '').localeCompare(a.lastEvent ?? '');
  });
}

const STATUS_LABEL: Record<VenueState, string> = {
  unmapped: 'Unmapped', fuzzy: 'Fuzzy, unreviewed', mapped: 'Mapped', no_match: 'No match',
};
const STATUS_TONE: Record<VenueState, 'danger' | 'warn' | 'ok' | 'neutral'> = {
  unmapped: 'danger', fuzzy: 'warn', mapped: 'ok', no_match: 'neutral',
};

function seedTerm(name: string): string {
  const stop = /^(the|golf|club|country|cc|gc|course|resort|links|and|&|at|of|g&cc)$/i;
  return name.split(/[\s,()]+/).find((w) => w.length > 2 && !stop.test(w)) ?? name;
}

export default function VenueMappingPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, isError, error, refetch } = useQuery({ queryKey: KEY, queryFn: fetchVenues });
  const [filter, setFilter] = useState<'review' | 'mapped' | 'all'>('review');
  const [active, setActive] = useState<VenueRow | null>(null);

  const rows = useMemo(() => data.filter((v) =>
    filter === 'all' ? true : filter === 'mapped' ? v.status === 'mapped' || v.status === 'no_match'
      : v.status === 'unmapped' || v.status === 'fuzzy'), [data, filter]);
  const counts = useMemo(() => {
    const c: Record<VenueState, number> = { unmapped: 0, fuzzy: 0, mapped: 0, no_match: 0 };
    data.forEach((v) => { c[v.status] += 1; });
    return c;
  }, [data]);

  if (isError) return <AdminErrorState message={(error as Error)?.message} onRetry={() => refetch()} />;

  const columns: DataListColumn<VenueRow>[] = [
    { key: 'v', header: 'Venue', render: (r) => <b style={{ color: t.ink }}>{r.venueName}</b> },
    { key: 'p', header: 'Place', render: (r) => venueGeoLabel(r) },
    { key: 'n', header: 'Events', align: 'right', render: (r) => r.tournaments, width: 70 },
    { key: 'd', header: 'Next event', render: (r) => r.nextEvent ?? `last ${r.lastEvent ?? '—'}`, width: 120 },
    { key: 's', header: 'State', render: (r) => <StatusPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>, width: 150 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.ink }}>Tour venue mapping</div>
        <div style={{ fontSize: 12, color: t.inkMuted }}>
          {data.length} venues · {counts.unmapped} unmapped · {counts.fuzzy} fuzzy · {counts.mapped} mapped · {counts.no_match} no match
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {(['review', 'mapped', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13,
            fontWeight: filter === f ? 700 : 500, color: filter === f ? t.ink : t.inkFaint,
          }}>{f === 'review' ? 'Needs review' : f === 'mapped' ? 'Mapped' : 'All'}</button>
        ))}
      </div>
      <DataList
        columns={columns}
        rows={rows}
        rowKey={(r) => r.venueName}
        loading={isLoading}
        emptyTitle="Nothing to review"
        renderCard={(r) => (
          <button onClick={() => setActive(r)} style={{
            width: '100%', textAlign: 'left', background: t.surface, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b style={{ color: t.ink, fontSize: 13.5 }}>{r.venueName}</b>
              <StatusPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>
            </div>
            <div style={{ fontSize: 12, color: t.inkMuted }}>
              {venueGeoLabel(r)} · {r.tournaments} event{r.tournaments === 1 ? '' : 's'} · {r.nextEvent ? `next ${r.nextEvent}` : `last ${r.lastEvent ?? '—'}`}
            </div>
            {r.mappedCourseName && <div style={{ fontSize: 12, color: t.inkFaint }}>→ {r.mappedCourseName}</div>}
          </button>
        )}
      />
      {active && (
        <VenueDetail
          venue={active}
          onClose={() => setActive(null)}
          onDone={() => { setActive(null); qc.invalidateQueries({ queryKey: KEY }); }}
        />
      )}
    </div>
  );
}

function VenueDetail({ venue, onClose, onDone }: { venue: VenueRow; onClose: () => void; onDone: () => void }) {
  const [term, setTerm] = useState(seedTerm(venue.venueName));
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [confirm, setConfirm] = useState<'approve' | 'nomatch' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const geo = { country: venue.country, state: venue.state };

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ['admin-venue-candidates', term],
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
  const ok = hits.filter((c) => isVenueGeographyCompatible(geo, c));
  const bad = hits.filter((c) => !isVenueGeographyCompatible(geo, c));

  async function write(courseId: string | null) {
    setBusy(true); setErr(null);
    // Both writes, one action. The map first, then every tournament on this venue.
    const { error: e1 } = await supabase.from('sr_course_map').upsert({
      sr_venue_name: venue.venueName,
      sr_city: venue.city,
      sr_country: venue.country,
      golf_course_id: courseId,
      confidence: courseId ? 1.0 : 0,
      source: 'manual',
    }, { onConflict: 'sr_venue_name' });
    if (e1) { setBusy(false); setErr(`Mapping not saved: ${e1.message}`); return; }
    const { error: e2 } = await supabase
      .from('sr_tournaments')
      .update({ golf_course_id: courseId })
      .eq('venue_name', venue.venueName);
    setBusy(false);
    if (e2) { setErr(`Mapping saved but tournaments not updated: ${e2.message}. Retry to bring them back in line.`); return; }
    onDone();
  }

  const row = (c: Candidate) => {
    const note = venueGeographyNote(geo, c);
    const sel = picked?.id === c.id;
    return (
      <button key={c.id} onClick={() => setPicked(c)} style={{
        textAlign: 'left', padding: '8px 10px', borderRadius: t.radius.sm, cursor: 'pointer',
        border: `1px solid ${sel ? t.ink : t.line}`, background: sel ? t.neutralSoft : t.surface,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <b style={{ color: t.ink, fontSize: 13 }}>{c.name}</b>
          {note && <GeoFlag />}
        </div>
        <div style={{ fontSize: 11.5, color: t.inkMuted }}>
          {[c.region, c.sub_country ?? 'no sub-country'].filter(Boolean).join(', ')} · grouping: {c.country ?? '—'}
        </div>
      </button>
    );
  };

  return (
    <AdminSheet
      open
      onClose={onClose}
      title={venue.venueName}
      subtitle={`${venueGeoLabel(venue)} · ${venue.tournaments} event${venue.tournaments === 1 ? '' : 's'}`}
      footer={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button disabled={!picked || busy} onClick={() => setConfirm('approve')} style={btn(true, !picked || busy)}>
            Link venue to course
          </button>
          <button disabled={busy} onClick={() => setConfirm('nomatch')} style={btn(false, busy)}>No match</button>
          <button disabled={busy} onClick={() => setAddOpen(true)} style={btn(false, busy)}>Add course…</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start', padding: '2px 8px', borderRadius: 999,
          background: venue.country ? t.neutralSoft : t.dangerSoft, color: venue.country ? t.ink : t.dangerText,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Venue: {venueGeoLabel(venue)}
        </div>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search courses"
          style={{ padding: '8px 10px', borderRadius: t.radius.sm, border: `1px solid ${t.line}`, background: t.canvas, color: t.ink, fontSize: 13 }}
        />
        {picked && venueGeographyNote(geo, picked) && <GeoBanner note={venueGeographyNote(geo, picked)!} />}
        {err && <div role="alert" style={{ color: t.dangerText, fontSize: 12 }}>{err}</div>}
        {isFetching && <div style={{ fontSize: 12, color: t.inkFaint }}>Searching…</div>}
        {ok.map(row)}
        {bad.length > 0 && (
          <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 8, fontSize: 11, color: t.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Different place ({bad.length})
          </div>
        )}
        {bad.map(row)}
        {!isFetching && hits.length === 0 && term.trim().length >= 2 && (
          <div style={{ fontSize: 12, color: t.inkMuted }}>No courses match "{term}".</div>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        busy={busy}
        tone={confirm === 'approve' && picked && venueGeographyNote(geo, picked) ? 'danger' : 'default'}
        title={confirm === 'nomatch' ? 'Record no match?' : `Link to ${picked?.name ?? ''}?`}
        description={confirm === 'nomatch'
          ? `All ${venue.tournaments} tournaments at ${venue.venueName} will be unlinked and the venue marked reviewed.`
          : `Writes the manual mapping and links all ${venue.tournaments} tournaments at ${venue.venueName}.${picked && venueGeographyNote(geo, picked) ? ' ' + venueGeographyNote(geo, picked) : ''}`}
        confirmLabel={confirm === 'nomatch' ? 'Record no match' : 'Link'}
        onConfirm={async () => { const c = confirm; setConfirm(null); await write(c === 'approve' ? picked!.id : null); }}
      />
      <AddCourseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        prefillName={venue.venueName}
        uploadPhoto={uploadCoursePhoto}
        onOpenExisting={() => setAddOpen(false)}
        onCreated={(created) => {
          setAddOpen(false);
          setTerm(created.name);
          setPicked({ id: created.id, name: created.name, sub_country: null, country: null, region: null });
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
