import React, { useEffect, useState } from 'react';
import { MapPin, UserPlus, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface ProfileData {
  id: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
  club_name?: string;
}

interface LiquidGlassIdentityDockProps {
  userId: string;
  isVisible: boolean;
  onMorphToHeader?: () => void;
}

const LiquidGlassIdentityDock: React.FC<LiquidGlassIdentityDockProps> = ({
  userId,
  isVisible,
  onMorphToHeader
}) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useSupabaseSession();

  // Enhanced liquid glass style matching golf club tab
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(24px) saturate(1.9)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.9)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: `
      0 12px 40px 0 rgba(31, 38, 135, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1)
    `,
  };

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('id, display_name, username, profile_photo_url')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);

        // Check if following (only if user is logged in and viewing someone else's profile)
        if (session?.user?.id && session.user.id !== userId) {
          const { data: followData } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', session.user.id)
            .eq('following_id', userId)
            .single();

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, session?.user?.id]);

  const handleFollow = async () => {
    if (!session?.user?.id || !profile) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: session.user.id,
            following_id: profile.id
          });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (loading || !profile) return null;

  const isOwnProfile = session?.user?.id === userId;

  return (
    <div
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-500 cursor-pointer ${
        isVisible 
          ? 'translate-y-0 opacity-100 animate-[bounce_0.6s_ease-out]' 
          : 'translate-y-full opacity-0'
      }`}
      style={liquidGlassStyle}
      onClick={onMorphToHeader}
    >
      <div className="px-6 py-4 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Avatar - Squircle shape */}
          <Avatar className="w-14 h-14 rounded-2xl ring-2 ring-white/20">
            <AvatarImage 
              src={profile.profile_photo_url || undefined}
              alt={profile.display_name || 'User'}
              className="rounded-2xl"
            />
            <AvatarFallback className="rounded-2xl bg-white/20 text-white font-bold text-lg backdrop-blur-sm">
              {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-xl truncate">
              {profile.display_name || profile.username || 'Unknown User'}
            </div>
            {profile.username && (
              <div className="text-white/80 text-sm truncate">
                @{profile.username}
              </div>
            )}
            {profile.club_name && (
              <div className="flex items-center gap-1 text-white/75 text-sm truncate mt-1">
                <MapPin className="w-3 h-3" />
                <span>{profile.club_name}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow();
                }}
                size="sm"
                variant={isFollowing ? "secondary" : "default"}
                className="rounded-full px-4 h-9 text-xs font-medium bg-white/20 hover:bg-white/30 border-white/30 text-white"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>

              <Button
                onClick={(e) => e.stopPropagation()}
                size="sm"
                variant="outline"
                className="rounded-full px-4 h-9 text-xs font-medium text-white border-white/30 hover:bg-white/20 bg-white/10"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Message
              </Button>

              <Button
                onClick={(e) => e.stopPropagation()}
                size="sm"
                variant="ghost"
                className="rounded-full w-9 h-9 p-0 text-white/80 hover:text-white hover:bg-white/20"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassIdentityDock;