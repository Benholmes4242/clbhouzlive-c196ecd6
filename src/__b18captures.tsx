// @ts-nocheck
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {client,people,holes,uid,cid,sid,cardProps} from './__b18seeds';
import './index.css';import './styles/theme.css';import './styles/theme-tokens.css';import './i18n';
import {VideoAboutSheet} from './features/video-details/VideoAboutSheet';
import {PlayedWithPanel} from './components/feed/PostGolfTags';
import {CardScorecardSheet} from './features/courses/_shared/scorecard/CardScorecardSheet';
import {RoundDetailSheet} from './components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import {LikesSheet} from './components/likes/LikesSheet';
import {InviteSheetProvider} from './components/invite/InviteSheetProvider';
import {useInviteSheet} from './hooks/useInviteSheet';
import ComposerFlowSheet from './features/composer-flow/ComposerFlowSheet';
import {ShotTagChoices} from './components/course-media-tab/ShotTagChoices';
import {Button} from './components/ui/button';
import {FeedCard} from './components/feed/FeedCard';
import {ActiveActorProvider} from './context/ActiveActorContext';
import {PostingAsMenu} from './components/header/PostingAsMenu';
import {ShotTagSheet} from './features/post-v2/components/golf/GolfPostSections';
const scenario=new URLSearchParams(location.search).get('surface')||'about-general';
const noop=()=>{};
const post={id:sid,userId:'friend2',actorId:'friend2',username:'jordan',displayName:'Jordan Ellis',avatarUrl:null,isVerified:false,creatorRelation:'following',likeCount:3,commentCount:0,shareCount:0,review:null,isReview:false,isLikedByMe:false,isFollowedByMe:true,postType:'round',caption:'A day on the course.\n0:01 Opening drive\n1:00 Approach shot\n2:00 On the green',createdAt:'2026-11-23T12:00:00Z',courseId:cid,courseName:'Sundridge Park',courseRegion:'Kent',mediaItems:[{id:'video',type:'video',thumbnailUrl:'/src/assets/video-thumbs/golf-scenic.jpg',width:1280,height:720,url:'',duration:600}],actorType:'personal'};
const details={postId:sid,title:'A day at Sundridge Park',titleOnCover:true,scoreFollows:true,credits:[{profileId:'friend2',role:'camera',name:'Jordan Ellis',username:'jordan',avatarUrl:null}],links:[{url:'https://www.youtube.com/watch?v=example',label:'The full round'}],thanks:[{businessId:'business1',name:'Sundridge Park',slug:null,logoUrl:null,category:'Golf club'}],gear:['Driver · 10.5°']};
const chapters=[{seconds:1,time:'0:01',label:'1st hole',holeNo:1},{seconds:60,time:'1:00',label:'2nd hole',holeNo:2},{seconds:120,time:'2:00',label:'3rd hole',holeNo:3}];
const round={context:{roundScoreId:sid,roundHoles:18,roundGross:64,roundPar:72},shape:{holes}};
function InviteOpen(){const{openInviteSheet}=useInviteSheet();return <Button onClick={()=>openInviteSheet(scenario.startsWith('collapsed')?'profile_sheet':'explore')}>Invite friends</Button>}
function AccountOpen(){const[menu,setMenu]=useState(false);const ref=React.useRef<HTMLButtonElement>(null);return <InviteSheetProvider><Button ref={ref} onClick={()=>setMenu(true)}>Account menu</Button><PostingAsMenu isOpen={menu} onClose={()=>setMenu(false)} anchorRef={ref}/></InviteSheetProvider>}
function Fixture(){const[open,setOpen]=useState(false);const[hole,setHole]=useState<number|null>(null);const[place,setPlace]=useState<any>(null);
const isAbout=scenario.includes('about'),isPlayed=scenario.includes('played'),isInvite=scenario.includes('invite'),isScore=scenario.includes('scorecard')||scenario==='nested-likes',isLikes=scenario==='collapsed-likes',isSearch=scenario.includes('search'),isTag=scenario.includes('tagger');
const feedHost=['collapsed-scorecard','collapsed-likes','collapsed-about','collapsed-played'].includes(scenario);
return <main data-fixture-surface={scenario} style={{minHeight:'100dvh',position:'relative',background:'var(--background)',color:'var(--foreground)'}}>
{feedHost?<FeedCard post={post as any} liked={false} likeCount={3} commentCount={0} currentUserId={uid} onLike={noop} onComment={noop} onShare={noop} onOpenMedia={noop} onProfile={noop} playedWith={people} videoDetails={details as any} golfContext={scenario==='collapsed-scorecard'?round.context as any:null} golfRoundShape={round.shape as any} onGolfRoundTap={()=>setOpen(true)} />:scenario==='collapsed-invite'?<AccountOpen/>:isInvite?<InviteSheetProvider><InviteOpen/></InviteSheetProvider>:isSearch?<ComposerFlowSheet open onClose={noop}/>:<Button onClick={()=>setOpen(true)}>Open {scenario}</Button>}
{open&&isAbout&&!feedHost&&<VideoAboutSheet open post={post as any} details={details as any} chapters={chapters} likes={3} round={scenario==='about-round'?round as any:null} onClose={()=>setOpen(false)} onTime={noop} onNavigate={noop} onScorecard={noop}/>}
{open&&isPlayed&&!feedHost&&<div data-inline-feed-media style={{position:'relative',height:360,marginTop:24}}><PlayedWithPanel people={people} onClose={()=>setOpen(false)} onOpenProfile={noop}/></div>}
{open&&isScore&&(scenario==='collapsed-scorecard'?<RoundDetailSheet open onClose={()=>setOpen(false)} scoreId={sid} profileUserId={uid}/>:<CardScorecardSheet {...cardProps as any} open onClose={()=>setOpen(false)}/>)}
{open&&isLikes&&!feedHost&&<LikesSheet open onClose={()=>setOpen(false)} postId={sid} count={3}/>}
{open&&isTag&&<ShotTagSheet open item={{id:'shot1',type:'image',previewUrl:'/src/assets/video-thumbs/golf-scenic.jpg',width:1280,height:720}} courses={[{id:cid,name:'Sundridge Park'}]} courseIndex={0} onCourseIndex={noop} holes={Array.from({length:18},(_,i)=>i+1)} tag={null} onChoose={noop} onClose={()=>setOpen(false)} onEditPhoto={noop}/>}
</main>}
const el=document.getElementById('root');if(el)createRoot(el).render(<MemoryRouter initialEntries={[scenario.startsWith('collapsed')?'/':'/amateur']}><QueryClientProvider client={client}><ActiveActorProvider><Fixture/></ActiveActorProvider></QueryClientProvider></MemoryRouter>);
