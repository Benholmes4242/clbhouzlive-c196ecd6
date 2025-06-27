
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import FloatingPostButton from '@/components/posts/FloatingPostButton';
import ClubSpotlightCarousel from '@/components/clubhouse/ClubSpotlightCarousel';
import CourseHighlightsCarousel from '@/components/clubhouse/CourseHighlightsCarousel';
import FeaturedMomentsCarousel from '@/components/clubhouse/FeaturedMomentsCarousel';
import TopPlayerContentCarousel from '@/components/clubhouse/TopPlayerContentCarousel';
import TrendingTipsCarousel from '@/components/clubhouse/TrendingTipsCarousel';
import ClubhouseFeedControls from '@/components/clubhouse/ClubhouseFeedControls';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';

const ClubhouseFeed = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [feedType, setFeedType] = useState('trending');
  const [timeRange, setTimeRange] = useState('week');
  
  const { 
    clubSpotlight, 
    courseHighlights, 
    featuredMoments, 
    topPlayerContent, 
    trendingTips 
  } = useClubhouseContent(feedType, timeRange);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">Clubhouse</h1>
          <p className="text-muted-foreground text-center mt-2">
            Your premium golf community experience
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6 mt-6">
            <ClubhouseFeedControls 
              feedType={feedType}
              setFeedType={setFeedType}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
            
            <ClubSpotlightCarousel clubs={clubSpotlight} />
            <CourseHighlightsCarousel courses={courseHighlights} />
            <FeaturedMomentsCarousel moments={featuredMoments} />
            <TopPlayerContentCarousel players={topPlayerContent} />
            <TrendingTipsCarousel tips={trendingTips} />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Premium events and tournaments will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Member discussions and exclusive content coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FloatingPostButton />
      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;
