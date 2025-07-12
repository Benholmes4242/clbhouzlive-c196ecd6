import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Preload critical routes and their dependencies
export const useRoutePreloader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Preload route components
  const preloadRoute = useCallback(async (routePath: string) => {
    try {
      switch (routePath) {
        case '/feed':
          await import('@/pages/Index');
          break;
        case '/courses':
          await import('@/pages/Courses');
          break;
        case '/news':
          await import('@/pages/News');
          break;
        default:
          break;
      }
    } catch (error) {
      console.warn(`Failed to preload route ${routePath}:`, error);
    }
  }, []);

  // Preload likely next routes based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    let routesToPreload: string[] = [];

    switch (currentPath) {
      case '/':
        routesToPreload = ['/courses', '/news'];
        break;
      case '/courses':
        routesToPreload = ['/news'];
        break;
      case '/news':
        routesToPreload = ['/courses'];
        break;
      default:
        routesToPreload = ['/courses'];
    }

    // Preload with a slight delay to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      routesToPreload.forEach(route => {
        preloadRoute(route);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, preloadRoute]);

  // Preload route on hover/touch (for navigation links)
  const preloadOnHover = useCallback((routePath: string) => {
    return {
      onMouseEnter: () => preloadRoute(routePath),
      onTouchStart: () => preloadRoute(routePath),
    };
  }, [preloadRoute]);

  return { preloadRoute, preloadOnHover };
};

// Critical resource preloader
export const useCriticalResourcePreloader = () => {
  useEffect(() => {
    // Preload critical API endpoints
    const preloadCriticalData = async () => {
      try {
        // Preload user profile data if authenticated
        const token = localStorage.getItem('supabase.auth.token');
        if (token) {
          // Warm up the connection with a lightweight query
          await fetch(`https://ybxkehyomcakqjvuhnna.supabase.co/rest/v1/user_profiles?select=id&limit=1`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      } catch (error) {
        console.warn('Failed to preload critical data:', error);
      }
    };

    // Preload after initial render
    const timeoutId = setTimeout(preloadCriticalData, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  // Preload critical images
  const preloadImages = useCallback((imageUrls: string[]) => {
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  return { preloadImages };
};