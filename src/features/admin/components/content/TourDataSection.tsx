/**
 * BRIEF_CONTENT_DESK Stage 4 — Tour data (TourData.html). Feeds, field and
 * player figures are get_admin_feeds_health as returned. Run now, Add photo
 * and Open directory hand back to the caller, which owns the existing Sync
 * players action, the headshot override sheet and the player list.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { adminTheme as t } from '../../theme';
import { formatAgo } from '../../lib/formatAgo';
import { londonTime } from '../../lib/memberRadarDisplay';
import { useFeedsHealth, isPermissionError } from '../../hooks/useContentDesk';
import { normaliseRankingName, rankingTourLabel, formatPoints, byTourEntries, minutesSince, feedsHeadline } from '../../lib/tourDataDisplay';
import { desk, SECTION, LIST_SECTION, H, H_RIGHT, FIG_LABEL, MORE, DOT } from './deskTokens';

type Tone = 'ok' | 'warn' | 'danger' | 'neutral';
const DOT_COLOUR: Record<Tone, string> = { ok: t.ok, warn: t.warnText, danger: t.danger, neutral: t.inkFaint };
const RANK: Record<Tone, number> = { danger: 0, warn: 1, neutral: 2, ok: 3 };

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
  syncing, syncLabel, onRunSync, onAddPhoto, onOpenDirectory, onOpenPlayer, noPhotoSet,
}: {
  syncing: boolean;
  syncLabel: string;
  onRunSync: () => Promise<void>;
  onAddPhoto: (p: FieldPlayer) => void;
  onOpenDirectory: () => void;
  /** BRIEF_TOUR_RANKINGS_OPEN_PLAYER — tap a linked ranking row to open the headshot sheet. */
  onOpenPlayer: (id: string, name: string) => void;
  /** Players with neither photo_url nor headshot_override; null while loading. */
  noPhotoSet: number | null;
}) {
  const q = useFeedsHealth();
  const d = q.data as any;
  const denied = q.isError && isPermissionError(q.error);

  /* ── Feeds ── */
  const feeds = useMemo(() => {
    if (!d) return [];
    const rows: { key: string; title: string; sub: string; tone: Tone; subWarn?: boolean; right: React.ReactNode }[] = [];
    const pl = d.players ?? {};
    const plWarn = !pl.last_sync || minutesSince(pl.last_sync) > 30 * 24 * 60;
    rows.push({
      key: 'players', title: 'Player directory', tone: plWarn ? 'warn' : 'ok', subWarn: plWarn,
      sub: `${pl.last_sync ? `Last sync ${ago(pl.last_sync)}` : 'No sync on record'}${DOT}${n(pl.count)} players`,
      right: (
        <button type="button" disabled={syncing} onClick={async () => { await onRunSync(); q.refetch(); }}
          style={{ height: 30, padding: '0 12px', borderRadius: 999, border: 0, background: t.ink, color: t.canvas, fontSize: 11.5, fontWeight: 800, cursor: syncing ? 'default' : 'pointer', opacity: syncing ? 0.7 : 1 }}>
          {syncing ? `Syncing ${syncLabel}…` : 'Run now'}
        </button>
      ),
    });
    const live = d.live;
    if (live) {
      const ok = minutesSince(live.last_sync) <= 30;
      rows.push({
        key: 'live', title: 'Live leaderboards', tone: ok ? 'ok' : 'warn',
        sub: `${live.name ?? ''}${DOT}round ${live.current_round ?? '-'}${live.last_sync ? `${DOT}${ago(live.last_sync)}` : ''}`,
        right: <span style={{ fontSize: 11, fontWeight: 700, color: ok ? t.okText : t.warnText }}>Live</span>,
      });
    } else {
      rows.push({ key: 'live', title: 'Live leaderboards', tone: 'neutral', sub: 'No event in progress', right: null });
    }
    const rk = d.rankings ?? {};
    rows.push({
      key: 'rankings', title: 'Season rankings', tone: minutesSince(rk.last_update) > 2 * 24 * 60 ? 'warn' : 'ok',
      sub: `${n(rk.tours)} tours${DOT}${n(rk.rows)} players${rk.last_update ? `${DOT}${ago(rk.last_update)}` : ''}`,
      right: <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>Daily</span>,
    });
    const rr = d.round_results ?? {};
    const failed = /^(fail|error)/i.test(String(rr.last_status ?? ''));
    const closed = rr.last
      ? `Last round closed ${new Date(rr.last).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/London' })} ${londonTime(rr.last)}`
      : 'No round closed on record';
    rows.push({ key: 'results', title: 'Round results', tone: failed ? 'danger' : 'ok', sub: closed, right: <span style={{ fontSize: 11, fontWeight: 700, color: t.inkMuted }}>On finish</span> });
    return rows.sort((a, b) => RANK[a.tone] - RANK[b.tone]);
  }, [d, syncing, syncLabel, onRunSync, q]);

  const failures = Number(d?.failures_24h ?? 0);
  const needs = feeds.filter((f) => f.tone === 'warn' || f.tone === 'danger').length;
  const head = feedsHeadline(failures, needs);
  const feedHead = (
    <span style={{ fontSize: 11, fontWeight: 700, color: head.tone === 'danger' ? t.dangerText : head.tone === 'warn' ? t.warnText : t.okText }}>
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
  const [tour, setTour] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [rkShown, setRkShown] = useState(10);
  const tours = byTourEntries(d?.rankings?.by_tour);
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (rk.data ?? []).filter((r) => (tour === 'all' || r.tour_code === tour) && (!s || (r.player_name ?? '').toLowerCase().includes(s)));
  }, [rk.data, tour, search]);
  const rkVisible = rows.slice(0, rkShown);

  if (denied) {
    return <section style={SECTION}><span style={H}>Tour data</span><div style={{ marginTop: 10, fontSize: 12, color: t.inkFaint }}>Full admins only</div></section>;
  }

  return (
    <>
      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Feeds</span>
          {d && feedHead}
        </div>
        {feeds.map((f) => (
          <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${t.hairline}` }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: DOT_COLOUR[f.tone] }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.ink }}>{f.title}</span>
              <span style={{ display: 'block', fontSize: 11, color: f.subWarn ? t.warnText : t.inkFaint }}>{f.sub}</span>
            </span>
            {f.right}
          </div>
        ))}
      </section>

      <section style={LIST_SECTION}>
        <div style={{ padding: '0 16px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={H}>This week&rsquo;s field</span>
            {field?.name && <span style={{ ...H_RIGHT, textAlign: 'right' }}>{field.name}</span>}
          </div>
          {field && (
            <>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: t.ink }}>{withShot == null ? '-' : n(withShot)}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: t.inkMuted }}>of {n(fieldTotal)} with a headshot</span>
              </div>
              <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: desk.trackBg, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${withShot != null && fieldTotal ? Math.round((withShot / fieldTotal) * 100) : 0}%`, background: t.ink }} />
              </div>
            </>
          )}
        </div>
        {!d ? null : !field ? (
          <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>No tournament this week</div>
        ) : missing.slice(0, missingShown).map((p) => (
          <div key={p.player_id} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${t.hairline}` }}>
            <span style={{ width: 34, height: 34, borderRadius: 17, background: t.neutralSoft, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: t.inkFaint }}>{initials(p.name)}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.ink }}>{p.name}</span>
              <span style={{ display: 'block', fontSize: 11, color: t.inkFaint }}>{p.country ?? '-'}{DOT}{p.position != null && p.position !== '' ? 'on the leaderboard' : 'in the field'}</span>
            </span>
            <button type="button" onClick={() => onAddPhoto(p)} style={OUTLINE_30}>Add photo</button>
          </div>
        ))}
        {field && missing.length > missingShown && (
          <button type="button" onClick={() => setMissingShown((s) => s + 20)} style={MORE}>{n(missing.length - missingShown)} more missing</button>
        )}
      </section>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ code: 'all', n: Number(d?.rankings?.rows ?? rk.data?.length ?? 0) }, ...tours].map((c) => {
          const on = tour === c.code;
          return (
            <button key={c.code} type="button" aria-pressed={on} onClick={() => { setTour(c.code); setRkShown(10); }} style={{
              flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 999, border: 0,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', background: on ? t.ink : t.surface, color: on ? t.canvas : t.ink,
            }}>{c.code === 'all' ? 'All' : rankingTourLabel(c.code)} <span style={{ fontWeight: 800 }}>{n(c.n)}</span></button>
          );
        })}
      </div>

      <section style={LIST_SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 10px' }}>
          <span style={H}>Rankings{season ? ` ${season}` : ''}</span>
          <span style={H_RIGHT}>points</span>
        </div>
        <div style={{ padding: '0 16px 10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 12px', borderRadius: 12, background: t.neutralSoft }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={t.inkFaint} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" /></svg>
            <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setRkShown(10); }} placeholder="Search player"
              style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', color: t.ink, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </label>
        </div>
        {rkVisible.map((r) => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', padding: '10px 16px', borderTop: `1px solid ${t.hairline}` }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: t.inkMuted }}>{r.position ?? '-'}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.ink }}>{normaliseRankingName(r.player_name)}</span>
              <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.inkFaint }}>{rankingTourLabel(r.tour_code)}</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>{formatPoints(r.points)}</span>
          </div>
        ))}
        {!rk.isLoading && rows.length === 0 && (
          <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${t.hairline}`, fontSize: 12, color: t.inkFaint }}>No rankings</div>
        )}
        {rows.length > rkShown && (
          <button type="button" onClick={() => setRkShown((s) => s + 50)} style={MORE}>{n(rows.length - rkShown)} more</button>
        )}
      </section>

      <section style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={H}>Players</span>
          <button type="button" onClick={onOpenDirectory} style={{ border: 0, background: 'transparent', padding: 0, fontSize: 12, fontWeight: 700, color: t.brandText, cursor: 'pointer' }}>Open directory</button>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <div><div style={FIG_LABEL}>Players</div><div style={FIG_18}>{n(d?.players?.count)}</div></div>
          <div><div style={FIG_LABEL}>Countries</div><div style={FIG_18}>{n(d?.players?.countries)}</div></div>
          <div><div style={FIG_LABEL}>No photo set</div><div style={{ ...FIG_18, color: t.warnText }}>{n(noPhotoSet)}</div></div>
        </div>
      </section>
    </>
  );
}

const FIG_18: React.CSSProperties = { marginTop: 2, fontSize: 18, fontWeight: 800, color: t.ink };
const OUTLINE_30: React.CSSProperties = { height: 30, padding: '0 12px', borderRadius: 999, border: `1px solid ${t.line}`, background: 'transparent', color: t.ink, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' };
