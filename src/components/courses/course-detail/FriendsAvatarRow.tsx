/**
 * FriendsAvatarRow - Horizontal scrollable row of friend avatars
 * Used in Media tab when "From friends" filter is active
 */

import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Check } from 'lucide-react';

interface FriendWithMedia {
  id: string;
  name: string;
  avatarUrl?: string | null;
  mediaCount: number;
}

interface FriendsAvatarRowProps {
  friends: FriendWithMedia[];
  focusedFriendId: string | null;
  onFriendClick: (friendId: string) => void;
}

export function FriendsAvatarRow({ friends, focusedFriendId, onFriendClick }: FriendsAvatarRowProps) {
  if (friends.length === 0) return null;

  return (
    <div className="px-4 py-4 bg-white border-t border-b border-slate-200/60">
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {friends.map((friend) => {
          const isActive = focusedFriendId === friend.id;
          const firstName = friend.name.split(' ')[0];

          return (
            <button
              key={friend.id}
              onClick={() => onFriendClick(friend.id)}
              className={`flex flex-col items-center gap-2 min-w-[68px] transition-all ${
                isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90'
              }`}
            >
              {/* Squircle avatar with optional active ring */}
              <div className={`relative ${isActive ? 'ring-2 ring-slate-900 ring-offset-2 rounded-[34%]' : ''}`}>
                <SquircleAvatar 
                  size={56} 
                  src={friend.avatarUrl}
                  alt={friend.name}
                  thinRing
                  fallback={firstName.charAt(0)}
                />

                {/* Active checkmark overlay */}
                {isActive && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center border-2 border-white">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Friend name */}
              <span className={`text-xs font-medium text-center leading-tight max-w-[68px] truncate ${
                isActive ? 'text-slate-900' : 'text-slate-600'
              }`}>
                {firstName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
