
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import TrendingFeed from '@/components/TrendingFeed';
import ClubhouzMomentsCarousel from '@/components/clubhouse/ClubhouzMomentsCarousel';

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
            style={{ borderBottomColor: '#f7931e' }}
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
        <div className="text-center space-y-6 md:space-y-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex justify-center items-center gap-2 md:gap-4">
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="Logo Mark"
              className="w-auto h-16 md:h-24 lg:h-32 object-contain"
            />
            <img
              src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
              alt="clbhouz"
              className="w-auto max-h-20 md:max-h-32 lg:max-h-48 object-contain"
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
            <div className="flex items-center justify-center gap-4 md:gap-8 mt-8 md:mt-12">
              <img
                src="/lovable-uploads/8537a2c1-2486-42b9-9783-1b1992d30507.png"
                alt="Download on the App Store"
                className="h-10 md:h-12 w-auto object-contain"
              />
              <img
                src="/lovable-uploads/1cacfaf3-2385-4a3d-865f-2834c60f5a07.png"
                alt="Get it on Google Play"
                className="h-10 md:h-12 w-auto object-contain"
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
      <ClubhouzMomentsCarousel />
      
      <main>
        <TrendingFeed />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
