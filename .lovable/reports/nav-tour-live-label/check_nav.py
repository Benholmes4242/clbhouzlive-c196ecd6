import asyncio,json,re,urllib.request
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/nav-tour-live-label')
source=urllib.request.urlopen('http://localhost:8080/src/components/GlobalBottomNavigation.tsx').read().decode()
react=re.search(r'"(/node_modules/\.vite/deps/react.js\?[^\"]+)"',source).group(1)
router=re.search(r'"(/node_modules/\.vite/deps/react-router-dom.js\?[^\"]+)"',source).group(1)
html='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}</style></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">
import React from 'REACT';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {MemoryRouter} from 'ROUTER';import '/src/index.css';import Nav from '/src/components/GlobalBottomNavigation.tsx';const root=ReactDOM.createRoot(document.getElementById('root'));window.renderState=(live)=>{window.tourLive=live;root.render(React.createElement(MemoryRouter,null,React.createElement(Nav)));};window.ready=true;
</script></body></html>'''.replace('REACT',react).replace('ROUTER',router)
mocks={
'/src/contexts/BottomNavigationContext.tsx':'export const useBottomNavigation=()=>({isVisible:true});',
'/src/contexts/ModalContext.tsx':'export const useModalContext=()=>({shouldHideHeader:false});',
'/src/hooks/useAppPrefetch.ts':'export const useAppPrefetch=()=>({triggerPrefetch:()=>{}});',
'/src/routes/chunkLoaders.ts':'export const warmChunk=()=>{};',
'/src/components/bottom-navigation/useNavigationHandlers.ts':'export const useNavigationHandlers=()=>({activeTab:"clubhouse",handleTabClick:()=>{},handlePrefetch:()=>{}});',
'/src/stores/discoverNewStore.ts':'export const useDiscoverNewTotal=()=>0;',
'/src/hooks/useNavTheme.ts':'export const useNavTheme=()=>"dark";',
'/src/features/tourhub/hooks/useAnyTourLive.ts':'export const useAnyTourLive=()=>window.tourLive===true;',
'/src/features/composer-flow/ComposerFlowSheet.tsx':'export default ()=>null;',
'/src/features/guest/useGuestActionGate.ts':'export const gateGuestActionNow=()=>false;',
'/src/features/guest/guestGateStore.ts':'export const GUEST_RAISED_Z={nav:100};export const useGuestCardRequest=()=>null;export const useGuestCourseSheetOpen=()=>false;',
'/src/hooks/useScrollDirection.ts':'export const useNavScrollState=()=>"expanded";export const pushForceExpand=()=>()=>{};export const resetToExpanded=()=>{};',
'/src/stores/usePostStudioStore.ts':'export const usePostStudioStore=(s)=>s({isOpen:false});',
'/src/features/composer-flow/composerFlowStore.ts':'const state={handoff:null,arm:()=>{},clearHandoff:()=>{},reopenRequested:false,consumeReopen:()=>{}};export const useComposerFlowStore=(s)=>s(state);useComposerFlowStore.getState=()=>state;',
}
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  c=await b.new_context(viewport={'width':1280,'height':1800});page=await c.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  async def route(r):
   path=r.request.url.split('localhost:8080')[-1].split('?')[0]
   if path=='/__nav_label_check':await r.fulfill(content_type='text/html',body=html)
   elif path in mocks:await r.fulfill(content_type='application/javascript',body=mocks[path])
   else:await r.continue_()
  await page.route('**/*',route)
  await page.goto('http://localhost:8080/__nav_label_check',wait_until='networkidle');await page.wait_for_function('window.ready===true')
  results=[]
  for width in [390,320]:
   await page.set_viewport_size({'width':width,'height':786});previous=None
   for live in [False,True]:
    await page.evaluate('(s)=>window.renderState(s)',live)
    button=page.get_by_role('button',name='Tour, live now' if live else 'Tour',exact=True);await button.wait_for();await page.wait_for_timeout(400)
    values=await page.evaluate('''()=>{const nav=document.querySelector('[data-chrome="bottom-nav"]'); const b=document.querySelector('[data-nav-slot="tourhub"] button');const spans=b.querySelectorAll(':scope>span'),icon=spans[0],label=spans[1];const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,width:r.width,centre:r.x+r.width/2}};return {nav:rect(nav),slots:[...nav.querySelectorAll('li')].map(rect),button:rect(b),icon:rect(icon),label:rect(label),text:label.textContent,aria:b.getAttribute('aria-label'),colour:getComputedStyle(label).color,labelStyle:{fontSize:getComputedStyle(label).fontSize,fontWeight:getComputedStyle(label).fontWeight,tracking:getComputedStyle(label).letterSpacing,transform:getComputedStyle(label).textTransform},overflow:document.documentElement.scrollWidth>innerWidth||nav.scrollWidth>nav.clientWidth};}''')
    assert values['text']==('Live' if live else 'Tour')
    assert not values['overflow']
    assert abs(values['label']['centre']-values['icon']['centre'])<0.1
    if previous:assert values['slots']==previous['slots'] and values['nav']==previous['nav']
    previous=values
    name=f"{'live' if live else 'tour'}-{width}.png"
    await page.get_by_role('navigation',name='Main').screenshot(path=str(OUT/name))
    results.append({'width':width,'live':live,'screenshot':name,**values})
  assert not errors,errors
  (OUT/'results.json').write_text(json.dumps({'results':results,'pageErrors':errors},indent=2));print(json.dumps({'results':results,'pageErrors':errors},indent=2));await b.close()
asyncio.run(main())
