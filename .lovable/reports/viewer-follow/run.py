import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/dev-server/.lovable/reports/viewer-follow/captures'); OUT.mkdir(parents=True,exist_ok=True)
M={}
J='''()=>{const m=document.querySelector('[data-fullscreen-member]');const r=e=>e?(({left,right,top,bottom,width})=>({left,right,top,bottom,width}))(e.getBoundingClientRect()):null;const n=m.querySelector('.fs-name');return {text:m.textContent,name:r(n),nameClipped:n.scrollWidth>n.clientWidth,time:r(m.querySelector('.fs-time')),follow:r(m.querySelector('[data-fullscreen-follow]')),following:r(m.querySelector('[data-fullscreen-following]')),chip:r(m.querySelector('[data-fullscreen-review-chip]')),line:r(m),overflow:document.documentElement.scrollWidth>innerWidth,stack:[...document.querySelectorAll('[data-fullscreen-bottom-stack] > *')].map(e=>Math.round(e.getBoundingClientRect().top))}}'''
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,320):
    for s in ('review','longname','own','round'):
      pg=b.new_page(viewport={'width':w,'height':844}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
      pg.goto(f'http://localhost:8080/viewer-capture.html?s={s}')
      pg.locator('[data-fullscreen-member]').wait_for()
      M[f'{s}_{w}']=pg.evaluate(J); M[f'{s}_{w}']['errors']=errs
      pg.screenshot(path=str(OUT/f'{s}_{w}.png'))
      if s in ('review','longname'):
        pg.locator('[data-fullscreen-follow]').click(); pg.locator('[data-fullscreen-following]').wait_for()
        M[f'{s}-following_{w}']=pg.evaluate(J); pg.screenshot(path=str(OUT/f'{s}-following_{w}.png'))
      if s=='round':
        for i in (1,2):
          pg.evaluate(f'setSlide({i})'); pg.locator(f'[data-fullscreen-dots] > *:nth-child({i+1})').wait_for()
          M[f'round-slide{i}_{w}']=pg.evaluate(J); pg.screenshot(path=str(OUT/f'round-slide{i}_{w}.png'))
      pg.close()
  b.close()
(OUT/'../metrics.json').write_text(json.dumps(M,indent=1))
for k,v in M.items(): print(k, v['text'][:60], 'ovf',v['overflow'],'clip',v['nameClipped'],'stack',v['stack'], v.get('errors'))
