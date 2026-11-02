/**
 * FullField — "All {N} players" (?view=all): back, title, search, the lens
 * sentence, Standings / Form / Stats chips, the pills row, the column header
 * and the list. Lines are drawn after every tour_stakes position.
 */
import { Fragment, useMemo, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ChevronLeft, Search, X } from 'lucide-react';
import { AMBER } from '../../_shared/tokens';
import { getScoreColor } from '../../_shared/scoreColor';
import { fmtScore } from '../../utils/fmtScore';
import { Move, PlayerCell, PointsBar } from '../PlayerCell';
import { FormTiles, Tile } from './FormTiles';
import { SearchButton } from '../front/FrontPage';
import { P, FIG } from '../playersTokens';
import type { PageData, PageActions } from '../pageModel';
import { statList, statValue, type PlayerView } from '../playersModel';
import {
  barPct, careerLine, featuredStakes, fmtInt, fmtShortDate, formSentence, gapLineFor, LENSES, OTHER_STAT_ORDER,
  PGA_STAT_ORDER, statCaption, statSentence, STAT_DEFS, type Lens,
} from '../playersRules';

export interface FullFieldProps {
  data: PageData;
  actions: PageActions;
  lens: Lens;
  stat: string;
  onLens: (lens: Lens) => void;
  onStat: (stat: string) => void;
  onBack: () => void;
  search: string;
  onSearch: (v: string) => void;
  searchOpen: boolean;
  onSearchOpen: (open: boolean) => void;
  searchRef: RefObject<HTMLInputElement>;
  query: string;
}

const LENS_LABEL: Record<Lens, string> = { standings: 'Standings', form: 'Form', stats: 'Stats' };
const STANDINGS_SENTENCE = 'The lines show what each place is worth. Players within three places of a line show how far they are from it.';

const rowStyle: CSSProperties = { width: '100%', display: 'grid', columnGap: 10, alignItems: 'center', minHeight: 62, padding: '10px 24px', border: 0, borderBottom: `1px solid ${P.HAIR}`, background: 'transparent', color: P.INK, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' };
const pillStyle = (on: boolean, you = false): CSSProperties => ({ flex: 'none', height: 30, padding: '0 12px', borderRadius: 999, border: `1px solid ${on ? P.INK : P.HAIR2}`, background: on ? P.INK : 'transparent', color: on ? P.CANVAS : you ? AMBER : P.MUTE, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' });
const capStyle: CSSProperties = { margin: '14px 24px 0', fontSize: 11.5, lineHeight: 1.5, color: P.DIM };

function Rank({ value, first }: { value: ReactNode; first: boolean }) {
  return <span style={{ fontSize: 14, fontWeight: 700, color: first ? P.INK : P.MUTE, ...FIG }}>{value}</span>;
}

function scrollToSel(sel: string) {
  const el = document.querySelector(sel);
  if (el && 'scrollIntoView' in el) (el as HTMLElement).scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function Cols({ grid, cells }: { grid: string; cells: Array<[string, boolean?]> }) {
  return (
    <div data-cols style={{ whiteSpace: 'nowrap', display: 'grid', gridTemplateColumns: grid, columnGap: 10, alignItems: 'end', margin: '16px 24px 0', paddingBottom: 6, borderBottom: `1px solid ${P.HAIR}`, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: P.DIM }}>
      {cells.map(([t, r], i) => <span key={i} style={{ textAlign: r ? 'right' : 'left' }}>{t}</span>)}
    </div>
  );
}

function StandingsList({ data, actions, rows }: { data: PageData; actions: PageActions; rows: PlayerView[] }) {
  const leaderPts = data.players[0]?.points ?? null;
  const stakeAt = new Map(data.stakes.map((s) => [s.after_position, s]));
  const featured = featuredStakes(data.stakes);
  return (
    <>
      <Cols grid="30px minmax(0,1fr) 36px 56px" cells={[['#'], ['PLAYER'], ['MOVE', true], ['PTS', true]]} />
      {rows.map((p) => {
        const live = p.playerId ? data.live[p.playerId] : undefined;
        let sub: ReactNode;
        if (live) {
          const pos = live.position != null ? `${live.positionTied ? 'T' : ''}${live.position}` : '';
          sub = (
            <>
              <span style={{ color: P.GREEN, fontWeight: 700 }}>Live</span>
              {pos ? ` · ${pos}` : ''}
              {live.score != null ? <> <span style={{ color: getScoreColor(live.score, 'dark') }}>{fmtScore(live.score)}</span></> : null}
              {live.thru != null ? ` thru ${live.thru}` : ''}
              {live.tournamentName ? ` · ${live.tournamentName}` : ''}
            </>
          );
        } else {
          const g = gapLineFor(p.rank, p.points, data.players, featured);
          sub = g
            ? <><span style={{ color: P.INK, fontWeight: 600 }}>{fmtInt(g.pts)} pts {g.kind}</span>{` of ${g.other}`}</>
            : careerLine({ world: p.world, wins: p.wins, top10s: p.top10s, events: p.events }) || undefined;
        }
        const stake = stakeAt.get(p.rank);
        return (
          <Fragment key={p.key}>
            <button type="button" data-field-row={p.rank} data-followed={p.followed || undefined} data-live={live ? true : undefined} onClick={() => actions.goPlayer(p)} style={{ ...rowStyle, gridTemplateColumns: '30px minmax(0,1fr) 36px 56px' }}>
              <Rank value={p.rank} first={p.rank === 1} />
              <PlayerCell rawName={p.rawName} name={p.name} tourCode={p.tourCode} country={p.country} followed={p.followed} sub={sub} bar={<PointsBar pct={barPct(p.points, leaderPts)} lead={p.rank === 1} />} />
              <Move moved={p.moved} />
              <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, ...FIG }}>{p.points != null ? fmtInt(p.points) : ''}</span>
            </button>
            {stake ? (
              <div data-field-line={stake.after_position} style={{ margin: '0 24px', padding: '14px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, borderBottom: `1px solid ${P.RULE}` }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' }}>{stake.line_label}</span>
                <span style={{ fontSize: 11.5, color: P.MUTE, whiteSpace: 'nowrap' }}>{p.points != null ? `${fmtInt(p.points)} pts` : ''}</span>
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}

function FormList({ data, actions, query }: { data: PageData; actions: PageActions; query: string }) {
  const entries = data.form.filter((e) => !query || e.row.name.toLowerCase().includes(query));
  return (
    <>
      <div data-form-key style={{ margin: '12px 24px 0', display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: 11, color: P.DIM }}>
        {([['win', 'Win'], ['t10', 'Top 10'], ['t25', 'Top 25'], ['mc', 'Missed cut']] as const).map(([tone, label]) => (
          <span key={tone} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Tile tone={tone} size={18} />{label}</span>
        ))}
      </div>
      <Cols grid="30px minmax(0,1fr) 135px" cells={[['#'], ['PLAYER'], ['LAST FIVE · LATEST RIGHT', true]]} />
      {entries.map((e) => {
        const last = e.starts[e.starts.length - 1];
        const date = fmtShortDate(last?.date ?? null);
        return (
          <button key={e.row.key} type="button" data-field-row={e.formRank} onClick={() => actions.goPlayer(e.row)} style={{ ...rowStyle, gridTemplateColumns: '30px minmax(0,1fr) 135px' }}>
            <Rank value={e.formRank} first={e.formRank === 1} />
            <PlayerCell rawName={e.row.rawName} name={e.row.name} tourCode={e.row.tourCode} country={e.row.country} followed={e.row.followed} sub={`Avg finish ${e.avg.toFixed(1)}${date ? ` · ${date}` : ''}`} />
            <FormTiles starts={e.starts} />
          </button>
        );
      })}
      <p style={capStyle}>Ranked by average finish across each player's last five starts this season. A missed cut or withdrawal counts as 70th. Players need at least three starts.</p>
    </>
  );
}

function StatsList({ data, actions, stat, query }: { data: PageData; actions: PageActions; stat: string; query: string }) {
  const d = STAT_DEFS[stat];
  const all = useMemo(() => (d ? statList(stat, data.players, data.isPga, data.scorecard) : []), [d, stat, data.players, data.isPga, data.scorecard]);
  if (!d) return null;
  const entries = all.filter((e) => !query || e.row.name.toLowerCase().includes(query));
  return (
    <>
      <Cols grid="30px minmax(0,1fr) 66px" cells={[['#'], ['PLAYER'], [d.unit, true]]} />
      {entries.map((e) => {
        const rounds = e.row.playerId ? data.scorecard?.get(e.row.playerId)?.rounds : undefined;
        const sub = data.isPga
          ? [`FedEx ${e.row.rank}`, e.row.events ? `${e.row.events} starts` : null].filter(Boolean).join(' · ')
          : [`No. ${e.row.rank}`, rounds ? `${rounds} rounds` : null].filter(Boolean).join(' · ');
        return (
          <button key={e.row.key} type="button" data-field-row={e.rankLabel} onClick={() => actions.goPlayer(e.row)} style={{ ...rowStyle, gridTemplateColumns: '30px minmax(0,1fr) 66px' }}>
            <Rank value={e.rankLabel} first={e.rank === 1} />
            <PlayerCell rawName={e.row.rawName} name={e.row.name} tourCode={e.row.tourCode} country={e.row.country} followed={e.row.followed} sub={sub} bar={<PointsBar pct={e.bar} lead={e.rank === 1} />} />
            <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, ...FIG }}>{e.display}</span>
          </button>
        );
      })}
      <p style={capStyle}>{statCaption(d, all.length, data.isPga)}</p>
    </>
  );
}

/** Stat pills that have data on this tour, in the brief's order. */
export function availableStats(data: PageData): string[] {
  const order = data.isPga ? PGA_STAT_ORDER : OTHER_STAT_ORDER;
  return order.filter((k) => data.players.some((p) => statValue(k, p, data.isPga, data.scorecard) != null));
}

export function FullField(props: FullFieldProps) {
  const { data, actions, lens, stat, onLens, onStat, onBack, search, onSearch, searchOpen, onSearchOpen, searchRef, query } = props;
  const n = data.players.length;
  const rows = query ? data.players.filter((p) => p.name.toLowerCase().includes(query)) : data.players;
  const stats = useMemo(() => availableStats(data), [data]);
  const activeStat = stats.includes(stat) ? stat : stats[0] ?? 'scoring_avg';
  const sentence = useMemo(() => {
    if (lens === 'standings') return STANDINGS_SENTENCE;
    if (lens === 'form') return formSentence(data.form);
    const d = STAT_DEFS[activeStat];
    return d ? statSentence(d, statList(activeStat, data.players, data.isPga, data.scorecard)) : null;
  }, [lens, activeStat, data]);
  const featured = featuredStakes(data.stakes);
  const anyFollowed = data.players.some((p) => p.followed);
  const anyLive = data.players.some((p) => p.playerId && data.live[p.playerId]);

  return (
    <div data-players-field>
      <div style={{ margin: '18px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${P.HAIR2}`, display: 'grid', placeItems: 'center', flex: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={16} color={P.INK} />
        </button>
        {searchOpen ? (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, height: 36, border: `1px solid ${P.HAIR2}`, borderRadius: 18, padding: '0 12px' }}>
            <Search size={14} color={P.MUTE} />
            <input ref={searchRef} value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search players" aria-label="Search players"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: P.INK, background: 'transparent' }} />
            <button type="button" aria-label="Close search" onClick={() => { onSearch(''); onSearchOpen(false); }} style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}>
              <X size={14} color={P.MUTE} />
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ margin: 0, flex: 1, fontSize: 20, fontWeight: 800, color: P.INK }}>All {n} players</h2>
            <SearchButton label="Search players" onClick={() => onSearchOpen(true)} />
          </>
        )}
      </div>
      {sentence ? <p data-field-sentence style={{ margin: '10px 24px 0', fontSize: 13.5, lineHeight: 1.45, color: P.MUTE }}>{sentence}</p> : null}
      <div role="tablist" style={{ display: 'flex', gap: 8, padding: '0 24px', marginTop: 18 }}>
        {LENSES.map((l) => {
          const on = l === lens;
          return (
            <button key={l} type="button" role="tab" aria-selected={on} onClick={() => onLens(l)}
              style={{ flex: 1, height: 38, borderRadius: 12, border: `1px solid ${on ? 'rgba(255,255,255,0.28)' : P.HAIR2}`, background: on ? P.CHIP_ON : 'transparent', color: on ? P.INK : P.MUTE, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', padding: '0 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {LENS_LABEL[l]}
            </button>
          );
        })}
      </div>
      {lens === 'standings' && (anyFollowed || featured.length || anyLive) ? (
        <div data-pills="standings" className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '0 24px', marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {anyFollowed ? <button type="button" data-pill="yours" style={pillStyle(false, true)} onClick={() => scrollToSel('[data-field-row][data-followed]')}>★ Yours</button> : null}
          {featured.map((s) => (
            <button key={s.after_position} type="button" data-pill="line" style={pillStyle(false)} onClick={() => scrollToSel(`[data-field-line="${s.after_position}"]`)}>{s.pill_label ?? s.line_label}</button>
          ))}
          {anyLive ? <button type="button" data-pill="live" style={pillStyle(false)} onClick={() => scrollToSel('[data-field-row][data-live]')}>Playing now</button> : null}
        </div>
      ) : null}
      {lens === 'stats' ? (
        <div data-pills="stats" className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '0 24px', marginTop: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {stats.map((k) => (
            <button key={k} type="button" data-pill={k} aria-pressed={k === activeStat} style={pillStyle(k === activeStat)} onClick={() => onStat(k)}>{STAT_DEFS[k].label}</button>
          ))}
        </div>
      ) : null}
      {lens === 'standings' ? <StandingsList data={data} actions={actions} rows={rows} /> : null}
      {lens === 'form' ? <FormList data={data} actions={actions} query={query} /> : null}
      {lens === 'stats' ? <StatsList data={data} actions={actions} stat={activeStat} query={query} /> : null}
    </div>
  );
}
