import React from 'react';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface GolferRowProps {
  golfer: {
    id: string;
    display_name: string;
    username?: string;
    home_club?: string;
    avatar_url?: string;
    is_online: boolean;
    isMock: boolean;
    distanceText?: string;
    isOpenToPlay?: boolean;
  };
  index: number;
}

export function GolferRow({ golfer, index }: GolferRowProps) {
  const [isFollowing, setIsFollowing] = React.useState(false);

  const handleFollow = () => {
    analyticsEvents.track('nearby_follow_clicked', { golfer_id: golfer.id, position: index });
    setIsFollowing(!isFollowing);
    // TODO: Call follow mutation
  };

  const handleMessage = () => {
    analyticsEvents.track('nearby_message_clicked', { golfer_id: golfer.id, position: index });
    // TODO: Open message composer
    console.log('Message clicked for', golfer.display_name);
  };

  return (
    <article
      className="rounded-2xl px-4 py-3 bg-neutral-800/40 border border-neutral-700/50"
      aria-label={`${golfer.display_name}, ${golfer.home_club || 'No home club'}`}
    >
      <div className="grid grid-cols-[56px_1fr] gap-3 items-center">
        {/* Avatar - spans 3 rows */}
        <div className="row-span-3 relative">
          <AvatarSquircle
            size={56}
            src={golfer.avatar_url || '/placeholder.svg'}
            alt={golfer.display_name}
          >
            {golfer.is_online && !golfer.isMock && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900"
                style={{ background: '#6e9277' }}
                aria-label="Online"
              />
            )}
          </AvatarSquircle>
        </div>

        {/* Row 1: Name */}
        <div className="flex items-center justify-between min-w-0 gap-2">
          <h3 className="font-semibold text-[16px] truncate text-neutral-100">
            {golfer.display_name}
          </h3>
        </div>

        {/* Row 2: Distance + Club */}
        <div className="flex items-center gap-2 min-w-0">
          {!golfer.isMock && golfer.distanceText && (
            <span className="text-[13px] text-neutral-400">
              {golfer.distanceText}
            </span>
          )}
          {golfer.home_club && (
            <p className="text-[13px] truncate text-neutral-400">
              {golfer.home_club}
            </p>
          )}
          {!golfer.isMock && golfer.isOpenToPlay && (
            <span className="text-xs" style={{ color: '#6e9277' }}>
              🟢 Open to play
            </span>
          )}
        </div>

        {/* Row 3: Follow/Message buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleFollow}
            className="h-7 px-3 text-xs font-semibold rounded-md transition-colors bg-neutral-700 hover:bg-neutral-600 text-neutral-200"
            aria-pressed={isFollowing}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={handleMessage}
            className="h-7 px-3 text-xs font-semibold rounded-md transition-colors bg-neutral-700 hover:bg-neutral-600 text-neutral-200"
          >
            Message
          </button>
        </div>
      </div>
    </article>
  );
}
