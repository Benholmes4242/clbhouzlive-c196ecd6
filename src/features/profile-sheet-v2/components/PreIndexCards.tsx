/**
 * ProfileSheetV2 — PART THREE, the states before a usable index.
 * ONE ASK, IN THE INDEX CARD'S SLOT, AND NOWHERE ELSE (H).
 *
 * CARRIED ACROSS FROM GhostCard (BRIEF_ACCOUNT_SHEET_REBUILD A) — NOT UP FOR
 * RE-LITIGATION: NO FIGURES ANYWHERE on the connect card; nothing on it may be
 * mistaken for the member's own data. No svg, path, gradient or swatch that
 * could read as a trace, an axis or a key. A line with a legend is a READING,
 * and there is nothing to read. Do not reintroduce a sample trend as a nice touch.
 *
 * FEDERATION-NEUTRAL BEFORE A COUNTRY IS PICKED: sixteen more governing bodies
 * are pending, so the connect and manual cards name NO union. Syncing and
 * failing may, because the connection knows it — always interpolated.
 *
 * Honest dead ends only (ComingSoonScreen): no notify-me, no waitlist, no
 * manual round entry. No dismiss control on any of these cards (H.9).
 */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';
import { formatIndex } from '../sheetState';
import { CARD, CARD_LABEL, SAY, BIG, Cta, CardHead } from './sheetCardParts';

const CONNECT_ROUTE = '/manage/handicap';

/** H.3 — names the three cards that appear on connecting: index, form, courses. */
const UNLOCKS: { main: string; tail?: string }[] = [
  { main: 'Your index, tracked every day', tail: ' \u2014 and where it is heading' },
  { main: 'Every round, hole by hole', tail: ' \u2014 and how it compares to your handicap' },
  { main: 'Your scoring at every course you play' },
];

export const ConnectCard: React.FC<{ onNavigate: (r: string) => void }> = ({ onNavigate }) => (
  <div data-card="connect" style={{ ...CARD, padding: '15px 14px 14px' }}>
    <span style={CARD_LABEL}>Your handicap</span>
    <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.022em', marginTop: 8, lineHeight: 1.22, color: A.INK }}>
      clbhouz is quiet until it knows your game.
    </div>
    <div style={{ ...SAY, marginTop: 7 }}>
      Connect once and your rounds arrive on their own {'\u2014'} no typing scores in, ever.
    </div>
    <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
      {UNLOCKS.map((u) => (
        <div key={u.main} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span aria-hidden style={{
            width: 19, height: 19, borderRadius: 6, flex: '0 0 19px', background: A.TRACK, color: A.INK,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
            fontSize: 11, fontWeight: 900, lineHeight: 1,
          }}>{'\u2713'}</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.35, color: A.INK, fontWeight: 600 }}>
            {u.main}{u.tail && <span style={{ color: A.DIM, fontWeight: 500 }}>{u.tail}</span>}
          </span>
        </div>
      ))}
    </div>
    <Cta label="Connect your handicap" onClick={() => onNavigate(CONNECT_ROUTE)} />
    <div style={{ fontSize: 11, lineHeight: 1.45, color: A.DIM, marginTop: 10, textAlign: 'center' }}>
      You{'\u2019'}ll choose your golf union next.
    </div>
  </div>
);

/** H.5 — a typed number has no history: no chart, no trend, no chip. */
export const ManualCard: React.FC<{ index: number; onNavigate: (r: string) => void }> = ({ index, onNavigate }) => (
  <div data-card="manual" style={CARD}>
    <CardHead label="Handicap index" />
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginTop: 9 }}>
      <span style={BIG}>{formatIndex(index)}</span>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.DIM,
        border: `1px solid ${A.BORDER}`, borderRadius: 999, padding: '3px 8px', marginLeft: 'auto',
      }}>Set by you</span>
    </div>
    <div style={SAY}>
      A figure you typed in. Connect your official handicap and this becomes your real index, updated after every round.
    </div>
    <Cta label="Connect your handicap" onClick={() => onNavigate(CONNECT_ROUTE)} />
  </div>
);

/** H.6 — deliberate, not a skeleton: no shimmer, no pulse, NO call to action. */
export const SyncingCard: React.FC<{ body: string }> = ({ body }) => (
  <div data-card="syncing" style={CARD}>
    <CardHead label="Handicap index" right={<span style={{ fontSize: 11, fontWeight: 700, color: A.AMBER }}>{'\u21BB'} Syncing</span>} />
    <div style={{
      height: 44, marginTop: 11, borderRadius: 9,
      background: `repeating-linear-gradient(135deg, transparent 0 7px, ${A.SOFT} 7px 14px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', textAlign: 'center',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: A.DIM,
    }}>Your first sync is on its way</div>
    <div style={SAY}>
      Connected to {body}. Your index and your rounds land here as soon as they arrive, usually within a few minutes.
    </div>
  </div>
);

/** H.7 — the state that was invisible: a stopped sync, said plainly, one way back. */
export const FailingCard: React.FC<{ body: string; lastSyncedAt: string | null; onNavigate: (r: string) => void }> = ({ body, lastSyncedAt, onNavigate }) => {
  const when = lastSyncedAt ? playDateStandalone(lastSyncedAt) : '';
  return (
    <div data-card="failing" style={CARD}>
      <CardHead label="Handicap index" right={
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.RED }}>Not syncing</span>
      } />
      <div style={{ marginTop: 10, borderLeft: `2px solid ${A.RED}`, paddingLeft: 10, fontSize: 12.5, lineHeight: 1.4, color: A.MUTE }}>
        <b style={{ color: A.INK, fontWeight: 700 }}>We cannot reach {body} for your account.</b>
        {when && <> Your last sync was on {when}.</>} Reconnecting takes about a minute.
      </div>
      <Cta label="Reconnect" onClick={() => onNavigate(CONNECT_ROUTE)} />
    </div>
  );
};
