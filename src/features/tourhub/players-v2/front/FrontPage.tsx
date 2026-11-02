/**
 * FrontPage — the Players front page (signed-off build 1 mock): title row,
 * season hero, situation sentence, race clock, featured line cards, the race,
 * your players, in form, stat leaders, the All-players button and the footer.
 * Every sentence comes from playersRules; nothing here invents a line.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { AMBER } from '../../_shared/tokens';
import { Headshot, Move, PlayerCell, PointsBar, useHeadshot } from '../PlayerCell';
import { FormTiles } from '../field/FormTiles';
import { P, FIG } from '../playersTokens';
import type { PageActions, PageData, CardName } from '../pageModel';
import type { PlayerView } from '../playersModel';
import { statList } from '../playersModel';
import { LinePicksCard } from '../picks/LinePicksCard';
import {
  barPct, effectiveStatus, todayIso, featuredStakes, fmtInt, fmtWeekdayDate, footerCaption, heroHeadline, heroSub, lineCardLine, lineGap,
  ordinal, OTHER_TILE_KEYS, PGA_TILE_KEYS, raceCardLine, situationSentence, STAT_DEFS, type Rich, type Stake,
} from '../playersRules';

export function RichText({ rich, boldColor = P.INK, boldWeight = 700 }: { rich: Rich; boldColor?: string; boldWeight?: number }) {
  return <>{rich.map((r, i) => (r.bold ? <b key={i} style={{ color: boldColor, fontWeight: boldWeight }}>{r.text}</b> : <span key={i}>{r.text}</span>))}</>;
}

export function SearchButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: `1px solid ${P.HAIR2}`, background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}>
      <Search size={16} color={P.INK} />
    </button>
  );
}

const kickStyle: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' };
const moreStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: P.MUTE, background: 'none', border: 0, padding: 0, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' };
const chStyle: CSSProperties = { margin: '4px 0 0', fontSize: 13, lineHeight: 1.4, color: P.MUTE };

function Card({ first, children, name }: { first?: boolean; children: ReactNode; name: string }) {
  return (
    <section data-front-card={name} style={{ margin: `${first ? 20 : 14}px 16px 0`, padding: '14px 16px 12px', borderRadius: 18, background: P.CARD, border: `1px solid ${P.CARD_BORDER}` }}>
      {children}
    </section>
  );
}

function Kick({ left, right, amber }: { left: string; right?: ReactNode; amber?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
      <span style={{ ...kickStyle, color: amber ? AMBER : P.INK }}>{left}</span>
      {typeof right === 'string' ? <span style={{ fontSize: 11.5, color: P.DIM, whiteSpace: 'nowrap' }}>{right}</span> : right}
    </div>
  );
}

function MiniRow({ p, actions, card, sub, race, leaderPts, first }: { p: PlayerView; actions: PageActions; card: CardName; sub?: ReactNode; race?: boolean; leaderPts?: number | null; first?: boolean }) {
  return (
    <button
      type="button"
      data-mini-row={p.rank}
      onClick={() => actions.goPlayer(p, card)}
      style={{ width: '100%', display: 'grid', gridTemplateColumns: race ? '28px minmax(0,1fr) 36px 52px' : '28px minmax(0,1fr) auto 52px', columnGap: 10, alignItems: 'center', minHeight: race ? 52 : 40, padding: 0, border: 0, borderTop: first ? 'none' : `1px solid ${P.HAIR}`, background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: P.INK }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 700, color: P.MUTE, ...FIG }}>{p.rank}</span>
      <PlayerCell rawName={p.rawName} name={p.name} tourCode={p.tourCode} country={p.country} followed={p.followed} nameSize={14} sub={sub}
        bar={race ? <PointsBar pct={barPct(p.points, leaderPts ?? null)} lead={p.rank === 1} mt={6} /> : undefined} />
      <Move moved={p.moved} size={11} />
      <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, ...FIG }}>{p.points != null ? fmtInt(p.points) : ''}</span>
    </button>
  );
}

function Minis({ children }: { children: ReactNode }) {
  return <div data-minis style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>{children}</div>;
}

function Hero({ data }: { data: PageData }) {
  const [leader, second] = data.players;
  if (!leader) return null;
  const gap = leader.points != null && second?.points != null ? Math.round(leader.points - second.points) : null;
  const headline = heroHeadline({ status: effectiveStatus(data.race, todayIso()), leaderPts: leader.points, secondPts: second?.points ?? null, leaderName: leader.name });
  const sub = heroSub({ wins: leader.wins, top10s: leader.top10s, events: leader.events, gap, secondName: second?.name ?? null });
  let scoring: string | null = null;
  if (data.isPga) {
    const v = leader.source.pga?.scoring_average;
    if (v != null && Number(v) > 0) scoring = Number(v).toFixed(2);
  } else {
    const c = leader.playerId ? data.scorecard?.get(leader.playerId) : undefined;
    if (c && c.rounds >= 30 && c.scoring_avg) scoring = c.scoring_avg.toFixed(2);
  }
  const figs: Array<[string, string]> = [[leader.points != null ? fmtInt(leader.points) : '–', 'PTS'], [String(leader.wins ?? 0), 'WINS']];
  if (scoring) figs.push([scoring, 'SCORING']);
  return (
    <section data-players-hero style={{ position: 'relative', marginTop: 16, height: 330, overflow: 'hidden', background: 'linear-gradient(180deg, #59606B 0%, #2A2D33 55%, #0A0A0C 100%)' }}>
      <HeroPortrait p={leader} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.15) 60%, rgba(10,10,12,0) 100%), linear-gradient(180deg, rgba(10,10,12,0) 55%, rgba(10,10,12,0.85) 100%)' }} />
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 22 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(248,250,252,0.72)' }}>THE SEASON</div>
        <h2 data-hero-headline style={{ margin: '8px 0 0', maxWidth: 240, fontSize: 28, lineHeight: 1.08, fontWeight: 800, color: P.INK }}>{headline}</h2>
        {sub ? <p style={{ margin: '8px 0 0', maxWidth: 250, fontSize: 13, lineHeight: 1.4, color: 'rgba(248,250,252,0.78)' }}>{sub}</p> : null}
        <div style={{ marginTop: 14, display: 'flex', gap: 22 }}>
          {figs.map(([v, l]) => (
            <div key={l}>
              <b style={{ display: 'block', fontSize: 22, fontWeight: 800, lineHeight: 1, color: P.INK, ...FIG }}>{v}</b>
              <span style={{ display: 'block', marginTop: 5, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.6)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroPortrait({ p }: { p: PlayerView }) {
  return <HeroImg rawName={p.rawName} name={p.name} tourCode={p.tourCode} />;
}

function HeroImg({ rawName, name, tourCode }: { rawName: string; name: string; tourCode: string | null }) {
  const { src, onError } = useHeadshot(rawName, name, tourCode);
  if (!src) return null;
  const mask = 'linear-gradient(90deg, transparent 0%, #000 28%), linear-gradient(180deg, #000 70%, transparent 100%)';
  return (
    <img src={src} alt="" aria-hidden="true" onError={onError} style={{ position: 'absolute', right: -60, bottom: 0, height: 290, width: 'auto', WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } as CSSProperties} />
  );
}

function Clock({ data }: { data: PageData }) {
  const race = data.race;
  if (!race || effectiveStatus(race, todayIso()) !== 'live' || !race.phase_start || !data.events.length) return null;
  const left = data.events.filter((e) => !e.finished);
  const next = left[0];
  return (
    <div data-race-clock style={{ margin: '16px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.DIM, textTransform: 'uppercase' }}>{race.phase_label ?? ''}</span>
        <span data-clock-left style={{ fontSize: 11.5, fontWeight: 600, color: P.MUTE }}>{left.length} to go</span>
      </div>
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: `repeat(${data.events.length}, 1fr)`, gap: 4 }}>
        {data.events.map((e) => <i key={e.id} data-seg={e.finished ? 'done' : 'todo'} style={{ height: 4, borderRadius: 2, background: e.finished ? P.INK : 'rgba(255,255,255,0.10)' }} />)}
      </div>
      {next ? (
        <div style={{ marginTop: 8, fontSize: 12, color: P.MUTE }}>
          Next: <b style={{ color: P.INK, fontWeight: 600 }}>{next.name}</b> · {fmtWeekdayDate(next.startDate)}
        </div>
      ) : null}
    </div>
  );
}

function TheLine({ label }: { label: string }) {
  return (
    <div data-drawn-line style={{ height: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flex: 1, height: 1, background: P.RULE }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: P.RULE }} />
    </div>
  );
}

function LineCard({ stake, data, actions, first }: { stake: Stake; data: PageData; actions: PageActions; first: boolean }) {
  const L = stake.after_position;
  const above = data.players.slice(Math.max(0, L - 3), L);
  const below = data.players.slice(L, L + 3);
  const at = data.players[L - 1];
  const gap = lineGap(data.players, L);
  return (
    <Card first={first} name="line">
      <Kick left={stake.kicker ?? stake.line_label} right={stake.side ?? undefined} />
      <p style={chStyle}><RichText rich={lineCardLine(stake, gap)} /></p>
      <Minis>
        {above.map((p, i) => <MiniRow key={p.key} first={i === 0} p={p} actions={actions} card="line" />)}
        <TheLine label={`${ordinal(L)} · ${at?.points != null ? fmtInt(at.points) : '–'} PTS`} />
        {below.map((p, i) => <MiniRow key={p.key} first={i === 0} p={p} actions={actions} card="line" />)}
      </Minis>
      {stake.foot ? <div data-card-foot style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.HAIR}`, fontSize: 12, color: P.MUTE }}>{stake.foot}</div> : null}
    </Card>
  );
}

function RaceCard({ data, actions, first }: { data: PageData; actions: PageActions; first: boolean }) {
  const top = data.players.slice(0, 5);
  if (!top.length) return null;
  const line = raceCardLine(data.players);
  const leaderPts = data.players[0]?.points ?? null;
  return (
    <Card first={first} name="race">
      <Kick left="THE RACE" right={<button type="button" style={moreStyle} onClick={() => actions.openAll({ from: 'race', lens: 'standings' })}>Full standings ›</button>} />
      {line ? <p style={chStyle}><RichText rich={line} /></p> : null}
      <Minis>{top.map((p, i) => <MiniRow key={p.key} first={i === 0} p={p} actions={actions} card="race" race leaderPts={leaderPts} />)}</Minis>
    </Card>
  );
}

function YourPlayersCard({ data, actions }: { data: PageData; actions: PageActions }) {
  const followed = data.players.filter((p) => p.followed);
  if (!followed.length) return null;
  const leaderPts = data.players[0]?.points ?? null;
  return (
    <Card name="your_players">
      <Kick left="YOUR PLAYERS" amber right={`${followed.length} followed`} />
      <Minis>
        {followed.slice(0, 5).map((p, i) => (
          <MiniRow key={p.key} first={i === 0} p={p} actions={actions} card="your_players"
            sub={p.rank === 1 ? 'Leading' : leaderPts != null && p.points != null ? `${fmtInt(leaderPts - p.points)} behind` : undefined} />
        ))}
      </Minis>
    </Card>
  );
}

function InFormCard({ data, actions }: { data: PageData; actions: PageActions }) {
  const top = data.form.slice(0, 3);
  if (!top.length) return null;
  return (
    <Card name="in_form">
      <Kick left="IN FORM" right={<button type="button" style={moreStyle} onClick={() => actions.openAll({ from: 'form', lens: 'form' })}>All ›</button>} />
      <p style={chStyle}>Last five starts, latest on the right.</p>
      <div style={{ marginTop: 8 }}>
        {top.map((e, i) => (
          <button key={e.row.key} type="button" data-form-row onClick={() => actions.goPlayer(e.row, 'in_form')}
            style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 135px', columnGap: 10, alignItems: 'center', minHeight: 52, padding: 0, border: 0, borderTop: i ? `1px solid ${P.HAIR}` : 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: P.INK }}>
            <PlayerCell rawName={e.row.rawName} name={e.row.name} tourCode={e.row.tourCode} country={e.row.country} followed={e.row.followed} nameSize={14} sub={`Avg finish ${e.avg.toFixed(1)}`} />
            <FormTiles starts={e.starts} />
          </button>
        ))}
      </div>
    </Card>
  );
}

function StatLeadersCard({ data, actions }: { data: PageData; actions: PageActions }) {
  const keys = data.isPga ? PGA_TILE_KEYS : OTHER_TILE_KEYS;
  const tiles = keys
    .map((k) => ({ k, d: STAT_DEFS[k], lead: statList(k, data.players, data.isPga, data.scorecard)[0] }))
    .filter((t) => t.lead);
  if (!tiles.length) return null;
  return (
    <Card name="stat_leaders">
      <Kick left="STAT LEADERS" right={<button type="button" style={moreStyle} onClick={() => actions.openAll({ from: 'stats', lens: 'stats' })}>All stats ›</button>} />
      <p style={chStyle}>{data.isPga ? 'Players with 15 or more starts.' : 'Players with 30 or more rounds.'}</p>
      <div style={{ margin: '10px 0 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {tiles.map(({ k, d, lead }) => (
          <button key={k} type="button" data-stat-tile={k} onClick={() => actions.openAll({ from: 'stats', lens: 'stats', stat: k })}
            style={{ padding: '12px 12px 11px', borderRadius: 14, border: `1px solid ${P.HAIR2}`, background: 'transparent', textAlign: 'left', cursor: 'pointer', minWidth: 0, fontFamily: 'inherit', color: P.INK }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: P.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>{d.label}</div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, lineHeight: 1, ...FIG }}>{lead!.display}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <Headshot rawName={lead!.row.rawName} name={lead!.row.name} tourCode={lead!.row.tourCode} size={22} radius={7} />
              <span style={{ fontSize: 12.5, color: P.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead!.row.name}</span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function FrontPage({ data, actions }: { data: PageData; actions: PageActions }) {
  const lines = data.race ? featuredStakes(data.stakes) : [];
  const sentence = situationSentence({
    status: effectiveStatus(data.race, todayIso()),
    hasPhase: !!data.race?.phase_start,
    events: data.events,
    lines: lines.map((stake) => ({ stake, gap: lineGap(data.players, stake.after_position) })),
  });
  const n = data.players.length;
  return (
    <div data-players-front>
      <div style={{ margin: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.15, fontWeight: 800, color: P.INK }}>{data.title}</h1>
        <SearchButton label="Search players" onClick={() => actions.openAll({ from: 'search', search: true })} />
      </div>
      <Hero data={data} />
      {sentence ? <p data-situation style={{ margin: '18px 24px 0', fontSize: 13.5, lineHeight: 1.45, color: P.MUTE }}><RichText rich={sentence} /></p> : null}
      <Clock data={data} />
      {lines.map((stake, i) => (
        <div key={stake.after_position} style={{ display: 'contents' }}>
          <LineCard stake={stake} data={data} actions={actions} first={i === 0} />
          {stake.picks ? <LinePicksCard stake={stake} data={data} /> : null}
        </div>
      ))}
      <RaceCard data={data} actions={actions} first={lines.length === 0} />
      <YourPlayersCard data={data} actions={actions} />
      <InFormCard data={data} actions={actions} />
      <StatLeadersCard data={data} actions={actions} />
      <button type="button" data-all-players onClick={() => actions.openAll({ from: 'button', lens: 'standings' })}
        style={{ margin: '18px 16px 0', width: 'calc(100% - 32px)', height: 50, borderRadius: 14, border: `1px solid ${P.HAIR2}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', cursor: 'pointer', fontFamily: 'inherit', color: P.INK }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>All {n} players</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: P.MUTE }}>Standings, form, stats ›</span>
      </button>
      <div style={{ margin: '18px 24px 0', textAlign: 'center', fontSize: 11, color: P.DIM }}>{footerCaption(n, data.title, data.updatedAt)}</div>
    </div>
  );
}

export function FrontSkeleton() {
  const block = (h: number, m = '14px 16px 0', r = 18) => <div style={{ margin: m, height: h, borderRadius: r, background: P.CARD }} />;
  return (
    <div data-players-skeleton aria-busy="true">
      <div style={{ margin: '22px 24px 0', height: 36, display: 'flex', alignItems: 'center' }}><div style={{ width: 140, height: 22, borderRadius: 6, background: P.CARD }} /></div>
      <div style={{ marginTop: 16, height: 330, background: P.CARD }} />
      <div style={{ margin: '18px 24px 0', height: 58, borderRadius: 8, background: P.CARD }} />
      {block(330, '20px 16px 0')}
      {block(330)}
      {block(300)}
    </div>
  );
}
