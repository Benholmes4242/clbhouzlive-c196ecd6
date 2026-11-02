/**
 * LinePicksCard — build 2 "Who keeps their card?" card, rendered on the
 * Players front page straight after the LineCard of every stake with picks.
 * Three states (Open / Closed / Settled) from linePicksRules.resolvePickState;
 * all reads and the toggle live in useLinePicks. Amber means "you" only
 * (your picks, your callers row); results use no red and no green.
 */
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { AMBER } from '../../_shared/tokens';
import { PlayerCell } from '../PlayerCell';
import { P, FIG } from '../playersTokens';
import type { PageData } from '../pageModel';
import type { PlayerView } from '../playersModel';
import { ordinal, type Stake } from '../playersRules';
import { useLinePicks, type LinePickCaller, type LinePickRow } from './useLinePicks';
import {
  callersList, closedFoot, closedLine, fmtDdd, fmtDMon, keptTitle, MAX_PICKS, memberShare, openFoot, openLine,
  orderByFinal, pickWindow, resolvePickState, settledLine, type PickState,
} from './linePicksRules';

const kickStyle: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' };
const lineStyle: CSSProperties = { margin: '4px 0 0', fontSize: 13, lineHeight: 1.4, color: P.MUTE };
const footStyle: CSSProperties = { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.HAIR}`, fontSize: 12, lineHeight: 1.45, color: P.MUTE };
const rowGrid = (first: boolean): CSSProperties => ({ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) 92px', columnGap: 10, alignItems: 'center', minHeight: 52, borderTop: first ? 'none' : `1px solid ${P.HAIR}` });
const rankStyle: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: P.MUTE, ...FIG };

function Shell({ state, children }: { state: PickState; children: ReactNode }) {
  return (
    <section data-front-card="picks" data-picks-state={state} style={{ margin: '14px 16px 0', padding: '14px 16px 12px', borderRadius: 18, background: P.CARD, border: `1px solid ${P.CARD_BORDER}` }}>
      {children}
    </section>
  );
}

function Kicker({ left, right }: { left: string; right: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
      <span data-picks-kicker style={kickStyle}>{left}</span>
      <span data-picks-kicker-right style={{ fontSize: 11.5, color: P.DIM, whiteSpace: 'nowrap' }}>{right}</span>
    </div>
  );
}

function TheLine() {
  return (
    <div data-drawn-line style={{ height: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flex: 1, height: 1, background: P.RULE }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, whiteSpace: 'nowrap' }}>THE LINE</span>
      <span style={{ flex: 1, height: 1, background: P.RULE }} />
    </div>
  );
}

function CrowdBar({ share }: { share: number }) {
  return (
    <span data-crowd-bar style={{ display: 'block', marginTop: 5, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <span style={{ display: 'block', height: '100%', width: `${share}%`, borderRadius: 2, background: 'rgba(248,250,252,0.5)' }} />
    </span>
  );
}

export function LinePicksCard({ stake, data, now = new Date() }: { stake: Stake; data: PageData; now?: Date }) {
  const state = resolvePickState(data.race, stake, now);
  const L = stake.after_position;
  const year = data.race?.season_year ?? 0;
  const { picks, result, callers, toggle } = useLinePicks(data.tour, year, L, { enabled: state !== 'hidden', settled: state === 'settled' });
  const gate = useGuestActionGate();
  const navigate = useNavigate();

  const rows = useMemo(() => picks.data ?? [], [picks.data]);
  const byKey = useMemo(() => new Map(rows.map((r) => [r.player_key, r])), [rows]);
  const mine = useMemo(() => new Set(rows.filter((r) => r.mine).map((r) => r.player_key)), [rows]);
  const total = result.data?.total_pickers ?? rows[0]?.total_pickers ?? 0;
  const lastEvent = data.events[data.events.length - 1];

  const viewed = useRef(false);
  useEffect(() => {
    if (state === 'hidden' || viewed.current) return;
    viewed.current = true;
    analyticsEvents.track('tour_line_picks_viewed', { state, tour: data.tour, after: L });
  }, [state, data.tour, L]);

  if (state === 'hidden') return null;
  const title = stake.picks_title ?? 'WHO KEEPS THEIR CARD?';

  if (state === 'settled') {
    const r = result.data;
    const myPicks = orderByFinal(rows.filter((x) => x.mine));
    const list = callersList(callers.data ?? []);
    return (
      <Shell state="settled">
        <Kicker left={keptTitle(title)} right={`Settled ${fmtDdd(stake.settled_at!)}`} />
        <p data-picks-line style={lineStyle}>
          {settledLine({ viewer_picks: r?.viewer_picks ?? 0, viewer_correct: r?.viewer_correct ?? 0, all_correct: r?.all_correct ?? 0, total_pickers: r?.total_pickers ?? total })
            .map((x, i) => (x.bold ? <b key={i} style={{ color: P.INK, fontWeight: 700 }}>{x.text}</b> : <span key={i}>{x.text}</span>))}
        </p>
        {myPicks.length ? (
          <div style={{ marginTop: 8 }}>
            {myPicks.map((p, i) => <VerdictRow key={p.player_key} pick={p} player={data.players.find((x) => x.key === p.player_key)} L={L} first={i === 0} />)}
          </div>
        ) : null}
        {list.length ? (
          <>
            <div style={{ marginTop: 12, marginBottom: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.DIM }}>WHO CALLED IT</div>
            {list.map((c, i) => (
              <CallerRow key={c.user_id} c={c} first={i === 0} onOpen={() => {
                analyticsEvents.track('tour_line_pick_caller_tapped', { tour: data.tour, after: L, viewer: c.is_viewer });
                navigate(`/profile/${c.username ?? c.user_id}`);
              }} />
            ))}
          </>
        ) : null}
        <div data-card-foot style={footStyle}>Ranked by correct picks, then by who picked first.</div>
      </Shell>
    );
  }

  const { window, extra } = pickWindow(data.players, L, mine);
  const open = state === 'open';
  const count = mine.size;

  const onTap = (p: PlayerView) => {
    if (gate('pick')) {
      analyticsEvents.track('tour_line_pick_blocked', { reason: 'guest', tour: data.tour, after: L });
      return;
    }
    const on = !mine.has(p.key);
    if (on && count >= MAX_PICKS) {
      analyticsEvents.track('tour_line_pick_blocked', { reason: 'max', tour: data.tour, after: L });
      return;
    }
    if (resolvePickState(data.race, stake, new Date()) !== 'open') {
      analyticsEvents.track('tour_line_pick_blocked', { reason: 'closed', tour: data.tour, after: L });
      return;
    }
    toggle.mutate(
      { playerKey: p.key, playerId: p.playerId, playerName: p.rawName, position: p.rank, on },
      {
        onSuccess: (n) => analyticsEvents.track('tour_line_pick_set', { tour: data.tour, after: L, on, count: n }),
        onError: () => {
          analyticsEvents.track('tour_line_pick_blocked', { reason: 'error', tour: data.tour, after: L });
          toast.error("Couldn't save your pick. Try again.");
        },
      },
    );
  };

  const row = (p: PlayerView, first: boolean) => {
    const share = memberShare(byKey.get(p.key)?.pickers, total);
    const picked = mine.has(p.key);
    const full = !picked && count >= MAX_PICKS;
    return (
      <div key={p.key} data-pick-row={p.rank} style={rowGrid(first)}>
        <span style={rankStyle}>{p.rank}</span>
        <PlayerCell rawName={p.rawName} name={p.name} tourCode={p.tourCode} country={p.country} followed={p.followed} nameSize={14}
          sub={<span data-share={share}>{share}% of members</span>} bar={<CrowdBar share={share} />} />
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {open ? (
            <button type="button" data-pick-button aria-pressed={picked} onClick={() => onTap(p)}
              style={{ height: 30, padding: '0 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', cursor: full ? 'default' : 'pointer', opacity: full ? 0.4 : 1,
                background: picked ? AMBER : 'transparent', border: `1px solid ${picked ? AMBER : 'rgba(255,255,255,0.12)'}`, color: picked ? '#0A0A0C' : P.INK }}>
              {picked ? 'Picked' : 'Keeps card'}
            </button>
          ) : picked ? (
            <span data-your-pick style={{ height: 26, padding: '0 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', background: 'rgba(247,147,30,0.14)', color: AMBER }}>Your pick</span>
          ) : null}
        </span>
      </div>
    );
  };

  const lastName = lastEvent?.name ?? 'final event';
  return (
    <Shell state={state}>
      <Kicker left={title} right={open ? `Closes ${fmtDdd(data.race!.picks_close_at!)}` : 'Picks closed'} />
      <p data-picks-line style={lineStyle}>{open ? openLine(L) : closedLine(lastName, lastEvent?.endDate, now)}</p>
      <div data-pick-rows style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
        {window.map((p, i) => (
          <div key={p.key} style={{ display: 'contents' }}>
            {row(p, i === 0 || window[i - 1]?.rank === L)}
            {p.rank === L ? <TheLine /> : null}
          </div>
        ))}
        {extra.map((p) => row(p, false))}
      </div>
      <div data-card-foot style={footStyle}>{open ? openFoot(count, total, lastName) : closedFoot(total, count)}</div>
    </Shell>
  );
}

function VerdictRow({ pick, player, L, first }: { pick: LinePickRow; player: PlayerView | undefined; L: number; first: boolean }) {
  const kept = pick.result ? pick.result === 'kept' : pick.final_position != null && pick.final_position <= L;
  const name = player?.name ?? pick.player_name;
  return (
    <div data-verdict-row={pick.player_key} data-verdict={kept ? 'kept' : 'missed'} style={rowGrid(first)}>
      <span style={rankStyle}>{pick.final_position ?? '–'}</span>
      <PlayerCell rawName={player?.rawName ?? pick.player_name} name={name} tourCode={player?.tourCode ?? null} country={player?.country ?? null} followed={false} nameSize={14}
        sub={pick.position_at_pick ? `Picked at ${ordinal(pick.position_at_pick)}` : undefined} />
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', color: kept ? P.INK : P.DIM }}>
        <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, flex: 'none',
          background: kept ? P.INK : 'transparent', border: kept ? 'none' : '1px solid rgba(255,255,255,0.12)', color: kept ? '#0A0A0C' : P.DIM }}>{kept ? '✓' : '✕'}</span>
        {kept ? 'Kept card' : 'Missed out'}
      </span>
    </div>
  );
}

function CallerRow({ c, first, onOpen }: { c: LinePickCaller; first: boolean; onOpen: () => void }) {
  const you = c.is_viewer;
  const name = you ? 'You' : (c.display_name || c.username || '');
  const initials = (c.display_name || c.username || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button type="button" data-caller-row={c.rank} data-caller-viewer={you || undefined} onClick={onOpen}
      style={{ width: '100%', display: 'grid', gridTemplateColumns: '22px 28px minmax(0,1fr) auto', columnGap: 10, alignItems: 'center', minHeight: 40, padding: 0, border: 0, borderTop: first ? 'none' : `1px solid ${P.HAIR}`, background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: P.INK }}>
      <span style={{ ...rankStyle, color: you ? AMBER : P.MUTE }}>{c.rank}</span>
      <SquircleAvatar size={28} src={c.profile_photo_url} userId={c.user_id} fallback={initials} alt={name} />
      <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: you ? AMBER : P.INK }}>{name}</span>
      <span style={{ fontSize: 12, color: P.MUTE, whiteSpace: 'nowrap', ...FIG }}>{`${c.correct} of ${c.picks} · picked ${fmtDMon(c.last_picked_at)}`}</span>
    </button>
  );
}
