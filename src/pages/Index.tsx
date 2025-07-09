import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const Index = () => {
  const { user } = useSupabaseSession();

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
          
          {!user ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to access all features and connect with the golf community.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Discover Courses</h3>
                <p className="text-muted-foreground">
                  Explore top-rated golf courses around the world and track your favorites.
                </p>
              </div>
              
              <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Track Your Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your handicap, record rounds, and achieve golf milestones.
                </p>
              </div>
              
              <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Connect with Golfers</h3>
                <p className="text-muted-foreground">
                  Follow friends, discover new players, and share your golf journey.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Index;