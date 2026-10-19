import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { EdgeSection } from '@/components/courses/course-detail/you/many/ManySections';
const mk = (vals: number[]) => vals.map((edge, i) => ({ hole_no: i + 1, par: 4, field: 0.5 + (i % 5) * 0.1, you: 0.5 + (i % 5) * 0.1 - edge, timesPlayed: 9, edge, birdied: false }));
const sum = (e: any[], leastNo: number, levelNos: number[]) => ({ measured: e, unmeasured: 0, behind: e.filter((x) => x.edge < 0), front: 0.31, back: 0.17, leastEdge: e.find((x) => x.hole_no === leastNo) ?? null, otherLevel: e.filter((x) => levelNos.includes(x.hole_no)), fieldEasiest: null, fieldHardest: null } as any);
const ahead = mk([.4,.3,.5,.02,.35,.2,.45,.3,.25,.3,.15,.03,.2,.1,.25,.2,.3,.15]);
const mixed = mk([.4,.3,.5,.02,-.3,.2,.45,.3,.25,.3,.15,.03,-.2,.1,.25,.2,.3,.15]);
createRoot(document.getElementById('r')!).render(<div className="dark" style={{ display: 'flex', gap: 24, padding: 24 }}>
  {[[ahead, 4, [12]], [mixed, 4, [12]]].map(([e, l, lv]: any, i) => <div key={i} id={`f${i}`} style={{ width: 390, background: '#0A0A0C' }}><EdgeSection edges={e} s={sum(e, l, lv)} fieldRounds={799} onAllHoles={() => {}} /></div>)}
</div>);
