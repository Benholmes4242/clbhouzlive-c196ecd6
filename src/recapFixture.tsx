import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import tourhub from '../public/locales/en/tourhub.json';
import './index.css';
import { RecapPhotoBand, SeasonRecapBody } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import { RailChips } from '@/components/ui/RailChips';
const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({ lng: 'en', ns: ['tourhub'], defaultNS: 'tourhub', resources: { en: { tourhub } } });
const names = ['Ross Steelman','Sandy Scott','Ian Holt','Alistair Docherty','Alvaro Ortiz','Austin Hitt','Cole Sherwood','Doc Redman','Blades Brown','Tommy Morrison','Cooper Dossey','Hunter Eichhorn','Dylan Menante','Michael Johnson','Jeremy Gandon','Taylor Dickson','Ian Gilligan','Davis Shore','Carson Young','Davis Lamb'];
const pts=[2221,2191,1618];
const mode = new URLSearchParams(location.search).get('mode');
const fresh = { events:25,winners:20,maxWins:2,mostWinsSurname:'Steelman',tiedLeaders:1,
  standings:names.map((name,i)=>({position:i+1,name,points:pts[i]??1000-i,playerId:'p'+i})),standingsSource:{table:'tour_season_rankings',date:'2026-10-12'},
  cardLine:{label:'TOP 20 · PGA TOUR CARD FOR 2027',n:20},cardEarners:names.map(n=>({name:n,age:n==='Blades Brown'?19:27}))} as any;
const champ = { events:28,winners:19,maxWins:4,mostWinsSurname:'Alker',tiedLeaders:1,standings:null,standingsSource:null,cardLine:null,cardEarners:[] } as any;
const tour = mode==='champ'?'champ':'pgad';
const data = mode==='champ'?champ:fresh;
const slide = { type:'completed', tournament:{ id:'t1', tourSlug:tour, seasonYear:2026, name:'x', status:'closed', startDate:'2026-10-08', endDate:'2026-10-11', venueName: tour==='champ'?'Phoenix Country Club':'The Federal Club' } } as any;
const qc = new QueryClient();
createRoot(document.getElementById('root')!).render(<I18nextProvider i18n={i18n}><QueryClientProvider client={qc}><MemoryRouter><div className="dark" style={{maxWidth:430}}>
<RecapPhotoBand slide={slide} state={{kind:'results',variant:'final',finishDate:'2026-10-11',meta:''} as any} data={data} onOpen={()=>{}}/>
<RailChips options={['PGA','LPGA','DP World','Champions','Korn Ferry'].map(l=>({id:l,label:l}))} value={tour==='champ'?'Champions':'Korn Ferry'} onChange={()=>{}} ariaLabel="Tour" toggleSemantics fill className="overview-tour-chips"/>
<SeasonRecapBody tour={tour as any} year={2026} data={data}/>
</div></MemoryRouter></QueryClientProvider></I18nextProvider>);
