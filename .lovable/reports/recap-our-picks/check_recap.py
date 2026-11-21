import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/dev-server/.lovable/reports/recap-our-picks/captures')
OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width in [390,320]:
   context=await browser.new_context(viewport={'width':width,'height':786})
   page=await context.new_page()
   errors=[]
   page.on('pageerror',lambda error: errors.append(str(error)))
   await page.goto('http://localhost:8080/recap-our-picks-capture.html',wait_until='networkidle')
   block=page.locator('[data-recap-record]')
   await block.wait_for()
   await block.screenshot(path=str(OUT/f'our-picks-{width}.png'))
   await page.locator('.capture-wrap').screenshot(path=str(OUT/f'context-{width}.png'))
   facts=await block.evaluate('''b=>{const h=b.querySelector('.recap-head'),k=h.querySelector('h2'),a=h.querySelector('button'),f=b.querySelector('.recap-record-figs');const r=e=>{const x=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:x.x,y:x.y,width:x.width,height:x.height,fontSize:s.fontSize,fontWeight:s.fontWeight,color:s.color,letterSpacing:s.letterSpacing,lineHeight:s.lineHeight,padding:s.padding,textTransform:s.textTransform}};const baseline=e=>{const range=document.createRange();range.selectNodeContents(e);return range.getBoundingClientRect().bottom};return {heading:k.textContent,link:a.textContent,headingStyle:r(k),linkStyle:r(a),classes:a.className,headHeight:h.getBoundingClientRect().height,baselineDelta:Math.abs(baseline(k)-baseline(a)),gap:f.getBoundingClientRect().top-h.getBoundingClientRect().bottom,figures:[...f.querySelectorAll('b')].map(e=>({text:e.textContent,...r(e)})),labels:[...f.querySelectorAll('span')].map(e=>({text:e.textContent,...r(e)})),overflow:document.documentElement.scrollWidth>innerWidth||document.getElementById('root').scrollWidth>innerWidth}}''')
   assert facts['heading']=='OUR PICKS · 2026'
   assert facts['link']=='How we pick ›'
   assert facts['gap']==14
   assert facts['baselineDelta']<1
   assert facts['headHeight']==14
   assert not facts['overflow']
   assert facts['linkStyle']['textTransform']=='uppercase'
   assert facts['headingStyle']['fontSize']==facts['linkStyle']['fontSize']=='10px'
   assert facts['headingStyle']['color']==facts['linkStyle']['color']
   assert [f['text'] for f in facts['figures']]==['10','3','15']
   assert all(f['fontSize']=='22px' and f['fontWeight']=='700' for f in facts['figures'])
   assert [f['text'] for f in facts['labels']]==['EVENTS','WINNERS','IN THE TOP 10']
   assert all(f['fontWeight']=='700' for f in facts['labels'])
   assert not any(c in facts['classes'].split() for c in ['h-10','px-4','py-2'])
   await block.get_by_role('button').click()
   await page.locator('[data-our-record-sheet]').wait_for()
   await page.screenshot(path=str(OUT/f'sheet-{width}.png'))
   facts['sheetOpened']=True
   facts['pageErrors']=errors
   print(width,json.dumps(facts))
   await context.close()
  await browser.close()
asyncio.run(main())
