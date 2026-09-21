import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { RoundResults } from './features/courses/_shared/scorecard/RoundResults';
const efforts = [
  { unit_kind: 'round_gross' as const, value: 69, rank_here: null, top_ten: true, attempts: 71 },
  { unit_kind: 'front_nine' as const, value: -3, rank_here: 3, top_ten: true, attempts: 55 },
  { unit_kind: 'back_nine' as const, value: 1, rank_here: null, top_ten: false, attempts: 56 },
  { unit_kind: 'finish_six' as const, value: 0, rank_here: null, top_ten: true, attempts: 57 },
  { unit_kind: 'round_stableford' as const, value: 38, rank_here: null, top_ten: false, attempts: 71 },
];
createRoot(document.getElementById('root')!).render(<main style={{width:'100%',maxWidth:390,margin:'0 auto',padding:'20px 14px',boxSizing:'border-box',background:'#15171F'}}><RoundResults result={{awards:[],efforts}} /></main>);
