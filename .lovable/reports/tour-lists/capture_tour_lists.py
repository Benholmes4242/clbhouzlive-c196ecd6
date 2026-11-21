import asyncio,json,re,urllib.request,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/tour-lists')
def dep(src,name):
 s=urllib.request.urlopen('http://localhost:8080'+src).read().decode()
 return re.search(r'"(/node_modules/\.vite/deps/'+name+r'\?[^\"]+)"',s).group(1)
react=dep('/src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx','react.js')
router=dep('/src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx','react-router-dom.js')
query=dep('/src/features/tourhub/hooks/useTourHubData.ts','@tanstack_react-query.js')
html='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;background:var(--cw-canvas);color:var(--cw-ink)}#capture{padding:6px 0 24px}</style></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">
import React from 'REACT';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {MemoryRouter} from 'ROUTER';import {QueryClient,QueryClientProvider} from 'QUERY';import '/src/index.css';import '/src/i18n/index.ts';import {UpcomingFacts,UpcomingLastYear} from '/src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx';import {RecapStandings} from '/src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx';import {useTournamentLastYearTop4} from '/src/features/tourhub/hooks/useTournamentLastYearTop4.ts';import {usePriorEditionHistory} from '/src/features/tourhub/components/overview-v3/usePriorEditionHistory.ts';
const e=React.createElement,root=ReactDOM.createRoot(document.getElementById('root'));window.reads=[];
function App(){const q=useTournamentLastYearTop4(window.state==='season'?null:'current');const history=usePriorEditionHistory(q.priorTournamentId,window.state!=='season');if(window.state==='season')return e('div',{id:'capture'},e(RecapStandings,{tour:'pgad',data:{standings:['Ross Steelman','Sandy Scott','Ian Holt'].map((name,i)=>({name,position:i+1,playerId:null,points:[2221,2191,1618][i]}))}}));if(!q.isSuccess||history.factsQuery.isLoading||history.boardQuery.isLoading)return null;return e('div',{id:'capture'},e(UpcomingFacts,{first:null,zone:null,field:0,purse:null,par:71,yards:7228,par5s:3,wonAt:q.winningScore}),e(UpcomingLastYear,{rows:q.data??[],year:q.year,facts:history.facts,entries:history.rows,tourCode:'euro'}));}
window.renderState=(state)=>{window.state=state;window.reads=[];window.rounds=state==='three'?3:4;window.names=state==='three'?['Player one','Player two','Player three']:['Puig','Ding','Voke'];window.scores=state==='three'?[-14,-12,-11]:[-18,-16,-15];window.rows=window.names.map((name,i)=>({id:name,position:i+1,score:window.scores[i],strokes:270,round_1:state==='three'?-6:-3,round_2:state==='three'?-4:-4,round_3:state==='three'?window.scores[i]+10:-6,round_4:state==='three'?null:window.scores[i]+13,player:{id:name,full_name:name}}));root.render(e(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},e(MemoryRouter,{key:state},e(App))));};window.ready=true;
</script></body></html>'''.replace('REACT',react).replace('ROUTER',router).replace('QUERY',query)
mock='''export const SUPABASE_URL='http://localhost:8080';export const SUPABASE_PUBLISHABLE_KEY='fixture';export const supabase={from:(table)=>{let filters=[];const q={select:()=>q,eq:(k,v)=>{filters.push([k,v]);return q;},lt:()=>q,gte:()=>q,gt:()=>q,not:()=>q,lte:()=>q,order:()=>q,limit:()=>q,maybeSingle:()=>Promise.resolve({data:{id:'current',name:'BMW Australian PGA 2027',start_date:'2027-11-25',event_type:'stroke',season:{tour_name:'EURO',year:2027}}}),then:(ok)=>{window.reads.push({table,filters});return Promise.resolve({data:table==='sr_tournaments'?[{id:'prior',name:'BMW Australian PGA 2026',end_date:'2026-11-22',season:{tour_name:'EURO',year:window.state==='three'?2025:2026}}]:window.rows,error:null}).then(ok);}};return q;},rpc:(name,args)=>{window.reads.push({name,args});return Promise.resolve({data:window.state==='fallback'?null:{champion_player_id:window.names[0],champion_surname:window.names[0],rounds:window.rounds,par:71,path:Array.from({length:window.rounds},(_,i)=>({round:i+1,position:i?1:5,tied:i===0,to_par:i===window.rounds-1?window.scores[0]:-3*(i+1),back:null,lead_by:null})),playoff:false,margin:2},error:null});},auth:{getSession:()=>Promise.resolve({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}})}};'''
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True);c=await b.new_context(viewport={'width':1280,'height':1800});page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def route(r):
   path=r.request.url.split('localhost:8080')[-1].split('?')[0]
   if path=='/__tour_lists':await r.fulfill(content_type='text/html',body=html)
   elif path=='/src/integrations/supabase/client.ts':await r.fulfill(content_type='application/javascript',body=mock)
   else:await r.continue_()
  await page.route('**/*',route);await page.goto('http://localhost:8080/__tour_lists',wait_until='networkidle');await page.wait_for_function('window.ready===true');results=[]
  for width in [390,320]:
   await page.set_viewport_size({'width':width,'height':786})
   for state in ['four','three','fallback','season']:
    await page.evaluate('(s)=>window.renderState(s)',state);await page.locator('#capture').wait_for();await page.wait_for_function('(s)=>s==="season"?!!document.querySelector("[data-recap-board]"):!!document.querySelector("[data-overview-last-year]")',arg=state)
    await page.locator('#capture').screenshot(path=str(OUT/f'{state}-{width}.png'))
    result=await page.locator('#capture').evaluate('''el=>({overflow:document.documentElement.scrollWidth>innerWidth||el.scrollWidth>el.clientWidth,rounds:el.querySelectorAll('.cw-chart-round').length,keys:el.querySelectorAll('[data-won-key-item]').length,behind:[...el.querySelectorAll('[data-recap-behind]')].map(e=>e.textContent),heading:el.querySelector('h2')?.textContent,facts:[...el.querySelectorAll('[data-upcoming-fact]')].map(e=>[e.dataset.upcomingFact,e.querySelector('b').textContent]),red:el.querySelector('[data-under]')?getComputedStyle(el.querySelector('[data-under]')).color:null,reads:window.reads})''')
    assert not result['overflow'],result
    if state in ['four','three']:assert result['rounds']==(4 if state=='four' else 3) and result['keys']==3,result
    if state=='fallback':assert result['rounds']==0 and await page.locator('.upcoming-ly-rows').count()==1,result
    if state=='season':assert result['behind']==['—','30','603'] and not result['reads'],result
    else:assert result['red']=='rgb(226, 75, 63)',result
    results.append({'state':state,'width':width,**result})
  assert not errors,errors
  (OUT/'results.json').write_text(json.dumps({'results':results,'errors':errors,'authStatus':os.environ.get('LOVABLE_BROWSER_AUTH_STATUS','absent')},indent=2));print(json.dumps({'states':len(results),'errors':errors,'authStatus':os.environ.get('LOVABLE_BROWSER_AUTH_STATUS','absent')}));await b.close()
asyncio.run(main())
