import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnimatedModalRouterProps {
  onExitComplete?: () => void;
}

const AnimatedModalRouter: React.FC<AnimatedModalRouterProps> = ({ onExitComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isMobile = useIsMobile();
  
  const courseId = params.id;
  const isModalOpen = !!courseId;

  const closeModal = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Escape key handler
  useEffect(() => {
    if (!isModalOpen) return;
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen, closeModal]);

  // Body scroll lock
  useEffect(() => {
    if (isModalOpen && isMobile) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen, isMobile]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        // Clean up any remaining state after animation completes
        if (onExitComplete) {
          onExitComplete();
        }
        
        // Additional cleanup for mobile
        if (isMobile) {
          document.body.style.overflow = '';
          // Remove any stuck focus or audio locks
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
        }
      }}
    >
      {isModalOpen && courseId && (
        <motion.div
          key={`course-modal-${courseId}`} // Ensure fresh mount per course
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ 
            type: 'tween', 
            duration: 0.25,
            ease: 'easeInOut'
          }}
          className="fixed inset-0 z-[1000] flex"
        >
          {/* Backdrop - must mount/unmount with modal */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Modal Content */}
          <div className={`relative ${
            isMobile 
              ? 'w-full h-full' 
              : 'w-full max-w-4xl ml-auto h-full'
          } bg-background flex flex-col`}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Golf Club
                </h2>
                <button
                  onClick={closeModal}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted focus:outline-none focus:ring-0"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto">
              <GolfClubView courseId={courseId} isInModal={true} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModalRouter;