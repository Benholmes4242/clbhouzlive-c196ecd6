import React from 'react';
import { Lock } from 'lucide-react';
import type { FriendshipStatus } from '@/hooks/useFriendship';

interface PrivateProfileGateProps {
  friendshipStatus: FriendshipStatus;
  onSendRequest: () => Promise<void>;
  onCancelRequest: () => Promise<void>;
  isUpdating: boolean;
}

export function PrivateProfileGate({
  friendshipStatus,
  onSendRequest,
  onCancelRequest,
  isUpdating,
}: PrivateProfileGateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Lock icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'rgba(0,0,0,0.05)' }}
      >
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>

      {/* Headline */}
      <h2 className="text-lg font-semibold text-foreground mb-2">
        This profile is private
      </h2>

      {/* Subtext */}
      <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
        {friendshipStatus === 'request_sent'
          ? "Your friend request is pending. Once accepted you'll be able to see their profile."
          : 'Send a friend request to see their reviews, top ten, and golf journey.'}
      </p>

      {/* CTA button */}
      {friendshipStatus === 'none' || friendshipStatus === 'declined' ? (
        <button
          onClick={() => onSendRequest()}
          disabled={isUpdating}
          className="h-11 px-6 rounded-xl font-semibold text-sm transition-all active:scale-[0.97]"
          style={{
            background: isUpdating ? 'rgba(247,147,30,0.5)' : '#F7931E',
            color: '#000',
            border: 'none',
            minWidth: 160,
          }}
        >
          {isUpdating ? 'Sending...' : '+ Send Friend Request'}
        </button>
      ) : friendshipStatus === 'request_sent' ? (
        <button
          onClick={() => onCancelRequest()}
          disabled={isUpdating}
          className="h-11 px-6 rounded-xl font-semibold text-sm border transition-all active:scale-[0.97]"
          style={{
            background: 'transparent',
            color: 'var(--muted-foreground)',
            borderColor: 'var(--border)',
            minWidth: 160,
          }}
        >
          {isUpdating ? 'Cancelling...' : 'Request Sent · Cancel'}
        </button>
      ) : null}
    </div>
  );
}
