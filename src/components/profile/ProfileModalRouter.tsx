import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import SlideInModal from '@/components/ui/SlideInModal';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfileModalRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [modalKey, setModalKey] = useState(0);
  
  const isClubModal = searchParams.get('view') === 'modal' && !!searchParams.get('club');
  const courseId = searchParams.get('club') ?? '';

  // Force remount on each open to ensure smooth animation and prevent state issues
  useEffect(() => {
    if (isClubModal && courseId) {
      setModalKey(prev => prev + 1);
    }
  }, [isClubModal, courseId]);

  const onClose = useCallback(() => {
    const params = new URLSearchParams(location.search);
    params.delete('view');
    params.delete('club');
    params.delete('src');
    
    // Use replace: true to avoid navigation stack issues on mobile
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  if (!isClubModal || !courseId) {
    return null;
  }

  return (
    <SlideInModal 
      key={`modal-${courseId}-${modalKey}`}
      open={isClubModal} 
      onClose={onClose} 
      title="Golf Club"
      mobileConstrained={isMobile}
    >
      <GolfClubView courseId={courseId} isInModal={true} />
    </SlideInModal>
  );
};

export default ProfileModalRouter;