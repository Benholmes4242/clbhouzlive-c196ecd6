import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useClubhouseContent } from '@/hooks/useClubhouseContent';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import MomentCard from './MomentCard';


const ClubhouzMomentsCarousel: React.FC = () => {
  const { user } = useSupabaseSession();
  const { posts, loading } = useClubhouseContent();

  // Filter posts with video content only and valid users, then deduplicate by user
  const filteredPosts = posts.filter(post => 
    post.post_media.some(media => media.media_type === 'video') &&
    post.user.id !== user?.id // Don't show current user's posts
  );

  // Deduplicate by user - keep only the most recent post per user
  const userPostMap = new Map<string, typeof filteredPosts[0]>();
  
  filteredPosts.forEach(post => {
    const existingPost = userPostMap.get(post.user.id);
    if (!existingPost || new Date(post.created_at) > new Date(existingPost.created_at)) {
      userPostMap.set(post.user.id, post);
    }
  });

  const moments = Array.from(userPostMap.values()).slice(0, 20); // Limit for performance

  console.log('ClubhouzMomentsCarousel - moments:', moments.length);

  const { carouselRef, canScrollLeft, canScrollRight, scroll, isMobile } = useCarouselNavigation(moments.length);

  if (loading) {
    return (
      <div className="w-full py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Players You Follow & Golfers Worth Watching</h2>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 md:w-60">
                <div className="bg-muted rounded-xl aspect-[3/4] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || moments.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Players You Follow & Golfers Worth Watching</h2>
          
          {/* Desktop Navigation Arrows */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 select-none"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {moments.map((moment) => (
              <div
                key={moment.id}
                className="flex-shrink-0 w-52 md:w-60"
                style={{ scrollSnapAlign: 'start' }}
              >
                <MomentCard moment={moment} currentUserId={user.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubhouzMomentsCarousel;