import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { useHub } from '../useHub';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNextUserGame } from '../home/hooks/useNextUserGame';

import '../ui/hubDashboard.css';

function getFirstName(displayName: string | null | undefined): string {
  if (!displayName) return 'there';
  return displayName.split(' ')[0];
}

/**
 * HubDashboardPage
 * - Scrollable dashboard content + anchored dock.
 * - Keep layout Apple/Strava-like: big greeting, hero tile, compact cards, dock pinned to bottom.
 */
export function HubDashboardPage() {
  const navigate = useNavigate();
  const { close } = useHub();
  
  // Real user data
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const firstName = getFirstName(profile?.display_name);

  // Real next up game
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

  // TODO: replace with real messages summary hook
  const messages: HubMessagesSummary = useMemo(() => {
    return { unreadCount: 0, latestSnippet: undefined };
  }, []);

  // TODO: replace with real "active games near user" hook
  const activeGames: ActiveGameSummary = useMemo(() => {
    return {
      title: 'Active Games Near You',
      subtitle: 'No games nearby',
    };
  }, []);

  // TODO: replace with real courses summary hook
  const courseLegacy: CourseLegacySummary = useMemo(() => {
    return { coursesPlayed: 32, countries: 7, avgRating: 7.2 };
  }, []);

  // Dock config
  const dockItems = useMemo(
    () => ({
      left1: { key: 'your_games' as const, label: 'Your Games' },
      left2: { key: 'search' as const, label: 'Search' },
      center: { key: 'create' as const, label: 'Create' },
      right1: { key: 'echo' as const, label: 'Echo' },
      right2: { key: 'profile' as const, label: 'Profile' },
    }),
    []
  );

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
      default:
        break;
    }
  };

  const handleHomePress = () => {
    close();
    navigate('/clubhouse');
  };

  return (
    <div className="hubRoot">
      <div className="hubScroll">
        <div className="hubContainer">
          <HubHeader
            firstName={firstName}
            onRightIconPress={handleHomePress}
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

          {/* spacer so last card never hides behind dock */}
          <div className="h-2" />
        </div>
      </div>

      <div className="hubDockWrap">
        <HubDock items={dockItems} onPress={onDockPress} />
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
