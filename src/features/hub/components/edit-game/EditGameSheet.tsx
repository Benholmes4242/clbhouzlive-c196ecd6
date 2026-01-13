/**
 * EditGameSheet - Sheet for editing game details
 */

import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateGame } from '@/features/hub/hooks/useUpdateGame';
import { ChooseGolfClubSheetV2 } from '@/features/hub/components/create-game-trip-v2/ChooseGolfClubSheetV2';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type GameVisibility = 'public' | 'friends' | 'club' | 'private';

interface EditGameSheetProps {
  open: boolean;
  onClose: () => void;
  game: {
    id: string;
    course_id: string | null;
    course_name: string;
    start_time: string;
    visibility: string;
    note: string | null;
    slots_total: number;
    host_user_id: string;
  };
  onSuccess?: () => void;
}

const VISIBILITY_OPTIONS: { value: GameVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club' },
  { value: 'private', label: 'Private' },
];

export function EditGameSheet({ open, onClose, game, onSuccess }: EditGameSheetProps) {
  // Form state - initialized from game prop
  const [courseId, setCourseId] = useState<string | null>(game.course_id);
  const [courseName, setCourseName] = useState(game.course_name);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(game.start_time));
  const [selectedTime, setSelectedTime] = useState(format(new Date(game.start_time), 'HH:mm'));
  const [visibility, setVisibility] = useState<GameVisibility>((game.visibility || 'private') as GameVisibility);
  const [notes, setNotes] = useState(game.note || '');
  const [holes, setHoles] = useState<9 | 18>(18);
  
  // Sub-sheet state
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  
  // Mutation
  const { mutate: updateGame, isPending } = useUpdateGame();

  // Reset form when game changes
  useEffect(() => {
    if (game && open) {
      setCourseId(game.course_id);
      setCourseName(game.course_name);
      setSelectedDate(new Date(game.start_time));
      setSelectedTime(format(new Date(game.start_time), 'HH:mm'));
      setVisibility((game.visibility || 'private') as GameVisibility);
      setNotes(game.note || '');
    }
  }, [game, open]);

  const handleCourseSelect = (course: { id: string; name: string }) => {
    setCourseId(course.id);
    setCourseName(course.name);
    setCoursePickerOpen(false);
  };

  const handleSave = () => {
    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    updateGame(
      {
        gameId: game.id,
        updates: {
          course_id: courseId,
          course_name: courseName,
          start_time: startTime.toISOString(),
          visibility,
          note: notes || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Game updated');
          onSuccess?.();
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to update game', {
            description: error.message,
          });
        },
      }
    );
  };

  const hasChanges = 
    courseId !== game.course_id ||
    courseName !== game.course_name ||
    selectedDate.toDateString() !== new Date(game.start_time).toDateString() ||
    selectedTime !== format(new Date(game.start_time), 'HH:mm') ||
    visibility !== game.visibility ||
    notes !== (game.note || '');

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
          <SheetHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
            <SheetTitle>Edit Game</SheetTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>

          <div className="overflow-y-auto p-4 space-y-6 pb-32">
            {/* Course Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Golf Course
              </label>
              <button
                onClick={() => setCoursePickerOpen(true)}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border text-left hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{courseName || 'Select a course'}</p>
                  <p className="text-sm text-muted-foreground">Tap to change</p>
                </div>
              </button>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Date
              </label>
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="flex-1 bg-transparent text-foreground"
                />
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Tee Time
              </label>
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="flex-1 bg-transparent text-foreground"
                />
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                <Globe className="w-3.5 h-3.5 inline mr-1" />
                Who can see this game
              </label>
              <div className="flex flex-wrap gap-2">
                {VISIBILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVisibility(option.value)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                      visibility === option.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Holes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Holes
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setHoles(9)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium text-sm transition-colors border',
                    holes === 9
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border text-muted-foreground'
                  )}
                >
                  9 holes
                </button>
                <button
                  onClick={() => setHoles(18)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium text-sm transition-colors border',
                    holes === 18
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border text-muted-foreground'
                  )}
                >
                  18 holes
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Note to players (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any details for your group..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border pb-safe">
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="w-full h-12 rounded-xl"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            {!hasChanges && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                No changes to save
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Course Picker Sub-sheet */}
      <ChooseGolfClubSheetV2
        isOpen={coursePickerOpen}
        onClose={() => setCoursePickerOpen(false)}
        onSelect={handleCourseSelect}
      />
    </>
  );
}
