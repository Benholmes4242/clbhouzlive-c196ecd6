/**
 * AddCourseModal - Bottom sheet for adding courses to Top 10
 * 
 * Features:
 * - Proper bottom sheet with rounded corners, drag handle, slide-up animation
 * - Fixed search: searches user's played courses directly (not all courses)
 * - Two-path flow:
 *   A) Rated courses → Add immediately
 *   B) Unrated courses → Prompt to rate first
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Star, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface AddCourseModalProps {
  userId: string;
  onClose: () => void;
  existingCourseIds: string[];
  /** Optional course ID to highlight at the top of the Add tab */
  preSelectedCourseId?: string;
}

interface CourseWithRating {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  thumbnail_image?: string;
  rating_value: number | null;
  has_rating: boolean;
}

// Position badge colors - Chartreus gold for #1
const getPositionBadgeStyle = (position: number): { bg: string; text: string; shadow?: string } => {
  switch (position) {
    case 1:
      // Gold - Chartreus
      return { 
        bg: '#C1A84C', 
        text: '#FFFFFF',
        shadow: '0 2px 8px rgba(193, 168, 76, 0.4)'
      };
    case 2:
      // Silver
      return { 
        bg: 'linear-gradient(145deg, #94A3B8 0%, #64748B 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(100, 116, 139, 0.35)'
      };
    case 3:
      // Bronze
      return { 
        bg: 'linear-gradient(145deg, #D97706 0%, #B45309 100%)', 
        text: '#FFFFFF',
        shadow: '0 2px 6px rgba(217, 119, 6, 0.35)'
      };
    default:
      // Slate grey
      return { 
        bg: '#F1F5F9', 
        text: '#475569',
        shadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
      };
  }
};

// Sortable list item component
interface SortableItemProps {
  course: any;
  index: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (courseId: string) => void;
  isRemoving: boolean;
  isReordering: boolean;
  totalItems: number;
}

const SortableManageItem: React.FC<SortableItemProps> = ({
  course,
  index,
  onMoveUp,
  onMoveDown,
  onRemove,
  isRemoving,
  isReordering,
  totalItems,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.course_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const position = index + 1;
  const badgeStyle = getPositionBadgeStyle(position);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card rounded-xl border border-border/30 ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <div 
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground/50" />
      </div>

      {/* Thumbnail with rank badge overlay */}
      <div className="relative flex-shrink-0">
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            loading="lazy"
            decoding="async"
            className="w-14 h-14 object-cover rounded-[10px]"
          />
        ) : (
          <div className="w-14 h-14 rounded-[10px] bg-muted flex items-center justify-center">
            <Trophy className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
        {/* Rank badge - overlapping top-left */}
        <div 
          className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-card"
          style={{
            background: badgeStyle.bg,
            boxShadow: badgeStyle.shadow,
          }}
        >
          <span 
            className="text-[10px] font-bold leading-none"
            style={{ color: badgeStyle.text }}
          >
            {position}
          </span>
        </div>
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate text-sm text-foreground">{course.name}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {course.sub_country || course.country}
        </div>
        {course.rating != null && (
          <div className="flex items-center mt-0.5">
            <span className="text-xs text-foreground font-medium">
              {typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating}
            </span>
          </div>
        )}
      </div>

      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0 || isReordering}
          className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.95]"
          aria-label="Move up"
        >
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === totalItems - 1 || isReordering}
          className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.95]"
          aria-label="Move down"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(course.course_id)}
        disabled={isRemoving}
        className="min-h-[44px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50 active:scale-[0.95]"
        aria-label="Remove from Top 10"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  userId,
  onClose,
  existingCourseIds,
  preSelectedCourseId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>(preSelectedCourseId ? 'add' : 'manage');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: userActivity = [] } = useUserCourseActivity(userId);
  const { addCourse, removeCourse, reorderTopTen, topTen, isRemoving, isReordering } = useUserTopTenCourses(userId);

  // Check if pre-selected course is already in Top 10
  const isPreSelectedInTop10 = preSelectedCourseId ? existingCourseIds.includes(preSelectedCourseId) : false;

  // Fetch pre-selected course details if provided
  const { data: preSelectedCourse } = useQuery({
    queryKey: ['course', preSelectedCourseId],
    queryFn: async () => {
      if (!preSelectedCourseId) return null;
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .eq('id', preSelectedCourseId)
        .single();
      return data;
    },
    enabled: !!preSelectedCourseId && !isPreSelectedInTop10,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = topTen.findIndex((c) => c.course_id === active.id);
      const newIndex = topTen.findIndex((c) => c.course_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(topTen, oldIndex, newIndex);
        reorderTopTen(newOrder.map((c, i) => ({
          course_id: c.course_id,
          position: i + 1,
          is_pinned: c.is_pinned || (c.position !== i + 1),
        })));
      }
    }
  }, [topTen, reorderTopTen]);

  // Get all played course IDs (not already in Top 10)
  const playedCourseIds = useMemo(() => {
    return userActivity
      .filter(a => !existingCourseIds.includes(a.course_id))
      .map(a => a.course_id);
  }, [userActivity, existingCourseIds]);

  // Fetch course details for ALL played courses
  const { data: playedCourses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-for-top10', userId, playedCourseIds],
    enabled: playedCourseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', playedCourseIds);

      if (error) throw error;

      // Merge with activity data to get ratings
      return (data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          rating_value: activity?.rating_value ?? null,
          has_rating: activity?.has_rating ?? false,
        } as CourseWithRating;
      });
    },
    staleTime: 60_000,
  });

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return playedCourses;
    
    const query = searchQuery.toLowerCase().trim();
    return playedCourses.filter(course => 
      course.name.toLowerCase().includes(query) ||
      course.country?.toLowerCase().includes(query) ||
      course.sub_country?.toLowerCase().includes(query)
    );
  }, [playedCourses, searchQuery]);

  // Separate rated and unrated courses
  const ratedCourses = useMemo(() => 
    filteredCourses.filter(c => c.has_rating).sort((a, b) => 
      (b.rating_value || 0) - (a.rating_value || 0)
    ), [filteredCourses]);
  
  const unratedCourses = useMemo(() => 
    filteredCourses.filter(c => !c.has_rating), [filteredCourses]);

  const handleAddCourse = (courseId: string) => {
    if (topTen.length >= 10) {
      toast.error('Top 10 is full', { description: 'Remove a course to add another' });
      return;
    }

    addCourse(courseId);
    toast.success('Course added');
  };

  const handleRateFirst = (courseId: string) => {
    onClose();
    navigate(`/courses/${courseId}?action=rate`);
  };

  const handleRemoveCourse = (courseId: string) => {
    const course = topTen.find(c => c.course_id === courseId);
    removeCourse(courseId);
    toast.success('Course removed', { description: course?.is_pinned ? 'Removed from your Top 10' : 'Course excluded from auto-population' });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...topTen];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderTopTen(newOrder.map((c, i) => ({
      course_id: c.course_id,
      position: i + 1,
      is_pinned: c.is_pinned || (c.position !== i + 1),
    })));
  };

  const handleMoveDown = (index: number) => {
    if (index === topTen.length - 1) return;
    const newOrder = [...topTen];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderTopTen(newOrder.map((c, i) => ({
      course_id: c.course_id,
      position: i + 1,
      is_pinned: c.is_pinned || (c.position !== i + 1),
    })));
  };

  const handleResetToAutoSort = async () => {
    if (!userId) return;
    setIsResetting(true);
    try {
      await supabase.from('user_top_ten_courses').delete().eq('user_id', userId);
      await supabase.from('user_top10_exclusions').delete().eq('user_id', userId);
      
      await queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'], refetchType: 'all' });
      
      toast.success('Reset complete', { description: 'Your Top 10 now shows your highest-rated courses' });
      setShowResetConfirm(false);
      onClose();
    } catch (err) {
      toast.error('Error', { description: 'Failed to reset. Please try again.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      zIndexBase={1400}
      ariaLabelledBy="add-course-title"
      className="max-h-[85vh]"
    >
      {/* Header with close button */}
      <div className="flex justify-between px-5 pb-3">
        <div>
          <h2 id="add-course-title" className="text-lg font-semibold text-foreground">
            Your Personal Top 10
          </h2>
          <p className="text-sm text-muted-foreground">The very best you've played</p>
        </div>
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-full transition-colors active:scale-[0.95]"
          style={{ backgroundColor: '#F5F5F7' }}
          aria-label="Close"
        >
          <X className="w-4 h-4" style={{ color: '#7A7A7A' }} />
        </button>
      </div>

      {/* Tab Toggle - Hub Style */}
      <div className="px-5 pb-4">
        <div 
          className="inline-flex items-center gap-1 p-1 w-full"
        >
          <button
            onClick={() => setActiveTab('manage')}
            className={cn(
              "flex-1 px-4 py-1.5 text-sm rounded-lg transition-all duration-150 active:scale-[0.98]",
              activeTab === 'manage'
                ? "bg-foreground text-background font-semibold shadow-sm"
                : "text-muted-foreground font-medium hover:text-foreground"
            )}
          >
            Manage ({topTen.length}/10)
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 px-4 py-1.5 text-sm rounded-lg transition-all duration-150 active:scale-[0.98]",
              activeTab === 'add'
                ? "bg-foreground text-background font-semibold shadow-sm"
                : "text-muted-foreground font-medium hover:text-foreground"
            )}
          >
            Add Course
          </button>
        </div>
      </div>

      {/* Search input - only show in add tab */}
      {activeTab === 'add' && (
        <div className="px-5 pb-4">
        <div className="relative">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
              style={{ color: searchQuery ? '#f59e0b' : '#AEAEB2' }}
            />
            <input
              ref={searchInputRef}
              placeholder="Search your played courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 text-sm outline-none transition-all"
              style={{
                height: 44,
                borderRadius: 12,
                backgroundColor: '#F5F5F7',
                border: '1.5px solid rgba(0,0,0,0.07)',
                color: '#1A1A1A',
                caretColor: '#f59e0b',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.10)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-28" style={{ maxHeight: 'calc(85vh - 180px)' }}>
        {activeTab === 'manage' ? (
          /* Manage existing Top 10 */
          topTen.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your Top 10 is empty.</p>
              <p className="text-sm mt-1">Switch to "Add Course" to get started.</p>
            </div>
          ) : (
            <>
              {/* Reset button - only show if at least 1 course is pinned */}
              {topTen.some(c => c.is_pinned) && (
                showResetConfirm ? (
                  <div className="mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <p className="text-sm text-foreground mb-3">
                      Reset to highest rated? Your custom order will be replaced with your top-rated courses.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetToAutoSort}
                        disabled={isResetting}
                        className="flex-1 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isResetting ? 'Resetting...' : 'Reset'}
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-2 text-sm font-medium rounded-lg border border-border text-foreground min-h-[44px] active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full mb-3 py-2.5 text-sm font-medium rounded-xl border border-amber-500/30 text-amber-600 hover:bg-amber-500/5 transition-colors flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Sort by highest rated
                  </button>
                )
              )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={topTen.map(c => c.course_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {topTen.map((course, index) => (
                    <SortableManageItem
                      key={course.course_id}
                      course={course}
                      index={index}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onRemove={handleRemoveCourse}
                      isRemoving={isRemoving}
                      isReordering={isReordering}
                      totalItems={topTen.length}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            </>
          )
        ) : (
          /* Add courses tab */
          isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading your courses...
            </div>
          ) : filteredCourses.length === 0 && !preSelectedCourse ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'No matching courses found in your played courses'
                : playedCourses.length === 0
                  ? "You haven't played any courses yet. Play and rate courses to add them to your Top 10."
                  : 'Start typing to search your played courses'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pre-selected course highlight (from Review Wizard) */}
              {preSelectedCourse && !isPreSelectedInTop10 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">Course you're reviewing:</p>
                  <div className="flex items-center gap-3">
                    {preSelectedCourse.thumbnail_image && (
                      <img
                        src={preSelectedCourse.thumbnail_image}
                        alt={preSelectedCourse.name}
                        loading="lazy"
                        decoding="async"
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm text-foreground">{preSelectedCourse.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {preSelectedCourse.sub_country || preSelectedCourse.country}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddCourse(preSelectedCourse.id)}
                      className="flex-shrink-0 gap-1.5 active:scale-[0.95]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Rated courses section */}
              {ratedCourses.length > 0 && (
                <div>
                  <h3 
                    className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-3"
                    style={{ color: '#AEAEB2' }}
                  >
                    Your rated courses
                  </h3>
                  <div className="space-y-2">
                    {ratedCourses
                      .filter(c => c.id !== preSelectedCourseId) // Don't show pre-selected again
                      .map((course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        onAction={() => handleAddCourse(course.id)}
                        actionLabel="Add to Top 10"
                        actionIcon={<Plus className="w-4 h-4" />}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unrated courses section */}
              {unratedCourses.length > 0 && (
                <div>
                  <h3 
                    className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-3"
                    style={{ color: '#AEAEB2' }}
                  >
                    Rate to add
                  </h3>
                  <div className="space-y-2">
                    {unratedCourses.map((course) => (
                      <CourseRow
                        key={course.id}
                        course={course}
                        onAction={() => handleRateFirst(course.id)}
                        actionLabel="Rate first"
                        actionIcon={<Star className="w-4 h-4" />}
                        isSecondary
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </BottomSheet>
  );
};

// Course row component
interface CourseRowProps {
  course: CourseWithRating;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  isSecondary?: boolean;
}

const CourseRow: React.FC<CourseRowProps> = ({
  course,
  onAction,
  actionLabel,
  actionIcon,
  isSecondary = false,
}) => (
  <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/30">
    {course.thumbnail_image && (
      <img
        src={course.thumbnail_image}
        alt={course.name}
        loading="lazy"
        decoding="async"
        className="w-14 h-14 object-cover rounded-[10px] flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="font-semibold truncate text-sm text-foreground">{course.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {course.sub_country || course.country}
      </div>
      {course.has_rating && course.rating_value && (
        <div className="flex items-center mt-0.5">
          <span className="text-xs text-foreground font-medium">
            {course.rating_value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
    <button
      onClick={onAction}
      className="flex-shrink-0 flex items-center justify-center active:scale-[0.95] transition-transform"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        padding: 0,
        border: '1.5px solid',
        ...(isSecondary 
          ? { borderColor: 'rgba(0,0,0,0.12)', backgroundColor: 'transparent', color: 'inherit' }
          : { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }
        ),
      }}
      aria-label={actionLabel}
    >
      {actionIcon}
    </button>
  </div>
);