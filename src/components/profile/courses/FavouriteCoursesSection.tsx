import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Plus, Settings2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUserTopTenCourses, TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { Button } from '@/components/ui/button';
import { AddCourseModal } from './AddCourseModal';

interface FavouriteCoursesSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

interface SortableFavouriteItemProps {
  course: TopTenCourse;
  isEditable: boolean;
  onTap: () => void;
}

const SortableFavouriteItem: React.FC<SortableFavouriteItemProps> = ({ 
  course, 
  isEditable, 
  onTap,
}) => {
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  
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
      className="bg-white border border-slate-100 rounded-sq-sm p-3 flex items-center gap-3 hover:border-slate-200 transition-colors"
    >
      {isEditable && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 flex-shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-600">{course.position}</span>
      </div>

      {course.thumbnail_image && (
        <img
          src={course.thumbnail_image}
          alt={course.name}
          onClick={onTap}
          className="w-12 h-12 object-cover rounded-sq-xs flex-shrink-0 cursor-pointer"
        />
      )}

      <div onClick={onTap} className="flex-1 min-w-0 cursor-pointer">
        <div className="font-medium text-sm text-slate-900 truncate">{course.name}</div>
        <div className="text-xs text-slate-500 truncate">
          {course.sub_country || course.country}
        </div>
        {isTop100 && (
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
            Top 100 Course
          </div>
        )}
      </div>
    </div>
  );
};

export const FavouriteCoursesSection: React.FC<FavouriteCoursesSectionProps> = ({ 
  userId, 
  isOwnProfile 
}) => {
  const navigate = useNavigate();
  const { topTen, isLoading, reorderTopTen } = useUserTopTenCourses(userId);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = topTen.findIndex(c => c.id === active.id);
    const newIndex = topTen.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...topTen];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((course, idx) => ({
      course_id: course.course_id,
      position: idx + 1,
    }));

    reorderTopTen(updates);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-50 rounded-sq-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Favourite Courses</h3>
          {isOwnProfile && (
            <p className="text-xs text-slate-500 mt-0.5">
              Your personal all-time favourites. Drag to reorder.
            </p>
          )}
        </div>
        {isOwnProfile && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Manage
          </button>
        )}
      </div>

      {topTen.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-sq-md p-8 text-center">
          <p className="font-medium text-slate-700 mb-1">
            {isOwnProfile ? "You haven't picked your Top 10 yet." : "No favourites added yet."}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Choose your favourite courses to build your all-time list.
          </p>
          {isOwnProfile && (
            <Button onClick={() => setShowAddModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Build your Top 10
            </Button>
          )}
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={topTen.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {topTen.map((course) => (
                <SortableFavouriteItem
                  key={course.id}
                  course={course}
                  isEditable={isOwnProfile}
                  onTap={() => handleCourseClick(course.course_id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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