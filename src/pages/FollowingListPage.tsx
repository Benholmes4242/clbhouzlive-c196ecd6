import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileSocialButtons } from '@/components/profile/actions/ProfileSocialButtons';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface FollowingProfile {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  eg_handicap_index: number | null;
}

const FollowingListPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  // First, resolve username to user ID
  const { data: profileData } = useQuery({
    queryKey: ['profile-by-username', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username
  });

  // Fetch following list
  const { data: following, isLoading } = useQuery({
    queryKey: ['following-list', profileData?.id],
    enabled: !!profileData?.id,
    queryFn: async (): Promise<FollowingProfile[]> => {
      if (!profileData?.id) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          user_profiles!user_follows_following_id_fkey (
            id,
            username,
            display_name,
            profile_photo_url,
            home_club,
            eg_handicap_index
          )
        `)
        .eq('follower_id', profileData.id);

      if (error) throw error;

      return (data || [])
        .map((row: any) => row.user_profiles)
        .filter(Boolean) as FollowingProfile[];
    }
  });

  if (isLoading || !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-heading-lg font-semibold">Following</h1>
            <p className="text-body-sm text-muted-foreground">@{profileData.username}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto">
        {following && following.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Not following anyone yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {following?.map((user) => (
              <div key={user.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={user.profile_photo_url || ''} />
                    <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/profile/${user.username}`)}
                      >
                        <p className="text-body-lg font-semibold truncate">
                          {user.display_name}
                        </p>
                        <p className="text-body-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>

                      {/* Social actions if not own profile */}
                      {user?.id !== user.id && (
                        <div className="flex-shrink-0">
                          <ProfileSocialButtons
                            currentUserId={user?.id || ''}
                            profileUserId={user.id}
                          />
                        </div>
                      )}
                    </div>

                    {/* Home club & handicap */}
                    <div className="flex gap-2 mt-1 text-body-sm text-muted-foreground">
                      {user.home_club && <span>{user.home_club}</span>}
                      {user.eg_handicap_index !== null && (
                        <span>• HCP {user.eg_handicap_index.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingListPage;
