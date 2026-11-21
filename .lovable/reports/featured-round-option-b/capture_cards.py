import asyncio,json,re,urllib.request
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/featured-option-b')
source=urllib.request.urlopen('http://localhost:8080/src/components/feed/FeedCard.tsx').read().decode()
react=re.search(r'"(/node_modules/\.vite/deps/react.js\?[^\"]+)"',source).group(1)
router=re.search(r'"(/node_modules/\.vite/deps/react-router-dom.js\?[^\"]+)"',source).group(1)
query=re.search(r'"(/node_modules/\.vite/deps/@tanstack_react-query.js\?[^\"]+)"',source).group(1)
html='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;min-height:100%;background:#0A0A0C}body{padding:12px 0}</style></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">
import React from 'REACT';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {MemoryRouter} from 'ROUTER';import {QueryClient,QueryClientProvider} from 'QUERY';import '/src/index.css';import '/src/i18n/index.ts';import {FeedCard} from '/src/components/feed/FeedCard.tsx';import {HomeRail} from '/src/components/feed/HomeRail.tsx';import {featuredRoundFrom} from '/src/components/feed/featuredRoundTrigger.ts';
const e=React.createElement,noop=()=>{};const client=new QueryClient({defaultOptions:{queries:{retry:false}}});const root=ReactDOM.createRoot(document.getElementById('root'));
const people=[{userId:'ben',name:'Benjamin'},{userId:'mike',name:'mikem84'},{userId:'danny',name:'Danny'}];
const pars=[4,4,3,4,4,3,4,5,4,4,4,3,4,4,3,4,5,4],strokes=[3,4,5,3,4,4,3,6,6,3,4,4,4,5,4,3,5,4];let cum=0;const shape={holes:pars.map((par,i)=>({holeNo:i+1,par,strokes:strokes[i],strokeIndex:i+1})),series:[0,...pars.map((par,i)=>cum+=strokes[i]-par)]};
const basePost={id:'post',userId:'author',actorType:'personal',actorId:'author',username:'author',displayName:'Thomas Holmes',avatarUrl:'',isVerified:false,creatorRelation:'none',caption:'',mediaItems:[],createdAt:'2026-11-20T00:00:00Z',likeCount:2,commentCount:0,shareCount:0,review:null,isReview:false,isLikedByMe:true,isFollowedByMe:true,courseId:'course',courseName:'Woking Golf Club'};
const baseRound={whsScoreId:'score',totalHoles:18,grossScore:74,netScore:69,courseHandicap:5,coursePar:70,deltaIndex:null,playDate:'2026-11-20',birdies:4,eagles:0,albatrosses:0,holesInOne:0,beatPar:false,cleanCard:false,slopeRating:null,longestBirdieRun:1,holeShape:null};
const records={holders:new Map([['course',{course_id:'course',user_id:'author',value:74,runner_up_value:76,attained_on:'2026-11-20'}]]),lostToViewer:new Set(),isFetched:true};const sources={standing:new Map(),bests:new Map(),shortlist:new Set(),records};window.events=[];
window.renderState=(s)=>{const round={...baseRound,...(s.words?{longestBirdieRun:6}:{})};window.roundShape=shape;window.featured=featuredRoundFrom(basePost,round,s.words?{tier:3,reason:'birdie_run'}:{tier:2,reason:'course_record'},null);const node=s.rail?e(HomeRail,{kind:'featuredRound',viewerId:'viewer',pos:0}):e(FeedCard,{post:basePost,postRound:round,consequenceSources:sources,featuredDecisions:new Map(),weekPickScoreId:null,currentUserId:'viewer',roundMedals:{gold:0,silver:0,bronze:3},roundCompetition:true,roundShape:shape,playedWith:people,liked:true,likeCount:2,commentCount:0,onLike:()=>window.events.push('like'),onComment:()=>window.events.push('comment'),onShare:()=>window.events.push('share'),onOpenMedia:noop,onProfile:()=>window.events.push('profile'),onRoundTap:()=>window.events.push('round'),onFollow:()=>window.events.push('follow')});root.render(e(QueryClientProvider,{client},e(MemoryRouter,{key:s.id},node)));};window.ready=true;
</script></body></html>'''.replace('REACT',react).replace('ROUTER',router).replace('QUERY',query)
mocks={
'/src/context/ActiveActorContext.tsx':'export const useActiveActor=()=>({activeActor:{id:"viewer",type:"personal",name:"Ben",avatarUrl:null},availableActors:[{id:"viewer",type:"personal",name:"Ben",avatarUrl:null}],setActiveActor:()=>{}});',
'/src/store/clubhouseStore.ts':'export const useClubhouseStore=(s)=>s({carouselPositions:new Map(),carouselPositionsByTab:{}});',
'/src/stores/reviewSheetStore.ts':'export const useReviewSheetStore=()=>()=>{};',
'/src/hooks/useReviewerStats.ts':'export const useReviewerStats=()=>({data:null});',
'/src/hooks/useManageableBusinessIds.ts':'export const useManageableBusinessIds=()=>[];export const useTeamBusinessIds=()=>[];',
'/src/lib/impressions/useImpressionObserver.ts':'export const useImpressionObserver=()=>{};',
'/src/features/guest/useGuestActionGate.ts':'export const gateGuestActionNow=()=>false;',
'/src/integrations/supabase/client.ts':'const q=new Proxy({}, {get:(_t,k)=>k==="then"?(ok)=>Promise.resolve({data:[],error:null}).then(ok):()=>q});export const SUPABASE_URL="http://localhost:8080";export const SUPABASE_PUBLISHABLE_KEY="fixture";export const supabase={from:()=>q,rpc:()=>Promise.resolve({data:[],error:null}),auth:{getSession:()=>Promise.resolve({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}})}};',
'/src/features/pro-verification/InlineProMemberName.tsx':f'import React from "{react}";export const InlineProMemberName=({{children}})=>React.createElement(React.Fragment,null,children);',
'/src/features/pro-verification/ProLabel.tsx':f'import React from "{react}";export const ProMemberName=({{children}})=>React.createElement(React.Fragment,null,children);export const ProLabel=()=>null;',
'/src/hooks/usePostLikers.ts':'export const likerFirstNames=(ls,take)=>ls.slice(0,take).map(l=>l.displayName.split(" ")[0]);export const usePostLikers=(subject,enabled,source)=>{window.likerSource={subject,source};return {isLoading:false,likers:[{userId:"viewer",actorId:"viewer",displayName:"Benjamin Holmes",isViewer:true,avatarUrl:null},{userId:"danny",actorId:"danny",displayName:"Danny Akers",isViewer:false,avatarUrl:null}]};};',
'/src/features/explore-magazine/useFeaturedRound.ts':'export const useFeaturedRound=()=>({data:window.featured});export const useFeaturedRoundNet=()=>({data:{netScore:69,courseHandicap:5}});',
'/src/features/explore-magazine/useViewerScoreScope.ts':'export const useViewerScoreScope=()=>({scope:{}});',
'/src/features/explore-magazine/useBatchRoundMedals.ts':'export const useBatchRoundMedals=()=>({isSuccess:true,medals:new Map([["score",{gold:0,silver:0,bronze:3}]])});',
'/src/features/explore-magazine/useBatchRoundCompetition.ts':'export const useBatchRoundCompetition=()=>({isSuccess:true,competition:new Map([["score",true]])});',
'/src/components/explore-tab-new/courseled/hooks/useRoundHoleShapes.ts':'export const useRoundHoleShapes=()=>new Map([["score",window.roundShape]]);',
'/src/components/explore-tab-new/useScorecardOpener.ts':'export const useScorecardOpener=()=>({target:null,close:()=>{},openByScore:()=>window.events.push("round")});',
'/src/components/explore-tab-new/courseled/hooks/useContentReactions.ts':'export const useContentReactions=()=>({unavailable:false,viewerId:"viewer",stateFor:()=>({count:2,mine:true}),toggle:()=>window.events.push("like")});',
'/src/features/stories/useStoryEngagement.ts':'export const useStoryEngagement=()=>({engagementFor:()=>({commentCount:0})});',
'/src/hooks/useFollowState.ts':'export const useFollowState=()=>({isFollowing:true});',
'/src/hooks/useToggleFollow.ts':'export const useToggleFollow=()=>({isPending:false,mutate:()=>window.events.push("follow")});',
}
nulls={
'/src/components/feed/FeedActorPicker.tsx':['FeedActorPicker'],
'/src/components/likes/LikesSheet.tsx':['LikesSheet'],
'/src/components/feed/MediaCarousel.tsx':['MediaCarousel'],
'/src/components/feed/InlineVideo.tsx':['InlineVideo'],
'/src/components/feed/ReviewPostCard.tsx':['ReviewPostCard'],
'/src/components/feed/CourseStatsSheet.tsx':['CourseStatsSheet'],
'/src/components/feed/PostCourseBand.tsx':['PostCourseBand'],
'/src/components/feed/FeedCommentPreview.tsx':['FeedCommentPreview'],
'/src/components/feed/HeartBurst.tsx':['HeartBurst'],
'/src/components/posts/PostOwnerMenu.tsx':['PostOwnerMenu'],
'/src/features/explore-magazine/ExploreCard.tsx':['ExploreCard'],
'/src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx':['RoundDetailSheet'],
'/src/features/comments-v2/CommentsSheetV2.tsx':['CommentsSheetV2'],
}
for path,names in nulls.items():mocks[path]=''.join('export const '+n+'=()=>null;' for n in names)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True);c=await b.new_context(viewport={'width':1280,'height':1800},reduced_motion='reduce');page=await c.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  async def route(r):
   path=r.request.url.split('localhost:8080')[-1].split('?')[0]
   if path=='/__featured_option_b':await r.fulfill(content_type='text/html',body=html)
   elif path in mocks:await r.fulfill(content_type='application/javascript',body=mocks[path])
   else:await r.continue_()
  await page.route('**/*',route);await page.goto('http://localhost:8080/__featured_option_b',wait_until='networkidle')
  print('load errors',errors);await page.wait_for_function('window.ready===true');results=[]
  for width in [390,320]:
   await page.set_viewport_size({'width':width,'height':786})
   for rail,words in [(False,False),(True,False),(False,True),(True,True)]:
    name=f"{'rail' if rail else 'feed'}-{'birdies' if words else 'record'}-{width}"
    await page.evaluate('(s)=>window.renderState(s)',{'rail':rail,'words':words,'id':name});await page.locator('[data-featured-card]').wait_for();await page.wait_for_timeout(650)
    print('state',name,'errors',errors)
    target=page.locator('[data-featured-card]' if rail else '[data-feed-featured-round]')
    await target.screenshot(path=str(OUT/(name+'.png')))
    values=await target.evaluate('''el=>{const kicker=el.querySelector('[data-featured-kicker]'),feat=el.querySelector('[data-round-score-feat]'),byline=el.querySelector('[data-featured-byline]');return {kicker:kicker.textContent,feat:feat?feat.textContent:null,featColour:feat?getComputedStyle(feat).color:null,awards:!!el.querySelector('[data-round-score-awards]'),footer:!!el.querySelector('[data-feed-footer]'),ownActions:!!el.querySelector('[data-featured-engagement]'),byline:byline?byline.textContent:null,bylineEllipsis:byline?getComputedStyle(byline).textOverflow:null,overflow:document.documentElement.scrollWidth>innerWidth||el.scrollWidth>el.clientWidth,font800:[...el.querySelectorAll('*')].filter(e=>getComputedStyle(e).fontWeight==='800').length};}''')
    assert not values['overflow'],values
    assert values["font800"]==0,values
    assert values['awards']==words and values['footer']==(not rail) and values['ownActions']==rail,values
    if not words:assert values['featColour']=='rgb(251, 188, 46)',values
    if not rail:
     assert 'with Benjamin, mikem84 and Danny' in values['byline']
     await page.get_by_role('button',name='Send',exact=True).click();assert (await page.evaluate('window.events')).pop()=='share'
     assert await page.evaluate('window.likerSource.source')=='round'
     await page.get_by_test_id('played-with-name-faces').click();await page.get_by_test_id('played-with-sheet').wait_for();await page.keyboard.press('Escape');await page.wait_for_timeout(300)
    results.append({'state':name,**values})
  assert not errors,errors
  (OUT/'results.json').write_text(json.dumps({'results':results,'pageErrors':errors},indent=2));print(json.dumps({'results':results,'pageErrors':errors},indent=2));await b.close()
asyncio.run(main())
