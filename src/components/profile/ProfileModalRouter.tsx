import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import SlideInModal from '@/components/ui/SlideInModal';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfileModalRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const isClubModal = searchParams.get('view') === 'modal' && !!searchParams.get('club');
  const courseId = searchParams.get('club') ?? '';

  const onClose = () => {
    const params = new URLSearchParams(location.search);
    params.delete('view');
    params.delete('club');
    params.delete('src');
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: false });
  };

  if (!isClubModal || !courseId) {
    return null;
  }

  return (
    <SlideInModal 
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