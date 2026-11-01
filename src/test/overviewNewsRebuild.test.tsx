import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
import { OverviewNews } from '@/features/tourhub/overview/sections/OverviewNews';
import { NewsDetails, OverviewNewsStory } from '@/features/tourhub/overview/sections/OverviewNewsStory';
import { newsAge, newsDetails, newsPlayers, orderedNewsPlayers, storyPlayerIds, NEWS_TOUR_LABELS, type NewsPresentation } from '@/features/tourhub/overview/sections/overviewNewsRules';
import { isNewStory, markNewsOpened, NEWS_LAST_SEEN, NEWS_OPENED, readNewsVisit, useNewsVisit } from '@/features/tourhub/news/newsVisit';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
const i18n = createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', initAsync: false, resources: { en: { tourhub: en } }, interpolation: { escapeValue: false } });
const now = new Date('2026-11-01T12:00:00Z');
const story = (id = 'a', extras: Partial<TourStory> = {}): TourStory => ({ id, slug: id, kicker: 'Moving day', headline: 'The final group', standfirst: 'A real standfirst', image_url: 'photo.jpg', image_credit: null, tour_slug: 'pga', tournament_id: null, published_at: now.toISOString(), body_blocks: [], ...extras });
const base: NewsPresentation = { isNew: false, liveRound: null, players: [], now };
const wrap = (node: React.ReactNode) => render(<I18nextProvider i18n={i18n}><MemoryRouter>{node}</MemoryRouter></I18nextProvider>);
const playersStory = story('a', { body_blocks: [{ type: 'player', player_id: 'a' }, { type: 'stat', player_id: 'b' }, { type: 'round', player_id: 'a', tournament_id: 't' }, { type: 'player', player_id: 'c' }, { type: 'player', player_id: 'd' }] });
const names = new Map(['a','b','c','d'].map(id => [id, `Player ${id.toUpperCase()}`]));
const board = (id: string, values: Partial<BoardEntry> = {}): BoardEntry => ({ id: `row-${id}`, player: { id, full_name: `Player ${id.toUpperCase()}` }, position: 2, position_tied: true, score: -15, today: -4, today_round: 4, thru: 9, ...values });
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('device News freshness', () => {
  it('first visit marks nothing', () => expect(isNewStory(story(), readNewsVisit())).toBe(false));
  it('published after the baseline is new', () => { localStorage.setItem(NEWS_LAST_SEEN, String(now.getTime()-1)); expect(isNewStory(story(), readNewsVisit())).toBe(true); });
  it('equal to baseline is not new', () => { localStorage.setItem(NEWS_LAST_SEEN, String(now.getTime())); expect(isNewStory(story(), readNewsVisit())).toBe(false); });
  it('older than baseline is not new', () => { localStorage.setItem(NEWS_LAST_SEEN, String(now.getTime()+1)); expect(isNewStory(story(), readNewsVisit())).toBe(false); });
  it('opening clears freshness', () => { localStorage.setItem(NEWS_LAST_SEEN, String(now.getTime()-1)); expect(markNewsOpened('a')).toBe(true); expect(isNewStory(story(), readNewsVisit())).toBe(false); });
  it('retains only the newest 100 IDs', () => { localStorage.setItem(NEWS_OPENED, JSON.stringify(Array.from({ length:100 }, (_,i)=>String(i)))); markNewsOpened('new'); expect(readNewsVisit().openedIds).toHaveLength(100); expect(readNewsVisit().openedIds[0]).toBe('new'); expect(readNewsVisit().openedIds).not.toContain('99'); });
  it('reopening moves the ID to the front without duplicates', () => { localStorage.setItem(NEWS_OPENED, JSON.stringify(['a','b'])); markNewsOpened('b'); expect(readNewsVisit().openedIds).toEqual(['b','a']); });
  it('failed reads suppress indicators without throwing', () => { vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{ throw Error('denied'); }); expect(readNewsVisit().available).toBe(false); expect(isNewStory(story(),readNewsVisit())).toBe(false); expect(()=>markNewsOpened('a')).not.toThrow(); });
  it('failed opened writes suppress mounted indicators', () => { localStorage.setItem(NEWS_LAST_SEEN,String(now.getTime()-1)); const r=renderHook(()=>useNewsVisit()); vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('denied');}); act(()=>{markNewsOpened('a');}); expect(r.result.current.visit.available).toBe(false); });
  it('invalid storage suppresses indicators', () => { localStorage.setItem(NEWS_OPENED,'{}'); expect(readNewsVisit().available).toBe(false); });
  it('invalid baseline suppresses indicators', () => { localStorage.setItem(NEWS_LAST_SEEN,'bad'); expect(readNewsVisit().available).toBe(false); });
  for (const first of [true,false]) it(`writes after one second half visible and holds the ${first?'first':'previous'} baseline`, () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    if (!first) localStorage.setItem(NEWS_LAST_SEEN,String(now.getTime()-1000));
    let callback: IntersectionObserverCallback | undefined;
    vi.stubGlobal('IntersectionObserver',class { constructor(cb: IntersectionObserverCallback){callback=cb;} observe(){} disconnect(){} });
    function Test(){const {ref,visit}=useNewsVisit();return <section ref={ref} data-new={isNewStory(story(),visit)} />;}
    const r=render(<Test />);
    act(()=>callback?.([{isIntersecting:true,intersectionRatio:.5} as IntersectionObserverEntry],{} as IntersectionObserver));
    act(()=>vi.advanceTimersByTime(999)); expect(localStorage.getItem(NEWS_LAST_SEEN)).toBe(first?null:String(now.getTime()-1000));
    act(()=>vi.advanceTimersByTime(1));expect(localStorage.getItem(NEWS_LAST_SEEN)).toBe(String(now.getTime()+1000));expect(r.container.querySelector('section')?.getAttribute('data-new')).toBe(String(!first));vi.unstubAllGlobals();
  });
  it('visibility below half cancels the pending baseline', () => {
    vi.useFakeTimers();let callback:IntersectionObserverCallback|undefined;
    vi.stubGlobal('IntersectionObserver',class{constructor(cb:IntersectionObserverCallback){callback=cb;}observe(){}disconnect(){}});
    function Test(){const {ref}=useNewsVisit();return <section ref={ref}/>;}render(<Test/>);
    act(()=>callback?.([{isIntersecting:true,intersectionRatio:.5} as IntersectionObserverEntry],{} as IntersectionObserver));act(()=>vi.advanceTimersByTime(500));act(()=>callback?.([{isIntersecting:true,intersectionRatio:.49} as IntersectionObserverEntry],{} as IntersectionObserver));act(()=>vi.advanceTimersByTime(1000));expect(localStorage.getItem(NEWS_LAST_SEEN)).toBeNull();vi.unstubAllGlobals();
  });
});

describe('Overview details rules', () => {
  for (const [slug,label] of Object.entries(NEWS_TOUR_LABELS)) it(`${slug} uses its signed-off tour label`,()=>expect(newsDetails(story('a',{tour_slug:slug}),null,false,now).tour).toBe(label));
  for (const slug of [null,'all']) it(`omits tour ${slug}`,()=>expect(newsDetails(story('a',{tour_slug:slug}),null,false,now).tour).toBe(''));
  for (const [hours,long,short] of [[0,'just now','now'],[1,'1h ago','1h'],[23,'23h ago','23h'],[24,'yesterday','1d'],[47,'yesterday','1d'],[48,'2 days ago','2d'],[144,'6 days ago','6d'],[168,'25 Oct','25 Oct']] as const) {
    it(`long age at ${hours}h`,()=>expect(newsAge(new Date(now.getTime()-hours*3600000).toISOString(),false,now)).toBe(long));
    it(`short age at ${hours}h`,()=>expect(newsAge(new Date(now.getTime()-hours*3600000).toISOString(),true,now)).toBe(short));
  }
  it('reading time uses the shared text count',()=>expect(newsDetails(story('a',{body_blocks:[{type:'paragraph',text:Array(401).fill('word').join(' ')}]}),null).minutes).toBe(3));
  it('live replaces reading time',()=>expect(newsDetails(story(),4).minutes).toBeNull());
});
describe('Story players', () => {
  it('distinct player/stat/round IDs retain first appearance',()=>expect(storyPlayerIds(playersStory)).toEqual(['a','b','c','d']));
  it('followed players come first, stably',()=>expect(orderedNewsPlayers(playersStory,new Set(['c','b']))).toEqual(['b','c','a','d']));
  it('non-live stories show followed players only',()=>expect(newsPlayers(playersStory,new Set(['b']),names,[],null).map(p=>p.id)).toEqual(['b']));
  it('non-live guests have no chips',()=>expect(newsPlayers(playersStory,new Set(),names,[],null)).toEqual([]));
  it('live chips cap at three',()=>expect(newsPlayers(playersStory,new Set(),names,['a','b','c','d'].map(id=>board(id)),4)).toHaveLength(3));
  it('live chips only include tournament-board players',()=>expect(newsPlayers(playersStory,new Set(),names,[board('c')],4).map(p=>p.id)).toEqual(['c']));
  it('guests see live chips without followed markers',()=>expect(newsPlayers(playersStory,new Set(),names,[board('a')],4)[0]).toMatchObject({live:true,followed:false}));
  it('live chip shares tie position, score and dark score colour',()=>expect(newsPlayers(playersStory,new Set(),names,[board('a')],4)[0]).toMatchObject({position:'T2',score:'−15',color:getScoreColor(-15,'dark'),thru:'9'}));
  it('finished reads F',()=>expect(newsPlayers(playersStory,new Set(),names,[board('a',{thru:18})],4)[0].thru).toBe('F'));
  it('before starting omits thru',()=>expect(newsPlayers(playersStory,new Set(),names,[board('a',{today:null,thru:0})],4)[0].thru).toBe(''));
  it('previous-round today does not invent current thru',()=>expect(newsPlayers(playersStory,new Set(),names,[board('a',{today_round:3})],4)[0].thru).toBe(''));
  it('followed live player comes first',()=>expect(newsPlayers(playersStory,new Set(['c']),names,[board('a'),board('c')],4)[0]).toMatchObject({id:'c',followed:true}));
});

describe('Overview interactions', () => {
  function Location(){return <output data-location>{useLocation().pathname+useLocation().search}</output>;}
  it('story tap records the ID and opens its existing slug',()=>{const r=wrap(<><OverviewNews stories={[story()]}/><Location/></>);fireEvent.click(screen.getByRole('button',{name:'Read The final group'}));expect(readNewsVisit().openedIds).toEqual(['a']);expect(r.container.querySelector('output')?.textContent).toBe('/tour/news/a');});
  it('All news retains its existing destination',()=>{const r=wrap(<><OverviewNews stories={[story()]}/><Location/></>);fireEvent.click(screen.getByRole('button',{name:/All news/}));expect(r.container.querySelector('output')?.textContent).toBe('/tourhub?tab=news');});
  it('empty section stays absent',()=>{const r=wrap(<OverviewNews stories={[]}/>);expect(r.container.querySelector('[data-overview-news-lead]')).toBeNull();});
});