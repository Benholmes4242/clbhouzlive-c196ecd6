import React, { useState, useEffect, useRef } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X } from 'lucide-react';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import FriendProfileContent from './FriendProfileContent';

interface Props {
  friends: FriendLeaderboardEntry[];
  startIndex: number;
  ownerUserId: string;
  open: boolean;
  onClose: () => void;
}

export const FriendProfileSheet: React.FC<Props> = ({
  friends,
  startIndex,
  ownerUserId,
  open,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setCurrentIndex(startIndex);
  }, [open, startIndex]);

  const currentFriend = friends[currentIndex];
  const prevFriend = friends[currentIndex - 1];
  const nextFriend = friends[currentIndex + 1];

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current == null || touchStartYRef.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    const SWIPE_THRESHOLD = 50;
    // Only treat as horizontal swipe if x dominates y (avoid hijacking vertical scroll/dismiss)
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && currentIndex < friends.length - 1) {
        setCurrentIndex(i => i + 1);
      } else if (dx > 0 && currentIndex > 0) {
        setCurrentIndex(i => i - 1);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!currentFriend) return null;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            zIndex: 80,
          }}
        />
        <DrawerPrimitive.Content
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 81,
            background: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '88vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Geist", system-ui, sans-serif',
          }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {currentFriend.friend_name}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Friend profile
          </DrawerPrimitive.Description>

          {/* Drag handle */}
          <div aria-hidden style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.15)' }} />
          </div>

          {/* Position indicator */}
          {friends.length > 1 && (
            <div style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontWeight: 800,
              color: 'rgba(15,23,42,0.40)',
              letterSpacing: '0.10em',
              pointerEvents: 'none',
            }}>
              {currentIndex + 1} / {friends.length}
            </div>
          )}

          {/* Close button */}
          <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(15,23,42,0.06)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color="#0F172A" strokeWidth={2.4} />
            </button>
          </div>

          {/* Carousel content area */}
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <FriendProfileContent
              key={currentFriend.friend_passport_id ?? currentFriend.friend_name}
              friend={currentFriend}
              ownerUserId={ownerUserId}
            />
            {/* Pre-fetch neighbors (data-only, no DOM) */}
            {prevFriend && (
              <FriendProfileContent
                key={`pf-prev-${prevFriend.friend_passport_id ?? prevFriend.friend_name}`}
                friend={prevFriend}
                ownerUserId={ownerUserId}
                prefetchOnly
              />
            )}
            {nextFriend && (
              <FriendProfileContent
                key={`pf-next-${nextFriend.friend_passport_id ?? nextFriend.friend_name}`}
                friend={nextFriend}
                ownerUserId={ownerUserId}
                prefetchOnly
              />
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default FriendProfileSheet;
