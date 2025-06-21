
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';

const FriendsPage = () => {
  const { userId } = useParams<{ userId: string }>();

  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          user_id,
          friend_id,
          user_profiles!user_friends_user_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url,
            bio
          ),
          friend_profiles:user_profiles!user_friends_friend_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url,
            bio
          )
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Transform the data to get the friend profile (not the current user)
      return (data || []).map(friend => {
        const isCurrentUserTheUser = friend.user_id === userId;
        return {
          friendId: isCurrentUserTheUser ? friend.friend_id : friend.user_id,
          profile: isCurrentUserTheUser ? friend.friend_profiles : friend.user_profiles
        };
      });
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Loading friends...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <UserCheck className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>

        {friends && friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((friend) => {
              const profile = friend.profile;
              if (!profile) return null;

              return (
                <Card key={friend.friendId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={profile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                          alt={profile.display_name || profile.username || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">
                            {profile.display_name || profile.username || 'User'}
                          </h3>
                          {profile.username && (
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          )}
                          {profile.bio && (
                            <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Remove Friend
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No friends yet.
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default FriendsPage;
