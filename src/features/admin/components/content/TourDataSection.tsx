/**
 * CONTENT_V3_3_TOUR_DATA — Tour data in the v3 grammar (cc3-content-tour.html):
 * rankings one tour at a time (no All chip; fallback lists every row when by_tour
 * is empty), red for stale feeds, Own photo instead of No photo set.
 * BRIEF_CONTENT_DESK Stage 4 origin. Feeds, field and
 * player figures are get_admin_feeds_health as returned. Run now, Add photo
 * and Open directory hand back to the caller, which owns the existing Sync
 * players action, the headshot override sheet and the player list.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { formatAgo } from '../../lib/formatAgo';
import { londonTime } from '../../lib/memberRadarDisplay';
import { useFeedsHealth, isPermissionError } from '../../hooks/useContentDesk';
import { normaliseRankingName, rankingTourLabel, formatPoints, byTourEntries, minutesSince, feedsHeadline } from '../../lib/tourDataDisplay';
import { CC3, NUM, PANEL3, LIST3, PANEL_TITLE, PANEL_META } from '../InboxPanels';
import { btnBrand, btnOutline } from '../InboxQueueRow';
import { LABEL10, FIG18, FIG_SMALL, CAPTION, STATS, LIST_HEAD, PANEL_HEAD, ROW, NAME, SUB, MORE3, EMPTY, CHIP_ROW, chipStyle, chipCount } from './v3Styles';

const DOT = ' \u00b7 ';
/** CONTENT_V3_3: a stale feed is a fault, so warn and danger both read bad. */
type Tone = 'ok' | 'bad' | 'neutral';
const DOT_COLOUR: Record<Tone, string> = { ok: CC3.good, bad: CC3.bad, neutral: CC3.faint };
const RANK: Record<Tone, number> = { bad: 0, neutral: 2, ok: 3 };
const TAG: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const CHEVRON = (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={CC3.faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3l4 4-4 4" /></svg>
);
const SEARCH_ICON = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={CC3.faint} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.75" /><path d="M10.5 10.5 14 14" /></svg>
);

interface FieldPlayer { player_id: string; name: string; country: string | null; tour_codes: string[] | null; headshot_override: string | null; photo_url: string | null; position: number | string | null }

const ago = (iso: string) => formatAgo(iso, { suffix: true });
const n = (v: number | null | undefined) => (v == null ? '-' : Number(v).toLocaleString('en-GB'));
const tourSlug = (codes: string[] | null) => {
  const c = (codes?.[0] ?? 'pga').toLowerCase();
  if (c === 'eur' || c === 'dp' || c === 'dpwt') return 'euro';
  if (c === 'korn-ferry') return 'pgad';
  return c;
};
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** Walk a candidate list until one loads. */
function probe(urls: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) return resolve(false);
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => { i += 1; next(); };
      img.src = urls[i];
    };
    next();
  });
}

/** Probe each field player, at most 6 at a time. */
function useHeadshotProbe(players: FieldPlayer[] | null) {
  const [result, setResult] = useState<Record<string, boolean> | null>(null);
  const key = (players ?? []).map((p) => p.player_id).join('|');
  useEffect(() => {
    if (!players) { setResult(null); return; }
    let cancelled = false;
    const out: Record<string, boolean> = {};
    let cursor = 0;
    const worker = async () => {
      while (!cancelled && cursor < players.length) {
        const p = players[cursor++];
        const urls = resolvePlayerAvatarCandidates({ name: p.name, photoUrl: p.photo_url, headshotOverride: p.headshot_override, tourSlug: tourSlug(p.tour_codes) });
        out[p.player_id] = urls.length ? await probe(urls) : false;
      }
    };
    setResult(null);
    Promise.all(Array.from({ length: Math.min(6, players.length) }, worker)).then(() => { if (!cancelled) setResult({ ...out }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return result;
}

/** All rankings rows for one season (the old list stopped at 500). */
function useSeasonRankings(season: number | null) {
  return useQuery({
    queryKey: ['admin', 'content', 'rankings', season],
    enabled: season != null,
    staleTime: 60_000,
    queryFn: async () => {
      const all: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from('tour_season_rankings')
          .select('id, player_name, position, points, tour_code, player_id, manual_player_id')
          .eq('season_year', season as number)
          .order('position', { ascending: true })
          .range(from, from + 999);
        if (error) throw error;
        all.push(...(data ?? []));
        if ((data?.length ?? 0) < 1000) break;
      }
      return all as { id: string; player_name: string | null; position: number | null; points: number | null; tour_code: string; player_id: string | null; manual_player_id: string | null }[];
    },
  });
}

export default function TourDataSection({
  syncing, syncLabel, onRunSync, onAddPhoto, onOpenDirectory, onOpenPlayer, ownPhoto = null,
}: {
  syncing: boolean;
  syncLabel: string;
  onRunSync: () => Promise<void>;
  onAddPhoto: (p: FieldPlayer) => void;
  onOpenDirectory: () => void;
  /** The caller resolves unlinked names or opens the prefilled directory. */
  onOpenPlayer: (id: string | null, name: string) => void;
  /** Players with neither photo_url nor headshot_override; null while loading. */
  noPhotoSet: number | null;
  /** Players with their own photo_url or headshot_override; null while loading. */
  ownPhoto?: number | null;
}) {
  const q = useFeedsHealth();
  const d = q.data as any;
  const denied = q.isError && isPermissionError(q.error);

  /* ── Feeds ── */
  const feeds = useMemo(() => {
    if (!d) return [];
    const rows: { key: string; title: string; sub: string; tone: Tone; right: React.ReactNode }[] = [];
    const pl = d.players ?? {};
    const plWarn = !pl.last_sync || minutesSince(pl.last_sync) > 30 * 24 * 60;
    rows.push({
      key: 'players', title: 'Player directory', tone: plWarn ? 'bad' : 'ok',
      sub: `${pl.last_sync ? `Last sync ${ago(pl.last_sync)}` : 'No sync on record'}${DOT}${n(pl.count)} players`,
      right: (
        <button type="button" disabled={syncing} onClick={async () => { await onRunSync(); q.refetch(); }}
          style={btnBrand(syncing)}>
          {syncing ? `Syncing ${syncLabel}…` : 'Run now'}
        </button>
      ),
    });
    const live = d.live;
    if (live) {
      const ok = minutesSince(live.last_sync) <= 30;
      rows.push({
        key: 'live', title: 'Live leaderboards', tone: ok ? 'ok' : 'bad',
        sub: `${live.name ?? ''}${DOT}round ${live.current_round ?? '-'}${live.last_sync ? `${DOT}${ago(live.last_sync)}` : ''}`,
        right: <span style={{ ...TAG, color: ok ? CC3.good : CC3.bad }}>Live</span>,
      });
    } else {
      rows.push({ key: 'live', title: 'Live leaderboards', tone: 'neutral', sub: 'No event in progress', right: null });
    }
    const rk = d.rankings ?? {};
    rows.push({
      key: 'rankings', title: 'Season rankings', tone: minutesSince(rk.last_update) > 2 * 24 * 60 ? 'bad' : 'ok',
      sub: `${n(rk.tours)} tours${DOT}${n(rk.rows)} players${rk.last_update ? `${DOT}${ago(rk.last_update)}` : ''}`,
      right: <span style={{ ...TAG, color: CC3.faint }}>Daily</span>,
    });
    const rr = d.round_results ?? {};
    const failed = /^(fail|error)/i.test(String(rr.last_status ?? ''));
    const closed = rr.last
      ? `Last round closed ${new Date(rr.last).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' })} ${londonTime(rr.last)}`
      : 'No round closed on record';
    rows.push({ key: 'results', title: 'Round results', tone: failed ? 'bad' : 'ok', sub: closed, right: <span style={{ ...TAG, color: CC3.faint }}>On finish</span> });
    return rows.sort((a, b) => RANK[a.tone] - RANK[b.tone]);
  }, [d, syncing, syncLabel, onRunSync, q]);

  const failures = Number(d?.failures_24h ?? 0);
  const needs = feeds.filter((f) => f.tone === 'bad').length;
  const head = feedsHeadline(failures, needs);
  const feedHead = (
    <span data-tone={head.tone === 'ok' ? 'ok' : 'bad'} style={{ fontSize: 11, fontWeight: 700, textAlign: 'right', color: head.tone === 'ok' ? CC3.good : CC3.bad }}>
      {head.text}
    </span>
  );

  /* ── Field ── */
  const field = d?.field ?? null;
  const fieldPlayers: FieldPlayer[] | null = field ? (field.players ?? []) : null;
  const probed = useHeadshotProbe(fieldPlayers);
  const [missingShown, setMissingShown] = useState(3);
  const missing = useMemo(() => {
    if (!fieldPlayers || !probed) return [];
    const pos = (p: FieldPlayer) => { const v = Number.parseInt(String(p.position ?? ''), 10); return Number.isFinite(v) ? v : Infinity; };
    return fieldPlayers.filter((p) => !probed[p.player_id]).sort((a, b) => pos(a) - pos(b));
  }, [fieldPlayers, probed]);
  const fieldTotal = fieldPlayers?.length ?? 0;
  const withShot = probed ? fieldTotal - missing.length : null;

  /* ── Rankings ── */
  const season: number | null = d?.rankings?.season ?? null;
  const rk = useSeasonRankings(season);
  const tours = useMemo(() => byTourEntries(d?.rankings?.by_tour).slice().sort((a, b) => b.n - a.n), [d]);
  const [picked, setPicked] = useState<string | null>(null);
  // Default is the largest tour; no breakdown means one unfiltered list.
  const tour: string | null = tours.length ? (picked && tours.some((x) => x.code === picked) ? picked : tours[0].code) : null;
  const tourLabel = tour ? rankingTourLabel(tour) : null;
  const [search, setSearch] = useState('');
  const [rkShown, setRkShown] = useState(10);
  const tourRows = useMemo(() => (rk.data ?? []).filter((r) => tour == null || r.tour_code === tour), [rk.data, tour]);
  const notLinked = tourRows.filter((r) => (r.manual_player_id ?? r.player_id) == null).length;
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return tourRows.filter((r) => !s || (r.player_name ?? '').toLowerCase().includes(s));
  }, [tourRows, search]);
  const rkVisible = rows.slice(0, rkShown);

  if (denied) {
    return <section style={PANEL3}><span style={PANEL_TITLE}>Tour data</span><div style={{ marginTop: 10, fontSize: 12, color: CC3.faint }}>Full admins only</div></section>;
  }

  return (
    <>
      <style>{'.cc3-tour-search::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}.cc3-tour-search::placeholder{color:var(--cc3-faint)}'}</style>
      <section style={LIST3} data-section="feeds">
        <div style={LIST_HEAD}>
          <span style={PANEL_TITLE}>Feeds</span>
          {d && feedHead}
        </div>
        {feeds.map((f) => (
          <div key={f.key} data-feed={f.key} style={{ ...ROW, cursor: 'default', gridTemplateColumns: '10px minmax(0, 1fr) auto', columnGap: 10 }}>
            <span data-tone={f.tone} style={{ display: 'block', width: 8, height: 8, borderRadius: 4, background: DOT_COLOUR[f.tone] }} />
            <span style={{ minWidth: 0 }}>
              <span style={NAME}>{f.title}</span>
              <span style={{ ...SUB, ...NUM, color: f.tone === 'bad' ? CC3.bad : CC3.faint }}>{f.sub}</span>
            </span>
            {f.right}
          </div>
        ))}
      </section>

      <section style={LIST3} data-section="field">
        <div style={LIST_HEAD}>
          <span style={PANEL_TITLE}>This week&rsquo;s field</span>
          {field?.name && <span style={{ ...PANEL_META, textAlign: 'right', overflowWrap: 'anywhere' }}>{field.name}</span>}
        </div>
        {field && (
          <div style={{ padding: '0 14px 12px' }}>
            <div style={FIG18}>{withShot == null ? '\u2014' : n(withShot)} <small style={FIG_SMALL}>of {n(fieldTotal)} with a headshot</small></div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: CC3.track, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${withShot != null && fieldTotal ? Math.round((withShot / fieldTotal) * 100) : 0}%`, background: CC3.ink }} />
            </div>
            <div style={{ ...CAPTION, ...NUM, marginTop: 5 }}>{probed ? `${n(missing.length)} missing \u00b7 leaderboard players first` : 'checking headshots'}</div>
          </div>
        )}
        {!d ? null : !field ? (
          <div style={EMPTY}>No tournament this week</div>
        ) : missing.slice(0, missingShown).map((p) => (
          <div key={p.player_id} style={{ ...ROW, cursor: 'default', gridTemplateColumns: '34px minmax(0, 1fr) auto', columnGap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: '34%', background: 'var(--cc3-initials)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 700, color: CC3.mute }}>{initials(p.name)}</span>
            <span style={{ minWidth: 0 }}>
              <span style={NAME}>{p.name}</span>
              <span style={SUB}>{p.country ?? '-'}{DOT}{p.position != null && p.position !== '' ? 'on the leaderboard' : 'in the field'}</span>
            </span>
            <button type="button" onClick={() => onAddPhoto(p)} style={btnOutline()}>Add photo</button>
          </div>
        ))}
        {field && missing.length > missingShown && (
          <button type="button" onClick={() => setMissingShown((s) => s + 20)} style={MORE3}>{n(missing.length - missingShown)} more missing</button>
        )}
      </section>

      {tours.length > 0 && (
        <div style={CHIP_ROW} data-section="tours">
          {tours.map((c) => {
            const on = tour === c.code;
            return (
              <button key={c.code} type="button" aria-pressed={on} onClick={() => { setPicked(c.code); setSearch(''); setRkShown(10); }} style={chipStyle(on)}>
                {rankingTourLabel(c.code)} <b style={chipCount(on)}>{n(c.n)}</b>
              </button>
            );
          })}
        </div>
      )}

      <section style={LIST3} data-section="rankings">
        <div style={LIST_HEAD}>
          <span style={PANEL_TITLE}>{tourLabel ?? 'Rankings'}{season ? ` ${season}` : ''}</span>
          <span style={{ ...PANEL_META, ...NUM, textAlign: 'right' }}>
            {notLinked > 0 ? <span data-tone="bad" style={{ color: CC3.bad }}>{n(notLinked)} not linked</span> : 'all linked'}{DOT}points
          </span>
        </div>
        <div style={{ padding: '0 14px 10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, height: 40, padding: '0 12px', borderRadius: 12, background: CC3.inset, boxSizing: 'border-box' }}>
            {SEARCH_ICON}
            <input className="cc3-tour-search" type="search" aria-label="Search player" value={search} onChange={(e) => { setSearch(e.target.value); setRkShown(10); }} placeholder={tourLabel ? `Search ${tourLabel}` : 'Search player'}
              style={{ flex: 1, minWidth: 0, width: '100%', border: 0, background: 'transparent', color: CC3.ink, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </label>
        </div>
        {rkVisible.map((r) => {
          // Linked ids keep precedence; the caller resolves unlinked rows.
          const linkedId = r.manual_player_id ?? r.player_id;
          return (
            <button key={r.id} type="button" onClick={() => onOpenPlayer(linkedId, normaliseRankingName(r.player_name))}
              style={{ ...ROW, gridTemplateColumns: '24px minmax(0, 1fr) auto 12px', columnGap: 10 }}>
              <span style={{ ...NUM, fontSize: 13, fontWeight: 700, color: CC3.mute }}>{r.position ?? '-'}</span>
              <span style={{ minWidth: 0 }}>
                <span style={NAME}>{normaliseRankingName(r.player_name)}</span>
                {linkedId == null && <span style={{ ...SUB, color: CC3.bad }}>not linked to the directory</span>}
              </span>
              <span style={{ ...NUM, fontSize: 13.5, fontWeight: 700, color: CC3.ink }}>{formatPoints(r.points)}</span>
              {CHEVRON}
            </button>
          );
        })}
        {!rk.isLoading && rows.length === 0 && <div style={EMPTY}>No players match</div>}
        {rows.length > rkShown && (
          <button type="button" onClick={() => setRkShown((s) => s + 50)} style={MORE3}>{n(rows.length - rkShown)} more</button>
        )}
      </section>

      <section style={PANEL3} data-section="directory">
        <div style={PANEL_HEAD}>
          <span style={PANEL_TITLE}>Player directory</span>
          <button type="button" onClick={onOpenDirectory} style={{ border: 0, background: 'transparent', padding: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: CC3.ink, cursor: 'pointer' }}>Open</button>
        </div>
        <div style={STATS(3)}>
          <div><div style={LABEL10}>Players</div><div style={{ ...FIG18, marginTop: 3 }}>{n(d?.players?.count)}</div></div>
          <div><div style={LABEL10}>Countries</div><div style={{ ...FIG18, marginTop: 3 }}>{n(d?.players?.countries)}</div></div>
          <div><div style={LABEL10}>Own photo</div><div data-figure="own-photo" style={{ ...FIG18, marginTop: 3 }}>{ownPhoto == null ? '\u2014' : n(ownPhoto)}</div><div style={CAPTION}>others use the tour&rsquo;s</div></div>
        </div>
      </section>
    </>
  );
}
