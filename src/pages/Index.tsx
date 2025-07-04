
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import StoryBar from '@/components/StoryBar';
import TrendingFeed from '@/components/TrendingFeed';
import ClbhouzMomentsCarousel from '@/components/clubhouse/ClbhouzMomentsCarousel';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { removeDuplicatePosts } from '@/utils/postCleanup';
import { useAppLogo } from '@/hooks/useAppLogo';

const Index = () => {
  const { user, loading } = useSupabaseSession();
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();

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
            style={{ borderBottomColor: '#6e9277' }}
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
              src={currentLogo?.file_url || "/lovable-uploads/181fd40d-ced5-420c-bff8-27c2ef146377.png"}
              alt="clbhouz"
              className="w-auto max-h-48 object-contain"
            />
          </div>
          
          {/* Call to Action */}
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full py-3 text-lg text-white hover:opacity-90"
              style={{ backgroundColor: '#000000' }}
              size="lg"
            >
              Get Started
            </Button>
            
            {/* Tagline */}
            <p className="text-muted-foreground text-sm">
              Welcome to your digital clubhouse for all things golf
            </p>
            
            {/* App Store Buttons */}
            <div className="flex items-center justify-center gap-8" style={{ marginTop: '2cm' }}>
              <img
                src="/lovable-uploads/8537a2c1-2486-42b9-9783-1b1992d30507.png"
                alt="Download on the App Store"
                className="h-12 w-auto object-contain"
              />
              <img
                src="/lovable-uploads/1cacfaf3-2385-4a3d-865f-2834c60f5a07.png"
                alt="Get it on Google Play"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated user content - this is the main feed
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryBar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <ClbhouzMomentsCarousel />
          <TrendingFeed />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
