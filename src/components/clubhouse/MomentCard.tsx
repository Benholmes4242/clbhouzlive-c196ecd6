import React, { useRef, useState, useEffect } from 'react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FollowButton from '@/components/profile/actions/FollowButton';
import { useProfileActions } from '@/components/profile/actions/useProfileActions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOptimizedVideoPlayback, useFullscreenVideoModal } from '@/hooks/useOptimizedVideoPlayback';

interface MomentCardProps {
  moment: {
    id: string;
    user: {
      id: string;
      display_name: string | null;
      username: string | null;
      profile_photo_url: string | null;
    };
    post_media: {
      id: string;
      media_type: 'image' | 'video';
      media_url: string;
    }[];
    post_tags: {
      id: string;
      entity_type: 'user' | 'golf_club' | 'business';
      name: string;
    }[];
  };
  currentUserId: string;
  modalManager: ReturnType<typeof useFullscreenVideoModal>;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, currentUserId, modalManager }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();
  const { loading, handleFollow } = useProfileActions({
    targetUserId: moment.user.id,
    currentUserId: currentUserId
  });

  // Video playback management
  const videoMedia = moment.post_media.find(media => media.media_type === 'video');
  const { videoRef, containerRef, isPlaying, shouldShowPlayIcon, togglePlayPause } = useOptimizedVideoPlayback({
    section: 'discover',
    videoId: moment.id,
    autoplayAllowed: !!videoMedia,
    priority: Date.now()
  });

  // Check follow status
  const { data: followStatus } = useQuery({
    queryKey: ['followStatus', currentUserId, moment.user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', moment.user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!currentUserId && !!moment.user.id && currentUserId !== moment.user.id,
  });

  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowing(followStatus);
    }
  }, [followStatus]);


  const imageMedia = moment.post_media.find(media => media.media_type === 'image');
  const mediaToShow = videoMedia || imageMedia;
  
  

  const handleFollowClick = async () => {
    await handleFollow(isFollowing);
    setIsFollowing(!isFollowing);
  };

  const handleProfileClick = () => {
    if (moment.user.username) {
      navigate(`/profile/${moment.user.username}`);
    }
  };

  const handleVideoClick = () => {
    if (videoMedia) {
      modalManager.openModal({
        src: videoMedia.media_url,
        user: {
          id: moment.user.id,
          profile_photo_url: moment.user.profile_photo_url || undefined,
          display_name: moment.user.display_name || undefined,
          username: moment.user.username || undefined
        },
        content: undefined // MomentCard doesn't have content
      });
    }
  };

  if (!mediaToShow) return null;

  return (
    <div ref={containerRef} className="relative bg-card rounded-xl overflow-hidden shadow-sm border group">
      {/* Media Container */}
      <div className="relative aspect-[3/4] bg-muted" onClick={handleVideoClick}>
        {videoMedia ? (
          <video
            ref={videoRef}
            src={mediaToShow.media_url}
            className="w-full h-full object-cover"
            muted={true}
            loop={true}
            playsInline={true}
            preload="metadata"
            onClick={handleVideoClick}
          />
        ) : (
          <img
            src={mediaToShow.media_url}
            alt="Moment"
            className="w-full h-full object-cover hq-image"
          />
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-3">
          {/* Top Section - User Info */}
          <div className="flex items-center gap-2">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              {moment.user.profile_photo_url ? (
                <img
                  src={moment.user.profile_photo_url}
                  alt={moment.user.display_name || moment.user.username || 'User'}
                  className="w-full h-full object-cover hq-image"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-medium">
                    {(moment.user.display_name || moment.user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p 
                className="text-white text-base font-bold truncate cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
              >
                {moment.user.display_name || moment.user.username || 'User'}
              </p>
              {moment.user.username && (
                <p 
                  className="text-white/80 text-sm truncate cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleProfileClick}
                >
                  @{moment.user.username}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Section - Follow Button */}
          <div className="space-y-2">
            
            {currentUserId !== moment.user.id && (
              <div className="flex justify-center">
                <FollowButton
                  isFollowing={isFollowing}
                  loading={loading}
                  onFollow={handleFollowClick}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentCard;