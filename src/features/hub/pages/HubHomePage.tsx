/**
 * Hub Home Page - Golf OS Dashboard
 * Clean component architecture with slide-in/out animation shell
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useJoinRequestNotifications } from '@/features/nearby/hooks/useJoinRequestNotifications';
import { useHub } from '../useHub';
import { prefersReduced } from '@/lib/ui/motion';
import { useChromeState } from '@/hooks/useChromeState';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNextUserGame } from '../home/hooks/useNextUserGame';

// Clean UI components
import { HubHeader } from '../ui/HubHeader';
import { NextUpHeroCard, type NextUpGame } from '../ui/NextUpHeroCard';
import { MessagesCard, type HubMessagesSummary } from '../ui/MessagesCard';
import { ActiveGamesCard, type ActiveGameSummary } from '../ui/ActiveGamesCard';
import { EchoCard } from '../ui/EchoCard';
import { YourGamesGradientCTA } from '../ui/YourGamesGradientCTA';
import { CourseLegacyMiniCard, type CourseLegacySummary } from '../ui/CourseLegacyMiniCard';
import { HubDock, type HubDockItemKey } from '../ui/HubDock';
import { HubGamesHubSheet } from '../components/HubGamesHubSheet';
import { HubEchoSheet } from '../components/HubEchoSheet';

import '../ui/hubDashboard.css';

// Animation constants
const HUB_ENTRY_DURATION = 500;
const HUB_EXIT_DURATION = 500;
const HUB_ENTRY_EASING = 'ease-in-out';
const HUB_EXIT_EASING = 'ease-in-out';

function getFirstName(displayName: string | null | undefined): string {
  if (!displayName) return 'there';
  return displayName.split(' ')[0];
}

export function HubHomePage() {
  const navigate = useNavigate();
  const { close } = useHub();
  
  useJoinRequestNotifications();

  // User data
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const firstName = getFirstName(profile?.display_name);

  // Next up game
  const { data: nextGameData } = useNextUserGame();
  const nextUp: NextUpGame | null = useMemo(() => {
    if (!nextGameData) return null;
    return {
      id: nextGameData.gameId,
      courseId: nextGameData.course?.id || '',
      courseName: nextGameData.course?.name || nextGameData.courseName || 'Course TBD',
      region: nextGameData.course?.region || null,
      startTimeISO: nextGameData.startTimeISO,
      playersJoined: nextGameData.slotsTotal - nextGameData.slotsOpen,
      playersTotal: nextGameData.slotsTotal,
      heroImageUrl: nextGameData.course?.heroImageUrl || null,
    };
  }, [nextGameData]);

  // Sheet states
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  const [gamesHubTab, setGamesHubTab] = useState<'discover' | 'yours'>('yours');
  const [echoSheetOpen, setEchoSheetOpen] = useState(false);

  // Mock data (TODO: replace with real hooks)
  const messages: HubMessagesSummary = useMemo(() => ({ unreadCount: 0, latestSnippet: undefined }), []);
  const activeGames: ActiveGameSummary = useMemo(() => ({ title: 'Active Games Near You', subtitle: 'No games nearby' }), []);
  const courseLegacy: CourseLegacySummary = useMemo(() => ({ coursesPlayed: 32, countries: 7, avgRating: 7.2 }), []);

  // Dock config
  const dockItems = useMemo(() => ({
    left1: { key: 'your_games' as const, label: 'Your Games' },
    left2: { key: 'search' as const, label: 'Search' },
    center: { key: 'create' as const, label: 'Create' },
    right1: { key: 'echo' as const, label: 'Echo' },
    right2: { key: 'profile' as const, label: 'Profile' },
  }), []);

  const onDockPress = (key: HubDockItemKey) => {
    switch (key) {
      case 'your_games':
        setGamesHubTab('yours');
        setGamesHubOpen(true);
        break;
      case 'search':
        setGamesHubTab('discover');
        setGamesHubOpen(true);
        break;
      case 'create':
        setGamesHubTab('yours');
        setGamesHubOpen(true);
        break;
      case 'echo':
        setEchoSheetOpen(true);
        break;
      case 'profile':
        close();
        navigate('/profile');
        break;
    }
  };

  // Animation & swipe-to-dismiss state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return prefersReduced() ? 0 : window.innerHeight;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasEntered, setHasEntered] = useState(() => typeof window === 'undefined' || prefersReduced());
  const [isExiting, setIsExiting] = useState(false);
  const [revealChrome, setRevealChrome] = useState(false);

  const CHROME_REVEAL_OFFSET = 40;
  const DRAG_THRESHOLD = 120;

  useChromeState({ forceHidden: !revealChrome, disabled: false });
  
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const animateAndClose = useCallback(() => {
    if (prefersReduced() || typeof window === 'undefined') {
      close();
      return;
    }

    setIsExiting(true);
    setTranslateY(window.innerHeight);

    window.setTimeout(() => setRevealChrome(true), HUB_EXIT_DURATION - CHROME_REVEAL_OFFSET);
    window.setTimeout(() => close(), HUB_EXIT_DURATION);
  }, [close]);

  // Touch handlers
  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (isExiting) return;
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || dragStartY == null || isExiting) return;
    const deltaY = e.touches[0].clientY - dragStartY;
    setTranslateY(deltaY <= 0 ? 0 : deltaY);
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (!isDragging || isExiting) return;
    if (translateY > DRAG_THRESHOLD) {
      animateAndClose();
    } else {
      setTranslateY(0);
    }
    setIsDragging(false);
    setDragStartY(null);
  };

  // Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        animateAndClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [animateAndClose]);

  // Slide-in on mount
  useEffect(() => {
    if (prefersReduced() || typeof window === 'undefined') {
      setTranslateY(0);
      setHasEntered(true);
      return;
    }
    requestAnimationFrame(() => {
      setHasEntered(true);
      setTranslateY(0);
    });
  }, []);

  // Analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999]">
      <div 
        ref={sheetRef}
        className="hubRoot"
        style={{
          transform: `translateY(${translateY}px)`,
          transition:
            isDragging || !hasEntered || prefersReduced()
              ? 'none'
              : isExiting
                ? `transform ${HUB_EXIT_DURATION}ms ${HUB_EXIT_EASING}`
                : `transform ${HUB_ENTRY_DURATION}ms ${HUB_ENTRY_EASING}`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="hubScroll">
          <div className="hubContainer">
            <HubHeader
              firstName={firstName}
              onRightIconPress={() => {
                close();
                navigate('/clubhouse');
              }}
            />

            <div className="mt-3">
              <NextUpHeroCard
                game={nextUp}
                onPress={() => {
                  if (!nextUp) return;
                  setGamesHubTab('yours');
                  setGamesHubOpen(true);
                }}
              />
            </div>

            <div className="mt-4">
              <MessagesCard
                summary={messages}
                onPress={() => {
                  close();
                  navigate('/messages');
                }}
                onSeeAll={() => {
                  close();
                  navigate('/messages');
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <ActiveGamesCard 
                summary={activeGames} 
                onPress={() => {
                  setGamesHubTab('discover');
                  setGamesHubOpen(true);
                }} 
              />
              <EchoCard onPress={() => setEchoSheetOpen(true)} />
            </div>

            <div className="mt-4">
              <YourGamesGradientCTA
                countBadge={undefined}
                onPress={() => {
                  setGamesHubTab('yours');
                  setGamesHubOpen(true);
                }}
              />
            </div>

            <div className="mt-4">
              <CourseLegacyMiniCard 
                summary={courseLegacy} 
                onPress={() => {
                  close();
                  navigate('/courses');
                }} 
              />
            </div>

            <div className="h-2" />
          </div>
        </div>

        <div className="hubDockWrap">
          <HubDock items={dockItems} onPress={onDockPress} />
        </div>
      </div>

      {/* Sheets */}
      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab={gamesHubTab}
      />
      
      <HubEchoSheet
        isOpen={echoSheetOpen}
        onClose={() => setEchoSheetOpen(false)}
      />
    </div>
  );
}
