import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/recap-weight/captures');OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width in [320,390]:
   context=await browser.new_context(viewport={'width':width,'height':786})
   page=await context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto('http://localhost:8080/recap-weight-capture.html',wait_until='networkidle')
   block=page.locator('[data-recap-record]');await block.wait_for()
   await block.screenshot(path=str(OUT/f'our-picks-{width}.png'))
   await page.locator('.capture-wrap').screenshot(path=str(OUT/f'context-{width}.png'))
   facts=await block.evaluate('''b=>{const h=b.querySelector('.recap-head'),k=h.querySelector('h2'),a=h.querySelector('button'),f=b.querySelector('.recap-record-figs');const r=e=>{const x=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:e.textContent,x:x.x,y:x.y,width:x.width,height:x.height,fontWeight:s.fontWeight,fontSize:s.fontSize,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}};return {heading:r(k),link:r(a),seasonHeading:r(document.querySelector('[data-recap-season] h2')),headHeight:h.getBoundingClientRect().height,gap:f.getBoundingClientRect().top-h.getBoundingClientRect().bottom,figures:[...f.querySelectorAll('b')].map(r),labels:[...f.querySelectorAll('span')].map(r),pageWidth:innerWidth,htmlWidth:document.documentElement.scrollWidth,rootWidth:document.getElementById('root').scrollWidth,block:r(b)}}''')
   assert facts['htmlWidth']<=width and facts['rootWidth']<=width, facts
   assert facts['gap']==14 and facts['headHeight']==14, facts
   assert all(x['fontWeight']=='800' for x in facts['labels']), facts
   assert [x['text'] for x in facts['figures']]==['10','3','15'], facts
   assert all(x['scrollWidth']<=x['clientWidth'] for x in facts['labels']+facts['figures']), facts
   assert facts['heading']['x']+facts['heading']['width']<=facts['link']['x'], facts
   for item in facts['labels']+facts['figures']+[facts['heading'],facts['link']]:
    assert item['x']>=0 and item['x']+item['width']<=width, item
   await block.get_by_role('button').click()
   await page.locator('[data-our-record-sheet]').wait_for()
   await page.wait_for_timeout(600)
   await page.screenshot(path=str(OUT/f'sheet-{width}.png'))
   facts['sheetOpened']=True;facts['pageErrors']=errors
   assert not errors,errors
   print(width,json.dumps(facts))
   await context.close()
  await browser.close()
asyncio.run(main())
