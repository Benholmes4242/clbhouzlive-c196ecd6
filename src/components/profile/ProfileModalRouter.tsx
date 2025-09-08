import React, { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUI } from '@/contexts/UIContext';

const ProfileModalRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { modalTransition, beginTransition, endTransition } = useUI();
  
  const isClubModal = searchParams.get('view') === 'modal' && !!searchParams.get('club');
  const courseId = searchParams.get('club') ?? '';

  const onClose = useCallback(() => {
    // Shared guard: prevents double-close / re-entrancy
    if (modalTransition.inProgress) return;
    beginTransition('close');
    
    const params = new URLSearchParams(location.search);
    params.delete('view');
    params.delete('club');
    params.delete('src');
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [modalTransition.inProgress, beginTransition, navigate, location.pathname, location.search]);

  // Comprehensive cleanup on unmount and whenever modal state changes
  useEffect(() => {
    if (isClubModal) {
      // Lock body scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !modalTransition.inProgress) {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        // Cleanup on unmount or state change
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isClubModal, onClose, modalTransition.inProgress]);

  // IMPORTANT: this is the single source of truth for "transition ended"
  const handleExitComplete = useCallback(() => {
    // Ensure body scroll is unlocked
    document.body.style.overflow = '';
    
    // Release any focus traps
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    
    // Reset transition guard - this is the canonical end signal
    endTransition();
  }, [endTransition]);

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isClubModal && courseId && (
        <motion.div
          key={`modal-${courseId}`}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className={`
            fixed z-[1000] flex
            ${isMobile 
              ? 'top-0 left-0 right-0 bottom-16' 
              : 'inset-0'
            }
          `}
        >
          {/* Backdrop - blocks all background interaction but excludes navbar */}
          <button
            aria-label="Close modal"
            onClick={onClose}
            className={`
              fixed bg-black/50 cursor-default
              ${isMobile 
                ? 'top-0 left-0 right-0' 
                : 'inset-0'
              }
            `}
            style={isMobile ? { bottom: '64px' } : {}}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
          
          {/* Modal Panel */}
          <div 
            className={`
              fixed right-0 bg-background shadow-2xl z-10
              ${isMobile 
                ? 'w-full top-0 bottom-16' 
                : 'inset-y-0 w-[90vw] max-w-[860px] rounded-l-2xl'
              }
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="h-full overflow-hidden flex flex-col relative">
              {/* Liquid Glass Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 focus:outline-none"
                aria-label="Close modal"
              >
                <span className="text-white text-lg font-bold">✕</span>
              </button>
              
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