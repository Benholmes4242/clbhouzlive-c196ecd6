import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import FeaturedMomentsCarousel from '@/components/clubhouse/FeaturedMomentsCarousel';
import CourseHighlightsCarousel from '@/components/clubhouse/CourseHighlightsCarousel';
import TopPlayerContentCarousel from '@/components/clubhouse/TopPlayerContentCarousel';
import TrendingTipsCarousel from '@/components/clubhouse/TrendingTipsCarousel';
import ClubSpotlightCarousel from '@/components/clubhouse/ClubSpotlightCarousel';
import ClubhouseFeedControls from '@/components/clubhouse/ClubhouseFeedControls';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { featuredMoments } from '@/data/clubhouseFeedData';

const Index = () => {
  const { user } = useSupabaseSession();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Welcome to Clubhouz</h1>
              <p className="text-muted-foreground text-lg">
                Golf's digital clubhouse - Connect, Share, and Explore the world of golf
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to access all features and connect with the golf community.
              </p>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Feed Controls */}
          <ClubhouseFeedControls 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          {/* Featured Moments Carousel */}
          <div className="mb-6">
            <FeaturedMomentsCarousel userPosts={[]} loading={false} />
          </div>

          {/* Course Highlights */}
          <div className="mb-6">
            <CourseHighlightsCarousel />
          </div>

          {/* Top Player Content */}
          <div className="mb-6">
            <TopPlayerContentCarousel />
          </div>

          {/* Trending Tips */}
          <div className="mb-6">
            <TrendingTipsCarousel />
          </div>

          {/* Club Spotlight */}
          <div className="mb-6">
            <ClubSpotlightCarousel />
          </div>

          {/* Content placeholder */}
          <div className="px-4">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Feed Coming Soon</h3>
              <p className="text-muted-foreground">
                The social feed is being rebuilt without tagging functionality
              </p>
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Index;