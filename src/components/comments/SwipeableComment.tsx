import React, { useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, Reply } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface SwipeableCommentProps {
  children: React.ReactNode;
  onSwipeReply: () => void;
  onSwipeLike: () => void;
  hasLiked: boolean;
}

const THRESHOLD = 80;

export const SwipeableComment: React.FC<SwipeableCommentProps> = ({
  children,
  onSwipeReply,
  onSwipeLike,
  hasLiked,
}) => {
  const x = useMotionValue(0);
  const hapticFiredRef = useRef(false);

  // Reply icon (left reveal) — shown when swiping right
  const replyOpacity = useTransform(x, [0, 40, THRESHOLD], [0, 0.5, 1]);
  const replyScale = useTransform(x, [0, 40, THRESHOLD], [0.6, 0.8, 1.1]);

  // Like icon (right reveal) — shown when swiping left
  const likeOpacity = useTransform(x, [-THRESHOLD, -40, 0], [1, 0.5, 0]);
  const likeScale = useTransform(x, [-THRESHOLD, -40, 0], [1.1, 0.8, 0.6]);

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    const currentX = info.offset.x;
    if ((currentX > THRESHOLD || currentX < -THRESHOLD) && !hapticFiredRef.current) {
      hapticFiredRef.current = true;
      haptic('light');
    }
    if (currentX < THRESHOLD && currentX > -THRESHOLD) {
      hapticFiredRef.current = false;
    }
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    hapticFiredRef.current = false;
    const offsetX = info.offset.x;
    if (offsetX > THRESHOLD) {
      onSwipeReply();
    } else if (offsetX < -THRESHOLD) {
      onSwipeLike();
    }
  }, [onSwipeReply, onSwipeLike]);

  return (
    <div className="relative overflow-hidden">
      {/* Left reveal (reply) */}
      <motion.div
        className="absolute inset-y-0 left-0 w-20 flex items-center justify-center"
        style={{ opacity: replyOpacity }}
      >
        <motion.div style={{ scale: replyScale }}>
          <Reply className="w-5 h-5 text-blue-500" />
        </motion.div>
      </motion.div>

      {/* Right reveal (like) */}
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center"
        style={{ opacity: likeOpacity }}
      >
        <motion.div style={{ scale: likeScale }}>
          <Heart
            className="w-5 h-5 text-like"
            fill={hasLiked ? 'currentColor' : 'none'}
          />
        </motion.div>
      </motion.div>

      {/* Draggable comment */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.3}
        dragSnapToOrigin
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};
