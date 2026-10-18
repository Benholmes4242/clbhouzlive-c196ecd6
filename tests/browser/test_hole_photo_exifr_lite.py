"""MEDIA_ENGINE_1: real JPEG File proof for the approved lite bundle and extractor.
Run: python3 tests/browser/test_hole_photo_exifr_lite.py
Generated files stay under /tmp/browser; no hosted data or database access.
"""
import asyncio, io, json, struct
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

HERE=Path('/tmp/browser/exifr-proof')
HERE.mkdir(parents=True, exist_ok=True)

def fixture(name, date=True, gps=True):
    # Real decodable JPEG with a TIFF EXIF APP1 segment; known fixture values.
    entries= int(date)+int(gps)
    root_size=2+12*entries+4
    exif_offset=8+root_size
    gps_offset=exif_offset+(18+20 if date else 0)
    root=[]
    if date: root.append(struct.pack('<HHII',0x8769,4,1,exif_offset))
    if gps: root.append(struct.pack('<HHII',0x8825,4,1,gps_offset))
    tiff=b'II'+struct.pack('<HI',42,8)+struct.pack('<H',entries)+b''.join(root)+struct.pack('<I',0)
    if date:
        tiff+=struct.pack('<H',1)+struct.pack('<HHII',0x9003,2,20,exif_offset+18)+struct.pack('<I',0)+b'2026:10:18 10:30:45\0'
    if gps:
        coords=gps_offset+54
        tiff+=struct.pack('<H',4)
        tiff+=struct.pack('<HHI',1,2,2)+b'N\0\0\0'
        tiff+=struct.pack('<HHII',2,5,3,coords)
        tiff+=struct.pack('<HHI',3,2,2)+b'W\0\0\0'
        tiff+=struct.pack('<HHII',4,5,3,coords+24)+struct.pack('<I',0)
        tiff+=b''.join(struct.pack('<II',v,1) for v in [54,12,0,5,53,0])
    payload=b'Exif\0\0'+tiff
    buf=io.BytesIO(); Image.new('RGB',(32,32),(42,84,56)).save(buf,format='JPEG')
    jpg=buf.getvalue(); path=HERE/name
    path.write_bytes(jpg[:2]+b'\xff\xe1'+struct.pack('>H',len(payload)+2)+payload+jpg[2:])
    with Image.open(path) as image: image.load()
    return path

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        page=await browser.new_page(viewport={'width':1280,'height':1800})
        await page.goto('http://localhost:8080',wait_until='domcontentloaded')
        await page.set_content('<style>body{background:white;color:black;font:16px sans-serif}pre{font:16px monospace}</style><h1>exifr lite File proof</h1><input type="file"><pre id="result"></pre>')
        results=[]
        for name,date,gps in [('date-gps.jpg',True,True),('date-no-gps.jpg',True,False),('gps-no-date.jpg',False,True)]:
            await page.set_input_files('input',str(fixture(name,date,gps)))
            value=await page.evaluate('''async () => {
              const exifr=await import('/node_modules/exifr/dist/lite.esm.js');
              const file=document.querySelector('input').files[0];
              const data=await exifr.parse(file);
              const {readHolePhotoExif}=await import('/src/lib/courseMedia/holePhotoExif.ts');
              const extracted=await readHolePhotoExif(file);
              const d=data.DateTimeOriginal;
              return {extracted, file: file instanceof File, name:file.name, date:d ? [d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()] : null, latitude:data.latitude ?? null,longitude:data.longitude ?? null};
            }''')
            assert value['file'] is True, value
            assert value['extracted']['captureDay']==('2026-10-18' if date else None),value
            assert value['extracted']['latitude']==(54.2 if gps else None),value
            assert value['extracted']['longitude']==(-(5+53/60) if gps else None),value
            assert value['date']==([2026,10,18,10,30,45] if date else None),value
            assert value['latitude']==(54.2 if gps else None),value
            assert value['longitude']==(-(5+53/60) if gps else None),value
            results.append(value)
        text=json.dumps(results,indent=2)
        await page.locator('#result').evaluate('(el,text)=>el.textContent=text',text)
        await page.screenshot(path=str(HERE/'proof.png'))
        print(text)
        print('PASS: three real JPEG File fixtures; lite date/GPS and ordinary missing metadata verified.')
        await browser.close()
asyncio.run(main())
