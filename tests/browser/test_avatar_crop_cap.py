"""Exercise both real crop modals without authentication, R2 writes or Vitest count changes.
Run: python3 tests/browser/test_avatar_crop_cap.py

Browser canvas regression checks for both crop modals live outside Vitest in `tests/browser`, exercise the real Apply handlers with local callbacks, and write evidence under `/tmp/browser`, because JPEG byte identity needs a real browser without hosted upload writes or changing the agreed Vitest count.
"""
import asyncio
import json
import re
import urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('/tmp/browser/avatar-cap')

HTML = '''<html><body><div id="crop-test"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;
const {default:React}=await import('REACT_URL');
const {default:ReactDOM}=await import('ROOT_URL');const {createRoot}=ReactDOM;
const {ImageCropperModal}=await import('/src/components/profile/edit-v2/ImageCropperModal.tsx');
const {ImageCropModal}=await import('/src/components/business/ImageCropModal.tsx');
await import('/src/index.css');
const root = createRoot(document.getElementById('crop-test'));
window.mountCrop = (kind, src, aspect) => {
 window.result = null;
 const done = async blob => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode();
  window.result = {width:img.naturalWidth,height:img.naturalHeight,size:blob.size,bytes:Array.from(bytes)};
 };
 root.render(React.createElement(kind==='personal'?ImageCropperModal:ImageCropModal, {
  key: Math.random(),open:true,onOpenChange:()=>{},image:src,imageSrc:src,aspectRatio:aspect,onCropComplete:done
 }));
};
window.ready = true;
</script></body></html>'''

SETUP = '''() => {
 const proto = CanvasRenderingContext2D.prototype;
 const draw = proto.drawImage, get = proto.getImageData;
 proto.drawImage = function(...args) {
  if(args.length===9) window.crop = {x:args[1],y:args[2],width:args[3],height:args[4]};
  return draw.apply(this,args);
 };
 proto.getImageData = function(x,y,width,height,...rest) {
  window.crop = {x,y,width,height};
  return get.call(this,x,y,width,height,...rest);
 };
 window.makeSource = async (width,height) => {
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const ctx=c.getContext('2d');const data=ctx.createImageData(width,height);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
   const i=(y*width+x)*4;
   data.data[i]=(x*7+y*3)%256;data.data[i+1]=(x+y*5)%256;data.data[i+2]=(x*3+y*11)%256;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  window.source=URL.createObjectURL(blob); return window.source;
 };
 window.legacy = async (kind, crop) => {
  const img=new Image();img.src=window.source;await img.decode();
  const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');
  if(kind==='personal') {
   canvas.width=img.width;canvas.height=img.height;
   ctx.translate(img.width/2,img.height/2);ctx.rotate(0);ctx.translate(-img.width/2,-img.height/2);
   ctx.drawImage(img,0,0);
   const pixels=get.call(ctx,crop.x,crop.y,crop.width,crop.height);
   canvas.width=crop.width;canvas.height=crop.height;ctx.putImageData(pixels,0,0);
  } else {
   canvas.width=crop.width;canvas.height=crop.height;
   draw.call(ctx,img,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
  }
  const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',kind==='personal'?0.9:0.92));
  const bytes=Array.from(new Uint8Array(await blob.arrayBuffer()));
  return {size:blob.size,identical:JSON.stringify(bytes)===JSON.stringify(window.result.bytes)};
 };
}'''

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    reports = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width':1280,'height':1800})
        page = await context.new_page()
        page.on("pageerror", lambda err: print("PAGE ERROR", str(err)))
        page.on("console", lambda msg: print("CONSOLE", msg.text) if msg.type=="error" else None)
        modal_src=urllib.request.urlopen('http://localhost:8080/src/components/profile/edit-v2/ImageCropperModal.tsx').read().decode()
        main_src=urllib.request.urlopen('http://localhost:8080/src/main.tsx').read().decode()
        react_url=re.search(r'"(/node_modules/.vite/deps/react.js\?[^"]+)"',modal_src).group(1)
        root_url=re.search(r'"(/node_modules/.vite/deps/react-dom_client.js\?[^"]+)"',main_src).group(1)
        html=HTML.replace('REACT_URL',react_url).replace('ROOT_URL',root_url)
        await page.route('http://localhost:8080/__crop-cap-check', lambda route: route.fulfill(content_type='text/html', body=html))
        await page.goto('http://localhost:8080/__crop-cap-check')
        await page.wait_for_function('window.ready === true')
        await page.evaluate(SETUP)
        for kind in ('personal','business'):
            for width,height,aspect in ((4032,3024,1/1.05),(4032,3024,3.2),(800,600,1/1.05)):
                src = await page.evaluate('([w,h])=>window.makeSource(w,h)',[width,height])
                await page.evaluate('([kind,src,aspect])=>window.mountCrop(kind,src,aspect)',[kind,src,aspect])
                await page.locator('.reactEasyCrop_Image').wait_for()
                await page.wait_for_function('document.querySelector(".reactEasyCrop_Image")?.naturalWidth > 0')
                # react-easy-crop measures its frame after layout/animation settles.
                await page.wait_for_timeout(800)
                await page.get_by_role('button',name='Apply',exact=True).click()
                await page.wait_for_function('window.result !== null')
                result=await page.evaluate('({crop:window.crop,width:window.result.width,height:window.result.height,size:window.result.size})')
                crop=result['crop']
                scale=min(1,1440/max(crop['width'],crop['height']))
                expected_width=int(crop['width']*scale+0.5) if scale<1 else int(crop['width'])
                expected_height=int(crop['height']*scale+0.5) if scale<1 else int(crop['height'])
                assert (result['width'],result['height'])==(expected_width,expected_height), result
                assert max(result['width'],result['height'])<=1440, result
                if scale==1:
                    legacy=await page.evaluate('([kind,crop])=>window.legacy(kind,crop)',[kind,crop])
                    assert legacy['identical'], (kind,legacy,result)
                    result['byte_identical_to_legacy']=True
                await page.get_by_role('dialog').screenshot(path=str(OUT/f'{kind}-{width}-{aspect}.png'))
                result.update(modal=kind,source=[width,height],aspect=aspect)
                reports.append(result)
        await browser.close()
    (OUT/'measurements.json').write_text(json.dumps(reports,indent=2))
    print(json.dumps(reports,indent=2))

asyncio.run(main())
