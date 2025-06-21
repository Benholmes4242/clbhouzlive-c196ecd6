
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface Friend {
  friend_id: string;
  user_profiles: {
    id: string;
    display_name?: string;
    username?: string;
    profile_photo_url?: string;
  };
}

interface FriendSelectorProps {
  friends: Friend[];
  selectedFriendId: string;
  onFriendSelect: (friendId: string) => void;
}

const FriendSelector: React.FC<FriendSelectorProps> = ({
  friends,
  selectedFriendId,
  onFriendSelect
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select a Friend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedFriendId} onValueChange={onFriendSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a friend to view their courses" />
          </SelectTrigger>
          <SelectContent>
            {friends.map((friend) => (
              <SelectItem key={friend.friend_id} value={friend.friend_id}>
                <div className="flex items-center gap-2">
                  {friend.user_profiles?.profile_photo_url && (
                    <img 
                      src={friend.user_profiles.profile_photo_url} 
                      alt={friend.user_profiles.display_name || friend.user_profiles.username || 'Friend'}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span>
                    {friend.user_profiles?.display_name || friend.user_profiles?.username || 'Friend'}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default FriendSelector;
