import { useNavigate, useLocation } from 'react-router-dom';
import { PostWizard } from '@/components/post/post-wizard';
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
  const initialActorOverride = state?.initialActorOverride;

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

  return (
    <AccessControl requireAuth={true}>
      <PostWizard
        isOpen={true}
        onClose={handleClose}
        initialMedia={mediaItems}
        initialCourses={selectedCourse ? [selectedCourse] : undefined}
        initialActorOverride={initialActorOverride}
      />
    </AccessControl>
  );
}
