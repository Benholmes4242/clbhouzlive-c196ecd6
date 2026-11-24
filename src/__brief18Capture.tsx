import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import './index.css';
import './styles/theme.css';
import './styles/theme-tokens.css';
import './i18n';
import i18n from './i18n';
import './components/course-media-tab/media-v2.css';
import CourseDirectorySheet from './components/courses/CourseDirectorySheet';
import ListScopeHeader from './components/courses/browse/ListScopeHeader';
import RecordBook from './components/courses/course-detail/about/RecordBook';
import ClaimCourseSheet from './components/courses/course-detail/ClaimCourseSheet';
import CourseWebsiteSheet from './components/courses/course-detail/CourseWebsiteSheet';
import YourHolesSheet from './components/courses/course-detail/you/YourHolesSheet';
import YourRoundsSheet from './components/courses/course-detail/you/YourRoundsSheet';
import { CardScorecardSheet } from './features/courses/_shared/scorecard/CardScorecardSheet';
import { LikesSheet } from './components/likes/LikesSheet';
import { TheArgumentSection } from './components/courses/top100/TheArgumentSection';
import Top100CoursesHubPanel from './components/courses/Top100CoursesHubPanel';
import { ShotTagCard } from './components/course-media-tab/ShotTagCard';
import { ReviewStepHeading, ReviewCategoriesHeading } from './features/review-v2/components/ReviewScoreHeadings';
import { CategoryGrid } from './features/review-v2/components/CategoryGrid';
import { OverallScrubber } from './features/review-v2/components/OverallScrubber';
import { ReviewReceipt } from './features/review-v2/components/ReviewReceipt';
import { cache, uid, cid, course, scores, roundholes, argument, results, photo } from './__brief18CaptureData';
const noop = () => {};
const surface = new URLSearchParams(location.search).get('surface') ?? 'directory';
class Boundary extends React.Component<{children:React.ReactNode},{error:string|null}> { state={error:null}; static getDerivedStateFromError(error:Error){return {error:error.message};} render(){return this.state.error ? <pre data-fixture-error>{this.state.error}</pre> : this.props.children;} }
function Fixture() {
 const [hole,setHole]=React.useState<number|null>(3); const [place,setPlace]=React.useState<any>(null);
 const node = surface==='directory' ? <CourseDirectorySheet open onClose={noop}/> :
 surface==='scope' ? <div style={{padding:16}}><ListScopeHeader region="Scotland" country={null} figures={{courses:140,rounds:1230,holes:22140}}/></div> :
 surface==='record' ? <RecordBook courseId={cid} courseName={course.name} onSeeAll={noop}/> :
 surface==='claim' ? <ClaimCourseSheet open onClose={noop} clubId="fixture-club" sourceCourseId={cid}/> :
 surface==='website' ? <CourseWebsiteSheet open onClose={noop} course={course} coords={{lat:51.4,lng:.1}}/> :
 surface==='you-holes' ? <YourHolesSheet open onClose={noop} courseId={cid} courseName={course.name}/> :
 surface==='you-rounds' ? <YourRoundsSheet open onClose={noop} courseId={cid} courseName={course.name} fieldOverPar={8} fieldRounds={120} coursePar={72}/> :
 surface==='likes' ? <LikesSheet coursesHeadingInk open onClose={noop} postId="fixture-post" count={3} source="round" kind="celebrate"/> :
 surface==='scorecard' ? <CardScorecardSheet coursesHeadingInk open onClose={noop} eyebrowText="Sundridge Park" dateLongText="20 November 2026" courseName={course.name} courseLocation="Kent, England" playDate="2026-11-20" coursePar={72} holes={roundholes} totalHoles={18} holesSettled playerName="Alex Morgan" playerUserId={uid} playerHcp={7.4} subjectIsViewer net={65} courseHandicap={7} courseContext={{roundsHere:12,avgToParOthers:6,yourAvgToPar:5,indexAtTime:7.4,differential:3.2}} rounds={{available:[1,2,3,4],active:1,onSelect:noop}} roundResults={results as any} fieldPlayers={25} engagement={{postId:'fixture-post',likeCount:3,likeMine:false,likeSource:'round',likeLabel:'Celebrate',onToggleLike:noop}}/> :
 surface==='argument' ? <div style={{padding:'24px 16px'}}><TheArgumentSection higher={[argument[0]]} lower={[argument[1]]} ratedCount={12} baseline={new Map([['a',3],['b',6]])} onOpenCourse={noop}/></div> :
 surface==='golfers-order' ? <Top100CoursesHubPanel/> :
 surface.startsWith('media-') ? <ShotTagCard coursesHeadingInk shot={{url:photo,mediaType:'image',ownerName:'Alex Morgan'}} holes={Array.from({length:18},(_,i)=>i+1)} hole={hole} place={place} onHole={h=>{setHole(h);setPlace(null);}} onPlace={p=>{setPlace(p);setHole(null);}} pending={false} canSubmit={hole!=null||place!=null} onSubmit={noop} onSkip={noop} onClose={noop} position={surface==='media-batch'?{i:1,n:3}:undefined} credit={surface==='media-batch'?'Alex Morgan · Added Nov 2026':undefined} gallerySingle={surface==='media-gallery'}/> :
 surface==='breakdown' ? <div className="review-score-page" style={{padding:'48px 20px 24px'}}><ReviewStepHeading step={2} total={2}/><OverallScrubber value={8} onChange={noop} caption="Overall" ariaLabel="Overall rating"/><ReviewCategoriesHeading scores={scores}/><CategoryGrid values={scores} onChange={noop} cats={(['design','condition','clubhouse','facilities'] as const).map(key=>({key,label:i18n.t(`review.subscore.${key}`,{ns:'courses'}),hint:i18n.t(`review.wizard.step3.hint.${key}`,{ns:'courses',defaultValue:''})}))}/></div> :
 surface==='receipt-search' ? <ReviewReceipt ratingId="fixture-rating" course={course} overall={8} scores={scores} shareToFeed={false} userId={uid} onBack={noop} onClubhouse={noop} onNextCourse={noop}/> : <div data-fixture-error>Unknown surface</div>;
 return <Boundary><div data-fixture-surface={surface}>{node}</div></Boundary>;
}
async function start(){
 await i18n.changeLanguage('en'); await i18n.loadNamespaces(['courses','common','composerFlow','handicap']);
 document.documentElement.classList.add('dark');
 const root=document.getElementById('root'); if(!root) return;
 createRoot(root).render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={[`/courses/${cid}`]}><Fixture/></MemoryRouter></QueryClientProvider>);
}
void start();
