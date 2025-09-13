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

interface ImmersiveIdentityDockProps {
  userId: string;
  isVisible: boolean;
  onMorphToHeader?: () => void;
}

const ImmersiveIdentityDock: React.FC<ImmersiveIdentityDockProps> = ({
  userId,
  isVisible,
  onMorphToHeader
}) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useSupabaseSession();

  // Enhanced liquid glass styling - match golf club tab pull style
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.4), 0 8px 32px -8px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
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
      className={`fixed bottom-12 left-0 right-0 z-30 flex justify-center transition-all duration-700 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100 animate-[bounce_0.8s_ease-out_0.3s_both]' 
          : 'translate-y-full opacity-0'
      }`}
    >
      <div
        style={liquidGlassStyle}
        onClick={onMorphToHeader}
        className="flex-shrink-0"
      >
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Avatar - smaller size */}
            <Avatar className="w-14 h-14 rounded-full">
              <AvatarImage 
                src={profile.profile_photo_url || undefined}
                alt={profile.display_name || 'User'}
              />
              <AvatarFallback className="rounded-full bg-primary/20 text-primary font-semibold text-lg">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info - smaller text */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-lg truncate">
                {profile.display_name || profile.username || 'Unknown User'}
              </div>
              {profile.username && (
                <div className="text-white/70 text-xs truncate">
                  @{profile.username}
                </div>
              )}
              {profile.club_name && (
                <div className="flex items-center gap-1 text-white/80 text-xs truncate">
                  <MapPin className="w-3 h-3" />
                  <span>{profile.club_name}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleFollow}
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  className="rounded-full px-3 h-7 text-xs font-medium"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 h-7 text-xs font-medium text-white border-white/30 hover:bg-white/10"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-7 h-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImmersiveIdentityDock;