import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GameJoinRequest } from '../hooks/useGameJoinRequests';

interface JoinRequestCardProps {
  request: GameJoinRequest;
  onAccept: (requestId: string, gameId: string) => void;
  onDecline: (requestId: string) => void;
}

export function JoinRequestCard({ request, onAccept, onDecline }: JoinRequestCardProps) {
  const profile = request.requester_profile;
  
  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-12 h-12">
          <AvatarImage src={profile.profile_photo_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-foreground">
            {profile.display_name}
          </div>
          
          {profile.home_club && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{profile.home_club}</span>
            </div>
          )}
          
          {profile.eg_handicap_index !== null && (
            <div className="text-sm text-muted-foreground mt-0.5">
              Handicap {profile.eg_handicap_index}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          onClick={() => onDecline(request.id)}
          className="flex-1"
        >
          Decline
        </Button>
        <Button
          onClick={() => onAccept(request.id, request.game_id)}
          className="flex-1"
        >
          Accept
        </Button>
      </div>
    </Card>
  );
}
