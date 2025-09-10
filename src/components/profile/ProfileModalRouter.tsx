import React, { useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import GolfClubView from '@/components/golf-club/GolfClubView';
import SlideOver from '@/components/ui/slide-over';
import { useUI } from '@/contexts/UIContext';

const ProfileModalRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  // Handle transition end
  const handleSlideOverClose = useCallback(() => {
    endTransition();
  }, [endTransition]);

  return (
    <SlideOver
      isOpen={isClubModal && !!courseId}
      onClose={onClose}
      width="w-full md:w-[560px] lg:w-[640px]"
      zIndex={1000}
      heightClass="max-h-[78vh] h-auto mt-6 mb-6 rounded-2xl"
      closeOnBackdrop={!modalTransition.inProgress}
      closeOnEscape={!modalTransition.inProgress}
      ariaLabel="course details"
    >
      <div className="h-full overflow-hidden flex flex-col relative">
        {/* Liquid Glass Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-200 focus:outline-none"
          aria-label="Close modal"
        >
          <span className="text-white text-base font-bold leading-none flex items-center justify-center w-full h-full">✕</span>
        </button>
        
        {/* Portal target for lightbox modals - positioned with proper z-index */}
        <div id="modal-portal" className="relative z-[1001]" />
        
        {/* Content */}
        <div className="flex-1 overflow-auto relative">
          {courseId && <GolfClubView courseId={courseId} isInModal={true} />}
        </div>
      </div>
    </SlideOver>
  );
};

export default ProfileModalRouter;