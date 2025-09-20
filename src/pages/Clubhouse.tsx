import React, { useState, useEffect } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import BottomNavigation from '@/components/BottomNavigation';
import ClubhouseHeaderRedesigned from '@/components/clubhouse/ClubhouseHeaderRedesigned';
import ClubhouseVerticalFeedRedesigned from '@/components/clubhouse/ClubhouseVerticalFeedRedesigned';
import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';

const Clubhouse = () => {
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteFollowedPosts();

  const [activeTab, setActiveTab] = useState('Following');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const isMobile = useIsMobile();

  // Mock data for the redesigned feed
  const mockPosts = [
    {
      id: '1',
      videoUrl: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=139&oauth2_token_id=57447761',
      user: {
        id: 'user1',
        name: 'Tiger Woods',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        homeClub: 'Augusta National Golf Club',
        handicap: 0
      },
      title: 'Classic Golf',
      description: 'Better than most! Tiger Woods iconic putt. TPC Sawgrass — 2001. This was one of the most memorable moments in golf history.',
      clubName: 'TPC Sawgrass',
      audioTrack: 'Thunderstruck • AC/DC',
      likes: 1247,
      comments: 89,
      isLiked: false,
      isSaved: false
    },
    {
      id: '2',
      videoUrl: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=139&oauth2_token_id=57447761',
      user: {
        id: 'user2',
        name: 'Rory McIlroy',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        homeClub: 'Royal County Down',
        handicap: 1
      },
      title: 'Perfect Drive',
      description: 'Crushing it down the fairway at Pebble Beach. Nothing beats the feeling of a perfect drive.',
      clubName: 'Pebble Beach Golf Links',
      audioTrack: 'Eye of the Tiger • Survivor',
      likes: 892,
      comments: 67,
      isLiked: true,
      isSaved: true
    }
  ];

  const handleLike = (postId: string) => {
    console.log('Liked post:', postId);
  };

  // Handle post change
  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
  };

  // Debug logging for Clubhouse page
  useEffect(() => {
    console.log("[DEBUG] Clubhouse page mounted, activeTab:", activeTab);
  }, [activeTab]);

  // Mark body for Clubhouse-specific CSS overrides
  useEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => document.body.classList.remove('route-clubhouse');
  }, []);

  if (isLoading) {
    return <ClubhouzLoading />;
  }

  return (
    <div className="h-screen bg-transparent overflow-hidden relative clubhouse-root" style={{
      minHeight: '100dvh',
    }}>
      <ClubhouseHeaderRedesigned activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll">
        <ClubhouseVerticalFeedRedesigned
          posts={mockPosts}
          onLike={handleLike}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onCurrentPostChange={handleCurrentPostChange}
        />
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation variant="clubhouse" />
    </div>
  );
};

export default Clubhouse;