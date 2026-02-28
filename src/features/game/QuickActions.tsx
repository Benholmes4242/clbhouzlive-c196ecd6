import React from 'react';
import { MapPin, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildIcs, downloadIcs } from '@/utils/ics';
import { toast } from 'sonner';
import { Game } from '@/features/nearby/types';

interface QuickActionsProps {
  game: Game;
  onInsertMessage: (text: string) => void;
}

export function QuickActions({ game, onInsertMessage }: QuickActionsProps) {
  const handleDirections = () => {
    if (!game.lat || !game.lng) {
      toast.error('This game does not have a location set');
      return;
    }

    // Detect iOS/macOS vs Android/Web
    const isApple = /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);
    const url = isApple
      ? `http://maps.apple.com/?ll=${game.lat},${game.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${game.lat},${game.lng}`;

    window.open(url, '_blank');
  };

  const handleAddToCalendar = () => {
    const icsContent = buildIcs({
      title: game.course_name || 'Golf Round',
      start: game.start_time,
      durationHours: 3,
    });
    downloadIcs(icsContent);
    toast.success('Calendar event created');
  };

  const handleShareMeetingPoint = () => {
    const message = `📍 Meet at Clubhouse`;
    onInsertMessage(message);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDirections}
        className="flex-1 gap-2"
      >
        <MapPin className="w-4 h-4" />
        Directions
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddToCalendar}
        className="flex-1 gap-2"
      >
        <Calendar className="w-4 h-4" />
        Add to Cal
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShareMeetingPoint}
        className="flex-1 gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Meeting Pt
      </Button>
    </div>
  );
}
