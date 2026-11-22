from pathlib import Path
from PIL import Image
import numpy as np,json,re,sys
R=Path('/dev-server/.lovable/reports/canonical-heading-brief3/share-fidelity/canon')
def luminance(rgb):
 v=rgb/255.;v=np.where(v<=.04045,v/12.92,((v+.055)/1.055)**2.4);return v@np.array([.2126,.7152,.0722])
phase=sys.argv[1];m=json.loads((R/f'{phase}-metrics.json').read_text());out={}
for key,data in m.items():
 bg=np.array(Image.open(R/phase/f'background-{key}.png').convert('RGB')).astype(float);rows=[]
 for e in data['elements']:
  b=e['box'];x,y=int(b['x']),int(b['y']);w,h=int(np.ceil(b['w'])),int(np.ceil(b['h']));crop=bg[max(y,0):y+h,max(x,0):x+w];l=luminance(crop);p=float(np.percentile(l,10));pixel=crop.reshape(-1,3)[np.argmin(np.abs(l.ravel()-p))];color=[255,255,255,1] if e['label']=='wordmark' else [float(v) for v in re.findall(r'[\d.]+',e['color'])];alpha=color[3] if len(color)>3 else 1;fg=luminance(np.array(color[:3])*alpha+pixel*(1-alpha));ratio=float((fg+.05)/(p+.05));rows.append(dict(label=e['label'],ratio=ratio,luminanceP10=p,color=e['color']))
 out[key]=rows
 print(key,[(e['label'],round(e['ratio'],2)) for e in rows])
(R/f'{phase}-contrast.json').write_text(json.dumps(out,indent=2))
