import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfileModalRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [modalKey, setModalKey] = useState(0);
  const isTransitioning = useRef(false);
  
  const isClubModal = searchParams.get('view') === 'modal' && !!searchParams.get('club');
  const courseId = searchParams.get('club') ?? '';

  // Force remount on each open to ensure smooth animation and prevent state issues
  useEffect(() => {
    if (isClubModal && courseId) {
      setModalKey(prev => prev + 1);
      isTransitioning.current = false; // Reset transition guard
    }
  }, [isClubModal, courseId]);

  const onClose = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    
    const params = new URLSearchParams(location.search);
    params.delete('view');
    params.delete('club');
    params.delete('src');
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  // Comprehensive cleanup on unmount and whenever modal state changes
  useEffect(() => {
    if (isClubModal) {
      // Lock body scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isTransitioning.current) {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        // Cleanup on unmount or state change
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        isTransitioning.current = false;
      };
    }
  }, [isClubModal, onClose]);

  // Final cleanup handler for AnimatePresence
  const handleExitComplete = useCallback(() => {
    // Ensure body scroll is unlocked
    document.body.style.overflow = '';
    
    // Release any focus traps
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    
    // Reset transition guard
    isTransitioning.current = false;
    
    // Reset modal key for next open
    setModalKey(0);
  }, []);

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isClubModal && courseId && (
        <motion.div
          key={`modal-${courseId}-${modalKey}`}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className="fixed inset-0 z-[1000] flex"
        >
          {/* Backdrop - unmounts with modal */}
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 cursor-default"
            style={{ pointerEvents: "auto" }}
          />
          
          {/* Modal Panel */}
          <div className={`
            absolute inset-y-0 right-0 w-full bg-background shadow-2xl
            ${isMobile 
              ? 'w-full' 
              : 'w-[90vw] max-w-[860px] rounded-l-2xl'
            }
          `}>
            <div className="h-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-background">
                <h2 className="text-xl sm:text-2xl font-bold">Golf Club</h2>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto">
                <GolfClubView courseId={courseId} isInModal={true} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModalRouter;