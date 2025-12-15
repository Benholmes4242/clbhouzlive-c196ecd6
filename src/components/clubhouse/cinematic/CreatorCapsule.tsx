/**
 * CreatorCapsule - Bottom-left floating creator info
 * Collapsed: Single row pill with avatar, username, course
 * Expanded: Reveals caption, follow button, profile/course links
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, MapPin, User, Flag } from 'lucide-react';

interface CreatorCapsuleProps {
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  caption?: string;
  courseName?: string;
  courseId?: string;
  isFollowing?: boolean;
  isOwnPost?: boolean;
  isVisible: boolean;
  onFollow?: () => void;
  onViewProfile?: () => void;
  onViewCourse?: () => void;
}

export const CreatorCapsule: React.FC<CreatorCapsuleProps> = ({
  user,
  caption,
  courseName,
  courseId,
  isFollowing = false,
  isOwnPost = false,
  isVisible,
  onFollow,
  onViewProfile,
  onViewCourse,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const capsuleRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    
    if (isExpanded && deltaY > 40) {
      // Swipe down when expanded: collapse
      setIsExpanded(false);
    }
    startYRef.current = null;
  }, [isExpanded]);

  const handleViewProfile = useCallback(() => {
    if (onViewProfile) {
      onViewProfile();
    } else {
      navigate(`/profile/${user.id}`);
    }
  }, [navigate, onViewProfile, user.id]);

  const handleViewCourse = useCallback(() => {
    if (onViewCourse) {
      onViewCourse();
    } else if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  }, [navigate, onViewCourse, courseId]);

  // Get initials for avatar fallback
  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  // Truncate caption for collapsed state
  const truncatedCaption = caption && caption.length > 80 
    ? `${caption.slice(0, 80)}...` 
    : caption;

  return (
    <>
      {/* Backdrop for tap-outside when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[49] bg-transparent"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Capsule Container */}
      <motion.div
        ref={capsuleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isVisible ? 1 : 0, 
          y: isVisible ? 0 : 20 
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed left-4 z-50',
          'max-w-[75vw] min-w-[200px]',
          'pointer-events-auto'
        )}
        style={{
          // Shared bottom anchor with CinematicActionRail
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <motion.div
          layout
          className={cn(
            'rounded-sq-lg overflow-hidden',
            'bg-black/50 backdrop-blur-2xl',
            'border border-white/10',
            'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          )}
        >
          {/* Collapsed State - Always visible */}
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5',
              'text-left transition-colors',
              'hover:bg-white/5'
            )}
          >
            {/* Avatar */}
            <SquircleAvatar
              size={40}
              src={user?.avatar}
              alt={user?.name ?? 'Creator'}
              fallback={initials}
              hideRing
            />

            {/* Name + Course */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-white truncate">
                  @{user?.username || user?.name?.toLowerCase().replace(/\s/g, '') || 'golfer'}
                </span>
                {courseName && (
                  <>
                    <span className="text-white/50">·</span>
                    <span className="text-[12px] text-white/70 truncate">
                      {courseName}
                    </span>
                  </>
                )}
              </div>
              
              {/* Caption preview (collapsed) */}
              {!isExpanded && caption && (
                <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
                  {truncatedCaption}
                </p>
              )}
            </div>

            {/* Expand/Collapse chevron */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronUp className="w-4 h-4 text-white/50" />
            </motion.div>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3">
                  {/* Caption (scrollable) */}
                  {caption && (
                    <div 
                      className="max-h-[100px] overflow-y-auto scrollbar-hide"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      <p className="text-[13px] leading-relaxed text-white/90">
                        {caption}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    {/* Follow button (not for own posts) */}
                    {!isOwnPost && onFollow && (
                      <Button
                        size="sm"
                        variant={isFollowing ? 'secondary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollow();
                        }}
                        className={cn(
                          'h-8 px-3 text-[12px] font-medium rounded-sq-sm',
                          isFollowing 
                            ? 'bg-white/10 text-white hover:bg-white/15' 
                            : 'bg-white text-black hover:bg-white/90'
                        )}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}

                    {/* View Profile */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProfile();
                      }}
                      className="h-8 px-3 text-[12px] font-medium rounded-sq-sm text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      Profile
                    </Button>

                    {/* View Course */}
                    {courseId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCourse();
                        }}
                        className="h-8 px-3 text-[12px] font-medium rounded-sq-sm text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <Flag className="w-3.5 h-3.5 mr-1.5" />
                        Course
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
};

export default CreatorCapsule;
