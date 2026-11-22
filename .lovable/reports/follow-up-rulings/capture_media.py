import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('/dev-server/.lovable/reports/follow-up-rulings/captures'); OUT.mkdir(parents=True,exist_ok=True)
U='http://localhost:8091/cap-media.html?s='
R={}
STACK='''()=>{const st=document.querySelector('[data-fullscreen-bottom-stack]');const pills=document.querySelector('[data-fullscreen-pills],[data-gallery-pills]');const sc=document.querySelector('[data-fs-scrubber]');const r=e=>e?Math.round(e.getBoundingClientRect().top*10)/10:null;const v=[...document.querySelectorAll('video')].find(x=>!x.paused&&x.currentTime>0);const ld=[...document.querySelectorAll('video')].some(x=>x.readyState>=2);return {rows:st?[...st.children].map(e=>r(e)):null,stackBottom:st?Math.round(st.getBoundingClientRect().bottom*10)/10:null,scrubTop:r(sc),scrubBottom:sc?Math.round(sc.getBoundingClientRect().bottom*10)/10:null,buttonsTop:r(document.querySelector('[data-fullscreen-pills]')) ?? r([...document.querySelectorAll('button[aria-label="Share"]')].pop()),stats:[...document.querySelectorAll('[data-fullscreen-stats] b')].map(b=>b.textContent),playing:!!v,videoLoaded:ld,overflow:document.documentElement.scrollWidth>innerWidth}}'''
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,320):
    def page(s,sel):
      pg=b.new_page(viewport={'width':w,'height':844}); pg.goto(U+s); pg.locator(sel).first.wait_for(timeout=40000); return pg
    pg=page('feedhole','[data-inline-video-duration]')
    vis=lambda: pg.evaluate("getComputedStyle(document.querySelector('[data-inline-video-duration]')).visibility")
    R[f'feedhole_closed_{w}']=vis(); pg.screenshot(path=str(OUT/f'feed-hole-closed_{w}.png'))
    pg.get_by_test_id('post-hole-chip').click(); pg.get_by_test_id('post-hole-card').wait_for()
    R[f'feedhole_open_{w}']=vis(); pg.screenshot(path=str(OUT/f'feed-hole-open_{w}.png'))
    pg.get_by_test_id('post-hole-card').click(); pg.get_by_test_id('post-hole-chip').wait_for()
    R[f'feedhole_recollapsed_{w}']=vis(); pg.screenshot(path=str(OUT/f'feed-hole-recollapsed_{w}.png')); pg.close()
    pg=page('feedplace','text=Clubhouse')
    R[f'feedplace_{w}']=pg.evaluate("(()=>{const e=[...document.querySelectorAll('span,div')].find(x=>x.textContent==='Clubhouse'&&x.children.length===0);const c=e.closest('[style*=\"top: 12px\"]')||e;const m=document.querySelector('[data-feed-section=media]')||c.offsetParent;const a=c.getBoundingClientRect(),z=m.getBoundingClientRect();return {left:a.left-z.left,top:a.top-z.top,h:a.height,overflow:document.documentElement.scrollWidth>innerWidth}})()")
    pg.screenshot(path=str(OUT/f'feed-place-chip_{w}.png')); pg.close()
    pg=page('teaser','[data-video-teaser]')
    m=pg.locator('.video-teaser-description').get_by_text('Danny Holmes').first
    R[f'teaser_{w}']={'weight':m.evaluate("e=>getComputedStyle(e).fontWeight"),'role':m.evaluate("e=>(e.closest('[role=link],a,button')||{}).tagName||null")}
    pg.screenshot(path=str(OUT/f'teaser-mention_{w}.png'))
    m.click(); R[f'teaser_{w}']['sheetOpened']=pg.evaluate("!!window.__teaserOpened"); R[f'teaser_{w}']['urlAfter']=pg.evaluate("location.href"); pg.close()
    pg=page('faces','[data-faces=after]')
    R[f'faces_{w}']=pg.evaluate("[...document.querySelectorAll('[data-faces]')].map(r=>({row:r.dataset.faces,off:[...r.querySelectorAll('[data-avatar-fallback]')].map(s=>{const box=s.parentElement.getBoundingClientRect();const rg=document.createRange();rg.selectNodeContents(s);const ink=rg.getBoundingClientRect();return Math.round(((ink.top+ink.bottom)/2-(box.top+box.bottom)/2)*10)/10})}))")
    pg.locator('[data-faces=before]').evaluate("e=>e.parentElement.style.display='inline-block'")
    pg.locator('[data-faces=before]').locator('..').screenshot(path=str(OUT/f'faces_{w}.png')); pg.close()
    pg=page('gallery-holes','[data-fullscreen-bottom-stack]')
    for i in (0,1,2,1,0):
      pg.evaluate(f"(()=>{{const e=[...document.querySelectorAll('div')].find(d=>d.scrollWidth>d.clientWidth*2&&getComputedStyle(d).overflowX==='auto');e.scrollTo({{left:{i}*e.clientWidth}});}})()")
      pg.wait_for_function(f"[...document.querySelectorAll('div')].some(d=>d.scrollWidth>d.clientWidth*2&&Math.abs(d.scrollLeft-{i}*d.clientWidth)<2)")
      if i==1: pg.wait_for_function("[...document.querySelectorAll('video')].some(v=>v.readyState>=2)",timeout=30000)
      R.setdefault(f'gallery_run_{w}',[]).append({'slide':i,**pg.evaluate(STACK)})
      pg.screenshot(path=str(OUT/f'gallery-run{len(R[f"gallery_run_{w}"])}-slide{i}_{w}.png'))
    pg.close()
    for k in ('clubhouse','conditions'):
      pg=page('gallery-'+k,'[data-fullscreen-stats]'); R[f'gallery_{k}_{w}']=pg.evaluate(STACK); pg.screenshot(path=str(OUT/f'media-{k}_{w}.png')); pg.close()
  b.close()
(OUT/'metrics.json').write_text(json.dumps(R,indent=1))
print(json.dumps(R)[:6000])
