import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, MoreVertical, Users, Trophy, Clock, MapPin, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useEventWithDetails } from '@/features/events/hooks/useEvent';
import { useRespondToInvitation, useLeaveEvent } from '@/features/events/hooks/useEventParticipants';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EventOverviewTab } from '../components/detail/EventOverviewTab';
import { EventPlayersTab } from '../components/detail/EventPlayersTab';
import { EventGroupsTab } from '../components/detail/EventGroupsTab';
import { EventLeaderboardTab } from '../components/detail/EventLeaderboardTab';
import { InvitePlayersSheet } from '../components/InvitePlayersSheet';
import { ShareEventSheet } from '../components/ShareEventSheet';

type Tab = 'overview' | 'players' | 'groups' | 'leaderboard';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: event, isLoading, refetch } = useEventWithDetails(eventId);
  const { mutate: respondToInvitation } = useRespondToInvitation();
  const { mutate: leaveEvent } = useLeaveEvent();

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Event not found</p>
          <Button onClick={() => navigate('/hub')}>Back to Hub</Button>
        </div>
      </div>
    );
  }

  const isPendingInvite = event.currentParticipant?.invitation_status === 'invited';
  const isAccepted = event.currentParticipant?.invitation_status === 'accepted';
  const canManage = event.isOrganizer;

  const handleAccept = () => {
    if (event.currentParticipant) {
      respondToInvitation({ participantId: event.currentParticipant.id, response: 'accepted' });
    }
  };

  const handleDecline = () => {
    if (event.currentParticipant) {
      respondToInvitation({ participantId: event.currentParticipant.id, response: 'declined' });
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Calendar className="w-4 h-4" /> },
    { id: 'players', label: `Players (${event.acceptedCount})`, icon: <Users className="w-4 h-4" /> },
    { id: 'groups', label: 'Groups', icon: <Clock className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/50 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShareOpen(true)} className="p-2 hover:bg-white/50 rounded-full">
              <Share2 className="w-5 h-5" />
            </button>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 hover:bg-white/50 rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/events/${eventId}/manage`)}>Manage Event</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Cancel Event</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            {event.event_type === 'society_day' ? 'Society Day' : event.event_type === 'multi_day' ? 'Golf Trip' : event.event_type === 'tournament' ? 'Tournament' : 'Round'}
          </span>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(event.start_date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {event.acceptedCount} going
            </span>
          </div>
        </div>
      </div>

      {/* Pending Invite Banner */}
      {isPendingInvite && (
        <div className="mx-4 -mt-2 mb-4 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <p className="font-medium">You're invited!</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept}>Accept</Button>
            <Button size="sm" variant="outline" onClick={handleDecline}>Decline</Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && <EventOverviewTab event={event} />}
        {activeTab === 'players' && <EventPlayersTab event={event} onInvite={() => setInviteOpen(true)} />}
        {activeTab === 'groups' && <EventGroupsTab event={event} />}
        {activeTab === 'leaderboard' && <EventLeaderboardTab event={event} />}
      </div>

      {/* Bottom Actions */}
      {canManage && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button onClick={() => setInviteOpen(true)} className="w-full h-12 rounded-xl">
            <Users className="w-5 h-5 mr-2" />
            Invite Players
          </Button>
        </div>
      )}

      {/* Sheets */}
      <InvitePlayersSheet open={inviteOpen} onClose={() => setInviteOpen(false)} eventId={eventId!} onSuccess={refetch} />
      <ShareEventSheet open={shareOpen} onClose={() => setShareOpen(false)} event={event} />
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-6">
        <Skeleton className="w-6 h-6 rounded-full mb-4" />
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-48 h-8 mb-2" />
        <div className="flex gap-4">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
      <div className="flex gap-4 px-4 py-3 border-b">
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-24 h-8" />
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-48" />
      </div>
    </div>
  );
}
