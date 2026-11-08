import React from 'react';
import {createRoot} from 'react-dom/client';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import './index.css';
import './styles/tour-hub-tokens.css';
import {PhotoBand} from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import {CourseMasthead} from '@/components/courses/CourseMasthead';
import {HERO_CONTENT_TOP} from '@/lib/heroHeights';
async function main(){
 const translations=await fetch('/locales/en/tourhub.json').then(r=>r.json());
 await i18n.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:translations}},interpolation:{escapeValue:false}});
 const root=document.getElementById('root');if(!root)return;
 const face='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="25"><rect width="24" height="25" fill="gray"/></svg>');
 createRoot(root).render(<><div data-derived={HERO_CONTENT_TOP}><PhotoBand title="Bermuda" venueName="Port Royal" datesString="Nov 5–8" venueImageUrl={null} state={{kind:'live',round:3,totalRounds:4}} tourLabel="PGA" leader={{score:-12,caps:'Three tied',faces:[1,2,3].map(n=>({key:String(n),name:'Player',candidates:[face]}))}} countdown={[]} startDay={null} segments={[{text:'Three tied at the top.',figure:false}]} onOpen={()=>{}} onFullBoard={()=>{}} /></div><div data-place-proof><CourseMasthead photoBand kicker="England" name="Course" place="Britain & Ireland" /></div></>);
}
main();
