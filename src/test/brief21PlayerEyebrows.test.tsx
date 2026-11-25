import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {createInstance} from 'i18next';
import {I18nextProvider,initReactI18next} from 'react-i18next';
import en from '../../src/locales/en/tourhub.json';
import {PlayerGame} from '@/features/tourhub/player-v2/sections/PlayerGame';
import {PlayerShots} from '@/features/tourhub/player-v2/sections/PlayerShots';
const i18n=createInstance();void i18n.use(initReactI18next).init({lng:'en',resources:{en:{tourhub:en}},interpolation:{escapeValue:false},initAsync:false});
const stats=(tour:string)=>[['driving_distance',84],['driving_accuracy',60],['greens_in_reg',96],['strokes_gained_tee_green',99],['strokes_gained_putting',96],['scoring_average',100]].map(([stat,percentile])=>({stat:stat as string,percentile:percentile as number,players:180,tour,value:68.6}));
const him={rounds:60,holes_par3:4,holes_par4:10,holes_par5:4,par3:-0.02,par4:-0.1,par5:-0.5,bogey_rate:0.1};
const tourAvg={players:150,par3:0.05,par4:0.05,par5:-0.3,bogey_rate:0.15};
const mine={rounds:10,holes_par3:4,holes_par4:10,holes_par5:4,par3:0.8,par4:0.9,par5:0.7,bogey_rate:0.5};
afterEach(cleanup);
describe('Brief 21 A — player eyebrows are all capitals',()=>{
 for(const tour of ['pga','lpga'])it(`${tour}: every section eyebrow and pv-you small equals its upper case`,()=>{
  const {container}=render(<I18nextProvider i18n={i18n}><PlayerGame stats={stats(tour)} tour={tour} label={tour.toUpperCase()}/><PlayerShots him={him} tour={tourAvg} mine={mine} code={tour}/></I18nextProvider>);
  const nodes=[...container.querySelectorAll('.pv-head h2, .pv-head > span, .pv-duo small, .pv-you > small')];
  expect(container.querySelector('[data-you-against]')).not.toBeNull();
  expect(nodes.length).toBeGreaterThanOrEqual(7);
  for(const n of nodes)expect(n.textContent).toBe((n.textContent??'').toUpperCase());
 });
});
import {percentileLabel} from '@/features/tourhub/components/overview-v3/HybridHeroBands/pickInsightRules';
describe('Brief 21 B — percentiles never read as ranks',()=>{
 it.each([[100,'Best'],[99,'Top 1%'],[96,'Top 4%'],[60,'Top 40%'],[50,'Top 50%'],[49,'Bottom 49%'],[10,'Bottom 10%'],[0,'Bottom 1%']])('percentileLabel(%i) is %s',(p,label)=>{expect(percentileLabel(Number(p))).toBe(label);});
 it('Scheffler-shaped data shows Best beside Scoring average and never 100th',()=>{
  const {container}=render(<I18nextProvider i18n={i18n}><PlayerGame stats={stats('pga')} tour="pga" label="PGA TOUR"/></I18nextProvider>);
  expect(container.querySelector('[data-player-stat=scoring_average] .pv-percentile')?.textContent).toBe('Best');
  expect(container.querySelector('[data-player-stat=greens_in_reg] .pv-percentile')?.textContent).toBe('Top 4%');
  expect(container.textContent).not.toContain('100th');
 });
});
