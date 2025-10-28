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
      className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white"
      aria-label={`${golfer.display_name}, ${golfer.home_club || 'No home club'}`}
    >
      {/* Row 1: Header - Avatar + Name + Club */}
      <div className="flex flex-row gap-3 p-3 pb-2">
        {/* Avatar block */}
        <div className="relative shrink-0">
          <img
            src={golfer.avatar_url || '/placeholder.svg'}
            alt={golfer.display_name}
            className="h-14 w-14 rounded-full object-cover"
          />
          {golfer.is_online && !golfer.isMock && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-black" />
          )}
        </div>

        {/* Name + Club */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="text-[15px] font-semibold leading-tight text-white truncate">
            {golfer.display_name}
          </div>

          {golfer.home_club && (
            <div className="text-[13px] leading-tight text-white/70 truncate">
              {golfer.home_club}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Meta / Status */}
      <div className="px-3 pb-3">
        {/* Pills row */}
        <div className="flex flex-row flex-wrap items-center gap-2 mb-1">
          {golfer.isOpenToPlay && !golfer.isMock && (
            <span className="px-2 py-1 rounded-full text-[12px] font-medium bg-green-500/15 text-green-400 border border-green-500/30">
              🟢 Open to play
            </span>
          )}

          {golfer.sameHomeClub && (
            <span className="px-2 py-1 rounded-full text-[12px] font-medium bg-white/10 text-white/80 border border-white/20 flex items-center gap-1">
              <Home className="inline-block w-3 h-3" />
              <span>Same home club</span>
            </span>
          )}
        </div>

        {/* Distance line */}
        {golfer.distanceText && (
          <div className="text-[12px] leading-tight text-white/50">
            {golfer.distanceText} away
          </div>
        )}
      </div>

      {/* Row 3: Action Bar */}
      <div className="flex flex-row gap-2 border-t border-white/10 px-3 py-3">
        <button
          onClick={handleFollow}
          className="flex-1 rounded-lg border border-white/25 text-white text-[13px] font-medium py-2 hover:bg-white/5 transition-colors"
          aria-pressed={isFollowing}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>

        <button
          onClick={handleMessage}
          disabled={golfer.isMock}
          className="flex-1 rounded-lg bg-white/10 text-white/90 text-[13px] font-medium py-2 hover:bg-white/15 transition-colors disabled:opacity-50"
        >
          Message
        </button>
      </div>
    </article>
  );
}
