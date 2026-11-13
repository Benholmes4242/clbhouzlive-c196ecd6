/** Tour loading owns only readiness and remembered silhouettes, never query options.
 * Each band reports its existing reads; only the mounted first-paint slide is required.
 * Shape storage is best-effort and written once after the shared gate reveals. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { settled, usePageRevealed, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { MEMBER_CELL, MEMBER_PANEL, PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { WHITE_ALPHA_06 } from '../../_shared/tokens';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { OverviewSectionHead } from '../../overview/sections/OverviewSectionHead';
import '../../overview/sections/alsoWeek.css';
import '../../overview/sections/comingUp.css';

export const TOUR_OVERVIEW_GATE_IDS = ['hero', 'stories', 'alsoThisWeek', 'comingUp', 'rankings'] as const;
export const OVERVIEW_SHAPE_MAX_AGE = 12 * 60 * 60 * 1000;
export type OverviewShape = { board: boolean; alsoThisWeek: boolean; comingUp: boolean; rankings: boolean; news: boolean; at?: number };
export const EMPTY_OVERVIEW_SHAPE: OverviewShape = { board: false, alsoThisWeek: false, comingUp: false, rankings: false, news: false };
export function readOverviewShape(lens: string | null = 'all', now = Date.now()): OverviewShape {
  try {
    const value = JSON.parse(localStorage.getItem(`tour-overview-shape:${lens ?? 'all'}`) ?? 'null');
    if (!value || typeof value.at !== 'number' || now - value.at > OVERVIEW_SHAPE_MAX_AGE || value.at > now) return { ...EMPTY_OVERVIEW_SHAPE };
    const shape = { ...EMPTY_OVERVIEW_SHAPE };
    for (const key of Object.keys(shape) as Array<keyof typeof EMPTY_OVERVIEW_SHAPE>) {
      if (typeof value[key] !== 'boolean') return { ...EMPTY_OVERVIEW_SHAPE };
      Object.assign(shape, { [key]: value[key] });
    }
    return { ...shape, at: value.at };
  } catch { return { ...EMPTY_OVERVIEW_SHAPE }; }
}
export function writeOverviewShape(lens: string | null, shape: OverviewShape) {
  try { localStorage.setItem(`tour-overview-shape:${lens ?? 'all'}`, JSON.stringify({ ...shape, at: Date.now() })); } catch { /* Storage is optional. */ }
}
export function ShapeAfterReveal({ lens, root }: { lens: string | null; root: React.RefObject<HTMLDivElement> }) {
  const revealed = usePageRevealed();
  const written = useRef(false);
  useEffect(() => {
    if (!revealed || written.current || !root.current) return;
    written.current = true;
    const content = root.current;
    const sections = content.querySelector('#content-below-hero > div > div');
    writeOverviewShape(lens, {
      board: !!content.querySelector('[data-overview-board-header]'),
      alsoThisWeek: !!content.querySelector('.also-week'), comingUp: !!content.querySelector('.coming-up'),
      rankings: !!sections?.querySelector(':scope > section:not(.also-week):not(.overview-news)'),
      news: !!content.querySelector('.overview-news'),
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

function Bar({ width = '65%', height = '0.72em' }: { width?: string; height?: string | number }) { return <span className="clb-shimmer-dark" style={{ display: 'inline-block', verticalAlign: 'middle', width, height, borderRadius: 6, background: MEMBER_CELL }} />; }
function Line({ className, width }: { className?: string; width?: string }) { return <div className={className}><Bar width={width} />{' '}</div>; }
function Head() { return <OverviewSectionHead title=" " meta={<Bar width="40%" height={14} />} />; }
export function HeroShell() { return <div data-overview-skeleton-hero data-tour-shell="hero" style={{ height: OVERVIEW_PHOTO_BAND_HEIGHT, background: MEMBER_PANEL }} />; }
export function BoardShell() { return <div data-tour-shell="board" style={{ height: 142, overflow: 'hidden', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><div style={{ height: 65, padding: '14px 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}>{[0, 1, 2].map(i => <div key={i} style={{ width: '25%' }}><Bar width="72%" height={8} /><div style={{ marginTop: 8 }}><Bar width="100%" height={14} /></div></div>)}</div><div style={{ height: 44, borderBottom: `1px solid ${WHITE_ALPHA_06}` }} /></div>; }
export function AlsoThisWeekShell() { return <section data-tour-shell="alsoThisWeek" className="also-week"><Head /><div className="also-event"><Line className="also-kick" /><div className="also-title"><span><Bar />{' '}</span></div></div></section>; }
export function ComingUpShell() { return <section data-tour-shell="comingUp" className="coming-up"><Head /><article className="coming-next"><div className="coming-plain"><Line className="coming-kick" /><Line className="coming-name" /></div><div className="coming-when"><Line className="coming-dates" /></div><div className="coming-actions"><div className="coming-pill" style={{ height: 38 }} /></div></article></section>; }
export function RankingsShell() { return <section data-tour-shell="rankings"><Head /><div style={{ minHeight: 58, padding: '9px 24px', display: 'flex', alignItems: 'center' }}><Bar height={14} /></div></section>; }
export function NewsShell() { return <section data-tour-shell="news" className="overview-news"><Head /><div style={{ height: 340, background: MEMBER_PANEL }} /></section>; }
export function TourOverviewShell({ shape }: { shape: OverviewShape }) {
  const shells = useMemo(() => ({ alsoThisWeek: AlsoThisWeekShell, comingUp: ComingUpShell, rankings: RankingsShell, news: NewsShell }), []);
  return <div data-tour-overview-fallback aria-hidden style={{ minHeight: '100vh', background: PAGE_CANVAS }}><HeroShell />{shape.board && <BoardShell />}<div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: Object.keys(shells).some(key => shape[key as keyof OverviewShape]) ? 32 : 0 }}>{Object.entries(shells).map(([key, Shell]) => shape[key as keyof OverviewShape] ? <Shell key={key} /> : null)}</div></div>;
}
