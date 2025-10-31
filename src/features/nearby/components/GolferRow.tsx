import React from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';

interface GolferRowProps {
  golfer: {
    id: string;
    display_name: string;
    username?: string;
    home_club?: { id: string; name: string };
    avatar_url?: string;
    is_online: boolean;
    isMock: boolean;
    distanceText?: string;
    isOpenToPlay?: boolean;
    sameHomeClub?: boolean;
    handicap?: number | null;
  };
  index: number;
}

export function GolferRow({ golfer, index }: GolferRowProps) {
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isSendingPing, setIsSendingPing] = React.useState(false);
  const { toast } = useToast();

  const handleFriendRequest = () => {
    analyticsEvents.track('nearby_friend_request_clicked', { golfer_id: golfer.id, position: index });
    // TODO: Send friend request when friends system is integrated
    toast({
      title: 'Friend request',
      description: 'Friend system coming soon',
    });
  };

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

  const handlePing = async () => {
    if (isSendingPing) return;

    setIsSendingPing(true);
    analyticsEvents.track('nearby_ping_clicked', { golfer_id: golfer.id, position: index });

    try {
      const { error } = await supabase.rpc('send_user_ping', {
        p_recipient_id: golfer.id
      });

      if (error) throw error;

      toast({
        title: 'Ping sent! 👋',
        description: `${golfer.display_name} has been notified`,
      });
    } catch (error: any) {
      console.error('Error sending ping:', error);
      toast({
        title: 'Failed to send ping',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSendingPing(false);
    }
  };

  return (
    <article
      className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white"
      aria-label={`${golfer.display_name}, ${golfer.home_club?.name || 'No home club'}`}
    >
      {/* Row 1: Header - Avatar + Name/Distance + Club */}
      <div className="flex flex-row gap-3 p-3 pb-2">
        {/* Avatar block - matching shorts card style */}
        <div 
          className="relative shrink-0 w-[56px] h-[56px] rounded-[14px] overflow-hidden border border-white/30 bg-black/40 backdrop-blur-md"
          style={{
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          <img
            src={golfer.avatar_url || '/placeholder.svg'}
            alt={golfer.display_name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name + Club + Distance */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          {/* Name row with distance */}
          <div className="flex justify-between items-center gap-2 mb-0.5">
            <div className="text-[15px] font-semibold leading-tight text-white truncate">
              {golfer.display_name}
            </div>
            {golfer.distanceText && (
              <div className="text-[12px] leading-tight text-white/60 whitespace-nowrap">
                {golfer.distanceText} away
              </div>
            )}
          </div>

          {/* Home club + Handicap */}
          {(golfer.home_club || golfer.handicap !== undefined) && (
            <div className="flex items-center gap-2 text-[13px] leading-tight text-white/70 truncate">
              {golfer.home_club && (
                <span className="truncate">{golfer.home_club.name}</span>
              )}
              {golfer.handicap !== undefined && golfer.handicap !== null && (
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[11px] font-medium">
                  HCP {golfer.handicap.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Pills */}
      {(golfer.sameHomeClub || golfer.isOpenToPlay) && (
        <div className={`px-3 pb-3 ${
          golfer.sameHomeClub && golfer.isOpenToPlay ? '' : 'pl-[68px]'
        }`}>
          <div className={`flex flex-row items-center gap-2 ${
            golfer.sameHomeClub && golfer.isOpenToPlay ? 'justify-center' : 'justify-start'
          }`}>
            {golfer.sameHomeClub && (
              <span className="px-2 py-1 rounded-full text-[12px] font-medium bg-white/10 text-white/80 border border-white/20 flex items-center gap-1">
                <span className="inline-block">🏠</span>
                <span>Same home club</span>
              </span>
            )}

            {golfer.isOpenToPlay && (
              <span className="px-2 py-1 rounded-full text-[12px] font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                🟢 Open to play
              </span>
            )}
          </div>
        </div>
      )}

      {/* Row 3: Action Bar */}
      <div className="flex flex-row gap-2 border-t border-white/10 px-3 py-3">
        <button
          onClick={handleFriendRequest}
          className="flex-1 rounded-lg border border-white/25 text-white text-[13px] font-medium py-2 hover:bg-white/5 transition-colors"
        >
          Friend Request
        </button>

        <button
          onClick={handleFollow}
          className="flex-1 rounded-lg border border-white/25 text-white text-[13px] font-medium py-2 hover:bg-white/5 transition-colors"
          aria-pressed={isFollowing}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        <button
          onClick={handleMessage}
          className="flex-1 rounded-lg bg-white/10 text-white/90 text-[13px] font-medium py-2 hover:bg-white/15 transition-colors"
        >
          Message
        </button>
      </div>
    </article>
  );
}
