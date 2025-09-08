import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback, useEffect } from 'react';
import { useUI } from '@/contexts/UIContext';

export function useOpenCourseModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { modalTransition } = useUI();
  const pendingCourseIdRef = useRef<string | null>(null);
  const pendingSourceRef = useRef<string | null>(null);
  
  // Queue mechanism: if user clicks during close animation, open immediately after
  useEffect(() => {
    if (!modalTransition.inProgress && pendingCourseIdRef.current) {
      const courseId = pendingCourseIdRef.current;
      const source = pendingSourceRef.current;
      pendingCourseIdRef.current = null;
      pendingSourceRef.current = null;
      
      // Navigate to open modal for queued course
      const params = new URLSearchParams(location.search);
      params.set('view', 'modal');
      params.set('club', courseId);
      if (source) params.set('src', source);
      
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [modalTransition.inProgress, navigate, location]);
  
  return useCallback((courseId: string, source?: string) => {
    if (modalTransition.inProgress) {
      // Queue the open for when transition completes
      pendingCourseIdRef.current = courseId;
      pendingSourceRef.current = source || null;
      return;
    }
    
    // Navigate immediately to open modal
    const params = new URLSearchParams(location.search);
    params.set('view', 'modal');
    params.set('club', courseId);
    if (source) params.set('src', source);
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [modalTransition.inProgress, navigate, location]);
}