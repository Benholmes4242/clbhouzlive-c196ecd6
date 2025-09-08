import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from './use-mobile';

export function useOpenCourseModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  return (courseId: string, source?: string) => {
    // Check if we're on a user profile page vs own profile page
    const isUserProfile = location.pathname.includes('/profile/') && location.pathname !== '/profile';
    
    if (isUserProfile) {
      // For other user profiles, maintain the username in the route
      const currentPath = location.pathname;
      navigate(`${currentPath}/course/${courseId}`, { 
        state: isMobile ? { backgroundLocation: location } : undefined,
        replace: false 
      });
    } else {
      // For own profile
      navigate(`/profile/course/${courseId}`, { 
        state: isMobile ? { backgroundLocation: location } : undefined,
        replace: false 
      });
    }
  };
}