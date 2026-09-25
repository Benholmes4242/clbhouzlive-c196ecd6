import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@/index.css';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
const LONG = 'The supporting detail follows beneath the title, and an editor has written enough of it that it runs well past two lines on any tile width we ship.';
const base = (img: string | null, sf: string | null) => ({ id: 's', kind: 'story', ring: 'own', lane: 'news', score: 1, consequence: null,
  subject: { course_id: null, course_name: null, region: null, sub_country: null, image_url: img, pending: false },
  who: null, facts: { headline: 'A championship story with a headline long enough to wrap across all four of the lines the lead allows at this width and then some more words', standfirst: sf, published_at: new Date().toISOString() }, payload: {}, seen: false }) as any;
const rows: any[] = [];
for (const size of ['lead', 'std', 'pair']) for (const img of ['https://picsum.photos/800/600', null]) for (const sf of [null, 'A short standfirst.', LONG])
  rows.push({ size, img, sf });
createRoot(document.getElementById('m')!).render(
  <QueryClientProvider client={new QueryClient()}><MemoryRouter>
    {rows.map((r, i) => <div key={i} data-case={`${r.size}|${r.img ? 'photo' : 'nophoto'}|${r.sf === null ? 'none' : r.sf.length > 30 ? 'long' : 'short'}`} style={{ width: r.size === 'pair' ? 170 : 358, marginBottom: 20 }}>
      <ExploreCard item={base(r.img, r.sf)} size={r.size} shape={null} onTap={() => {}} /></div>)}
  </MemoryRouter></QueryClientProvider>);
