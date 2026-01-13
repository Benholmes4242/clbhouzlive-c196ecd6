import React, { useState } from 'react';
import { Clock, Users, Shuffle, Plus, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EventWithDetails } from '@/features/events/hooks/useEvent';
import { useAutoGenerateGroups } from '@/features/events/hooks/useTeeTimeGroups';
import { ScoreEntrySheet } from '../scoring/ScoreEntrySheet';
import { cn } from '@/lib/utils';

interface Props {
  event: EventWithDetails;
}

export function EventGroupsTab({ event }: Props) {
  const [selectedRound, setSelectedRound] = useState(event.rounds?.[0]?.id || '');
  const [scoreEntryOpen, setScoreEntryOpen] = useState(false);
  const { mutate: autoGenerate, isPending: isGenerating } = useAutoGenerateGroups();

  const currentRound = event.rounds?.find(r => r.id === selectedRound);
  const groups = currentRound?.groups || [];

  const handleAutoGenerate = () => {
    if (selectedRound) {
      autoGenerate({ roundId: selectedRound, playersPerGroup: 4 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Round Selector (if multiple rounds) */}
      {event.rounds && event.rounds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {event.rounds.map((round, index) => (
            <button
              key={round.id}
              onClick={() => setSelectedRound(round.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border',
                selectedRound === round.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'
              )}
            >
              R{index + 1}: {round.course_name}
            </button>
          ))}
        </div>
      )}

      {/* Generate Groups Button */}
      {event.isOrganizer && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleAutoGenerate} disabled={isGenerating}>
            <Shuffle className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : groups.length > 0 ? 'Regenerate Groups' : 'Auto-Generate Groups'}
          </Button>
        </div>
      )}

      {/* Groups List */}
      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold">
                    {format(new Date(`2000-01-01T${group.tee_time}`), 'h:mm a')}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Group {group.group_number}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {group.players && group.players.length > 0 ? (
                  group.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        <span>
                          {player.participant?.user?.display_name?.[0] || player.participant?.guest_name?.[0] || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {player.participant?.user?.display_name || player.participant?.guest_name || 'Unknown'}
                        </p>
                      </div>
                      {player.playing_handicap !== null && (
                        <span className="text-sm text-muted-foreground">HCP {player.playing_handicap}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No players assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <Users className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="font-medium">No groups yet</p>
          <p className="text-sm text-muted-foreground">Generate groups to assign players to tee times</p>
          {event.isOrganizer && (
            <Button onClick={handleAutoGenerate} disabled={isGenerating}>
              <Shuffle className="w-4 h-4 mr-2" />
              Generate Groups
            </Button>
          )}
        </div>
      )}

      {/* Score Entry Button */}
      {event.currentParticipant && currentRound && (
        <>
          <div className="pt-4 border-t border-border">
            <Button onClick={() => setScoreEntryOpen(true)} className="w-full h-12 rounded-xl">
              <ClipboardList className="w-5 h-5 mr-2" />
              Enter My Score
            </Button>
          </div>
          
          <ScoreEntrySheet
            open={scoreEntryOpen}
            onClose={() => setScoreEntryOpen(false)}
            roundId={currentRound.id}
            participantId={event.currentParticipant.id}
            playingHandicap={event.currentParticipant.playing_handicap || event.currentParticipant.handicap_index || 0}
            courseName={currentRound.course_name}
          />
        </>
      )}
    </div>
  );
}
