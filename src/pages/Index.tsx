
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import StoryBar from '@/components/StoryBar';
import TrendingFeed from '@/components/TrendingFeed';
import CreatePostDialog from '@/components/posts/CreatePostDialog';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const Index = () => {
  const { user } = useSupabaseSession();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryBar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {user && (
            <div className="mb-6 flex justify-center md:justify-end">
              <CreatePostDialog onPostCreated={() => window.location.reload()} />
            </div>
          )}
          <TrendingFeed />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
