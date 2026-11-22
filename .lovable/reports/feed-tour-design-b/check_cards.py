import asyncio,json
from pathlib import Path
from datetime import datetime,timezone
from PIL import Image,ImageDraw
from playwright.async_api import async_playwright
OUT=Path('/tmp/browser/feed-tour')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  mock=await browser.new_page(viewport={'width':1800,'height':1800})
  await mock.goto('file:///tmp/browser/feed-tour/mock.html')
  for i,state in enumerate(['live','tied','preview','final']):
   await mock.locator('.card').nth(i).screenshot(path=str(OUT/f'mock-{state}.png'))
  observations=[]
  for width in [390,320]:
   for state in ['live','tied','preview','final']:
    context=await browser.new_context(viewport={'width':width,'height':1800})
    page=await context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    await page.clock.install(time=datetime(2025,11,16,12,tzinfo=timezone.utc))
    await page.route('https://**/*',lambda route:route.abort())
    await page.goto(f'http://localhost:8080/feed-tour-capture.html?state={state}',wait_until='networkidle')
    card=page.locator('[data-tour-slot]');await card.wait_for()
    await card.screenshot(path=str(OUT/f'{state}-{width}.png'))
    facts=await card.evaluate('''a=>{const b=a.getBoundingClientRect(),r=e=>{const z=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:z.width,height:z.height,fontSize:s.fontSize,fontWeight:s.fontWeight,color:s.color,grid:s.gridTemplateColumns}};return {kind:a.dataset.tourSlot,kicker:a.querySelector('[data-tour-slot-kicker]').textContent,lead:a.querySelector('[data-tour-slot-lead]').textContent,photo:r(a.querySelector('[data-tour-slot-photo]')),board:r(a.querySelector('[data-slot-board-header]')),rowHeights:[...a.querySelectorAll('[data-slot-board-row]')].map(e=>r(e).height),leadName:r(a.querySelector('.tour-slot-lead-name')),figure:r(a.querySelector('.tour-slot-figure-value')),avatars:[...a.querySelectorAll('.tour-slot-avatar')].map(r),weight800:[...a.querySelectorAll('*')].filter(e=>getComputedStyle(e).fontWeight==='800').map(e=>e.className),overflow:[...a.querySelectorAll('*')].filter(e=>{const x=e.getBoundingClientRect();return x.width&& (x.left<b.left-.5 || x.right>b.right+.5)}).map(e=>({tag:e.tagName,cls:e.className,rect:r(e)})),pageOverflow:document.documentElement.scrollWidth>innerWidth||document.getElementById('root').scrollWidth>innerWidth}}''')
    facts.update(width=width,state=state,pageErrors=errors)
    observations.append(facts)
    left=Image.open(OUT/f'{state}-{width}.png').convert('RGB');right=Image.open(OUT/f'mock-{state}.png').convert('RGB')
    image=Image.new('RGB',(left.width+right.width+24,max(left.height,right.height)+30),(27,27,31));image.paste(left,(0,30));image.paste(right,(left.width+24,30));draw=ImageDraw.Draw(image);draw.text((4,8),f'Build {width}px',(248,250,252));draw.text((left.width+28,8),'Signed-off mock 390px',(248,250,252));image.save(OUT/f'compare-{state}-{width}.png')
    assert not facts['overflow'],json.dumps(facts['overflow'])
    assert not facts['pageOverflow']
    assert not facts['weight800']
    assert abs(facts['photo']['height']-width*2/3)<.1
    assert all(h==34 for h in facts['rowHeights'])
    if state=='live' and width==320:
     await page.get_by_role('button',name='128',exact=True).click()
     await page.get_by_role('button',name='129',exact=True).wait_for()
     await page.locator('[data-tour-slot-comment] button[data-feed-section="add-comment"]').click()
     await page.get_by_text('Comment opened',exact=True).wait_for()
     assert await page.evaluate('window.captureEvents')==['like','add-comment']
     facts['controls']='Like updates to 129; Add comment opens; no body event'
    await context.close()
  (OUT/'observations.json').write_text(json.dumps(observations,indent=2))
  print(json.dumps(observations,indent=2))
  await browser.close()
asyncio.run(main())
