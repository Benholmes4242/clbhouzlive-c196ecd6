import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from './navigationTabs';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { prefetchProfileVideos, resolveUsernameToId } from '@/utils/profileVideoPrefetch';
import { useActiveActor } from '@/context/ActiveActorContext';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeActor } = useActiveActor();
  
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('clubhouse');

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/' || location.pathname === '/clubhouse') {
      setActiveTab('clubhouse');
    } else if (location.pathname.startsWith('/tourhub')) {
      setActiveTab('tourhub');
    } else if (location.pathname === '/map' || location.pathname.startsWith('/courses')) {
  setActiveTab('courses');
    } else if (location.pathname === '/watch') {
      setActiveTab('watch');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    // Track nav tab tap
    analyticsEvents.track('nav_tab_tap', { tab: tab.id });

    if (tab.isAction) {
      // Action tabs are handled by the parent component (BottomNavigation)
      return;
    }

    if (tab.path) {
      setActiveTab(tab.id);

      // Clear courses badge when visiting courses tab
if (tab.id === 'courses') {
        if (user?.id) {
          supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('type', 'friend_course_review')
            .then(() => {});
        }
      }

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
    // TODO: Clubhouse prefetch removed — will be re-added with new media player
    
    // Prefetch for Profile page
    if (path.includes('/profile') || path.includes('/u/')) {
      // Extract userId or username from path
      const userIdMatch = path.match(/\/profile\/([^\/]+)/);
      const usernameMatch = path.match(/\/u\/([^\/]+)/);
      
      if (usernameMatch?.[1]) {
        resolveUsernameToId(usernameMatch[1]).then(userId => {
          if (userId) {
            prefetchProfileVideos(userId);
          }
        });
      } else if (userIdMatch?.[1]) {
        prefetchProfileVideos(userIdMatch[1]);
      } else {
        prefetchProfileVideos();
      }
    }
  }, []);

  return {
    activeTab,
    handleTabClick,
    handlePrefetch
  };
};
