
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
              src="/lovable-uploads/6d5c5a4b-fd08-4304-ab88-2a9ba8485950.png"
              alt="clbhouz"
              className="w-auto max-h-32 object-contain"
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
            <p className="text-muted-foreground text-sm">
              Welcome to your digital clubhouse for all things golf
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
