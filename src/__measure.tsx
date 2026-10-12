import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
const text = new URLSearchParams(location.search).get('text') === '1';
const post = { id:'p', userId:'u', actorId:'u', displayName:'Ben Member', avatarUrl:'', createdAt:new Date(Date.now()-86400000).toISOString(), caption:'', handicapIndex:8.4, courseRating:7.1,
  review:{ reviewId:'r', courseId:'c', courseName:'Rosapenna (Sandy Hills Links)', courseRegion:'Donegal', courseCountry:'Ireland', courseImageUrl:null, rating:8.6,
    reviewText: text ? 'A proper links, firm and fast, with dunes that frame every hole. The back nine is the best stretch of golf in the north west and the greens are true all the way round.' : '',
    breakdown:{ design:9.1, conditions:8.4, clubhouse:7.5, facilities:8 } } } as never;
createRoot(document.getElementById('r')!).render(
  <MemoryRouter><QueryClientProvider client={new QueryClient()}>
    <ReviewPostCard post={post} articleRef={() => {}} feedIndex={1} onProfile={() => {}} onReadReview={() => {}} onPrefetch={() => {}} coursesReviewed={47}
      followPill={<span style={{display:'inline-block',width:64,height:22,borderRadius:99,border:'1px solid #333'}}/>}
      media={<div style={{width:'100%',height:'100%',background:'#345'}}/>}
      footer={<div><div style={{height:40}}/><div style={{height:26}}/></div>} />
  </QueryClientProvider></MemoryRouter>);
