import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(__file__).parent
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width in [390,320]:
   context=await browser.new_context(viewport={'width':width,'height':1800})
   page=await context.new_page();errors=[]
   page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',str(e),flush=True)))
   await page.route('**/rest/v1/**',lambda route:route.fulfill(status=200,content_type='application/json',body='[]'))
   await page.route('**/__pro_capture.js',lambda route:route.fulfill(status=200,content_type='application/javascript',body=(OUT/'fixture.js').read_text()))
   await page.goto('http://localhost:8080',wait_until='domcontentloaded')
   await page.evaluate('async()=>{await import("/__pro_capture.js")}')
   await page.locator('[data-pro-completion]').wait_for()
   await page.locator('[data-pro-career]').wait_for()
   await page.locator('[data-fallback-cover]').wait_for()
   await page.screenshot(path=str(OUT/f'owner-{width}.png'))
   await page.locator('[data-pro-completion]').screenshot(path=str(OUT/f'completion-{width}.png'))
   await page.locator('[data-pro-career]').screenshot(path=str(OUT/f'career-{width}.png'))
   await page.locator('.pro-season-form').screenshot(path=str(OUT/f'form-{width}.png'))
   await page.locator('.pro-season-results').screenshot(path=str(OUT/f'rows-{width}.png'))
   result=await page.evaluate('''()=>({width:innerWidth,overflow:[...document.querySelectorAll('#pro-verification *')].filter(el=>{let r=el.getBoundingClientRect();return r.width&& (r.left<-.5||r.right>innerWidth+.5)}).map(el=>el.className),chips:document.querySelectorAll('.pro-season-form-chip').length})''')
   print(json.dumps(result));assert not result['overflow'];assert result['chips']==10
   await page.get_by_role('button',name='Profile options').click()
   await page.get_by_role('menuitem',name='Settings').wait_for()
   await page.wait_for_timeout(350)
   await page.screenshot(path=str(OUT/f'menu-{width}.png'))
   print('menu',width,await page.get_by_role('menuitem').all_text_contents())
   await page.keyboard.press('Escape')
   await page.locator('[data-pro-career]').get_by_role('button',name='Add',exact=True).click()
   await page.get_by_role('dialog').wait_for()
   await page.get_by_role('dialog').screenshot(path=str(OUT/f'career-add-{width}.png'))
   print('career dialog',width,await page.get_by_role('dialog').inner_text())
   print('page errors',errors);assert not errors
   await context.close()
  await browser.close()
asyncio.run(main())
