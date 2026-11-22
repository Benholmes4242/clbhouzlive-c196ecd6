import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/dev-server/.lovable/reports/overview-round-parity/captures'); OUT.mkdir(parents=True,exist_ok=True)
J='''()=>{const k=document.querySelector('[data-overview-photo-kicker-row]');const h=k&&k.nextElementSibling;const p=document.querySelector('[data-live-picks-heading]');return {kicker:k&&k.textContent,kickerShown:k&&getComputedStyle(k).textTransform,gap:k&&h?Math.round((h.getBoundingClientRect().top-k.getBoundingClientRect().bottom)*10)/10:null,title:h&&h.textContent,picks:p&&p.closest('.live-picks-full,[data-live-picks-heading]')?.textContent,picksFull:document.querySelector('.live-picks-full')?.textContent,picksVisible:p&&p.innerText,overflow:document.documentElement.scrollWidth>innerWidth}}'''
R={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,320):
    for s in ('after3tied','delayed','inplay'):
      pg=b.new_page(viewport={'width':w,'height':1100}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:200]))
      pg.goto(f'http://localhost:8091/cap-overview.html?s={s}')
      try: pg.locator('[data-overview-photo-kicker-row]').wait_for(timeout=30000)
      except Exception as e: print(s,w,'ERR',errs); pg.screenshot(path=f'/tmp/ov_{s}.png'); continue
      pg.locator('[data-live-picks-heading]').wait_for(timeout=10000)
      R[f'{s}_{w}']={**pg.evaluate(J),'errors':errs}; pg.screenshot(path=str(OUT/f'{s}_{w}.png'),full_page=True); pg.close()
  b.close()
(OUT/'metrics.json').write_text(json.dumps(R,indent=1))
for k,v in R.items(): print(k,v)
