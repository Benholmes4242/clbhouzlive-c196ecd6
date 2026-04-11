import { useRef, useEffect, useState, ReactNode, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

interface KeepAliveRoute {
  path: string;
  element: ReactNode;
}

interface KeepAliveOutletProps {
  keepAliveRoutes: KeepAliveRoute[];
  maxCached?: number;
}

// Context for children to know if they're active
interface KeepAliveContextValue {
  isActive: boolean;
  path: string;
}

const KeepAliveContext = createContext<KeepAliveContextValue>({ 
  isActive: true, 
  path: '' 
});

export const useKeepAlive = () => useContext(KeepAliveContext);

/**
 * KeepAliveOutlet - Portal-based route caching for instant tab switches
 * 
 * This component keeps specified routes mounted in the DOM even when navigating away,
 * allowing video elements to preserve their decoded frame textures and HLS instances
 * to retain their segment buffers.
 * 
 * Architecture:
 * - Routes in keepAliveRoutes are cached in hidden portals when navigated away
 * - Videos are automatically paused when route becomes inactive
 * - Cached routes maintain their full React state and DOM elements
 * - LRU eviction when maxCached is exceeded
 * 
 * This is the exact pattern Instagram uses for tab bar navigation.
 */
export function KeepAliveOutlet({ keepAliveRoutes, maxCached = 3 }: KeepAliveOutletProps) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [cachedPaths, setCachedPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const rawInitialPath = window.location.pathname;
    const initialPath = rawInitialPath === '/clubhouse' ? '/' : rawInitialPath;
    const isKeepAlive = keepAliveRoutes.some(r => r.path === initialPath);
    if (isKeepAlive) {
      initial.add(initialPath);
    }
    return initial;
  });
  const mountedRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Normalise Clubhouse alias — '/clubhouse' and '/' are the same keep-alive slot
  const rawPath = location.pathname;
  const currentPath = rawPath === '/clubhouse' ? '/' : rawPath;
  
  // Check if current path matches any keep-alive route (exact or prefix match)
  const matchedRoute = keepAliveRoutes.find(r => {
    // Exact match
    if (r.path === currentPath) return true;
    // Prefix match for routes like "/" matching "/clubhouse"
    if (r.path === '/' && currentPath === '/') return true;
    return false;
  });
  
  const isKeepAlivePath = !!matchedRoute;

  // Cache management - add new paths, evict oldest when over max
  useEffect(() => {
    if (isKeepAlivePath && !cachedPaths.has(currentPath)) {
      setCachedPaths(prev => {
        const next = new Set(prev);
        next.add(currentPath);
        
        // LRU eviction - remove oldest if over max
        if (next.size > maxCached) {
          const oldest = Array.from(next)[0];
          next.delete(oldest);
          
          // Cleanup the evicted mount point
          const evictedMount = mountedRef.current.get(oldest);
          if (evictedMount) {
            evictedMount.remove();
            mountedRef.current.delete(oldest);
          }
        }
        
        return next;
      });
    }
  }, [currentPath, isKeepAlivePath, maxCached, cachedPaths]);

  // Pause all videos when navigating away from a keep-alive route
  useEffect(() => {
    cachedPaths.forEach(path => {
      if (path !== currentPath) {
        const container = mountedRef.current.get(path);
        if (container) {
          // Pause all videos in the inactive container
          const videos = container.querySelectorAll('video');
          videos.forEach(v => {
            if (!v.paused) {
              v.pause();
            }
          });
        }
      }
    });
  }, [currentPath, cachedPaths]);

  return (
    <>
      {/* Container for keep-alive portals */}
      <div 
        ref={containerRef} 
        className="keep-alive-container"
        style={{ display: 'contents' }}
      />
      
      {/* Render each cached route */}
      {Array.from(cachedPaths).map(path => {
        const route = keepAliveRoutes.find(r => r.path === path);
        if (!route) return null;

        const isActive = path === currentPath;
        
        // Get or create the mount point for this path
        if (!mountedRef.current.has(path)) {
          const div = document.createElement('div');
          div.setAttribute('data-keep-alive', path);
          div.className = 'keep-alive-mount';
          mountedRef.current.set(path, div);
        }
        
        const mountPoint = mountedRef.current.get(path)!;
        
        // Update visibility styles
        mountPoint.style.display = isActive ? 'contents' : 'none';
        mountPoint.style.pointerEvents = isActive ? 'auto' : 'none';
        mountPoint.setAttribute('aria-hidden', String(!isActive));
        
        // Use inert attribute for accessibility (prevents focus/interaction)
        if (!isActive) {
          mountPoint.setAttribute('inert', '');
        } else {
          mountPoint.removeAttribute('inert');
        }
        
        // Ensure mount point is in DOM
        if (containerRef.current && !containerRef.current.contains(mountPoint)) {
          containerRef.current.appendChild(mountPoint);
        }

        return createPortal(
          <KeepAliveContext.Provider value={{ isActive, path }}>
            {route.element}
          </KeepAliveContext.Provider>,
          mountPoint,
          path
        );
      })}
    </>
  );
}

export default KeepAliveOutlet;
