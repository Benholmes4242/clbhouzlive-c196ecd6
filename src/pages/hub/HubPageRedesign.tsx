/**
 * HubPageRedesign - Premium Hub Home Page
 * Fixed dashboard layout with time-of-day theming
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Plus, MessageSquare, Sparkles, ChevronRight, Clock, MapPin, Users, Sun, CloudSun, Moon } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { useMyHubEvents } from '@/features/hub/hooks/useMyHubEvents';
import { useHostPendingRequests } from '@/features/hub/hooks/useHostPendingRequests';
import { useUnreadMessagesCount } from '@/features/hub/hooks/useUnreadMessages';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function HubPageRedesign() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { data: events, isLoading: eventsLoading } = useMyHubEvents();
  const { requests: pendingRequests, count: pendingCount } = useHostPendingRequests();
  const { count: unreadCount } = useUnreadMessagesCount();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 20) return <Moon className="w-4 h-4" />;
    if (hour < 12) return <Sun className="w-4 h-4" />;
    return <CloudSun className="w-4 h-4" />;
  };

  const nextEvent = events?.[0];
  const upcomingCount = events?.length || 0;

  const formatEventDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    const days = differenceInDays(d, new Date());
    if (days < 7) return format(d, 'EEEE');
    return format(d, 'MMM d');
  };

  const handleEventClick = (event: typeof nextEvent) => {
    if (!event) return;
    if (event.legacy_game_id) {
      navigate(`/hub/games/${event.legacy_game_id}`);
    } else if (event.legacy_trip_id) {
      navigate(`/hub/trips/${event.legacy_trip_id}`);
    } else {
      navigate(`/hub/games`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
      {/* Header */}
      <header className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          {getTimeIcon()}
          <span>{greeting()},</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {profile?.display_name || 'Golfer'}
        </h1>
      </header>

      <div className="px-4 space-y-6">
        {/* Next Up Card */}
        {eventsLoading ? (
          <Skeleton className="h-44 rounded-2xl" />
        ) : nextEvent ? (
          <button
            onClick={() => handleEventClick(nextEvent)}
            className="w-full text-left"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
                <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
              </div>
              
              <div className="relative">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                  {nextEvent.event_type === 'multi_day' ? 'Trip' : 'Next Up'}
                </span>
                <h2 className="text-xl font-bold mt-1 mb-3">{nextEvent.name}</h2>
                
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatEventDate(nextEvent.start_date)}
                    {nextEvent.start_time && ` · ${format(new Date(nextEvent.start_time), 'h:mm a')}`}
                  </span>
                </div>

                {/* Weather badge placeholder */}
                <div className="absolute top-0 right-0 flex items-center gap-1 bg-white/20 rounded-full px-2 py-1 text-xs">
                  <Sun className="w-3.5 h-3.5" />
                  18°C
                </div>
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-2xl bg-card border border-border p-6 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No upcoming games</p>
            <p className="text-sm text-muted-foreground mb-4">Your next round starts here</p>
            <Button onClick={() => navigate('/hub/create-game')} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Game
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/hub/games')}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">Your Games</span>
            {upcomingCount > 0 && (
              <span className="text-xs text-muted-foreground">{upcomingCount} upcoming</span>
            )}
          </button>

          <button
            onClick={() => navigate('/hub/discover')}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium">Find Games</span>
            <span className="text-xs text-muted-foreground">Near you</span>
          </button>

          <button
            onClick={() => navigate('/hub/create-game')}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Plus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium">Create</span>
            <span className="text-xs text-muted-foreground">Game or Trip</span>
          </button>
        </div>

        {/* Pending Requests */}
        {pendingCount > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button 
              onClick={() => navigate('/hub/games')}
              className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">Pending Requests</span>
                <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="divide-y divide-border">
              {pendingRequests.slice(0, 2).map((request) => (
                <PendingRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <button
          onClick={() => navigate('/hub/messages')}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Messages</p>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'No new messages'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Echo */}
        <button
          onClick={() => navigate('/hub/echo')}
          className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-xl border border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-violet-900 dark:text-violet-100">Echo</p>
            <p className="text-sm text-violet-600 dark:text-violet-300">Ask anything about golf</p>
          </div>
          <ChevronRight className="w-5 h-5 text-violet-400" />
        </button>
      </div>
    </div>
  );
}

function PendingRequestCard({ request }: { request: any }) {
  const navigate = useNavigate();
  const isGame = request.type === 'game';
  const name = isGame ? request.game?.course_name : request.trip?.name;
  
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-medium">
            {request.requester?.display_name?.[0] || '?'}
          </span>
        </div>
        <div>
          <p className="font-medium text-sm">{request.requester?.display_name}</p>
          <p className="text-xs text-muted-foreground">
            wants to join {name || 'your event'}
          </p>
        </div>
      </div>
      <Button 
        size="sm" 
        className="h-8 px-3"
        onClick={(e) => {
          e.stopPropagation();
          if (isGame && request.game_id) {
            navigate(`/hub/games/${request.game_id}`);
          } else if (request.trip_id) {
            navigate(`/hub/trips/${request.trip_id}`);
          }
        }}
      >
        View
      </Button>
    </div>
  );
}
