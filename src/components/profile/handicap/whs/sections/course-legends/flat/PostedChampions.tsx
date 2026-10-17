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

export type PostedChampionsProps = Omit<FieldChampionsProps, 'onConnect'> & { onConnect?: () => void };

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
    return [category, result.state === 'in-reach' ? { state: result.state } : result];
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

export function PostedChampions(props: PostedChampionsProps) {
  const { categories, grouped, activeKey, legendWindow } = props;
  const keys = categories.map(category => category.key);
  const holders = new Map(keys.flatMap(key => {
    const rows = grouped.get(key)?.rows.filter(row => row.rank === 1) ?? [];
    return rows.length ? [[key, { names: rows.map(row => row.name), value: rows[0].valueDisplay }] as const] : [];
  }));
  const states = postedStates(keys, grouped);
  const yours = keys.filter(key => states.get(key)?.state === 'yours');
  const reach = keys.filter(key => states.get(key)?.state === 'in-reach');
  const reachNames = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' }).format(reach.map(key => CHAMPIONS_BOARD_DATA[key].name));
  const owned = selectedDefence(activeKey, grouped);
  return <div className="champions-empty champions-posted" style={{ color: A.INK }}>
    <section className="champions-empty-section">
      <div className="champions-empty-kicker" style={{ color: A.AMBER }}>Your cards here</div>
      <h2 data-yours-count={yours.length} data-board-count={keys.length}>You hold {numberWord(yours.length, false)} of {numberWord(keys.length, false)}</h2>
      <div className="champions-empty-lede" style={{ color: A.MUTE }} data-reach-count={reach.length}>{reach.length ? `What you have posted here already reaches the ${reachNames} ${reach.length === 1 ? 'board' : 'boards'}.` : 'Nothing you have posted here reaches another board yet.'}</div>
      <ChampionsCabinet categories={keys} holders={holders} states={states} activeKey={activeKey} onSelect={props.onSelect} />
      <div className="champions-cabinet-legend" aria-label="Board states" style={{ color: A.DIM }}>
        {LEGEND.map(([label, tone]) => <div className="champions-cabinet-legend-entry" key={label}><span className="champions-cabinet-swatch" style={tone ? { background: tone, border: 0 } : undefined} />{label}</div>)}
      </div>
    </section>
    <BoardSection categories={categories} grouped={grouped} activeKey={activeKey} onSelectCategory={props.onSelect} legendWindow={legendWindow} canSwitchWindow onWindowChange={props.onWindowChange} coursePar={props.par} onOpenFull={props.onOpenFull} onRowPress={props.onRowPress} hasTrackedRounds postedScreen />
    {owned ? <DefencePanel category={activeKey} {...owned} /> : <WhatItTakes category={activeKey} grouped={grouped} />}
  </div>;
}

function WhatItTakes({ category, grouped }: { category: LegendCategory; grouped: FieldChampionsProps['grouped'] }) {
  const rows = grouped.get(category)?.rows ?? [];
  const record = rows.find(row => row.rank === 1);
  const self = rows.find(row => row.isSelf);
  const name = CHAMPIONS_BOARD_DATA[category].name;
  return <section className="champions-empty-section" data-section="what-it-takes">
    <div className="champions-empty-kicker" style={{ color: A.AMBER }}>What it takes</div>
    <h2>{record ? `The ${name} record is ${record.valueDisplay}` : `Nobody holds the ${name} board`}</h2>
    <div className="champions-field-panel" style={{ background: A.PANEL }}>
      <div className="champions-field-stats">{[[record?.valueDisplay ?? '—', 'The record'], [self?.valueDisplay ?? '—', 'Your best here'], [record && self ? String(Number(Math.abs(record.value - self.value).toFixed(1))) : '—', 'The gap']].map(([value, label]) => <div key={label}><strong style={label === 'The record' ? { color: MEDAL_GOLD } : undefined}>{value}</strong><span style={{ color: A.DIM }}>{label}</span></div>)}</div>
    </div>
  </section>;
}

function DefencePanel({ category, rival, defence, own90, rival90 }: { category: LegendCategory; rival: FlatRow | null; defence: Defence | null; own90: number | null; rival90: number | null }) {
  const name = CHAMPIONS_BOARD_DATA[category].name;
  const closing = defence?.trend === 'closing';
  const max = Math.max(own90 ?? 0, rival90 ?? 0, 1);
  return <section className="champions-empty-section" data-section="your-defence" data-trend={defence?.trend ?? 'no-rival'}>
    <div className="champions-empty-kicker" style={{ color: MEDAL_GOLD }}>Your defence</div>
    <h2>{rival ? `${defence?.margin} clear of ${rival.name}` : `Nobody else is on the ${name} board`}</h2>
    {rival && <div className="champions-field-panel" style={{ background: A.PANEL }}>
      <div className="champions-field-stats">{([[String(defence?.margin ?? '—'), 'Your margin'], ...(closing ? [[`+${defence?.gain90}`, 'Their 90-day gain'], [defence?.date ? defence.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' }) : 'Beyond a year', 'At this rate']] : [])] as string[][]).map(([value, label]) => <div key={label}><strong>{value}</strong><span style={{ color: A.DIM }}>{label}</span></div>)}</div>
      {CHAMPIONS_BOARD_DATA[category].kind === 'cumulative' && own90 != null && rival90 != null && <div className="champions-defence-bars" aria-label="Last 90 days">
        {[['You', own90, MEDAL_GOLD], [rival.name, rival90, A.DIM]].map(([who, value, tone]) => <div className="champions-defence-track" key={String(who)}><div className="champions-defence-bar" style={{ width: `${Number(value) / max * 100}%`, background: String(tone) }} /><span style={{ color: A.MUTE }}>{who} · {value}</span></div>)}
      </div>}
    </div>}
    <div className="champions-empty-said" style={{ color: A.MUTE }}>{closing ? 'The date assumes both of you keep posting at your last 90 days\u2019 rate. It is a pace, not a prediction.' : defence?.trend === 'unknown' ? 'There is no honest pace for this board, so no date is given.' : rival ? 'Over the last 90 days nobody is closing on you.' : 'The first card from anyone else starts the chase.'}</div>
  </section>;
}
