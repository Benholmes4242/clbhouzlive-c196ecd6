import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from './navigationTabs';

import { prefetchClubhouseVideos } from '@/utils/clubhouseVideoPrefetch';
import { prefetchProfileVideos, resolveUsernameToId } from '@/utils/profileVideoPrefetch';
import { useActiveActor } from '@/context/ActiveActorContext';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeActor } = useActiveActor();
  const [activeTab, setActiveTab] = useState('clubhouse');

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/' || location.pathname === '/clubhouse') {
      setActiveTab('clubhouse');
    } else if (location.pathname.startsWith('/tourhub')) {
      setActiveTab('tourhub');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    console.log('useNavigationHandlers: handleTabClick called with:', tab);
    
    if (tab.isAction) {
      console.log('useNavigationHandlers: Action tab detected, not handling navigation');
      // Action tabs are handled by the parent component (BottomNavigation)
      return;
    }

    if (tab.path) {
      console.log('useNavigationHandlers: Navigating to:', tab.path);
      setActiveTab(tab.id);


      if (tab.path === '/profile') {
        // Profile tab: navigate to business profile when acting as business
        if (activeActor?.type === 'business' && activeActor?.slug) {
          navigate(`/business/${activeActor.slug}`, { replace: true });
        } else {
          navigate(tab.path, { replace: true });
        }
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }, 50);
      } else {
        // Tours tab: if already on a sub-route, navigate back to overview
        if (tab.id === 'tourhub' && location.pathname.startsWith('/tourhub') && location.pathname !== '/tourhub') {
          navigate('/tourhub', { replace: true });
        } else {
          navigate(tab.path, { replace: true });
        }
        // Only scroll to top when navigating to different pages, not when staying on profile or hub
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }, 50);
      }
    }
  };

  /**
   * Handle prefetch triggers from tab hover/touch.
   * Prefetches videos when user hovers over Watch/Discover, Clubhouse/Home, or Profile tabs.
   */
  const handlePrefetch = useCallback((path: string) => {
    console.log('[useNavigationHandlers] handlePrefetch called with:', path);

    
    // Prefetch for Clubhouse/Home tab
    if (path === '/clubhouse' || path === '/' || path.includes('clubhouse')) {
      console.log('[Navigation] Triggering clubhouse prefetch for path:', path);
      prefetchClubhouseVideos().then(ids => {
        if (ids && ids.length > 0) {
          console.log('[Navigation] Clubhouse prefetch completed:', ids.length, 'videos');
        }
      });
    }
    
    // Prefetch for Profile page
    if (path.includes('/profile') || path.includes('/u/')) {
      console.log('[Navigation] Triggering profile prefetch for path:', path);
      
      // Extract userId or username from path
      const userIdMatch = path.match(/\/profile\/([^\/]+)/);
      const usernameMatch = path.match(/\/u\/([^\/]+)/);
      
      if (usernameMatch?.[1]) {
        // Path has username - need to resolve to ID first
        resolveUsernameToId(usernameMatch[1]).then(userId => {
          if (userId) {
            prefetchProfileVideos(userId).then(ids => {
              if (ids && ids.length > 0) {
                console.log('[Navigation] Profile prefetch completed:', ids.length, 'videos');
              }
            });
          }
        });
      } else if (userIdMatch?.[1]) {
        // Path has userId directly
        prefetchProfileVideos(userIdMatch[1]).then(ids => {
          if (ids && ids.length > 0) {
            console.log('[Navigation] Profile prefetch completed:', ids.length, 'videos');
          }
        });
      } else {
        // Own profile (no specific user in path)
        prefetchProfileVideos().then(ids => {
          if (ids && ids.length > 0) {
            console.log('[Navigation] Own profile prefetch completed:', ids.length, 'videos');
          }
        });
      }
    }
  }, []);

  return {
    activeTab,
    handleTabClick,
    handlePrefetch
  };
};
