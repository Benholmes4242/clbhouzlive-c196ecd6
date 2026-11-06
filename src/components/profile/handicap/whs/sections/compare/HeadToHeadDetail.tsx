/**
 * HeadToHeadDetail - HH3 DETAIL state of CompareSheet ("Head to head").
 *
 * Order is fixed by the signed-off mock: heads row, then YOU V {FIRST} (every
 * round each has posted, from useCompareStats), then TOGETHER (scoreboards from
 * useSharedRounds) with COURSE BY COURSE accordions inside it. With no shared
 * rounds, Together is replaced by one line and You v still shows.
 *
 * NO AMBER: leader full white, the other dimmed (rules in headToHeadRules.ts).
 * The header (kicker, title, close) is owned by CompareSheet.
 */
import React from 'react';
import { getInitialsFromName, getAvatarFallbackGradient } from '@/lib/avatarFallback';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import type { SharedRoundsResult } from '@/lib/whs/api';
import type { HeadToHeadStats } from './h2hStats';
import {
  HH_INK, HH_DIM, HH_BAR_OTHER, leaderOf, shareOf, figurePaint, fmtGap,
  groupByCourse, recordLeadLine, shortDate, resolveGroupCourseId, type Polarity, type Record3, type CourseGroup,
} from './headToHeadRules';

const KICK: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(248,250,252,0.5)', textTransform: 'uppercase' };
const COLH: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.45)', textTransform: 'uppercase' };
const TAB: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };
const HAIR = '1px solid rgba(255,255,255,0.07)';
const DASH = '\u2013';
const ROUNDS_SHOWN = 5;

export interface HeadPerson { userId: string; name: string | null; avatarUrl: string | null }

interface Props {
  me: HeadPerson;
  them: HeadPerson;
  firstName: string;
  season: HeadToHeadStats | null | undefined;
  shared: SharedRoundsResult | null | undefined;
}

const Head: React.FC<{ p: HeadPerson; label: string; index: number | null | undefined; side: 'me' | 'them' }> = ({ p, label, index, side }) => (
  <div data-hh-head={side} style={{ textAlign: 'center', minWidth: 0 }}>
    <div style={{ width: 58, height: 60, borderRadius: '34%', margin: '0 auto', border: '2px solid rgba(255,255,255,0.18)', overflow: 'hidden', background: p.avatarUrl ? 'rgba(255,255,255,0.06)' : getAvatarFallbackGradient(p.userId), display: 'flex', alignItems: 'center', justifyContent: 'center', color: HH_INK, fontSize: 17, fontWeight: 700 }}>
      {p.avatarUrl ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.name ? <span>{getInitialsFromName(p.name)}</span> : null}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 7, color: HH_INK }}>{label}</div>
    <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.55)', marginTop: 1 }}>
      Index <em style={{ fontStyle: 'normal', color: HH_INK, fontWeight: 700 }}>{index == null ? DASH : index < 0 ? `+${Math.abs(index).toFixed(1)}` : index.toFixed(1)}</em>
    </div>
  </div>
);

interface VsDef { key: string; label: string; pol: Polarity; me: number | null | undefined; them: number | null | undefined; decimals?: number }

const fmt = (v: number | null | undefined, d = 0) => (v == null || !Number.isFinite(v) ? DASH : d ? v.toFixed(d) : String(v));

const VsRow: React.FC<{ d: VsDef; first: boolean }> = ({ d, first }) => {
  const leader = leaderOf(d.pol, d.me, d.them);
  const share = leader === 'none' ? 0 : shareOf(d.pol, d.me as number, d.them as number);
  const segMe = leader === 'me' || leader === 'tie' ? HH_INK : HH_BAR_OTHER;
  const segThem = leader === 'them' || leader === 'tie' ? HH_INK : HH_BAR_OTHER;
  return (
    <div data-hh-vs={d.key} data-leader={leader} style={{ display: 'grid', gridTemplateColumns: '52px minmax(0,1fr) 52px', alignItems: 'center', gap: 8, padding: '11px 0', borderTop: first ? 0 : HAIR, ...TAB }}>
      <div data-hh-fig="me" style={{ fontSize: 17, ...figurePaint('me', leader) }}>{fmt(d.me, d.decimals)}</div>
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <div style={{ ...COLH, color: 'rgba(248,250,252,0.5)' }}>{d.label}</div>
        {leader !== 'none' && (
          <div data-hh-bar style={{ display: 'flex', height: 4, marginTop: 7, gap: 2 }}>
            <i style={{ flex: share, height: '100%', borderRadius: 2, background: segMe }} />
            <i style={{ flex: 1 - share, height: '100%', borderRadius: 2, background: segThem }} />
          </div>
        )}
      </div>
      <div data-hh-fig="them" style={{ fontSize: 17, textAlign: 'right', ...figurePaint('them', leader) }}>{fmt(d.them, d.decimals)}</div>
    </div>
  );
};

const Pair: React.FC<{ a: number; b: number }> = ({ a, b }) => (
  <>
    <span style={{ color: a >= b ? HH_INK : HH_DIM }}>{a}</span>
    <span style={{ color: 'rgba(248,250,252,0.35)' }}>{DASH}</span>
    <span style={{ color: b >= a ? HH_INK : HH_DIM }}>{b}</span>
  </>
);

const Board: React.FC<{ kind: 'gross' | 'stableford'; label: string; r: Record3; first: string }> = ({ kind, label, r, first }) => {
  const meLead = r.wins > r.losses;
  const themLead = r.losses > r.wins;
  const meBright = !themLead;
  const themBright = !meLead;
  return (
    <div data-hh-board={kind} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.025)', minWidth: 0 }}>
      <div style={{ ...KICK, textAlign: 'center' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginTop: 8, ...TAB }}>
        <b data-hh-score="me" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: meBright ? HH_INK : HH_DIM }}>{r.wins}</b>
        <i style={{ fontStyle: 'normal', color: 'rgba(248,250,252,0.35)', fontSize: 20 }}>{DASH}</i>
        <b data-hh-score="them" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: themBright ? HH_INK : HH_DIM }}>{r.losses}</b>
      </div>
      <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 10, gap: 2 }}>
        <i style={{ flex: r.wins, background: meLead ? HH_INK : 'rgba(255,255,255,0.32)' }} />
        <i style={{ flex: r.ties, background: 'rgba(255,255,255,0.14)' }} />
        <i style={{ flex: r.losses, background: themLead ? HH_INK : 'rgba(255,255,255,0.32)' }} />
      </div>
      <div data-hh-lead style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginTop: 8, color: HH_INK }}>{recordLeadLine(r, first)}</div>
      <div style={{ fontSize: 11, color: HH_DIM, textAlign: 'center', marginTop: 2 }}>{r.ties} halved</div>
    </div>
  );
};

const CourseCard: React.FC<{ g: CourseGroup; first: string; defaultOpen: boolean; meBest?: { gross: number | null; points: number | null }; themBest?: { gross: number | null; points: number | null } }> = ({ g, first, defaultOpen, meBest, themBest }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [all, setAll] = React.useState(false);
  const n = g.rounds.length;
  const shown = all ? g.rounds : g.rounds.slice(0, ROUNDS_SHOWN);
  const best = (b?: { gross: number | null; points: number | null }) => `${b?.gross ?? DASH} \u00B7 ${b?.points ?? DASH} pts`;
  const recSmall: React.CSSProperties = { color: 'rgba(248,250,252,0.45)', fontWeight: 800, fontSize: 8.5, letterSpacing: '0.12em', marginRight: 5 };
  return (
    <div data-hh-course={g.courseId} data-open={open ? 'true' : 'false'} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, marginTop: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', width: '100%', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: HH_INK, fontFamily: 'inherit' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ display: 'block', fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{shortCourseName(g.courseName)}</b>
          <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(248,250,252,0.5)', marginTop: 2 }}>{n} {n === 1 ? 'round' : 'rounds'} together</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 700, lineHeight: 1.55, whiteSpace: 'nowrap', ...TAB }}>
          <div><small style={recSmall}>GROSS</small><Pair a={g.gross.wins} b={g.gross.losses} /></div>
          <div><small style={recSmall}>PTS</small><Pair a={g.points.wins} b={g.points.losses} /></div>
        </div>
        <div aria-hidden style={{ width: 22, height: 22, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,250,252,0.55)', transition: 'transform 250ms', transform: open ? 'rotate(180deg)' : 'none', fontSize: 13 }}>{'\u25BE'}</div>
      </button>
      <div data-hh-course-body style={{ maxHeight: open ? (all ? 4000 : 600) : 0, overflow: 'hidden', transition: 'max-height 300ms cubic-bezier(.2,.8,.2,1)' }}>
        {open && (
          <div style={{ padding: '0 14px 12px', borderTop: HAIR }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {[{ b: meBest, l: 'YOUR BEST EVER' }, { b: themBest, l: `${first.toUpperCase()}'S BEST EVER` }].map((x) => (
                <div key={x.l} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.04)', padding: '9px 10px' }}>
                  <b style={{ display: 'block', fontSize: 17, fontWeight: 700, color: HH_INK, ...TAB }}>{best(x.b)}</b>
                  <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(248,250,252,0.5)', marginTop: 2 }}>{x.l}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '52px minmax(0,1fr) 52px 52px', gap: 8, marginTop: 12 }}>
              <span /><span /><span style={{ ...COLH, textAlign: 'right' }}>YOU</span><span style={{ ...COLH, textAlign: 'right' }}>{first}</span>
            </div>
            {shown.map((r, i) => {
              const lead = leaderOf('low', r.user_gross, r.rival_gross);
              const verdict = r.user_gross < r.rival_gross ? 'You won on gross' : r.user_gross > r.rival_gross ? `${first} won on gross` : 'Halved on gross';
              return (
                <div key={`${r.play_date}-${i}`} data-hh-round style={{ display: 'grid', gridTemplateColumns: '52px minmax(0,1fr) 52px 52px', gap: 8, alignItems: 'center', padding: '10px 0', borderTop: i === 0 ? 0 : HAIR, ...TAB }}>
                  <div style={{ fontSize: 11.5, color: 'rgba(248,250,252,0.55)', lineHeight: 1.25 }}>{shortDate(r.play_date)}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(248,250,252,0.6)', lineHeight: 1.25 }}>{verdict}</div>
                  {(['me', 'them'] as const).map((side) => (
                    <div key={side} data-hh-gross={side} style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: lead === 'tie' || lead === side ? HH_INK : HH_DIM }}>
                      {side === 'me' ? r.user_gross : r.rival_gross}
                      <small style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'rgba(248,250,252,0.5)', marginTop: 1 }}>{side === 'me' ? r.user_stableford : r.rival_stableford} pts</small>
                    </div>
                  ))}
                </div>
              );
            })}
            {!all && n > ROUNDS_SHOWN && (
              <button type="button" data-hh-all onClick={() => setAll(true)} style={{ display: 'block', width: '100%', border: 0, background: 'transparent', fontSize: 12.5, fontWeight: 700, color: 'rgba(248,250,252,0.7)', textAlign: 'center', paddingTop: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                All {n} rounds here {'\u203A'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const HeadToHeadDetail: React.FC<Props> = ({ me, them, firstName, season, shared }) => {
  const first = firstName || '';
  const mi = season?.me.handicap_index ?? null;
  const ti = season?.them.handicap_index ?? null;
  const rows: VsDef[] = [
    { key: 'birdies', label: 'Birdies', pol: 'high', me: season?.me.birdies, them: season?.them.birdies },
    { key: 'eagles', label: 'Eagles', pol: 'high', me: season?.me.eagles, them: season?.them.eagles },
    { key: 'sub80', label: 'Rounds under 80', pol: 'high', me: season?.me.sub80_rounds, them: season?.them.sub80_rounds },
    { key: 'bestGross', label: 'Best gross', pol: 'low', me: season?.me.lowest_gross, them: season?.them.lowest_gross },
    { key: 'bestStableford', label: 'Best Stableford', pol: 'high', me: season?.me.best_stableford, them: season?.them.best_stableford },
    { key: 'avgGross', label: 'Average gross', pol: 'low', me: season?.me.avg_gross, them: season?.them.avg_gross, decimals: 1 },
    { key: 'avgPoints', label: 'Average points', pol: 'high', me: season?.me.avg_points, them: season?.them.avg_points, decimals: 1 },
    { key: 'top100', label: 'Top 100 courses played', pol: 'high', me: season?.me.top100_played, them: season?.them.top100_played },
  ];
  const count = shared?.shared_rounds_count ?? 0;
  const groups = React.useMemo(() => groupByCourse(shared?.shared_round_results ?? []), [shared]);

  return (
    <div data-hh-detail style={{ padding: '0 18px 32px', color: HH_INK }}>
      <div data-hh-heads style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <Head p={me} label="You" index={mi} side="me" />
        <div style={{ textAlign: 'center' }}>
          <b data-hh-gap style={{ display: 'block', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', ...TAB }}>{mi != null && ti != null ? fmtGap(mi - ti) : DASH}</b>
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.5)' }}>SHOTS APART</span>
        </div>
        <Head p={them} label={first} index={ti} side="them" />
      </div>

      <section data-hh-section="vs" style={{ marginTop: 24 }}>
        <div style={KICK}>YOU V {first.toUpperCase()}</div>
        <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.5)', marginTop: 4 }}>Every round you've each posted, at any course.</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={COLH}>YOU</span><span style={COLH}>{first}</span>
        </div>
        <div>{rows.map((d, i) => <VsRow key={d.key} d={d} first={i === 0} />)}</div>
      </section>

      {count === 0 ? (
        <div data-hh-never style={{ marginTop: 24, fontSize: 13, color: 'rgba(248,250,252,0.6)', lineHeight: 1.45 }}>
          You and {first} haven't played the same course on the same day yet.
        </div>
      ) : (
        <section data-hh-section="together" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={KICK}>TOGETHER</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(248,250,252,0.55)' }}>{count} {count === 1 ? 'round' : 'rounds'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10, marginTop: 10 }}>
            <Board kind="gross" label="GROSS" r={{ wins: shared?.gross_record.wins ?? 0, ties: shared?.gross_record.ties ?? 0, losses: shared?.gross_record.losses ?? 0 }} first={first} />
            <Board kind="stableford" label="STABLEFORD" r={{ wins: shared?.stableford_record.wins ?? 0, ties: shared?.stableford_record.ties ?? 0, losses: shared?.stableford_record.losses ?? 0 }} first={first} />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.5)', marginTop: 10, textAlign: 'center' }}>Rounds on the same course on the same day</div>

          <div data-hh-section="courses" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={KICK}>COURSE BY COURSE</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(248,250,252,0.55)' }}>{groups.length} {groups.length === 1 ? 'course' : 'courses'}</span>
            </div>
            {groups.map((g, i) => {
              // H2H_BEST_1: the group is keyed by a whs_courses id; resolve
              // each side's golf_courses id from its own gam rows so the
              // best-here tiles read the right course_bests entry.
              const meId = resolveGroupCourseId(g, season?.me.gam_rows ?? [], 'me');
              const themId = resolveGroupCourseId(g, season?.them.gam_rows ?? [], 'them');
              return (
                <CourseCard key={g.courseId} g={g} first={first} defaultOpen={i === 0} meBest={meId ? season?.me.course_bests?.[meId] : undefined} themBest={themId ? season?.them.course_bests?.[themId] : undefined} />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default HeadToHeadDetail;
