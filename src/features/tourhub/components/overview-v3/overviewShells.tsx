/** Tour loading owns only readiness and remembered silhouettes, never query options.
 * Each band reports its existing reads; only the mounted first-paint slide is required.
 * Shape storage is best-effort and written once after the shared gate reveals. */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { settled, usePageRevealed, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { MEMBER_CELL, MEMBER_PANEL, PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { WHITE_ALPHA_06, WHITE_ALPHA_08 } from '../../_shared/tokens';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import '../../../../styles/hybrid-hero.css';
import '../../tournament-v2/sections/heroRoundPanel.css';
import '../../overview/sections/alsoWeek.css';
import '../../overview/sections/comingUp.css';

export const TOUR_OVERVIEW_GATE_IDS = ['hero', 'stories', 'alsoThisWeek', 'comingUp', 'rankings'] as const;
export const OVERVIEW_SHAPE_MAX_AGE = 12 * 60 * 60 * 1000;
/** V2 counts are marker-only, lens-local and best-effort; v1 entries remain untouched.
 * Shells use the live band's containers and inline geometry. Visible bars respect
 * each cell's clipping/line limit; no hidden lines, icons or coloured telemetry. */
export type OverviewShape = {
  chips: boolean; movers: boolean; boardRows: number; fullLeaderboard: boolean;
  picks: boolean; leadersRows: number; storyBand: boolean; alsoEvents: number;
  comingNext: boolean; comingMonths: number[]; rankingsRows: number; climb: boolean;
  newsLead: boolean; newsPair: boolean; newsList: number; at?: number;
};
export const EMPTY_OVERVIEW_SHAPE: OverviewShape = {
  chips: false, movers: false, boardRows: 0, fullLeaderboard: false, picks: false,
  leadersRows: 0, storyBand: false, alsoEvents: 0, comingNext: false, comingMonths: [],
  rankingsRows: 0, climb: false, newsLead: false, newsPair: false, newsList: 0,
};
const shapeKey = (lens: string | null) => `tour-overview-shape:v2:${lens ?? 'all'}`;
const countBounds = { boardRows: 10, leadersRows: 3, alsoEvents: 3, rankingsRows: 5, newsList: 3 } as const;
const flags = ['chips', 'movers', 'fullLeaderboard', 'picks', 'storyBand', 'comingNext', 'climb', 'newsLead', 'newsPair'] as const;
const emptyShape = (): OverviewShape => ({ ...EMPTY_OVERVIEW_SHAPE, comingMonths: [] });
const validCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));
export function readOverviewShape(lens: string | null = 'all', now = Date.now()): OverviewShape {
  try {
    const value = JSON.parse(localStorage.getItem(shapeKey(lens)) ?? 'null');
    if (!value || typeof value !== 'object' || !Number.isFinite(value.at) || value.at > now || now - value.at > OVERVIEW_SHAPE_MAX_AGE) return emptyShape();
    const shape = emptyShape();
    for (const flag of flags) {
      if (typeof value[flag] !== 'boolean') return emptyShape();
      shape[flag] = value[flag];
    }
    for (const key of Object.keys(countBounds) as Array<keyof typeof countBounds>) {
      if (!validCount(value[key])) return emptyShape();
      shape[key] = clamp(value[key], countBounds[key]);
    }
    if (!Array.isArray(value.comingMonths) || !value.comingMonths.every(validCount)) return emptyShape();
    shape.comingMonths = value.comingMonths.slice(0, 3).map((count: number) => Math.max(0, count));
    return { ...shape, at: value.at };
  } catch { return emptyShape(); }
}
export function writeOverviewShape(lens: string | null, shape: OverviewShape) {
  try { localStorage.setItem(shapeKey(lens), JSON.stringify({ ...shape, at: Date.now() })); } catch { /* Storage is optional. */ }
}
export function ShapeAfterReveal({ lens, root }: { lens: string | null; root: React.RefObject<HTMLDivElement> }) {
  const revealed = usePageRevealed();
  const written = useRef(false);
  useEffect(() => {
    if (!revealed || written.current || !root.current) return;
    written.current = true;
    const content = root.current;
    const has = (marker: string) => !!content.querySelector(marker);
    const count = (marker: string, max: number) => Math.min(max, content.querySelectorAll(marker).length);
    const comingMonths: number[] = [];
    content.querySelectorAll('[data-coming-month], [data-coming-up-item]').forEach(node => {
      if (node.hasAttribute('data-coming-month')) comingMonths.push(0);
      else if (comingMonths.length > 0) comingMonths[comingMonths.length - 1] += 1;
    });
    const boardRows = [...content.querySelectorAll('[data-hero-board-row]')].filter(node => !node.closest('[data-overview-band="alsoThisWeek"]')).length;
    writeOverviewShape(lens, {
      chips: has('[data-overview-chip-row]'), movers: has('[data-overview-movement]'),
      boardRows: clamp(boardRows, 10), fullLeaderboard: has('[data-hero-full-leaderboard]'),
      picks: has('[data-overview-picks]'), leadersRows: count('[data-leaders-group-row]', 3),
      storyBand: has('[data-overview-story-band]'), alsoEvents: count('[data-also-event]', 3),
      comingNext: has('[data-coming-next]'), comingMonths: comingMonths.slice(0, 3),
      rankingsRows: count('[data-rank-row]', 5), climb: has('[data-climb-card]'),
      newsLead: has('[data-news-shape="hero"]'), newsPair: has('[data-news-shape="pair"]'),
      newsList: count('[data-news-shape="row"]', 3),
    });
  }, [revealed, lens, root]);
  return null;
}

const BandContext = createContext<((id: string, ready: boolean) => void) | null>(null);
export function useOverviewBandReady(id: string, ready: boolean) {
  const report = useContext(BandContext);
  useEffect(() => { report?.(id, ready); }, [report, id, ready]);
}
function ReadinessReport({ id, base, expect, ready, outer, hero }: { id: string; base: boolean; expect: readonly string[]; ready: Record<string, boolean>; outer: ((id: string, ready: boolean) => void) | null; hero: boolean }) {
  const complete = base && expect.every(key => ready[key]);
  useSectionReady(hero ? id : 'overview-band-local', hero && complete);
  useEffect(() => { if (!hero) outer?.(id, complete); }, [outer, id, complete, hero]);
  return null;
}
export function OverviewReadinessBand({ id, base, expect, hero = false, children }: { id: string; base: boolean; expect: readonly string[]; hero?: boolean; children?: React.ReactNode }) {
  const outer = useContext(BandContext);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const report = useCallback((key: string, value: boolean) => setReady(previous => previous[key] === value ? previous : { ...previous, [key]: value }), []);
  return <BandContext.Provider value={report}><ReadinessReport id={id} base={base} expect={expect} ready={ready} outer={outer} hero={hero} />{children}</BandContext.Provider>;
}
export const overviewQueryReady = (query: Parameters<typeof settled>[0], enabled = true) => !enabled || settled(query);

export const SHELL_BAR_ON_PANEL = '#26262C';
const SHELL_OUTLINE = `1px solid ${WHITE_ALPHA_08}`;
const SHELL_SEPARATOR = `1px solid ${WHITE_ALPHA_06}`;
function Bar({ width = '65%', font = 13, panel = false }: { width?: string | number; font?: number; panel?: boolean }) {
  return <span data-shell-bar className="clb-shimmer-dark" style={{ display: 'block', width, maxWidth: '100%', flexShrink: 1, height: Math.round(.62 * font), borderRadius: 6, background: panel ? SHELL_BAR_ON_PANEL : MEMBER_CELL }} />;
}
function Line({ width, font = 13, line = 1.5, panel = false }: { width?: string | number; font?: number; line?: number; panel?: boolean }) {
  return <span style={{ height: font * line, display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}><Bar width={width} font={font} panel={panel} /></span>;
}
function Lines({ widths, font, line, panel = false }: { widths: Array<number | string>; font: number; line: number; panel?: boolean }) {
  return <>{widths.map((width, i) => <Line key={i} width={width} font={font} line={line} panel={panel} />)}</>;
}
function Avatar({ size, height = size, radius = '34%' }: { size: number; height?: number; radius?: string | number }) {
  return <span style={{ display: 'block', flex: 'none', width: size, height, borderRadius: radius, background: MEMBER_CELL }} />;
}
function Head({ width = 142 }: { width?: number }) {
  return <div style={{ minHeight: 28, margin: '0 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}><Line width={width} font={20} line={1.2} /><Line width={60} font={12} /></div>;
}
export function HeroShell() {
  return <div data-overview-skeleton-hero data-tour-shell="hero" style={{ height: OVERVIEW_PHOTO_BAND_HEIGHT, background: MEMBER_PANEL, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 20, right: 20, top: 159 }}>
      <Line width={144} font={11} line={2.25} panel />
      <div data-shell-headline style={{ marginTop: 6, maxWidth: 290, width: 'calc(100% - 60px)' }}><Lines widths={['var(--shell-head-1,276px)', 'var(--shell-head-2,167px)', 'var(--shell-head-3,279px)']} font={26} line={1} panel /></div>
      <div style={{ marginTop: 8, maxWidth: 'calc(100% - 62px)' }}><Line width="var(--shell-venue,263px)" font={12.5} panel /></div>
      <div style={{ marginTop: 7, display: 'flex', gap: 2 }}>{[100,23,18,87].map((width,i) => <Line key={i} width={width} font={13.5} line={1.4} panel />)}</div>
    </div>
    <div style={{ position: 'absolute', right: 20, top: 219, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}><Avatar size={26} height={27} /><div style={{ marginTop: 4 }}><Line width={39} font={21} line={1.2} panel /></div><Line width={42} font={10} line={1.5} panel /></div>
    <div style={{ position: 'absolute', left: 33, right: 22, top: 325, display: 'flex', justifyContent: 'space-between' }}>{[11, 13, 13, 13].map((width, i) => <Line key={i} width={width} font={10} line={1.2} panel />)}</div>
  </div>;
}
function ChipsShell({ rankings = false }: { rankings?: boolean }) {
  return <div data-tour-shell={rankings ? undefined : 'chips'} className={rankings ? undefined : 'overview-tour-chips'} style={{ display: 'flex', gap: rankings ? 6 : 'var(--rail-chip-gap, 6px)', overflow: 'hidden', minWidth: 0, ...(rankings ? { padding: '0 24px' } : {}) }}>
    {(rankings ? [33, 78, 30, 60] : [23, 30, 52, 65, 50]).map((width, i) => <div key={i} style={{ flex: '1 1 auto', minWidth: 0, height: rankings ? 32 : 'calc(var(--rail-chip-font, 12px) * 1.5 + 14px)', borderRadius: 11, border: SHELL_OUTLINE, padding: rankings ? '6px 11px' : '6px var(--rail-chip-pad-x, 11px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bar width={width} font={11} /></div>)}
  </div>;
}
function SmallCards({ picks = false }: { picks?: boolean }) {
  return <div style={{ display: picks ? 'grid' : 'flex', ...(picks ? { gridTemplateColumns: 'repeat(3,minmax(0,1fr))', padding: '0 20px' } : {}), gap: picks ? 6 : 8, marginTop: picks ? 0 : 8 }}>{[45, 61, 36].map((width, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, boxSizing: 'border-box', flex: 1, minWidth: 0, border: SHELL_OUTLINE, borderRadius: 12, padding: 7 }}><Avatar size={28} height={29} /><div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}><Line width={width} font={12.5} line={1.2} /><div style={{ marginTop: 1 }}><Line width={29} font={11.5} line={1.2} /></div></div></div>)}</div>;
}
function MoversShell() { return <div data-tour-shell="movers" data-overview-movement style={{ padding: '12px 20px 10px', borderTop: SHELL_SEPARATOR }}><Line width={156} font={9.5} /><SmallCards /></div>; }
const BOARD_GRID = '24px minmax(0,1fr) 32px 32px 40px';
function BoardHeader({ bleed = false }: { bleed?: boolean }) {
  return <div style={{ display: 'grid', gridTemplateColumns: BOARD_GRID, alignItems: 'end', gap: 4, padding: `2px ${bleed ? 0 : 20}px 6px`, fontSize: 10, lineHeight: 1.5 }}><div style={{ gridColumn: '1 / 3' }}><Line width={90} font={10} /></div>{[10, 12, 21].map((width, i) => <div key={i} style={{ display: 'flex', justifyContent: 'center' }}><Line width={width} font={10} /></div>)}</div>;
}
function BoardRow({ index, bleed = false }: { index: number; bleed?: boolean }) {
  return <div data-shell-board-row style={{ display: 'grid', gridTemplateColumns: BOARD_GRID, gap: 4, alignItems: 'center', minHeight: 31, padding: '4px 20px', width: bleed ? 'calc(100% + 40px)' : '100%', margin: bleed ? '0 -20px' : undefined }}><Line width={index % 3 ? 14 : 10} font={12.5} line={1.2} /><Line width={[77, 100, 105, 84, 92, 68, 53, 76, 70, 93][index % 10]} font={13} line={1.15} />{[14, 29, 17].map((width, i) => <div key={i} style={{ display: 'flex', justifyContent: 'center' }}><Line width={width} font={i === 2 ? 15 : 12} line={1.5} /></div>)}</div>;
}
export function BoardShell({ rows = 0, full = false }: { rows?: number; full?: boolean }) {
  return <div data-tour-shell="board" className="hero-expand-board" style={{ background: PAGE_CANVAS, paddingTop: 0 }}><BoardHeader />{Array.from({ length: rows }, (_, i) => <BoardRow key={i} index={i} />)}{full && <div className="hero-full-leaderboard" style={{ border: SHELL_OUTLINE }}><Line width={109} font={14} /><Line width={64} font={13} /></div>}</div>;
}
function PicksShell() {
  return <div data-tour-shell="picks" data-overview-picks style={{ paddingTop: 8 }}><div style={{ margin: '0 20px', borderTop: SHELL_SEPARATOR }} /><div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', gap: 8 }}><Line width={176} font={11} /><Line width={85} font={9.5} /></div><div style={{ padding: '8px 20px', margin: '-12px 0 2px', minHeight: 32 }}><Line width={219} font={13.5} line={1.35} /></div><div style={{ margin: '0 20px 12px' }}><Line width="94%" font={13.5} line={1.45} /></div><SmallCards picks /></div>;
}
function LeadersShell({ rows }: { rows: number }) {
  const grid = '24px minmax(0,1fr) 40px 40px 40px';
  return <section data-tour-shell="leaders" style={{ padding: '14px 20px 12px', marginTop: 6, borderTop: SHELL_SEPARATOR, lineHeight: 'normal' }}><Line width={151} font={11} line={1.2} /><div style={{ marginTop: 6 }}><Line width={176} font={13.5} line={1.2} /></div><div style={{ display: 'grid', gridTemplateColumns: grid, gap: 4, alignItems: 'center', marginTop: 10, paddingBottom: 6 }}>{[21, 42, 29, 37, 21].map((width, i) => <Line key={i} width={width} font={10} line={1.5} />)}</div>{Array.from({ length: rows }, (_, i) => <div key={i} data-shell-leaders-row style={{ display: 'grid', gridTemplateColumns: grid, gap: 4, minHeight: 33, alignItems: 'center' }}><Line width={10} font={11} /><div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><Avatar size={22} height={23} /><Line width={[81, 87, 110][i]} font={13.5} line={1.2} /></div><span /><span /><Line width={17} font={15} /></div>)}</section>;
}
function StoryShell() { return <div data-tour-shell="story" style={{ position: 'relative', height: 340, overflow: 'hidden', background: MEMBER_PANEL }}><div style={{ position: 'absolute', top: 13, left: 24, right: 24 }}><Line width={183} font={9} line={1.2} panel /></div><div style={{ position: 'absolute', left: 24, right: 24, bottom: 14 }}><Lines widths={['99%', '66%']} font={25} line={1.13} panel /><div style={{ marginTop: 9 }}><Lines widths={['92%', '94%', '38%']} font={13.5} line={1.48} panel /></div></div></div>; }
export function AlsoThisWeekShell({ events = 0 }: { events?: number }) {
  return <section data-tour-shell="alsoThisWeek" className="also-week"><Head />{Array.from({ length: events }, (_, i) => <div key={i} data-shell-also-event className="also-event" style={{ borderBottom: i === events - 1 ? 0 : SHELL_SEPARATOR }}><div className="also-head"><div className="also-kick"><Line width={90} font={9.5} line={1.2} /><Line width={47} font={9.5} line={1.2} /></div><div className="also-title"><span><Line width={244} font={17} line={1.25} /></span></div><div className="also-sub"><Line width={170} font={12} line={1.35} /></div><div className="also-sit"><Line width={255} font={13.5} line={1.4} /></div><div className="also-chase"><div className="also-track" /><div className="also-axis">{[37, 36, 36].map((width, j) => <Line key={j} width={width} font={9} line={1.5} />)}</div></div></div><div className="also-board"><div className="hero-expand-board" style={{ paddingTop: 0 }}><BoardHeader bleed /><div style={{ padding: '9px 0 3px', display: 'flex', alignItems: 'baseline', gap: 8 }}><Line width={13} font={11} /><Line width={55} font={9.5} /></div>{Array.from({ length: 4 }, (_, j) => <BoardRow key={j} index={j} bleed />)}</div></div></div>)}</section>;
}
export function ComingUpShell({ next = false, months = [] }: { next?: boolean; months?: number[] }) {
  return <section data-tour-shell="comingUp" className="coming-up"><Head width={105} />{next && <article data-shell-coming-next className="coming-next" style={{ border: SHELL_OUTLINE, background: MEMBER_PANEL }}><div className="coming-photo" style={{ background: MEMBER_PANEL }}><div className="coming-over"><div className="coming-kick"><Line width={102} font={9.5} line={1.2} panel /><span className="coming-tag" style={{ border: SHELL_OUTLINE }}><Line width={82} font={9} line={1.2} panel /></span></div><div className="coming-name"><Lines widths={[167, 149]} font={21} line={1.18} panel /></div><div className="coming-venue"><Line width={260} font={12.5} panel /></div></div></div><div className="coming-when"><div className="coming-dates"><Line width={156} font={15} /></div><div className="coming-away"><Line width={52} font={12.5} /></div></div><div className="coming-facts" style={{ borderColor: WHITE_ALPHA_08 }}>{[0, 1].map(i => <div key={i} className="coming-fact" style={{ borderColor: WHITE_ALPHA_08 }}><div className="coming-fv" style={{ display: 'flex', justifyContent: 'center' }}><Line width={49} font={16} /></div><div className="coming-fl" style={{ display: 'flex', justifyContent: 'center' }}><Line width={55} font={9} /></div></div>)}</div><div className="coming-last"><Avatar size={30} height={32} /><span className="coming-last-text"><Line width={230} font={13} line={1.4} /></span></div><div className="coming-actions">{[0, 1].map(i => <div key={i} className="coming-pill" style={{ border: SHELL_OUTLINE, background: i === 1 ? MEMBER_CELL : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Line width={i ? 88 : 98} font={13} line={1.15} /></div>)}</div></article>}{months.map((rows, month) => <React.Fragment key={month}><div className="coming-month"><Line width={72} font={10.5} /></div>{Array.from({ length: rows }, (_, i) => <div key={i} data-shell-coming-row className="coming-row" style={{ borderBottom: SHELL_SEPARATOR }}><div className="coming-date" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div className="coming-day"><Line width={26} font={22} line={1} /></div><div className="coming-week"><Line width={21} font={9} /><Line width={22} font={9} /></div></div><div className="coming-mid"><div className="coming-kick"><Line width={55} font={9.5} /></div><div className="coming-row-name"><Lines widths={['95%', '60%']} font={15} line={1.25} /></div><div className="coming-row-venue"><Line width="95%" font={12} /></div></div><div className="coming-right"><div className="coming-row-away"><Line width={58} font={12.5} /></div><div className="coming-purse"><Line width={34} font={11.5} /></div></div></div>)}</React.Fragment>)}</section>;
}
const RANK_GRID = '26px minmax(0,1fr) 58px 48px';
export function RankingsShell({ rows = 0, climb = false }: { rows?: number; climb?: boolean }) {
  return <section data-tour-shell="rankings"><Head width={149} /><ChipsShell rankings /><div style={{ margin: '16px 24px 0' }}><Lines widths={['95%', '20%']} font={13.5} line={1.4} /></div><div style={{ display: 'grid', gridTemplateColumns: RANK_GRID, columnGap: 10, alignItems: 'end', margin: '16px 24px 0', paddingBottom: 6, borderBottom: SHELL_SEPARATOR }}>{[27, 37, 68, 36].map((width, i) => <Line key={i} width={width} font={9} line={1.5} />)}</div>{Array.from({ length: rows }, (_, i) => <div key={i} data-shell-rank-row style={{ width: '100%', minHeight: 58, padding: '9px 24px', display: 'grid', gridTemplateColumns: RANK_GRID, columnGap: 10, alignItems: 'center' }}><Line width={10} font={14} /><div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 11 }}><Avatar size={34} height={36} /><div style={{ minWidth: 0, flex: 1 }}><Line width={[115, 86, 108, 110, 110][i]} font={14.5} /><div style={{ marginTop: 6 }}><Bar width={i ? '50%' : '100%'} font={5} /></div></div></div><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Line width={10} font={12} /></div><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Line width={27} font={15} /></div></div>)}{climb && <div data-shell-climb style={{ margin: '14px 16px 0', padding: '12px 14px', borderRadius: 14, background: MEMBER_PANEL, border: SHELL_OUTLINE, display: 'flex', alignItems: 'center', gap: 12, width: 'calc(100% - 32px)', minHeight: 85 }}><div style={{ minWidth: 0 }}><Line width={169} font={9} /><div style={{ marginTop: 3 }}><Lines widths={[204, 86]} font={14} line={1.5} /></div></div></div>}</section>;
}
function NewsStoryShell({ kind }: { kind: 'hero' | 'pair' | 'row' }) {
  const panel = kind === 'hero';
  return <div data-shell-news-shape={kind} className={`overview-news-story overview-news-${kind}`}><div className="overview-news-photo" style={{ background: MEMBER_PANEL, ...(kind === 'row' ? { order: 2 } : {}) }} /><div className="overview-news-copy"><div className="overview-news-kicker"><Line width={kind === 'row' ? 140 : 100} font={10} line={1.5} panel={panel} /></div><h3><Lines widths={kind === 'hero' ? ['88%', '82%', '20%'] : ['90%', '98%', '40%']} font={kind === 'hero' ? 27 : kind === 'pair' ? 15 : 15.5} line={kind === 'hero' ? 1.12 : kind === 'pair' ? 1.28 : 1.3} panel={panel} /></h3>{panel && <p><Lines widths={['96%', '82%', '61%']} font={14.5} line={1.45} panel /></p>}<div className="overview-news-details"><Line width={132} font={11.5} panel={panel} /></div></div></div>;
}
export function NewsShell({ lead = false, pair = false, list = 0 }: { lead?: boolean; pair?: boolean; list?: number }) {
  return <section data-tour-shell="news" className="overview-news"><Head width={54} />{lead && <NewsStoryShell kind="hero" />}<div style={{ padding: '0 24px' }}>{pair && <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, marginTop: 24 }}>{[0, 1].map(i => <NewsStoryShell key={i} kind="pair" />)}</section>}{list > 0 && <section style={{ marginTop: 10 }}>{Array.from({ length: list }, (_, i) => <div key={i} data-shell-news-list style={{ borderTop: i === 0 ? 'none' : SHELL_SEPARATOR }}><NewsStoryShell kind="row" /></div>)}</section>}</div></section>;
}
export function TourOverviewShell({ shape }: { shape: OverviewShape }) {
  const below = shape.storyBand || shape.alsoEvents > 0 || shape.comingNext || shape.comingMonths.length > 0 || shape.rankingsRows > 0 || shape.climb || shape.newsLead || shape.newsPair || shape.newsList > 0;
  return <div data-tour-overview-fallback aria-hidden style={{ minHeight: '100vh', background: PAGE_CANVAS }}><style>{`
[data-tour-overview-fallback] .coming-photo::after,
[data-tour-overview-fallback] .overview-news-photo::after { content: none; }
[data-tour-overview-fallback] .overview-news-hero .overview-news-copy { bottom: 22px; }
@media (max-width:340px) {
 [data-tour-overview-fallback] { --shell-head-1:83px; --shell-head-2:185px; --shell-head-3:167px; --shell-venue:218px; }
}
`}</style><HeroShell />{shape.chips && <ChipsShell />}{shape.movers && <MoversShell />}{(shape.boardRows > 0 || shape.fullLeaderboard) && <BoardShell rows={shape.boardRows} full={shape.fullLeaderboard} />}{shape.picks && <PicksShell />}{shape.leadersRows > 0 && <LeadersShell rows={shape.leadersRows} />}<div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: below ? 32 : 0 }}>{shape.storyBand && <StoryShell />}{shape.alsoEvents > 0 && <AlsoThisWeekShell events={shape.alsoEvents} />}{(shape.comingNext || shape.comingMonths.length > 0) && <ComingUpShell next={shape.comingNext} months={shape.comingMonths} />}{(shape.rankingsRows > 0 || shape.climb) && <RankingsShell rows={shape.rankingsRows} climb={shape.climb} />}{(shape.newsLead || shape.newsPair || shape.newsList > 0) && <NewsShell lead={shape.newsLead} pair={shape.newsPair} list={shape.newsList} />}</div></div>;
}
