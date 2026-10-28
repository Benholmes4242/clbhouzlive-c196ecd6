import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FeedPost } from '@/components/media-system/types/media';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { galleryAction, galleryFilters, galleryFit, galleryGroups, galleryPost, galleryShots, filteredGallery } from '@/lib/courseMedia/courseGallery';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { ReadyShotCover } from '@/components/course-media-tab/ReadyShotCover';
import { HoleMediaThumbnail } from '@/components/course-media-tab/HoleMediaVideo';
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { CoursePlaceTiles } from '@/components/course-media-tab/CoursePlaceTiles';
import { ShotTagCard } from '@/components/course-media-tab/ShotTagCard';
const f = vi.hoisted(() => ({ viewer: 'me', admin: false, saved: null as ((hole?: HolePhoto, place?: PlaceMedia) => void) | null }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: f.viewer } }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => f.admin }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/course-media-tab/CourseGalleryTagger', () => ({ CourseGalleryTagger: (props: { onSaved: typeof f.saved }) => { f.saved = props.onSaved; return <div data-test-tagger />; } }));
import { CourseGalleryChrome } from '@/components/fullscreen-feed/CourseGalleryChrome';

const post = (id: string, userId = 'me'): FeedPost => ({ id: `post-${id}`, userId, actorId: userId, actorType: 'personal', displayName: 'Thomas Holmes', avatarUrl: '', username: '', isVerified: false, creatorRelation: 'none', caption: '', createdAt: '2026-01-01T00:00:00Z', mediaItems: [{ id, type: 'image', imageUrl: `/${id}.jpg`, width: 1000, height: 1000 }], likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false });
const holeTag = (id: string, hole_no: number): HolePhoto => ({ id, hole_no, media_url: `/${id}.jpg`, media_type: 'image', user_id: 'me', course_id: 'course', added_at: '2026-02-01T00:00:00Z', status: 'approved' }) as HolePhoto;
const placeTag = (id: string, place: string): PlaceMedia => ({ id, place, media_url: `/${id}.jpg`, media_type: 'image', user_id: 'me', course_id: 'course', added_at: '2026-10-28T00:00:00Z', status: 'approved' }) as PlaceMedia;
const hole = (n = 1): CourseHole => ({ hole_no: n, par: 4, yards: 356, stroke_index: 10, avg_to_par: .6, avg_gross: 4.6, rounds: 2, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 1, bogey: 1, double: 0 } });
const shots = () => galleryShots([post('h3'),post('h1'),post('v'),post('c'),post('u')], [holeTag('h3',3),holeTag('h1',1)], [placeTag('v','views'),placeTag('c','clubhouse')]);
function mount(filter: 'all' | 'holes' | 'views' | 'conditions' = 'all', startShotId = 'h1', scored = true) {
  const data = { shots: shots(), holes: [hole(1),hole(3)], scored };
  const options = { courseId: 'course', courseName: 'Sundridge Park (East)', filter, startShotId };
  const list = filteredGallery(data.shots, filter);
  useFullscreenFeedStore.setState({ isOpen: true, courseGallery: options, galleryData: data, posts: galleryPost(list, options), activePagerIdx: Math.max(0,list.findIndex(shot=>shot.id===startShotId)), syntheticPosts: true, readOnly: true });
  return render(<CourseGalleryChrome onClose={vi.fn()} />);
}
beforeEach(() => { f.admin=false; f.viewer='me'; f.saved=null; useFullscreenFeedStore.setState({ isOpen: false, courseGallery:null, galleryData:null, restoreStack:[] }); });
afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ isOpen:false,courseGallery:null,galleryData:null,restoreStack:[] }); });
describe('course gallery rules', () => {
  it('eligible tagger video without duration shows its poster while its gallery square keeps the processing fallback', () => {
    const video = post('processing');
    video.mediaItems = [{ id: 'processing', type: 'video', imageUrl: '/video.m3u8', thumbnailUrl: '/poster.jpg', streamId: 'a'.repeat(32), width: 1000, height: 1000 }];
    const data = { shots: galleryShots([video], [], []), holes: [], scored: false };
    const options = { courseId: 'course', courseName: 'Course', filter: 'all' as const };
    useFullscreenFeedStore.setState({ isOpen: true, courseGallery: options, galleryData: data, posts: galleryPost(data.shots, options), activePagerIdx: 0, syntheticPosts: true, readOnly: true });
    const gallery = render(<CourseGalleryChrome onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    const square = screen.getByRole('button', { name: 'View shot processing' });
    expect(square.querySelector('img')).toBeNull();
    expect(square.querySelector('.course-gallery-thumb-fallback svg')).not.toBeNull();
    gallery.unmount();
    const shot = { url: '/video.m3u8', mediaType: 'video' as const, posterUrl: '/poster.jpg', streamId: 'a'.repeat(32) };
    const tagger = render(<ShotTagCard shot={shot} holes={[1]} hole={null} place={null} onHole={vi.fn()} onPlace={vi.fn()} pending={false} canSubmit={false} onSubmit={vi.fn()} onSkip={vi.fn()} onClose={vi.fn()}
      strip={<HoleMediaThumbnail {...shot} alreadyEligible alt="" />} />);
    expect(screen.getByAltText('Current video')).toHaveAttribute('src', '/poster.jpg');
    const dialog = tagger.container.querySelector('[role="dialog"]') ?? document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect([...(dialog as Element).querySelectorAll('img')].map(img => img.getAttribute('src'))).toEqual(['/poster.jpg', '/poster.jpg']);
    expect((dialog as Element).querySelector('.course-gallery-thumb-fallback')).toBeNull();
  });
  it('All preserves Everything order', () => expect(filteredGallery(shots(),'all').map(s=>s.id)).toEqual(['h3','h1','v','c','u']));
  it('Holes orders hole number then existing panel order', () => { const list=galleryShots([post('b'),post('a'),post('c')],[holeTag('b',1),holeTag('a',1),holeTag('c',3)],[]); expect(filteredGallery(list,'holes').map(s=>s.id)).toEqual(['a','b','c']); });
  it('place filter sorts newest first', () => { const tags=[placeTag('a','views'), {...placeTag('b','views'),added_at:'2026-10-29'}]; expect(filteredGallery(galleryShots([post('a'),post('b')],[],tags),'views').map(s=>s.id)).toEqual(['b','a']); });
  it('filters omit empty places and use shared order with exact counts', () => expect(galleryFilters(shots())).toEqual([{filter:'all',count:5},{filter:'holes',count:2},{filter:'clubhouse',count:1},{filter:'views',count:1}]));
  it('no tagged holes means no Holes filter', () => expect(galleryFilters(galleryShots([post('a')],[],[]))).toEqual([{filter:'all',count:1}]));
  it('Holes grid groups holes in numeric order', () => expect(galleryGroups(shots(),'holes').map(g=>[g.key,g.shots.map(s=>s.id)])).toEqual([['hole:1',['h1']],['hole:3',['h3']]]));
  it('place grid has exactly one group', () => expect(galleryGroups(shots(),'views').map(g=>g.key)).toEqual(['views']));
  it('All grid is one flat Everything-ordered grid with no NOT TAGGED group', () => { const groups=galleryGroups(shots(),'all'); expect(groups.map(g=>g.key)).toEqual(['all']); expect(groups[0].shots.map(s=>s.id)).toEqual(['h3','h1','v','c','u']); expect(groups.some(g=>g.key==='untagged')).toBe(false); });
  it('a doubly tagged shot appears only once in All grid', () => { const list=galleryShots([post('a')],[holeTag('a',1)],[placeTag('a','views')]); expect(galleryGroups(list,'all').flatMap(g=>g.shots)).toHaveLength(1); });
  it.each([[750,1000,'contain'],[749,1000,'cover'],[1500,1000,'contain']] as const)('framing %i by %i uses %s', (w,h,fit)=>expect(galleryFit(w,h)).toBe(fit));
  it('owner untagged shot permits Tag', () => expect(galleryAction(galleryShots([post('u')],[],[])[0],'me')).toBe('tag'));
  it('owner tagged shot permits Retag', () => expect(galleryAction(shots()[0],'me')).toBe('retag'));
  it('admin untagged shot permits Tag', () => expect(galleryAction(galleryShots([post('u','other')],[],[])[0],'me',true)).toBe('tag'));
  it('admin tagged shot permits Retag', () => expect(galleryAction(shots()[0],'other',true)).toBe('retag'));
  it('another golfer has no tagging action', () => expect(galleryAction(shots()[0],'other')).toBeNull());
  it('signed-out has no tagging action', () => expect(galleryAction(shots()[0],undefined)).toBeNull());
  it('hole info retains par yards stroke index and measured loss', () => { const view=mount('holes'); expect(view.container.querySelector('h2')?.textContent).toBe('Par 4 · 356 yards'); expect([...view.container.querySelectorAll('.course-gallery-stats b')].map(node=>node.textContent)).toEqual(['10','+0.6']); expect(view.container.textContent).not.toContain('Shots of it'); expect(view.container.textContent).not.toContain('Shot of it'); });
  it('unknown yards omit only the yards from hole title', () => { mount('holes'); act(()=>{ const data=useFullscreenFeedStore.getState().galleryData; if(data) useFullscreenFeedStore.setState({galleryData:{...data,holes:[{...hole(1),yards:null}]}}); }); expect(document.querySelector('.course-gallery-info h2')?.textContent).toBe('Par 4'); });
  it('unscored holes use ordinal fallback without invented score stats', () => { const view=mount('holes','h1',false); expect(view.container.querySelector('h2')?.textContent).toBe('The first hole'); expect(view.container.querySelectorAll('.course-gallery-stats b')).toHaveLength(0); });
  it('place information uses its literal title and member count', () => { const view=mount('views','v'); expect(view.container.querySelector('h2')?.textContent).toBe('The views'); expect(view.container.querySelector('.course-gallery-info p')?.textContent).toBe('1 shot from members'); });
  it('Conditions age comes from latest added shot', () => { mount('all','v'); act(()=>{ const state=useFullscreenFeedStore.getState(); const data=state.galleryData; if(!data)return; const next={...data,shots:data.shots.map(shot=>shot.id==='v'?{...shot,addedAt:new Date().toISOString(),placeTag:placeTag('v','conditions')}:shot)}; const options={courseId:'course',courseName:'Course',filter:'conditions' as const,startShotId:'v'}; state.replaceGallery(galleryPost(filteredGallery(next.shots,'conditions'),options),options,next); }); expect(document.querySelector('.course-gallery-info h2')?.textContent).toBe('Course conditions'); expect(document.querySelector('.course-gallery-info p')?.textContent).toBe('1 shot from members · Latest Today'); });
  it('untagged shot has no hole or place info but retains credit', () => { const view=mount('all','u'); expect(view.container.querySelector('.course-gallery-untagged')).toBeNull(); expect(view.container.textContent).not.toContain('Not tagged yet'); expect(view.container.querySelector('h2')).toBeNull(); expect(view.container.querySelector('.course-gallery-credit b')?.textContent).toBe('Thomas Holmes'); });
  it('gallery is one synthetic horizontal carousel with stable item ids', () => { const mapped=galleryPost(shots(),{courseId:'course',courseName:'Course',filter:'all'}); expect(mapped).toHaveLength(1); expect(mapped[0].id).toBe('shots:gallery:course:all'); expect(mapped[0].mediaItems.map(m=>m.id)).toEqual(['h3','h1','v','c','u']); });
  it('filter replacement lands on first shot without nested opening', () => { mount(); const state=useFullscreenFeedStore.getState(); const options={...state.courseGallery,courseId:'course',courseName:'Course',filter:'views' as const,startShotId:undefined}; act(()=>state.replaceGallery(galleryPost(filteredGallery(shots(),'views'),options),options)); expect(useFullscreenFeedStore.getState().mediaId).toBe('v'); expect(useFullscreenFeedStore.getState().activePagerIdx).toBe(0); expect(useFullscreenFeedStore.getState().restoreStack).toHaveLength(0); });
  it('replacement honors start shot id', () => { mount(); const options={courseId:'course',courseName:'Course',filter:'holes' as const,startShotId:'h3'}; act(()=>useFullscreenFeedStore.getState().replaceGallery(galleryPost(filteredGallery(shots(),'holes'),options),options)); expect(useFullscreenFeedStore.getState().activePagerIdx).toBe(1); expect(useFullscreenFeedStore.getState().mediaId).toBe('h3'); });
  it('hole strip exists only on Holes', () => { const view=mount('holes'); expect(view.container.querySelectorAll('.course-gallery-holes button')).toHaveLength(18); fireEvent.click(screen.getByRole('button',{name:'Views 1'})); expect(view.container.querySelector('.course-gallery-holes')).toBeNull(); });
  it('shot hole jumps to its first shot', () => { mount('holes'); fireEvent.click(screen.getByRole('button',{name:'Hole 3'})); expect(useFullscreenFeedStore.getState().mediaId).toBe('h3'); });
  it('empty hole leaves selected shot unchanged', () => { mount('holes'); fireEvent.click(screen.getByRole('button',{name:'Hole 2'})); expect(useFullscreenFeedStore.getState().courseGallery?.startShotId).toBe('h1'); });
  it('grid filter changes retain grid mode', () => { const view=mount(); fireEvent.click(screen.getByRole('button',{name:'Grid view'})); fireEvent.click(screen.getByRole('button',{name:'Views 1'})); expect(view.container.querySelector('[data-gallery-grid]')).not.toBeNull(); expect(useFullscreenFeedStore.getState().courseGallery?.filter).toBe('views'); });
  it('grid square returns to same shot fullscreen', () => { const view=mount(); fireEvent.click(screen.getByRole('button',{name:'Grid view'})); fireEvent.click(screen.getByRole('button',{name:'View shot u'})); expect(useFullscreenFeedStore.getState().mediaId).toBe('u'); expect(view.container.querySelector('[data-gallery-grid]')).toBeNull(); });
  it('successful tagging keeps shot and updates exact filter counts', () => { mount('all','u'); fireEvent.click(screen.getByRole('button',{name:'Tag this shot'})); act(()=>f.saved?.(holeTag('u',1))); const state=useFullscreenFeedStore.getState(); expect(state.mediaId).toBe('u'); expect(galleryFilters(state.galleryData?.shots??[]).find(f=>f.filter==='holes')?.count).toBe(3); expect(state.courseGallery?.filter).toBe('all'); });
  it('removing a filtered tag keeps the shot by changing to All', () => { mount('holes','h1'); fireEvent.click(screen.getByRole('button',{name:'Retag'})); act(()=>f.saved?.()); expect(useFullscreenFeedStore.getState().mediaId).toBe('h1'); expect(useFullscreenFeedStore.getState().courseGallery?.filter).toBe('all'); });
  it('hole cards pass origin and hole straight to gallery with no inline panel', () => { const open=vi.fn(); const view=render(<HoleWalk available holes={[hole()]} rows={[holeTag('h1',1)]} totalMedia={1} onAddFirst={vi.fn()} onOpen={open} />); const card=screen.getByRole('button',{name:'Hole 1'}); fireEvent.click(card); expect(open).toHaveBeenCalledWith(1,card,'hole-card'); expect(view.container.querySelector('.hole-walk-panel')).toBeNull(); });
  it('shot coverage segment passes its exact origin', () => { const open=vi.fn(); render(<HoleWalk available holes={[hole()]} rows={[holeTag('h1',1)]} totalMedia={1} onAddFirst={vi.fn()} onOpen={open} />); const segment=screen.getByRole('button',{name:'Coverage hole 1'}); fireEvent.click(segment); expect(open).toHaveBeenCalledWith(1,segment,'coverage'); });
  it('place card passes the approved newest list and exact origin', () => { const open=vi.fn(); render(<CoursePlaceTiles rows={[placeTag('v','views')]} onOpen={open} />); const card=screen.getByRole('button',{name:'Views'}); fireEvent.click(card); expect(open).toHaveBeenCalledWith('views',[placeTag('v','views')],card); });
  it('thumbnail fallback exhausts candidates into an icon, never an empty box', () => { const view=render(<ReadyShotCover fallbackIcon shots={[{id:'a',media_url:'/a.jpg',poster_url:'/poster.jpg'}]} />); expect(view.container.querySelector('.clb-shimmer-dark')).not.toBeNull(); fireEvent.error(view.container.querySelector('img') as Element); expect(view.container.querySelector('img')).toHaveAttribute('src','/poster.jpg'); fireEvent.error(view.container.querySelector('img') as Element); expect(view.container.querySelector('.course-gallery-thumb-fallback svg')).not.toBeNull(); expect(view.container.querySelector('img')).toBeNull(); });
  it('tagger video thumbnail uses poster and generated candidate before icon', () => { const view=render(<HoleMediaThumbnail url="/video" mediaType="video" streamId={'a'.repeat(32)} posterUrl="/poster.jpg" durationSeconds={12} alt="" />); fireEvent.error(view.container.querySelector('img') as Element); expect(view.container.querySelector('img')?.getAttribute('src')).toContain('thumbnails/thumbnail.jpg'); fireEvent.error(view.container.querySelector('img') as Element); expect(view.container.querySelector('.course-gallery-thumb-fallback svg')).not.toBeNull(); });
});

describe('course viewer round 2', () => {
  const four = () => galleryShots([post('a'),post('b'),post('c')],[holeTag('a',4),holeTag('b',4),holeTag('c',7)],[]);
  function mountShots(list: ReturnType<typeof galleryShots>, filter: 'all'|'holes'|'views', start: string) {
    const data = { shots: list, holes: [hole(4),hole(7)], scored: true };
    const options = { courseId: 'course', courseName: 'Sundridge Park (East)', filter, startShotId: start };
    const shown = filteredGallery(list, filter);
    useFullscreenFeedStore.setState({ isOpen: true, courseGallery: options, galleryData: data, posts: galleryPost(shown, options), activePagerIdx: Math.max(0, shown.findIndex(s=>s.id===start)), syntheticPosts: true, readOnly: true });
    return render(<CourseGalleryChrome onClose={vi.fn()} />);
  }
  it('the panel holds close, title, grid and chips, and the hole strip on Holes only', () => {
    const view = mount('holes'); const panel = view.container.querySelector('[data-gallery-panel]') as HTMLElement;
    expect(panel).not.toBeNull();
    for (const name of ['Close','Grid view','All 5','Holes 2']) expect(panel.contains(screen.getByRole('button',{name}))).toBe(true);
    expect(panel.textContent).toContain('Sundridge Park (East)');
    expect(panel.querySelector('[data-gallery-jump] .course-gallery-holes')).not.toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'All 5'}));
    expect(view.container.querySelector('[data-gallery-jump]')).toBeNull();
  });
  it('strip pieces equal each hole shot count with the current piece highlighted', () => {
    const view = mountShots(four(), 'holes', 'a');
    const bar = (n: number) => [...view.container.querySelectorAll('.course-gallery-holes button')][n-1].querySelectorAll('em');
    expect([...bar(4)].map(e=>e.getAttribute('data-piece'))).toEqual(['current','hole']);
    expect([...bar(7)].map(e=>e.getAttribute('data-piece'))).toEqual(['shot']);
    expect([...bar(1)].map(e=>e.getAttribute('data-piece'))).toEqual(['empty']);
  });
  it('renders JUMP TO A HOLE and THE 4TH · SHOT 1 OF 2', () => {
    const view = mountShots(four(), 'holes', 'a');
    expect(view.container.querySelector('[data-gallery-jump]')?.textContent).toContain('JUMP TO A HOLE');
    expect(view.container.querySelector('[data-gallery-position]')?.textContent).toBe('THE 4TH · SHOT 1 OF 2');
  });
  it('jumping to a hole works in full screen and in grid', () => {
    const view = mountShots(four(), 'holes', 'a');
    fireEvent.click(screen.getByRole('button',{name:'Hole 7'}));
    expect(useFullscreenFeedStore.getState().mediaId).toBe('c');
    fireEvent.click(screen.getByRole('button',{name:'Grid view'}));
    const grid = view.container.querySelector('[data-gallery-grid]') as HTMLElement;
    const group = grid.querySelector('[data-gallery-group="hole:7"]') as HTMLElement;
    Object.defineProperty(group, 'offsetTop', { value: 240 });
    fireEvent.click(screen.getByRole('button',{name:'Hole 7'}));
    expect(grid.scrollTop).toBe(240);
    expect(view.container.querySelector('[data-gallery-grid]')).not.toBeNull();
  });
  it('progress row shows only with more than one shot', () => {
    const view = mountShots(four(), 'holes', 'a');
    expect(view.container.querySelectorAll('[data-gallery-progress] i')).toHaveLength(2);
    expect(view.container.querySelector('[data-gallery-progress] i[data-current="true"]')).not.toBeNull();
    cleanup();
    const single = mountShots(four(), 'holes', 'c');
    expect(single.container.querySelector('[data-gallery-progress]')).toBeNull();
  });
  it('grid squares have a full-size cover and no radius', () => {
    const view = mount(); fireEvent.click(screen.getByRole('button',{name:'Grid view'}));
    const square = screen.getByRole('button',{name:'View shot h1'});
    const img = square.querySelector('img') as HTMLElement;
    expect(img).not.toBeNull();
    expect(img.classList.contains('media-v2-cover')).toBe(true);
    expect(square.className).toContain('course-gallery-square');
    expect(square.className).toContain('rounded-none'); expect(square.className).not.toMatch(/rounded-\[/);
    expect(view.container.querySelector('.course-gallery-grid-wash')).toBeNull();
  });
  it('Holes grid has sticky group headers and All and place grids are flat', () => {
    const view = mount('holes'); fireEvent.click(screen.getByRole('button',{name:'Grid view'}));
    expect(view.container.querySelectorAll('[data-gallery-grid] header')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button',{name:'All 5'}));
    expect(view.container.querySelectorAll('[data-gallery-grid] header')).toHaveLength(0);
    expect(view.container.querySelectorAll('[data-gallery-grid] section')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:'Views 1'}));
    expect(view.container.querySelectorAll('[data-gallery-grid] header')).toHaveLength(0);
  });
  it('one shot reads "1 shot" in the grid count and group header', () => {
    const view = mount('views','v'); fireEvent.click(screen.getByRole('button',{name:'Grid view'}));
    expect(view.container.querySelector('[data-gallery-count]')?.textContent).toBe('1 shot · Views');
    fireEvent.click(screen.getByRole('button',{name:'Holes 2'}));
    expect([...view.container.querySelectorAll('[data-gallery-grid] header .course-gallery-label')].map(n=>n.textContent)).toEqual(['1 shot','1 shot']);
  });
});
