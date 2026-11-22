import sys,json
from playwright.sync_api import sync_playwright
tag=sys.argv[1]; res={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,320):
    pg=b.new_page(viewport={'width':w,'height':2600})
    for part in 'abc':
      pg.goto(f'http://localhost:8080/__shared-heads?part={part}')
      pg.wait_for_selector('[role=dialog] h2' if part=='c' else '#shared [data-box]',timeout=30000)
      pg.screenshot(path=f'{tag}_{part}_{w}.png',full_page=True)
      res[f'{part}_{w}']=pg.evaluate("""()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,els:[...document.querySelectorAll('#shared h2,#shared h3,#shared span,#shared div,[role=dialog] h2')].filter(e=>e.childElementCount===0&&e.textContent.trim()).map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return [e.closest('[data-box]')?.dataset.box||'dialog',e.textContent.slice(0,40),c.fontSize,c.fontWeight,c.letterSpacing,c.lineHeight,c.color,c.textTransform,Math.round(r.height),Math.round(r.right)]})})""")
    pg.close()
  # real routes
  for w in (390,320):
    pg=b.new_page(viewport={'width':w,'height':2600})
    for route in ['/tourhub']:
      try:
        pg.goto('http://localhost:8080'+route); pg.wait_for_selector('h2',timeout=20000)
        pg.screenshot(path=f'{tag}_route{route.replace("/","_")}_{w}.png')
        res[f'route{route}_{w}']=pg.evaluate("()=>({url:location.pathname,sw:document.documentElement.scrollWidth,h2:[...document.querySelectorAll('h2')].slice(0,8).map(e=>[e.textContent.slice(0,30),getComputedStyle(e).fontSize])})")
      except Exception as e: res[f'route{route}_{w}']=str(e)[:120]
    pg.close()
  b.close()
json.dump(res,open(tag+'.json','w'),indent=1)
print({k:(v.get('sw'),v.get('cw'),v.get('url')) if isinstance(v,dict) else v for k,v in res.items()})
