
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import StoryBar from '@/components/StoryBar';
import ClubhouseFeedControls from '@/components/clubhouse/ClubhouseFeedControls';
import FeaturedMomentsCarousel from '@/components/clubhouse/FeaturedMomentsCarousel';
import EnhancedPostsFeed from '@/components/clubhouse/EnhancedPostsFeed';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { removeDuplicatePosts } from '@/utils/postCleanup';

const Index = () => {
  const { user, loading } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState<'trending' | 'friends' | 'videos' | 'photos' | 'courses' | 'all'>('all');
  const { posts, loading: postsLoading } = useClubhouseContent();

  // Clean up duplicate posts when user is loaded
  useEffect(() => {
    if (user?.id) {
      removeDuplicatePosts(user.id);
    }
  }, [user?.id]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
            style={{ borderBottomColor: '#b66b41' }}
          ></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page for non-authenticated users - this is the landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/lovable-uploads/db232238-df12-4d85-a6d9-d97fbda7a9dc.png"
              alt="clbhouz"
              className="w-auto max-h-48 object-contain"
            />
          </div>
          
          {/* Call to Action */}
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full py-3 text-lg text-white hover:opacity-90"
              style={{ backgroundColor: '#322F30' }}
              size="lg"
            >
              Get Started
            </Button>
            
            {/* Tagline */}
            <p className="text-muted-foreground text-sm">
              Welcome to your digital clubhouse for all things golf
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated user content - this is the main Clubhouse feed
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryBar />
      
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              feedFilter={feedFilter}
              setFeedFilter={setFeedFilter}
            />
            
            <FeaturedMomentsCarousel userPosts={posts} loading={postsLoading} />
            
            <EnhancedPostsFeed 
              posts={posts} 
              loading={postsLoading} 
              filter={feedFilter}
            />
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

      <BottomNavigation />
    </div>
  );
};

export default Index;
