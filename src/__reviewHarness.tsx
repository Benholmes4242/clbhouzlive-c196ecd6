import React from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import common from '../public/locales/en/common.json';
import courses from '../public/locales/en/courses.json';
import '@/index.css';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
import { courseRatingAggregatesKey } from '@/hooks/useCourseRatingAggregates';

i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { common, courses } }, interpolation: { escapeValue: false } });
const qc = new QueryClient();
qc.setQueryData(courseRatingAggregatesKey('c'), { course_id: 'c', avg_overall_score: 7.1, avg_design_score: 7.4, avg_condition_score: 6.9, avg_clubhouse_score: 7.0, avg_facilities_score: 7.2, review_count: 24, text_review_count: 10 });
const q = new URLSearchParams(location.search);
document.documentElement.style.setProperty('--chrome-clearance', (q.get('cc') ?? '90') + 'px');
document.documentElement.style.setProperty('--nav-pill-h', (q.get('np') ?? '64') + 'px');
const post = { id: 'p', userId: 'u', actorId: 'u', displayName: 'Tommy Minter', avatarUrl: '', createdAt: new Date(Date.now() - 86400000).toISOString(), caption: '', handicapIndex: 12,
  review: { reviewId: 'r', courseId: 'c', courseName: 'Woldingham Golf Club', courseImageUrl: null, rating: 6.8, courseRegion: 'Surrey', courseCountry: 'Britain & Ireland',
    reviewText: 'A really enjoyable parkland course with some lovely holes on the back nine. The downside for me was the state of the bunkers, which needed attention, and the slow pace of play on a Saturday.',
    breakdown: { design: 7, conditions: 8, clubhouse: 6, facilities: 6 } } } as never;
createRoot(document.getElementById('h')!).render(
  <I18nextProvider i18n={i18n}><MemoryRouter><QueryClientProvider client={qc}>
    <div style={{ paddingTop: 'var(--chrome-clearance)' }}>
      <ReviewPostCard post={post} articleRef={() => {}} surface="#10151C" onProfile={() => {}} onReadReview={() => {}} onPrefetch={() => {}}
        onOpenCourse={() => {}}
        media={<img src="/placeholders/post-tile.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        footer={<div data-footer><div style={{ height: 40 }} /><div style={{ height: 26 }} /></div>} />
    </div>
  </QueryClientProvider></MemoryRouter></I18nextProvider>,
);
