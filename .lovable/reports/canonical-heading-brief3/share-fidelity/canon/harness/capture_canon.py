import asyncio,json,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=Path('/dev-server/.lovable/reports/canonical-heading-brief3/share-fidelity/canon')
PHASE=sys.argv[1]
async def main():
 results={}
 async with async_playwright() as p:
  for engine in ('chromium','webkit'):
   browser=await getattr(p,engine).launch(headless=True)
   for fmt,width in [('story',390),('post',390),('story',320)]:
    key=f'{engine}-{fmt}-{width}';folder=ROOT/PHASE;folder.mkdir(parents=True,exist_ok=True)
    context=await browser.new_context(viewport={'width':width,'height':1800},accept_downloads=True)
    page=await context.new_page();errors=[];requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
    async def proxy(route):
     u=urlparse(route.request.url)
     target=route.request.url if u.path.startswith('/__l5e/') else 'http://localhost:8080'+u.path+('?' + u.query if u.query else '')
     await route.fulfill(response=await context.request.get(target))
    await page.route('https://clbhouz.co.uk/**',proxy)
    await page.goto('https://clbhouz.co.uk/src/__share_canon/index.html',wait_until='networkidle')
    await page.wait_for_function("document.querySelectorAll('img[src^=\"blob:\"]').length === 6")
    if fmt=='post':await page.get_by_role('button',name='Post 4:5',exact=True).click()
    await page.evaluate('Promise.all([...document.images].map(i=>i.decode()))')
    start=len(requests)
    if PHASE=='after':
     async with page.expect_download(timeout=60000) as dl:await page.get_by_role('button',name='Save image',exact=True).click()
     await (await dl.value).save_as(folder/f'real-{key}.png')
    # The exact unscaled capture card, not the scaled sheet preview.
    await page.evaluate('''() => {const hero=[...document.querySelectorAll('[data-share-hero]')].at(-1);window.card=hero.parentElement;const host=card.parentElement.parentElement;host.style.left='0px';host.style.zIndex='99999';card.dataset.canonCard='';}''')
    metrics=await page.evaluate('''() => {
     const card=window.card; const origin=card.getBoundingClientRect();let elements=[];
     const box=(el)=>{let r;if(el.tagName==='IMG')r=el.getBoundingClientRect();else{const range=document.createRange();range.selectNodeContents(el);r=range.getBoundingClientRect();}return {x:r.x-origin.x,y:r.y-origin.y,w:r.width,h:r.height}};
     const add=(label,el)=>{el.dataset.canonText=label;elements.push({label,box:box(el),color:getComputedStyle(el).color,text:el.textContent});};
     const hero=card.querySelector('[data-share-hero]');const top=hero.children[2];add('wordmark',top.children[0]);add('top eyebrow',top.children[1]);
     const content=hero.children[3];[...content.children[0].children,...content.children[1].children].forEach((e,i)=>add(['hero kicker','hero title','hero subline','hero score','hero verdict'][i],e));
     for(const tile of card.querySelectorAll('[data-share-tile]')){const content=tile.children[2];[...content.children[0].children,content.children[1]].forEach((e,i)=>add('tile '+tile.dataset.shareTile+' '+['kicker','name','place','score'][i],e));}
     const avatar=card.querySelector('img[crossorigin]');return {elements,avatar:avatar?box(avatar.parentElement):null,images:[...card.querySelectorAll('img')].map(e=>({width:e.naturalWidth,height:e.naturalHeight})),scrims:[hero.children[1],...Array.from(card.querySelectorAll('[data-share-tile]')).map(t=>t.children[1])].map(e=>getComputedStyle(e).backgroundImage)};
    }''')
    # Capture 405px element despite narrow sheet viewport.
    await page.set_viewport_size({'width':1280,'height':1800})
    await page.locator('[data-canon-card]').screenshot(path=str(folder/f'live-{key}.png'))
    await page.evaluate("document.querySelectorAll('[data-canon-text]').forEach(e=>e.style.opacity='0')")
    await page.locator('[data-canon-card]').screenshot(path=str(folder/f'background-{key}.png'))
    metrics.update(errors=errors,wordmarkFetches=sum('wordmark-white' in u for u in requests[start:]),firstSave=PHASE=='after')
    results[key]=metrics;print(PHASE,key,'images',metrics['images'],'errors',errors,'wordmarkFetches',metrics['wordmarkFetches'])
    await context.close()
   await browser.close()
 (ROOT/f'{PHASE}-metrics.json').write_text(json.dumps(results,indent=2))
asyncio.run(main())
