
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ClubhouseFeedControls from '@/components/clubhouse/ClubhouseFeedControls';
import CourseHighlightsCarousel from '@/components/clubhouse/CourseHighlightsCarousel';
import ClubSpotlightCarousel from '@/components/clubhouse/ClubSpotlightCarousel';
import FeaturedMomentsCarousel from '@/components/clubhouse/FeaturedMomentsCarousel';
import TopPlayerContentCarousel from '@/components/clubhouse/TopPlayerContentCarousel';
import ClbhouzMomentsCarousel from '@/components/clubhouse/ClbhouzMomentsCarousel';
import InstagramStyleFeed from '@/components/clubhouse/InstagramStyleFeed';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';

const ClubhouseFeed = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const { posts, loading } = useClubhouseContent();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="py-6 pb-20">
        <div className="container mx-auto px-4 mb-6">
          <h1 className="text-3xl font-bold text-center">Clubhouse</h1>
          <p className="text-muted-foreground text-center mt-2">
            Your premium golf community experience
          </p>
        </div>

        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6 mt-6">
              <ClubhouseFeedControls 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              
              <div className="space-y-6">
                <ClbhouzMomentsCarousel />
                <FeaturedMomentsCarousel userPosts={posts} loading={loading} />
                <TopPlayerContentCarousel userPosts={posts} loading={loading} />
                <CourseHighlightsCarousel />
                <ClubSpotlightCarousel />
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <div className="bg-card rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
                <p className="text-muted-foreground">
                  Premium events and tournaments will be displayed here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="community" className="mt-6">
              <div className="bg-card rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Community Features</h2>
                <p className="text-muted-foreground">
                  Member discussions and exclusive content coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Instagram-style full-width feed - breaks out of container */}
        {activeTab === 'feed' && (
          <div className="mt-8">
            <div className="container mx-auto px-4 mb-4">
              <h2 className="text-xl font-semibold">Latest Posts</h2>
              <p className="text-muted-foreground text-sm">Discover the latest golf moments from the community</p>
            </div>
            <InstagramStyleFeed userPosts={posts} loading={loading} />
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;
