import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useFollow } from '@/hooks/useFollow';
import { usePrefetchImmersiveProfile } from '@/hooks/usePrefetchImmersiveProfile';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Check, UserPlus } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from 'sonner';
import { NotInterested } from '@/stores/notInterested';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';

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
  onLabelClick?: (userId: string) => void;
  imageLoaded: boolean;
  onImageLoad: () => void;
};

const AVATAR = { size: 72, radius: 14 };

export default function Squircle({ creator, index, onAvatarClick, onLabelClick, imageLoaded, onImageLoad }: Props) {
  const { isFollowing, busy, toggle, ensureInitial } = useFollow(creator.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const cellRef = useRef<HTMLDivElement>(null);
  const { prefetch } = usePrefetchImmersiveProfile();
  const { prefetchHandlers } = useProfilePrefetch(creator.id);

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
    if (onLabelClick) {
      onLabelClick(creator.id);
    } else {
      navigate(`/user/${creator.username}`);
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = isFollowing === 'following' ? false : true;
    analyticsEvents.shortsSquircle.followToggle(creator.id, newState, index);
    await toggle();
  };

  const handleNotInterested = () => {
    NotInterested.add(creator.id, 30);
    toast.success('Hidden for 30 days');
    setMenuOpen(false);
    window.location.reload();
  };

  const handleCopyProfileLink = () => {
    if (!creator.username) return;
    const url = `${window.location.origin}/user/${creator.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
    setMenuOpen(false);
  };

  const name = creator.display_name || creator.username || 'Creator';
  const initials = name.slice(0, 2).toUpperCase();
  const hasRecentPost = creator.has_recent_post && !JSON.parse(localStorage.getItem('seenCreatorImmersiveIds') || '[]').includes(creator.id);

  return (
    <>
      <div ref={cellRef} className="sq-cell">
        {/* Ring wrapper with optional recent-post gradient */}
        <div className={`sq-ring sq-focusable ${hasRecentPost ? 'animate-pulse' : ''}`}>
          <button
            className="relative w-full h-full bg-transparent"
            onClick={handleAvatarClick}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
            aria-label={`View ${name}'s profile`}
          >
            <SquircleAvatar
              size={AVATAR.size}
              src={creator.profile_photo_url || ''}
              alt={name}
              className={`sq-img ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={onImageLoad}
              fallback={initials}
            />
          </button>
        </div>

        <button
          onClick={handleNameClick}
          className="sq-name hover:opacity-70 transition-opacity"
          title={name}
        >
          {name}
        </button>
      </div>

      {/* Bottom sheet menu */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} ariaLabelledBy={`menu-${creator.id}`}>
        <div className="flex flex-col p-4">
          <h3 id={`menu-${creator.id}`} className="text-lg font-semibold mb-4">{name}</h3>
          <SheetItem 
            label="View Profile" 
            onClick={() => { setMenuOpen(false); handleAvatarClick(); }}
            onMouseEnter={prefetchHandlers.onMouseEnter}
            onTouchStart={prefetchHandlers.onTouchStart}
          />
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

function SheetItem({ 
  label, 
  onClick,
  onMouseEnter,
  onTouchStart,
}: { 
  label: string; 
  onClick: () => void;
  onMouseEnter?: () => void;
  onTouchStart?: () => void;
}) {
  return (
    <button
      className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
    >
      {label}
    </button>
  );
}
