import { useNavigate, useLocation } from 'react-router-dom';
import EnhancedCreateMomentModal from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';
import AccessControl from '@/components/AccessControl';

export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation (media items, course, etc.)
  const state = location.state as any;
  const mediaItems = state?.mediaItems || [];
  const selectedCourse = state?.selectedCourse;

  // Force hide chrome (header, footer, HUD) while this page is open
  useChromeState({ forceHidden: true });

  const handleClose = () => {
    // Navigate back to previous location or clubhouse
    const backgroundLocation = (location.state as any)?.backgroundLocation;
    if (backgroundLocation) {
      navigate(backgroundLocation.pathname + backgroundLocation.search, { replace: true });
    } else {
      navigate('/clubhouse', { replace: true });
    }
  };

  const handleMediaChange = (items: ComposerMediaItem[]) => {
    // Update location state with new media items
    navigate(location.pathname, {
      state: { ...state, mediaItems: items },
      replace: true,
    });
  };

  const handleCourseSelect = (course: any) => {
    // Update location state with selected course
    navigate(location.pathname, {
      state: { ...state, selectedCourse: course },
      replace: true,
    });
  };

  return (
    <AccessControl requireAuth={true}>
      <EnhancedCreateMomentModal
        isOpen={true}
        onClose={handleClose}
        mediaItems={mediaItems}
        selectedCourse={selectedCourse}
        onCourseSelect={handleCourseSelect}
        onMediaChange={handleMediaChange}
      />
    </AccessControl>
  );
}
