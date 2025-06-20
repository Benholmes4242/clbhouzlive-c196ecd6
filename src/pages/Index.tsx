
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import StoryBar from '@/components/StoryBar';
import TrendingFeed from '@/components/TrendingFeed';
import CreatePostDialog from '@/components/posts/CreatePostDialog';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useSupabaseSession();
  const navigate = useNavigate();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/lovable-uploads/1e74af6c-d153-4197-a52b-5bf76a943867.png"
              alt="clbhouz Logo"
              className="w-auto max-h-20 object-contain"
            />
          </div>
          
          {/* Tagline with matching colors */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-gray-800">swing.</span>{' '}
              <span className="text-orange-600">snap.</span>{' '}
              <span className="text-gray-800">share.</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect with fellow golfers and share your best moments
            </p>
          </div>
          
          {/* Call to Action */}
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full py-3 text-lg"
              size="lg"
            >
              Get Started
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Join the community of golfers sharing their passion
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated user content
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryBar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex justify-center md:justify-end">
            <CreatePostDialog onPostCreated={() => window.location.reload()} />
          </div>
          <TrendingFeed />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
