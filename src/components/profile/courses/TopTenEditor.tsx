import React, { useState } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUserTopTenCourses, TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { Button } from '@/components/ui/button';
import { AddCourseModal } from './AddCourseModal';
import { useNavigate } from 'react-router-dom';

interface TopTenEditorProps {
  userId: string;
  isOwnProfile: boolean;
}

interface SortableItemProps {
  course: TopTenCourse;
  isEditable: boolean;
  onRemove: () => void;
  onTap: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ course, isEditable, onRemove, onTap }) => {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex items-center gap-4 hover:bg-card/70 transition-colors"
    >
      {isEditable && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      <div className="flex-shrink-0 w-8 text-center">
        <div className="text-2xl font-bold text-primary">{course.position}</div>
      </div>

      <div
        onClick={onTap}
        className="flex-1 flex items-center gap-4 cursor-pointer min-w-0"
      >
        {course.thumbnail_image && (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{course.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {course.sub_country || course.country}
          </div>
        </div>
      </div>

      {isEditable && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const TopTenEditor: React.FC<TopTenEditorProps> = ({ userId, isOwnProfile }) => {
  const navigate = useNavigate();
  const { topTen, isLoading, removeCourse, reorderTopTen } = useUserTopTenCourses(userId);
  const [showAddModal, setShowAddModal] = useState(false);

  // Build a full 10-slot grid — empty slots show as placeholders
  const slots = Array.from({ length: 10 }, (_, i) => {
    const position = i + 1;
    const course = topTen.find(c => c.position === position);
    return { position, course: course ?? null };
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = topTen.findIndex(c => c.id === active.id);
    const newIndex = topTen.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...topTen];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update positions
    const updates = reordered.map((course, idx) => ({
      course_id: course.course_id,
      position: idx + 1,
      is_pinned: course.is_pinned || (course.position !== idx + 1),
    }));

    reorderTopTen(updates);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading Top 10...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">
            {isOwnProfile ? 'My Top 10 Courses' : 'Top 10 Courses'}
          </h2>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground mt-1">
              Your personal all-time favourites. Drag to reorder.
            </p>
          )}
        </div>
        {isOwnProfile && topTen.length < 10 && (
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        )}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={slots.map(s => s.course?.id ?? `empty-${s.position}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {slots.map(({ position, course }) =>
              course ? (
                <SortableItem
                  key={course.id}
                  course={course}
                  isEditable={isOwnProfile}
                  onRemove={() => removeCourse(course.course_id)}
                  onTap={() => handleCourseClick(course.course_id)}
                />
              ) : (
                <div
                  key={`empty-${position}`}
                  className="border border-dashed border-border/40 rounded-xl p-4 flex items-center gap-4"
                  style={{ opacity: 0.5 }}
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{position}</div>
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground italic">
                    Empty — tap + to add a course
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex-shrink-0 w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {isOwnProfile && showAddModal && (
        <AddCourseModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          existingCourseIds={topTen.map(c => c.course_id)}
        />
      )}
    </div>
  );
};
