import React from 'react';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';

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
    sameHomeClub?: boolean;
  };
  index: number;
}

export function GolferRow({ golfer, index }: GolferRowProps) {
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isSendingPing, setIsSendingPing] = React.useState(false);
  const { toast } = useToast();

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
    if (isSendingPing || golfer.isMock) return;

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
              <div className="lc-dot" aria-label="Online" />
            )}
          </AvatarSquircle>
        </div>

        {/* Row 1: Name */}
        <div className="flex items-center justify-between min-w-0 gap-2">
          <h3 className="font-semibold text-[16px] truncate text-neutral-100">
            {golfer.display_name}
          </h3>
        </div>

        {/* Row 2: Distance + Club + Pills */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Distance and Home Club */}
          <div className="flex items-center gap-2">
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
          </div>
          
          {/* Pills row */}
          <div className="flex items-center gap-2 flex-wrap">
            {!golfer.isMock && golfer.isOpenToPlay && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="text-[10px]">🟢</span>
                <span className="text-xs font-medium text-green-500">Open to play</span>
              </div>
            )}
            {!golfer.isMock && golfer.sameHomeClub && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <Home className="w-3 h-3 text-white/70" />
                <span className="text-xs font-medium text-white/70">Same home club</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleFollow}
            className="h-7 px-3 text-xs font-semibold rounded-md transition-colors bg-neutral-700 hover:bg-neutral-600 text-neutral-200"
            aria-pressed={isFollowing}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          
          {!golfer.isMock && golfer.isOpenToPlay ? (
            <button
              onClick={handlePing}
              disabled={isSendingPing}
              className="h-7 px-3 text-xs font-semibold rounded-md transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingPing ? 'Sending...' : 'Ping'}
            </button>
          ) : (
            <button
              onClick={handleMessage}
              className="h-7 px-3 text-xs font-semibold rounded-md transition-colors bg-neutral-700 hover:bg-neutral-600 text-neutral-200"
            >
              Message
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
