
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ClubhouseFeedControls from '@/components/clubhouse/ClubhouseFeedControls';
import FeaturedMomentsCarousel from '@/components/clubhouse/FeaturedMomentsCarousel';
import CourseHighlightsCarousel from '@/components/clubhouse/CourseHighlightsCarousel';
import TopPlayerContentCarousel from '@/components/clubhouse/TopPlayerContentCarousel';
import TrendingTipsCarousel from '@/components/clubhouse/TrendingTipsCarousel';
import ClubSpotlightCarousel from '@/components/clubhouse/ClubSpotlightCarousel';

const ClubhouseFeed = () => {
  const [feedType, setFeedType] = useState('all');
  const [contentFilter, setContentFilter] = useState('all');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Clubhouse Feed</h1>
          <p className="text-muted-foreground">Discover golf content from the community</p>
        </div>

        {/* Controls */}
        <ClubhouseFeedControls 
          feedType={feedType}
          setFeedType={setFeedType}
          contentFilter={contentFilter}
          setContentFilter={setContentFilter}
        />

        {/* Carousel Sections */}
        <FeaturedMomentsCarousel />
        <CourseHighlightsCarousel />
        <TopPlayerContentCarousel />
        <TrendingTipsCarousel />
        <ClubSpotlightCarousel />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;
