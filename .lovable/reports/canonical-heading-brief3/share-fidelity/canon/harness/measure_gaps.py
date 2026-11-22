from pathlib import Path
from PIL import Image
import numpy as np,json
R=Path('/dev-server/.lovable/reports/canonical-heading-brief3/share-fidelity/canon');m=json.loads((R/'after-metrics.json').read_text());out={}
for key,data in m.items():
 live=np.array(Image.open(R/'after'/f'live-{key}.png').convert('RGB')).astype(float);bg=np.array(Image.open(R/'after'/f'background-{key}.png').convert('RGB')).astype(float);saved=np.array(Image.open(R/'after'/f'real-{key}.png').convert('RGB').resize((405,live.shape[0]),Image.Resampling.LANCZOS)).astype(float)
 def bounds(im,label):
  b=next(e['box'] for e in data['elements'] if e['label']==label);x,y=int(b['x']),int(b['y'])-2;w,h=int(np.ceil(b['w'])),int(np.ceil(b['h']))+4
  crop=im[y:y+h,x:x+w];back=bg[y:y+h,x:x+w];mask=(crop-back).min(axis=2)>65;yy,xx=np.where(mask);return int(yy.min()+y),int(yy.max()+y+1)
 rows=[]
 for a,b in [('hero title','hero subline'),('hero score','hero verdict')]:
  l=bounds(live,b)[0]-bounds(live,a)[1];s=bounds(saved,b)[0]-bounds(saved,a)[1];rows.append({'gap':a+' → '+b,'live':l,'saved':s,'delta':abs(l-s)})
 out[key]=rows
 print(key,rows)
 assert all(row['delta']<=1 for row in rows),key
(R/'hero-gap-table.json').write_text(json.dumps(out,indent=2))
