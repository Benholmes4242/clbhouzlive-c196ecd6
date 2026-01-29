/**
 * FullscreenComments - Comments drawer for fullscreen viewer
 * 
 * Pull-up drawer with drag-to-close gesture.
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { CommentingAsIndicator } from '@/components/comments/CommentingAsIndicator';

export interface FullscreenCommentsProps {
  className?: string;
}

export const FullscreenComments: React.FC<FullscreenCommentsProps> = ({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const { currentItem, commentsOpen, setCommentsOpen } = viewer;

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    // If dragged down more than 100px, close
    if (info.offset.y > 100) {
      setCommentsOpen(false);
    }
  }, [setCommentsOpen]);

  const handleClose = useCallback(() => {
    setCommentsOpen(false);
  }, [setCommentsOpen]);

  if (!currentItem) return null;

  return (
    <>
      {/* Trigger area at bottom - can be pulled up */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 z-30"
        onClick={() => setCommentsOpen(true)}
        style={{ touchAction: 'none' }}
      />

      {/* Comments drawer */}
      <AnimatePresence>
        {commentsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Drawer */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50"
              style={{ top: '30%' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted rounded-full" />
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="px-4 py-2 border-b">
                <h3 className="text-lg font-semibold text-center">
                  {currentItem.commentCount} Comments
                </h3>
              </div>

              {/* Comments content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Placeholder - will integrate with existing CommentsPanel */}
                <div className="text-center text-muted-foreground py-8">
                  Comments will appear here
                </div>
              </div>

              {/* Comment input */}
              <div className="border-t p-4 pb-safe">
                {/* CommentingAsIndicator - Shows when acting as business */}
                <CommentingAsIndicator isDark className="mb-2" />
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 rounded-full bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium">
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FullscreenComments;
