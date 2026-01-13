import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Search, 
  MapPin, 
  MessageCircle,
  Plane,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-12 px-6',
      className
    )}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
        {description}
      </p>
      {action && (
        <Button 
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="rounded-full px-6"
        >
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-3 text-sm text-primary font-medium"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}

// Pre-built empty states

export function NoUpcomingGames() {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8 text-muted-foreground" />}
      title="No upcoming games"
      description="You don't have any games scheduled. Create one or find games nearby to join."
      action={{
        label: 'Create a game',
        onClick: () => navigate('/hub/create'),
      }}
      secondaryAction={{
        label: 'Find games nearby',
        onClick: () => navigate('/hub/discover'),
      }}
    />
  );
}

export function NoPastGames() {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Trophy className="w-8 h-8 text-muted-foreground" />}
      title="No past games"
      description="Your completed games will appear here. Start playing to build your history!"
      action={{
        label: 'Find a game',
        onClick: () => navigate('/hub/discover'),
      }}
    />
  );
}

export function NoTrips() {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Plane className="w-8 h-8 text-muted-foreground" />}
      title="No trips planned"
      description="Plan a golf trip with friends. Add courses, invite players, and track everything in one place."
      action={{
        label: 'Plan a trip',
        onClick: () => navigate('/hub/create?type=trip'),
      }}
    />
  );
}

export function NoDiscoverResults({ 
  searchQuery,
  onClearSearch 
}: { 
  searchQuery?: string;
  onClearSearch?: () => void;
}) {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Search className="w-8 h-8 text-muted-foreground" />}
      title={searchQuery ? 'No results found' : 'No games nearby'}
      description={
        searchQuery 
          ? `We couldn't find any games matching "${searchQuery}". Try a different search.`
          : 'There are no public games in your area right now. Be the first to create one!'
      }
      action={{
        label: 'Create a game',
        onClick: () => navigate('/hub/create'),
      }}
      secondaryAction={searchQuery && onClearSearch ? {
        label: 'Clear search',
        onClick: onClearSearch,
      } : undefined}
    />
  );
}

export function NoPlayers() {
  return (
    <EmptyState
      icon={<Users className="w-8 h-8 text-muted-foreground" />}
      title="No players yet"
      description="Be the first to join this game, or invite your friends!"
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={<MessageCircle className="w-8 h-8 text-muted-foreground" />}
      title="No messages yet"
      description="Start the conversation! Send a message to coordinate with your group."
    />
  );
}

export function NoRounds() {
  return (
    <EmptyState
      icon={<MapPin className="w-8 h-8 text-muted-foreground" />}
      title="No rounds scheduled"
      description="Add courses to build your trip itinerary."
    />
  );
}

export function GameNotFound() {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8 text-muted-foreground" />}
      title="Game not found"
      description="This game may have been cancelled or removed."
      action={{
        label: 'Back to Hub',
        onClick: () => navigate('/hub'),
      }}
    />
  );
}

export function TripNotFound() {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Plane className="w-8 h-8 text-muted-foreground" />}
      title="Trip not found"
      description="This trip may have been cancelled or removed."
      action={{
        label: 'Back to Hub',
        onClick: () => navigate('/hub'),
      }}
    />
  );
}

export function NotAuthorized({ onRequestAccess }: { onRequestAccess?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <EmptyState
      icon={<Users className="w-8 h-8 text-muted-foreground" />}
      title="Access restricted"
      description="You need to be invited or request to join to see this content."
      action={onRequestAccess ? {
        label: 'Request to join',
        onClick: onRequestAccess,
        variant: 'outline',
      } : undefined}
      secondaryAction={{
        label: 'Go back',
        onClick: () => navigate(-1),
      }}
    />
  );
}

// Export the base component for custom usage
export { EmptyState };
