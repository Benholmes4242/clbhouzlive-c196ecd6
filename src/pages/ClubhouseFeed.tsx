
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import FloatingPostButton from '@/components/posts/FloatingPostButton';
import ClubhouseFeedControls from '@/components/clubhouse/ClubhouseFeedControls';
import FeaturedMomentsCarousel from '@/components/clubhouse/FeaturedMomentsCarousel';
import CourseHighlightsCarousel from '@/components/clubhouse/CourseHighlightsCarousel';
import TopPlayerContentCarousel from '@/components/clubhouse/TopPlayerContentCarousel';
import TrendingTipsCarousel from '@/components/clubhouse/TrendingTipsCarousel';
import ClubSpotlightCarousel from '@/components/clubhouse/ClubSpotlightCarousel';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';

const ClubhouseFeed = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { posts, loading } = useClubhouseContent();

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const content = post.content?.toLowerCase() || '';
    
    return content.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Clubhouse Feed</h1>
          <p className="text-muted-foreground">Discover golf content from the community</p>
        </div>

        {/* Search Controls */}
        <ClubhouseFeedControls 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Carousel Sections with User Content Integration */}
        <FeaturedMomentsCarousel userPosts={filteredPosts} loading={loading} />
        <CourseHighlightsCarousel />
        <TopPlayerContentCarousel userPosts={filteredPosts} loading={loading} />
        <TrendingTipsCarousel />
        <ClubSpotlightCarousel />
      </main>
      
      <FloatingPostButton />
      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;
