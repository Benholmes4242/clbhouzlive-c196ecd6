import { useNavigate, useLocation } from 'react-router-dom';

export function useOpenCourseModal() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (courseId: string, source?: string) => {
    // Use background-route pattern instead of search params
    // Check if we're on a user profile page vs own profile page
    const isUserProfile = location.pathname.includes('/profile/') && location.pathname !== '/profile';
    
    if (isUserProfile) {
      // For other user profiles, maintain the username in the route
      const currentPath = location.pathname;
      navigate(`${currentPath}/course/${courseId}`, { 
        state: { backgroundLocation: location },
        replace: false 
      });
    } else {
      // For own profile
      navigate(`/profile/course/${courseId}`, { 
        state: { backgroundLocation: location },
        replace: false 
      });
    }
  };
}