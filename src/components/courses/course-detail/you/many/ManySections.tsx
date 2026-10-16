/**
 * BRIEF_YOU_TAB_1 Phases 2-4, drawn to you-tab-many-rounds.html (BRIEF_YOU_TAB_1A).
 * Every figure arrives derived (lib/courseYou/youDerivations); nothing here
 * queries. A section whose population is missing returns null: no substitute
 * content (1A A3). Titles are claims, so a title renders only when its claim is
 * true; otherwise the section shows its kicker alone.
 */
import React from 'react';
import { A, FIGS, RAMP_TOPAR } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';
import {
  GOOD_ROUND_GROSS, SEASON_MIN_ROUNDS, SMALL_SET, round1,
  type EdgeSummary, type GoodRounds, type HoleEdge, type OpenHolesState, type Season,
} from '@/lib/courseYou/youDerivations';
import { ordinal } from '../youBits';
import { B, Facts, Lede, More, Said, Sec, Verd, Words, Y, plural, signed1, signed2, words } from './manyBits';

const f1 = (v: number) => round1(v).toFixed(1);

/* ================= P2 verdict ================= */

export interface VerdictProps {
  year: number;
  season: Season | null;
  bestSeason: boolean;
  seasonCount: number;
  lifetimeOverPar: number | null;
  lifetimeRounds: number;
  fieldOverPar: number | null;
  bestThisYear: number | null;
  mostRoundsHere: boolean;
}

const LadderRow: React.FC<{ name: React.ReactNode; pct: number; fill: string; value: string }> = ({ name, pct, fill, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
    <div style={{ width: 92, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: A.MUTE, lineHeight: 1.25 }}>{name}</div>
    <div style={{ flex: 1, height: 10, borderRadius: 5, background: Y.TRACK5, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 5, width: `${Math.max(0, Math.min(100, pct))}%`, background: fill }} />
    </div>
    <div style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>{value}</div>
  </div>
);

export const VerdictSection: React.FC<VerdictProps> = (p) => {
  const top = p.fieldOverPar;
  const widthOf = (v: number) => (top != null && top > 0 ? (v / top) * 100 : 100);
  const yearsWord = words(p.seasonCount);
  return (
    <Sec kicker="Your verdict" title={p.season && p.bestSeason ? `${p.year} is the best golf you have played here` : null}>
      {p.season?.avgOverPar != null ? (
        <Verd
          value={signed1(p.season.avgOverPar)}
          line1="over par this year"
          line2={`${formatNumber(p.season.count)} rounds${p.bestSeason ? ` \u00b7 your best of ${yearsWord} seasons here` : ''}`}
        />
      ) : null}
      <div style={{ marginTop: 16 }}>
        {top != null ? <LadderRow name={<>Everyone<br />else</>} pct={100} fill={Y.FAINT} value={signed1(top)} /> : null}
        {p.lifetimeOverPar != null ? (
          <LadderRow name={<>You, all<br />{formatNumber(p.lifetimeRounds)} rounds</>} pct={widthOf(p.lifetimeOverPar)} fill={Y.LIFETIME} value={signed1(p.lifetimeOverPar)} />
        ) : null}
        {p.season?.avgOverPar != null ? (
          <LadderRow name={<>You,<br />in {p.year}</>} pct={widthOf(p.season.avgOverPar)} fill={A.IMPROVED} value={signed1(p.season.avgOverPar)} />
        ) : null}
      </div>
      <Facts
        items={[
          { value: formatNumber(p.lifetimeRounds), label: 'Rounds here' },
          ...(p.bestThisYear != null ? [{ value: String(p.bestThisYear), label: 'Your best, this year' }] : []),
          { value: formatNumber(p.seasonCount), label: 'Seasons here' },
        ]}
      />
      {top != null && p.lifetimeOverPar != null ? (
        <Said>
          The Course tab says this place takes <B>{f1(top)} shots</B> off everyone else who plays it. It took <B>{f1(p.lifetimeOverPar)}</B> off you across {yearsWord} {plural(p.seasonCount, 'season', 'seasons')}.
          {p.season?.avgOverPar != null ? <> This season it is taking <B>{f1(p.season.avgOverPar)}</B>.</> : null}
          {p.mostRoundsHere ? ' Nobody has played here more than you, so this is a finding, not a statistic.' : null}
        </Said>
      ) : null}
    </Sec>
  );
};

/* ================= P2.4 years ================= */

/**
 * BRIEF_YOU_TAB_1B C2 — this chart asks "how did each SEASON THAT MEETS THE
 * MINIMUM play?" and draws only those; the Verdict's "Seasons here" tile asks
 * "in how many calendar years did you play here at all?". Different questions,
 * deliberately different counts; the lede names the minimum and the omissions.
 */
const listYears = (ys: number[]) => ys.length <= 1 ? ys.join('') : `${ys.slice(0, -1).join(', ')} and ${ys[ys.length - 1]}`;
const countsList = (cs: number[]) => {
  const w = cs.map((c, i) => (i === 0 ? `${words(c)} ${plural(c, 'round', 'rounds')}` : words(c)));
  return w.length <= 1 ? w.join('') : `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}`;
};

export const YearsSection: React.FC<{ seasons: Season[]; omitted?: Season[]; year: number; firstTwenty: number | null; lastForty: number | null; held: boolean }> = ({ seasons, omitted = [], year, firstTwenty, lastForty, held }) => {
  const drawn = seasons.filter((s) => s.avgGross != null);
  if (drawn.length < 2) return null;
  const avgs = drawn.map((s) => s.avgGross as number);
  const max = Math.max(...avgs);
  const min = Math.min(...avgs);
  const span = Math.max(0.1, max - min);
  const base = min - span * 0.48;
  const W = 329; const slot = W / drawn.length; const bw = Math.min(38, slot - 14);
  const h = (v: number) => Math.max(4, ((v - base) / (max - base)) * 56);
  const gain = firstTwenty != null && lastForty != null && lastForty < firstTwenty;
  return (
    <Sec kicker="Your years here" title={gain ? 'Where the gain actually came' : null}>
      <Lede>
        Seasons with at least {words(SEASON_MIN_ROUNDS)} rounds.
        {omitted.length > 0
          ? ` Your ${listYears(omitted.map((o) => o.year))} ${omitted.length === 1 ? 'was' : 'were'} ${countsList(omitted.map((o) => o.count))}, so ${omitted.length === 1 ? 'it is' : 'they are'} not drawn.`
          : null}
      </Lede>
      <svg viewBox={`0 0 ${W} 92`} width="100%" height={92} style={{ display: 'block', marginTop: 13 }} role="img" aria-label="Your average gross by season">
        {drawn.map((s, i) => {
          const cx = slot * i + slot / 2; const hh = h(s.avgGross as number); const on = s.year === year;
          return (
            <g key={s.year}>
              <rect x={cx - bw / 2} y={70 - hh} width={bw} height={hh} rx={2} fill={on ? A.IMPROVED : Y.SEASON_BAR} />
              <text x={cx} y={66} textAnchor="middle" fontSize={10} fontWeight={800} fill={on ? A.CANVAS : A.BODY}>{f1(s.avgGross as number)}</text>
              <text x={cx} y={86} textAnchor="middle" fontSize={9} fontWeight={on ? 800 : 700} fill={on ? A.IMPROVED : A.FAINT}>{s.year}</text>
            </g>
          );
        })}
        <line x1={0} y1={70} x2={W} y2={70} stroke={Y.BASELINE} strokeWidth={1} />
      </svg>
      {gain ? (
        <Said>
          Your first twenty rounds here averaged <B>{f1(firstTwenty!)}</B>. Your last forty average <B>{f1(lastForty!)}</B>.
          {held ? <> The gain is real and it has held &mdash; this is not twenty lucky rounds.</> : null}
        </Said>
      ) : null}
    </Sec>
  );
};

/* ================= P3.1 good rounds ================= */

const NineRow: React.FC<{ name: string; v: number | null; lo: number; hi: number; overFill: string }> = ({ name, v, lo, hi, overFill }) => {
  if (v == null) return null;
  const span = hi - lo; const zero = (-lo / span) * 100; const w = (Math.abs(v) / span) * 100;
  const under = v < 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
      <div style={{ width: 42, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: A.DIM }}>{name}</div>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: Y.TRACK5, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: Y.ZERO, left: `${zero}%` }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: 5, background: under ? RAMP_TOPAR.birdie : overFill, ...(under ? { right: `${100 - zero}%` } : { left: `${zero}%` }), width: `${w}%` }} />
      </div>
      <div style={{ width: 42, textAlign: 'right', fontSize: 12.5, fontWeight: 800, letterSpacing: '-0.02em', color: under ? RAMP_TOPAR.birdie : A.INK, ...FIGS }}>{signed1(v)}</div>
    </div>
  );
};

export const GoodRoundsSection: React.FC<{ g: GoodRounds | null; seasons: number }> = ({ g, seasons }) => {
  if (!g) return null;
  const n = g.good.count; const others = g.other.count; const th = GOOD_ROUND_GROSS;
  const vals = [g.good.front, g.good.back, g.other.front, g.other.back].filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  const lo = Math.min(0, ...vals) * 1.0; const hi = Math.max(0.5, ...vals) / 0.83;
  const range = { lo: lo - (hi - lo) * 0.0, hi };
  const frontSwing = g.other.front != null && g.good.front != null ? g.other.front - g.good.front : null;
  const backSwing = g.other.back != null && g.good.back != null ? g.other.back - g.good.back : null;
  const swingWord = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? `${words(Math.round(v))} shots` : f1(v));
  const thinNines = g.good.nineCount < g.good.count || g.other.nineCount < g.other.count;
  return (
    <Sec
      kicker={`The ${words(n)} ${plural(n, 'time', 'times')} you broke ${th}`}
      title={g.everyMadeBeforeTurn ? `${n === 1 ? 'It was' : 'Every one of them was'} made before the turn` : null}
    >
      <Lede>{Words(n)} {plural(n, 'round', 'rounds')} under {th} in {words(seasons)} {plural(seasons, 'season', 'seasons')}. Here is what separated {plural(n, 'it', 'them')} from the other {formatNumber(others)}.</Lede>
      <div style={{ marginTop: 15 }}>
        <GroupHead left={`Your ${words(n)} ${plural(n, 'round', 'rounds')} under ${th}`} right={g.good.avgGross != null ? `avg ${f1(g.good.avgGross)}` : ''} />
        <NineRow name="Front" v={g.good.front} lo={range.lo} hi={range.hi} overFill={RAMP_TOPAR.bogey} />
        <NineRow name="Back" v={g.good.back} lo={range.lo} hi={range.hi} overFill={RAMP_TOPAR.bogey} />
        <div style={{ height: 1, background: Y.RULE8, margin: '13px 0' }} />
        <GroupHead left={`The other ${formatNumber(others)}`} right={g.other.avgGross != null ? `avg ${f1(g.other.avgGross)}` : ''} />
        <NineRow name="Front" v={g.other.front} lo={range.lo} hi={range.hi} overFill={RAMP_TOPAR.double} />
        <NineRow name="Back" v={g.other.back} lo={range.lo} hi={range.hi} overFill={RAMP_TOPAR.double} />
      </div>
      {frontSwing != null && backSwing != null ? (
        <Said>
          Your front nine swings <B>{swingWord(frontSwing)}</B> between a round under {th} and an ordinary one. Your back nine swings <B>{swingWord(backSwing)}</B>.
          {frontSwing > backSwing ? <> A good round here is <B>decided before the turn</B></> : <> A good round here is <B>decided coming home</B></>}
          {frontSwing > backSwing && g.everyTurnUnderPar ? <> &mdash; and on those {words(n)} days you made the turn <B>under par</B>.</> : '.'}
        </Said>
      ) : null}
      {n < SMALL_SET ? (
        <Said quiet>
          {Words(n)} {plural(n, 'round is', 'rounds is')} a small set, and it is the whole set: you have played here {formatNumber(g.total)} times and broken {th} {words(n)} of them.
          {thinNines ? ` The nines rest on the ${formatNumber(g.good.nineCount + g.other.nineCount)} rounds that recorded both.` : ''}
        </Said>
      ) : thinNines ? (
        <Said quiet>The nines rest on the {formatNumber(g.good.nineCount + g.other.nineCount)} of your {formatNumber(g.total)} rounds that recorded both.</Said>
      ) : null}
    </Sec>
  );
};

const GroupHead: React.FC<{ left: string; right: string }> = ({ left, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: A.BODY, marginBottom: 8 }}>
    <span>{left}</span>
    <span style={{ color: A.DIM, fontWeight: 600, letterSpacing: 0, textTransform: 'none', fontSize: 11.5, ...FIGS }}>{right}</span>
  </div>
);

/* ================= P3.3 edge ================= */

export const EdgeSection: React.FC<{ edges: HoleEdge[]; s: EdgeSummary; fieldRounds: number | null; onAllHoles: () => void }> = ({ edges, s, fieldRounds, onAllHoles }) => {
  if (s.measured.length === 0) return null;
  const W = 329; const n = edges.length; const gap = 4; const bw = (W - gap * (n - 1)) / n;
  const maxAbs = Math.max(0.1, ...s.measured.map((e) => Math.abs(e.edge as number)));
  const scale = 28.8 / maxAbs; /* deepest bar = the mock's 28.8px */
  const allAhead = s.behind.length === 0 && s.unmeasured === 0;
  const least = s.leastEdge; const level = new Set(s.otherLevel.map((e) => e.hole_no));
  const labelHoles = new Set([1, Math.ceil(n / 2), n, ...(least ? [least.hole_no] : []), ...level]);
  const ratio = s.front != null && s.back != null && s.front > 0 ? s.back / s.front : null;
  return (
    <Sec kicker="Where your edge goes" title={allAhead ? `You beat the field on all ${words(n)}` : null}>
      <Lede>
        Every hole, your average against the {fieldRounds != null ? `${formatNumber(fieldRounds)} ` : ''}rounds here that are not yours. Deeper bars are holes you take more out of.
        {s.unmeasured > 0 ? ` ${Words(s.unmeasured)} ${plural(s.unmeasured, 'hole', 'holes')} could not be measured.` : ''}
      </Lede>
      <svg viewBox={`0 0 ${W} 62`} width="100%" height={62} style={{ display: 'block', marginTop: 13 }} role="img" aria-label="Your edge on the field, hole by hole">
        <line x1={0} y1={12} x2={W} y2={12} stroke={Y.ZERO} strokeWidth={1} />
        {edges.map((e, i) => {
          if (e.edge == null) return null;
          const x = i * (bw + gap); const d = Math.max(2.7, Math.abs(e.edge) * scale);
          const behind = e.edge < 0;
          const isLeast = least?.hole_no === e.hole_no; const isLevel = level.has(e.hole_no);
          const fill = behind ? A.DRIFTED : isLeast ? A.AMBER : isLevel ? A.DIM : A.IMPROVED;
          return <rect key={e.hole_no} x={x} y={behind ? 12 - d : 12} width={bw} height={d} rx={1.5} fill={fill} opacity={!behind && !isLeast && !isLevel && i > 0 ? 0.8 : 1} />;
        })}
        {edges.map((e, i) => labelHoles.has(e.hole_no) ? (
          <text key={e.hole_no} x={i * (bw + gap) + bw / 2} y={58} textAnchor="middle" fontSize={8.5}
            fontWeight={least?.hole_no === e.hole_no || level.has(e.hole_no) ? 800 : 700}
            fill={least?.hole_no === e.hole_no ? A.AMBER : level.has(e.hole_no) ? A.DIM : A.FAINT}>{e.hole_no}</text>
        ) : null)}
      </svg>
      <Facts
        marginTop={6}
        items={[
          ...(s.front != null ? [{ value: s.front.toFixed(2), label: 'Your edge, front', tone: s.back != null && s.front > s.back ? A.IMPROVED : undefined }] : []),
          ...(s.back != null ? [{ value: s.back.toFixed(2), label: 'Your edge, back', tone: s.front != null && s.back > s.front ? A.IMPROVED : undefined }] : []),
          ...(least ? [{ value: ordinal(least.hole_no), label: 'Least edge that matters', tone: A.AMBER }] : []),
        ]}
      />
      <Said>
        {s.behind.length === 0
          ? <>There is no hole here that costs you shots &mdash; you are ahead of the field on {s.unmeasured === 0 ? `all ${words(n)}` : `every hole measured`}.</>
          : <>You lose shots to the field on <B>{words(s.behind.length)} {plural(s.behind.length, 'hole', 'holes')}</B>.</>}
        {ratio != null && s.front != null && s.back != null
          ? ratio < 0.75
            ? <> But your edge <B>{ratio <= 0.7 && ratio >= 0.4 ? 'almost halves' : 'drops'} after the turn</B>: {s.front.toFixed(2)} going out, {s.back.toFixed(2)} coming home.</>
            : ratio > 1.33
              ? <> Your edge <B>grows after the turn</B>: {s.front.toFixed(2)} going out, {s.back.toFixed(2)} coming home.</>
              : null
          : null}
      </Said>
      {least && least.field != null && least.you != null ? (
        <Said quiet>
          The <B>{ordinal(least.hole_no)}</B> is the one to look at. The field drops <B>{least.field.toFixed(2)}</B> there and {Math.abs(least.edge as number) <= 0.05 ? 'so do you' : `you drop ${least.you.toFixed(2)}`} &mdash; a hard hole where you play like everybody else.
          {s.otherLevel.map((o) => (
            <React.Fragment key={o.hole_no}>
              {' '}The {ordinal(o.hole_no)} is level too, but {s.fieldEasiest?.hole_no === o.hole_no ? 'it is the easiest hole on the course' : `the field only drops ${(o.field as number).toFixed(2)} there`}, so there is nothing to win.
            </React.Fragment>
          ))}
        </Said>
      ) : null}
      <More label={`All ${n} holes`} onPress={onAllHoles} />
    </Sec>
  );
};

/* ================= P4.1 one hole left ================= */

export const OneHoleLeftSection: React.FC<{ state: OpenHolesState; hardest: HoleEdge | null }> = ({ state, hardest }) => {
  if (state.kind === 'none') return null;
  const total = state.total;
  const open = state.kind === 'open' ? state.open : [];
  const openSet = new Set(open.map((h) => h.hole_no));
  const done = total - open.length;
  const names = open.map((h) => `the ${ordinal(h.hole_no)}`);
  const joined = names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const kicker = state.kind === 'complete' ? 'The set' : `${Words(open.length)} ${plural(open.length, 'hole', 'holes')} left`;
  const title = state.kind === 'complete'
    ? `You have birdied all ${words(total)} holes here`
    : `${joined.charAt(0).toUpperCase()}${joined.slice(1)} ${open.length === 1 ? 'is all that stands' : 'are all that stand'} between you and the set`;
  const one = open.length === 1 ? open[0] : null;
  return (
    <Sec kicker={kicker} title={title}>
      <div style={{ marginTop: 14, background: A.PANEL, border: `1px solid ${Y.GOLD_EDGE}`, borderRadius: 13, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.9, color: Y.GOLD, ...FIGS }}>{done}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.MUTE }}>of {total} holes<br />birdied here</div>
        </div>
        <div style={{ display: 'flex', gap: 2.5, marginTop: 13 }} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 7, borderRadius: 2, background: openSet.has(i + 1) ? Y.PIP_OPEN : Y.GOLD }} />
          ))}
        </div>
        {one ? (
          <div style={{ display: 'flex', gap: 15, marginTop: 11 }}>
            {[
              [`Par ${one.par}`, `The ${ordinal(one.hole_no)}`],
              ...(one.field != null ? [[signed2(one.field), one.field >= 0 ? 'Field loses' : 'Field gains']] : []),
              ...(one.you != null ? [[signed2(one.you), one.you >= 0 ? 'You lose' : 'You gain']] : []),
              [formatNumber(one.timesPlayed), 'Your rounds'],
            ].map(([v, l]) => (
              <div key={l}>
                <b style={{ display: 'block', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>{v}</b>
                <i style={{ display: 'block', fontStyle: 'normal', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.DIM, marginTop: 2 }}>{l}</i>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {one && one.edge != null ? (
        <Said>
          {hardest?.hole_no === one.hole_no ? 'The hardest hole on the course, and you' : `On the ${ordinal(one.hole_no)} you`}
          {one.edge > 0
            ? <> still play it <B>{Math.abs(one.edge - 0.1) < 0.025 ? 'a tenth' : `${one.edge.toFixed(2)} a round`} better than the field</B>.</>
            : <> play it <B>{Math.abs(one.edge).toFixed(2)} a round worse than the field</B>.</>}
          {one.timesPlayed > 0 ? <> You have just never holed one &mdash; in <B>{formatNumber(one.timesPlayed)} attempts</B>.</> : null}
        </Said>
      ) : null}
    </Sec>
  );
};

/* ================= P4.3 / P4.4 within reach ================= */

export interface ReachRow { key: string; name: string; sub: string; value: string; mark: string; near: boolean }

export const WithinReachSection: React.FC<{ rows: ReachRow[]; unclaimed: number; boards: number; onAllBoards: () => void }> = ({ rows, unclaimed, boards, onAllBoards }) => {
  if (rows.length === 0) return null;
  return (
    <Sec kicker="Within reach" title="What you could take">
      {rows.map((r, i) => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < rows.length - 1 ? `1px solid ${A.SOFT}` : 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{r.name}</div>
            <div style={{ fontSize: 11, color: A.DIM, marginTop: 2, ...FIGS }}>{r.sub}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <b style={{ display: 'block', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{r.value}</b>
            <i style={{ display: 'block', fontStyle: 'normal', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: r.near ? Y.GOLD : A.FAINT, marginTop: 2, ...FIGS }}>{r.mark}</i>
          </div>
        </div>
      ))}
      {unclaimed > 0 ? (
        <Said quiet>
          <B>{formatNumber(unclaimed)} of the {formatNumber(boards)} boards here {unclaimed === 1 ? 'has' : 'have'} no visible holder.</B> Some may be held by members who keep their records private.
        </Said>
      ) : null}
      <More label="All boards" onPress={onAllBoards} />
    </Sec>
  );
};

/* ================= P4.5 record ================= */

export interface RecordThumb { id: string; url: string | null }

export const RecordSection: React.FC<{
  rating: number | null; moments: number; birdies: number | null; eagles: number | null;
  thumbs: RecordThumb[];
  onRounds: () => void; onRating: () => void; onMoments: (index: number) => void;
}> = ({ rating, moments, birdies, eagles, thumbs, onRounds, onRating, onMoments }) => {
  const rows: [string, string][] = [
    ...(rating != null ? [['Your rating', rating.toFixed(1)] as [string, string]] : []),
    ...(moments > 0 ? [['Your moments', formatNumber(moments)] as [string, string]] : []),
    ...(birdies != null ? [['Birdies here', formatNumber(birdies)] as [string, string]] : []),
    ...(eagles != null ? [['Eagles here', formatNumber(eagles)] as [string, string]] : []),
  ];
  const shown = thumbs.slice(0, 3);
  const extra = thumbs.length - 3;
  const link = { padding: 0, border: 0, background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit' } as const;
  return (
    <Sec kicker="Your record here" title="Everything else you have put in">
      {rows.map(([l, v], i) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < rows.length - 1 ? `1px solid ${A.SOFT}` : 0 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: A.BODY }}>{l}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: A.INK, ...FIGS }}>{v}</div>
        </div>
      ))}
      {shown.length > 0 ? (
        <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
          {shown.map((th, i) => (
            <button key={th.id} type="button" onClick={() => onMoments(i)} aria-label={`Open moment ${i + 1}`}
              style={{ flex: 1, height: 62, borderRadius: 9, border: 0, padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', background: A.PANEL,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: A.DIM }}>
              {th.url ? <img src={th.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === 2 && extra > 0 ? 0.35 : 1 }} /> : null}
              {i === 2 && extra > 0 ? <span style={{ position: 'relative', color: A.INK }}>+{extra}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 700, color: A.AMBER }}>
        <button type="button" style={link} onClick={onRounds}>Your rounds</button>
        {' \u00a0\u00b7\u00a0 '}
        <button type="button" style={link} onClick={onRating}>Your rating</button>
        {moments > 0 ? <>{' \u00a0\u00b7\u00a0 '}<button type="button" style={link} onClick={() => onMoments(0)}>Your moments</button></> : null}
        {' \u203a'}
      </div>
    </Sec>
  );
};
