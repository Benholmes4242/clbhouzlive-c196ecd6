import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback } from 'react';

export function useOpenCourseModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const isTransitioning = useRef(false);
  
  return useCallback((courseId: string, source?: string) => {
    // Prevent double-navigation during transitions
    if (isTransitioning.current) return;
    
    isTransitioning.current = true;
    
    const params = new URLSearchParams(location.search);
    params.set('view', 'modal');
    params.set('club', courseId);
    if (source) params.set('src', source);
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    
    // Reset transition guard after navigation settles
    setTimeout(() => {
      isTransitioning.current = false;
    }, 50);
  }, [navigate, location]);
}