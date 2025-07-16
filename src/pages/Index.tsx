
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import TrendingFeed from '@/components/TrendingFeed';
import ClubhouzMomentsCarousel from '@/components/clubhouse/ClubhouzMomentsCarousel';
import TrendingCard from '@/components/trending/TrendingCard';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { removeDuplicatePosts } from '@/utils/postCleanup';
import { useAppLogo } from '@/hooks/useAppLogo';

const Index = () => {
  const { user, loading } = useSupabaseSession();
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();
  const [contentLoaded, setContentLoaded] = useState(false);

  // Clean up duplicate posts when user is loaded
  useEffect(() => {
    if (user?.id) {
      removeDuplicatePosts(user.id);
    }
  }, [user?.id]);

  // Add a delay to ensure smooth transition and prevent flickering
  useEffect(() => {
    if (user && !loading) {
      const timer = setTimeout(() => {
        setContentLoaded(true);
      }, 100); // Small delay to prevent flash
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

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

  // Show loading while waiting for content to stabilize
  if (user && !contentLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="lg:max-w-6xl lg:mx-auto lg:px-8">
          {/* Loading skeletons for each section */}
          <div className="w-full py-4">
            <div className="mx-auto" style={{ paddingLeft: '0.125rem', paddingRight: '0.125rem' }}>
              <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-lg font-semibold">Discover new players</h2>
              </div>
              <div className="relative md:px-4">
                <div className="flex gap-1 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-52 md:w-60">
                      <div className="bg-muted rounded-lg aspect-[3/4] animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mx-auto" style={{ paddingLeft: '0.125rem', paddingRight: '0.125rem' }}>
            <div className="flex items-center justify-between mb-4 px-4">
              <h2 className="text-lg font-semibold">Golf's most watched</h2>
            </div>
          </div>
          
          <div className="px-1 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="w-full aspect-[3/4] bg-muted rounded-lg animate-pulse" />
              <div className="w-full aspect-[3/4] bg-muted rounded-lg animate-pulse hidden md:block" />
              <div className="w-full aspect-[3/4] bg-muted rounded-lg animate-pulse hidden md:block" />
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Show authenticated user content - this is the main feed
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      {/* Desktop container with max-width and padding */}
      <div className="lg:max-w-6xl lg:mx-auto lg:px-8">
        <ClubhouzMomentsCarousel />
        
        {/* Golf's most watched section */}
        <div className="mx-auto" style={{ paddingLeft: '0.125rem', paddingRight: '0.125rem' }}>
          <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-lg font-semibold">Golf's most watched</h2>
          </div>
        </div>
        
        <TrendingCard />
        
        {/* Your clubhouse feed section */}
        <div className="mx-auto" style={{ paddingLeft: '0.125rem', paddingRight: '0.125rem' }}>
          <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-lg font-semibold">Your clubhouse feed</h2>
          </div>
        </div>
        
        <main>
          <TrendingFeed />
        </main>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
