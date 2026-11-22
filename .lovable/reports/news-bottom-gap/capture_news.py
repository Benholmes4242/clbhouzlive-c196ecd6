import asyncio,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
PHASE=sys.argv[1];OUT=Path('/tmp/browser/news-gap')/PHASE;OUT.mkdir(exist_ok=True)
async def measure(page,key,width):
 await page.locator('[data-chrome="bottom-nav"]').wait_for()
 await page.evaluate("document.getElementById('root').scrollTop = document.getElementById('root').scrollHeight")
 await page.wait_for_timeout(1100)
 await page.evaluate("document.getElementById('root').scrollTop = document.getElementById('root').scrollHeight")
 await page.wait_for_timeout(700)
 if key in ['tour-hub','tour-index']:
  last=page.locator('.tour-news-more')
  if not await last.count():last=page.locator('.tour-news-ar').last
 elif key=='amateur-index':
  last=page.get_by_role('button',name='Load more',exact=True)
  if not await last.count():last=page.get_by_role('button',name=__import__('re').compile('^Read ')).last
 else:
  last=page.locator('article').last
 facts=await last.evaluate('''e=>{let n=e;const chain=[];const rect=x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};while(n){const s=getComputedStyle(n);chain.push({tag:n.tagName,cls:n.className,id:n.id,...rect(n),paddingBottom:s.paddingBottom,marginBottom:s.marginBottom,borderBottom:s.borderBottomWidth,next:[...(()=>{let r=[],a=n.nextElementSibling;while(a){r.push(a);a=a.nextElementSibling}return r})()].map(a=>({tag:a.tagName,cls:a.className,...rect(a),heightCSS:getComputedStyle(a).height,paddingBottom:getComputedStyle(a).paddingBottom}))});n=n.parentElement}const p=document.querySelector('[data-chrome="bottom-nav"]'),r=document.getElementById('root');return {last:{tag:e.tagName,text:e.textContent, ...rect(e)},pill:rect(p),gap:p.getBoundingClientRect().top-e.getBoundingClientRect().bottom,chain,rootScrollTop:r.scrollTop,rootScrollHeight:r.scrollHeight,rootClientHeight:r.clientHeight,navVar:getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-height'),pillVar:getComputedStyle(document.documentElement).getPropertyValue('--nav-pill-h'),htmlWidth:document.documentElement.scrollWidth}}''')
 facts.update({'phase':PHASE,'surface':key,'width':width,'url':page.url})
 await page.screenshot(path=str(OUT/f'{key}-{width}.png'))
 print(json.dumps(facts),flush=True)
 if PHASE=='after':
  assert abs(facts['gap']-16)<=1,facts
  assert facts['last']['top']>=0 and facts['last']['bottom']<=facts['pill']['top'],facts
 return facts
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  for width in [390,320]:
   c=await b.new_context(viewport={'width':width,'height':786});page=await c.new_page()
   for key,route in [('tour-hub','/tourhub?tab=news'),('tour-index','/tour/news'),('amateur-index','/discover/news')]:
    await page.goto('http://localhost:8080'+route,wait_until='networkidle')
    await page.wait_for_timeout(1000)
    await measure(page,key,width)
    if key=='tour-index':
     await page.locator('.tour-news-lead').click();await page.wait_for_url('**/tour/news/*');await page.wait_for_load_state('networkidle');await page.locator('article').last.wait_for()
     await measure(page,'tour-story',width)
    if key=='amateur-index':
     await page.get_by_role('button',name=__import__('re').compile('^Read ')).first.click();await page.wait_for_url('**/discover/news/*');await page.wait_for_load_state('networkidle');await page.locator('article').last.wait_for()
     await measure(page,'amateur-story',width)
   await c.close()
  await b.close()
asyncio.run(main())
