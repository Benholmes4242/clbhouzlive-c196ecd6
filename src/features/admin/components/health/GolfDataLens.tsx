/** Health: Golf data lens (health_golf_data.html). */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { adminTheme as t } from '../../theme';
import ConfirmDialog from '../ConfirmDialog';
import { FooterButton, Head, Muted, Panel, ROW_RULE, Slot, FIG_LABEL } from '../analytics/analyticsUi';
import { dateLabel, num } from '../analytics/analyticsFormat';
import { useHealthGolf, type HealthGolf } from '../../hooks/useHealthLenses';
import { ageOf, minsText, plural, secsText, untilOf } from './healthText';
import { Bar, H, META, PillButton } from './healthUi';
import { useNavigate } from 'react-router-dom';

const share = (a: number | null, b: number | null) => (a == null || !b ? 0 : (100 * a) / b);

function Journey({ g }: { g: HealthGolf }) {
  const j = g.journey;
  const posted = j.posted ?? 0;
  const gap = (lag: React.ReactNode, note?: string | null) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 5px 10px', fontSize: 10.5, fontWeight: 700, color: t.inkFaint }}>
      <span style={{ width: 1, height: 14, background: H.rule }} />
      {lag}
      <span>{note}</span>
    </div>
  );
  const diff = (a: number | null, b: number | null) => (a != null && b != null && a - b > 0 ? a - b : 0);
  const rows: { label: string; n: number | null; gap?: React.ReactNode }[] = [
    { label: 'Posted on England Golf', n: j.posted },
    { label: 'Synced to clbhouz', n: j.posted, gap: gap(<span style={{ color: H.okText }}>median {minsText(j.synced_median_mins)}</span>) },
    { label: 'Hole by hole fetched', n: j.holes, gap: gap(<span />, diff(j.posted, j.holes) ? `· ${diff(j.posted, j.holes)} posted without holes` : null) },
    { label: 'Course matched', n: j.matched, gap: gap(<span />, diff(j.analysed, j.matched) ? `· ${diff(j.analysed, j.matched)} on unmatched courses` : null) },
    { label: 'Analysed', n: j.analysed, gap: gap(<span style={{ color: H.okText }}>median {secsText(j.analysed_median_secs)}</span>) },
    {
      label: 'Seen by the member', n: j.seen,
      gap: gap(<span style={{ color: t.inkMuted }}>median {j.seen_median_mins == null ? '-' : j.seen_median_mins < 60 ? `${Math.round(j.seen_median_mins)}m` : `${Math.floor(j.seen_median_mins / 60)}h`}</span>,
        diff(j.analysed, j.seen) ? `· ${diff(j.analysed, j.seen)} not opened yet` : null),
    },
  ];
  return (
    <Panel>
      <Head title="A round's journey" side="last 7 days" />
      <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>Every round posted by a connected member, from England Golf to their screen</div>
      {posted === 0 ? (
        <Muted style={{ marginTop: 12 }}>No rounds posted in 7 days.</Muted>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => (
            <div key={r.label}>
              {r.gap}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{num(r.n)}</span>
              </div>
              <Bar pct={Math.max(2, share(r.n, posted))} color={i === 0 ? H.inkSoft : H.brand} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Connections({ g }: { g: HealthGolf }) {
  const c = g.connections;
  const tile = (label: string, v: number | null, sub: string, kind: 'fresh' | 'warn') => {
    const hot = kind === 'warn' && (v ?? 0) > 0;
    return (
      <div style={{ borderRadius: 12, padding: 10, background: hot ? H.tileWarn : H.tile }}>
        <div style={FIG_LABEL}>{label}</div>
        <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: kind === 'fresh' ? H.okText : hot ? H.amber : t.ink }}>{num(v)}</div>
        <div style={{ fontSize: 9.5, color: t.inkFaint }}>{sub}</div>
      </div>
    );
  };
  return (
    <Panel>
      <Head title="England Golf connections" side={c.next_sync_at ? `next sync in ${untilOf(c.next_sync_at)}` : 'next sync in -'} />
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{num(c.connected)}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.inkMuted }}>members connected</span>
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        {tile('Fresh', c.fresh, 'under 12h', 'fresh')}
        {tile('Stale', c.stale, 'over 12h', 'warn')}
        {tile('Re-auth', c.reauth, 'login expired', 'warn')}
        {tile('Failing', c.failing, '3+ in a row', 'warn')}
      </div>
      {c.oldest.length > 0 && (
        <>
          <div style={{ marginTop: 14, ...FIG_LABEL }}>Longest since a sync</div>
          <div style={{ marginTop: 4 }}>
            {c.oldest.slice(0, 3).map((m) => (
              <Link key={m.user_id} to={`/admin-v2/users?member=${m.user_id}`} style={{
                display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '9px 0', borderTop: ROW_RULE, color: t.ink, textDecoration: 'none',
              }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{m.name ?? '-'}</span>
                  <span style={META}>
                    last round {dateLabel(m.last_round)} &middot; {m.rounds == null ? '-' : plural(m.rounds, 'round')}
                    {m.status === 'auth_failed' ? ' · login expired' : ''}
                  </span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800 }}>{m.last_synced_at ? `${ageOf(m.last_synced_at)} ago` : 'never'}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function Quality({ g }: { g: HealthGolf }) {
  const q = g.quality;
  const row = (label: string, a: number | null, b: number | null, missing: number | null, sub: (n: number) => string) => {
    const p = a == null || !b ? null : Math.floor((100 * a) / b);
    const good = p != null && p >= 95;
    return (
      <div key={label}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: p == null ? t.ink : good ? H.okText : H.amber }}>{p == null ? '-' : `${p}%`}</span>
        </div>
        <Bar pct={p ?? 0} color={good ? H.okBar : H.amber} />
        <div style={{ marginTop: 3, fontSize: 10.5, color: t.inkFaint }}>{missing == null ? '-' : missing === 0 ? 'None missing' : sub(missing)}</div>
      </div>
    );
  };
  const less = (a: number | null, b: number | null) => (a == null || b == null ? null : Math.max(0, a - b));
  return (
    <Panel>
      <Head title="Data quality" side={q.rounds == null ? '- rounds on record' : `${plural(q.rounds, 'round')} on record`} />
      <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>What every analysis depends on. Below 95% shows in amber.</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {row('Hole by hole detail', q.hole_detail, q.rounds, less(q.rounds, q.hole_detail), (n) => `${plural(n, 'round')} ${n === 1 ? 'has' : 'have'} only a total score`)}
        {row('Course matched', q.course_matched, q.rounds, less(q.rounds, q.course_matched), (n) => `${plural(n, 'round')} on ${g.unmatched.courses == null ? '-' : plural(g.unmatched.courses, 'unmatched course')}`)}
        {row('Rating and slope', q.rating_slope, q.rounds, less(q.rounds, q.rating_slope), (n) => `${plural(n, 'round')} missing a course rating`)}
        {row('Course on the map', q.played_on_map, q.played_courses, less(q.played_courses, q.played_on_map), (n) => `${plural(n, 'played course')} ${n === 1 ? 'has' : 'have'} no location`)}
      </div>
    </Panel>
  );
}

function ToMatch({ g }: { g: HealthGolf }) {
  const nav = useNavigate();
  const u = g.unmatched;
  return (
    <Panel list>
      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Courses to match</span>
          {(u.courses ?? 0) > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: H.amber }}>{plural(u.courses!, 'course')} &middot; {u.rounds == null ? '-' : plural(u.rounds, 'round')}</span>
          )}
        </div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: t.inkMuted }}>Rounds played here have no course page, stats or ratings until matched</div>
      </div>
      {!u.courses ? (
        <Muted style={{ padding: '10px 16px 12px', borderTop: ROW_RULE }}>Every played course is matched.</Muted>
      ) : (
        <>
          {u.rows.slice(0, 3).map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 16px', borderTop: ROW_RULE }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{r.name}</span>
                <span style={META}>
                  {r.rounds == null ? '-' : plural(r.rounds, 'round')} &middot; {r.members == null ? '-' : plural(r.members, 'member')} &middot; last {dateLabel(r.last_played)}
                </span>
              </span>
              <Link to="/admin-v2/inbox/matching" style={{
                height: 32, padding: '0 12px', borderRadius: 999, border: `1px solid ${H.rule}`, display: 'inline-flex', alignItems: 'center',
                fontSize: 11.5, fontWeight: 700, color: t.ink, textDecoration: 'none',
              }}>Match</Link>
            </div>
          ))}
          <FooterButton onClick={() => nav('/admin-v2/inbox/matching')}>Open course matching</FooterButton>
        </>
      )}
    </Panel>
  );
}

function Stuck({ g }: { g: HealthGolf }) {
  const s = g.stuck; const j = g.journey;
  const clear = (s.stuck ?? 0) === 0 && (s.failed_7d ?? 0) === 0 && j.analysed === j.posted;
  const isStuck = (s.stuck ?? 0) > 0;
  const side = clear ? <span style={{ color: H.okText, fontWeight: 700 }}>none</span>
    : isStuck ? <span style={{ color: H.dangerText, fontWeight: 700 }}>{s.stuck} stuck</span>
    : <span style={{ color: H.amber, fontWeight: 700 }}>check</span>;
  const pending = Math.max(0, (j.posted ?? 0) - (j.analysed ?? 0));
  const body = clear
    ? `Every round posted in the last 7 days has been analysed. Median analysis time ${secsText(s.median_process_secs)}.`
    : isStuck
      ? `${plural(s.stuck!, 'round')} ${s.stuck === 1 ? 'has' : 'have'} waited over an hour, the oldest ${secsText(s.oldest_wait_secs) === '-' ? '-' : ageOfSecs(s.oldest_wait_secs)}.`
      : `${plural(pending, 'round')} from the last 7 days ${pending === 1 ? 'has' : 'have'} no analysis yet${(s.failed_7d ?? 0) > 0 ? `, ${s.failed_7d} failed` : ''}`;
  return (
    <Panel>
      <Head title="Stuck rounds" side={side} />
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        {clear && (
          <span style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(61,220,145,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={H.okText} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
          </span>
        )}
        <span style={{ fontSize: 12.5, lineHeight: 1.4, color: t.inkMuted }}>{body}</span>
      </div>
    </Panel>
  );
}

import { ageSecs } from './healthText';
const ageOfSecs = (s: number | null) => ageSecs(s);

/** Moved from SystemPage's DevToolsTab: same edge function calls, dialog and toasts. */
function FixTools() {
  const [confirm, setConfirm] = useState(false);
  const [clubId, setClubId] = useState('');
  const backfill = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('backfill-whs-course-mapping', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const summary = data?.matched != null ? `Matched ${data.matched}, unmatched ${data.unmatched ?? 0}` : 'Backfill complete.';
      toast.success('WHS backfill finished', { description: summary });
    },
    onError: (e: any) => toast.error('Backfill failed', { description: e?.message ?? 'Unknown error' }),
    onSettled: () => setConfirm(false),
  });
  const geocode = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('geocode-club', { body: { club_id: id } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => toast.success('Club geocoded', {
      description: data?.latitude ? `Lat ${data.latitude}, Lng ${data.longitude}` : 'Coordinates persisted.',
    }),
    onError: (e: any) => toast.error('Geocode failed', { description: e?.message ?? 'Unknown error' }),
  });
  const id = clubId.trim();
  return (
    <Panel>
      <Head title="Fix tools" />
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', paddingBottom: 12, borderBottom: ROW_RULE }}>
        <span>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>Re-link England Golf courses</span>
          <span style={META}>Matches WHS courses to course pages again</span>
        </span>
        <PillButton primary disabled={backfill.isPending} onClick={() => setConfirm(true)}>{backfill.isPending ? 'Running…' : 'Run'}</PillButton>
      </div>
      <div style={{ paddingTop: 12 }}>
        <label htmlFor="health-club-id" style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>Find a club's location</label>
        <span style={META}>Looks up the map position for a club from its id</span>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8 }}>
          <input id="health-club-id" value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Club id" style={{
            height: 40, boxSizing: 'border-box', padding: '0 12px', borderRadius: 12, border: `1px solid ${t.line}`,
            background: t.canvas, color: t.ink, fontSize: 13, fontFamily: 'inherit', minWidth: 0, outline: 'none',
          }} />
          <PillButton disabled={!id || geocode.isPending} onClick={() => geocode.mutate(id)} style={{ height: 40, borderRadius: 12 }}>
            {geocode.isPending ? 'Looking…' : 'Look up'}
          </PillButton>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => backfill.mutate()}
        busy={backfill.isPending}
        title="Run WHS backfill?"
        description="This will re-process WHS course mappings against golf_courses. Safe to re-run but may take a moment."
        confirmLabel="Run backfill"
      />
    </Panel>
  );
}

export default function GolfDataLens() {
  const golf = useHealthGolf();
  return (
    <>
      <Slot q={golf} height={420}>{(g) => <Journey g={g} />}</Slot>
      <Slot q={golf} height={330}>{(g) => <Connections g={g} />}</Slot>
      <Slot q={golf} height={300}>{(g) => <Quality g={g} />}</Slot>
      <Slot q={golf} height={240}>{(g) => <ToMatch g={g} />}</Slot>
      <Slot q={golf} height={96}>{(g) => <Stuck g={g} />}</Slot>
      <FixTools />
    </>
  );
}
