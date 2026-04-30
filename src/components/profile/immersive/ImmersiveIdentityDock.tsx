import React, { useEffect, useState } from 'react';
import { MapPin, UserPlus, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Squircle } from '@/components/ui/squircle';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';


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
  const [loading, setLoading] = useState(true);
  const { session } = useSupabaseSession();
  const viewerId = session?.user?.id;

  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: userId,
    viewerActorType: 'personal',
    viewerActorId: viewerId,
  });
  const isFollowing = cached ?? false;
  const toggle = useToggleFollow();

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
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('id, display_name, username, profile_photo_url')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleFollow = () => {
    if (!viewerId || !profile) return;
    toggle.mutate({
      targetActorType: 'personal',
      targetActorId: profile.id,
      targetUserId: profile.id,
      viewerActorType: 'personal',
      viewerActorId: viewerId,
      viewerUserId: viewerId,
      isFollowing,
    });
  };

  if (loading || !profile) return null;

  const isOwnProfile = viewerId === userId;

  return (
    <div
      className={`fixed left-0 right-0 z-30 flex justify-center transition-all duration-700 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100 animate-[bounce_0.8s_ease-out_0.3s_both]' 
          : 'translate-y-full opacity-0'
      }`}
      style={{ bottom: 'calc(var(--bottom-nav-height) + 52px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        style={liquidGlassStyle}
        onClick={onMorphToHeader}
        className="flex-shrink-0"
      >
        <div className="px-4 py-1">
          <div className="flex items-center gap-2">
            {/* Avatar - smaller size */}
            <Squircle width={56} height={56}>
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt={profile.display_name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '22px', fontWeight: 600 }}>
                  {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </Squircle>

            {/* Profile Info - brought closer with reduced spacing */}
            <div className="flex-1 min-w-0 -ml-1">
              <div className="text-white font-bold text-lg truncate leading-tight">
                {profile.display_name || profile.username || 'Unknown User'}
              </div>
              {profile.username && (
                <div className="text-white/70 text-xs truncate -mt-0.5">
                  @{profile.username}
                </div>
              )}
              {profile.club_name && (
                <div className="flex items-center gap-1 text-white/80 text-xs truncate -mt-0.5">
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
                  disabled={toggle.isPending}
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
