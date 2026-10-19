/** CHAMPIONS_STATE_4: connected member with tracked rounds at this course.
 * Reach uses the explicit 'posted' basis; the member's posted value is their
 * own row on each board (CHAMPIONS_NET_SOURCE_1 RA1), never a recomputation.
 * Categories arrive already filtered to available sources, so every count
 * below follows what is drawn. No ghost row: a tracked card ends State 3.
 */
import React from 'react';
import type { LegendCategory } from '@/lib/gam/types';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { numberWord } from '@/lib/text/numbers';
import { ChampionsCabinet, type CabinetState } from './NobodyHasPlayed';
import { BoardSection } from './BoardSection';
import type { FieldChampionsProps } from './FieldChampions';
import { championsReach, type PostedBoard } from './championsReach';
import { boardDefence, type Defence } from './championsPosted';
import { CHAMPIONS_BOARD_DATA } from '../_shared/championsOrder';
import type { FlatRow } from './championsFlatBits';
import { courseHandicap, type CoursePlayInputs } from '@/lib/whs/coursePlay';

export type PostedChampionsProps = Omit<FieldChampionsProps, 'onConnect'> & { onConnect?: () => void; inputs?: CoursePlayInputs | null };

/** The 90-day counterpart of a board, or null when that window has none. */
export function ninetyDayCounterpart(category: LegendCategory): LegendCategory | null {
  if (category.endsWith('_90d')) return category;
  if (category === 'lowest_net_all_time') return null;
  return category.replace(/_all_time$/, '_90d') as LegendCategory;
}

export function postedStates(categories: readonly LegendCategory[], grouped: FieldChampionsProps['grouped']) {
  return new Map<LegendCategory, { state: CabinetState; gap?: number }>(categories.map(category => {
    const rows = grouped.get(category)?.rows ?? [];
    const standing = rows.find(row => row.rank === 1)?.value ?? null;
    const self = rows.find(row => row.isSelf);
    const posted: PostedBoard = self ? { value: self.value, low: self.value, high: self.value } : { value: null, low: null, high: null };
    const result = championsReach('posted', category, standing, { posted, owns: self?.rank === 1 });
    return [category, result];
  }));
}

export function selectedDefence(category: LegendCategory, grouped: FieldChampionsProps['grouped'], now = new Date()): { rival: FlatRow | null; defence: Defence | null; own90: number | null; rival90: number | null } | null {
  const rows = [...(grouped.get(category)?.rows ?? [])].sort((a, b) => a.rank - b.rank);
  const viewer = rows.find(row => row.isSelf && row.rank === 1);
  if (!viewer) return null;
  const rival = rows.find(row => !row.isSelf) ?? null;
  const counterpart = ninetyDayCounterpart(category);
  const recent = counterpart ? grouped.get(counterpart)?.rows ?? [] : [];
  // Absence from the 90-day board is unknown, not zero.
  const own90 = recent.find(row => row.isSelf)?.value ?? null;
  const rival90 = rival ? recent.find(row => row.userId && row.userId === rival.userId)?.value ?? null : null;
  return { rival, own90, rival90, defence: rival ? boardDefence(category, viewer, rival, own90, rival90, now) : null };
}

const LEGEND: Array<[string, string | null]> = [['Yours', MEDAL_GOLD], ['In reach', A.AMBER], ['Held', A.DIM], ['Never claimed', null]];

const SINGULAR: Record<string, string> = { birdies: 'birdie', eagles: 'eagle', aces: 'ace', albatrosses: 'albatross', rounds: 'round' };
const article = (noun: string) => (/^[aeiou]/.test(noun) ? 'an ' : 'a ') + noun;
/** CHAMPIONS_STATE_4_COPY_R UA6: the board's own noun. Differential has none. */
function boardUnit(category: LegendCategory): string | null {
  const data = CHAMPIONS_BOARD_DATA[category];
  if (data.kind === 'cumulative') return data.name;
  if (data.kind === 'not-projectable') return 'points';
  return data.projection === 'differential' ? null : 'shots';
}
const monthName = (date: Date) => date.toLocaleDateString('en-GB', { month: 'long', timeZone: 'Europe/London' });
function heldFor(since: string | null | undefined, now = new Date()): string | null {
  if (!since) return null;
  const days = Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / 86400000));
  if (days < 14) return `${numberWord(days, false)} ${days === 1 ? 'day' : 'days'}`;
  if (days < 60) { const w = Math.floor(days / 7); return `${numberWord(w, false)} weeks`; }
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${numberWord(months, false)} months`;
  const years = Math.floor(months / 12);
  return `${numberWord(years, false)} years`;
}

/** CHAMPIONS_STATE_4_COPY TB3: in-reach clause, then never-claimed clause. */
export function cabinetLede(categories: readonly LegendCategory[], states: Map<LegendCategory, { state: CabinetState; gap?: number }>): string | null {
  const reach = categories.filter(key => states.get(key)?.state === 'in-reach');
  const open = categories.filter(key => states.get(key)?.state === 'never-claimed');
  const clauses: string[] = [];
  if (reach.length === 1 && CHAMPIONS_BOARD_DATA[reach[0]].kind === 'cumulative' && states.get(reach[0])?.gap === 1) {
    clauses.push(`One more is a single ${SINGULAR[CHAMPIONS_BOARD_DATA[reach[0]].name]} away`);
  } else if (reach.length) clauses.push(`${numberWord(reach.length)} more ${reach.length === 1 ? 'is' : 'are'} within reach`);
  if (open.length) clauses.push(`${clauses.length ? numberWord(open.length, false) : numberWord(open.length)} ${open.length === 1 ? 'has' : 'have'} never been claimed by anybody`);
  return clauses.length ? `${clauses.join(', and ')}.` : null;
}

export function PostedChampions(props: PostedChampionsProps) {
  const { categories, grouped, activeKey, legendWindow, rounds } = props;
  const keys = categories.map(category => category.key);
  const holders = new Map(keys.flatMap(key => {
    const rows = grouped.get(key)?.rows.filter(row => row.rank === 1) ?? [];
    return rows.length ? [[key, { names: rows.map(row => row.name), value: rows[0].valueDisplay }] as const] : [];
  }));
  const states = postedStates(keys, grouped);
  const yours = keys.filter(key => states.get(key)?.state === 'yours');
  const lede = cabinetLede(keys, states);
  const openFeats = keys.filter(key => states.get(key)?.state === 'never-claimed' && CHAMPIONS_BOARD_DATA[key].kind === 'cumulative');
  const openNames = new Intl.ListFormat('en-GB', { style: 'long', type: 'disjunction' }).format(openFeats.map(key => article(SINGULAR[CHAMPIONS_BOARD_DATA[key].name])));
  const owned = selectedDefence(activeKey, grouped);
  return <div className="champions-empty champions-posted" style={{ color: A.INK }}>
    <section className="champions-empty-section champions-empty-section--first">
      <div className="champions-empty-kicker" style={{ color: A.AMBER }}>Your cabinet here</div>
      <h2 data-yours-count={yours.length} data-board-count={keys.length}>{numberWord(yours.length)} of the {numberWord(keys.length, false)} are yours</h2>
      {lede && <div className="champions-empty-lede" style={{ color: A.MUTE }}>{lede}</div>}
      <ChampionsCabinet categories={keys} holders={holders} states={states} activeKey={activeKey} onSelect={props.onSelect} />
      <div className="champions-cabinet-legend" aria-label="Board states" style={{ color: A.DIM }}>
        {LEGEND.map(([label, tone]) => <div className="champions-cabinet-legend-entry" key={label}><span className="champions-cabinet-swatch" style={tone ? { background: tone, border: 0 } : undefined} />{label}</div>)}
      </div>
      {openFeats.length > 0 && rounds != null && <div className="champions-empty-said" style={{ color: A.BODY }}>Nobody has made {openNames} here in {rounds.toLocaleString('en-GB')} recorded rounds. {openFeats.length === 1 ? 'That one has been open since the course was added and the first player to do it takes it outright.' : `Those ${numberWord(openFeats.length, false)} have been open since the course was added and the first player to do it takes them outright.`}</div>}
    </section>
    <BoardSection categories={categories} grouped={grouped} activeKey={activeKey} onSelectCategory={props.onSelect} legendWindow={legendWindow} canSwitchWindow onWindowChange={props.onWindowChange} coursePar={props.par} onOpenFull={props.onOpenFull} onRowPress={props.onRowPress} hasTrackedRounds postedScreen />
    {owned ? <DefencePanel category={activeKey} attainedAt={grouped.get(activeKey)?.rows.find(row => row.isSelf)?.attained_at ?? null} viewerTotal={grouped.get(activeKey)?.rows.find(row => row.isSelf)?.valueDisplay ?? null} {...owned} /> : <WhatItTakes category={activeKey} grouped={grouped} inputs={props.inputs ?? null} />}
  </div>;
}

/* CHAMPIONS_STATE_4_COPY_R UA2-UA4: score boards show three stats (record,
 * best here, course handicap); counting boards show two (record, total here).
 * No last-20 and no monument sentence: those need round history, which is a
 * You tab fact and is never fetched into the Champions tree. */
function WhatItTakes({ category, grouped, inputs }: { category: LegendCategory; grouped: FieldChampionsProps['grouped']; inputs: CoursePlayInputs | null }) {
  const rows = grouped.get(category)?.rows ?? [];
  const record = rows.find(row => row.rank === 1);
  const self = rows.find(row => row.isSelf);
  const cumulative = CHAMPIONS_BOARD_DATA[category].kind === 'cumulative';
  const gap = record && self ? Math.round(Math.abs(record.value - self.value)) : null;
  const differential = CHAMPIONS_BOARD_DATA[category].projection === 'differential';
  const title = cumulative ? 'more than you have ever made here' : differential ? 'lower than you have ever played here' : 'shots better than you have ever played here';
  const stats: Array<[string, string]> = cumulative
    ? [[record?.valueDisplay ?? '\u2014', 'The record'], [self?.valueDisplay ?? '\u2014', 'Your total here']]
    : [[record?.valueDisplay ?? '\u2014', 'The record'], [self?.valueDisplay ?? '\u2014', 'Your best here'], [inputs ? String(courseHandicap(inputs)) : '\u2014', 'Course handicap']];
  return <section className="champions-empty-section" data-section="what-it-takes">
    <div className="champions-empty-kicker" style={{ color: A.AMBER }}>What it takes</div>
    {gap != null && gap > 0 && <h2>{numberWord(gap)} {title}</h2>}
    <div className="champions-field-panel" style={{ background: A.PANEL }}>
      {record && <div className="champions-field-record"><strong style={{ color: MEDAL_GOLD, fontSize: 32 }}>{record.valueDisplay}</strong><span style={{ color: A.MUTE }}>takes it<br />outright</span></div>}
      {<div className="champions-field-stats">{stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span style={{ color: A.DIM }}>{label}</span></div>)}</div>}
    </div>
  </section>;
}

function DefencePanel({ category, rival, defence, own90, rival90, attainedAt, viewerTotal }: { category: LegendCategory; rival: FlatRow | null; defence: Defence | null; own90: number | null; rival90: number | null; attainedAt: string | null; viewerTotal: string | null }) {
  const unit = boardUnit(category);
  const closing = defence?.trend === 'closing';
  const max = Math.max(own90 ?? 0, rival90 ?? 0, 1);
  const since = new Date(Date.now() - 90 * 86400000);
  // APPROXIMATION (UA8): attainedAt is the date of the member's record card,
  // the nearest available proxy for when the board was taken - not the exact
  // moment they went top.
  const held = heldFor(attainedAt);
  const title = !rival ? 'Nobody else is on this board' : closing ? `${rival.name} is closing` : 'Nobody is closing on you';
  return <section className="champions-empty-section" data-section="your-defence" data-trend={defence?.trend ?? 'no-rival'}>
    <div className="champions-empty-kicker" style={{ color: MEDAL_GOLD }}>Your defence</div>
    <h2>{title}</h2>
    {rival && <div className="champions-field-panel" style={{ background: A.PANEL }}>
      <div className="champions-field-record"><strong style={{ color: MEDAL_GOLD, fontSize: 32 }}>{defence?.margin}</strong><span style={{ color: A.MUTE }}>{unit ? <>{unit}<br /></> : null}clear</span></div>
      <div className="champions-field-stats">{([[String(viewerTotal ?? '\u2014'), 'You'], [rival.valueDisplay, rival.name], ...(closing ? [[`+${defence?.gain90}`, `${rival.name} gains a quarter`], [defence?.date ? monthName(defence.date) : 'Beyond a year', `${rival.name} passes you`]] : [])] as string[][]).map(([value, label]) => <div key={label}><strong>{value}</strong><span style={{ color: A.DIM }}>{label}</span></div>)}</div>
      {CHAMPIONS_BOARD_DATA[category].kind === 'cumulative' && own90 != null && rival90 != null && <div className="champions-defence-bars" aria-label="Last 90 days">
        <div className="champions-empty-kicker" style={{ color: A.DIM }}>LAST 90 DAYS</div>
        {[[`You +${own90}`, own90, MEDAL_GOLD], [`${rival.name} +${rival90}`, rival90, A.DIM]].map(([caption, value, tone]) => <div className="champions-defence-track" key={String(caption)}><div className="champions-defence-bar" style={{ width: `${Number(value) / max * 100}%`, background: String(tone) }} /><span style={{ color: A.MUTE }}>{caption}</span></div>)}
      </div>}
    </div>}
    {closing && rival && rival90 != null && own90 != null && defence?.date && <div className="champions-empty-said" style={{ borderColor: MEDAL_GOLD, color: A.BODY }}>{rival.name} has added {rival90}{unit ? ` ${unit}` : ''} here since {monthName(since)} to your {own90}. At that rate {rival.name} takes this board in {monthName(defence.date)}.{held ? ` You have held it for ${held}.` : ''}</div>}
    <div className="champions-empty-said" style={{ color: A.MUTE }}>{closing ? 'A rate is not a promise \u2014 it is the last ninety days carried forward, and ninety days of anybody\u2019s golf can turn. It is here because a board you cannot lose is not worth holding.' : defence?.trend === 'unknown' ? 'There is no honest pace for this board, so no date is given.' : rival ? 'Over the last 90 days nobody is closing on you.' : 'The first card from anyone else starts the chase.'}</div>
  </section>;
}
