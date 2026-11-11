import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { compareRows, shortenCourseName, whyLine, type ArgumentInput } from '@/components/courses/top100/theArgument';
import { Top100CompareChart, chartRows } from '@/components/courses/top100/Top100CompareChart';
import { Top100OneRatingAway, oneRatingAway } from '@/components/courses/top100/Top100OneRatingAway';
import { Top100YourHundred } from '@/components/courses/top100/Top100YourHundred';
import { TheArgumentSection } from '@/components/courses/top100/TheArgumentSection';
import { communityOrder } from '@/components/courses/top100/communityOrder';
import { ordinal } from '@/lib/text/numbers';
import { gbi19 } from './top100GolfersVersus.fixture';
import { gbiLive100 } from './top100GbiLive.fixture';

const f=vi.hoisted(()=>({ placeholder:false, gateRevealed:true, user:{id:'me'} as {id:string}|null }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback',()=>({CourseImageFallback:()=>null}));
vi.mock('@/components/ui/BottomSheet',()=>({BottomSheet:({children}: {children:React.ReactNode})=><div role="dialog">{children}</div>}));
vi.mock('@/components/courses/browse/PageLoadGate',()=>({PageLoadGate:({children,fallback}:{children:React.ReactNode;fallback?:React.ReactNode})=><>{f.gateRevealed?children:fallback}</>,usePageRevealed:()=>f.gateRevealed,useSectionReady:()=>{},settled:(q:{isFetched?:boolean;isError?:boolean;status?:string})=>q.isFetched===true||q.isError===true||q.status==='success'||q.status==='error'}));
vi.mock('@/components/courses/BrowseCourseCard',()=>({default:()=>null,TOP100_PHOTO_H:178}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:f.user})}));
vi.mock('@/hooks/useGolfCoursesInfinite',()=>({useGolfCoursesInfinite:()=>({data:{pages:[gbi19.map(c=>({...c,country:'England',thumbnail_image:null,list_memberships:[{list_slug:'gb-i',rank:c.publishedRank},{list_slug:'global',rank:c.publishedRank}]}))]},isLoading:false,isError:false,isPlaceholderData:f.placeholder})}));
vi.mock('@/hooks/top100/useTop100Enrichment',()=>({useTop100Enrichment:()=>({data:new Map(gbi19.map(c=>[c.id,{rating:c.rating,ratingCount:c.ratingCount,subScores:c.subScores}])),isLoading:false})}));
vi.mock('@/hooks/useTop100ProgressForUser',()=>({useTop100ProgressForUser:()=>({data:{lists:[{listSlug:'gb-i',played:23,total:100},{listSlug:'global',played:8,total:100}]},isLoading:false,isFetchedAfterMount:true})}));
vi.mock('@/hooks/top100/useTop100GolferBaseline',()=>({useTop100GolferBaseline:()=>new Map()}));
vi.mock('@/hooks/top100/useTop100Race',()=>({useTop100Race:()=>({data:[{user_id:'me',is_viewer:true,pos:3,total_members:35}],isPending:false,isError:false,isPlaceholderData:false}),useCareerBoard:()=>({data:[],isPending:false,isError:false,isPlaceholderData:false,isFetched:true,status:'success'}),TOP100_METRIC:{'gb-i':'top_100_gbni_distinct',global:'top_100_worldwide_distinct',europe:'top_100_europe_distinct',usa:'top_100_usa_distinct'}}));
vi.mock('@/hooks/gam/useTop100ListProgress',()=>({useTop100ListProgress:()=>({data:[],isPending:false})}));
vi.mock('@/components/courses/top100/Top100RaceSection',()=>({Top100RaceSection:()=> <div data-top100-race /> }));
vi.mock('@/components/courses/top100/YourHundredSection',()=>({YourCoursesDropdown:()=> <div data-your-courses /> }));
import Top100CoursesHubPanel from '@/components/courses/Top100CoursesHubPanel';
const rows=compareRows(gbi19);
/* jsdom never applies this stylesheet, so the geometry checks read the file. */
const compareCss = readFileSync(resolve(__dirname, '../components/courses/top100/top100Compare.css'), 'utf8');
const cssRule=(sel:string)=>new RegExp(`\\.${sel}\\{[^}]*\\}`).exec(compareCss)?.[0] ?? '';
const input=(id:string,publishedRank:number,rating:number,ratingCount=5):ArgumentInput=>({id,name:id,imageUrl:null,publishedRank,rating,ratingCount});
/** list a,b,c,d against members b,c,a,d: only d agrees. */
const mixed=compareRows([input('a',1,7),input('b',2,9),input('c',3,8),input('d',4,6)]);
/** 13 courses whose member order is the exact reverse: r7 agrees, and the ten-row cap hides it. */
const reversed=(count:number)=>compareRows(Array.from({length:count},(_,i)=>input(`r${i+1}`,i+1,8+(i+1)*0.1)));
function wrapper({children}:{children:React.ReactNode}) { return <MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider></MemoryRouter>; }
afterEach(cleanup);
beforeEach(()=>{sessionStorage.clear();localStorage.clear();f.placeholder=false;f.gateRevealed=true;f.user={id:'me'};});

describe('signed-off course-name rule',()=>{
 it.each([
 ['Kingsbarns Golf Links','Kingsbarns'],['Royal County Down Golf Club (Championship)','Royal County Down (Championship)'],['European Club','European Club'],['The Honors Course','The Honors Course'],["Prince's Golf Club (Shore, Dunes & Himalayas)","Prince's (Shore, Dunes & Himalayas)"],
 ])('%s preserves only the documented name parts',(name,result)=>expect(shortenCourseName(name)).toBe(result));
});
describe('live GB&I qualifying set',()=>{
 const live=compareRows(gbiLive100);
 const row=(name:string)=>live.find(c=>c.name===name);
 it('36 qualify at two ratings and 17 are one rating away',()=>{expect(live).toHaveLength(36);expect(oneRatingAway(gbiLive100)).toHaveLength(17);});
 it.each([
 ['Tralee Golf Club',28,1,27,'Best design of the 36'],['St Andrews Links (Old)',2,26,-24,'Weakest on design: 8.0, 35th of the 36'],['The Addington Golf Club',35,35,0,'Golfers and the list agree: 35th of the 36'],
 ])('%s compares and explains from live data',(name,listRank,memberRank,divergence,why)=>{const r=row(name as string);expect(r).toMatchObject({listRank,memberRank,divergence});if(r) expect(whyLine(r,36)).toBe(why);});
 it.each([
 ['Gleneagles (King’s)',18,'Best clubhouse of the 36'],['Trump Turnberry Resort - Ailsa',-15,'Weakest on condition: 8.9, 19th of the 36'],
 ])('%s gap and why line',(name,divergence,why)=>{const r=row(name as string);expect(r?.divergence).toBe(divergence);if(r) expect(whyLine(r,36)).toBe(why);});
 it('headline uses published rank 64',()=>{render(<TheArgumentSection rows={live} higher={[]} lower={[]} ratedCount={36} listLabel="GB&I" renderedList="gb-i" onOpenCourse={vi.fn()} />);expect(screen.getByText('Golfers put Tralee 1st. The list has it 64th.')).toBeInTheDocument();});
 it('detail second line wraps with no ellipsis styling',()=>{const rule=cssRule('t100b-detail-line');expect(rule).not.toBe('');expect(rule).not.toMatch(/nowrap|text-overflow|overflow/);expect(rule).toMatch(/line-height:1\.35/);});
});
describe('comparison chart',()=>{
 it('19 caps at 10 in official order and opens all 19',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);expect(container.querySelectorAll('.t100b-crow')).toHaveLength(10);expect(chartRows(rows).map(c=>c.listRank)).toEqual(chartRows(rows).map(c=>c.listRank).sort((a,b)=>a-b));expect(screen.getByText('The 10 biggest gaps of the 19, in official order')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'SEE ALL 19'}));expect(screen.getByRole('dialog').querySelectorAll('.t100b-crow')).toHaveLength(19);});
 it('12 shows all without cap or link',()=>{const {container}=render(<Top100CompareChart rows={rows.slice(0,12)} onOpenCourse={vi.fn()} />);expect(container.querySelectorAll('.t100b-crow')).toHaveLength(12);expect(container.querySelector('.t100b-caption')).toBeNull();expect(container.querySelector('.t100b-see-all')).toBeNull();});
 it('selection dims others, opens the course and clears on repeat',()=>{const open=vi.fn();const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={open} />);const target=chartRows(rows)[0];fireEvent.click(screen.getByRole('button',{name:target.name}));expect(container.querySelectorAll('[data-dim=true]')).toHaveLength(9);fireEvent.click(screen.getByRole('button',{name:/View course/}));expect(open).toHaveBeenCalledExactlyOnceWith(target.id);expect(container.querySelectorAll('.t100b-detail')).toHaveLength(1);fireEvent.click(screen.getByRole('button',{name:target.name}));expect(container.querySelector('.t100b-detail')).toBeNull();});
 it('all-sheet detail closes before the course opens',()=>{const open=vi.fn();render(<Top100CompareChart rows={rows} onOpenCourse={open} />);fireEvent.click(screen.getByRole('button',{name:'SEE ALL 19'}));const dialog=screen.getByRole('dialog');fireEvent.click(within(dialog).getByRole('button',{name:rows[0].name}));fireEvent.click(within(dialog).getByRole('button',{name:/View course/}));expect(screen.queryByRole('dialog')).toBeNull();expect(open).toHaveBeenCalledWith(rows[0].id);});
 it('the key has exactly one item, Official rank',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);const items=container.querySelectorAll('.t100b-key-item');expect(items).toHaveLength(1);expect(items[0].textContent).toBe('Official rank');expect(items[0].querySelectorAll('.t100b-official')).toHaveLength(1);expect(container.querySelector('.t100b-key .t100b-member')).toBeNull();});
 it('no detail card or tap hint until a row is tapped; it opens inside that row, moves to another and goes on repeat',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);expect(container.querySelector('.t100b-detail')).toBeNull();expect(container.querySelector('.t100b-hint')).toBeNull();const [first,second]=chartRows(rows);fireEvent.click(screen.getByRole('button',{name:first.name}));expect(container.querySelectorAll('.t100b-detail')).toHaveLength(1);expect(container.querySelector(`[data-compare-row="${first.id}"] .t100b-detail`)).not.toBeNull();fireEvent.click(screen.getByRole('button',{name:second.name}));expect(container.querySelectorAll('.t100b-detail')).toHaveLength(1);expect(container.querySelector(`[data-compare-row="${second.id}"] .t100b-detail`)).not.toBeNull();fireEvent.click(container.querySelector(`[data-compare-row="${second.id}"] .t100b-detail`) as HTMLElement);expect(container.querySelector('.t100b-detail')).toBeNull();});
 it('the see-all button sits in the key row, nothing follows the chart and the sheet has no sticky card',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);const see=container.querySelector('.t100b-see-all');expect(see?.parentElement?.className).toBe('t100b-keyrow');expect(screen.queryByText(/COMPARED/)).toBeNull();expect(container.querySelector('.t100b-chart')?.lastElementChild?.className).toBe('t100b-rowwrap');fireEvent.click(screen.getByRole('button',{name:'SEE ALL 19'}));const dialog=screen.getByRole('dialog');fireEvent.click(within(dialog).getByRole('button',{name:rows[0].name}));expect(dialog.querySelector('.t100b-sheet-detail')).toBeNull();expect(dialog.querySelector(`[data-compare-row="${rows[0].id}"] .t100b-detail`)).not.toBeNull();expect(cssRule('t100b-sheet-detail')).toBe('');});
 it('chart controls have only their scoped class',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);fireEvent.click(screen.getByRole('button',{name:chartRows(rows)[0].name}));for(const button of container.querySelectorAll('button'))expect(['t100b-crow','t100b-see-all','t100b-view']).toContain(button.className);});
});
describe('one rating away',()=>{
 const near=Array.from({length:12},(_,i)=>({...gbi19[0],id:`near${i}`,publishedRank:12-i,ratingCount:1,ratedByYou:i===0}));
 it('exactly one only, viewer exclusions and published order',()=>{expect(oneRatingAway([...near,{...near[0],id:'zero',ratingCount:0},{...near[0],id:'two',ratingCount:2}]).map(c=>c.id)).toEqual([...near].reverse().filter(c=>!c.ratedByYou).map(c=>c.id));});
 it('caps the rail at eight',()=>{const {container}=render(<Top100OneRatingAway courses={near} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />);expect(container.querySelectorAll('.t100b-near-card')).toHaveLength(8);});
 it('empty eligible set is hidden',()=>{const {container}=render(<Top100OneRatingAway courses={[]} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />);expect(container.firstChild).toBeNull();});
 it('rate action carries course id',()=>{const rate=vi.fn();render(<Top100OneRatingAway courses={[near[1]]} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={rate} />);fireEvent.click(screen.getByRole('button',{name:'Rate it'}));expect(rate).toHaveBeenCalledWith('near1');});
});
describe('Your hundred and active-list identity',()=>{
 it('hidden below five',()=>{const {container}=render(<Top100YourHundred played={4} total={100} position={3} members={35}>{()=>null}</Top100YourHundred>);expect(container.firstChild).toBeNull();});
 it('23 of 100, 3rd of 35 and only the sheet mounts race and courses',()=>{const {container}=render(<Top100YourHundred played={23} total={100} position={3} members={35}>{()=> <><div data-top100-race /><div data-your-courses /></>}</Top100YourHundred>);expect(container.textContent).toContain('23 of 100 · 3rd of 35');expect(container.querySelector('[data-top100-race]')).toBeNull();fireEvent.click(screen.getByRole('button'));expect(screen.getByRole('dialog').querySelector('[data-top100-race]')).not.toBeNull();expect(screen.getByRole('dialog').querySelector('[data-your-courses]')).not.toBeNull();});
 it('saved GB&I member has one argument section across placeholder Global and GB&I switches',async()=>{
 sessionStorage.setItem('top100-last-filters',JSON.stringify({list:'gb-i'}));const {container,rerender}=render(<Top100CoursesHubPanel />, {wrapper});
 const check=(list:string,label:string)=>{const sections=container.querySelectorAll('[data-golfers-versus]');expect(sections).toHaveLength(1);expect(sections[0].getAttribute('data-golfers-versus')).toBe(list);expect(sections[0].querySelector('.t100b-sub')).toBeNull();expect(sections[0].querySelector('.t100b-caption')?.textContent).toBe('The 10 biggest gaps of the 19, in official order');};check('gb-i','GB&I');
 for(const [label,slug] of [['Global','global'],['GB&I','gb-i']]) {f.placeholder=true;fireEvent.click(screen.getByRole('tab',{name:label}));expect(container.querySelectorAll('[data-golfers-versus]')).toHaveLength(1);f.placeholder=false;await act(async()=>rerender(<Top100CoursesHubPanel />));check(slug,label);}
 /* The YOUR HUNDRED row, race shell and dropdown no longer mount on this page (Top 100 leaderboard Option B); with an empty board the leaderboard card is absent too. */
 expect(container.querySelector('[data-top100-race]')).toBeNull();expect(container.querySelector('[data-your-courses]')).toBeNull();expect(screen.queryByRole('button',{name:/YOUR HUNDRED/})).toBeNull();expect(container.querySelector('.t100b-lb-card')).toBeNull();
 });
 it('two ratings at 9.9 now leads the qualifying list',()=>{const result=communityOrder([{id:'two',rating:9.9,ratingCount:2,publishedRank:1},{id:'three',rating:8,ratingCount:3,publishedRank:2}],c=>c,c=>c.publishedRank,c=>c.id);expect(result.rated.map(r=>r.course.id)).toEqual(['two','three']);expect(result.unrated).toEqual([]);});
});
describe('option C: full names, the agree mark and the aligned rail',()=>{
 it('the head has no sub-line under the headline',()=>{const {container}=render(<TheArgumentSection rows={mixed} higher={[]} lower={[]} ratedCount={4} listLabel="GB&I" renderedList="gb-i" onOpenCourse={vi.fn()} />);expect(container.querySelector('.t100b-sub')).toBeNull();expect(container.querySelector('.t100b-title')?.textContent).toBe('Golfers put b 1st. The list has it 2nd.');});
 it('a row prints the full shortened name and its style never truncates',()=>{const long=compareRows([input('Royal County Down Golf Club (Championship)',1,9),input('Parkstone',2,8),input('Tralee',3,7)]);const {container}=render(<Top100CompareChart rows={long} onOpenCourse={vi.fn()} />);expect([...container.querySelectorAll('.t100b-name')].map(n=>n.textContent)).toContain('Royal County Down (Championship)');const rule=cssRule('t100b-name');expect(rule).not.toBe('');expect(rule).not.toContain('text-overflow');expect(rule).not.toContain('white-space:nowrap');});
 it('the gap label reads down n, up n or = in the matching tone',()=>{const {container}=render(<Top100CompareChart rows={mixed} onOpenCourse={vi.fn()} />);const badge=(id:string)=>container.querySelector(`button[aria-label="${id}"] .t100b-badge`);expect(badge('a')?.textContent).toBe('↓2');expect(badge('a')?.className).toContain('t100b-down');expect(badge('b')?.textContent).toBe('↑1');expect(badge('b')?.className).toContain('t100b-up');expect(badge('d')?.textContent).toBe('=');expect(badge('d')?.className).toBe('t100b-badge');});
 it('a moving row prints two position numbers, an agreeing row one dim number',()=>{const {container}=render(<Top100CompareChart rows={mixed} onOpenCourse={vi.fn()} />);expect(container.querySelectorAll('button[aria-label="a"] .t100b-num')).toHaveLength(2);expect(container.querySelectorAll('button[aria-label="d"] .t100b-num')).toHaveLength(1);expect(container.querySelector('button[aria-label="d"] .t100b-num')?.textContent).toBe('4');});
 it('an agreeing row renders one agree mark and no separate dots',()=>{const {container}=render(<Top100CompareChart rows={mixed} onOpenCourse={vi.fn()} />);const agree=container.querySelector('button[aria-label="d"]') as Element;expect(agree.querySelectorAll('.t100b-agree')).toHaveLength(1);expect(agree.querySelectorAll('.t100b-dot')).toHaveLength(0);const moving=container.querySelector('button[aria-label="a"]') as Element;expect(moving.querySelectorAll('.t100b-agree')).toHaveLength(0);expect(moving.querySelectorAll('.t100b-dot.t100b-official')).toHaveLength(1);expect(moving.querySelectorAll('.t100b-dot.t100b-member')).toHaveLength(1);});
 it('"Golfers agree" joins the key only where an agreeing row is on screen',()=>{const {container}=render(<Top100CompareChart rows={reversed(13)} onOpenCourse={vi.fn()} />);expect(container.querySelectorAll('.t100b-key-item')).toHaveLength(1);fireEvent.click(screen.getByRole('button',{name:'SEE ALL 13'}));const dialog=screen.getByRole('dialog');const items=dialog.querySelectorAll('.t100b-key-item');expect(items).toHaveLength(2);expect(items[1].textContent).toBe('Golfers agree');expect(items[1].querySelector('.t100b-agree')).not.toBeNull();});
 it('Rate it is pinned to the card bottom so every button lines up',()=>{const rail=[{...gbi19[0],id:'q0',name:"Rosapenna Golf Resort - St Patrick's Links",publishedRank:5,ratingCount:1},{...gbi19[0],id:'q1',name:'Parkstone',publishedRank:4,ratingCount:1},{...gbi19[0],id:'q2',name:'Tralee',publishedRank:3,ratingCount:1}];const {container}=render(<Top100OneRatingAway courses={rail} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />);expect(container.querySelectorAll('.t100b-near-card')).toHaveLength(3);expect(container.querySelectorAll('.t100b-rate')).toHaveLength(3);expect(container.textContent).toContain('Officially 5th · 1 of 2 ratings');expect(container.querySelector('.t100b-sub')?.textContent).toBe('3 GB&I courses have one golfer rating. A second puts each into the comparison.');expect(cssRule('t100b-near-rail')).toContain('align-items:stretch');expect(cssRule('t100b-near-card')).toContain('flex-direction:column');expect(cssRule('t100b-near-line')).toContain('margin-bottom:9px');expect(cssRule('t100b-rate')).toContain('margin-top:auto');});
});
describe('page loading skeleton',()=>{
 it('the unrevealed gate shows comparison, one-rating-away and list-head shells in page order, none after reveal',()=>{
  f.gateRevealed=false;const {container,rerender}=render(<Top100CoursesHubPanel />,{wrapper});
  const fallback=container.querySelector('[data-top100-fallback]');expect(fallback).not.toBeNull();
  const shells=[...fallback!.querySelectorAll('[data-comparison-shell],[data-near-shell],[data-list-head-shell]')].map(el=>Object.keys((el as HTMLElement).dataset)[0]);
  expect(shells).toEqual(['comparisonShell','nearShell','listHeadShell']);
  expect(container.querySelector('[data-golfers-versus]')).toBeNull();
  f.gateRevealed=true;rerender(<Top100CoursesHubPanel />);
  expect(container.querySelector('[data-top100-fallback]')).toBeNull();expect(container.querySelector('[data-golfers-versus]')).not.toBeNull();
 });
 it('a list remembered without a comparison leaves that shell out',()=>{
  sessionStorage.setItem('top100-last-filters',JSON.stringify({list:'usa'}));localStorage.setItem('top100-shape:usa',JSON.stringify({cmp:false,near:true}));
  f.gateRevealed=false;const {container}=render(<Top100CoursesHubPanel />,{wrapper});
  const fallback=container.querySelector('[data-top100-fallback]');expect(fallback).not.toBeNull();
  expect(fallback!.querySelector('[data-comparison-shell]')).toBeNull();expect(fallback!.querySelector('[data-near-shell]')).not.toBeNull();expect(fallback!.querySelector('[data-list-head-shell]')).not.toBeNull();
 });
 it('storage that throws still renders the full fallback',()=>{
  const spy=vi.spyOn(window.localStorage,'getItem').mockImplementation(()=>{throw new Error('denied');});
  try {
   f.gateRevealed=false;const {container}=render(<Top100CoursesHubPanel />,{wrapper});
   const fallback=container.querySelector('[data-top100-fallback]');expect(fallback).not.toBeNull();
   expect(fallback!.querySelector('[data-comparison-shell]')).not.toBeNull();expect(fallback!.querySelector('[data-near-shell]')).not.toBeNull();expect(fallback!.querySelector('[data-list-head-shell]')).not.toBeNull();
  } finally { spy.mockRestore(); }
 });
 it('a settled list writes its remembered shape once revealed',()=>{
  render(<Top100CoursesHubPanel />,{wrapper});
  expect(JSON.parse(localStorage.getItem('top100-shape:gb-i')!)).toEqual({cmp:true,near:false});
 });
});
describe('tapped-row panel copy',()=>{
 it('a gap row reads "Officially ranked …, but golfers rank it …" with no "the list" or "of the"',()=>{
  const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);
  const target=chartRows(rows)[0];fireEvent.click(screen.getByRole('button',{name:target.name}));
  const line=container.querySelector('.t100b-detail-line')!;
  expect(line.textContent).toBe(`Officially ranked ${target.publishedRank}${ordinal(target.publishedRank).replace(/\d+/,'')}, but golfers rank it ${ordinal(target.memberRank)}`);
  expect(line.textContent).not.toContain('the list');expect(line.textContent).not.toContain('of the');
 });
 it('an agreeing row uses "and"',()=>{
  const {container}=render(<Top100CompareChart rows={mixed} onOpenCourse={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:'d'}));
  expect(container.querySelector('.t100b-detail-line')!.textContent).toBe('Officially ranked 4th, and golfers rank it 4th');
 });
});
