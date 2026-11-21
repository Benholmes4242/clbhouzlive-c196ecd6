import asyncio,json
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/remove-view-post')
mock=BeautifulSoup(Path('/mnt/user-uploads/hole-tile-signed-off.html').read_text(),'html.parser')
bg=mock.select_one('.bg')['style'].split('url(')[1].split(')')[0]
html='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}body{background:#0a0a0c}#photo{position:fixed;inset:120px 0 110px;width:100%;height:calc(100% - 230px);object-fit:contain}</style></head><body><img id="photo"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">
import React from '/node_modules/.vite/deps/react.js?v=f2b68c1a';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js?v=102badcd'; const {createRoot}=ReactDOM;
import {MemoryRouter} from '/node_modules/.vite/deps/react-router-dom.js?v=a1cea97f';
import {QueryClient,QueryClientProvider} from '/node_modules/.vite/deps/@tanstack_react-query.js?v=57dd0e68';
import '/src/index.css';
import '/src/i18n/index.ts';
import {ImmersiveFullscreenChrome} from '/src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx';
import {useFullscreenFeedStore} from '/src/store/fullscreenFeedStore.ts';
const e=React.createElement,noop=()=>{};
const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
useFullscreenFeedStore.setState({activePagerIdx:0,borrow:null});
const root=createRoot(document.getElementById('root'));
window.renderState=(s)=>{const course=s.video?'Sundridge Park Golf Club (East Course)':'Woking Golf Club';const shot={kicker:s.kicker,detail:s.detail,title:course,credit:s.name+' · Nov 2026',memberName:s.name,avatarUrl:null,sourcePostId:s.video?'source-sundridge':'source-woking'};const post={id:'shot:1',userId:'',actorId:'',actorType:'personal',username:'',displayName:course,avatarUrl:'',caption:'',createdAt:'2026-11-01T09:00:00Z',isVerified:false,creatorRelation:'none',likeCount:2,commentCount:0,shareCount:0,isLikedByMe:false,isFollowedByMe:false,isReview:false,review:null,courseName:course,courseId:null,mediaItems:[{id:'a',type:s.video?'video':'image',imageUrl:'/a.jpg',duration:18,memberShot:shot}]};root.render(e(QueryClientProvider,{client},e(MemoryRouter,null,e(ImmersiveFullscreenChrome,{posts:[post],activeIndex:0,syntheticPosts:true,confirmedSourcePostIds:[s.video?'source-sundridge':'source-woking'],onClose:noop,onLike:noop,onComment:noop,onShare:(p)=>window.sharedSource=p.mediaItems[0].memberShot.sourcePostId,onMore:noop,getLikeState:()=>({isLiked:false,count:2}),getCommentCount:()=>0,getFollowState:()=>false,onFollow:noop,onViewProfile:noop,onReviewTap:noop,isOwnPost:false}))));};
window.ready=true;
</script></body></html>'''
states=[dict(id='woking-photo',kicker='The first',detail='Par 4 · 269 yards',name='Benjamin Holmes'),dict(id='sundridge-video',kicker='The ninth',detail='Par 3 · 175 yards',name='Thomas Holmes',video=True)]
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  c=await b.new_context(viewport={'width':1280,'height':1800})
  page=await c.new_page();errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  await page.route('**/__hole_tile_verification',lambda route:route.fulfill(status=200,content_type='text/html',body=html))
  await page.goto('http://localhost:8080/__hole_tile_verification',wait_until='networkidle')
  print('errors before ready',errors); await page.wait_for_function('window.ready===true',timeout=30000)
  await page.locator('#photo').evaluate('(el,src)=>el.src=src',bg)
  findings=[]
  for width in [390,320]:
   await page.set_viewport_size({'width':width,'height':786})
   for state in states:
    await page.evaluate('(s)=>window.renderState(s)',state)
    await page.wait_for_timeout(1500); print('render errors',errors,await page.locator('body').inner_text())
    await page.locator('[data-fullscreen-hole-strip]').wait_for()
    await page.wait_for_timeout(400)
    name=f"{state['id']}-{width}.png"
    await page.screenshot(path=str(OUT/name))
    await page.get_by_role('button',name='Share',exact=True).click()
    assert await page.evaluate('window.sharedSource') == ('source-sundridge' if state.get('video') else 'source-woking')
    assert await page.get_by_role('button',name='View post',exact=True).count() == 0
    values=await page.evaluate('''()=>{const t=document.querySelector('[data-fullscreen-hole-strip]'),n=document.querySelector('.fullscreen-shot-name-hole'),d=t.querySelector('.fullscreen-hole-tile-detail');return {tileWidth:t.getBoundingClientRect().width,tileClientWidth:t.clientWidth,tileScrollWidth:t.scrollWidth,nameHeight:n.getBoundingClientRect().height,nameLineHeight:getComputedStyle(n).lineHeight,nameClamp:getComputedStyle(n).webkitLineClamp,detailSize:d?getComputedStyle(d).fontSize:null,pageOverflow:document.documentElement.scrollWidth>innerWidth,viewPost:!!document.querySelector('[data-fullscreen-view-post]')}}''')
    assert not values['pageOverflow'] and not values['viewPost']
    assert values['tileScrollWidth'] <= values['tileClientWidth']
    values['sharedSource']=await page.evaluate('window.sharedSource')
    values['videoRow']=await page.locator('[data-fullscreen-video-row]').count()
    findings.append(dict(state=state['id'],width=width,screenshot=name,**values))
  (OUT/'results.json').write_text(json.dumps({'findings':findings,'pageErrors':errors},indent=2))
  print(json.dumps({'findings':findings,'pageErrors':errors},indent=2))
  await b.close()
asyncio.run(main())
