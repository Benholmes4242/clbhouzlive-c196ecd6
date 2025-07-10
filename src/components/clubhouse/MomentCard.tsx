import React, { useRef, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FollowButton from '@/components/profile/actions/FollowButton';
import { useProfileActions } from '@/components/profile/actions/useProfileActions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, currentUserId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const { loading, handleFollow } = useProfileActions({
    targetUserId: moment.user.id,
    currentUserId: currentUserId
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

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      
      const playVideo = async () => {
        try {
          await video.play();
        } catch (error) {
          console.log('Video autoplay failed:', error);
        }
      };
      
      playVideo();
    }
  }, []);

  const videoMedia = moment.post_media.find(media => media.media_type === 'video');
  const imageMedia = moment.post_media.find(media => media.media_type === 'image');
  const mediaToShow = videoMedia || imageMedia;
  
  const golfCourseTag = moment.post_tags.find(tag => tag.entity_type === 'golf_club');

  const handleFollowClick = async () => {
    await handleFollow(isFollowing);
    setIsFollowing(!isFollowing);
  };

  if (!mediaToShow) return null;

  return (
    <div className="relative bg-card rounded-xl overflow-hidden shadow-sm border group">
      {/* Media Container */}
      <div className="relative aspect-[3/4] bg-muted">
        {videoMedia ? (
          <video
            ref={videoRef}
            src={mediaToShow.media_url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
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
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border-2 border-white/20">
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
              <p className="text-white text-sm font-medium truncate">
                {moment.user.display_name || moment.user.username || 'User'}
              </p>
              {moment.user.username && (
                <p className="text-white/80 text-xs truncate">
                  @{moment.user.username}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Section - Golf Course Tag & Follow Button */}
          <div className="space-y-2">
            {golfCourseTag && (
              <div className="flex justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="bg-black/60 text-white rounded-full px-3 py-1.5 text-xs font-medium cursor-default max-w-[160px] truncate">
                        {golfCourseTag.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top"
                      className="hidden md:block bg-gray-900 text-white border-gray-700 shadow-lg rounded-md px-2 py-1 text-xs max-w-[200px] z-[300]"
                    >
                      {golfCourseTag.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            
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