import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '@/components/ui/BottomSheet';
import { useFollow } from '@/hooks/useFollow';
import { usePrefetchImmersiveProfile } from '@/hooks/usePrefetchImmersiveProfile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, UserPlus } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from 'sonner';
import { NotInterested } from '@/stores/notInterested';

type Creator = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  has_recent_post?: boolean;
};

type Props = {
  creator: Creator;
  index: number;
  onAvatarClick: (userId: string) => void;
  imageLoaded: boolean;
  onImageLoad: () => void;
};

const AVATAR = { size: 72, radius: 14 };

export default function Squircle({ creator, index, onAvatarClick, imageLoaded, onImageLoad }: Props) {
  const { isFollowing, busy, toggle, ensureInitial } = useFollow(creator.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const cellRef = useRef<HTMLDivElement>(null);
  const { prefetch } = usePrefetchImmersiveProfile();

  useEffect(() => { ensureInitial(); }, [ensureInitial]);

  // Prefetch when squircle is ~80% visible
  useEffect(() => {
    if (!cellRef.current) return;
    const el = cellRef.current;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
        prefetch(creator.id);
        io.disconnect();
      }
    }, { threshold: [0.8] });
    io.observe(el);
    return () => io.disconnect();
  }, [creator.id, prefetch]);

  // long-press detection
  let pressTimer: number | undefined;
  const startPress = () => { pressTimer = window.setTimeout(() => setMenuOpen(true), 450); };
  const endPress = () => { if (pressTimer) window.clearTimeout(pressTimer); };

  const handleAvatarClick = () => {
    analyticsEvents.shortsSquircle.avatarClick(creator.id, index);
    
    // Mark as seen in localStorage
    const seenIds = JSON.parse(localStorage.getItem('seenCreatorImmersiveIds') || '[]');
    if (!seenIds.includes(creator.id)) {
      localStorage.setItem('seenCreatorImmersiveIds', JSON.stringify([...seenIds, creator.id]));
    }
    
    onAvatarClick(creator.id);
  };

  const handleNameClick = () => {
    if (!creator.username) return;
    analyticsEvents.shortsSquircle.nameClick(creator.username, index);
    navigate(`/user/${creator.username}`);
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = isFollowing === 'following' ? false : true;
    analyticsEvents.shortsSquircle.followToggle(creator.id, newState, index);
    await toggle();
  };

  const handleNotInterested = () => {
    NotInterested.add(creator.id, 30);
    toast.success(`Hidden ${creator.display_name || creator.username || 'this creator'} for 30 days`);
    setMenuOpen(false);
    window.location.reload();
  };

  const handleCopyProfileLink = () => {
    if (!creator.username) return;
    const url = `${window.location.origin}/user/${creator.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
    setMenuOpen(false);
  };

  const name = creator.display_name || creator.username || 'Creator';
  const initials = name.slice(0, 2).toUpperCase();
  const hasRecentPost = creator.has_recent_post && !JSON.parse(localStorage.getItem('seenCreatorImmersiveIds') || '[]').includes(creator.id);

  return (
    <>
      <div ref={cellRef} className="flex flex-col items-center flex-shrink-0 relative group">
        {/* Avatar with ring for recent posts */}
        <div className="relative">
          {hasRecentPost && (
            <div 
              className="absolute -inset-[2px] rounded-[16px] bg-gradient-to-tr from-primary via-primary/70 to-primary/40 animate-pulse"
              style={{ borderRadius: AVATAR.radius + 2 }}
            />
          )}
          <button
            className="relative overflow-hidden border border-border shadow-sm bg-background active:scale-[0.96] transition-all"
            onClick={handleAvatarClick}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
            aria-label={`View ${name}'s profile`}
            style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
          >
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage
                src={creator.profile_photo_url || undefined}
                alt={name}
                className={`object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={onImageLoad}
              />
              <AvatarFallback className="rounded-none text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Follow/Following button */}
            <button
              onClick={handleFollowToggle}
              disabled={busy}
              className={`absolute bottom-1 right-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all shadow-sm ${
                isFollowing === 'following'
                  ? 'bg-muted/90 text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
              role="button"
              aria-pressed={isFollowing === 'following'}
            >
              {isFollowing === 'following' ? (
                <Check className="w-3 h-3" />
              ) : (
                <UserPlus className="w-3 h-3" />
              )}
            </button>
          </button>
        </div>

        <button
          onClick={handleNameClick}
          className="text-xs text-foreground mt-1 truncate w-[70px] text-center hover:text-primary transition-colors"
          title={name}
        >
          {name}
        </button>
      </div>

      {/* Bottom sheet menu */}
      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title={name}>
        <div className="flex flex-col">
          <SheetItem label="View Profile" onClick={() => { setMenuOpen(false); handleAvatarClick(); }} />
          <SheetItem 
            label={isFollowing === 'following' ? 'Unfollow' : 'Follow'} 
            onClick={async () => { setMenuOpen(false); await toggle(); }} 
          />
          <SheetItem label="Not Interested" onClick={handleNotInterested} />
          <SheetItem label="Copy Profile Link" onClick={handleCopyProfileLink} />
        </div>
      </BottomSheet>
    </>
  );
}

function SheetItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
