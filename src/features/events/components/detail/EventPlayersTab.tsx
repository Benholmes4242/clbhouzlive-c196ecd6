import React from 'react';
import { Plus, MoreVertical, Crown, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EventWithDetails, EventParticipant } from '@/features/events/hooks/useEvent';
import { useRemoveParticipant, useUpdateParticipant } from '@/features/events/hooks/useEventParticipants';
import { cn } from '@/lib/utils';

interface Props {
  event: EventWithDetails;
  onInvite: () => void;
}

export function EventPlayersTab({ event, onInvite }: Props) {
  const { mutate: removeParticipant } = useRemoveParticipant();
  const { mutate: updateParticipant } = useUpdateParticipant();

  const accepted = event.participants?.filter(p => p.invitation_status === 'accepted') || [];
  const invited = event.participants?.filter(p => p.invitation_status === 'invited') || [];
  const waitlisted = event.participants?.filter(p => p.invitation_status === 'waitlisted') || [];

  const handleRemove = (participantId: string) => {
    removeParticipant({ participantId, eventId: event.id });
  };

  const handleMakeCoOrganizer = (participantId: string) => {
    updateParticipant({ participantId, updates: { role: 'co_organizer' } });
  };

  const renderPlayer = (participant: EventParticipant) => {
    const name = participant.user?.display_name || participant.guest_name || 'Unknown';
    const isOrganizer = participant.role === 'organizer' || participant.role === 'co_organizer';

    return (
      <div key={participant.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {participant.user?.profile_photo_url ? (
            <img src={participant.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
              {name[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{name}</p>
            {isOrganizer && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
          </div>
          {participant.handicap_index !== null && (
            <p className="text-sm text-muted-foreground">HCP: {participant.handicap_index}</p>
          )}
        </div>
        {event.isOrganizer && participant.role !== 'organizer' && (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {participant.role !== 'co_organizer' && (
                <DropdownMenuItem onClick={() => handleMakeCoOrganizer(participant.id)}>Make co-organizer</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleRemove(participant.id)} className="text-destructive">
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Accepted */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Going ({accepted.length})</p>
          {event.isOrganizer && (
            <Button size="sm" variant="ghost" onClick={onInvite}>
              <Plus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          )}
        </div>
        {accepted.length > 0 ? (
          <div className="space-y-2">{accepted.map(renderPlayer)}</div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No confirmed players yet</p>
        )}
      </div>

      {/* Invited */}
      {invited.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Invited ({invited.length})</p>
          <div className="space-y-2">{invited.map(renderPlayer)}</div>
        </div>
      )}

      {/* Waitlisted */}
      {waitlisted.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Waitlist ({waitlisted.length})</p>
          <div className="space-y-2">{waitlisted.map(renderPlayer)}</div>
        </div>
      )}
    </div>
  );
}
