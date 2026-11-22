import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/dev-server/.lovable/reports/viewer-follow/captures')
J='''()=>{const t=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().top*10)/10:null};const b=s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().bottom*10)/10:null};return {stack:[...document.querySelectorAll('[data-fullscreen-bottom-stack] > *')].map(e=>[[...e.attributes].find(a=>a.name.startsWith('data-fullscreen'))?.name,Math.round(e.getBoundingClientRect().top)]),scrubTop:t('[data-fullscreen-scrubber],[data-fs-scrubber-row]'),pillsTop:t('[data-fullscreen-pills]'),stackBottom:b('[data-fullscreen-bottom-stack]'),overflow:document.documentElement.scrollWidth>innerWidth}}'''
R={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,320):
    pg=b.new_page(viewport={'width':w,'height':844})
    pg.goto('http://localhost:8080/viewer-capture.html?s=mixed'); pg.locator('[data-fullscreen-member]').wait_for()
    for i in (0,1,2):
      pg.evaluate(f'setSlide({i})'); pg.locator(f'[data-fullscreen-dots] > *:nth-child({i+1})').wait_for()
      R[f'{w}_{i}']=pg.evaluate(J); pg.screenshot(path=str(OUT/f'mixed-slide{i}_{w}.png'))
    R[f'{w}_html']=pg.evaluate("()=>[...document.querySelectorAll('[data-fullscreen-pills]')].map(e=>e.previousElementSibling?.outerHTML.slice(0,300))")
    pg.close()
  b.close()
print(json.dumps(R,indent=0))
