import { useNavigate, useLocation } from 'react-router-dom';

export function useOpenCourseModal() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (courseId: string, source?: string) => {
    const params = new URLSearchParams(location.search);
    params.set('view', 'modal');
    params.set('club', courseId);
    if (source) params.set('src', source);
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: false });
  };
}