import React, { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import DiscoverVerticalFeed from "@/components/discover/DiscoverVerticalFeed";
import { useProfileMedia } from "@/hooks/useProfileMedia";
import { ExploreContentItem } from "@/components/explore/types";
import ClubhouzLoading from "@/components/ClubhouzLoading";

type Props = {
  profileId?: string;        // falls back to route param
  startIndex?: number;       // optional initial media index
  autoplay?: boolean;        // default true
  mute?: boolean;            // default true
};

// Adapter to convert ProfileMediaItem to ExploreContentItem
const adaptProfileMediaToExplore = (mediaItems: any[]): ExploreContentItem[] => {
  return mediaItems.map((item) => ({
    id: item.id,
    type: item.media_type === 'video' ? 'video' : 'image',
    src: item.media_url,
    title: item.file_name || `${item.media_type} content`,
    likes: 0, // Profile media doesn't have likes
    duration: item.media_type === 'video' ? `${Math.floor(item.duration / 1000)}s` : undefined,
    user: {
      id: item.user_id,
      name: 'Profile Owner', // Will be enhanced with actual profile data
      username: '',
      avatar: '/placeholder-avatar.png',
    },
    media: [{
      id: item.id,
      media_type: item.media_type,
      media_url: item.media_url,
    }]
  }));
};

export default function ImmersiveDiscoverScreen({
  profileId,
  startIndex = 0,
  autoplay = true,
  mute = true,
}: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get profileId from props, params, or search params
  const id = profileId ?? params?.profileId ?? searchParams.get('profileId');
  
  // Get query params
  const queryIndex = searchParams.get('index') ? parseInt(searchParams.get('index')!) : startIndex;
  const queryAutoplay = searchParams.get('autoplay') === '1' ? true : autoplay;
  const queryMute = searchParams.get('mute') === '1' ? true : mute;
  
  const { mediaItems, loading, error } = useProfileMedia(id || '');

  // Convert profile media to explore content format
  const exploreItems = useMemo(() => {
    return adaptProfileMediaToExplore(mediaItems);
  }, [mediaItems]);

  // Find initial item based on index
  const initialItem = useMemo(() => {
    return exploreItems[queryIndex] || exploreItems[0];
  }, [exploreItems, queryIndex]);

  // Handle close - navigate back
  const handleClose = () => {
    navigate(-1);
  };

  // Handle like (no-op for profile media)
  const handleLike = (contentId: string) => {
    // Profile media doesn't support likes
    console.log('Like attempted on profile media:', contentId);
  };

  // Handle load more (no-op for profile media)
  const handleLoadMore = () => {
    // Profile media loads all at once
  };

  // Analytics tracking
  const handleScroll = (direction: 'up' | 'down') => {
    // Track immersive scroll events
    console.log('Immersive scroll:', direction);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <ClubhouzLoading />
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg mb-4">Unable to load immersive content</p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (exploreItems.length === 0) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg mb-4">No immersive media available</p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black" data-immersive-modal="true">
      <DiscoverVerticalFeed
        isOpen={true}
        onClose={handleClose}
        posts={exploreItems}
        onLike={handleLike}
        onLoadMore={handleLoadMore}
        hasMore={false} // Profile media doesn't paginate
        isLoadingMore={false}
        onScroll={handleScroll}
        initialItem={initialItem}
        initialMediaIndex={0}
      />
    </div>
  );
}