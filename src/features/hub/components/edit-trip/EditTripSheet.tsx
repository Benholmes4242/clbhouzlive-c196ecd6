/**
 * EditTripSheet - Sheet for editing trip details with drag-drop courses
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, GripVertical, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTrip } from '@/features/hub/hooks/useUpdateTrip';
import { ChooseGolfClubSheetV2 } from '@/features/hub/components/create-game-trip-v2/ChooseGolfClubSheetV2';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TripCourse {
  id: string;
  courseId: string;
  courseName: string;
  dayNumber: number;
}

type TripVisibility = 'invite' | 'friends' | 'club';

interface EditTripSheetProps {
  open: boolean;
  onClose: () => void;
  trip: {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    visibility: string;
  };
  courses: TripCourse[];
  onSuccess?: () => void;
}

const VISIBILITY_OPTIONS: { value: TripVisibility; label: string }[] = [
  { value: 'invite', label: 'Invite Only' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Club Only' },
];

export function EditTripSheet({ open, onClose, trip, courses: initialCourses, onSuccess }: EditTripSheetProps) {
  // Form state
  const [name, setName] = useState(trip.name);
  const [description, setDescription] = useState(trip.description || '');
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [visibility, setVisibility] = useState<TripVisibility>((trip.visibility || 'invite') as TripVisibility);
  const [courses, setCourses] = useState<TripCourse[]>(initialCourses);
  
  // Sub-sheet state
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation
  const { mutate: updateTrip, isPending } = useUpdateTrip();

  // Reset form when trip changes
  useEffect(() => {
    if (trip && open) {
      setName(trip.name);
      setDescription(trip.description || '');
      setStartDate(trip.start_date);
      setEndDate(trip.end_date);
      setVisibility((trip.visibility || 'invite') as TripVisibility);
      setCourses(initialCourses);
    }
  }, [trip, initialCourses, open]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCourses((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update day numbers
        return reordered.map((item, index) => ({
          ...item,
          dayNumber: index + 1,
        }));
      });
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    setCourses((prev) => {
      const filtered = prev.filter((c) => c.id !== courseId);
      // Recalculate day numbers
      return filtered.map((item, index) => ({
        ...item,
        dayNumber: index + 1,
      }));
    });
  };

  const handleAddCourse = (course: { id: string; name: string }) => {
    const newCourse: TripCourse = {
      id: `temp-${Date.now()}`,
      courseId: course.id,
      courseName: course.name,
      dayNumber: courses.length + 1,
    };
    setCourses((prev) => [...prev, newCourse]);
    setCoursePickerOpen(false);
  };

  const handleSave = () => {
    updateTrip(
      {
        tripId: trip.id,
        updates: {
          name,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
          visibility,
        },
        courseUpdates: courses,
      },
      {
        onSuccess: () => {
          toast.success('Trip updated');
          onSuccess?.();
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to update trip', {
            description: error.message,
          });
        },
      }
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
          <SheetHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
            <SheetTitle>Edit Trip</SheetTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>

          <div className="overflow-y-auto p-4 space-y-6 pb-32">
            {/* Trip Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Trip Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Portugal Golf Break"
                className="w-full p-4 bg-card rounded-xl border border-border text-foreground"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                  Start Date
                </label>
                <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-transparent text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                  End Date
                </label>
                <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="flex-1 bg-transparent text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Who can see this trip
              </label>
              <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVisibility(option.value)}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium text-sm transition-colors border',
                      visibility === option.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card border-border text-muted-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Description (optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell your group about this trip..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Courses / Rounds */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Rounds
                </label>
                <button
                  onClick={() => setCoursePickerOpen(true)}
                  className="text-sm text-primary font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add round
                </button>
              </div>

              {courses.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={courses.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {courses.map((course) => (
                        <SortableCourseItem
                          key={course.id}
                          course={course}
                          onRemove={() => handleRemoveCourse(course.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-xl border-2 border-dashed border-border">
                  <p className="text-sm text-muted-foreground">No rounds added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border pb-safe">
            <Button
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              className="w-full h-12 rounded-xl"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Course Picker */}
      <ChooseGolfClubSheetV2
        isOpen={coursePickerOpen}
        onClose={() => setCoursePickerOpen(false)}
        onSelect={handleAddCourse}
      />
    </>
  );
}

// Sortable Course Item Component
function SortableCourseItem({ 
  course, 
  onRemove 
}: { 
  course: TripCourse; 
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-card rounded-xl border border-border',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
        <span className="text-green-700 dark:text-green-400 font-medium text-xs">
          D{course.dayNumber}
        </span>
      </div>
      
      <span className="flex-1 font-medium truncate">{course.courseName}</span>
      
      <button
        onClick={onRemove}
        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
