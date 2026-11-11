import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { compareRows, shortenCourseName, whyLine } from '@/components/courses/top100/theArgument';
import { Top100CompareChart, chartRows } from '@/components/courses/top100/Top100CompareChart';
import { Top100OneRatingAway, oneRatingAway } from '@/components/courses/top100/Top100OneRatingAway';
import { Top100YourHundred } from '@/components/courses/top100/Top100YourHundred';
import { TheArgumentSection } from '@/components/courses/top100/TheArgumentSection';
import { communityOrder } from '@/components/courses/top100/communityOrder';
import { gbi19 } from './top100GolfersVersus.fixture';

const f=vi.hoisted(()=>({ placeholder:false, user:{id:'me'} as {id:string}|null }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback',()=>({CourseImageFallback:()=>null}));
vi.mock('@/components/ui/BottomSheet',()=>({BottomSheet:({children}: {children:React.ReactNode})=><div role="dialog">{children}</div>}));
vi.mock('@/components/courses/browse/PageLoadGate',()=>({PageLoadGate:({children}:{children:React.ReactNode})=><>{children}</>,usePageRevealed:()=>true,useSectionReady:()=>{}}));
vi.mock('@/components/courses/BrowseCourseCard',()=>({default:()=>null}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:f.user})}));
vi.mock('@/hooks/useGolfCoursesInfinite',()=>({useGolfCoursesInfinite:()=>({data:{pages:[gbi19.map(c=>({...c,country:'England',thumbnail_image:null,list_memberships:[{list_slug:'gb-i',rank:c.publishedRank},{list_slug:'global',rank:c.publishedRank}]}))]},isLoading:false,isError:false,isPlaceholderData:f.placeholder})}));
vi.mock('@/hooks/top100/useTop100Enrichment',()=>({useTop100Enrichment:()=>({data:new Map(gbi19.map(c=>[c.id,{rating:c.rating,ratingCount:c.ratingCount,subScores:c.subScores}])),isLoading:false})}));
vi.mock('@/hooks/useTop100ProgressForUser',()=>({useTop100ProgressForUser:()=>({data:{lists:[{listSlug:'gb-i',played:23,total:100},{listSlug:'global',played:8,total:100}]},isLoading:false,isFetchedAfterMount:true})}));
vi.mock('@/hooks/top100/useTop100GolferBaseline',()=>({useTop100GolferBaseline:()=>new Map()}));
vi.mock('@/hooks/top100/useTop100Race',()=>({useTop100Race:()=>({data:[{user_id:'me',is_viewer:true,pos:3,total_members:35}],isPending:false,isError:false,isPlaceholderData:false})}));
vi.mock('@/hooks/gam/useTop100ListProgress',()=>({useTop100ListProgress:()=>({data:[],isPending:false})}));
vi.mock('@/components/courses/top100/Top100RaceSection',()=>({Top100RaceSection:()=> <div data-top100-race /> }));
vi.mock('@/components/courses/top100/YourHundredSection',()=>({YourCoursesDropdown:()=> <div data-your-courses /> }));
import Top100CoursesHubPanel from '@/components/courses/Top100CoursesHubPanel';
const rows=compareRows(gbi19);
function wrapper({children}:{children:React.ReactNode}) { return <MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider></MemoryRouter>; }
afterEach(cleanup);
beforeEach(()=>{sessionStorage.clear();f.placeholder=false;f.user={id:'me'};});

describe('signed-off course-name rule',()=>{
 it.each([
 ['Kingsbarns Golf Links','Kingsbarns'],['Royal County Down Golf Club (Championship)','Royal County Down (Championship)'],['European Club','European Club'],['The Honors Course','The Honors Course'],["Prince's Golf Club (Shore, Dunes & Himalayas)","Prince's (Shore, Dunes & Himalayas)"],
 ])('%s preserves only the documented name parts',(name,result)=>expect(shortenCourseName(name)).toBe(result));
});
describe('live GB&I qualifying set',()=>{
 it('Kingsbarns leads at list position 5',()=>{expect(rows.find(c=>c.name==='Kingsbarns Golf Links')).toMatchObject({memberRank:1,listRank:5});});
 it('Kings has +9',()=>{expect(rows.find(c=>c.name==='Gleneagles (King’s)')?.divergence).toBe(9);});
 it('Ailsa has -9',()=>{expect(rows.find(c=>c.name==='Trump Turnberry Resort - Ailsa')?.divergence).toBe(-9);});
 it('seven of the top ten agree',()=>{expect(rows.filter(c=>c.listRank<=10 && c.memberRank<=10)).toHaveLength(7);});
 it.each([
 ['Gleneagles (King’s)','Best design and clubhouse of the 19'],['Queenwood Golf Club','Best facilities of the 19'],['Trump Turnberry Resort - Ailsa','Weakest on condition: 8.9, 13th of the 19'],['European Club','Lowest facilities and clubhouse of the 19'],
 ])('explains %s from category positions',(name,expected)=>{const row=rows.find(c=>c.name===name);expect(row).toBeDefined();if(row) expect(whyLine(row,19)).toBe(expected);});
 it('headline uses published rank 12',()=>{render(<TheArgumentSection rows={rows} higher={[]} lower={[]} ratedCount={19} listLabel="GB&I" renderedList="gb-i" onOpenCourse={vi.fn()} />);expect(screen.getByText('Golfers put Kingsbarns 1st. The list has it 12th.')).toBeInTheDocument();});
});
describe('comparison chart',()=>{
 it('19 caps at 10 in official order and opens all 19',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);expect(container.querySelectorAll('.t100b-crow')).toHaveLength(10);expect(chartRows(rows).map(c=>c.listRank)).toEqual(chartRows(rows).map(c=>c.listRank).sort((a,b)=>a-b));expect(screen.getByText('The 10 biggest gaps of the 19, in official order')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'SEE ALL 19 COMPARED'}));expect(screen.getByRole('dialog').querySelectorAll('.t100b-crow')).toHaveLength(19);});
 it('12 shows all without cap or link',()=>{const {container}=render(<Top100CompareChart rows={rows.slice(0,12)} onOpenCourse={vi.fn()} />);expect(container.querySelectorAll('.t100b-crow')).toHaveLength(12);expect(container.querySelector('.t100b-caption')).toBeNull();expect(container.querySelector('.t100b-see-all')).toBeNull();});
 it('selection dims others, opens the course and clears on repeat',()=>{const open=vi.fn();const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={open} />);const target=chartRows(rows)[0];fireEvent.click(screen.getByRole('button',{name:target.name}));expect(container.querySelectorAll('[data-dim=true]')).toHaveLength(9);fireEvent.click(screen.getByRole('button',{name:`${target.name}, open course`}));expect(open).toHaveBeenCalledExactlyOnceWith(target.id);fireEvent.click(screen.getByRole('button',{name:target.name}));expect(container.querySelector('.t100b-detail-button')).toBeNull();});
 it('all-sheet detail closes before the course opens',()=>{const open=vi.fn();render(<Top100CompareChart rows={rows} onOpenCourse={open} />);fireEvent.click(screen.getByRole('button',{name:'SEE ALL 19 COMPARED'}));const dialog=screen.getByRole('dialog');fireEvent.click(within(dialog).getByRole('button',{name:rows[0].name}));fireEvent.click(within(dialog).getByRole('button',{name:`${rows[0].name}, open course`}));expect(screen.queryByRole('dialog')).toBeNull();expect(open).toHaveBeenCalledWith(rows[0].id);});
 it('chart controls have only their scoped class',()=>{const {container}=render(<Top100CompareChart rows={rows} onOpenCourse={vi.fn()} />);for(const button of container.querySelectorAll('button'))expect(['t100b-crow','t100b-see-all']).toContain(button.className);});
});
describe('one rating away',()=>{
 const near=Array.from({length:12},(_,i)=>({...gbi19[0],id:`near${i}`,publishedRank:12-i,ratingCount:2,ratedByYou:i===0}));
 it('exactly two only, viewer exclusions and published order',()=>{expect(oneRatingAway([...near,{...near[0],id:'one',ratingCount:1},{...near[0],id:'three',ratingCount:3}]).map(c=>c.id)).toEqual([...near].reverse().filter(c=>!c.ratedByYou).map(c=>c.id));});
 it('caps the rail at eight',()=>{const {container}=render(<Top100OneRatingAway courses={near} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />);expect(container.querySelectorAll('.t100b-near-card')).toHaveLength(8);});
 it('empty eligible set is hidden',()=>{const {container}=render(<Top100OneRatingAway courses={[]} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={vi.fn()} />);expect(container.firstChild).toBeNull();});
 it('rate action carries course id',()=>{const rate=vi.fn();render(<Top100OneRatingAway courses={[near[1]]} listLabel="GB&I" onOpenCourse={vi.fn()} onRate={rate} />);fireEvent.click(screen.getByRole('button',{name:'Rate it'}));expect(rate).toHaveBeenCalledWith('near1');});
});
describe('Your hundred and active-list identity',()=>{
 it('hidden below five',()=>{const {container}=render(<Top100YourHundred played={4} total={100} position={3} members={35}>{()=>null}</Top100YourHundred>);expect(container.firstChild).toBeNull();});
 it('23 of 100, 3rd of 35 and only the sheet mounts race and courses',()=>{const {container}=render(<Top100YourHundred played={23} total={100} position={3} members={35}>{()=> <><div data-top100-race /><div data-your-courses /></>}</Top100YourHundred>);expect(container.textContent).toContain('23 of 100 · 3rd of 35');expect(container.querySelector('[data-top100-race]')).toBeNull();fireEvent.click(screen.getByRole('button'));expect(screen.getByRole('dialog').querySelector('[data-top100-race]')).not.toBeNull();expect(screen.getByRole('dialog').querySelector('[data-your-courses]')).not.toBeNull();});
 it('saved GB&I member has one section across placeholder Global and GB&I switches',async()=>{
 sessionStorage.setItem('top100-last-filters',JSON.stringify({list:'gb-i'}));const {container,rerender}=render(<Top100CoursesHubPanel />, {wrapper});
 const check=(list:string,label:string)=>{const sections=container.querySelectorAll('[data-golfers-versus]');expect(sections).toHaveLength(1);expect(sections[0].getAttribute('data-golfers-versus')).toBe(list);expect(sections[0].querySelector('.t100b-sub')?.textContent).toContain(`19 ${label} courses`);};check('gb-i','GB&I');
 for(const [label,slug] of [['Global','global'],['GB&I','gb-i']]) {f.placeholder=true;fireEvent.click(screen.getByRole('tab',{name:label}));expect(container.querySelectorAll('[data-golfers-versus]')).toHaveLength(1);f.placeholder=false;await act(async()=>rerender(<Top100CoursesHubPanel />));check(slug,label);}
 expect(container.querySelector('[data-top100-race]')).toBeNull();expect(container.querySelector('[data-your-courses]')).toBeNull();fireEvent.click(screen.getByRole('button',{name:/YOUR HUNDRED/}));expect(screen.getByRole('dialog').querySelector('[data-top100-race]')).not.toBeNull();
 });
 it('two ratings at 9.9 remains below the qualifying list',()=>{const result=communityOrder([{id:'two',rating:9.9,ratingCount:2,publishedRank:1},{id:'three',rating:8,ratingCount:3,publishedRank:2}],c=>c,c=>c.publishedRank,c=>c.id);expect(result.rated.map(r=>r.course.id)).toEqual(['three']);expect(result.unrated.map(c=>c.id)).toEqual(['two']);});
});
