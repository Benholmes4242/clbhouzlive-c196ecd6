import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/pro-season-form')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={'width':320,'height':900})
  page=await context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://localhost:8080')
  await page.evaluate('''async () => {
   const {default: React} = await import('/node_modules/.vite/deps/react.js');
   const {default: ReactDOM} = await import('/node_modules/.vite/deps/react-dom_client.js');
   const {ProSeasonSection} = await import('/src/features/pro-profile/ProSeasonSection.tsx');
   const {QueryClient,QueryClientProvider} = await import('/node_modules/.vite/deps/@tanstack_react-query.js');
   const {MemoryRouter} = await import('/node_modules/.vite/deps/react-router-dom.js');
   await import('/src/features/pro-profile/pro-profile.css');
   const e=React.createElement;
   const host=document.createElement('div');host.id='season-verification';
   document.body.replaceChildren(host);
   const finishes=['MC','WD','T28','DQ','T3','1st','T41','T10','T19','MC'];
   const events=finishes.map((finish,i)=>({id:'e'+i,user_id:'pro',source:'owgr',event_name:i===2?'A very long tournament name requiring an ellipsis':'Tournament '+i,start_date:i<4?'2026-11-0'+(9-i):'2025-11-01',end_date:null,country:'China',finish,total_strokes:i===2?273:144,owgr_points:i===2?1.24:null,rounds:(i===2?[68,69,67,69]:[72,72]).map((strokes,j)=>({round_no:j+1,strokes,source:'owgr'}))}));
   ReactDOM.createRoot(host).render(e(MemoryRouter,null,e(QueryClientProvider,{client:new QueryClient()},e('div',{className:'pro-profile'},e(ProSeasonSection,{events,year:2026,first:'Mason',linked:false,onSeeAll:()=>{}})))));
  }''')
  await page.locator('.pro-season-form-chip').first.wait_for()
  for width in [320,390,1280]:
   await page.set_viewport_size({'width':width,'height':1800 if width==1280 else 900})
   await page.locator('#season-verification').screenshot(path=str(OUT/f'season-{width}.png'))
   result=await page.evaluate('''() => {
    const host=document.querySelector('#season-verification');
    const overflow=[...host.querySelectorAll('.pro-profile-row, .pro-profile-row *, .pro-season-form-strip, .pro-season-form-chip')].filter(el=>{const r=el.getBoundingClientRect();const owner=el.closest('.pro-profile-row')||host;const o=owner.getBoundingClientRect();return r.left<o.left-.5||r.right>o.right+.5;}).map(el=>el.className);
    return {width:innerWidth,overflow,chipWidth:document.querySelector('.pro-season-form-chip').getBoundingClientRect().width,columns:getComputedStyle(document.querySelector('.pro-season-form-strip')).gridTemplateColumns.split(' ').length};
   }''')
   print(json.dumps(result));assert not result['overflow'];assert result['columns']==10;assert result['chipWidth']<=((width-32-36)/10)+.5
  await page.set_viewport_size({'width':320,'height':900})
  await page.get_by_role('button',name='T28, A very long tournament name requiring an ellipsis').click()
  await page.get_by_role('dialog').wait_for()
  await page.get_by_role('dialog').screenshot(path=str(OUT/'detail-320.png'))
  print('detail heading:',await page.get_by_role('dialog').get_by_role('heading').inner_text())
  assert await page.get_by_role('dialog').get_by_role('heading').inner_text()=='A very long tournament name requiring an ellipsis'
  print('page errors',errors);assert not errors
  await browser.close()
asyncio.run(main())
